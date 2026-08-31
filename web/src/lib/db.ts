import { Pool } from "pg";
import { PrismaPg } from "@prisma/adapter-pg";
import { PrismaClient } from "@/generated/prisma/client";

const globalForPrisma = globalThis as unknown as { prisma?: PrismaClient };

function createClient() {
  const pool = new Pool({
    connectionString: process.env.DATABASE_URL,
    // Serverless functions handle one request at a time per instance --
    // the pg default (max: 10) wastes connection setup and risks
    // exhausting the database's connection limit once many instances are
    // warm concurrently. keepAlive avoids idle connections getting
    // dropped and needing a fresh (slow, TLS) handshake on the next
    // request within an otherwise-warm instance.
    max: 3,
    keepAlive: true,
  });
  const adapter = new PrismaPg(pool);
  return new PrismaClient({ adapter });
}

export const db = globalForPrisma.prisma ?? createClient();

if (process.env.NODE_ENV !== "production") globalForPrisma.prisma = db;
