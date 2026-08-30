# Pulse

A fitness activity tracker with social features. See `../PLAN.md` for the full build plan, `../DECISIONS.md` for judgment calls made along the way, and `../ROADMAP.md` for what's explicitly out of scope.

**Status: Phase 6 of 8 (Training dashboard).** Everything from Phase 5, plus: weekly/monthly totals per sport with prior-period comparison, a 13-week training-log calendar (shaded relative to each athlete's own training volume), a real CTL/ATL/TSB fitness-and-form chart, personal records (race distances + longest ride/biggest climb), and recurring weekly/monthly goals with progress bars. See `../PLAN.md` for the phase list.

## Stack

Next.js (App Router) + TypeScript + Tailwind CSS v4, Prisma + SQLite (dev), hand-rolled email/password auth with DB-backed sessions, MapLibre GL (OpenFreeMap tiles) for maps, Recharts for elevation/pace charts.

## Setup

```bash
npm install
cp .env.example .env
npx prisma migrate dev
npx prisma db seed
npm run dev
```

Then visit `http://localhost:3000`. Log in as any seeded user (see below) — there's no public account list in the UI, these are for local dev.

## Seeded demo accounts

Password for all of them: `password123`. Each has ~3 months of seeded activity history (~450 activities across all 8 users), and they all follow the next few users in the list below (wrapping around) with some kudos/comments seeded in, so the feed isn't empty on first login either.

- `mara@example.com` — run
- `deni@example.com` — ride
- `theo@example.com` — run (imperial units)
- `jonas@example.com` — run
- `priya@example.com` — trail run
- `sana@example.com` — run
- `marcus@example.com` — ride (imperial units)
- `ingrid@example.com` — ski

## Environment variables

| Variable | Purpose |
|---|---|
| `DATABASE_URL` | SQLite file path locally (`file:./dev.db`); a Postgres/libSQL connection string in production — see Deploying below. |

## Scripts

- `npm run dev` — dev server (Turbopack)
- `npm run build` / `npm run start` — production build/serve
- `npx prisma migrate dev --name <name>` — create + apply a migration after editing `prisma/schema.prisma`
- `npx prisma db seed` — re-run the seed script (upserts, safe to re-run)
- `npx prisma studio` — browse the local database

## Deploying

Two things don't survive as-is on Vercel, both flagged in `../DECISIONS.md` / `../ROADMAP.md`:

1. **Database.** SQLite has no durable storage on Vercel's serverless filesystem. Point `DATABASE_URL` at a hosted Postgres (Vercel Postgres, Neon, etc.) or libSQL/Turso instead, and swap the `datasource.provider` in `prisma/schema.prisma` accordingly (the schema avoids SQLite-only features specifically so this swap is small). You'll also need the matching Prisma driver adapter (e.g. `@prisma/adapter-pg` for Postgres) in `src/lib/db.ts` in place of `@prisma/adapter-better-sqlite3` — Prisma 7 requires an explicit adapter, it doesn't infer one from the connection string.
2. **Photo uploads** (from Phase 2 onward) write to `public/uploads/` — also not durable on Vercel. Needs S3-compatible object storage before a real deploy holds user photos.

## Notes for anyone touching auth or user data

`src/generated/prisma/client`'s `User` type includes `passwordHash`. **Never pass it into a `"use client"` component** — Client Component props get serialized into the page's RSC payload and shipped to the browser as-is. Use `toPublicUser()` / the `PublicUser` type from `src/lib/auth.ts` any time a user record needs to reach client-rendered UI. See `../DECISIONS.md` (Phase 1) for the bug this rule is preventing a repeat of.
