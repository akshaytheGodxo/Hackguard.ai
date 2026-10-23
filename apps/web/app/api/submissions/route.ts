
import { NextResponse } from "next/server";
import { getSession } from "@/lib/auth/session";
import { prisma } from "@/lib/prisma";

const SUPPORTED_LANGUAGES = [
  "cpp",
  "python",
  "java",
  "javascript",
];

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

    // Find the problem and determine its hackathon type.
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
      // Standard hackathons require registration.
      if (typeof registrationId !== "string") {
        return NextResponse.json(
          { error: "Registration is required for this hackathon" },
          { status: 400 }
        );
      }

      const registration = await prisma.registration.findFirst({
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
            { error: "Team member is not part of this registration" },
            { status: 403 }
          );
        }
      }
    } else {
      // Live hackathons allow direct participation.
      // Do not accept a registration or team member ID here.
      if (
        registrationId != null ||
        submittedByMemberId != null
      ) {
        return NextResponse.json(
          {
            error:
              "Live hackathons do not use registration or team member IDs",
          },
          { status: 400 }
        );
      }
    }

    const submission = await prisma.submission.create({
      data: {
        sourceCode,
        language,
        participantId: session.userId,
        problemId: problem.problemId,
        registrationId: verifiedRegistrationId,
      },
      select: {
        id: true,
        problemId: true,
        language: true,
        submittedAt: true,
      },
    });

    return NextResponse.json(
      {
        message: "Submission saved successfully",
        submission,
      },
      { status: 201 }
    );
  } catch (error) {
    console.error("Submission API error:", error);

    return NextResponse.json(
      { error: "Failed to process submission" },
      { status: 500 }
    );
  }
}
