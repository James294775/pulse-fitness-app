import { db } from "@/lib/db";
import type { Goal } from "@/generated/prisma/client";

function startOfWeek(date: Date): Date {
  const d = new Date(date);
  d.setHours(0, 0, 0, 0);
  const day = d.getDay();
  d.setDate(d.getDate() + (day === 0 ? -6 : 1 - day));
  return d;
}
function startOfMonth(date: Date): Date {
  return new Date(date.getFullYear(), date.getMonth(), 1);
}
function endOfMonth(date: Date): Date {
  return new Date(date.getFullYear(), date.getMonth() + 1, 1);
}

export interface GoalProgress {
  goal: Goal;
  currentValue: number; // meters or seconds, matching goal.metric
  periodStart: Date;
  periodEnd: Date;
}

/** Progress toward each of a user's goals for whichever weekly/monthly window contains today — goals recur every period rather than being one-off. */
export async function getGoalsWithProgress(userId: string): Promise<GoalProgress[]> {
  const goals = await db.goal.findMany({ where: { userId }, orderBy: { createdAt: "asc" } });
  if (goals.length === 0) return [];

  const now = new Date();
  const weekStart = startOfWeek(now);
  const weekEnd = new Date(weekStart);
  weekEnd.setDate(weekEnd.getDate() + 7);
  const monthStart = startOfMonth(now);
  const monthEnd = endOfMonth(now);

  const results: GoalProgress[] = [];
  for (const goal of goals) {
    if (goal.startDate > now) continue; // hasn't started yet
    const periodStart = goal.period === "weekly" ? weekStart : monthStart;
    const periodEnd = goal.period === "weekly" ? weekEnd : monthEnd;

    const activities = await db.activity.findMany({
      where: {
        userId,
        startedAt: { gte: periodStart, lt: periodEnd },
        ...(goal.sportType ? { sportType: goal.sportType } : {}),
      },
      select: { distanceM: true, movingTimeSec: true },
    });

    const currentValue = activities.reduce(
      (sum, a) => sum + (goal.metric === "distance" ? a.distanceM : a.movingTimeSec),
      0
    );

    results.push({ goal, currentValue, periodStart, periodEnd });
  }
  return results;
}
