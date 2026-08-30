import type { RawPoint, TrackPoint } from "@/lib/track";

const EARTH_RADIUS_M = 6371000;

/** Great-circle distance between two lat/lng points, in meters. */
export function haversineMeters(a: { lat: number; lng: number }, b: { lat: number; lng: number }): number {
  const toRad = (deg: number) => (deg * Math.PI) / 180;
  const dLat = toRad(b.lat - a.lat);
  const dLng = toRad(b.lng - a.lng);
  const lat1 = toRad(a.lat);
  const lat2 = toRad(b.lat);
  const h =
    Math.sin(dLat / 2) ** 2 + Math.cos(lat1) * Math.cos(lat2) * Math.sin(dLng / 2) ** 2;
  return 2 * EARTH_RADIUS_M * Math.asin(Math.min(1, Math.sqrt(h)));
}

/** Attaches cumulative distance to a raw point sequence. Assumes points are already time-ordered. */
export function buildTrack(points: RawPoint[]): TrackPoint[] {
  let cumulative = 0;
  return points.map((p, i) => {
    if (i > 0) cumulative += haversineMeters(points[i - 1], p);
    return { ...p, distM: cumulative };
  });
}

/**
 * Elevation gain from a track, ignoring sub-threshold noise (GPS altitude is
 * noisy; without smoothing, gain is wildly overstated). Sums only upward
 * deltas larger than `thresholdM`.
 */
export function elevationGainFromTrack(points: TrackPoint[], thresholdM = 2): number {
  let gain = 0;
  let lastCounted = points[0]?.ele ?? 0;
  for (const p of points.slice(1)) {
    const delta = p.ele - lastCounted;
    if (delta > thresholdM) {
      gain += delta;
      lastCounted = p.ele;
    } else if (delta < -thresholdM) {
      lastCounted = p.ele;
    }
  }
  return gain;
}

const STATIONARY_SPEED_MPS = 0.5;

export interface TrackStats {
  distanceM: number;
  elapsedTimeSec: number;
  movingTimeSec: number;
  elevationGainM: number;
  avgPaceSecPerKm: number | null;
  avgSpeedKmh: number | null;
}

/** Derives summary stats from a GPS track. Moving time excludes stretches slower than a walking-pace threshold (stopped at lights, photo breaks, etc). */
export function computeTrackStats(points: TrackPoint[]): TrackStats {
  if (points.length < 2) {
    return {
      distanceM: 0,
      elapsedTimeSec: 0,
      movingTimeSec: 0,
      elevationGainM: 0,
      avgPaceSecPerKm: null,
      avgSpeedKmh: null,
    };
  }

  const distanceM = points[points.length - 1].distM;
  const elapsedTimeSec = (points[points.length - 1].t - points[0].t) / 1000;

  let movingTimeSec = 0;
  for (let i = 1; i < points.length; i++) {
    const dt = (points[i].t - points[i - 1].t) / 1000;
    if (dt <= 0) continue;
    const dd = points[i].distM - points[i - 1].distM;
    const speed = dd / dt;
    if (speed >= STATIONARY_SPEED_MPS) movingTimeSec += dt;
  }

  const elevationGainM = elevationGainFromTrack(points);
  const avgSpeedKmh = movingTimeSec > 0 ? distanceM / 1000 / (movingTimeSec / 3600) : null;
  const avgPaceSecPerKm = distanceM > 0 && movingTimeSec > 0 ? movingTimeSec / (distanceM / 1000) : null;

  return { distanceM, elapsedTimeSec, movingTimeSec, elevationGainM, avgPaceSecPerKm, avgSpeedKmh };
}

/** Evenly-spaced sample of a track for chart rendering — plotting every raw GPS point is unnecessary and slow for long activities. */
export function downsample<T>(items: T[], maxPoints: number): T[] {
  if (items.length <= maxPoints) return items;
  const step = items.length / maxPoints;
  const result: T[] = [];
  for (let i = 0; i < maxPoints; i++) {
    result.push(items[Math.floor(i * step)]);
  }
  result.push(items[items.length - 1]);
  return result;
}

export interface Split {
  index: number; // 1-based km/mile number
  distanceM: number; // length of this split, meters (usually the full unit, less for the final partial split)
  timeSec: number;
  elevationChangeM: number;
}

/** Splits a track into fixed-length segments (1km or 1mi, by unitMeters). */
export function computeSplits(points: TrackPoint[], unitMeters: number): Split[] {
  if (points.length < 2) return [];
  const splits: Split[] = [];
  let splitStartIdx = 0;
  let nextBoundary = unitMeters;

  for (let i = 1; i < points.length; i++) {
    if (points[i].distM >= nextBoundary || i === points.length - 1) {
      const start = points[splitStartIdx];
      const end = points[i];
      splits.push({
        index: splits.length + 1,
        distanceM: end.distM - start.distM,
        timeSec: (end.t - start.t) / 1000,
        elevationChangeM: end.ele - start.ele,
      });
      splitStartIdx = i;
      nextBoundary += unitMeters;
    }
  }
  return splits;
}
