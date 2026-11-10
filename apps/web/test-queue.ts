import { analysisQueue } from "@/lib/queue/analysis-queue";

async function main() {
    const job = await analysisQueue.add(
        "test-job",
        { hackathonId: "test-hackathon" }
    );
    const job2 = await analysisQueue.add(
        "test-job",
        { hackathonId: "hackathon-A" },
        { jobId: "test-hackathon-A" }
    );

    const job3 = await analysisQueue.add(
        "test-job",
        { hackathonId: "hackathon-B" },
        { jobId: "test-hackathon-B" }
    );

    console.log("Job added:", job.id);
    console.log("Job added:", job2.id);
    console.log("Job added:", job3.id);
    

    const waiting = await analysisQueue.getWaiting();
    console.log("Waiting jobs:", waiting.length);
}

main()
    .catch(console.error)
    .finally(async () => {
        await analysisQueue.close();
    });