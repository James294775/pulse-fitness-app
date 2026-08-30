import Link from "next/link";
import { requireUserOrRedirect, toPublicUser } from "@/lib/auth";
import { db } from "@/lib/db";
import { AppShell } from "@/components/AppShell";
import { AppHeader } from "@/components/AppHeader";
import { FeedCard, type FeedCardData } from "@/components/FeedCard";
import { parseTrack } from "@/lib/track";
import { downsample } from "@/lib/geo";
import { trackToSvgPath } from "@/lib/route-thumbnail";

export default async function FeedPage() {
  const user = await requireUserOrRedirect();

  const following = await db.follow.findMany({
    where: { followerId: user.id },
    select: { followingId: true },
  });
  const followingIds = following.map((f) => f.followingId);

  const activities = await db.activity.findMany({
    where: {
      OR: [
        { userId: user.id },
        { userId: { in: followingIds }, privacy: { in: ["everyone", "followers"] } },
      ],
    },
    orderBy: { startedAt: "desc" },
    take: 30,
    include: {
      user: { select: { id: true, displayName: true, avatarUrl: true } },
      kudos: { where: { userId: user.id }, select: { id: true } },
      _count: { select: { kudos: true, comments: true } },
    },
  });

  const cards: FeedCardData[] = activities.map((a) => {
    const track = parseTrack(a.points);
    const thumbnailPoints = downsample(track, 40);
    return {
      id: a.id,
      sportType: a.sportType,
      title: a.title,
      startedAt: a.startedAt.toISOString(),
      distanceM: a.distanceM,
      movingTimeSec: a.movingTimeSec,
      effortScore: a.effortScore,
      routePathD: trackToSvgPath(thumbnailPoints, 348, 130),
      kudosCount: a._count.kudos,
      kudosGiven: a.kudos.length > 0,
      commentCount: a._count.comments,
      athlete: a.user,
    };
  });

  return (
    <AppShell>
      <AppHeader user={toPublicUser(user)} />
      <div className="flex gap-2.5 border-b border-border px-5 py-3.5">
        <Link
          href="/activities/new"
          className="flex-1 rounded border border-border-strong py-2.5 text-center text-[11px] font-bold tracking-[0.1em] text-tertiary"
        >
          + LOG AN ACTIVITY
        </Link>
        <Link
          href="/routes"
          className="flex-1 rounded border border-border-strong py-2.5 text-center text-[11px] font-bold tracking-[0.1em] text-tertiary"
        >
          ROUTES
        </Link>
      </div>
      <div className="flex flex-col">
        {cards.length === 0 ? (
          <div className="flex flex-col items-center gap-2 px-8 py-16 text-center">
            <p className="text-sm font-semibold tracking-[0.1em] text-secondary">YOUR FEED IS QUIET</p>
            <p className="max-w-[260px] text-sm text-tertiary">
              Follow other athletes from their profile to see their activities here, or log your own.
            </p>
          </div>
        ) : (
          cards.map((c) => <FeedCard key={c.id} activity={c} units={user.units} />)
        )}
      </div>
    </AppShell>
  );
}
