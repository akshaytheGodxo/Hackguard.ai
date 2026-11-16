"use client"

import { useMemo, useState } from "react"
import { useRouter } from "next/navigation"
import {
  ArrowDown,
  ArrowUp,
  ChevronRight,
  Files,
  GitCompareArrows,
  Search,
  ShieldAlert,
  ShieldCheck,
  Users,
} from "lucide-react"
import type { RepositoryRiskLevel } from "@/lib/repository-plagiarism"

type Comparison = {
  id: string
  teamA: string
  teamB: string
  similarity: number
  riskLevel: RepositoryRiskLevel
  matchedFiles: number
  submittedAtA: string
  submittedAtB: string
}

type Statistics = {
  submissions: number
  comparisons: number
  highRisk: number
  mediumRisk: number
  lowRisk: number
  matchedFiles: number
}

const riskRows: {
  key: "high" | "medium" | "low"
  label: string
  color: string
}[] = [
  { key: "high", label: "High risk", color: "bg-red-500" },
  { key: "medium", label: "Medium risk", color: "bg-amber-400" },
  { key: "low", label: "Low risk", color: "bg-emerald-500" },
]

const similarityRanges = [
  { label: "0–20%", min: 0, max: 20 },
  { label: "20–40%", min: 20, max: 40 },
  { label: "40–60%", min: 40, max: 60 },
  { label: "60–80%", min: 60, max: 80 },
  { label: "80–100%", min: 80, max: 100 },
]

function formatPercent(value: number) {
  return `${(value * 100).toFixed(1)}%`
}

function formatDate(value: string) {
  return new Intl.DateTimeFormat("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
    timeZone: "UTC",
  }).format(new Date(value))
}

function riskStyle(riskLevel: RepositoryRiskLevel) {
  switch (riskLevel) {
    case "high":
      return "border-red-500/35 bg-red-500/10 text-red-400"
    case "medium":
      return "border-amber-500/35 bg-amber-500/10 text-amber-300"
    case "low":
      return "border-emerald-500/35 bg-emerald-500/10 text-emerald-400"
    default:
      return "border-[var(--hg-border)] bg-[var(--hg-bg)] text-[var(--hg-muted)]"
  }
}

function StatCard({
  label,
  value,
  icon: Icon,
  tone,
}: {
  label: string
  value: number
  icon: typeof Users
  tone: string
}) {
  return (
    <div className="rounded-xl border border-[var(--hg-border)] bg-[var(--hg-surface)] p-4">
      <div className="flex items-center justify-between gap-3">
        <p className="text-[10px] font-semibold uppercase tracking-[0.13em] text-[var(--hg-dim)]">
          {label}
        </p>
        <Icon className={`size-4 ${tone}`} aria-hidden="true" />
      </div>
      <p className="mt-2 text-2xl font-bold tabular-nums text-[var(--hg-text)]">{value}</p>
    </div>
  )
}

export function RepositoryComparisonDashboard({
  hackathonId,
  comparisons,
  statistics,
  analysisStatus,
}: {
  hackathonId: string
  comparisons: Comparison[]
  statistics: Statistics
  analysisStatus: string
}) {
  const router = useRouter()
  const [search, setSearch] = useState("")
  const [riskFilter, setRiskFilter] = useState("all")
  const [sortDescending, setSortDescending] = useState(true)
  const [page, setPage] = useState(0)
  const pageSize = 10

  const filteredComparisons = useMemo(() => {
    const query = search.trim().toLocaleLowerCase()
    return comparisons
      .filter((comparison) => {
        const matchesSearch =
          !query ||
          comparison.teamA.toLocaleLowerCase().includes(query) ||
          comparison.teamB.toLocaleLowerCase().includes(query)
        const matchesRisk = riskFilter === "all" || comparison.riskLevel === riskFilter
        return matchesSearch && matchesRisk
      })
      .sort((a, b) =>
        sortDescending ? b.similarity - a.similarity : a.similarity - b.similarity,
      )
  }, [comparisons, riskFilter, search, sortDescending])

  const pageCount = Math.ceil(filteredComparisons.length / pageSize)
  const visibleComparisons = filteredComparisons.slice(page * pageSize, (page + 1) * pageSize)
  const maxRiskCount = Math.max(statistics.highRisk, statistics.mediumRisk, statistics.lowRisk, 1)
  const similarityCounts = similarityRanges.map((range, index) => ({
    ...range,
    count: comparisons.filter((comparison) => {
      const percent = comparison.similarity * 100
      return index === similarityRanges.length - 1
        ? percent >= range.min && percent <= range.max
        : percent >= range.min && percent < range.max
    }).length,
  }))
  const maxSimilarityCount = Math.max(...similarityCounts.map((range) => range.count), 1)

  function openComparison(id: string) {
    router.push(`/organizer/hackathons/${hackathonId}/plagiarism/${id}`)
  }

  function handleRowKeyDown(event: React.KeyboardEvent<HTMLTableRowElement>, id: string) {
    if (event.key === "Enter" || event.key === " ") {
      event.preventDefault()
      openComparison(id)
    }
  }

  return (
    <div className="mt-8 space-y-6">
      <section aria-label="Hackathon statistics" className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3 2xl:grid-cols-6">
        <StatCard label="Project submissions" value={statistics.submissions} icon={Users} tone="text-[var(--hg-cyan)]" />
        <StatCard label="Repository comparisons" value={statistics.comparisons} icon={GitCompareArrows} tone="text-[var(--hg-cyan)]" />
        <StatCard label="High risk" value={statistics.highRisk} icon={ShieldAlert} tone="text-red-400" />
        <StatCard label="Medium risk" value={statistics.mediumRisk} icon={ShieldAlert} tone="text-amber-300" />
        <StatCard label="Low risk" value={statistics.lowRisk} icon={ShieldCheck} tone="text-emerald-400" />
        <StatCard label="Matched files" value={statistics.matchedFiles} icon={Files} tone="text-[var(--hg-cyan)]" />
      </section>

      <section aria-label="Comparison charts" className="grid gap-4 lg:grid-cols-2">
        <div className="rounded-xl border border-[var(--hg-border)] bg-[var(--hg-surface)] p-5">
          <div>
            <h2 className="text-[14px] font-semibold text-[var(--hg-text)]">Risk distribution</h2>
            <p className="mt-1 text-[11px] text-[var(--hg-dim)]">Comparisons grouped by detected risk level</p>
          </div>
          <div className="mt-5 space-y-4">
            {riskRows.map((risk) => {
              const count =
                risk.key === "high"
                  ? statistics.highRisk
                  : risk.key === "medium"
                    ? statistics.mediumRisk
                    : statistics.lowRisk
              return (
                <div key={risk.key} className="grid grid-cols-[90px_1fr_32px] items-center gap-3">
                  <span className="text-[11px] text-[var(--hg-muted)]">{risk.label}</span>
                  <div
                    className="h-2 overflow-hidden rounded-full bg-white/5"
                    role="img"
                    aria-label={`${count} ${risk.label.toLowerCase()} comparisons`}
                  >
                    <div className={`h-full rounded-full ${risk.color}`} style={{ width: `${(count / maxRiskCount) * 100}%` }} />
                  </div>
                  <span className="text-right font-mono text-[11px] tabular-nums text-[var(--hg-text)]">{count}</span>
                </div>
              )
            })}
          </div>
        </div>

        <div className="rounded-xl border border-[var(--hg-border)] bg-[var(--hg-surface)] p-5">
          <div>
            <h2 className="text-[14px] font-semibold text-[var(--hg-text)]">Similarity distribution</h2>
            <p className="mt-1 text-[11px] text-[var(--hg-dim)]">Share of repository comparisons in each range</p>
          </div>
          <div className="mt-4 flex h-28 items-end justify-around gap-3 border-b border-[var(--hg-border)] px-2">
            {similarityCounts.map((range) => (
              <div key={range.label} className="flex h-full flex-1 flex-col items-center justify-end gap-2">
                <span className="font-mono text-[10px] tabular-nums text-[var(--hg-muted)]">{range.count}</span>
                <div
                  className="w-full max-w-12 rounded-t bg-[var(--hg-cyan)]/75"
                  style={{ height: `${Math.max((range.count / maxSimilarityCount) * 66, range.count ? 5 : 0)}px` }}
                  role="img"
                  aria-label={`${range.count} comparisons with ${range.label} similarity`}
                />
              </div>
            ))}
          </div>
          <div className="mt-2 flex justify-around gap-3 px-2">
            {similarityCounts.map((range) => (
              <span key={range.label} className="flex-1 text-center font-mono text-[9px] text-[var(--hg-dim)]">{range.label}</span>
            ))}
          </div>
        </div>
      </section>

      <section className="overflow-hidden rounded-xl border border-[var(--hg-border)] bg-[var(--hg-surface)]">
        <div className="flex flex-wrap items-center justify-between gap-4 border-b border-[var(--hg-border)] px-5 py-4">
          <div>
            <h2 className="text-[15px] font-semibold text-[var(--hg-text)]">Repository comparisons</h2>
            <p className="mt-1 text-[11px] text-[var(--hg-dim)]">
              {filteredComparisons.length} {filteredComparisons.length === 1 ? "comparison" : "comparisons"}
              {search || riskFilter !== "all" ? " match your filters" : ""}
            </p>
          </div>
          <div className="flex w-full flex-wrap gap-2 sm:w-auto">
            <label className="relative min-w-0 flex-1 sm:w-56 sm:flex-none">
              <Search className="pointer-events-none absolute left-3 top-1/2 size-3.5 -translate-y-1/2 text-[var(--hg-dim)]" aria-hidden="true" />
              <input
                type="search"
                value={search}
                onChange={(event) => {
                  setSearch(event.target.value)
                  setPage(0)
                }}
                placeholder="Search teams"
                aria-label="Search by team name"
                className="h-9 w-full rounded-lg border border-[var(--hg-border)] bg-[var(--hg-bg)] pl-9 pr-3 text-[12px] text-[var(--hg-text)] outline-none placeholder:text-[var(--hg-dim)] focus:border-[var(--hg-cyan)]/50"
              />
            </label>
            <select
              value={riskFilter}
              onChange={(event) => {
                setRiskFilter(event.target.value)
                setPage(0)
              }}
              aria-label="Filter by risk level"
              className="h-9 rounded-lg border border-[var(--hg-border)] bg-[var(--hg-bg)] px-3 text-[12px] text-[var(--hg-text)] outline-none focus:border-[var(--hg-cyan)]/50"
            >
              <option value="all">All risk levels</option>
              <option value="high">High risk</option>
              <option value="medium">Medium risk</option>
              <option value="low">Low risk</option>
              <option value="unknown">Unknown risk</option>
            </select>
          </div>
        </div>

        {comparisons.length === 0 ? (
          <div className="px-6 py-14 text-center">
            <GitCompareArrows className="mx-auto size-8 text-[var(--hg-dim)]" aria-hidden="true" />
            <h3 className="mt-3 text-[14px] font-semibold text-[var(--hg-text)]">
              {analysisStatus === "COMPLETED" ? "No comparisons found" : "No comparison results yet"}
            </h3>
            <p className="mx-auto mt-1 max-w-md text-[12px] leading-relaxed text-[var(--hg-dim)]">
              {analysisStatus === "COMPLETED"
                ? "There are no stored repository comparisons for this hackathon."
                : "Results will appear here after the existing repository analysis finishes. Opening this page does not start or rerun analysis."}
            </p>
          </div>
        ) : filteredComparisons.length === 0 ? (
          <div className="px-6 py-12 text-center text-[12px] text-[var(--hg-dim)]">
            No comparisons match those filters.
          </div>
        ) : (
          <>
            <div className="overflow-x-auto">
              <table className="w-full min-w-[790px] border-collapse text-left">
                <thead>
                  <tr className="border-b border-[var(--hg-border)] bg-[var(--hg-bg)]/50">
                    <th scope="col" className="px-5 py-3 text-[10px] font-semibold uppercase tracking-[0.12em] text-[var(--hg-dim)]">Team A</th>
                    <th scope="col" className="px-5 py-3 text-[10px] font-semibold uppercase tracking-[0.12em] text-[var(--hg-dim)]">Team B</th>
                    <th scope="col" className="px-5 py-3">
                      <button
                        type="button"
                        onClick={() => setSortDescending((value) => !value)}
                        className="inline-flex items-center gap-1 text-[10px] font-semibold uppercase tracking-[0.12em] text-[var(--hg-dim)] hover:text-[var(--hg-text)]"
                      >
                        Similarity
                        {sortDescending ? <ArrowDown className="size-3" /> : <ArrowUp className="size-3" />}
                      </button>
                    </th>
                    <th scope="col" className="px-5 py-3 text-[10px] font-semibold uppercase tracking-[0.12em] text-[var(--hg-dim)]">Risk</th>
                    <th scope="col" className="px-5 py-3 text-[10px] font-semibold uppercase tracking-[0.12em] text-[var(--hg-dim)]">Matched files</th>
                    <th scope="col" className="px-5 py-3 text-[10px] font-semibold uppercase tracking-[0.12em] text-[var(--hg-dim)]">Submitted</th>
                    <th scope="col" className="px-4 py-3"><span className="sr-only">Open comparison</span></th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[var(--hg-border)]">
                  {visibleComparisons.map((comparison) => (
                    <tr
                      key={comparison.id}
                      role="link"
                      tabIndex={0}
                      aria-label={`View comparison between ${comparison.teamA} and ${comparison.teamB}`}
                      onClick={() => openComparison(comparison.id)}
                      onKeyDown={(event) => handleRowKeyDown(event, comparison.id)}
                      className="cursor-pointer outline-none transition-colors hover:bg-white/[0.025] focus-visible:bg-white/[0.04]"
                    >
                      <td className="px-5 py-4 text-[12px] font-medium text-[var(--hg-text)]">{comparison.teamA}</td>
                      <td className="px-5 py-4 text-[12px] font-medium text-[var(--hg-text)]">{comparison.teamB}</td>
                      <td className="px-5 py-4 font-mono text-[12px] font-semibold tabular-nums text-[var(--hg-text)]">{formatPercent(comparison.similarity)}</td>
                      <td className="px-5 py-4">
                        <span className={`inline-flex rounded-full border px-2 py-1 text-[10px] font-semibold uppercase tracking-wide ${riskStyle(comparison.riskLevel)}`}>
                          {comparison.riskLevel}
                        </span>
                      </td>
                      <td className="px-5 py-4 text-[12px] tabular-nums text-[var(--hg-muted)]">{comparison.matchedFiles}</td>
                      <td className="px-5 py-4 text-[11px] text-[var(--hg-muted)]">
                        {formatDate(comparison.submittedAtA)}
                        {formatDate(comparison.submittedAtA) !== formatDate(comparison.submittedAtB)
                          ? ` · ${formatDate(comparison.submittedAtB)}`
                          : ""}
                      </td>
                      <td className="px-4 py-4 text-[var(--hg-dim)]"><ChevronRight className="size-3.5" aria-hidden="true" /></td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            {pageCount > 1 && (
              <div className="flex items-center justify-between border-t border-[var(--hg-border)] px-5 py-3">
                <p className="text-[11px] text-[var(--hg-dim)]">
                  Page {page + 1} of {pageCount}
                </p>
                <div className="flex gap-2">
                  <button
                    type="button"
                    disabled={page === 0}
                    onClick={() => setPage((value) => Math.max(0, value - 1))}
                    className="rounded-md border border-[var(--hg-border)] px-3 py-1.5 text-[11px] text-[var(--hg-muted)] disabled:opacity-40"
                  >
                    Previous
                  </button>
                  <button
                    type="button"
                    disabled={page + 1 >= pageCount}
                    onClick={() => setPage((value) => Math.min(pageCount - 1, value + 1))}
                    className="rounded-md border border-[var(--hg-border)] px-3 py-1.5 text-[11px] text-[var(--hg-muted)] disabled:opacity-40"
                  >
                    Next
                  </button>
                </div>
              </div>
            )}
          </>
        )}
      </section>

      <p className="text-[11px] leading-relaxed text-[var(--hg-dim)]">
        Similarity scores are automated signals for human review, not a finding of misconduct.
      </p>
    </div>
  )
}
