import { db } from "@/lib/db";
import type { Activity, SportType } from "@/generated/prisma/client";

function startOfWeek(date: Date): Date {
  const d = new Date(date);
  d.setHours(0, 0, 0, 0);
  const day = d.getDay(); // 0 = Sunday
  const diff = day === 0 ? -6 : 1 - day; // move back to Monday
  d.setDate(d.getDate() + diff);
  return d;
}
function addDays(date: Date, days: number): Date {
  const d = new Date(date);
  d.setDate(d.getDate() + days);
  return d;
}
function startOfMonth(date: Date): Date {
  return new Date(date.getFullYear(), date.getMonth(), 1);
}

export interface PeriodTotal {
  distanceM: number;
  movingTimeSec: number;
  elevationGainM: number;
  sessionCount: number;
}

function summarize(activities: Pick<Activity, "distanceM" | "movingTimeSec" | "elevationGainM">[]): PeriodTotal {
  return activities.reduce<PeriodTotal>(
    (acc, a) => ({
      distanceM: acc.distanceM + a.distanceM,
      movingTimeSec: acc.movingTimeSec + a.movingTimeSec,
      elevationGainM: acc.elevationGainM + a.elevationGainM,
      sessionCount: acc.sessionCount + 1,
    }),
    { distanceM: 0, movingTimeSec: 0, elevationGainM: 0, sessionCount: 0 }
  );
}

export function percentChange(current: number, previous: number): number | null {
  if (previous <= 0) return null;
  return ((current - previous) / previous) * 100;
}

/** This week/month vs the prior period, all-time totals for the given (optional) sport filter. */
export async function getPeriodTotals(userId: string, sportType: SportType | null) {
  const now = new Date();
  const weekStart = startOfWeek(now);
  const lastWeekStart = addDays(weekStart, -7);
  const monthStart = startOfMonth(now);
  const lastMonthStart = new Date(monthStart.getFullYear(), monthStart.getMonth() - 1, 1);

  const activities = await db.activity.findMany({
    where: {
      userId,
      ...(sportType ? { sportType } : {}),
      startedAt: { gte: lastMonthStart },
    },
    select: { startedAt: true, distanceM: true, movingTimeSec: true, elevationGainM: true },
  });

  const inRange = (a: (typeof activities)[number], start: Date, end: Date) =>
    a.startedAt >= start && a.startedAt < end;

  return {
    thisWeek: summarize(activities.filter((a) => inRange(a, weekStart, addDays(weekStart, 7)))),
    lastWeek: summarize(activities.filter((a) => inRange(a, lastWeekStart, weekStart))),
    thisMonth: summarize(activities.filter((a) => inRange(a, monthStart, addDays(monthStart, 32)))),
    lastMonth: summarize(activities.filter((a) => inRange(a, lastMonthStart, monthStart))),
  };
}

export interface CalendarDay {
  date: string; // YYYY-MM-DD
  effortScore: number;
  level: 0 | 1 | 2 | 3 | 4;
}

/** One cell per day for the last `weeks` weeks, shaded by that day's total effort score relative to this athlete's own training days (so "hard" means hard *for them*, not an absolute scale). */
export async function getTrainingCalendar(userId: string, weeks: number): Promise<CalendarDay[]> {
  const now = new Date();
  const rangeStart = addDays(startOfWeek(now), -7 * (weeks - 1));

  const activities = await db.activity.findMany({
    where: { userId, startedAt: { gte: rangeStart } },
    select: { startedAt: true, effortScore: true },
  });

  const byDate = new Map<string, number>();
  for (const a of activities) {
    const key = a.startedAt.toISOString().slice(0, 10);
    byDate.set(key, (byDate.get(key) ?? 0) + a.effortScore);
  }

  const nonZero = Array.from(byDate.values())
    .filter((v) => v > 0)
    .sort((a, b) => a - b);
  const thresholds = [0.25, 0.5, 0.75].map((q) => nonZero[Math.floor(q * (nonZero.length - 1))] ?? 0);

  function levelFor(score: number): 0 | 1 | 2 | 3 | 4 {
    if (score <= 0) return 0;
    if (score <= thresholds[0]) return 1;
    if (score <= thresholds[1]) return 2;
    if (score <= thresholds[2]) return 3;
    return 4;
  }

  const days: CalendarDay[] = [];
  for (let i = 0; i < weeks * 7; i++) {
    const d = addDays(rangeStart, i);
    const key = d.toISOString().slice(0, 10);
    const effortScore = byDate.get(key) ?? 0;
    days.push({ date: key, effortScore, level: levelFor(effortScore) });
  }
  return days;
}

export interface FitnessFormPoint {
  date: string;
  fitness: number; // CTL, 42-day EWMA of daily load
  form: number; // TSB, CTL - ATL(7-day EWMA), as of the *previous* day
}

/**
 * Standard CTL/ATL/TSB training-load model: CTL is a 42-day exponentially
 * weighted moving average of daily effort score, ATL a 7-day EWMA of the
 * same, and form (TSB) is yesterday's CTL minus yesterday's ATL — today's
 * training hasn't "counted" toward fitness yet. Warms up from the
 * athlete's very first activity (not just the displayed window) so the
 * chart's start isn't artificially low from a cold EWMA.
 */
export async function getFitnessForm(userId: string, displayWeeks: number): Promise<FitnessFormPoint[]> {
  const first = await db.activity.findFirst({ where: { userId }, orderBy: { startedAt: "asc" } });
  if (!first) return [];

  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const warmupStart = new Date(first.startedAt);
  warmupStart.setHours(0, 0, 0, 0);

  const activities = await db.activity.findMany({
    where: { userId },
    select: { startedAt: true, effortScore: true },
  });
  const byDate = new Map<string, number>();
  for (const a of activities) {
    const key = a.startedAt.toISOString().slice(0, 10);
    byDate.set(key, (byDate.get(key) ?? 0) + a.effortScore);
  }

  const totalDays = Math.round((today.getTime() - warmupStart.getTime()) / 86_400_000) + 1;
  let ctl = 0;
  let atl = 0;
  const series: { date: string; ctl: number; atl: number }[] = [];

  for (let i = 0; i < totalDays; i++) {
    const d = addDays(warmupStart, i);
    const key = d.toISOString().slice(0, 10);
    const load = byDate.get(key) ?? 0;
    ctl = ctl + (load - ctl) / 42;
    atl = atl + (load - atl) / 7;
    series.push({ date: key, ctl, atl });
  }

  const displayStart = addDays(startOfWeek(today), -7 * (displayWeeks - 1));
  return series
    .filter((s) => new Date(s.date) >= displayStart)
    .map((s, i, arr) => ({
      date: s.date,
      fitness: s.ctl,
      form: i > 0 ? arr[i - 1].ctl - arr[i - 1].atl : s.ctl - s.atl,
    }));
}
