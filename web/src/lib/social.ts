import { db } from "@/lib/db";
import type { Activity } from "@/generated/prisma/client";

export async function isFollowing(followerId: string, followingId: string): Promise<boolean> {
  if (followerId === followingId) return false;
  const follow = await db.follow.findUnique({
    where: { followerId_followingId: { followerId, followingId } },
  });
  return follow !== null;
}

/**
 * Visibility check, now that the Follow graph exists (Phase 1/2 had this as
 * owner-only for "followers" since there was no graph to check yet).
 * Still not the full Phase 8 privacy pass — see DECISIONS.md.
 */
export async function canViewActivity(
  activity: Pick<Activity, "userId" | "privacy">,
  viewerId: string
): Promise<boolean> {
  if (activity.userId === viewerId) return true;
  if (activity.privacy === "everyone") return true;
  if (activity.privacy === "only_me") return false;
  return isFollowing(viewerId, activity.userId);
}
