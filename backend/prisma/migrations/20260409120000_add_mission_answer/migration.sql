-- CreateTable
CREATE TABLE "MissionAnswer" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "missionId" TEXT NOT NULL,
    "taskIndex" INTEGER NOT NULL,
    "question" TEXT NOT NULL,
    "answer" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "MissionAnswer_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "MissionAnswer_userId_missionId_createdAt_idx" ON "MissionAnswer"("userId", "missionId", "createdAt");

-- AddForeignKey
ALTER TABLE "MissionAnswer" ADD CONSTRAINT "MissionAnswer_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
