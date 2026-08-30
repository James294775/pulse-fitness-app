import { db } from "@/lib/db";
import { haversineMeters } from "@/lib/geo";

export interface Zone {
  lat: number;
  lng: number;
  radiusM: number;
}

/**
 * Strips points from the start and end of a track that fall inside any
 * privacy zone. Only the leading/trailing runs are clipped — a zone
 * doesn't punch a hole in the middle of a route, matching how this feature
 * works in the wild (hide where a run *starts and ends*, not wherever it
 * happens to pass near home once). If the whole track sits inside a zone,
 * clipping can legitimately empty it out entirely — the caller then shows
 * "no GPS track" rather than a map with nothing on it, which is the
 * correct outcome, not a bug.
 */
export function clipTrackToZones<T extends { lat: number; lng: number }>(track: T[], zones: Zone[]): T[] {
  if (zones.length === 0 || track.length === 0) return track;

  const insideAnyZone = (p: { lat: number; lng: number }) =>
    zones.some((z) => haversineMeters(p, z) <= z.radiusM);

  let start = 0;
  while (start < track.length && insideAnyZone(track[start])) start++;

  let end = track.length - 1;
  while (end >= start && insideAnyZone(track[end])) end--;

  return track.slice(start, end + 1);
}

/**
 * The one place any read path gets a viewer-facing track from. Aggregate
 * stats (distance, elevation gain, etc.) are stored on Activity separately
 * from the raw points and are never touched by this — only the displayed
 * route/map/elevation-profile is clipped, and only for someone who isn't
 * the owner. The owner always sees their own full track.
 */
export async function getViewableTrack<T extends { lat: number; lng: number }>(
  track: T[],
  ownerId: string,
  viewerId: string
): Promise<T[]> {
  if (ownerId === viewerId) return track;

  const zones = await db.privacyZone.findMany({
    where: { userId: ownerId },
    select: { lat: true, lng: true, radiusM: true },
  });
  if (zones.length === 0) return track;

  return clipTrackToZones(track, zones);
}
