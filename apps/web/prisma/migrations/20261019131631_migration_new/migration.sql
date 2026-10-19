-- CreateEnum
CREATE TYPE "HackathonType" AS ENUM ('standard', 'live');

-- AlterTable
ALTER TABLE "Hackathon" ADD COLUMN     "type" "HackathonType" NOT NULL DEFAULT 'standard';
