// A track is stored on Activity/Segment/Route as a JSON string of TrackPoint[].
// See DECISIONS.md (Phase 1) for why this is a JSON column rather than a
// child table.

export interface RawPoint {
  lat: number;
  lng: number;
  ele: number;
  /** epoch milliseconds */
  t: number;
}

export interface TrackPoint extends RawPoint {
  /** cumulative distance from the first point, in meters */
  distM: number;
}

export function parseTrack(json: string): TrackPoint[] {
  if (!json) return [];
  try {
    const parsed = JSON.parse(json);
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

export function serializeTrack(points: TrackPoint[]): string {
  return JSON.stringify(points);
}
