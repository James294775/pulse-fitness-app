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

  // One grouped query for every member's total, instead of one aggregate
  // query per member (an N+1 that meaningfully slows down clubs with more
  // than a couple of members on a real network-backed database).
  const grouped = await db.activity.groupBy({
    by: ["userId"],
    where: {
      userId: { in: members.map((m) => m.userId) },
      startedAt: { gte: monthStart, lt: monthEnd },
      ...(sportType ? { sportType } : {}),
    },
    _sum: { distanceM: true },
  });
  const totalByUser = new Map(grouped.map((g) => [g.userId, g._sum.distanceM ?? 0]));

  return members
    .map((m) => ({ userId: m.userId, displayName: m.user.displayName, value: totalByUser.get(m.userId) ?? 0 }))
    .sort((a, b) => b.value - a.value)
    .map((r, i) => ({ rank: i + 1, ...r }));
}

function metricValue(sums: { distanceM: number | null; movingTimeSec: number | null; elevationGainM: number | null }, metric: ChallengeMetric) {
  if (metric === "distance") return sums.distanceM ?? 0;
  if (metric === "time") return sums.movingTimeSec ?? 0;
  return sums.elevationGainM ?? 0;
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

  // One grouped query for every participant's totals, instead of one
  // findMany per participant (an N+1 that meaningfully slows down
  // challenges with more than a couple of participants on a real
  // network-backed database).
  const grouped = await db.activity.groupBy({
    by: ["userId"],
    where: {
      userId: { in: participants.map((p) => p.userId) },
      startedAt: { gte: challenge.startDate, lt: challenge.endDate },
      ...(challenge.sportType ? { sportType: challenge.sportType } : {}),
    },
    _sum: { distanceM: true, movingTimeSec: true, elevationGainM: true },
  });
  const sumsByUser = new Map(grouped.map((g) => [g.userId, g._sum]));

  return participants
    .map((p) => ({
      userId: p.userId,
      displayName: p.user.displayName,
      value: metricValue(sumsByUser.get(p.userId) ?? { distanceM: 0, movingTimeSec: 0, elevationGainM: 0 }, challenge.metric),
    }))
    .sort((a, b) => b.value - a.value)
    .map((r, i) => ({ rank: i + 1, ...r, progressPct: Math.min(100, (r.value / challenge.targetValue) * 100) }));
}
