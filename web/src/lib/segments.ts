import { db } from "@/lib/db";
import { buildTrack, elevationGainFromTrack } from "@/lib/geo";
import { isSegmentNearActivity, matchTrackToSegment } from "@/lib/segment-matching";
import { parseTrack, serializeTrack } from "@/lib/track";
import type { Activity } from "@/generated/prisma/client";

const MIN_SEGMENT_DISTANCE_M = 50;

export async function createSegmentFromActivity(input: {
  activityId: string;
  userId: string;
  name: string;
  startIndex: number;
  endIndex: number;
}) {
  const activity = await db.activity.findUnique({ where: { id: input.activityId } });
  if (!activity || activity.userId !== input.userId) {
    throw new Error("Activity not found");
  }

  const track = parseTrack(activity.points);
  const start = Math.max(0, Math.min(input.startIndex, track.length - 2));
  const end = Math.max(start + 1, Math.min(input.endIndex, track.length - 1));
  const slice = track.slice(start, end + 1);

  const distanceM = slice[slice.length - 1].distM - slice[0].distM;
  if (distanceM < MIN_SEGMENT_DISTANCE_M) {
    throw new Error(`Segment must be at least ${MIN_SEGMENT_DISTANCE_M}m`);
  }

  const elevationGainM = elevationGainFromTrack(slice);
  const elevationChangeM = slice[slice.length - 1].ele - slice[0].ele;
  const avgGrade = (elevationChangeM / distanceM) * 100;

  const segment = await db.segment.create({
    data: {
      name: input.name,
      sportType: activity.sportType,
      createdByUserId: input.userId,
      sourceActivityId: activity.id,
      points: serializeTrack(slice),
      startLat: slice[0].lat,
      startLng: slice[0].lng,
      endLat: slice[slice.length - 1].lat,
      endLng: slice[slice.length - 1].lng,
      distanceM,
      elevationGainM,
      avgGrade,
    },
  });

  // The activity it was carved from obviously covers it — give it the
  // founding effort rather than leaving the segment creator absent from
  // their own segment's leaderboard until they happen to run it again.
  await db.segmentEffort.create({
    data: {
      segmentId: segment.id,
      activityId: activity.id,
      userId: input.userId,
      elapsedSec: (slice[slice.length - 1].t - slice[0].t) / 1000,
      startedAt: new Date(slice[0].t),
      isPr: true,
    },
  });

  return segment;
}

/**
 * Runs after any activity with a real GPS track is saved (live recording,
 * GPX/TCX upload). Manual entries have no track and are skipped. See
 * src/lib/segment-matching.ts for the matching approach itself.
 */
export async function matchActivityAgainstSegments(activity: Activity) {
  const track = parseTrack(activity.points);
  if (track.length < 2) return;

  const candidates = await db.segment.findMany({
    where: { sportType: activity.sportType },
  });

  for (const segment of candidates) {
    if (segment.sourceActivityId === activity.id) continue; // don't match a segment against the activity it was carved from
    if (!isSegmentNearActivity({ lat: segment.startLat, lng: segment.startLng }, track)) continue;

    const segmentTrack = buildTrack(parseTrack(segment.points));
    const match = matchTrackToSegment(track, segmentTrack);
    if (!match) continue;

    await db.segmentEffort.create({
      data: {
        segmentId: segment.id,
        activityId: activity.id,
        userId: activity.userId,
        elapsedSec: match.elapsedSec,
        startedAt: match.startedAt,
      },
    });

    await recomputePrForUserOnSegment(segment.id, activity.userId);
  }
}

/** Re-flags which of a user's efforts on a segment is their PR (fastest), after a new effort is added. */
async function recomputePrForUserOnSegment(segmentId: string, userId: string) {
  const efforts = await db.segmentEffort.findMany({
    where: { segmentId, userId },
    orderBy: { elapsedSec: "asc" },
  });
  const best = efforts[0];
  if (!best) return;
  await db.$transaction([
    db.segmentEffort.updateMany({
      where: { segmentId, userId, NOT: { id: best.id } },
      data: { isPr: false },
    }),
    db.segmentEffort.update({ where: { id: best.id }, data: { isPr: true } }),
  ]);
}
