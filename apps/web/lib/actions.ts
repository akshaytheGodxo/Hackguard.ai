"use server"

import bcrypt from "bcryptjs"
import { revalidatePath } from "next/cache"
import { redirect } from "next/navigation"
import { MAX_TEAM_SIZE, type TeamMember } from "@/lib/api/hackathons"
import { isRole, ROLE_HOME, type Role } from "@/lib/auth/roles"
import { createSession, getSession, updateSessionRole } from "@/lib/auth/session"
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

  const name = String(formData.get("name") ?? "").trim()
  const date = String(formData.get("date") ?? "")
  const description = String(formData.get("description") ?? "").trim()
  const type = String(formData.get("type") ?? "").trim()
  if (!name || !date || !description) return { error: "All fields are required." }
  if (type !== "standard" && type !== "live") return { error: "Choose a hackathon type." }

  const parsed = new Date(`${date}T09:00:00`)
  if (Number.isNaN(parsed.getTime())) return { error: "Pick a valid start date." }

  await prisma.hackathon.create({
    data: {
      name,
      date: parsed,
      description,
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
  members: TeamMember[],
): Promise<ActionResult> {
  const session = await getSession()
  if (!session) redirect("/sign-in")

  const team = members
    .slice(0, MAX_TEAM_SIZE)
    .map((member) => ({ name: member.name.trim(), email: member.email.trim().toLowerCase() }))
    .filter((member) => member.name !== "" && member.email !== "")

  if (team.length === 0) return { error: "Add the team leader before registering." }

  const existing = await prisma.registration.findUnique({
    where: { hackathonId_userId: { hackathonId, userId: session.userId } },
  })
  if (existing) return { error: "You are already registered for this hackathon." }

  await prisma.$transaction([
    prisma.registration.create({
      data: {
        hackathonId,
        userId: session.userId,
        members: {
          create: team.map((member, index) => ({
            name: member.name,
            email: member.email,
            isLeader: index === 0,
            position: index,
          })),
        },
      },
    }),
    prisma.hackathon.update({
      where: { id: hackathonId },
      data: { participants: { increment: team.length } },
    }),
  ])

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
      testcases: true
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