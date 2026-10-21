"use client";
import { Button } from "../ui/button";
import { redirect } from "next/navigation";
import type { Problem } from "@prisma/client";
export default function LoadQuestions({problems} : {problems:Problem | null}) {
    return (
        <div className="p-4">

            {problems.map((problem)=>(
                <div key={problem.problemId} className="flex flex-row   justify-between">
                    
                    <h2 className="font-bold">{problem.name}</h2>
                    <Button className="w-20 rounded-md bg-teal-400 hover:bg-teal-900" onClick={() => redirect(`/solve/${problem.problemId}`)}>Solve</Button>
                </div>
            ))}
        </div>
    )
}