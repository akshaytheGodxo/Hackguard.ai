"use client"

import { Check, Compass } from "lucide-react"
import Link from "next/link"
import { useRouter } from "next/navigation"
import { useState, useTransition } from "react"
import { DashboardHeader } from "@/components/dashboard/dashboard-header"
import { RegisterModal } from "@/components/events/register-modal"
import { unregisterFromHackathon } from "@/lib/actions"
import type { Hackathon, RegistrationView } from "@/lib/api/hackathons"
import type { SessionView } from "@/lib/auth/session"

const statusStyles: Record<string, string> = {
  Live: "bg-emerald-500/15 text-emerald-400 border-emerald-500/30",
  Upcoming: "bg-[var(--hg-cyan)]/10 text-[var(--hg-cyan)] border-[var(--hg-cyan)]/30",
  Completed: "bg-white/5 text-[var(--hg-dim)] border-white/10",
}

function HackathonCard({
  hackathon,
  registration,
  onRegister,
  onUnregister,
}: {
  hackathon: Hackathon
  registration?: RegistrationView
  onRegister: () => void
  onUnregister: () => void
}) {
  const registered = Boolean(registration)
  const closed = hackathon.status === "Completed"

  return (
    <article className="flex flex-col rounded-xl border border-[var(--hg-border)] bg-[var(--hg-surface)] p-5 transition-colors hover:border-[var(--hg-cyan)]/40">
      <div className="flex items-start justify-between gap-3">
        <h2 className="text-[15px] font-semibold text-[var(--hg-text)]">{hackathon.name}</h2>
        <span
          className={`shrink-0 rounded-full border px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide ${statusStyles[hackathon.status]}`}
        >
          {hackathon.status}
        </span>
      </div>
      <p className="mt-1 text-[12px] text-[var(--hg-dim)]">
        {hackathon.date} · hosted by {hackathon.organizer}
      </p>
      <p className="mt-3 line-clamp-2 flex-1 text-[12px] leading-relaxed text-[var(--hg-muted)]">
        {hackathon.description}
      </p>
      <div className="mt-4 flex items-center justify-between gap-2">
        <div className="flex gap-4 text-[12px] text-[var(--hg-muted)]">
          <span>
            <strong className="text-[var(--hg-text)]">{hackathon.participants}</strong> participants
          </span>
          <span>
            <strong className="text-[var(--hg-text)]">{hackathon.submissions}</strong> submissions
          </span>
        </div>
        <button
          type="button"
          onClick={registered ? onUnregister : onRegister}
          disabled={closed}
          title={registered ? "Click to cancel your registration" : undefined}
          className={`shrink-0 rounded-full border px-3 py-1 text-[11px] font-semibold transition-colors disabled:cursor-not-allowed disabled:opacity-40 ${
            registered
              ? "border-emerald-500/40 bg-emerald-500/15 text-emerald-400 hover:border-red-500/40 hover:bg-red-500/10 hover:text-red-400"
              : "border-[var(--hg-cyan)]/40 bg-[var(--hg-cyan)]/10 text-[var(--hg-cyan)] hover:bg-[var(--hg-cyan)]/20"
          }`}
        >
          {registered ? (
            <span className="inline-flex items-center gap-1">
              <Check className="size-3" />
              Registered
              {(registration?.members.length ?? 0) > 1 ? ` · ${registration?.members.length}` : ""}
            </span>
          ) : closed ? (
            "Closed"
          ) : (
            "Register"
          )}
        </button>
      </div>
    </article>
  )
}

export function EventsView({
  session,
  hackathons,
  registrations,
}: {
  session: SessionView
  hackathons: Hackathon[]
  registrations: RegistrationView[]
}) {
  const router = useRouter()
  const [pending, startTransition] = useTransition()
  const [registering, setRegistering] = useState<Hackathon | null>(null)

  function handleUnregister(id: string) {
    if (pending) return
    startTransition(async () => {
      await unregisterFromHackathon(id)
      router.refresh()
    })
  }

  return (
    <main className="hg-fade-in min-h-screen bg-[var(--hg-bg)]">
      <DashboardHeader session={session} />

      <div className="mx-auto max-w-6xl px-6 py-10">
        <span className="inline-flex items-center gap-1.5 font-mono text-[11px] font-semibold uppercase tracking-[0.2em] text-[var(--hg-cyan)]">
          <Compass className="size-3.5" /> Discover
        </span>
        <h1 className="mt-2 text-3xl font-bold text-[var(--hg-text)]">Hackathons</h1>
        <p className="mt-1 text-[13px] text-[var(--hg-muted)]">
          Browse open hackathons and register to start competing.
        </p>

        {hackathons.length === 0 ? (
          <div className="mt-10 rounded-xl border border-dashed border-[var(--hg-border)] px-6 py-14 text-center text-[13px] text-[var(--hg-dim)]">
            No hackathons available yet.
          </div>
        ) : (
          <div className="mt-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {hackathons.map((hackathon) => (
              <HackathonCard
                key={hackathon.id}
                hackathon={hackathon}
                registration={registrations.find(
                  (registration) => registration.hackathonId === hackathon.id,
                )}
                onRegister={() => setRegistering(hackathon)}
                onUnregister={() => handleUnregister(hackathon.id)}
              />
            ))}
          </div>
        )}

        <p className="mt-8 text-[12px] text-[var(--hg-dim)]">
          Want to run your own event? Switch to{" "}
          <Link href="/organizer" className="font-semibold text-[var(--hg-cyan)] hover:underline">
            Organizer
          </Link>{" "}
          from the toggle above.
        </p>
      </div>

      {registering && (
        <RegisterModal hackathon={registering} onClose={() => setRegistering(null)} />
      )}
    </main>
  )
}
