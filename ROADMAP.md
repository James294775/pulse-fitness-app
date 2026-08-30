# Roadmap — explicitly out of scope for v1

Per the build brief, these are not part of v1 and won't be built as part of the phased plan in `PLAN.md`:

- Native mobile apps
- Wearable / device sync (Garmin, Wahoo, etc.)
- Payments or subscription tiers
- AI-generated workout recommendations
- Live location sharing
- Offline maps
- Push notifications
- Direct messaging

## Known prototype limitations (not roadmap items, but worth tracking)

- **Photo storage** is local filesystem (`public/uploads/`) — doesn't survive a real Vercel deploy (ephemeral filesystem). Needs S3-compatible object storage before any real deployment holds user photos.
- **SQLite** is dev-only. Deploying requires switching `DATABASE_URL` (and the Prisma datasource provider) to hosted Postgres or libSQL — see `web/README.md`.
- **Segment matching** is an approximate proximity+direction corridor match, not exact — see `web/README.md` / inline docs on the matching function for the documented approach and its known failure modes.
