/*
  Warnings:

  - You are about to drop the column `runId` on the `TaskRun` table. All the data in the column will be lost.
  - Added the required column `kind` to the `TaskRun` table without a default value. This is not possible if the table is not empty.
  - Added the required column `updatedAt` to the `TaskRun` table without a default value. This is not possible if the table is not empty.

*/
-- Old rows point at Trigger.dev runs, which no longer exist (AI now runs in the API's after()).
DELETE FROM "TaskRun";

-- CreateEnum
CREATE TYPE "TaskRunKind" AS ENUM ('DESIGN', 'SPEC');

-- CreateEnum
CREATE TYPE "TaskRunStatus" AS ENUM ('RUNNING', 'COMPLETED', 'FAILED');

-- DropIndex
DROP INDEX "TaskRun_runId_key";

-- AlterTable
ALTER TABLE "TaskRun" DROP COLUMN "runId",
ADD COLUMN     "kind" "TaskRunKind" NOT NULL,
ADD COLUMN     "specId" TEXT,
ADD COLUMN     "status" "TaskRunStatus" NOT NULL DEFAULT 'RUNNING',
ADD COLUMN     "updatedAt" TIMESTAMP(3) NOT NULL;

-- CreateTable
CREATE TABLE "ProjectSpec" (
    "id" TEXT NOT NULL,
    "projectId" TEXT NOT NULL,
    "filePath" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "ProjectSpec_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "ProjectSpec_projectId_createdAt_idx" ON "ProjectSpec"("projectId", "createdAt");

-- CreateIndex
CREATE INDEX "TaskRun_projectId_kind_status_idx" ON "TaskRun"("projectId", "kind", "status");

-- AddForeignKey
ALTER TABLE "ProjectSpec" ADD CONSTRAINT "ProjectSpec_projectId_fkey" FOREIGN KEY ("projectId") REFERENCES "Project"("id") ON DELETE CASCADE ON UPDATE CASCADE;
