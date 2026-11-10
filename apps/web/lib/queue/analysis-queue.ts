import {Queue} from "bullmq"
import { connection } from "./connection"

export interface AnalysisJob{
    hackathonId: string;
}

export const analysisQueue = new Queue<AnalysisJob>(
    "hackathon-analysis",
    {
        connection,
        defaultJobOptions: {
            attempts: 3,
            backoff: {
                type: "exponential",
                delay: 5000,
            },
            removeOnComplete: {
                count: 500,
            },
            removeOnFail: false,
        },
    }
);

export async function enqueueHackathonAnalysis(
    hackathonId: string
) {
    return analysisQueue.add(
        "analyze-repository",
        { hackathonId },
        {
            jobId: `hackathon-${hackathonId}`,
        }
    );
}