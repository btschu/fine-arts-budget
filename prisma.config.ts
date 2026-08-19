import "dotenv/config";
import { defineConfig } from "prisma/config";

// Plain process.env access (not the `env()` helper) so `prisma generate` —
// which needs no live connection — doesn't hard-fail when DIRECT_URL isn't
// set in an environment that only provides DATABASE_URL (e.g. a fresh
// install step on a host that hasn't been given the direct connection yet).
const datasourceUrl = process.env.DIRECT_URL ?? process.env.DATABASE_URL ?? "";

export default defineConfig({
  schema: "prisma/schema.prisma",
  migrations: {
    path: "prisma/migrations",
    seed: "tsx prisma/seed.ts",
  },
  datasource: {
    url: datasourceUrl,
  },
});
