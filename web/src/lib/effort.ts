import type { SportType } from "@/generated/prisma/client";

/**
 * Relative-effort heuristic, not a true TRIMP score — we have no heart rate
 * data. Weighted minutes (higher weight = more taxing per minute at a
 * typical effort for that sport) plus a small elevation penalty. Used for
 * the feed's "relative effort" figure and, in Phase 6, the 7/42-day rolling
 * training load. Documented here since the exact weights are a judgment
 * call, not a standard.
 */
const SPORT_INTENSITY: Record<SportType, number> = {
  run: 1.6,
  trail_run: 1.8,
  ride: 1.0,
  gravel_ride: 1.1,
  walk: 0.6,
  hike: 0.9,
  swim: 1.7,
  row: 1.5,
  ski: 1.3,
  gym: 1.2,
};

export function computeEffortScore(input: {
  sportType: SportType;
  movingTimeSec: number;
  elevationGainM: number;
}): number {
  const minutes = input.movingTimeSec / 60;
  const intensity = SPORT_INTENSITY[input.sportType] ?? 1;
  const elevationBonus = input.elevationGainM * 0.05;
  return Math.round(minutes * intensity + elevationBonus);
}

/** Rough calorie estimate: MET-like burn rate per sport, scaled by duration. Not personalized to body weight — a documented simplification. */
const KCAL_PER_MINUTE: Record<SportType, number> = {
  run: 11,
  trail_run: 12,
  ride: 8,
  gravel_ride: 8.5,
  walk: 4.5,
  hike: 6,
  swim: 10,
  row: 9,
  ski: 9,
  gym: 6,
};

export function estimateCalories(input: { sportType: SportType; movingTimeSec: number }): number {
  return Math.round((input.movingTimeSec / 60) * (KCAL_PER_MINUTE[input.sportType] ?? 7));
}
