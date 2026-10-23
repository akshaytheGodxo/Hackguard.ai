/*
  Warnings:

  - Added the required column `participantId` to the `Submission` table without a default value. This is not possible if the table is not empty.

*/
-- AlterTable
ALTER TABLE "Submission" ADD COLUMN     "participantId" TEXT NOT NULL,
ALTER COLUMN "registrationId" DROP NOT NULL;

-- CreateIndex
CREATE INDEX "Submission_participantId_problemId_idx" ON "Submission"("participantId", "problemId");

-- AddForeignKey
ALTER TABLE "Submission" ADD CONSTRAINT "Submission_participantId_fkey" FOREIGN KEY ("participantId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
