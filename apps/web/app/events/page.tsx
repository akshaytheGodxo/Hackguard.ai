import type { Metadata } from "next"
import { redirect } from "next/navigation"
import { EventsView } from "@/components/events/events-view"
import { formatHackathonDate, type Hackathon, type RegistrationView } from "@/lib/api/hackathons"
import { ROLE_HOME } from "@/lib/auth/roles"
import { getSession } from "@/lib/auth/session"
import { prisma } from "@/lib/prisma"

export const metadata: Metadata = {
  title: "Hackathons | HackGuard AI",
}

export const dynamic = "force-dynamic"

export default async function EventsPage() {
  const session = await getSession()
  if (!session) redirect("/sign-in")
  if (session.role !== "candidate") redirect(ROLE_HOME[session.role])

  const [hackathons, registrations] = await Promise.all([
    prisma.hackathon.findMany({
      orderBy: { createdAt: "desc" },
      include: { organizer: { select: { name: true } } },
    }),
    prisma.registration.findMany({
      where: { userId: session.userId },
      include: { members: true },
    }),
  ])

  const hackathonViews: Hackathon[] = hackathons.map((hackathon) => ({
    id: hackathon.id,
    name: hackathon.name,
    date: formatHackathonDate(hackathon.date),
    status: hackathon.status,
    type: hackathon.type,
    participants: hackathon.participants,
    submissions: hackathon.submissions,
    description: hackathon.description,
    organizer: hackathon.organizer.name,
  }))

  const registrationViews: RegistrationView[] = registrations.map((registration) => ({
    hackathonId: registration.hackathonId,
    members: registration.members
      .slice()
      .sort((a, b) => a.position - b.position)
      .map((member) => ({ name: member.name, email: member.email })),
  }))

  return (
    <EventsView
      session={session}
      hackathons={hackathonViews}
      registrations={registrationViews}
    />
  )
}