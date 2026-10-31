
import { NextResponse } from "next/server";
import { getSession } from "@/lib/auth/session";
import { prisma } from "@/lib/prisma";

const SUPPORTED_LANGUAGES = [
  "cpp",
  "python",
  "java",
  "javascript",
  "go",
  "rust",
];
const PLAGIARISM_LANGUAGES = ["cpp", "python", "java", "javascript"];

const ENGINE_URL =
  process.env.PLAGIARISM_ENGINE_URL ??
  "http://127.0.0.1:8000";

type AnalysisResult = {
  submission_a_id: string;
  submission_b_id: string;
  language: string;
  token_similarity: number;
  matched_ngrams: number;
  risk_level: "low" | "medium" | "high";
  warnings: string[];
};

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
        { error: "Only candidates can submit code" },
        { status: 403 }
      );
    }

    const body = await request.json();

    const {
      problemId,
      sourceCode,
      language,
      registrationId,
      submittedByMemberId,
    } = body;

    if (
      typeof problemId !== "string" ||
      typeof sourceCode !== "string" ||
      typeof language !== "string"
    ) {
      return NextResponse.json(
        { error: "Missing or invalid required fields" },
        { status: 400 }
      );
    }

    if (
      sourceCode.trim().length === 0 ||
      sourceCode.length > 100_000
    ) {
      return NextResponse.json(
        { error: "Code must contain 1–100,000 characters" },
        { status: 400 }
      );
    }

    if (!SUPPORTED_LANGUAGES.includes(language)) {
      return NextResponse.json(
        { error: "Unsupported programming language" },
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
      },
    });

    if (!problem) {
      return NextResponse.json(
        { error: "Problem not found" },
        { status: 404 }
      );
    }

    let verifiedRegistrationId: string | null = null;

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

      verifiedRegistrationId = registration.id;

      if (submittedByMemberId != null) {
        if (typeof submittedByMemberId !== "string") {
          return NextResponse.json(
            { error: "Invalid team member ID" },
            { status: 400 }
          );
        }

        const member =
          await prisma.registrationMember.findFirst({
            where: {
              id: submittedByMemberId,
              registrationId: registration.id,
            },
            select: { id: true },
          });

        if (!member) {
          return NextResponse.json(
            { error: "Invalid team member" },
            { status: 403 }
          );
        }
      }
    } else if (
      registrationId != null ||
      submittedByMemberId != null
    ) {
      return NextResponse.json(
        {
          error:
            "Live hackathons do not use registration IDs",
        },
        { status: 400 }
      );
    }

    const submission = await prisma.submission.create({
      data: {
        sourceCode,
        language,
        participantId: session.userId,
        problemId: problem.problemId,
        registrationId: verifiedRegistrationId,
        ...(submittedByMemberId
          ? { submittedByMemberId }
          : {}),
      },
      select: {
        id: true,
        problemId: true,
        language: true,
        submittedAt: true,
        participantId: true,
        registrationId: true,
        sourceCode: true,
      },
    });

    if (!PLAGIARISM_LANGUAGES.includes(submission.language)) {
      return NextResponse.json(
        {
          message: "Submission saved; plagiarism analysis is unavailable for this language",
          submission: {
            id: submission.id,
            problemId: submission.problemId,
            language: submission.language,
            submittedAt: submission.submittedAt,
          },
          analysisStatus: "unsupported_language",
          reports: [],
        },
        { status: 201 }
      );
    }

    try {
      const previousSubmissions =
        await prisma.submission.findMany({
          where: {
            problemId: submission.problemId,
            language: submission.language,
            id: { not: submission.id },
          },
          orderBy: { submittedAt: "desc" },
          take: 100,
        });

      const participantKey = (item: {
        participantId: string;
        registrationId: string | null;
      }) => item.registrationId ?? item.participantId;

      const targetParticipant = participantKey(submission);

      const candidates = previousSubmissions
        .filter(
          (candidate) =>
            participantKey(candidate) !== targetParticipant
        )
        .map((candidate) => ({
          submission_id: candidate.id,
          participant_id: participantKey(candidate),
          problem_id: candidate.problemId,
          language: candidate.language as
            | "cpp"
            | "python"
            | "java"
            | "javascript",
          source_code: candidate.sourceCode,
        }));

      if (candidates.length === 0) {
        return NextResponse.json(
          {
            message: "Submission saved successfully",
            submission: {
              id: submission.id,
              problemId: submission.problemId,
              language: submission.language,
              submittedAt: submission.submittedAt,
            },
            analysisStatus: "no_candidates",
            reports: [],
          },
          { status: 201 }
        );
      }

      const response = await fetch(
        `${ENGINE_URL.replace(/\/$/, "")}/analyze/batch`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            target: {
              submission_id: submission.id,
              participant_id: targetParticipant,
              problem_id: submission.problemId,
              language: submission.language,
              source_code: submission.sourceCode,
            },
            candidates,
          }),
          signal: AbortSignal.timeout(15_000),
          cache: "no-store",
        }
      );

      if (!response.ok) {
        throw new Error(
          `Plagiarism engine returned HTTP ${response.status}: ${
            (await response.text()).slice(0, 500)
          }`
        );
      }

      const analysis = (await response.json()) as {
        target_submission_id: string;
        results: AnalysisResult[];
      };

      if (analysis.target_submission_id !== submission.id) {
        throw new Error("Unexpected target submission ID");
      }

      const reports = await prisma.$transaction(
        analysis.results.map((result) =>
          prisma.plagiarismReport.upsert({
            where: {
              targetSubmissionId_candidateSubmissionId: {
                targetSubmissionId: result.submission_a_id,
                candidateSubmissionId: result.submission_b_id,
              },
            },
            create: {
              targetSubmissionId: result.submission_a_id,
              candidateSubmissionId: result.submission_b_id,
              tokenSimilarity: result.token_similarity,
              matchedNgrams: result.matched_ngrams,
              riskLevel: result.risk_level,
              warnings: result.warnings ?? [],
            },
            update: {
              tokenSimilarity: result.token_similarity,
              matchedNgrams: result.matched_ngrams,
              riskLevel: result.risk_level,
              warnings: result.warnings ?? [],
            },
          })
        )
      );

      return NextResponse.json(
        {
          message: "Submission saved and analyzed",
          submission: {
            id: submission.id,
            problemId: submission.problemId,
            language: submission.language,
            submittedAt: submission.submittedAt,
          },
          analysisStatus: "completed",
          reports,
        },
        { status: 201 }
      );
    } catch (analysisError) {
      console.error(
        "Plagiarism analysis failed:",
        analysisError
      );

      return NextResponse.json(
        {
          message: "Submission saved; analysis failed",
          submission: {
            id: submission.id,
            problemId: submission.problemId,
            language: submission.language,
            submittedAt: submission.submittedAt,
          },
          analysisStatus: "failed",
          reports: [],
        },
        { status: 201 }
      );
    }
  } catch (error) {
    console.error("Submission API error:", error);

    return NextResponse.json(
      { error: "Failed to process submission" },
      { status: 500 }
    );
  }
}
