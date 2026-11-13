import { analysisQueue } from "@/lib/queue/analysis-queue";

async function main() {
    const waiting = await analysisQueue.getWaiting();
    const active = await analysisQueue.getActive();
    const completed = await analysisQueue.getCompleted();
    const failed = await analysisQueue.getFailed();

    console.log({
        waiting: waiting.map(job => ({
            id: job.id,
            data: job.data,
        })),
        active: active.map(job => job.data),
        completed: completed.map(job => job.data),
        failed: failed.map(job => ({
            data: job.data,
            error: job.failedReason,
        })),
    });
}

main().finally(() => analysisQueue.close());