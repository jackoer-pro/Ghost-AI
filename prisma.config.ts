import { config } from "dotenv";
import { defineConfig } from "prisma/config";

config({ path: ".env.local" });

export default defineConfig({
  schema: "prisma",
  migrations: { path: "prisma/migrations" },
  // Not env(): that throws when the var is unset, and `prisma generate` runs in the Vercel build,
  // where it doesn't need a database. migrate/db commands still fail clearly without a URL.
  datasource: { url: process.env.DATABASE_URL ?? "" },
});
