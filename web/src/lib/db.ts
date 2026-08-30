import fs from "fs";
import path from "path";
import { PrismaClient } from "@/generated/prisma/client";
import { PrismaBetterSqlite3 } from "@prisma/adapter-better-sqlite3";

const globalForPrisma = globalThis as unknown as { prisma?: PrismaClient };

/** better-sqlite3 wants a bare filesystem path, not a `file:` URL. */
function sqlitePath(databaseUrl: string) {
  return databaseUrl.startsWith("file:") ? databaseUrl.slice("file:".length) : databaseUrl;
}

/**
 * Demo-deploy-only: Vercel's deployment bundle is read-only outside /tmp,
 * so a real deploy needs Postgres (see README "Deploying"). For a
 * throwaway preview link, `vercel.json`'s buildCommand seeds a SQLite
 * snapshot into prisma/build-seed.db at build time; this copies that
 * bundled, pre-seeded snapshot into /tmp on cold start so writes (login
 * sessions, kudos, new activities) work for this instance's lifetime.
 * Not a real persistence story — writes vanish on the next cold start and
 * aren't shared across concurrent instances. No-op unless VERCEL is set,
 * so local dev and a real Postgres deploy are both unaffected.
 */
function resolveDbPath(databaseUrl: string): string {
  if (!process.env.VERCEL) return sqlitePath(databaseUrl);

  const tmpPath = "/tmp/pulse-demo.db";
  if (!fs.existsSync(tmpPath)) {
    fs.copyFileSync(path.join(process.cwd(), "prisma", "build-seed.db"), tmpPath);
  }
  return tmpPath;
}

function createClient() {
  const adapter = new PrismaBetterSqlite3({
    url: resolveDbPath(process.env.DATABASE_URL ?? "file:./prisma/dev.db"),
  });
  return new PrismaClient({ adapter });
}

export const db = globalForPrisma.prisma ?? createClient();

if (process.env.NODE_ENV !== "production") globalForPrisma.prisma = db;
