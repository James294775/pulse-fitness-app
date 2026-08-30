import { db } from "@/lib/db";
import type { ChallengeMetric, SportType } from "@/generated/prisma/client";

export interface RankedMember {
  rank: number;
  userId: string;
  displayName: string;
  value: number; // meters (distance) — club leaderboard is always distance
}

/** Each club member's total distance this calendar month, ranked. Scoped to the club's sport if it has one. */
export async function getClubLeaderboard(clubId: string, sportType: SportType | null): Promise<RankedMember[]> {
  const now = new Date();
  const monthStart = new Date(now.getFullYear(), now.getMonth(), 1);
  const monthEnd = new Date(now.getFullYear(), now.getMonth() + 1, 1);

  const members = await db.clubMember.findMany({
    where: { clubId },
    include: { user: { select: { id: true, displayName: true } } },
  });

  const rows = await Promise.all(
    members.map(async (m) => {
      const agg = await db.activity.aggregate({
        where: {
          userId: m.userId,
          startedAt: { gte: monthStart, lt: monthEnd },
          ...(sportType ? { sportType } : {}),
        },
        _sum: { distanceM: true },
      });
      return { userId: m.userId, displayName: m.user.displayName, value: agg._sum.distanceM ?? 0 };
    })
  );

  return rows
    .sort((a, b) => b.value - a.value)
    .map((r, i) => ({ rank: i + 1, ...r }));
}

function metricSum(activities: { distanceM: number; movingTimeSec: number; elevationGainM: number }[], metric: ChallengeMetric) {
  return activities.reduce((sum, a) => {
    if (metric === "distance") return sum + a.distanceM;
    if (metric === "time") return sum + a.movingTimeSec;
    return sum + a.elevationGainM;
  }, 0);
}

export interface ChallengeRow extends RankedMember {
  progressPct: number;
}

/** Each participant's progress toward the challenge's target during its date window, ranked. */
export async function getChallengeLeaderboard(challengeId: string): Promise<ChallengeRow[]> {
  const challenge = await db.challenge.findUnique({ where: { id: challengeId } });
  if (!challenge) return [];

  const participants = await db.challengeParticipant.findMany({
    where: { challengeId },
    include: { user: { select: { id: true, displayName: true } } },
  });

  const rows = await Promise.all(
    participants.map(async (p) => {
      const activities = await db.activity.findMany({
        where: {
          userId: p.userId,
          startedAt: { gte: challenge.startDate, lt: challenge.endDate },
          ...(challenge.sportType ? { sportType: challenge.sportType } : {}),
        },
        select: { distanceM: true, movingTimeSec: true, elevationGainM: true },
      });
      const value = metricSum(activities, challenge.metric);
      return { userId: p.userId, displayName: p.user.displayName, value };
    })
  );

  return rows
    .sort((a, b) => b.value - a.value)
    .map((r, i) => ({ rank: i + 1, ...r, progressPct: Math.min(100, (r.value / challenge.targetValue) * 100) }));
}
