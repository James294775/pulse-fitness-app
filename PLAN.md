# Pulse — Build Plan

Status: **draft, awaiting go-ahead before application code is written**, per the brief's instruction to show the plan first.

## 0. What's already in this repo

- `README.md`, `chats/`, `project/` — a Claude Design handoff bundle (a separate Claude session's design mockup of five Pulse screens: Feed, Record, Activity Detail, Training Dashboard, Segment Leaderboard, in dark + light themes). Its palette matches this brief's brand table exactly, so it's used below as the visual reference for the pixel-level styling of those five screens — spacing, type scale, chart shapes, component structure.
- `app/` — a partial Vite + React static prototype of those same five screens, started *before* this fuller brief arrived, in response to the design handoff. It has no backend, no auth, no data model — it doesn't fit this brief's stack (Next.js/Prisma) or scope (full social/segments/routes/clubs product). **I'll delete it once this plan is approved** and rebuild the same visual screens for real inside the Next.js app; flagging it now rather than silently discarding work.

## 1. Stack decisions and callouts

Following the brief's stack as given, plus the calls it leaves open:

- **Next.js 15 App Router, TypeScript, Tailwind.** Brand tokens as CSS custom properties in `globals.css`, mirrored into `tailwind.config` `theme.extend.colors` so components use `bg-pulse-blue` etc. — never a raw hex in a component.
- **Prisma + SQLite for dev.** SQLite and Postgres aren't drop-in compatible at the schema-provider level (a handful of type/feature differences — e.g. no native enums, `Json` handling), so "swap to Postgres later" means: one `schema.prisma` with `provider` read from an env var—driven approach isn't reliable in Prisma, so I'll keep the schema Postgres-clean (avoid SQLite-only features, use `String` for enums with a TS union type instead of Prisma `enum` only if needed — Prisma actually supports enums on both, so real enums are fine) and document the one-line provider swap + `DATABASE_URL` change in `README.md`. This is a documented decision, not a fully abstracted db layer — a true zero-touch swap isn't realistic for a prototype.
- **Auth:** email + password, `bcryptjs` for hashing, opaque session tokens in an httpOnly cookie backed by a `Session` table (no JWT, no NextAuth — matches "no third-party auth provider"). Server-side helper `requireUser(req)` used by every API route and server component that touches user data.
- **Maps:** MapLibre GL JS with **OpenFreeMap** vector tiles (`https://tiles.openfreemap.org/styles/liberty`) — free, keyless, no usage cap tied to an API key. Documented in `DECISIONS.md` in case it's ever rate-limited and needs swapping.
- **Charts:** Recharts for elevation, pace/speed, splits, and fitness/form.
- **File storage (photos, GPX export scratch files):** local filesystem under `public/uploads/` for the prototype. Flagged in `ROADMAP.md` as needing real object storage (S3-compatible) before any real deploy holds user data — Vercel's filesystem is ephemeral per-invocation, so uploaded photos would not persist in production. I'll still build it this way per "no paid API keys," and call this out explicitly rather than quietly shipping something that loses photos on Vercel.
- **Deploy target tension:** SQLite has nowhere durable to live on Vercel's serverless filesystem. Plan is: dev uses local SQLite; the Vercel deploy instructions in `README.md` will document pointing `DATABASE_URL` at a hosted Postgres (e.g. Vercel Postgres/Neon free tier) or libSQL/Turso, since "deployable to Vercel" and "SQLite for local dev" are only reconcilable that way. I will not silently make this work by picking one and dropping the other.
- **Testing:** Vitest for the logic the brief calls out (GPX/TCX parsing, pace/speed/elevation math and unit conversion, segment matching, privacy-zone clipping). No UI/component tests, per the brief.

## 2. Data model (Prisma, sketch)

```
User          id, email (unique), passwordHash, displayName, avatarUrl?, bio?,
              location?, primarySport, units ("metric"|"imperial"), createdAt

Session       id, userId, tokenHash, expiresAt

Activity      id, userId, sportType, title, description?, privacy ("everyone"|"followers"|"only_me"),
              source ("live"|"manual"|"upload"), startedAt,
              elapsedTimeSec, movingTimeSec, distanceM, elevationGainM,
              avgPaceSecPerKm?, avgSpeedKmh?, calories?, effortScore,
              points        Json   // [{lat,lng,ele,t,distM}], raw + resampled track
              createdAt

Photo         id, activityId, url, caption?, sortOrder

Follow        followerId, followingId, createdAt          (composite unique)

Kudos         id, activityId, userId, createdAt           (unique on activity+user)

Comment       id, activityId, userId, parentId?, body, createdAt

Segment       id, name, sportType, createdByUserId, points Json,
              startLat, startLng, endLat, endLng, distanceM, elevationGainM, avgGrade,
              createdAt

SegmentEffort id, segmentId, activityId, userId, elapsedSec, startedAt,
              isPr Boolean (cached, recomputed on insert)

Route         id, userId, name, points Json, distanceM, elevationGainM,
              starred Boolean, createdAt

Goal          id, userId, sportType?, period ("weekly"|"monthly"),
              metric ("distance"|"time"), targetValue, startDate

Club          id, name, description, sportType, createdByUserId, createdAt
ClubMember    clubId, userId, role ("owner"|"member"), joinedAt

Challenge     id, clubId?, name, description, metric ("distance"|"time"|"elevation"),
              targetValue, startDate, endDate, createdByUserId
ChallengeParticipant  challengeId, userId, joinedAt

PrivacyZone   id, userId, label, lat, lng, radiusM
```

Track points are stored as a `Json` column rather than a child table — simplest thing that supports charts, maps, GPX export and segment matching at this data volume, and avoids a very hot child table. Flagging this as a decision, not an oversight: a real-scale product would want a separate points table or a time-series store.

## 3. Route / page map (App Router)

```
/                          feed (protected)
/login  /signup
/record                    live GPS recording
/activities/new            manual entry + GPX/TCX upload
/activities/[id]           detail (map, stats, charts, splits, segments, kudos, comments)
/activities/[id]/edit      owner-only: title, description, privacy
/athletes/[id]             profile, stats summary, follow button
/athletes/[id]/followers   /athletes/[id]/following
/segments/[id]             leaderboard, all-time / this-year filter
/routes                    saved routes list
/routes/new                map-click route builder
/routes/[id]
/dashboard                 training dashboard (totals, calendar, PRs, fitness/form, goals)
/clubs  /clubs/new  /clubs/[id]
/challenges/[id]
/settings/profile  /settings/privacy  /settings/units
```

API routes under `/api/*` mirror these 1:1 (`/api/activities`, `/api/activities/[id]/kudos`, `/api/segments/[id]/leaderboard`, `/api/privacy-zones`, etc). Every one of these calls `requireUser()` and a per-resource authorization check before touching Prisma — the brief is explicit that the API must be safe to poke directly, not just the UI.

## 4. Segment matching (approximate, documented)

On activity save: for each segment whose start point is within ~500 m of any point in the new activity (cheap bounding pre-filter), walk the activity's points looking for a contiguous run that stays within a tolerance corridor (~40 m default) of the segment polyline **and** whose direction of travel matches the segment's start→end direction (positive dot product between consecutive movement vectors and the segment's vector). The entry/exit timestamps of that run become the effort's elapsed time. This does not sub-point-interpolate at the exact boundary crossing, doesn't handle a segment ridden twice in one activity (takes the first match), and can be fooled by GPS noise near the tolerance edge — acceptable for a prototype, called out in `DECISIONS.md` and covered by unit tests on synthetic tracks.

## 5. Privacy zones (server-side clipping)

A single `serializeActivityForViewer(activity, viewerId)` function is the *only* path any API route or server component uses to hand back an activity's `points`/map/GPX. It: (1) checks `privacy` against the viewer's follow relationship, returning 403/omitted before anything else runs; (2) if the owner has `PrivacyZone`s, strips leading points from the start and trailing points from the end while they fall inside any zone's radius, on both the JSON API response and the GPX export path — never just hidden in a component. Aggregate stats (total distance/time) are computed from the *un-clipped* track and are not affected, matching how this feature works in the wild. Unit tests assert clipped points never appear in an API response, including for the owner's own non-viewing... no — the owner does see their own full track; only other viewers get the clipped version.

## 6. Build phases

Each phase ends with: app builds and runs, a commit, and a one-paragraph summary of what works + decisions made (logged to `DECISIONS.md`).

1. **Foundation** — Next.js/Tailwind/Prisma scaffold, full schema migrated, brand tokens + dark/light toggle, base layout (header, bottom tab bar) styled from the Claude Design reference, auth (signup/login/logout/session), profile CRUD, seed script skeleton (users only).
2. **Recording & detail** — live GPS recording (Geolocation API + MapLibre live trace, start/pause/resume/finish), manual entry form, GPX/TCX upload+parse, activity detail page (map, stats, elevation + pace charts, splits, photos, edit). Full seed script (~8 users × 3 months) lands by the end of this phase.
3. **Feed & social** — feed, kudos, threaded comments, follow/unfollow, follower/following lists, athlete profile.
4. **Segments** — create segment from an activity range, matching on save, leaderboard (all-time/this-year, crown), matched-segments list with PR comparison on activity detail.
5. **Routes** — map-click route builder, distance/elevation calc, save/star/export GPX, saved list.
6. **Dashboard** — weekly/monthly totals with prior-period comparison, training log calendar, PRs, 7/42-day fitness/form chart, goals with progress bars.
7. **Clubs & challenges** — club CRUD/join/member list/monthly leaderboard, challenge CRUD/join/live leaderboard.
8. **Privacy pass** — visibility enforcement audited across every read path, privacy zones UI + server-side clipping, unit tests for parsing/math/matching/clipping, empty/loading/error states swept across all lists and charts, `README.md`/`DECISIONS.md`/`ROADMAP.md` finalized, Vercel deploy notes.

## 7. Explicitly out of scope

Logged to `ROADMAP.md` once the build starts: native apps, wearable/device sync, payments, AI workout recommendations, live location sharing, offline maps, push notifications, DMs.

---

**Waiting for a go-ahead (or corrections) before writing any application code**, including deleting the old `app/` prototype and scaffolding the Next.js project.
