import type { Metadata } from "next"
import Link from "next/link"
import { ArrowLeft, CalendarDays, FileText, Radio, Trophy, Users, Workflow } from "lucide-react"
import { notFound, redirect } from "next/navigation"
import { DashboardHeader } from "@/components/dashboard/dashboard-header"
import LoadQuestions from "@/components/room/LoadQuestions"
import RoomMatching from "@/components/room/RoomMatching"
import { ProjectSubmissionForm } from "@/components/room/project-submission-form"
import { Metric, PageIntro, StatusPill, type PillTone } from "@/components/ui/app-ui"
import { formatHackathonDate } from "@/lib/api/hackathons"
import { getSession } from "@/lib/auth/session"
import { getProblem } from "@/lib/actions"
import { prisma } from "@/lib/prisma"

export const metadata: Metadata = {
  title: "Room | HackGuard AI",
}

export const dynamic = "force-dynamic"

const statusTone: Record<string, PillTone> = {
  Live: "live",
  Upcoming: "upcoming",
  Completed: "completed",
}

export default async function RoomPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params

  const session = await getSession()
  if (!session) redirect("/sign-in")

  const hackathon = await prisma.hackathon.findUnique({
    where: { id },
    include: { organizer: { select: { name: true } } },
  })
  if (!hackathon) notFound()

  const isLive = hackathon.type === "live"

  const registration =
    hackathon.type === "standard" && session.role === "candidate"
      ? await prisma.registration.findUnique({
          where: {
            hackathonId_userId: {
              hackathonId: hackathon.id,
              userId: session.userId,
            },
          },
          include: {
            members: {
              where: { isLeader: true },
              select: { email: true },
              take: 1,
            },
            projectSubmissions: {
              orderBy: { submittedAt: "desc" },
              select: { githubRepoUrl: true },
              take: 1,
            },
          },
        })
      : null

  const problems = await getProblem(id)

  return (
    <main className="hg-fade-in min-h-screen bg-[var(--hg-bg)]">
      <DashboardHeader session={session} />

      <div className="mx-auto max-w-4xl px-4 py-8 sm:px-6 sm:py-10">
        <Link
          href="/events"
          className="inline-flex items-center gap-1.5 text-[12px] font-medium text-[var(--hg-muted)] transition-colors hover:text-[var(--hg-text)]"
        >
          <ArrowLeft className="size-3.5" /> Back to hackathons
        </Link>

        <PageIntro
          className="mt-6"
          eyebrow={isLive ? "Live room" : "Event room"}
          icon={<Radio className="size-3.5" />}
          title={hackathon.name}
          description={`${formatHackathonDate(hackathon.date)} · hosted by ${hackathon.organizer.name}`}
          actions={
            <StatusPill tone={statusTone[hackathon.status] ?? "neutral"} dot={hackathon.status === "Live"}>
              {hackathon.status}
            </StatusPill>
          }
        >
          <div className="mt-6 grid gap-3 sm:grid-cols-3">
            <Metric label="Participants" value={hackathon.participants} icon={<Users className="size-3.5" />} />
            <Metric label="Submissions" value={hackathon.submissions} icon={<Workflow className="size-3.5" />} />
            <Metric
              label="Format"
              value={isLive ? "1v1 live" : "Standard"}
              icon={<Trophy className="size-3.5" />}
            />
          </div>
          <p className="mt-5 max-w-2xl text-[13px] leading-relaxed text-[var(--hg-muted)]">
            {hackathon.description}
          </p>
        </PageIntro>

        {hackathon.type === "standard" ? (
          <section className="mt-5 rounded-2xl border border-[var(--hg-border)] bg-[var(--hg-surface)] p-5 shadow-[var(--hg-shadow)]">
            <div className="flex items-center gap-2">
              <FileText className="size-4 text-[var(--hg-cyan)]" />
              <h2 className="text-[15px] font-semibold text-[var(--hg-text)]">Problem statement</h2>
            </div>
            <p className="mt-3 whitespace-pre-wrap text-[13px] leading-relaxed text-[var(--hg-muted)]">
              {hackathon.problemStatement || "No problem statement has been published."}
            </p>
          </section>
        ) : null}

        {hackathon.type === "standard" &&
          (registration?.members[0] ? (
            <ProjectSubmissionForm
              hackathonId={hackathon.id}
              registrationId={registration.id}
              teamName={registration.teamName ?? ""}
              teamLeaderEmail={registration.members[0].email}
              githubRepoUrl={registration.projectSubmissions[0]?.githubRepoUrl}
            />
          ) : session.role === "candidate" ? (
            <p className="mt-6 rounded-xl border border-dashed border-[var(--hg-border)] p-5 text-[12px] text-[var(--hg-dim)]">
              Register for this standard hackathon to set up your team and submit a project.
            </p>
          ) : null)}

        <section className="mt-8 overflow-hidden rounded-2xl border border-[var(--hg-border)] bg-[var(--hg-surface)] shadow-[var(--hg-shadow)]">
          <div className="flex flex-wrap items-center justify-between gap-3 border-b border-[var(--hg-border)] bg-[var(--hg-bg)]/60 px-5 py-3.5">
            <div className="flex items-center gap-2">
              <span className="relative flex size-2">
                {hackathon.status === "Live" ? (
                  <span className="absolute inline-flex size-full animate-ping rounded-full bg-red-500 opacity-75" />
                ) : null}
                <span
                  className={`relative inline-flex size-2 rounded-full ${
                    hackathon.status === "Live" ? "bg-red-500" : "bg-[var(--hg-dim)]"
                  }`}
                />
              </span>
              <span className="font-mono text-[11px] font-semibold uppercase tracking-[0.2em] text-[var(--hg-text)]">
                Stage
              </span>
            </div>
            <span className="inline-flex items-center gap-1.5 text-[11px] text-[var(--hg-dim)]">
              <CalendarDays className="size-3.5" />
              {formatHackathonDate(hackathon.date)}
            </span>
          </div>

          <LoadQuestions problems={problems} />
          <div className="px-4 pb-4 sm:px-5 sm:pb-5">
            <RoomMatching roomId={hackathon.id} />
          </div>
        </section>
      </div>
    </main>
  )
}
