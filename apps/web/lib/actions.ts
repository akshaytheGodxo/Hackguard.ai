"use server"

import { Prisma } from "@prisma/client"
import bcrypt from "bcryptjs"
import { revalidatePath } from "next/cache"
import { redirect } from "next/navigation"
import { MAX_TEAM_SIZE, type TeamMember } from "@/lib/api/hackathons"
import { isRole, ROLE_HOME, type Role } from "@/lib/auth/roles"
import { clearSession, createSession, getSession, updateSessionRole } from "@/lib/auth/session"
import { prisma } from "@/lib/prisma"

type ActionResult = { error: string } | undefined

export async function signIn(formData: FormData): Promise<ActionResult> {
  const email = String(formData.get("email") ?? "").trim().toLowerCase()
  const password = String(formData.get("password") ?? "")
  const role = formData.get("role")

  if (!email || !password) return { error: "Email and password are required." }
  if (!isRole(role)) return { error: "Choose a role to continue." }

  const user = await prisma.user.findUnique({ where: { email } })
  if (!user) return { error: "No account found for that email." }

  const valid = await bcrypt.compare(password, user.password)
  if (!valid) return { error: "Incorrect password." }

  await prisma.user.update({ where: { id: user.id }, data: { role } })
  await createSession({ userId: user.id, name: user.name, email: user.email, role })
  redirect(ROLE_HOME[role])
}

export async function signUp(formData: FormData): Promise<ActionResult> {
  const name = String(formData.get("name") ?? "").trim()
  const email = String(formData.get("email") ?? "").trim().toLowerCase()
  const password = String(formData.get("password") ?? "")
  const terms = formData.get("terms")

  if (!name || !email || !password) return { error: "Name, email and password are required." }
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) return { error: "Enter a valid email address." }
  if (password.length < 8) return { error: "Password must be at least 8 characters." }
  if (!terms) return { error: "You must accept the Terms of Service." }

  const existing = await prisma.user.findUnique({ where: { email } })
  if (existing) return { error: "An account with that email already exists." }

  const hashed = await bcrypt.hash(password, 12)
  const role: Role = "candidate"
  const user = await prisma.user.create({
    data: { name, email, password: hashed, role },
  })

  await createSession({ userId: user.id, name: user.name, email: user.email, role })
  redirect(ROLE_HOME[role])
}

export async function switchRole(role: Role): Promise<ActionResult> {
  const session = await getSession()
  if (!session) redirect("/sign-in")

  if (!isRole(role)) return undefined
  if (role === session.role) return undefined

  await prisma.user.update({ where: { id: session.userId }, data: { role } })
  await updateSessionRole(role)
  redirect(ROLE_HOME[role])
}

export async function hostHackathon(formData: FormData): Promise<ActionResult> {
  const session = await getSession()
  if (!session) redirect("/sign-in")
  if (session.role !== "organizer") redirect(ROLE_HOME[session.role])

  const organizer = await prisma.user.findUnique({
    where: { id: session.userId },
    select: { id: true },
  })
  if (!organizer) {
    await clearSession()
    return { error: "Your account could not be found. Please sign in again." }
  }

  const name = String(formData.get("name") ?? "").trim()
  const date = String(formData.get("date") ?? "")
  const description = String(formData.get("description") ?? "").trim()
  const problemStatement = String(formData.get("problemStatement") ?? "").trim()
  const startTime = String(formData.get("startTime") ?? "")
  const endTime = String(formData.get("endTime") ?? "")
  const type = String(formData.get("type") ?? "").trim()
  if (!name || !date || !description) return { error: "All fields are required." }
  if (type !== "standard" && type !== "live") return { error: "Choose a hackathon type." }
  if (type === "standard" && !problemStatement) {
    return { error: "Add a problem statement for standard hackathons." }
  }
  const isValidTime = (time: string) => /^([01]\d|2[0-3]):[0-5]\d$/.test(time)
  if (
    type === "standard" &&
    (!isValidTime(startTime) || !isValidTime(endTime))
  ) {
    return { error: "Choose a valid start and end time for the hackathon." }
  }

  const parsed = new Date(`${date}T09:00:00`)
  if (Number.isNaN(parsed.getTime())) return { error: "Pick a valid start date." }

  await prisma.hackathon.create({
    data: {
      name,
      date: parsed,
      startTime: type === "standard" ? startTime : null,
      endTime: type === "standard" ? endTime : null,
      description,
      problemStatement: type === "standard" ? problemStatement : null,
      status: "Upcoming",
      type,
      organizerId: session.userId,
    },
  })

  revalidatePath("/organizer")
  redirect("/organizer")
}

export async function registerForHackathon(
  hackathonId: string,
  teamName: string,
  members: TeamMember[],
): Promise<ActionResult> {
  const session = await getSession()
  if (!session) redirect("/sign-in")
  if (session.role !== "candidate") return { error: "Only candidates can register." }

  if (
    typeof hackathonId !== "string" ||
    !Array.isArray(members) ||
    typeof teamName !== "string"
  ) {
    return { error: "Invalid team registration details." }
  }

  const normalizedTeamName = teamName.trim()
  if (!normalizedTeamName || normalizedTeamName.length > 100) {
    return { error: "Team name must contain 1–100 characters." }
  }

  if (members.length === 0 || members.length > MAX_TEAM_SIZE) {
    return { error: `A team must have 1–${MAX_TEAM_SIZE} members.` }
  }

  const team: TeamMember[] = []
  for (const member of members) {
    if (
      !member ||
      typeof member.name !== "string" ||
      typeof member.email !== "string"
    ) {
      return { error: "Each team member needs a name and email address." }
    }

    const name = member.name.trim()
    const email = member.email.trim().toLowerCase()
    if (!name || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      return { error: "Each team member needs a name and valid email address." }
    }
    team.push({ name, email })
  }

  const hackathon = await prisma.hackathon.findUnique({
    where: { id: hackathonId },
    select: { type: true, status: true },
  })
  if (!hackathon) return { error: "Hackathon not found." }
  if (hackathon.type !== "standard") {
    return { error: "Team registration is only available for standard hackathons." }
  }
  if (hackathon.status === "Completed") {
    return { error: "Registration for this hackathon is closed." }
  }

  try {
    const existing = await prisma.registration.findUnique({
      where: { hackathonId_userId: { hackathonId, userId: session.userId } },
      select: { id: true },
    })
    if (existing) return { error: "You are already registered for this hackathon." }

    await prisma.$transaction(async (transaction) => {
      await transaction.registration.create({
        data: {
          hackathonId,
          userId: session.userId,
          teamName: normalizedTeamName,
          members: {
            create: team.map((member, index) => ({
              name: member.name,
              email: member.email,
              isLeader: index === 0,
              position: index,
            })),
          },
        },
      })

      await transaction.hackathon.update({
        where: { id: hackathonId },
        data: { participants: { increment: team.length } },
      })
    })
  } catch (error) {
    if (
      error instanceof Prisma.PrismaClientKnownRequestError &&
      error.code === "P2002"
    ) {
      return { error: "You are already registered for this hackathon." }
    }

    console.error("Team registration failed:", error)
    return { error: "Unable to register your team. Please try again." }
  }

  revalidatePath("/events")
}

export async function unregisterFromHackathon(hackathonId: string): Promise<ActionResult> {
  const session = await getSession()
  if (!session) redirect("/sign-in")

  const registration = await prisma.registration.findUnique({
    where: { hackathonId_userId: { hackathonId, userId: session.userId } },
    include: { members: true },
  })
  if (!registration) return undefined

  await prisma.$transaction([
    prisma.registration.delete({ where: { id: registration.id } }),
    prisma.hackathon.update({
      where: { id: hackathonId },
      data: { participants: { decrement: registration.members.length } },
    }),
  ])

  revalidatePath("/events")
}

export type TestCaseDraft = { input: string; output: string }


export async function getProblem(
  hackathonId: string
) {
  const session = await getSession();
  if (!session) redirect("/sign-in")
  const hackathon = await prisma.hackathon.findUnique({
    where: {
      id: hackathonId
    },
    include: {
      problems: true
    }
  })

  if (!hackathon) return {error: "Hackathon not found."}
  const res = hackathon.problems;
  return res;
}


export async function getProblemWithTestcase(id:string) {
  const res = await prisma.problem.findUnique({
    where: {
      problemId: id,
    },
    include: {
      testcases: true,
      hackathon: { select: { name: true, type: true } },
    }
  })

  if (!res) return {error: "No Such Problem was found."}
  return res;
}

export async function addProblem(
  hackathonId: string,
  values: { name: string; description: string; testCases: TestCaseDraft[] },
): Promise<ActionResult> {
  const session = await getSession()
  if (!session) redirect("/sign-in")
  if (session.role !== "organizer") redirect(ROLE_HOME[session.role])

  const name = values.name.trim()
  const description = values.description.trim()
  const testCases = values.testCases
    .map((testCase) => ({ input: testCase.input.trim(), output: testCase.output.trim() }))
    .filter((testCase) => testCase.input !== "" || testCase.output !== "")

  if (!name || !description) return { error: "Problem name and description are required." }
  if (testCases.length === 0) return { error: "Add at least one test case." }
  if (testCases.some((testCase) => testCase.input === "" || testCase.output === "")) {
    return { error: "Each test case needs both an input and an expected output." }
  }

  const hackathon = await prisma.hackathon.findUnique({
    where: { id: hackathonId },
    select: { organizerId: true, type: true },
  })
  if (!hackathon) return { error: "Hackathon not found." }
  if (hackathon.organizerId !== session.userId) return { error: "You don't own this hackathon." }
  if (hackathon.type !== "live") return { error: "Problems can only be added to live hackathons." }

  const duplicate = await prisma.problem.findUnique({ where: { name, hackathonId } })
  if (duplicate) return { error: "A problem with that name already exists in this event." }

  await prisma.problem.create({
    data: {
      name,
      description,
      hackathonId,
      testcases: { create: testCases },
    },
  })

  revalidatePath("/organizer")
}