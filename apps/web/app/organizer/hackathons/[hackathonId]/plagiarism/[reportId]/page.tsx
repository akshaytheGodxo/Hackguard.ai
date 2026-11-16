import type { Metadata } from "next"
import Link from "next/link"
import { notFound, redirect } from "next/navigation"
import {
  ArrowLeft,
  ExternalLink,
  FileCode2,
  GitCompareArrows,
  ShieldAlert,
} from "lucide-react"
import { DashboardHeader } from "@/components/dashboard/dashboard-header"
import { ROLE_HOME } from "@/lib/auth/roles"
import { getSession } from "@/lib/auth/session"
import { getRepositoryRiskLevel, parseMatchedRepositoryFiles } from "@/lib/repository-plagiarism"
import { prisma } from "@/lib/prisma"

export const metadata: Metadata = {
  title: "Repository comparison | HackGuard AI",
}

export const dynamic = "force-dynamic"

function formatPercent(value: number) {
  return `${(value * 100).toFixed(1)}%`
}

function riskStyle(risk: ReturnType<typeof getRepositoryRiskLevel>) {
  switch (risk) {
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

export default async function RepositoryComparisonPage({
  params,
}: {
  params: Promise<{ hackathonId: string; reportId: string }>
}) {
  const { hackathonId, reportId } = await params
  const session = await getSession()
  if (!session) redirect("/sign-in")
  if (session.role !== "organizer") redirect(ROLE_HOME[session.role])

  const hackathon = await prisma.hackathon.findFirst({
    where: { id: hackathonId, organizerId: session.userId },
    select: { id: true, name: true },
  })
  if (!hackathon) notFound()

  const report = await prisma.repositoryPlagiarismReport.findFirst({
    where: {
      id: reportId,
      hackathonId: hackathon.id,
      submissionA: { is: { hackathonId: hackathon.id } },
      submissionB: { is: { hackathonId: hackathon.id } },
    },
    include: {
      submissionA: {
        select: { teamName: true, githubRepoUrl: true, submittedAt: true },
      },
      submissionB: {
        select: { teamName: true, githubRepoUrl: true, submittedAt: true },
      },
    },
  })
  if (!report) notFound()

  const matchedFiles = parseMatchedRepositoryFiles(report.matchedFiles)
  const riskLevel = getRepositoryRiskLevel(report.riskLevel)
  const similarity = Math.min(100, Math.max(0, report.repositorySimilarity * 100))

  return (
    <main className="hg-fade-in min-h-screen bg-[var(--hg-bg)]">
      <DashboardHeader session={session} />
      <div className="mx-auto max-w-5xl px-6 py-10">
        <Link
          href={`/organizer/hackathons/${hackathon.id}/plagiarism`}
          className="inline-flex items-center gap-1.5 text-[12px] font-medium text-[var(--hg-muted)] transition-colors hover:text-[var(--hg-text)]"
        >
          <ArrowLeft className="size-3.5" /> Back to analysis
        </Link>

        <div className="mt-6">
          <span className="inline-flex items-center gap-1.5 font-mono text-[11px] font-semibold uppercase tracking-[0.2em] text-[var(--hg-cyan)]">
            <ShieldAlert className="size-3.5" /> {hackathon.name}
          </span>
          <h1 className="mt-2 text-3xl font-bold text-[var(--hg-text)]">Repository comparison</h1>
          <p className="mt-1 text-[13px] text-[var(--hg-muted)]">
            Review the stored file-level matches for these two submissions.
          </p>
        </div>

        <section className="mt-7 rounded-xl border border-[var(--hg-border)] bg-[var(--hg-surface)]">
          <div className="flex flex-wrap items-start justify-between gap-5 border-b border-[var(--hg-border)] p-5">
            <div className="flex min-w-0 flex-1 flex-wrap items-center gap-4">
              <div className="min-w-[180px] flex-1">
                <p className="font-mono text-[10px] font-semibold uppercase tracking-[0.15em] text-[var(--hg-dim)]">Team A</p>
                <h2 className="mt-1 break-words text-[17px] font-semibold text-[var(--hg-text)]">{report.submissionA.teamName}</h2>
                <a
                  href={report.submissionA.githubRepoUrl}
                  target="_blank"
                  rel="noreferrer"
                  className="mt-2 inline-flex max-w-full items-center gap-1.5 break-all text-[11px] text-[var(--hg-cyan)] hover:underline"
                >
                  {report.submissionA.githubRepoUrl}<ExternalLink className="size-3 shrink-0" />
                </a>
              </div>
              <GitCompareArrows className="size-5 text-[var(--hg-dim)]" aria-hidden="true" />
              <div className="min-w-[180px] flex-1">
                <p className="font-mono text-[10px] font-semibold uppercase tracking-[0.15em] text-[var(--hg-dim)]">Team B</p>
                <h2 className="mt-1 break-words text-[17px] font-semibold text-[var(--hg-text)]">{report.submissionB.teamName}</h2>
                <a
                  href={report.submissionB.githubRepoUrl}
                  target="_blank"
                  rel="noreferrer"
                  className="mt-2 inline-flex max-w-full items-center gap-1.5 break-all text-[11px] text-[var(--hg-cyan)] hover:underline"
                >
                  {report.submissionB.githubRepoUrl}<ExternalLink className="size-3 shrink-0" />
                </a>
              </div>
            </div>
            <div className="flex items-center gap-4">
              <div className="text-right">
                <p className="text-[10px] font-semibold uppercase tracking-[0.13em] text-[var(--hg-dim)]">Repository similarity</p>
                <p className="mt-1 text-2xl font-bold tabular-nums text-[var(--hg-text)]">{formatPercent(report.repositorySimilarity)}</p>
              </div>
              <span className={`rounded-full border px-2.5 py-1 text-[10px] font-semibold uppercase tracking-wide ${riskStyle(riskLevel)}`}>
                {riskLevel} risk
              </span>
            </div>
          </div>

          <div
            className="h-1 overflow-hidden bg-[var(--hg-bg)]"
            role="img"
            aria-label={`Repository similarity ${formatPercent(report.repositorySimilarity)}`}
          >
            <div className="h-full rounded-r bg-[var(--hg-cyan)]" style={{ width: `${similarity}%` }} />
          </div>

          <div className="grid gap-px bg-[var(--hg-border)] sm:grid-cols-3">
            <div className="bg-[var(--hg-surface)] px-5 py-4">
              <p className="text-[10px] font-semibold uppercase tracking-[0.12em] text-[var(--hg-dim)]">Files analyzed · Team A</p>
              <p className="mt-1 text-[16px] font-semibold tabular-nums text-[var(--hg-text)]">{report.filesAnalyzedA}</p>
            </div>
            <div className="bg-[var(--hg-surface)] px-5 py-4">
              <p className="text-[10px] font-semibold uppercase tracking-[0.12em] text-[var(--hg-dim)]">Files analyzed · Team B</p>
              <p className="mt-1 text-[16px] font-semibold tabular-nums text-[var(--hg-text)]">{report.filesAnalyzedB}</p>
            </div>
            <div className="bg-[var(--hg-surface)] px-5 py-4">
              <p className="text-[10px] font-semibold uppercase tracking-[0.12em] text-[var(--hg-dim)]">Matched files</p>
              <p className="mt-1 text-[16px] font-semibold tabular-nums text-[var(--hg-text)]">{matchedFiles.length}</p>
            </div>
          </div>

          <div className="p-5">
            <div className="flex flex-wrap items-end justify-between gap-2">
              <div>
                <h2 className="text-[14px] font-semibold text-[var(--hg-text)]">Matched files</h2>
                <p className="mt-1 text-[11px] text-[var(--hg-dim)]">
                  File-level similarity is provided by the repository analyzer; source code and line matches are not stored.
                </p>
              </div>
              <span className="text-[11px] text-[var(--hg-dim)]">
                Submitted {new Intl.DateTimeFormat("en-US", { dateStyle: "medium" }).format(report.submissionA.submittedAt)}
                {report.submissionA.submittedAt.toDateString() !== report.submissionB.submittedAt.toDateString()
                  ? ` · ${new Intl.DateTimeFormat("en-US", { dateStyle: "medium" }).format(report.submissionB.submittedAt)}`
                  : ""}
              </span>
            </div>

            {matchedFiles.length === 0 ? (
              <div className="mt-4 rounded-lg border border-dashed border-[var(--hg-border)] px-5 py-10 text-center">
                <FileCode2 className="mx-auto size-6 text-[var(--hg-dim)]" aria-hidden="true" />
                <p className="mt-2 text-[12px] font-medium text-[var(--hg-muted)]">No matched files were stored for this comparison.</p>
              </div>
            ) : (
              <div className="mt-4 space-y-2">
                {matchedFiles.map((file, index) => (
                  <article
                    key={`${file.fileA}-${file.fileB}-${index}`}
                    className="grid gap-3 rounded-lg border border-[var(--hg-border)] bg-[var(--hg-bg)]/50 p-4 md:grid-cols-[1fr_auto_1fr_auto]"
                  >
                    <div className="min-w-0">
                      <p className="font-mono text-[9px] font-semibold uppercase tracking-[0.12em] text-[var(--hg-dim)]">{report.submissionA.teamName}</p>
                      <p className="mt-1 break-all font-mono text-[11px] leading-relaxed text-[var(--hg-text)]">{file.fileA}</p>
                    </div>
                    <GitCompareArrows className="hidden size-4 self-center text-[var(--hg-dim)] md:block" aria-hidden="true" />
                    <div className="min-w-0">
                      <p className="font-mono text-[9px] font-semibold uppercase tracking-[0.12em] text-[var(--hg-dim)]">{report.submissionB.teamName}</p>
                      <p className="mt-1 break-all font-mono text-[11px] leading-relaxed text-[var(--hg-text)]">{file.fileB}</p>
                    </div>
                    <div className="flex items-center gap-2 text-[11px] text-[var(--hg-muted)] md:flex-col md:items-end md:justify-center md:gap-0">
                      <span>{file.language}</span>
                      <strong className="font-mono tabular-nums text-[var(--hg-text)]">{formatPercent(file.similarity)}</strong>
                    </div>
                  </article>
                ))}
              </div>
            )}
          </div>
        </section>
        <p className="mt-5 text-[11px] leading-relaxed text-[var(--hg-dim)]">
          Similarity is an indicator for human review, not proof of misconduct. Confirm context before taking action.
        </p>
      </div>
    </main>
  )
}
