import "server-only"

import { after } from "next/server"

import { Prisma, type TaskRunKind, type TaskRunStatus } from "@/lib/generated/prisma/client"
import { prisma } from "@/lib/prisma"

/**
 * A run can't outlive its function (maxDuration 300 s on the AI routes), so a RUNNING row older than
 * this belongs to a function that was killed before it could record the outcome: treat it as FAILED.
 */
const RUN_TIMEOUT_MS = 330_000

export const isStale = (run: { status: TaskRunStatus; createdAt: Date }) =>
  run.status === "RUNNING" && Date.now() - run.createdAt.getTime() > RUN_TIMEOUT_MS

const jsonError = (error: string, status: number) => Response.json({ error }, { status })

/**
 * Records a new RUNNING run, or returns an error Response: 409 while the project already has a live run
 * of this kind (one at a time, so two agents never edit the same canvas at once), 404 if the project
 * was deleted mid-request.
 */
// ponytail: check-then-insert, so two requests in the same instant can both start; a partial unique index if that matters.
export async function startRun(kind: TaskRunKind, projectId: string, userId: string): Promise<{ id: string } | Response> {
  const active = await prisma.taskRun.findFirst({
    where: { projectId, kind, status: "RUNNING", createdAt: { gt: new Date(Date.now() - RUN_TIMEOUT_MS) } },
    select: { id: true },
  })
  if (active) return jsonError("Ghost AI is already working on this project. Try again when it's done.", 409)
  try {
    return await prisma.taskRun.create({ data: { kind, projectId, userId }, select: { id: true } })
  } catch (err) {
    // P2003 = foreign key failed: the project was deleted mid-request.
    if (err instanceof Prisma.PrismaClientKnownRequestError && err.code === "P2003") return jsonError("Not found", 404)
    throw err
  }
}

/**
 * Runs `work` after the response is sent (Next.js after(), kept alive by Vercel's waitUntil), then
 * records COMPLETED (plus whatever `work` returns, e.g. a specId) or FAILED.
 */
export function runInBackground(runId: string, work: () => Promise<{ specId?: string } | void>): void {
  after(async () => {
    try {
      const result = await work()
      await prisma.taskRun.update({ where: { id: runId }, data: { status: "COMPLETED", ...result } })
    } catch (err) {
      console.error(`AI run ${runId} failed:`, err instanceof Error ? err.message : String(err))
      // The row may be gone if the project was deleted meanwhile; nothing left to record then.
      await prisma.taskRun.update({ where: { id: runId }, data: { status: "FAILED" } }).catch(() => {})
    }
  })
}
