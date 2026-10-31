import Link from "next/link";
import type { Problem } from "@prisma/client";

export default function LoadQuestions({
  problems,
}: {
  problems: Problem[] | { error: string }
}) {
  if ("error" in problems) {
    return <p className="p-4 text-sm text-red-400">{problems.error}</p>
  }

  if (problems.length === 0) {
    return <p className="p-4 text-sm text-[var(--hg-dim)]">No problems have been added yet.</p>
  }

  return (
    <div className="p-4">
      {problems.map((problem) => (
        <div key={problem.problemId} className="flex flex-row justify-between">
          <h2 className="font-bold">{problem.name}</h2>
          <Link
            href={`/solve/${problem.problemId}`}
            className="w-20 rounded-md bg-teal-400 py-2 text-center text-sm font-semibold text-black hover:bg-teal-500"
          >
            Solve
          </Link>
        </div>
      ))}
    </div>
  )
}