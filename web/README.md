# Pulse

A fitness activity tracker with social features. See `../PLAN.md` for the full build plan, `../DECISIONS.md` for judgment calls made along the way, and `../ROADMAP.md` for what's explicitly out of scope.

**Status: all 8 phases complete.** Everything from Phase 7, plus the privacy pass: per-activity visibility (everyone/followers/only me) audited across every read path, home/work "privacy zones" that trim a saved activity's map near its start/end for anyone but the owner (server-side, not just hidden in the UI — see `../DECISIONS.md`), `error.tsx`/`not-found.tsx` boundaries, and a Vitest suite covering the trickier logic (GPX/TCX parsing, segment matching, pace/elevation/unit math, privacy-zone clipping). See `../PLAN.md` for the phase list and `../DECISIONS.md` for the full log of judgment calls.

## Stack

Next.js (App Router) + TypeScript + Tailwind CSS v4, Prisma + Postgres, hand-rolled email/password auth with DB-backed sessions, MapLibre GL (OpenFreeMap tiles) for maps, Recharts for elevation/pace charts.

## Setup

```bash
npm install
cp .env.example .env   # then set DATABASE_URL to your own Postgres connection string
npx prisma migrate deploy
npx prisma db seed
npm run dev
```

A free [Prisma Postgres](https://console.prisma.io) database works well here — create a project, copy the *direct* connection string (not the pooled/Accelerate one) into `.env`. Any other Postgres works too.

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
| `DATABASE_URL` | A Postgres connection string — the same variable locally and in production. |

## Scripts

- `npm run dev` — dev server (Turbopack)
- `npm run build` / `npm run start` — production build/serve
- `npm run test` — unit tests (Vitest) for the tricky logic: GPX/TCX parsing, segment matching, pace/elevation/unit conversions, privacy-zone clipping. No UI/component tests, by design — see `../PLAN.md`.
- `npm run lint` — ESLint
- `npx prisma migrate dev --name <name>` — create + apply a migration after editing `prisma/schema.prisma`
- `npx prisma migrate deploy` — apply pending migrations without creating a new one (CI/CD, first-time setup)
- `npx prisma db seed` — re-run the seed script (upserts, safe to re-run)
- `npx prisma studio` — browse the database

## Privacy

- **Per-activity visibility** — everyone / followers / only me — is enforced server-side (`src/lib/social.ts`'s `canViewActivity`) on every read path that returns activity data: the detail page, the feed query, athlete profiles, and segment-effort leaderboards.
- **Privacy zones** (`/settings/privacy`) let an athlete mark a location (home, work) whose radius gets trimmed off the *start and end* of their activity maps for anyone but themselves — their own view is always the real, full track. This happens server-side, before the track ever reaches the page (`src/lib/privacy.ts`), so the coordinates near a zone genuinely never reach another user's browser — not just hidden by CSS/JS. See `../DECISIONS.md` (Phase 8) for the audit of every place raw coordinates reach a page, and for why segment thumbnails don't need separate clipping.

## Deploying

Set `DATABASE_URL` as a project environment variable on Vercel (a Prisma Postgres connection string, or any other Postgres). `vercel.json`'s `buildCommand` runs `prisma generate && prisma migrate deploy && prisma db seed` before `next build`, so the schema and demo data are set up automatically on every deploy — no manual migration step needed.

One thing that doesn't survive as-is on Vercel, flagged in `../ROADMAP.md`: **photo uploads** (from Phase 2 onward) write to `public/uploads/`, which isn't durable on Vercel's serverless filesystem. Needs S3-compatible object storage before a real deploy holds user photos.

`requireUserOrRedirect()` in `src/lib/auth.ts` sends unauthenticated visitors to `/demo-login` instead of `/login` whenever `process.env.VERCEL` is set (Vercel sets this automatically), which transparently logs them in as the seeded `jonas@example.com` account — a deliberate choice for a public demo link, not something a real deploy with real user accounts would want. `/login`/`/signup` still work normally if you want to switch accounts.

## Notes for anyone touching auth or user data

`src/generated/prisma/client`'s `User` type includes `passwordHash`. **Never pass it into a `"use client"` component** — Client Component props get serialized into the page's RSC payload and shipped to the browser as-is. Use `toPublicUser()` / the `PublicUser` type from `src/lib/auth.ts` any time a user record needs to reach client-rendered UI. See `../DECISIONS.md` (Phase 1) for the bug this rule is preventing a repeat of.
