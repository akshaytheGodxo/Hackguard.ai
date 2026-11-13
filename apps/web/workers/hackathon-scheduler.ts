import { prisma } from "@/lib/prisma";
import { enqueueHackathonAnalysis } from "@/lib/queue/analysis-queue";

async function checkExpiredHackathons() {
    const now = new Date();

    const hackathons = await prisma.hackathon.findMany({
        where: {
            status: {
                in: ["Upcoming", "Live"],
            },
        },
    });

    for (const hackathon of hackathons) {
        const start = new Date(hackathon.date);
        const end = new Date(hackathon.enddate);

        if (hackathon.startTime) {
            const [hours, minutes] = hackathon.startTime
                .split(":")
                .map(Number);

            start.setHours(hours, minutes, 0, 0);
        }

        if (hackathon.endTime) {
            const [hours, minutes] = hackathon.endTime
                .split(":")
                .map(Number);

            end.setHours(hours, minutes, 0, 0);
        } else {
            end.setHours(23, 59, 59, 999);
        }

        const now = new Date();

        // Handle expired hackathons, including those still marked Upcoming.
        if (now >= end) {
            const claimed = await prisma.hackathon.updateMany({
                where: {
                    id: hackathon.id,
                    status: { in: ["Upcoming", "Live"] },
                    analysisStatus: "PENDING",
                },
                data: {
                    status: "Completed",
                    analysisStatus: "QUEUED",
                },
            });

            if (claimed.count === 1) {
                try {
                    const job = await enqueueHackathonAnalysis(hackathon.id);

                    console.log("Analysis job queued:", {
                        jobId: job.id,
                        hackathonId: hackathon.id,
                        queue: "hackathon-analysis",
                    });
                } catch (error) {
                    console.error(
                        `Failed to enqueue analysis for ${hackathon.name}:`,
                        error
                    );
                }
            }

            continue;
        }

        // Upcoming -> Live
        if (hackathon.status === "Upcoming" && now >= start) {
            await prisma.hackathon.updateMany({
                where: {
                    id: hackathon.id,
                    status: "Upcoming",
                },
                data: {
                    status: "Live",
                },
            });
        }
    }
}

async function startScheduler() {
    console.log("Hackathon scheduler started");

    await checkExpiredHackathons();

    setInterval(async () => {
        try {
            await checkExpiredHackathons();
        } catch (error) {
            console.error("Scheduler error:", error);
        }
    }, 60_000);
}

startScheduler();