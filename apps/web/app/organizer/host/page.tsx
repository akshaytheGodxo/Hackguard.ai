import type { Metadata } from "next"
import { redirect } from "next/navigation"
import { HostHackathonForm } from "@/components/organizer/host-hackathon-form"
import { ROLE_HOME } from "@/lib/auth/roles"
import { getSession } from "@/lib/auth/session"

export const metadata: Metadata = {
  title: "Host a Hackathon | HackGuard AI",
}

export const dynamic = "force-dynamic"

export default async function HostHackathonPage() {
  const session = await getSession()
  if (!session) redirect("/sign-in")
  if (session.role !== "organizer") redirect(ROLE_HOME[session.role])

  return <HostHackathonForm session={session} />
}