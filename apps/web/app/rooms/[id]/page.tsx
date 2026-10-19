import type { Metadata } from "next"
import Link from "next/link"
import { ArrowLeft, Radio } from "lucide-react"
import { notFound, redirect } from "next/navigation"
import { DashboardHeader } from "@/components/dashboard/dashboard-header"
import { formatHackathonDate } from "@/lib/api/hackathons"
import { getSession } from "@/lib/auth/session"
import { prisma } from "@/lib/prisma"
import TestPage from "@/components/room/RoomMatching"
export const metadata: Metadata = {
  title: "Room | HackGuard AI",
}

export const dynamic = "force-dynamic"

export default async function RoomPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params

  const session = await getSession()
  if (!session) redirect("/sign-in")

  const hackathon = await prisma.hackathon.findUnique({
    where: { id },
    include: { organizer: { select: { name: true } } },
  })
  if (!hackathon) notFound()

  const isLive = hackathon.type === "live"

  const statusStyles =
    hackathon.status === "Live"
      ? "border-emerald-500/30 bg-emerald-500/15 text-emerald-400"
      : hackathon.status === "Upcoming"
        ? "border-[var(--hg-cyan)]/30 bg-[var(--hg-cyan)]/10 text-[var(--hg-cyan)]"
        : "border-white/10 bg-white/5 text-[var(--hg-dim)]"

  return (
    <main className="hg-fade-in min-h-screen bg-[var(--hg-bg)]">
      <DashboardHeader session={session} />

      <div className="mx-auto max-w-4xl px-6 py-10">
        <Link
          href="/events"
          className="inline-flex items-center gap-1.5 text-[12px] font-medium text-[var(--hg-muted)] transition-colors hover:text-[var(--hg-text)]"
        >
          <ArrowLeft className="size-3.5" /> Back to hackathons
        </Link>

        <span className="mt-6 flex items-center gap-1.5 font-mono text-[11px] font-semibold uppercase tracking-[0.2em] text-[var(--hg-cyan)]">
          <Radio className="size-3.5" /> {isLive ? "Live room" : "Room"}
        </span>
        <h1 className="mt-2 text-3xl font-bold text-[var(--hg-text)]">{hackathon.name}</h1>
        <p className="mt-1 text-[13px] text-[var(--hg-muted)]">
          {formatHackathonDate(hackathon.date)} · hosted by {hackathon.organizer.name}
        </p>

        <div className="mt-6 flex flex-wrap items-center gap-4 text-[12px] text-[var(--hg-muted)]">
          <span
            className={`shrink-0 rounded-full border px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide ${statusStyles}`}
          >
            {hackathon.status}
          </span>
          <span>
            <strong className="text-[var(--hg-text)]">{hackathon.participants}</strong> participants
          </span>
          <span>
            <strong className="text-[var(--hg-text)]">{hackathon.submissions}</strong> submissions
          </span>
        </div>

        <p className="mt-4 max-w-2xl text-[13px] leading-relaxed text-[var(--hg-muted)]">
          {hackathon.description}
        </p>

        <div className="mt-8 overflow-hidden rounded-xl border border-[var(--hg-border)] bg-[var(--hg-surface)]">
          <div className="flex items-center gap-2 border-b border-[var(--hg-border)] bg-[var(--hg-bg)]/60 px-5 py-3">
            <span className="relative flex size-2">
              {isLive && (
                <span className="absolute inline-flex size-full animate-ping rounded-full bg-red-500 opacity-75" />
              )}
              <span
                className={`relative inline-flex size-2 rounded-full ${isLive ? "bg-red-500" : "bg-[var(--hg-dim)]"}`}
              />
            </span>
            <span className="font-mono text-[11px] font-semibold uppercase tracking-[0.2em] text-[var(--hg-text)]">
              Stage
            </span>
          </div>
          <TestPage />
          <div className="flex flex-col items-center justify-center px-6 py-16 text-center">
            <p className="text-[14px] font-semibold text-[var(--hg-text)]">
              {isLive ? "The arena is live" : "The room is not live yet"}
            </p>    
            <p className="mx-auto mt-1 max-w-sm text-[12px] text-[var(--hg-dim)]">
              {isLive
                ? "Video stage, matchmaking and judging will stream into this space."
                : "Check back    when the event goes live — the stage will open here."}
            </p>
          </div>
        </div>
      </div>
    </main>
  )
}