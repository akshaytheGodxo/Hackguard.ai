"use client"

import {
  ArrowUpRight,
  CalendarDays,
  Check,
  Compass,
  Radio,
  Search,
  SlidersHorizontal,
  Trophy,
  UserPlus,
  Users,
  Workflow,
  X,
} from "lucide-react"
import Link from "next/link"
import { useRouter } from "next/navigation"
import { useMemo, useState, useTransition } from "react"
import { DashboardHeader } from "@/components/dashboard/dashboard-header"
import { RegisterModal } from "@/components/events/register-modal"
import { EmptyState, Metric, PageIntro, StatusPill, type PillTone } from "@/components/ui/app-ui"
import { unregisterFromHackathon } from "@/lib/actions"
import {
  MAX_TEAM_SIZE,
  type Hackathon,
  type RegistrationView,
} from "@/lib/api/hackathons"
import type { SessionView } from "@/lib/auth/session"

type Filter = "all" | "live" | "standard" | "registered"
type Sort = "newest" | "start"

const statusTone: Record<Hackathon["status"], PillTone> = {
  Live: "live",
  Upcoming: "upcoming",
  Completed: "completed",
}

const filters: { value: Filter; label: string }[] = [
  { value: "all", label: "All events" },
  { value: "live", label: "Live arenas" },
  { value: "standard", label: "Standard" },
  { value: "registered", label: "My teams" },
]

function formatEventTime(time: string): string {
  const match = /^([01]\d|2[0-3]):([0-5]\d)$/.exec(time)
  if (!match) return time
  const hours = Number(match[1])
  const period = hours >= 12 ? "PM" : "AM"
  return `${hours % 12 || 12}:${match[2]} ${period}`
}

function EventCard({
  hackathon,
  registration,
  busy,
  onRegister,
  onUnregister,
}: {
  hackathon: Hackathon
  registration?: RegistrationView
  busy: boolean
  onRegister: () => void
  onUnregister: () => void
}) {
  const isLive = hackathon.type === "live"
  const closed = hackathon.status === "Completed"
  const registered = Boolean(registration)
  const schedule = hackathon.startTime
    ? `${hackathon.date}${hackathon.endTime ? ` · ${formatEventTime(hackathon.startTime)}–${formatEventTime(hackathon.endTime)}` : ""}`
    : hackathon.date

  return (
    <article className="group relative flex min-w-0 flex-col overflow-hidden rounded-2xl border border-[var(--hg-border)] bg-[var(--hg-surface)] p-5 transition-all duration-200 hover:-translate-y-0.5 hover:border-[var(--hg-cyan)]/40 hover:shadow-[0_20px_50px_rgba(0,0,0,0.22)]">
      <div
        className={`pointer-events-none absolute inset-x-0 top-0 h-px opacity-70 ${isLive ? "bg-[linear-gradient(90deg,transparent,rgba(52,211,153,0.7),transparent)]" : "bg-[linear-gradient(90deg,transparent,rgba(105,228,231,0.55),transparent)]"}`}
      />
      <div className="flex items-start justify-between gap-3">
        <div className="flex min-w-0 flex-wrap items-center gap-2">
          <StatusPill tone={isLive ? "live" : "neutral"} dot={isLive}>
            {isLive ? "1v1 live" : "Standard"}
          </StatusPill>
          <StatusPill tone={statusTone[hackathon.status]}>{hackathon.status}</StatusPill>
        </div>
        {registered ? (
          <span className="inline-flex shrink-0 items-center gap-1 rounded-full border border-emerald-500/30 bg-emerald-500/10 px-2 py-1 text-[10px] font-semibold text-emerald-400">
            <Check className="size-3" /> Joined
          </span>
        ) : null}
      </div>

      <h2 className="mt-4 text-[16px] font-semibold leading-snug text-[var(--hg-text)]">
        {hackathon.name}
      </h2>

      <div className="mt-3 flex flex-wrap items-center gap-x-4 gap-y-2 text-[11px] text-[var(--hg-dim)]">
        <span className="inline-flex items-center gap-1.5">
          <CalendarDays className="size-3.5 text-[var(--hg-cyan)]" />
          {schedule}
        </span>
        <span className="inline-flex items-center gap-1.5">
          <Trophy className="size-3.5" />
          {hackathon.organizer}
        </span>
      </div>

      <p className="mt-4 line-clamp-3 flex-1 text-[12px] leading-relaxed text-[var(--hg-muted)]">
        {hackathon.description}
      </p>

      <div className="mt-5 grid grid-cols-2 gap-3 border-t border-[var(--hg-border)] pt-4">
        <div className="flex items-center gap-2 text-[11px] text-[var(--hg-muted)]">
          <span className="grid size-7 place-items-center rounded-lg bg-white/5 text-[var(--hg-dim)]">
            <Users className="size-3.5" />
          </span>
          <span>
            <strong className="text-[13px] font-semibold text-[var(--hg-text)]">
              {hackathon.participants}
            </strong>{" "}
            participants
          </span>
        </div>
        <div className="flex items-center gap-2 text-[11px] text-[var(--hg-muted)]">
          <span className="grid size-7 place-items-center rounded-lg bg-white/5 text-[var(--hg-dim)]">
            <Workflow className="size-3.5" />
          </span>
          <span>
            <strong className="text-[13px] font-semibold text-[var(--hg-text)]">
              {hackathon.submissions}
            </strong>{" "}
            submissions
          </span>
        </div>
      </div>

      <div className="mt-4 flex flex-wrap items-center justify-between gap-3">
        {registration ? (
          <span className="min-w-0 truncate text-[11px] text-[var(--hg-muted)]">
            Team{" "}
            <strong className="font-semibold text-[var(--hg-text)]">
              {registration.teamName || "Unnamed"}
            </strong>
            {registration.members.length > 1
              ? ` · ${registration.members.length}/${MAX_TEAM_SIZE}`
              : ""}
          </span>
        ) : (
          <span className="text-[11px] text-[var(--hg-dim)]">
            {isLive ? "Solo arena · no team needed" : `Teams up to ${MAX_TEAM_SIZE}`}
          </span>
        )}

        <div className="ml-auto flex items-center gap-2">
          {isLive ? (
            <Link
              href={`/rooms/${hackathon.id}`}
              className="hg-gradient-bg inline-flex h-9 items-center gap-1.5 rounded-lg px-3.5 text-[12px] font-bold text-[#101426] shadow-[0_10px_24px_rgba(105,228,231,0.16)] transition-all hover:-translate-y-px hover:brightness-105"
            >
              <Radio className="size-3.5" />
              {hackathon.status === "Live" ? "Enter arena" : "View room"}
              <ArrowUpRight className="size-3.5" />
            </Link>
          ) : (
            <>
              {registered && !closed ? (
                <Link
                  href={`/rooms/${hackathon.id}`}
                  className="inline-flex h-9 items-center gap-1.5 rounded-lg border border-[var(--hg-cyan)]/40 bg-[var(--hg-cyan)]/10 px-3 text-[11px] font-semibold text-[var(--hg-cyan)] transition-colors hover:bg-[var(--hg-cyan)]/20"
                >
                  Open room <ArrowUpRight className="size-3.5" />
                </Link>
              ) : null}
              {registered ? (
                <button
                  type="button"
                  onClick={onUnregister}
                  disabled={busy || closed}
                  className="h-9 rounded-lg border border-[var(--hg-border-strong)] px-3 text-[11px] font-semibold text-[var(--hg-muted)] transition-colors hover:border-red-500/40 hover:bg-red-500/10 hover:text-red-400 disabled:cursor-not-allowed disabled:opacity-40"
                >
                  Cancel team
                </button>
              ) : (
                <button
                  type="button"
                  onClick={onRegister}
                  disabled={closed}
                  className="hg-gradient-bg inline-flex h-9 items-center gap-1.5 rounded-lg px-3.5 text-[12px] font-bold text-[#101426] transition-all hover:-translate-y-px hover:brightness-105 disabled:cursor-not-allowed disabled:opacity-40"
                >
                  {closed ? (
                    "Closed"
                  ) : (
                    <>
                      <UserPlus className="size-3.5" /> Register
                    </>
                  )}
                </button>
              )}
            </>
          )}
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
  const [filter, setFilter] = useState<Filter>("all")
  const [query, setQuery] = useState("")
  const [sort, setSort] = useState<Sort>("newest")

  const registrationMap = useMemo(
    () => new Map(registrations.map((item) => [item.hackathonId, item])),
    [registrations],
  )

  const visibleHackathons = useMemo(() => {
    const normalizedQuery = query.trim().toLocaleLowerCase()
    const result = hackathons.filter((hackathon) => {
      const matchesFilter =
        filter === "all" ||
        (filter === "registered" && registrationMap.has(hackathon.id)) ||
        hackathon.type === filter
      const matchesQuery =
        !normalizedQuery ||
        [hackathon.name, hackathon.description, hackathon.organizer, hackathon.status]
          .join(" ")
          .toLocaleLowerCase()
          .includes(normalizedQuery)
      return matchesFilter && matchesQuery
    })

    if (sort === "start") {
      result.sort((a, b) => {
        const aTime = a.startAt ? Date.parse(a.startAt) : Number.POSITIVE_INFINITY
        const bTime = b.startAt ? Date.parse(b.startAt) : Number.POSITIVE_INFINITY
        return aTime - bTime
      })
    }
    return result
  }, [filter, hackathons, query, registrationMap, sort])

  const liveCount = hackathons.filter((hackathon) => hackathon.type === "live").length

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
        <PageIntro
          eyebrow="Discover"
          icon={<Compass className="size-3.5" />}
          title="Find your next hackathon"
          description="Explore upcoming challenges, enter live arenas, and build something worth shipping."
        >
          <div className="mt-6 grid gap-3 sm:grid-cols-3">
            <Metric label="Events available" value={hackathons.length} icon={<Compass className="size-3.5" />} />
            <Metric label="Live arenas" value={liveCount} icon={<Radio className="size-3.5" />} />
            <Metric
              label="Your teams"
              value={registrations.length}
              icon={<Users className="size-3.5" />}
            />
          </div>
        </PageIntro>

        <section className="mt-5 rounded-2xl border border-[var(--hg-border)] bg-[var(--hg-surface)]/70 p-3 sm:p-4">
          <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
            <label className="relative min-w-0 flex-1">
              <Search
                className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-[var(--hg-dim)]"
                aria-hidden="true"
              />
              <input
                type="search"
                value={query}
                onChange={(event) => setQuery(event.target.value)}
                placeholder="Search events, organizers, or status…"
                aria-label="Search hackathons"
                className="h-10 w-full min-w-0 rounded-lg border border-[var(--hg-border-strong)] bg-[var(--hg-bg)] pl-10 pr-3 text-[12px] text-[var(--hg-text)] outline-none transition-colors placeholder:text-[var(--hg-dim)] focus:border-[var(--hg-cyan)]/50 focus-visible:ring-2 focus-visible:ring-[var(--hg-cyan)]/15"
              />
            </label>
            <label className="flex items-center gap-2 text-[11px] font-semibold text-[var(--hg-dim)]">
              <SlidersHorizontal className="size-3.5" />
              <span className="sr-only sm:not-sr-only">Sort</span>
              <select
                value={sort}
                onChange={(event) => setSort(event.target.value as Sort)}
                aria-label="Sort events"
                className="h-10 rounded-lg border border-[var(--hg-border-strong)] bg-[var(--hg-bg)] px-3 text-[12px] text-[var(--hg-muted)] outline-none focus:border-[var(--hg-cyan)]/50"
              >
                <option value="newest">Newest first</option>
                <option value="start">Starting soonest</option>
              </select>
            </label>
          </div>
          <div className="mt-3 flex flex-wrap gap-2 border-t border-[var(--hg-border)] pt-3">
            {filters.map((item) => (
              <button
                key={item.value}
                type="button"
                onClick={() => setFilter(item.value)}
                aria-pressed={filter === item.value}
                className={`rounded-full border px-3 py-1.5 text-[11px] font-semibold transition-colors ${
                  filter === item.value
                    ? "border-[var(--hg-cyan)]/50 bg-[var(--hg-cyan)]/10 text-[var(--hg-cyan)]"
                    : "border-[var(--hg-border)] bg-[var(--hg-bg)]/50 text-[var(--hg-muted)] hover:border-[var(--hg-cyan)]/30 hover:text-[var(--hg-text)]"
                }`}
              >
                {item.label}
              </button>
            ))}
            {(filter !== "all" || query) && (
              <button
                type="button"
                onClick={() => {
                  setFilter("all")
                  setQuery("")
                }}
                className="inline-flex items-center gap-1 rounded-full px-2 py-1.5 text-[11px] font-semibold text-[var(--hg-dim)] transition-colors hover:text-[var(--hg-text)]"
              >
                <X className="size-3" /> Clear
              </button>
            )}
          </div>
        </section>

        {hackathons.length === 0 ? (
          <EmptyState
            className="mt-6"
            icon={<Compass className="size-7" />}
            title="No events just yet"
            description="Check back soon — organizers are preparing new challenges and live arenas."
          />
        ) : visibleHackathons.length === 0 ? (
          <EmptyState
            className="mt-6"
            icon={<Search className="size-7" />}
            title="No events match your filters"
            description="Try a different search term or clear the filters to see everything."
            action={
              <button
                type="button"
                onClick={() => {
                  setFilter("all")
                  setQuery("")
                }}
                className="rounded-lg border border-[var(--hg-cyan)]/40 bg-[var(--hg-cyan)]/10 px-4 py-2 text-[12px] font-semibold text-[var(--hg-cyan)] transition-colors hover:bg-[var(--hg-cyan)]/20"
              >
                Clear filters
              </button>
            }
          />
        ) : (
          <div className="mt-6 grid items-stretch gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {visibleHackathons.map((hackathon) => (
              <EventCard
                key={hackathon.id}
                hackathon={hackathon}
                registration={registrationMap.get(hackathon.id)}
                busy={pending}
                onRegister={() => setRegistering(hackathon)}
                onUnregister={() => handleUnregister(hackathon.id)}
              />
            ))}
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

      {registering ? (
        <RegisterModal hackathon={registering} onClose={() => setRegistering(null)} />
      ) : null}
    </main>
  )
}
