import { haversineMeters } from "@/lib/geo";
import type { TrackPoint } from "@/lib/track";

// Matching tolerance — how far off the segment's line a GPS point can be
// and still count as "on" the segment. GPS noise on a phone/watch is
// commonly 5-15m even with good sky view, so 40m gives real margin without
// being so loose that a parallel street matches.
const CORRIDOR_TOLERANCE_M = 40;

// Cheap pre-filter distance: skip full matching for segments nowhere near
// this activity at all.
const BOUNDING_PREFILTER_M = 500;

export interface SegmentMatch {
  startedAt: Date;
  elapsedSec: number;
}

/**
 * Approximate segment matching, documented per PLAN.md — this is not exact.
 *
 * For each occurrence of the activity passing within tolerance of the
 * segment's start point, walk forward through the activity's points and
 * check each one stays within `CORRIDOR_TOLERANCE_M` of the *nearest
 * segment vertex* (a nearest-vertex approximation, not a true
 * point-to-polyline-segment projection — fine at typical GPS point
 * density, but can be slightly off on sparse tracks or tight switchbacks).
 * "Nearest vertex index" only increasing (with a small backward-noise
 * allowance) is used as the direction check, since the segment's points
 * are stored start-to-end.
 *
 * Known limitations: only the *first* qualifying pass through the segment
 * in an activity is matched (an out-and-back covering a segment twice
 * only records the first direction), and there's no sub-point
 * interpolation at the entry/exit boundary, so elapsed time has up to one
 * GPS-sample-interval of slop at each end.
 */
export function matchTrackToSegment(
  activityTrack: TrackPoint[],
  segmentPoints: Pick<TrackPoint, "lat" | "lng">[]
): SegmentMatch | null {
  if (activityTrack.length < 2 || segmentPoints.length < 2) return null;

  const start = segmentPoints[0];
  const end = segmentPoints[segmentPoints.length - 1];
  const lastVertexIndex = segmentPoints.length - 1;

  for (let i = 0; i < activityTrack.length; i++) {
    if (haversineMeters(activityTrack[i], start) > CORRIDOR_TOLERANCE_M) continue;

    let lastProgress = 0;
    let matchedAt = -1;

    for (let j = i; j < activityTrack.length; j++) {
      const point = activityTrack[j];
      const { nearestIndex, distanceM } = nearestVertex(point, segmentPoints);

      if (distanceM > CORRIDOR_TOLERANCE_M) break; // strayed off the corridor
      if (nearestIndex < lastProgress - 2) break; // moving backwards along the segment (beyond noise slack)
      lastProgress = Math.max(lastProgress, nearestIndex);

      if (nearestIndex >= lastVertexIndex - 2 && haversineMeters(point, end) <= CORRIDOR_TOLERANCE_M) {
        matchedAt = j;
        break;
      }
    }

    if (matchedAt !== -1) {
      return {
        startedAt: new Date(activityTrack[i].t),
        elapsedSec: (activityTrack[matchedAt].t - activityTrack[i].t) / 1000,
      };
    }
    // No match from this start occurrence — keep scanning in case the
    // segment's start point is passed again later in the activity.
  }

  return null;
}

function nearestVertex(
  point: { lat: number; lng: number },
  polyline: Pick<TrackPoint, "lat" | "lng">[]
): { nearestIndex: number; distanceM: number } {
  let nearestIndex = 0;
  let best = Infinity;
  for (let k = 0; k < polyline.length; k++) {
    const d = haversineMeters(point, polyline[k]);
    if (d < best) {
      best = d;
      nearestIndex = k;
    }
  }
  return { nearestIndex, distanceM: best };
}

/** Cheap pre-filter: is this segment's start anywhere near the activity at all? Avoids running the full O(n*m) matcher against every segment in the database. */
export function isSegmentNearActivity(
  segmentStart: { lat: number; lng: number },
  activityTrack: TrackPoint[]
): boolean {
  // Coarse bounding box first (degrees), then a real distance check on the
  // few points that pass — cheaper than haversine on every point.
  const bufferDeg = BOUNDING_PREFILTER_M / 111_320;
  for (const p of activityTrack) {
    if (Math.abs(p.lat - segmentStart.lat) > bufferDeg || Math.abs(p.lng - segmentStart.lng) > bufferDeg) {
      continue;
    }
    if (haversineMeters(p, segmentStart) <= BOUNDING_PREFILTER_M) return true;
  }
  return false;
}
