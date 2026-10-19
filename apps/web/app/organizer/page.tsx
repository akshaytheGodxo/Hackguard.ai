import type { Metadata } from "next"
import { redirect } from "next/navigation"
import { OrganizerView } from "@/components/organizer/organizer-view"
import { formatHackathonDate, type Hackathon } from "@/lib/api/hackathons"
import { ROLE_HOME } from "@/lib/auth/roles"
import { getSession } from "@/lib/auth/session"
import { prisma } from "@/lib/prisma"

export const metadata: Metadata = {
  title: "Organizer | HackGuard AI",
}

export const dynamic = "force-dynamic"

export default async function OrganizerPage() {
  const session = await getSession()
  if (!session) redirect("/sign-in")
  if (session.role !== "organizer") redirect(ROLE_HOME[session.role])

  const hackathons = await prisma.hackathon.findMany({
    where: { organizerId: session.userId },
    orderBy: { createdAt: "desc" },
  })

  const hackathonViews: Hackathon[] = hackathons.map((hackathon) => ({
    id: hackathon.id,
    name: hackathon.name,
    date: formatHackathonDate(hackathon.date),
    status: hackathon.status,
    participants: hackathon.participants,
    submissions: hackathon.submissions,
    description: hackathon.description,
    organizer: "You",
  }))

  return <OrganizerView session={session} hackathons={hackathonViews} />
}