// Demo data seed. Phase 1: users only, so there's someone to log in as.
// Phase 2 expands this to ~8 users with 3 months of realistic activity
// history; later phases add segments, routes, clubs, and challenges.
import { PrismaClient } from "../src/generated/prisma/client";
import { PrismaBetterSqlite3 } from "@prisma/adapter-better-sqlite3";
import bcrypt from "bcryptjs";

const databaseUrl = process.env.DATABASE_URL ?? "file:./dev.db";
const adapter = new PrismaBetterSqlite3({
  url: databaseUrl.startsWith("file:") ? databaseUrl.slice("file:".length) : databaseUrl,
});
const db = new PrismaClient({ adapter });

const DEMO_PASSWORD = "password123";

const demoUsers = [
  {
    email: "mara@example.com",
    displayName: "Mara Vidal",
    primarySport: "run" as const,
    units: "metric" as const,
    location: "Vancouver, BC",
    bio: "Marathon training, mostly seawall miles.",
  },
  {
    email: "deni@example.com",
    displayName: "Deni Kowalski",
    primarySport: "ride" as const,
    units: "metric" as const,
    location: "North Vancouver, BC",
    bio: "Climbs. All of them.",
  },
  {
    email: "theo@example.com",
    displayName: "Théo Nakamura",
    primarySport: "run" as const,
    units: "imperial" as const,
    location: "Seattle, WA",
    bio: "",
  },
  {
    email: "jonas@example.com",
    displayName: "Jonas Kessler",
    primarySport: "run" as const,
    units: "metric" as const,
    location: "West Vancouver, BC",
    bio: "1500km in 2026 or bust.",
  },
];

async function main() {
  const passwordHash = await bcrypt.hash(DEMO_PASSWORD, 10);

  for (const u of demoUsers) {
    await db.user.upsert({
      where: { email: u.email },
      update: {},
      create: { ...u, passwordHash },
    });
  }

  console.log(`Seeded ${demoUsers.length} demo users. Password for all: ${DEMO_PASSWORD}`);
}

main()
  .catch((e) => {
    console.error(e);
    process.exitCode = 1;
  })
  .finally(async () => {
    await db.$disconnect();
  });
