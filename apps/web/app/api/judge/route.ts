import { NextResponse } from "next/server";
import { getSession } from "@/lib/auth/session";
import { prisma } from "@/lib/prisma";

export const runtime = "nodejs";
export const maxDuration = 60;

const LANGUAGE_IDS: Record<string, number> = {
  cpp: 54,
  python: 71,
  java: 62,
  javascript: 63,
  go: 60,
  rust: 73,
};

const MAX_CODE_LENGTH = 100_000;
const MAX_TEST_CASES = 20;

type JudgeResult = {
  status: { id: number; description: string };
  stdout: string | null;
  stderr: string | null;
  compile_output: string | null;
  time: string | null;
  memory: number | null;
};

const sleep = (ms: number) =>
  new Promise((resolve) => setTimeout(resolve, ms));

async function judgeOneCase(args: {
  sourceCode: string;
  languageId: number;
  input: string;
  expectedOutput: string;
}): Promise<JudgeResult> {
  const baseUrl = (
    process.env.JUDGE0_URL ?? "https://ce.judge0.com"
  ).replace(/\/+$/, "");

  const apiKey = process.env.JUDGE0_API_KEY;

  const headers: Record<string, string> = {
    "Content-Type": "application/json",
  };

  if (apiKey) {
    headers["X-Auth-Token"] = apiKey;
  }

  // Create a sandboxed execution.
  const createResponse = await fetch(
    `${baseUrl}/submissions?base64_encoded=false&wait=false`,
    {
      method: "POST",
      headers,
      body: JSON.stringify({
        source_code: args.sourceCode,
        language_id: args.languageId,
        stdin: args.input,
        expected_output: args.expectedOutput,
        cpu_time_limit: 2,
        wall_time_limit: 5,
        memory_limit: 128000,
      }),
      cache: "no-store",
      signal: AbortSignal.timeout(10_000),
    }
  );

  if (!createResponse.ok) {
    throw new Error(
      `Judge0 submission creation failed: HTTP ${createResponse.status}`
    );
  }

  const created = await createResponse.json();

  if (typeof created.token !== "string") {
    throw new Error("Judge0 did not return an execution token");
  }

  // Poll until the execution finishes.
  for (let attempt = 0; attempt < 40; attempt++) {
    await sleep(500);

    const resultResponse = await fetch(
      `${baseUrl}/submissions/${encodeURIComponent(created.token)}?base64_encoded=false&fields=status,stdout,stderr,compile_output,time,memory`,
      {
        headers,
        cache: "no-store",
        signal: AbortSignal.timeout(10_000),
      }
    );

    if (!resultResponse.ok) {
      throw new Error(
        `Judge0 polling failed: HTTP ${resultResponse.status}`
      );
    }

    const result = (await resultResponse.json()) as JudgeResult;

    // Status 1 = In Queue, 2 = Processing.
    if (
      result.status?.id !== 1 &&
      result.status?.id !== 2
    ) {
      return result;
    }
  }

  return {
    status: {
      id: 0,
      description: "Judging Timed Out",
    },
    stdout: null,
    stderr: null,
    compile_output: null,
    time: null,
    memory: null,
  };
}

export async function POST(request: Request) {
  try {
    const session = await getSession();

    if (!session) {
      return NextResponse.json(
        { error: "Unauthorized" },
        { status: 401 }
      );
    }

    if (session.role !== "candidate") {
      return NextResponse.json(
        { error: "Only candidates can run code" },
        { status: 403 }
      );
    }

    let body: unknown;
    try {
      body = await request.json();
    } catch {
      return NextResponse.json(
        { error: "Request body must be valid JSON" },
        { status: 400 }
      );
    }

    if (!body || typeof body !== "object" || Array.isArray(body)) {
      return NextResponse.json(
        { error: "Request body must be an object" },
        { status: 400 }
      );
    }

    const {
      problemId,
      sourceCode,
      language,
      registrationId,
    } = body as Record<string, unknown>;

    if (
      typeof problemId !== "string" ||
      typeof sourceCode !== "string" ||
      typeof language !== "string"
    ) {
      return NextResponse.json(
        { error: "Missing or invalid fields" },
        { status: 400 }
      );
    }

    if (
      sourceCode.trim().length === 0 ||
      sourceCode.length > MAX_CODE_LENGTH
    ) {
      return NextResponse.json(
        { error: "Code must contain 1–100,000 characters" },
        { status: 400 }
      );
    }

    const languageId = Object.hasOwn(LANGUAGE_IDS, language)
      ? LANGUAGE_IDS[language]
      : undefined;

    if (typeof languageId !== "number") {
      return NextResponse.json(
        { error: "Unsupported language" },
        { status: 400 }
      );
    }

    const problem = await prisma.problem.findUnique({
      where: { problemId },
      include: {
        hackathon: {
          select: {
            id: true,
            type: true,
          },
        },
        testcases: {
          select: {
            input: true,
            output: true,
          },
        },
      },
    });

    if (!problem) {
      return NextResponse.json(
        { error: "Problem not found" },
        { status: 404 }
      );
    }

    // Standard hackathons require registration.
    if (problem.hackathon.type === "standard") {
      if (typeof registrationId !== "string") {
        return NextResponse.json(
          { error: "Registration is required" },
          { status: 400 }
        );
      }

      const registration =
        await prisma.registration.findFirst({
          where: {
            id: registrationId,
            userId: session.userId,
            hackathonId: problem.hackathon.id,
          },
          select: { id: true },
        });

      if (!registration) {
        return NextResponse.json(
          { error: "Valid registration not found" },
          { status: 403 }
        );
      }
    }

    if (problem.testcases.length === 0) {
      return NextResponse.json(
        { error: "This problem has no test cases configured" },
        { status: 400 }
      );
    }

    if (problem.testcases.length > MAX_TEST_CASES) {
      return NextResponse.json(
        {
          error: `This prototype supports up to ${MAX_TEST_CASES} test cases per problem`,
        },
        { status: 400 }
      );
    }

    // Run all test cases concurrently, within the configured cap.
    const results = await Promise.all(
      problem.testcases.map(async (testCase, index) => {
        const result = await judgeOneCase({
          sourceCode,
          languageId,
          input: testCase.input,
          expectedOutput: testCase.output,
        });

        return {
          testCase: index + 1,
          verdict: result.status.description,
          passed: result.status.id === 3,
          output: result.stdout?.slice(0, 3000) ?? null,
          time: result.time,
          memory: result.memory,
          ...(result.status.id === 6
            ? {
                compileError:
                  result.compile_output?.slice(0, 3000) ?? null,
              }
            : {}),
          ...(result.status.id !== 6 && result.stderr
            ? {
                runtimeError:
                  result.stderr?.slice(0, 1000) ?? null,
              }
            : {}),
        };
      })
    );

    const allPassed = results.every((result) => result.passed);

    const verdict = allPassed
      ? "Accepted"
      : results.find((result) => !result.passed)?.verdict ??
        "Judging Failed";

    return NextResponse.json({
      problemId,
      verdict,
      passed: allPassed,
      passedCount: results.filter((result) => result.passed).length,
      totalTestCases: results.length,
      results,
    });
  } catch (error) {
    console.error("Code judging failed:", error);

    return NextResponse.json(
      { error: "Code judging service failed or timed out" },
      { status: 502 }
    );
  }
}