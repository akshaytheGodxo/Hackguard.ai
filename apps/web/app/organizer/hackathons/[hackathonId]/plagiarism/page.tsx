import type { Metadata } from "next"
import Link from "next/link"
import { notFound, redirect } from "next/navigation"
import { ArrowLeft, ShieldAlert } from "lucide-react"
import { RepositoryComparisonDashboard } from "@/components/organizer/repository-comparison-dashboard"
import { DashboardHeader } from "@/components/dashboard/dashboard-header"
import { ROLE_HOME } from "@/lib/auth/roles"
import { getSession } from "@/lib/auth/session"
import { getRepositoryRiskLevel, parseMatchedRepositoryFiles } from "@/lib/repository-plagiarism"
import { prisma } from "@/lib/prisma"

export const metadata: Metadata = {
  title: "Repository plagiarism analysis | HackGuard AI",
}

export const dynamic = "force-dynamic"

function toIsoString(date: Date) {
  return date.toISOString()
}

export default async function RepositoryPlagiarismPage({
  params,
}: {
  params: Promise<{ hackathonId: string }>
}) {
  const { hackathonId } = await params
  const session = await getSession()
  if (!session) redirect("/sign-in")
  if (session.role !== "organizer") redirect(ROLE_HOME[session.role])

  const hackathon = await prisma.hackathon.findFirst({
    where: { id: hackathonId, organizerId: session.userId },
    select: {
      id: true,
      name: true,
      analysisStatus: true,
      analysisCompletedAt: true,
    },
  })
  if (!hackathon) notFound()

  const [submissionCount, reports] = await Promise.all([
    prisma.projectSubmission.count({ where: { hackathonId: hackathon.id } }),
    prisma.repositoryPlagiarismReport.findMany({
      where: {
        hackathonId: hackathon.id,
        submissionA: { is: { hackathonId: hackathon.id } },
        submissionB: { is: { hackathonId: hackathon.id } },
      },
      select: {
        id: true,
        repositorySimilarity: true,
        riskLevel: true,
        matchedFiles: true,
        createdAt: true,
        submissionA: {
          select: { teamName: true, submittedAt: true },
        },
        submissionB: {
          select: { teamName: true, submittedAt: true },
        },
      },
      orderBy: [{ repositorySimilarity: "desc" }, { createdAt: "desc" }],
    }),
  ])

  const comparisons = reports.map((report) => ({
    id: report.id,
    teamA: report.submissionA.teamName,
    teamB: report.submissionB.teamName,
    similarity: report.repositorySimilarity,
    riskLevel: getRepositoryRiskLevel(report.riskLevel),
    matchedFiles: parseMatchedRepositoryFiles(report.matchedFiles).length,
    submittedAtA: toIsoString(report.submissionA.submittedAt),
    submittedAtB: toIsoString(report.submissionB.submittedAt),
  }))

  const statistics = {
    submissions: submissionCount,
    comparisons: comparisons.length,
    highRisk: comparisons.filter((report) => report.riskLevel === "high").length,
    mediumRisk: comparisons.filter((report) => report.riskLevel === "medium").length,
    lowRisk: comparisons.filter((report) => report.riskLevel === "low").length,
    matchedFiles: comparisons.reduce((total, report) => total + report.matchedFiles, 0),
  }

  return (
    <main className="hg-fade-in min-h-screen bg-[var(--hg-bg)]">
      <DashboardHeader session={session} />
      <div className="mx-auto max-w-7xl px-6 py-10">
        <Link
          href="/organizer"
          className="inline-flex items-center gap-1.5 text-[12px] font-medium text-[var(--hg-muted)] transition-colors hover:text-[var(--hg-text)]"
        >
          <ArrowLeft className="size-3.5" /> Back to your hackathons
        </Link>

        <div className="mt-6 flex flex-wrap items-end justify-between gap-4">
          <div>
            <span className="inline-flex items-center gap-1.5 font-mono text-[11px] font-semibold uppercase tracking-[0.2em] text-[var(--hg-cyan)]">
              <ShieldAlert className="size-3.5" /> Repository integrity
            </span>
            <h1 className="mt-2 text-3xl font-bold text-[var(--hg-text)]">{hackathon.name}</h1>
            <p className="mt-1 max-w-2xl text-[13px] text-[var(--hg-muted)]">
              Compare submitted repositories and review similarity signals. A score is not proof
              of plagiarism; use it to guide a closer review.
            </p>
          </div>
          <span className="rounded-full border border-[var(--hg-border)] bg-[var(--hg-surface)] px-3 py-1.5 text-[11px] font-semibold uppercase tracking-wide text-[var(--hg-muted)]">
            Analysis {hackathon.analysisStatus.toLowerCase()}
            {hackathon.analysisCompletedAt
              ? ` · ${new Intl.DateTimeFormat("en-US", {
                  dateStyle: "medium",
                  timeStyle: "short",
                }).format(hackathon.analysisCompletedAt)}`
              : ""}
          </span>
        </div>

        <RepositoryComparisonDashboard
          hackathonId={hackathon.id}
          comparisons={comparisons}
          statistics={statistics}
          analysisStatus={hackathon.analysisStatus}
        />
      </div>
    </main>
  )
}
