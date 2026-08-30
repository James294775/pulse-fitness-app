import { notFound } from "next/navigation";
import { requireUserOrRedirect } from "@/lib/auth";
import { db } from "@/lib/db";
import { AppShell } from "@/components/AppShell";
import { BackHeader } from "@/components/BackHeader";
import { AthleteListItem } from "@/components/AthleteListItem";

export default async function FollowingPage({ params }: PageProps<"/athletes/[id]/following">) {
  const { id } = await params;
  const viewer = await requireUserOrRedirect();

  const athlete = await db.user.findUnique({ where: { id }, select: { id: true, displayName: true } });
  if (!athlete) notFound();

  const follows = await db.follow.findMany({
    where: { followerId: id },
    include: { following: { select: { id: true, displayName: true, location: true } } },
    orderBy: { createdAt: "desc" },
  });

  const viewerFollowingIds = new Set(
    (await db.follow.findMany({ where: { followerId: viewer.id }, select: { followingId: true } })).map(
      (f) => f.followingId
    )
  );

  return (
    <AppShell withTabBar={false}>
      <BackHeader label="BACK" href={`/athletes/${id}`} title={`${athlete.displayName}'S FOLLOWING`.toUpperCase()} />
      {follows.length === 0 ? (
        <p className="px-5 py-8 text-center text-sm text-secondary">Not following anyone yet.</p>
      ) : (
        <div>
          {follows.map((f) => (
            <AthleteListItem
              key={f.following.id}
              athlete={f.following}
              viewerId={viewer.id}
              viewerFollows={viewerFollowingIds.has(f.following.id)}
            />
          ))}
        </div>
      )}
    </AppShell>
  );
}
