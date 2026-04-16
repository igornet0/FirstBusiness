-- CreateEnum
CREATE TYPE "UserRole" AS ENUM ('admin', 'user', 'bot');

-- AlterTable
ALTER TABLE "User" ADD COLUMN "role" "UserRole" NOT NULL DEFAULT 'user';
