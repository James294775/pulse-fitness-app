import Link from "next/link";
import { notFound } from "next/navigation";
import { requireUserOrRedirect } from "@/lib/auth";
import { db } from "@/lib/db";
import { isFollowing } from "@/lib/social";
import { AppShell } from "@/components/AppShell";
import { BackHeader } from "@/components/BackHeader";
import { FollowButton } from "@/components/FollowButton";
import { sportLabels } from "@/lib/validation";
import { formatDistance, formatDuration } from "@/lib/units";

export default async function AthleteProfilePage({ params }: PageProps<"/athletes/[id]">) {
  const { id } = await params;
  const viewer = await requireUserOrRedirect();

  const athlete = await db.user.findUnique({
    where: { id },
    select: {
      id: true,
      displayName: true,
      avatarUrl: true,
      bio: true,
      location: true,
      primarySport: true,
      createdAt: true,
    },
  });
  if (!athlete) notFound();

  const isSelf = athlete.id === viewer.id;
  const [viewerFollows, followerCount, followingCount, activityStats] = await Promise.all([
    isSelf ? Promise.resolve(false) : isFollowing(viewer.id, athlete.id),
    db.follow.count({ where: { followingId: athlete.id } }),
    db.follow.count({ where: { followerId: athlete.id } }),
    db.activity.aggregate({
      where: { userId: athlete.id },
      _count: { _all: true },
      _sum: { distanceM: true, movingTimeSec: true },
    }),
  ]);

  const canSeeFollowers = isSelf || viewerFollows;

  const visibleActivities = await db.activity.findMany({
    where: {
      userId: athlete.id,
      OR: isSelf
        ? undefined
        : [{ privacy: "everyone" }, ...(viewerFollows ? [{ privacy: "followers" as const }] : [])],
    },
    orderBy: { startedAt: "desc" },
    take: 10,
  });

  const initials = athlete.displayName
    .split(" ")
    .map((p) => p[0])
    .slice(0, 2)
    .join("")
    .toUpperCase();

  return (
    <AppShell withTabBar={false}>
      <BackHeader label="BACK" href="/" />
      <div className="flex flex-col gap-6 px-5 py-6">
        <div className="flex items-start justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="flex h-14 w-14 items-center justify-center rounded border border-border-strong bg-surface text-lg font-semibold text-tertiary">
              {initials}
            </div>
            <div>
              <div className="text-lg font-semibold">{athlete.displayName}</div>
              <div className="text-[11px] tracking-[0.1em] text-secondary">
                {sportLabels[athlete.primarySport].toUpperCase()}
                {athlete.location ? ` · ${athlete.location}` : ""}
              </div>
            </div>
          </div>
          {!isSelf && <FollowButton userId={athlete.id} initialFollowing={viewerFollows} />}
        </div>

        {athlete.bio && <p className="text-sm text-tertiary">{athlete.bio}</p>}

        <div className="flex gap-6">
          <Link href={`/athletes/${athlete.id}/followers`} className="text-sm">
            <span className="tabular font-semibold">{followerCount}</span>{" "}
            <span className="text-secondary">followers</span>
          </Link>
          <Link href={`/athletes/${athlete.id}/following`} className="text-sm">
            <span className="tabular font-semibold">{followingCount}</span>{" "}
            <span className="text-secondary">following</span>
          </Link>
        </div>

        <div className="grid grid-cols-2 gap-px overflow-hidden rounded border border-border-weak bg-border-weak">
          <div className="bg-bg p-3.5">
            <div className="text-[10px] tracking-[0.14em] text-secondary">ACTIVITIES</div>
            <div className="tabular mt-1.5 text-[22px] font-semibold">{activityStats._count._all}</div>
          </div>
          <div className="bg-bg p-3.5">
            <div className="text-[10px] tracking-[0.14em] text-secondary">TOTAL DISTANCE</div>
            <div className="tabular mt-1.5 text-[22px] font-semibold">
              {formatDistance(activityStats._sum.distanceM ?? 0, viewer.units, 0)}
            </div>
          </div>
        </div>

        <div>
          <div className="mb-2 text-xs font-semibold tracking-[0.16em]">RECENT ACTIVITIES</div>
          {!canSeeFollowers && visibleActivities.length === 0 ? (
            <p className="text-sm text-secondary">Follow {athlete.displayName} to see their activities.</p>
          ) : visibleActivities.length === 0 ? (
            <p className="text-sm text-secondary">No activities yet.</p>
          ) : (
            <div className="flex flex-col gap-1 overflow-hidden rounded border border-border-weak">
              {visibleActivities.map((a) => (
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
                    <div>{formatDistance(a.distanceM, viewer.units)}</div>
                    <div className="text-secondary">{formatDuration(a.movingTimeSec)}</div>
                  </div>
                </Link>
              ))}
            </div>
          )}
        </div>
      </div>
    </AppShell>
  );
}
