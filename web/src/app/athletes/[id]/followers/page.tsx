import { notFound } from "next/navigation";
import { requireUserOrRedirect } from "@/lib/auth";
import { db } from "@/lib/db";
import { AppShell } from "@/components/AppShell";
import { BackHeader } from "@/components/BackHeader";
import { AthleteListItem } from "@/components/AthleteListItem";

export default async function FollowersPage({ params }: PageProps<"/athletes/[id]/followers">) {
  const { id } = await params;
  const viewer = await requireUserOrRedirect();

  const athlete = await db.user.findUnique({ where: { id }, select: { id: true, displayName: true } });
  if (!athlete) notFound();

  const follows = await db.follow.findMany({
    where: { followingId: id },
    include: { follower: { select: { id: true, displayName: true, location: true } } },
    orderBy: { createdAt: "desc" },
  });

  const viewerFollowingIds = new Set(
    (await db.follow.findMany({ where: { followerId: viewer.id }, select: { followingId: true } })).map(
      (f) => f.followingId
    )
  );

  return (
    <AppShell withTabBar={false}>
      <BackHeader label="BACK" href={`/athletes/${id}`} title={`${athlete.displayName}'S FOLLOWERS`.toUpperCase()} />
      {follows.length === 0 ? (
        <p className="px-5 py-8 text-center text-sm text-secondary">No followers yet.</p>
      ) : (
        <div>
          {follows.map((f) => (
            <AthleteListItem
              key={f.follower.id}
              athlete={f.follower}
              viewerId={viewer.id}
              viewerFollows={viewerFollowingIds.has(f.follower.id)}
            />
          ))}
        </div>
      )}
    </AppShell>
  );
}
