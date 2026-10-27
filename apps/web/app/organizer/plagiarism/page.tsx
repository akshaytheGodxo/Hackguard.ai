import type { Metadata } from "next"
import Link from "next/link"
import { redirect } from "next/navigation"
import {
  AlertTriangle,
  ArrowLeft,
  Clock,
  FileCode2,
  GitCompareArrows,
  ShieldAlert,
  ShieldCheck,
} from "lucide-react"
import { DashboardHeader } from "@/components/dashboard/dashboard-header"
import { ROLE_HOME } from "@/lib/auth/roles"
import { getSession } from "@/lib/auth/session"
import { prisma } from "@/lib/prisma"

export const metadata: Metadata = {
  title: "Plagiarism review | HackGuard AI",
}

export const dynamic = "force-dynamic"

function formatSimilarity(value: number) {
  return `${(value * 100).toFixed(1)}%`
}

function riskTone(risk: string) {
  switch (risk.toLowerCase()) {
    case "high":
      return {
        pill: "border-red-500/40 bg-red-500/15 text-red-400",
        bar: "bg-red-500",
        value: "text-red-400",
      }
    case "medium":
      return {
        pill: "border-amber-500/40 bg-amber-500/15 text-amber-300",
        bar: "bg-amber-400",
        value: "text-amber-300",
      }
    default:
      return {
        pill: "border-emerald-500/40 bg-emerald-500/15 text-emerald-400",
        bar: "bg-emerald-500",
        value: "text-emerald-400",
      }
  }
}

function SubmissionPanel({
  label,
  participant,
  submissionId,
  sourceCode,
  language,
}: {
  label: string
  participant: { name: string; email: string }
  submissionId: string
  sourceCode: string
  language: string
}) {
  return (
    <div className="min-w-0 rounded-xl border border-[var(--hg-border)] bg-[var(--hg-bg)]/50">
      <div className="border-b border-[var(--hg-border)] px-4 py-3">
        <p className="font-mono text-[10px] font-semibold uppercase tracking-[0.16em] text-[var(--hg-dim)]">
          {label}
        </p>
        <h3 className="mt-1.5 break-words text-[13px] font-semibold text-[var(--hg-text)]">
          {participant.name}
        </h3>
        <p className="break-all text-[12px] text-[var(--hg-muted)]">{participant.email}</p>
        <p className="mt-1 break-all font-mono text-[10.5px] text-[var(--hg-dim)]">
          {submissionId}
        </p>
      </div>
      <div className="flex items-center gap-1.5 px-4 pt-3 text-[11px] font-semibold text-[var(--hg-muted)]">
        <FileCode2 className="size-3.5 text-[var(--hg-dim)]" />
        Code · {language}
      </div>
      <pre className="m-3 max-h-72 overflow-auto whitespace-pre rounded-lg border border-[var(--hg-border)] bg-[var(--hg-bg)] p-3.5 font-mono text-[11.5px] leading-relaxed text-[var(--hg-text)]">
        {sourceCode}
      </pre>
    </div>
  )
}

export default async function PlagiarismPage() {
  const session = await getSession()
  if (!session) redirect("/sign-in")
  if (session.role !== "organizer") redirect(ROLE_HOME[session.role])

  const reports = await prisma.plagiarismReport.findMany({
    where: {
      AND: [
        {
          targetSubmission: {
            problem: { hackathon: { organizerId: session.userId } },
          },
        },
        {
          candidateSubmission: {
            problem: { hackathon: { organizerId: session.userId } },
          },
        },
      ],
    },
    include: {
      targetSubmission: {
        include: {
          participant: { select: { name: true, email: true } },
          problem: {
            include: { hackathon: { select: { id: true, name: true } } },
          },
        },
      },
      candidateSubmission: {
        include: {
          participant: { select: { name: true, email: true } },
        },
      },
    },
    orderBy: [{ tokenSimilarity: "desc" }, { createdAt: "desc" }],
    take: 100,
  })

  const highRisk = reports.filter((report) => report.riskLevel.toLowerCase() === "high").length
  const mediumRisk = reports.filter((report) => report.riskLevel.toLowerCase() === "medium").length
  const avgSimilarity =
    reports.length === 0
      ? 0
      : reports.reduce((total, report) => total + report.tokenSimilarity, 0) / reports.length

  return (
    <main className="hg-fade-in min-h-screen bg-[var(--hg-bg)]">
      <DashboardHeader session={session} />

      <div className="mx-auto max-w-6xl px-6 py-10">
        <Link
          href="/organizer"
          className="inline-flex items-center gap-1.5 text-[12px] font-medium text-[var(--hg-muted)] transition-colors hover:text-[var(--hg-text)]"
        >
          <ArrowLeft className="size-3.5" /> Back to your hackathons
        </Link>

        <div className="mt-6 flex flex-wrap items-end justify-between gap-4">
          <div>
            <span className="inline-flex items-center gap-1.5 font-mono text-[11px] font-semibold uppercase tracking-[0.2em] text-[var(--hg-cyan)]">
              <ShieldAlert className="size-3.5" /> Integrity
            </span>
            <h1 className="mt-2 text-3xl font-bold text-[var(--hg-text)]">Plagiarism review</h1>
            <p className="mt-1 max-w-2xl text-[13px] text-[var(--hg-muted)]">
              Review similar submissions across your hackathons. Similarity scores are signals for
              investigation, not proof of plagiarism.
            </p>
          </div>

          <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
            <div className="rounded-xl border border-[var(--hg-border)] bg-[var(--hg-surface)] px-4 py-3">
              <p className="text-[10px] font-semibold uppercase tracking-[0.14em] text-[var(--hg-dim)]">
                Reports
              </p>
              <p className="mt-1 text-xl font-bold text-[var(--hg-text)]">{reports.length}</p>
            </div>
            <div className="rounded-xl border border-red-500/25 bg-red-500/5 px-4 py-3">
              <p className="text-[10px] font-semibold uppercase tracking-[0.14em] text-red-400/80">
                High risk
              </p>
              <p className="mt-1 text-xl font-bold text-red-400">{highRisk}</p>
            </div>
            <div className="rounded-xl border border-amber-500/25 bg-amber-500/5 px-4 py-3">
              <p className="text-[10px] font-semibold uppercase tracking-[0.14em] text-amber-300/80">
                Medium risk
              </p>
              <p className="mt-1 text-xl font-bold text-amber-300">{mediumRisk}</p>
            </div>
            <div className="rounded-xl border border-[var(--hg-border)] bg-[var(--hg-surface)] px-4 py-3">
              <p className="text-[10px] font-semibold uppercase tracking-[0.14em] text-[var(--hg-dim)]">
                Avg similarity
              </p>
              <p className="mt-1 text-xl font-bold text-[var(--hg-text)]">
                {formatSimilarity(avgSimilarity)}
              </p>
            </div>
          </div>
        </div>

        {reports.length === 0 ? (
          <div className="mt-10 rounded-xl border border-dashed border-[var(--hg-border)] px-6 py-16 text-center">
            <ShieldCheck className="mx-auto size-8 text-[var(--hg-dim)]" />
            <p className="mt-3 text-[14px] font-semibold text-[var(--hg-text)]">
              No plagiarism reports yet
            </p>
            <p className="mx-auto mt-1 max-w-md text-[12px] text-[var(--hg-dim)]">
              Reports appear here once submissions are compared against other participants&apos;
              code for the same problem.
            </p>
            <Link
              href="/organizer"
              className="mt-5 inline-flex items-center gap-2 rounded-lg border border-[var(--hg-cyan)]/40 bg-[var(--hg-cyan)]/10 px-4 py-2 text-[12px] font-semibold text-[var(--hg-cyan)] transition-colors hover:bg-[var(--hg-cyan)]/20"
            >
              <ArrowLeft className="size-4" />
              Back to your hackathons
            </Link>
          </div>
        ) : (
          <section className="mt-8 space-y-5">
            {reports.map((report) => {
              const target = report.targetSubmission
              const candidate = report.candidateSubmission
              const tone = riskTone(report.riskLevel)
              const similarity = Math.min(100, Math.max(0, report.tokenSimilarity * 100))

              return (
                <article
                  key={report.id}
                  className="overflow-hidden rounded-xl border border-[var(--hg-border)] bg-[var(--hg-surface)] transition-colors hover:border-[var(--hg-border-strong)]"
                >
                  <div className="flex flex-wrap items-start justify-between gap-4 px-5 pt-5">
                    <div className="min-w-0">
                      <p className="font-mono text-[10px] font-semibold uppercase tracking-[0.16em] text-[var(--hg-dim)]">
                        {target.problem.hackathon.name}
                      </p>
                      <h2 className="mt-1 flex items-center gap-2 text-[15px] font-semibold text-[var(--hg-text)]">
                        <GitCompareArrows className="size-4 text-[var(--hg-cyan)]" />
                        {target.problem.name}
                      </h2>
                      <p className="mt-1 inline-flex items-center gap-1 text-[11px] text-[var(--hg-dim)]">
                        <Clock className="size-3" />
                        Analyzed{" "}
                        {new Date(report.createdAt).toLocaleString("en-US", {
                          month: "short",
                          day: "numeric",
                          hour: "numeric",
                          minute: "2-digit",
                        })}
                      </p>
                    </div>

                    <div className="flex items-center gap-4">
                      <div className="text-right">
                        <p className="text-[10px] font-semibold uppercase tracking-[0.14em] text-[var(--hg-dim)]">
                          Similarity
                        </p>
                        <p className={`text-2xl font-bold ${tone.value}`}>
                          {formatSimilarity(report.tokenSimilarity)}
                        </p>
                      </div>
                      <span
                        className={`rounded-full border px-2.5 py-1 text-[11px] font-semibold uppercase tracking-wide ${tone.pill}`}
                      >
                        {report.riskLevel} risk
                      </span>
                    </div>
                  </div>

                  <div className="mx-5 mt-4 h-1 overflow-hidden rounded-full bg-white/5">
                    <div
                      className={`h-full rounded-full ${tone.bar}`}
                      style={{ width: `${similarity}%` }}
                    />
                  </div>

                  <div className="grid gap-4 p-5 md:grid-cols-2">
                    <SubmissionPanel
                      label="Target submission"
                      participant={target.participant}
                      submissionId={target.id}
                      sourceCode={target.sourceCode}
                      language={target.language}
                    />
                    <SubmissionPanel
                      label="Compared submission"
                      participant={candidate.participant}
                      submissionId={candidate.id}
                      sourceCode={candidate.sourceCode}
                      language={candidate.language}
                    />
                  </div>

                  <div className="space-y-3 border-t border-[var(--hg-border)] bg-[var(--hg-bg)]/40 px-5 py-4">
                    <div className="flex flex-wrap gap-2">
                      <span className="rounded-full border border-[var(--hg-border)] bg-[var(--hg-surface)] px-2.5 py-1 font-mono text-[10.5px] text-[var(--hg-muted)]">
                        Matched n-grams:{" "}
                        <strong className="text-[var(--hg-text)]">{report.matchedNgrams}</strong>
                      </span>
                      <span className="rounded-full border border-[var(--hg-border)] bg-[var(--hg-surface)] px-2.5 py-1 font-mono text-[10.5px] text-[var(--hg-muted)]">
                        Language: <strong className="text-[var(--hg-text)]">{target.language}</strong>
                      </span>
                    </div>

                    {report.warnings.length > 0 && (
                      <div className="rounded-lg border border-amber-500/25 bg-amber-500/10 px-3 py-2">
                        <p className="inline-flex items-center gap-1.5 text-[11.5px] font-semibold text-amber-300">
                          <AlertTriangle className="size-3.5" /> Detector warnings
                        </p>
                        <ul className="mt-1 list-inside list-disc space-y-0.5 text-[11.5px] text-amber-300/90">
                          {report.warnings.map((warning, index) => (
                            <li key={`${report.id}-warning-${index}`}>{warning}</li>
                          ))}
                        </ul>
                      </div>
                    )}

                    <p className="text-[11px] leading-5 text-[var(--hg-dim)]">
                      A similarity score alone does not establish misconduct. Review both
                      solutions and consider the problem constraints before taking action.
                    </p>
                  </div>
                </article>
              )
            })}
          </section>
        )}

        {reports.length > 0 && (
          <p className="mt-6 text-[11px] text-[var(--hg-dim)]">
            Showing up to 100 reports, sorted by similarity.
          </p>
        )}
      </div>
    </main>
  )
}