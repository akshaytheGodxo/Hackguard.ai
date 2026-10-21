-- CreateTable
CREATE TABLE "Problem" (
    "problemId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT NOT NULL,
    "hackathonId" TEXT NOT NULL,

    CONSTRAINT "Problem_pkey" PRIMARY KEY ("problemId")
);

-- CreateTable
CREATE TABLE "TestCase" (
    "tid" TEXT NOT NULL,
    "input" TEXT NOT NULL,
    "output" TEXT NOT NULL,
    "pid" TEXT NOT NULL,

    CONSTRAINT "TestCase_pkey" PRIMARY KEY ("tid")
);

-- CreateIndex
CREATE UNIQUE INDEX "Problem_name_key" ON "Problem"("name");

-- AddForeignKey
ALTER TABLE "TestCase" ADD CONSTRAINT "TestCase_pid_fkey" FOREIGN KEY ("pid") REFERENCES "Problem"("problemId") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Problem" ADD CONSTRAINT "Problem_hackathonId_fkey" FOREIGN KEY ("hackathonId") REFERENCES "Hackathon"("id") ON DELETE RESTRICT ON UPDATE CASCADE;