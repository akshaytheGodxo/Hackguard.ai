import { NextResponse } from "next/server"
import { getSession } from "@/lib/auth/session"
import { prisma } from "@/lib/prisma"

const MAX_URL_LENGTH = 2_048
const MAX_TEAM_NAME_LENGTH = 100

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value)
}

function isText(value: unknown, maxLength: number): value is string {
  return (
    typeof value === "string" &&
    value.trim().length > 0 &&
    value.length <= maxLength &&
    !/[\u0000-\u001f\u007f]/.test(value)
  )
}

function isGitHubRepository(value: string): boolean {
  try {
    const url = new URL(value)
    return (
      url.protocol === "https:" &&
      url.hostname === "github.com" &&
      /^\/[^/]+\/[^/]+\/?$/.test(url.pathname) &&
      !url.search &&
      !url.hash
    )
  } catch {
    return false
  }
}

export async function POST(request: Request) {
  try {
    const session = await getSession()
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }
    if (session.role !== "candidate") {
      return NextResponse.json(
        { error: "Only candidates can submit projects" },
        { status: 403 },
      )
    }

    let body: unknown
    try {
      body = await request.json()
    } catch {
      return NextResponse.json(
        { error: "Request body must be valid JSON" },
        { status: 400 },
      )
    }
    if (!isRecord(body)) {
      return NextResponse.json(
        { error: "Request body must be an object" },
        { status: 400 },
      )
    }

    const { hackathonId, registrationId, projectZipUrl, githubRepoUrl, teamName } = body
    if (
      !isText(hackathonId, 100) ||
      !isText(registrationId, 100) ||
      !isText(projectZipUrl, MAX_URL_LENGTH) ||
      !isText(githubRepoUrl, MAX_URL_LENGTH) ||
      !isText(teamName, MAX_TEAM_NAME_LENGTH)
    ) {
      return NextResponse.json(
        { error: "Provide a team name, ZIP URL or storage key, and GitHub repository URL." },
        { status: 400 },
      )
    }
    if (!isGitHubRepository(githubRepoUrl)) {
      return NextResponse.json(
        { error: "Enter a valid GitHub repository URL." },
        { status: 400 },
      )
    }

    const registration = await prisma.registration.findFirst({
      where: {
        id: registrationId,
        hackathonId,
        userId: session.userId,
      },
      include: {
        hackathon: { select: { type: true } },
        members: {
          where: { isLeader: true },
          select: { email: true },
          take: 1,
        },
      },
    })

    if (!registration) {
      return NextResponse.json(
        { error: "A valid team registration is required." },
        { status: 403 },
      )
    }
    if (registration.hackathon.type !== "standard") {
      return NextResponse.json(
        { error: "Project submissions are only available for standard hackathons." },
        { status: 400 },
      )
    }

    const teamLeaderEmail = registration.members[0]?.email
    if (!teamLeaderEmail) {
      return NextResponse.json(
        { error: "Your team needs a registered team leader before submitting." },
        { status: 400 },
      )
    }

    const projectSubmission = await prisma.$transaction(async (transaction) => {
      await transaction.registration.update({
        where: { id: registration.id },
        data: { teamName: teamName.trim() },
      })

      const submission = await transaction.projectSubmission.create({
        data: {
          projectZipUrl: projectZipUrl.trim(),
          githubRepoUrl: githubRepoUrl.trim(),
          teamLeaderEmail,
          teamName: teamName.trim(),
          hackathonId,
          registrationId: registration.id,
        },
        select: { id: true, submittedAt: true },
      })

      await transaction.hackathon.update({
        where: { id: hackathonId },
        data: { submissions: { increment: 1 } },
      })

      return submission
    })

    return NextResponse.json(
      { message: "Project submitted successfully.", submission: projectSubmission },
      { status: 201 },
    )
  } catch (error) {
    console.error("Project submission failed:", error)
    return NextResponse.json(
      { error: "Failed to save project submission." },
      { status: 500 },
    )
  }
}
