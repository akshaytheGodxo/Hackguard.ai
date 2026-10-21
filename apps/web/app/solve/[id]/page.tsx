import type { Metadata } from "next"
import { notFound, redirect } from "next/navigation"
import { SolveView } from "@/components/solve/solve-view"
import { getProblemWithTestcase } from "@/lib/actions"
import { getSession } from "@/lib/auth/session"

export const metadata: Metadata = {
  title: "Solve | HackGuard AI",
}

export const dynamic = "force-dynamic"

export default async function SolvePage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params

  if (!(await getSession())) redirect("/sign-in")

  const problem = await getProblemWithTestcase(id)
  if (!problem || "error" in problem) notFound()

  return (
    <SolveView
      problem={{
        id: problem.problemId,
        name: problem.name,
        description: problem.description,
        hackathonId: problem.hackathonId,
        eventName: problem.hackathon.name,
        examples: problem.testcases.map((testCase) => ({
          id: testCase.tid,
          input: testCase.input,
          output: testCase.output,
        })),
      }}
    />
  )
}