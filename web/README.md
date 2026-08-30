# Pulse

A fitness activity tracker with social features. See `../PLAN.md` for the full build plan, `../DECISIONS.md` for judgment calls made along the way, and `../ROADMAP.md` for what's explicitly out of scope.

**Status: Phase 1 of 8 (Foundation).** Auth, profile, theming, and app shell/navigation work; everything else is a "coming in Phase N" stub. See `../PLAN.md` for the phase list.

## Stack

Next.js (App Router) + TypeScript + Tailwind CSS v4, Prisma + SQLite (dev), hand-rolled email/password auth with DB-backed sessions.

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

Password for all of them: `password123`

- `mara@example.com`
- `deni@example.com`
- `theo@example.com`
- `jonas@example.com`

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
