import Link from "next/link"
import { ArrowUpRight, FileCode2 } from "lucide-react"
import type { Problem } from "@prisma/client"
import { EmptyState, StatusPill } from "@/components/ui/app-ui"

type ProblemsResult = Problem[] | { items: Problem[] } | { error: string }

function normalizeProblems(result: ProblemsResult): Problem[] | null {
  if ("error" in result) return null
  if ("items" in result) return result.items
  return result
}

export default function LoadQuestions({ problems }: { problems: ProblemsResult }) {
  const items = normalizeProblems(problems)

  if (!items) {
    return (
      <div className="px-5 py-8">
        <p className="rounded-lg border border-amber-500/30 bg-amber-500/10 px-3 py-2 text-[12px] font-medium text-amber-300">
          Problems could not be loaded. Try refreshing the page.
        </p>
      </div>
    )
  }

  if (items.length === 0) {
    return (
      <EmptyState
        className="m-4 border-0 bg-transparent py-12"
        icon={<FileCode2 className="size-7" />}
        title="No problems yet"
        description="The organizer hasn't published any challenges for this room."
      />
    )
  }

  return (
    <div className="grid gap-3 p-4 sm:grid-cols-2 sm:p-5">
      {items.map((problem, index) => (
        <article
          key={problem.problemId}
          className="flex min-w-0 flex-col justify-between gap-4 rounded-xl border border-[var(--hg-border)] bg-[var(--hg-bg)]/60 p-4 transition-colors hover:border-[var(--hg-cyan)]/40"
        >
          <div className="flex items-start justify-between gap-3">
            <div className="min-w-0">
              <StatusPill tone="neutral" className="font-mono">
                Problem {String(index + 1).padStart(2, "0")}
              </StatusPill>
              <h2 className="mt-3 break-words text-[14px] font-semibold text-[var(--hg-text)]">
                {problem.name}
              </h2>
              <p className="mt-1.5 line-clamp-2 text-[11px] leading-relaxed text-[var(--hg-muted)]">
                {problem.description}
              </p>
            </div>
          </div>
          <Link
            href={`/solve/${problem.problemId}`}
            className="inline-flex h-9 w-fit items-center gap-1.5 rounded-lg border border-[var(--hg-cyan)]/40 bg-[var(--hg-cyan)]/10 px-3 text-[11px] font-semibold text-[var(--hg-cyan)] transition-colors hover:bg-[var(--hg-cyan)]/20"
          >
            Open editor <ArrowUpRight className="size-3.5" />
          </Link>
        </article>
      ))}
    </div>
  )
}
