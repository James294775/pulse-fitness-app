import { db } from "@/lib/db";

export type LeaderboardRange = "all-time" | "this-year";

export interface LeaderboardRow {
  rank: number;
  userId: string;
  displayName: string;
  elapsedSec: number;
  date: Date;
}

export interface Leaderboard {
  rows: LeaderboardRow[];
  viewerRow: LeaderboardRow | null;
  participantCount: number;
}

/** Best (fastest) effort per athlete, ranked, filtered to what the viewer is allowed to see and to the requested time range. */
export async function getSegmentLeaderboard(
  segmentId: string,
  viewerId: string,
  range: LeaderboardRange
): Promise<Leaderboard> {
  const yearStart = new Date(new Date().getFullYear(), 0, 1);

  const efforts = await db.segmentEffort.findMany({
    where: {
      segmentId,
      ...(range === "this-year" ? { startedAt: { gte: yearStart } } : {}),
    },
    include: {
      user: { select: { id: true, displayName: true } },
      activity: { select: { userId: true, privacy: true } },
    },
    orderBy: { elapsedSec: "asc" },
  });

  // Same visibility rule as canViewActivity (src/lib/social.ts), but
  // batched: one query for who the viewer follows, checked in memory per
  // effort, instead of one Follow lookup per "followers"-privacy effort --
  // real cost on a segment with many efforts on a network-backed database.
  const followingRows = await db.follow.findMany({
    where: { followerId: viewerId },
    select: { followingId: true },
  });
  const following = new Set(followingRows.map((f) => f.followingId));

  const visible = efforts.filter((e) => {
    const activity = e.activity;
    if (activity.userId === viewerId) return true;
    if (activity.privacy === "everyone") return true;
    if (activity.privacy === "only_me") return false;
    return following.has(activity.userId);
  });

  const bestPerUser = new Map<string, (typeof visible)[number]>();
  for (const effort of visible) {
    const existing = bestPerUser.get(effort.userId);
    if (!existing || effort.elapsedSec < existing.elapsedSec) {
      bestPerUser.set(effort.userId, effort);
    }
  }

  const ranked = Array.from(bestPerUser.values()).sort((a, b) => a.elapsedSec - b.elapsedSec);

  const rows: LeaderboardRow[] = ranked.map((e, i) => ({
    rank: i + 1,
    userId: e.userId,
    displayName: e.user.displayName,
    elapsedSec: e.elapsedSec,
    date: e.startedAt,
  }));

  const viewerRow = rows.find((r) => r.userId === viewerId) ?? null;

  return { rows: rows.slice(0, 20), viewerRow, participantCount: rows.length };
}
