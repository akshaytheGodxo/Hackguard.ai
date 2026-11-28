"use client"

import { CalendarPlus, FileCode2, Radio, Rocket, ShieldAlert, Trophy, Users, Workflow } from "lucide-react"
import Link from "next/link"
import { useState } from "react"
import { DashboardHeader } from "@/components/dashboard/dashboard-header"
import { AddProblemForm } from "@/components/organizer/add-problem-form"
import { EmptyState, Metric, PageIntro, StatusPill, type PillTone } from "@/components/ui/app-ui"
import type { Hackathon } from "@/lib/api/hackathons"
import type { SessionView } from "@/lib/auth/session"

const statusTone: Record<Hackathon["status"], PillTone> = {
  Live: "live",
  Upcoming: "upcoming",
  Completed: "completed",
}

export function OrganizerView({
  session,
  hackathons,
}: {
  session: SessionView
  hackathons: Hackathon[]
}) {
  const [addingTo, setAddingTo] = useState<string | null>(null)
  const liveCount = hackathons.filter((hackathon) => hackathon.type === "live").length
  const participantCount = hackathons.reduce((total, hackathon) => total + hackathon.participants, 0)

  return (
    <main className="hg-fade-in min-h-screen bg-[var(--hg-bg)]">
      <DashboardHeader session={session} />

      <div className="mx-auto max-w-6xl px-4 py-8 sm:px-6 sm:py-10">
        <PageIntro
          eyebrow="Organizer workspace"
          icon={<Rocket className="size-3.5" />}
          title="Your hackathons"
          description="Create events, manage live problems, and review integrity signals in one place."
          actions={
            <>
              <Link
                href="/organizer/plagiarism"
                className="inline-flex h-10 items-center gap-2 rounded-lg border border-[var(--hg-border-strong)] bg-[var(--hg-surface)] px-4 text-[12px] font-semibold text-[var(--hg-muted)] transition-colors hover:border-[var(--hg-cyan)]/40 hover:text-[var(--hg-cyan)]"
              >
                <ShieldAlert className="size-4" />
                Plagiarism review
              </Link>
              <Link
                href="/organizer/host"
                className="hg-gradient-bg inline-flex h-10 items-center gap-2 rounded-lg px-4 text-[12px] font-bold text-[#101426] shadow-[0_12px_30px_rgba(109,146,238,0.25)] transition-all hover:-translate-y-px hover:brightness-105"
              >
                <CalendarPlus className="size-4" />
                Host a hackathon
              </Link>
            </>
          }
        >
          <div className="mt-6 grid gap-3 sm:grid-cols-3">
            <Metric label="Events hosted" value={hackathons.length} icon={<Trophy className="size-3.5" />} />
            <Metric label="Live arenas" value={liveCount} icon={<Radio className="size-3.5" />} />
            <Metric label="Participants" value={participantCount} icon={<Users className="size-3.5" />} />
          </div>
        </PageIntro>

        {hackathons.length === 0 ? (
          <EmptyState
            className="mt-6"
            icon={<Trophy className="size-7" />}
            title="You haven't hosted a hackathon yet"
            description="Create your first event and it will appear in the candidate feed immediately."
            action={
              <Link
                href="/organizer/host"
                className="hg-gradient-bg inline-flex h-10 items-center gap-2 rounded-lg px-4 text-[12px] font-bold text-[#101426]"
              >
                <CalendarPlus className="size-4" /> Host a hackathon
              </Link>
            }
          />
        ) : (
          <div className="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {hackathons.map((hackathon) => (
              <article
                key={hackathon.id}
                className="group flex min-w-0 flex-col rounded-2xl border border-[var(--hg-border)] bg-[var(--hg-surface)] p-5 transition-all duration-200 hover:-translate-y-0.5 hover:border-[var(--hg-cyan)]/40 hover:shadow-[0_20px_50px_rgba(0,0,0,0.22)]"
              >
                <div className="flex flex-wrap items-start justify-between gap-2">
                  <div className="flex flex-wrap gap-2">
                    <StatusPill tone={hackathon.type === "live" ? "live" : "neutral"} dot={hackathon.type === "live"}>
                      {hackathon.type === "live" ? "1v1 live" : "Standard"}
                    </StatusPill>
                    <StatusPill tone={statusTone[hackathon.status]}>{hackathon.status}</StatusPill>
                  </div>
                </div>

                <h2 className="mt-4 break-words text-[16px] font-semibold leading-snug text-[var(--hg-text)]">
                  {hackathon.name}
                </h2>
                <p className="mt-1.5 text-[11px] text-[var(--hg-dim)]">{hackathon.date}</p>
                <p className="mt-3 line-clamp-3 flex-1 text-[12px] leading-relaxed text-[var(--hg-muted)]">
                  {hackathon.description}
                </p>

                <div className="mt-4 grid grid-cols-2 gap-3 border-t border-[var(--hg-border)] pt-4 text-[11px] text-[var(--hg-muted)]">
                  <span className="inline-flex items-center gap-2">
                    <Users className="size-3.5 text-[var(--hg-dim)]" />
                    <strong className="text-[13px] text-[var(--hg-text)]">{hackathon.participants}</strong> participants
                  </span>
                  <span className="inline-flex items-center gap-2">
                    <Workflow className="size-3.5 text-[var(--hg-dim)]" />
                    <strong className="text-[13px] text-[var(--hg-text)]">{hackathon.submissions}</strong> submissions
                  </span>
                </div>

                <div className="mt-4">
                  {hackathon.type === "standard" ? (
                    <Link
                      href={`/organizer/hackathons/${hackathon.id}/plagiarism`}
                      className="inline-flex h-9 w-full items-center justify-center gap-2 rounded-lg border border-[var(--hg-cyan)]/30 bg-[var(--hg-cyan)]/5 text-[12px] font-semibold text-[var(--hg-cyan)] transition-colors hover:bg-[var(--hg-cyan)]/10"
                    >
                      <ShieldAlert className="size-3.5" />
                      Repository analysis
                    </Link>
                  ) : addingTo === hackathon.id ? (
                    <AddProblemForm
                      hackathonId={hackathon.id}
                      onClose={() => setAddingTo(null)}
                      onSaved={() => setAddingTo(null)}
                    />
                  ) : (
                    <button
                      type="button"
                      onClick={() => setAddingTo(hackathon.id)}
                      className="inline-flex h-9 w-full items-center justify-center gap-1.5 rounded-lg border border-emerald-500/40 bg-emerald-500/10 text-[12px] font-semibold text-emerald-400 transition-colors hover:bg-emerald-500/20"
                    >
                      <FileCode2 className="size-3.5" /> Add problems
                    </button>
                  )}
                </div>
              </article>
            ))}
          </div>
        )}

        <p className="mt-8 text-[12px] text-[var(--hg-dim)]">
          Suspect copied solutions?{" "}
          <Link href="/organizer/plagiarism" className="font-semibold text-[var(--hg-cyan)] hover:underline">
            Review plagiarism reports
          </Link>
          .
        </p>
      </div>
    </main>
  )
}
