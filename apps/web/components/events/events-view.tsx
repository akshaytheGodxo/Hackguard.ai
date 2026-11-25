"use client"

import { CalendarDays, Check, Compass, Users, Workflow } from "lucide-react"
import Link from "next/link"
import { useRouter } from "next/navigation"
import { useEffect, useState, useTransition } from "react"
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


function LiveCodingCard({ hackathon }: { hackathon: Hackathon }) {
  return (
    <article className="flex min-w-0 flex-col rounded-2xl border border-[var(--hg-border)] bg-[linear-gradient(145deg,rgba(105,228,231,0.07),transparent_45%),var(--hg-surface)] p-5 transition-colors hover:border-[var(--hg-cyan)]/40">
      <div className="flex items-start justify-between gap-3">
        <h2 className="min-w-0 break-words text-[15px] font-semibold text-[var(--hg-text)]">
          {hackathon.name}
        </h2>
        <span
          className={`shrink-0 rounded-full border px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide ${statusStyles[hackathon.status]}`}
        >
          {hackathon.status}
        </span>
      </div>
      <div className="mt-3 flex items-center gap-2 text-[11px] text-[var(--hg-dim)]">
        <CalendarDays className="size-3.5 text-[var(--hg-cyan)]" />
        <span>{hackathon.date}</span>
        <span aria-hidden="true">·</span>
        <span className="truncate">Hosted by {hackathon.organizer}</span>
      </div>
      <p className="mt-3 flex-1 text-[12px] leading-relaxed text-[var(--hg-muted)]">
        {hackathon.description}
      </p>
      <div className="mt-5 flex flex-wrap items-center justify-between gap-3 border-t border-[var(--hg-border)] pt-4">
        <div className="flex flex-wrap gap-x-4 gap-y-2 text-[12px] text-[var(--hg-muted)]">
          <span>
            <Users className="mr-1 inline size-3.5 text-[var(--hg-dim)]" />
            <strong className="text-[var(--hg-text)]">{hackathon.participants}</strong> participants
          </span>
          <span>
            <Workflow className="mr-1 inline size-3.5 text-[var(--hg-dim)]" />
            <strong className="text-[var(--hg-text)]">{hackathon.submissions}</strong> submissions
          </span>
        </div>
        
        <Link
          href={`/rooms/${hackathon.id}`}
          className="shrink-0 rounded-lg border border-[var(--hg-cyan)]/40 bg-[var(--hg-cyan)]/10 px-3 py-2 text-[11px] font-semibold text-[var(--hg-cyan)] transition-colors hover:bg-[var(--hg-cyan)]/20"
        >
          Join
        </Link>
      </div>
    </article>
  )
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
  const [now, setNow] = useState<number | null>(null)
  useEffect(() => {
    const startTime = hackathon.startAt ? Date.parse(hackathon.startAt) : Number.NaN
    let timeout: number
    function updateClock() {
      const currentTime = Date.now()
      setNow(currentTime)
      if (Number.isFinite(startTime) && currentTime < startTime) {
        timeout = window.setTimeout(updateClock, Math.min(startTime - currentTime, 2_147_000_000))
      }
    }

    updateClock()
    return () => window.clearTimeout(timeout)
  }, [hackathon.startAt])
  const hasStarted =
    hackathon.status === "Live" ||
    (now !== null && Number.isFinite(Date.parse(hackathon.startAt ?? "")) &&
      now >= Date.parse(hackathon.startAt ?? ""))
  const joinAvailable = !closed && hasStarted
  const schedule = hackathon.startTime && hackathon.endTime
    ? `${hackathon.date}${hackathon.endDate !== hackathon.date ? ` – ${hackathon.endDate}` : ""} · ${formatEventTime(hackathon.startTime)}–${formatEventTime(hackathon.endTime)}`
    : hackathon.endDate !== hackathon.date
      ? `${hackathon.date} – ${hackathon.endDate}`
      : hackathon.date

  return (
    <article className="flex min-w-0 flex-col rounded-2xl border border-[var(--hg-border)] bg-[var(--hg-surface)] p-5 transition-colors hover:border-[var(--hg-cyan)]/40">
      <div className="flex items-start justify-between gap-3">
        <h2 className="min-w-0 break-words text-[15px] font-semibold text-[var(--hg-text)]">{hackathon.name}</h2>
        <span
          className={`shrink-0 rounded-full border px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide ${statusStyles[hackathon.status]}`}
        >
          {hackathon.status}
        </span>
      </div>
      <div className="mt-3 flex flex-wrap items-center gap-x-3 gap-y-1.5 text-[11px] text-[var(--hg-dim)]">
        <span className="inline-flex items-center gap-1.5">
          <CalendarDays className="size-3.5 text-[var(--hg-cyan)]" />
          {schedule}
        </span>
        <span>Hosted by {hackathon.organizer}</span>
      </div>
      <p className="mt-4 line-clamp-3 flex-1 text-[12px] leading-relaxed text-[var(--hg-muted)]">
        {hackathon.description}
      </p>
      <div className="mt-5 flex flex-wrap items-end justify-between gap-3 border-t border-[var(--hg-border)] pt-4">
        <div className="flex flex-wrap gap-x-4 gap-y-2 text-[12px] text-[var(--hg-muted)]">
          <span>
            <Users className="mr-1 inline size-3.5 text-[var(--hg-dim)]" />
            <strong className="text-[var(--hg-text)]">{hackathon.participants}</strong> participants
          </span>
          <span>
            <Workflow className="mr-1 inline size-3.5 text-[var(--hg-dim)]" />
            <strong className="text-[var(--hg-text)]">{hackathon.submissions}</strong> submissions
          </span>
        </div>
        <div className="ml-auto flex max-w-full flex-wrap items-center justify-end gap-2">
          {registered && joinAvailable && (
            <Link
              href={`/rooms/${hackathon.id}`}
              className="rounded-lg border border-[var(--hg-cyan)]/40 bg-[var(--hg-cyan)]/10 px-3 py-2 text-[11px] font-semibold text-[var(--hg-cyan)] transition-colors hover:bg-[var(--hg-cyan)]/20"
            >
              Join
            </Link>
          )}
          <button
            type="button"
            onClick={registered ? onUnregister : onRegister}
            disabled={closed}
            title={registered ? "Click to cancel your registration" : undefined}
            className={`max-w-full rounded-lg border px-3 py-2 text-[11px] font-semibold transition-colors disabled:cursor-not-allowed disabled:opacity-40 ${
              registered
                ? "border-emerald-500/40 bg-emerald-500/15 text-emerald-400 hover:border-red-500/40 hover:bg-red-500/10 hover:text-red-400"
                : "border-[var(--hg-cyan)]/40 bg-[var(--hg-cyan)]/10 text-[var(--hg-cyan)] hover:bg-[var(--hg-cyan)]/20"
            }`}
          >
            {registered ? (
              <span className="inline-flex max-w-full items-center gap-1">
                <Check className="size-3" />
                <span className="max-w-32 truncate">{registration?.teamName || "Registered"}</span>
                {(registration?.members.length ?? 0) > 1 ? ` · ${registration?.members.length}` : ""}
              </span>
            ) : closed ? (
              "Closed"
            ) : (
              "Register"
            )}
          </button>
        </div>
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

      <div className="mx-auto max-w-6xl px-4 py-8 sm:px-6 sm:py-10">
        <section className="relative overflow-hidden rounded-2xl border border-[var(--hg-border)] bg-[radial-gradient(ellipse_at_top_right,rgba(105,228,231,0.1),transparent_52%),var(--hg-surface)] px-5 py-6 sm:px-8 sm:py-8">
          <div className="relative max-w-2xl">
            <span className="inline-flex items-center gap-1.5 font-mono text-[11px] font-semibold uppercase tracking-[0.2em] text-[var(--hg-cyan)]">
              <Compass className="size-3.5" /> Discover
            </span>
            <h1 className="mt-2 text-3xl font-bold tracking-tight text-[var(--hg-text)] sm:text-4xl">Find your next hackathon</h1>
            <p className="mt-2 max-w-xl text-[13px] leading-relaxed text-[var(--hg-muted)]">
              Explore upcoming challenges, meet your team, and build something meaningful.
            </p>
            <div className="mt-5 inline-flex items-center gap-2 rounded-full border border-[var(--hg-border)] bg-[var(--hg-bg)]/60 px-3 py-1.5 text-[11px] font-medium text-[var(--hg-muted)]">
              <span className="size-1.5 rounded-full bg-[var(--hg-cyan)]" />
              {hackathons.length} {hackathons.length === 1 ? "event" : "events"} to explore
            </div>
          </div>
        </section>

        {hackathons.length === 0 ? (
          <div className="mt-6 rounded-2xl border border-dashed border-[var(--hg-border-strong)] bg-[var(--hg-surface)]/50 px-6 py-14 text-center">
            <Compass className="mx-auto size-6 text-[var(--hg-dim)]" />
            <p className="mt-3 text-[14px] font-semibold text-[var(--hg-text)]">No events just yet</p>
            <p className="mt-1 text-[12px] text-[var(--hg-dim)]">Check back soon for new hackathons to join.</p>
          </div>
        ) : (
          <div className="mt-6 grid items-stretch gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {hackathons.map((hackathon) =>
              hackathon.type === "live" ? (
                <LiveCodingCard key={hackathon.id} hackathon={hackathon} />
              ) : (
                <HackathonCard
                  key={hackathon.id}
                  hackathon={hackathon}
                  registration={registrations.find(
                    (registration) => registration.hackathonId === hackathon.id,
                  )}
                  onRegister={() => setRegistering(hackathon)}
                  onUnregister={() => handleUnregister(hackathon.id)}
                />
              ),
            )}
          </div>
        )}

        <p className="mt-7 text-center text-[12px] text-[var(--hg-dim)] sm:text-left">
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

function formatEventTime(time: string): string {
  const match = /^([01]\d|2[0-3]):([0-5]\d)$/.exec(time)
  if (!match) return time
  const hours = Number(match[1])
  const minutes = match[2]
  const period = hours >= 12 ? "PM" : "AM"
  return `${hours % 12 || 12}:${minutes} ${period}`
}
