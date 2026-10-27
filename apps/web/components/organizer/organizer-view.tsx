"use client"

import { CalendarPlus, FileCode2, Rocket, ShieldAlert } from "lucide-react"
import Link from "next/link"
import { useState } from "react"
import { DashboardHeader } from "@/components/dashboard/dashboard-header"
import { AddProblemForm } from "@/components/organizer/add-problem-form"
import type { Hackathon } from "@/lib/api/hackathons"
import type { SessionView } from "@/lib/auth/session"

export function OrganizerView({
  session,
  hackathons,
}: {
  session: SessionView
  hackathons: Hackathon[]
}) {
  const [addingTo, setAddingTo] = useState<string | null>(null)

  return (
    <main className="hg-fade-in min-h-screen bg-[var(--hg-bg)]">
      <DashboardHeader session={session} />

      <div className="mx-auto max-w-6xl px-6 py-10">
        <div className="flex flex-wrap items-end justify-between gap-4">
          <div>
            <span className="inline-flex items-center gap-1.5 font-mono text-[11px] font-semibold uppercase tracking-[0.2em] text-[var(--hg-cyan)]">
              <Rocket className="size-3.5" /> Organizer
            </span>
            <h1 className="mt-2 text-3xl font-bold text-[var(--hg-text)]">Your hackathons</h1>
            <p className="mt-1 text-[13px] text-[var(--hg-muted)]">
              Host events, track submissions, and manage judging.
            </p>
          </div>
          <div className="flex flex-wrap items-center gap-2">
            <Link
              href="/organizer/plagiarism"
              className="inline-flex items-center gap-2 rounded-lg border border-[var(--hg-border-strong)] bg-[var(--hg-surface)] px-4 py-2.5 text-[13px] font-semibold text-[var(--hg-muted)] transition-colors hover:border-[var(--hg-cyan)]/40 hover:text-[var(--hg-cyan)]"
            >
              <ShieldAlert className="size-4" />
              Plagiarism review
            </Link>
            <Link
              href="/organizer/host"
              className="hg-gradient-bg inline-flex items-center gap-2 rounded-lg px-4 py-2.5 text-[13px] font-bold text-[#101426] shadow-[0_12px_30px_rgba(109,146,238,0.25)] transition-all hover:-translate-y-px hover:brightness-105"
            >
              <CalendarPlus className="size-4" />
              Host a hackathon
            </Link>
          </div>
        </div>

        {hackathons.length === 0 ? (
          <div className="mt-10 rounded-xl border border-dashed border-[var(--hg-border)] px-6 py-16 text-center">
            <p className="text-[14px] font-semibold text-[var(--hg-text)]">
              You haven&apos;t hosted a hackathon yet
            </p>
            <p className="mx-auto mt-1 max-w-sm text-[12px] text-[var(--hg-dim)]">
              Create your first event and it will appear here — candidates will see it in their
              feed immediately.
            </p>
            <Link
              href="/organizer/host"
              className="mt-5 inline-flex items-center gap-2 rounded-lg border border-[var(--hg-cyan)]/40 bg-[var(--hg-cyan)]/10 px-4 py-2 text-[12px] font-semibold text-[var(--hg-cyan)] transition-colors hover:bg-[var(--hg-cyan)]/20"
            >
              <CalendarPlus className="size-4" />
              Host a hackathon
            </Link>
          </div>
        ) : (
          <div className="mt-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {hackathons.map((hackathon) => (
              <article
                key={hackathon.id}
                className="rounded-xl border border-[var(--hg-border)] bg-[var(--hg-surface)] p-5 transition-colors hover:border-[var(--hg-cyan)]/40"
              >
                <div className="flex items-start justify-between gap-3">
                  <h2 className="text-[15px] font-semibold text-[var(--hg-text)]">
                    {hackathon.name}
                  </h2>
                  <span className="shrink-0 rounded-full border border-[var(--hg-cyan)]/30 bg-[var(--hg-cyan)]/10 px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide text-[var(--hg-cyan)]">
                    {hackathon.status}
                  </span>
                </div>
                <p className="mt-1 text-[12px] text-[var(--hg-dim)]">{hackathon.date}</p>
                <p className="mt-3 line-clamp-2 text-[12px] leading-relaxed text-[var(--hg-muted)]">
                  {hackathon.description}
                </p>
                <div className="mt-4 flex gap-4 text-[12px] text-[var(--hg-muted)]">
                  <span>
                    <strong className="text-[var(--hg-text)]">{hackathon.participants}</strong>{" "}
                    participants
                  </span>
                  <span>
                    <strong className="text-[var(--hg-text)]">{hackathon.submissions}</strong>{" "}
                    submissions
                  </span>
                </div>

                {hackathon.type === "live" && (
                  <div className="mt-4 border-t border-[var(--hg-border)] pt-4">
                    {addingTo !== hackathon.id ? (
                      <button
                        type="button"
                        onClick={() => setAddingTo(hackathon.id)}
                        className="inline-flex w-full items-center justify-center gap-1.5 rounded-md border border-red-500/40 bg-red-500/10 px-3 py-2 text-[12px] font-semibold text-red-400 transition-colors hover:bg-red-500/20"
                      >
                        <FileCode2 className="size-3.5" /> Add problems
                      </button>
                    ) : (
                      <AddProblemForm
                        hackathonId={hackathon.id}
                        onClose={() => setAddingTo(null)}
                        onSaved={() => setAddingTo(null)}
                      />
                    )}
                  </div>
                )}
              </article>
            ))}
          </div>
        )}

        <p className="mt-8 text-[12px] text-[var(--hg-dim)]">
          Suspect copied solutions?{" "}
          <Link
            href="/organizer/plagiarism"
            className="font-semibold text-[var(--hg-cyan)] hover:underline"
          >
            Review plagiarism reports
          </Link>
          .
        </p>
      </div>
    </main>
  )
}
