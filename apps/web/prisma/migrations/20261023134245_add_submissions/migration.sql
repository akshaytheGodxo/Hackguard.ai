/*
  Warnings:

  - A unique constraint covering the columns `[hackathonId,name]` on the table `Problem` will be added. If there are existing duplicate values, this will fail.

*/
-- DropIndex
DROP INDEX "Problem_name_key";

-- CreateTable
CREATE TABLE "Submission" (
    "id" TEXT NOT NULL,
    "sourceCode" TEXT NOT NULL,
    "language" TEXT NOT NULL,
    "submittedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "registrationId" TEXT NOT NULL,
    "problemId" TEXT NOT NULL,
    "submittedByMemberId" TEXT,

    CONSTRAINT "Submission_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "Submission_problemId_submittedAt_idx" ON "Submission"("problemId", "submittedAt");

-- CreateIndex
CREATE INDEX "Submission_registrationId_problemId_idx" ON "Submission"("registrationId", "problemId");

-- CreateIndex
CREATE UNIQUE INDEX "Problem_hackathonId_name_key" ON "Problem"("hackathonId", "name");

-- AddForeignKey
ALTER TABLE "Submission" ADD CONSTRAINT "Submission_registrationId_fkey" FOREIGN KEY ("registrationId") REFERENCES "Registration"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Submission" ADD CONSTRAINT "Submission_problemId_fkey" FOREIGN KEY ("problemId") REFERENCES "Problem"("problemId") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Submission" ADD CONSTRAINT "Submission_submittedByMemberId_fkey" FOREIGN KEY ("submittedByMemberId") REFERENCES "RegistrationMember"("id") ON DELETE SET NULL ON UPDATE CASCADE;
