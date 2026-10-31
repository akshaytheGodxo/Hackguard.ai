import type { Metadata } from "next"
import { notFound, redirect } from "next/navigation"
import { SolveView } from "@/components/solve/solve-view"
import { getProblemWithTestcase } from "@/lib/actions"
import { getSession } from "@/lib/auth/session"
import { prisma } from "@/lib/prisma"

export const metadata: Metadata = {
  title: "Solve | HackGuard AI",
}

export const dynamic = "force-dynamic"

export default async function SolvePage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params

  const session = await getSession()
  if (!session) redirect("/sign-in")

  const problem = await getProblemWithTestcase(id)
  if (!problem || "error" in problem) notFound()

  const registration =
    problem.hackathon.type === "standard"
      ? await prisma.registration.findUnique({
          where: {
            hackathonId_userId: {
              hackathonId: problem.hackathonId,
              userId: session.userId,
            },
          },
          select: { id: true },
        })
      : null

  return (
    <SolveView
      problem={{
        id: problem.problemId,
        name: problem.name,
        description: problem.description,
        hackathonId: problem.hackathonId,
        eventName: problem.hackathon.name,
        registrationId: registration?.id,
        examples: problem.testcases.map((testCase) => ({
          id: testCase.tid,
          input: testCase.input,
          output: testCase.output,
        })),
      }}
    />
  )
}