-- AlterTable: draft flag and updatedAt
ALTER TABLE "MissionAnswer" ADD COLUMN IF NOT EXISTS "isDraft" BOOLEAN NOT NULL DEFAULT true;
ALTER TABLE "MissionAnswer" ADD COLUMN IF NOT EXISTS "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP;

-- Dedupe: keep one row per (userId, missionId, taskIndex) — latest createdAt, then id
DELETE FROM "MissionAnswer"
WHERE "id" IN (
  SELECT "id" FROM (
    SELECT "id",
      ROW_NUMBER() OVER (
        PARTITION BY "userId", "missionId", "taskIndex"
        ORDER BY "createdAt" DESC, "id" DESC
      ) AS rn
    FROM "MissionAnswer"
  ) d
  WHERE d.rn > 1
);

-- Historical rows were final submissions from complete
UPDATE "MissionAnswer" SET "isDraft" = false WHERE "isDraft" = true;

-- Unique constraint for upsert
CREATE UNIQUE INDEX IF NOT EXISTS "MissionAnswer_userId_missionId_taskIndex_key" ON "MissionAnswer"("userId", "missionId", "taskIndex");
