import { randomUUID } from "node:crypto"
import { mkdir, unlink, writeFile } from "node:fs/promises"
import path from "node:path"
import { NextResponse } from "next/server"
import { getSession } from "@/lib/auth/session"
import { prisma } from "@/lib/prisma"

const MAX_PROJECT_ZIP_SIZE = 50 * 1024 * 1024
const MAX_REQUEST_SIZE = MAX_PROJECT_ZIP_SIZE + 64 * 1024
const MAX_TEAM_NAME_LENGTH = 100
const MAX_URL_LENGTH = 2_048

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

    const contentLength = Number(request.headers.get("content-length"))
    if (Number.isFinite(contentLength) && contentLength > MAX_REQUEST_SIZE) {
      return NextResponse.json(
        { error: "The ZIP file must be 50 MB or smaller." },
        { status: 413 },
      )
    }

    let formData: FormData
    try {
      formData = await request.formData()
    } catch {
      return NextResponse.json(
        { error: "Request body must be valid multipart form data." },
        { status: 400 },
      )
    }

    const hackathonId = formData.get("hackathonId")
    const registrationId = formData.get("registrationId")
    const githubRepoUrl = formData.get("githubRepoUrl")
    const teamName = formData.get("teamName")
    const projectZipFile = formData.get("projectZipFile")

    if (
      !isText(hackathonId, 100) ||
      !isText(registrationId, 100) ||
      !isText(githubRepoUrl, MAX_URL_LENGTH) ||
      !isText(teamName, MAX_TEAM_NAME_LENGTH) ||
      !(projectZipFile instanceof File)
    ) {
      return NextResponse.json(
        { error: "Provide a team name, ZIP file, and GitHub repository URL." },
        { status: 400 },
      )
    }

    if (projectZipFile.size === 0 || projectZipFile.size > MAX_PROJECT_ZIP_SIZE) {
      return NextResponse.json(
        { error: "The ZIP file must be larger than 0 bytes and 50 MB or smaller." },
        { status: projectZipFile.size > MAX_PROJECT_ZIP_SIZE ? 413 : 400 },
      )
    }
    if (!projectZipFile.name.toLowerCase().endsWith(".zip")) {
      return NextResponse.json(
        { error: "Upload a file with the .zip extension." },
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

    const fileBuffer = Buffer.from(await projectZipFile.arrayBuffer())
    const zipSignature = fileBuffer.subarray(0, 4)
    if (
      zipSignature[0] !== 0x50 ||
      zipSignature[1] !== 0x4b ||
      ![0x03, 0x05, 0x07].includes(zipSignature[2]) ||
      ![0x04, 0x06, 0x08].includes(zipSignature[3])
    ) {
      return NextResponse.json(
        { error: "The selected file is not a valid ZIP archive." },
        { status: 400 },
      )
    }

    const fileName = `${randomUUID()}.zip`
    const storageDirectory = path.join(process.cwd(), "uploads", "project-submissions")
    const filePath = path.join(storageDirectory, fileName)
    const projectZipKey = `project-submissions/${fileName}`

    await mkdir(storageDirectory, { recursive: true })
    await writeFile(filePath, fileBuffer, { flag: "wx" })

    let projectSubmission
    try {
      projectSubmission = await prisma.$transaction(async (transaction) => {
        await transaction.registration.update({
          where: { id: registration.id },
          data: { teamName: teamName.trim() },
        })

        const submission = await transaction.projectSubmission.create({
          data: {
            projectZipKey,
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
    } catch (error) {
      try {
        await unlink(filePath)
      } catch (cleanupError) {
        console.error("Failed to remove ZIP file after submission failure:", cleanupError)
      }
      throw error
    }

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
