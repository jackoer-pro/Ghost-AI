import { PrismaPg } from "@prisma/adapter-pg";
import { PrismaClient } from "@/lib/generated/prisma/client";

// ponytail: direct adapter-pg only; the spec's Accelerate branch (prisma+postgres:// URLs) is skipped since our URL is postgres://. Add @prisma/extension-accelerate if that changes.
// Reuse one client across hot reloads in dev so connections don't pile up.
const globalForPrisma = globalThis as unknown as { prisma?: PrismaClient };

export const prisma =
  globalForPrisma.prisma ??
  new PrismaClient({
    adapter: new PrismaPg({ connectionString: process.env.DATABASE_URL }),
  });

if (process.env.NODE_ENV !== "production") globalForPrisma.prisma = prisma;
