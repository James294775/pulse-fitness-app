import Link from "next/link";
import { requireUserOrRedirect, toPublicUser } from "@/lib/auth";
import { db } from "@/lib/db";
import { AppShell } from "@/components/AppShell";
import { AppHeader } from "@/components/AppHeader";
import { sportLabels } from "@/lib/validation";
import { formatDistance, formatDuration } from "@/lib/units";

export default async function FeedPage() {
  const user = await requireUserOrRedirect();

  const activities = await db.activity.findMany({
    where: { userId: user.id },
    orderBy: { startedAt: "desc" },
    take: 10,
  });

  return (
    <AppShell>
      <AppHeader user={toPublicUser(user)} />
      <div className="flex flex-col gap-4 px-5 py-5">
        <p className="text-xs text-secondary">
          The social feed of people you follow lands in Phase 3 — for now, here are your own
          activities.
        </p>
        <Link
          href="/activities/new"
          className="rounded border border-border-strong px-4 py-3 text-center text-xs font-bold tracking-[0.1em] text-tertiary"
        >
          + LOG AN ACTIVITY
        </Link>

        {activities.length === 0 ? (
          <div className="flex flex-col items-center gap-2 py-16 text-center">
            <p className="text-sm font-semibold tracking-[0.1em] text-secondary">NO ACTIVITIES YET</p>
            <p className="max-w-[240px] text-sm text-tertiary">
              Record one live, log it manually, or upload a GPX/TCX file.
            </p>
          </div>
        ) : (
          <div className="flex flex-col gap-1 overflow-hidden rounded border border-border-weak">
            {activities.map((a) => (
              <Link
                key={a.id}
                href={`/activities/${a.id}`}
                className="flex items-center justify-between gap-3 border-b border-border-weak bg-surface px-4 py-3 last:border-b-0"
              >
                <div className="min-w-0">
                  <div className="truncate text-sm font-semibold">{a.title}</div>
                  <div className="mt-0.5 text-[11px] tracking-[0.08em] text-secondary">
                    {sportLabels[a.sportType].toUpperCase()} ·{" "}
                    {new Intl.DateTimeFormat("en-US", { day: "numeric", month: "short" }).format(a.startedAt)}
                  </div>
                </div>
                <div className="tabular shrink-0 text-right text-xs text-tertiary">
                  <div>{formatDistance(a.distanceM, user.units)}</div>
                  <div className="text-secondary">{formatDuration(a.movingTimeSec)}</div>
                </div>
              </Link>
            ))}
          </div>
        )}
      </div>
    </AppShell>
  );
}
