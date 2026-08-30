import { db } from "@/lib/db";
import { buildTrack, computeTrackStats } from "@/lib/geo";
import { computeEffortScore, estimateCalories } from "@/lib/effort";
import { serializeTrack, type RawPoint } from "@/lib/track";
import type { ActivityPrivacy, ActivitySource, SportType } from "@/generated/prisma/client";

interface CreateFromTrackInput {
  userId: string;
  sportType: SportType;
  title: string;
  description?: string | null;
  privacy: ActivityPrivacy;
  source: ActivitySource;
  points: RawPoint[];
}

/** Used by live recording finish, and GPX/TCX upload — anything that has a real GPS track. */
export async function createActivityFromTrack(input: CreateFromTrackInput) {
  if (input.points.length < 2) {
    throw new Error("Track needs at least two points");
  }
  const track = buildTrack(input.points);
  const stats = computeTrackStats(track);
  const effortScore = computeEffortScore({
    sportType: input.sportType,
    movingTimeSec: stats.movingTimeSec,
    elevationGainM: stats.elevationGainM,
  });
  const calories = estimateCalories({ sportType: input.sportType, movingTimeSec: stats.movingTimeSec });

  return db.activity.create({
    data: {
      userId: input.userId,
      sportType: input.sportType,
      title: input.title,
      description: input.description || null,
      privacy: input.privacy,
      source: input.source,
      startedAt: new Date(track[0].t),
      elapsedTimeSec: Math.round(stats.elapsedTimeSec),
      movingTimeSec: Math.round(stats.movingTimeSec),
      distanceM: stats.distanceM,
      elevationGainM: stats.elevationGainM,
      avgPaceSecPerKm: stats.avgPaceSecPerKm,
      avgSpeedKmh: stats.avgSpeedKmh,
      calories,
      effortScore,
      points: serializeTrack(track),
    },
  });
}

interface CreateManualInput {
  userId: string;
  sportType: SportType;
  title: string;
  description?: string | null;
  privacy: ActivityPrivacy;
  startedAt: Date;
  distanceM: number;
  movingTimeSec: number;
  elevationGainM: number;
}

/** Manual entry — no GPS track, so no map/elevation-profile/splits, just the summary numbers the athlete provides. */
export async function createManualActivity(input: CreateManualInput) {
  const avgSpeedKmh = input.movingTimeSec > 0 ? input.distanceM / 1000 / (input.movingTimeSec / 3600) : null;
  const avgPaceSecPerKm =
    input.distanceM > 0 && input.movingTimeSec > 0 ? input.movingTimeSec / (input.distanceM / 1000) : null;
  const effortScore = computeEffortScore({
    sportType: input.sportType,
    movingTimeSec: input.movingTimeSec,
    elevationGainM: input.elevationGainM,
  });
  const calories = estimateCalories({ sportType: input.sportType, movingTimeSec: input.movingTimeSec });

  return db.activity.create({
    data: {
      userId: input.userId,
      sportType: input.sportType,
      title: input.title,
      description: input.description || null,
      privacy: input.privacy,
      source: "manual",
      startedAt: input.startedAt,
      elapsedTimeSec: Math.round(input.movingTimeSec),
      movingTimeSec: Math.round(input.movingTimeSec),
      distanceM: input.distanceM,
      elevationGainM: input.elevationGainM,
      avgPaceSecPerKm,
      avgSpeedKmh,
      calories,
      effortScore,
      points: "[]",
    },
  });
}
