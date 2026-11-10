
import { Worker } from "bullmq";
import {connection} from "@/lib/queue/connection";
import type { AnalysisJob } from "../lib/queue/analysis-queue";

const worker = new Worker<AnalysisJob>(
    "hackathon-analysis",
    async (job) => {
        const { hackathonId } = job.data;

        console.log(`Starting analysis for: ${hackathonId}`);

        

        console.log(`Analysis completed for: ${hackathonId}`);

        return {
            hackathonId,
            status: "completed",
        };
    },
    {
        connection,
        concurrency: 1,
    }
);

worker.on("completed", (job) => {
    console.log(`Job ${job.id} completed successfully`);
});

worker.on("failed", (job, error) => {
    console.error(`Job ${job?.id} failed:`, error.message);
});

worker.on("error", (error) => {
    console.error("Worker error:", error);
});

console.log("HackGuard analysis worker is running...");
