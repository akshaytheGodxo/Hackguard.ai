
import { Worker } from "bullmq";
import { connection } from "@/lib/queue/connection";
import type { AnalysisJob } from "../lib/queue/analysis-queue";
import { prisma } from "@/lib/prisma";
import { Prisma } from "@prisma/client";
import { readFile } from "fs/promises";
import { resolve, sep, basename } from "path";

const API_URL = (
    process.env.PLAGIARISM_ENGINE_URL || "http://127.0.0.1:8000"
).replace(/\/$/, "");

const UPLOAD_ROOT = resolve(process.cwd(), "uploads");

interface RepositoryAnalysisResponse {
    repository_similarity: number;
    risk_level: string;
    files_analyzed: {
        repository_a: number;
        repository_b: number;
    };
    matched_files: unknown[];
}

async function analyzePair(
    fileA: string,
    fileB: string
): Promise<RepositoryAnalysisResponse> {
    const [bytesA, bytesB] = await Promise.all([
        readFile(fileA),
        readFile(fileB),
    ]);

    const formData = new FormData();

    formData.append(
        "repository_a",
        new Blob([new Uint8Array(bytesA)]),
        basename(fileA)
    );

    formData.append(
        "repository_b",
        new Blob([new Uint8Array(bytesB)]),
        basename(fileB)
    );

    const response = await fetch(
        `${API_URL}/analyze/repository`,
        {
            method: "POST",
            body: formData,
        }
    );

    if (!response.ok) {
        const errorText = await response.text();
        throw new Error(
            `FastAPI error (${response.status}): ${errorText}`
        );
    }

    const result =
        await response.json() as RepositoryAnalysisResponse;

    if (
        typeof result.repository_similarity !== "number" ||
        !result.files_analyzed ||
        !Array.isArray(result.matched_files)
    ) {
        throw new Error("Invalid response from plagiarism engine");
    }

    return result;
}

function getStoragePath(key: string): string {
    const filePath = resolve(UPLOAD_ROOT, key);

    // Prevent paths from escaping the uploads directory.
    if (!filePath.startsWith(UPLOAD_ROOT + sep)) {
        throw new Error(`Invalid ZIP storage key: ${key}`);
    }

    return filePath;
}

const worker = new Worker<AnalysisJob>(
    "hackathon-analysis",
    async (job) => {
        const { hackathonId } = job.data;

        console.log(`Starting analysis for: ${hackathonId}`);

        await prisma.hackathon.update({
            where: { id: hackathonId },
            data: {
                analysisStatus: "PROCESSING",
                analysisStartedAt: new Date(),
                analysisCompletedAt: null,
            },
        });

        const submissions = await prisma.projectSubmission.findMany({
            where: { hackathonId },
            orderBy: { id: "asc" },
            select: {
                id: true,
                projectZipKey: true,
            },
        });

        let comparisons = 0;

        for (let i = 0; i < submissions.length; i++) {
            for (let j = i + 1; j < submissions.length; j++) {
                const submissionA = submissions[i];
                const submissionB = submissions[j];

                console.log(
                    `Comparing ${submissionA.id} with ${submissionB.id}`
                );

                const fileA = getStoragePath(
                    submissionA.projectZipKey
                );

                const fileB = getStoragePath(
                    submissionB.projectZipKey
                );

                const result = await analyzePair(fileA, fileB);

                await prisma.repositoryPlagiarismReport.upsert({
                    where: {
                        submissionAId_submissionBId: {
                            submissionAId: submissionA.id,
                            submissionBId: submissionB.id,
                        },
                    },
                    create: {
                        hackathonId,
                        submissionAId: submissionA.id,
                        submissionBId: submissionB.id,
                        repositorySimilarity:
                            result.repository_similarity,
                        riskLevel: result.risk_level,
                        filesAnalyzedA:
                            result.files_analyzed.repository_a,
                        filesAnalyzedB:
                            result.files_analyzed.repository_b,
                        matchedFiles:
                            result.matched_files as Prisma.InputJsonValue,
                    },
                    update: {
                        repositorySimilarity:
                            result.repository_similarity,
                        riskLevel: result.risk_level,
                        filesAnalyzedA:
                            result.files_analyzed.repository_a,
                        filesAnalyzedB:
                            result.files_analyzed.repository_b,
                        matchedFiles:
                            result.matched_files as Prisma.InputJsonValue,
                        createdAt: new Date(),
                    },
                });

                comparisons++;

                console.log(
                    `Comparison saved: ${submissionA.id} vs ${submissionB.id}`
                );
            }
        }

        await prisma.hackathon.update({
            where: { id: hackathonId },
            data: {
                analysisStatus: "COMPLETED",
                analysisCompletedAt: new Date(),
            },
        });

        console.log(
            `Analysis completed for ${hackathonId}. Comparisons: ${comparisons}`
        );

        return {
            hackathonId,
            status: "completed",
            comparisons,
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

worker.on("failed", async (job, error) => {
    console.error(`Job ${job?.id} failed:`, error.message);

    if (!job) return;

    const maxAttempts = job.opts.attempts ?? 1;

    // Only mark FAILED after all retry attempts are exhausted.
    if (job.attemptsMade >= maxAttempts) {
        try {
            await prisma.hackathon.update({
                where: { id: job.data.hackathonId },
                data: {
                    analysisStatus: "FAILED",
                },
            });
        } catch (updateError) {
            console.error(
                "Could not update hackathon failure status:",
                updateError
            );
        }
    }
});

worker.on("error", (error) => {
    console.error("Worker error:", error);
});

console.log("HackGuard analysis worker is running...");
