-- AlterTable
ALTER TABLE "Hackathon" ADD COLUMN "problemStatement" TEXT;

-- AlterTable
ALTER TABLE "Registration" ADD COLUMN "teamName" TEXT;

-- CreateTable
CREATE TABLE "ProjectSubmission" (
    "id" TEXT NOT NULL,
    "projectZipUrl" TEXT NOT NULL,
    "githubRepoUrl" TEXT NOT NULL,
    "teamLeaderEmail" TEXT NOT NULL,
    "teamName" TEXT NOT NULL,
    "submittedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "hackathonId" TEXT NOT NULL,
    "registrationId" TEXT NOT NULL,

    CONSTRAINT "ProjectSubmission_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "ProjectSubmission_hackathonId_submittedAt_idx" ON "ProjectSubmission"("hackathonId", "submittedAt");

-- CreateIndex
CREATE INDEX "ProjectSubmission_registrationId_submittedAt_idx" ON "ProjectSubmission"("registrationId", "submittedAt");

-- AddForeignKey
ALTER TABLE "ProjectSubmission" ADD CONSTRAINT "ProjectSubmission_hackathonId_fkey" FOREIGN KEY ("hackathonId") REFERENCES "Hackathon"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ProjectSubmission" ADD CONSTRAINT "ProjectSubmission_registrationId_fkey" FOREIGN KEY ("registrationId") REFERENCES "Registration"("id") ON DELETE CASCADE ON UPDATE CASCADE;
