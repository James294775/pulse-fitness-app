import { describe, expect, it } from "vitest";
import { isSegmentNearActivity, matchTrackToSegment } from "./segment-matching";
import { buildTrack } from "./geo";
import type { RawPoint } from "./track";

// A straight 500m-ish "segment" running east along the equator, where
// 1 degree of longitude is ~111.2km, so 0.0045deg steps are ~500m apart.
function makeSegmentPoints(steps: number) {
  return Array.from({ length: steps + 1 }, (_, i) => ({ lat: 0, lng: i * 0.00045 }));
}

function trackFrom(raw: RawPoint[]) {
  return buildTrack(raw);
}

describe("matchTrackToSegment", () => {
  const segmentPoints = makeSegmentPoints(10); // ~5km segment

  it("matches an activity track that follows the segment exactly", () => {
    const raw: RawPoint[] = segmentPoints.map((p, i) => ({ lat: p.lat, lng: p.lng, ele: 0, t: i * 60_000 }));
    const track = trackFrom(raw);
    const match = matchTrackToSegment(track, segmentPoints);
    expect(match).not.toBeNull();
    expect(match!.elapsedSec).toBe(10 * 60);
  });

  it("matches when the segment occurs partway through a longer activity", () => {
    const lead: RawPoint[] = [
      { lat: -0.01, lng: -0.01, ele: 0, t: -120_000 },
      { lat: -0.005, lng: -0.005, ele: 0, t: -60_000 },
    ];
    const raw: RawPoint[] = [
      ...lead,
      ...segmentPoints.map((p, i) => ({ lat: p.lat, lng: p.lng, ele: 0, t: i * 60_000 })),
    ];
    const track = trackFrom(raw);
    const match = matchTrackToSegment(track, segmentPoints);
    expect(match).not.toBeNull();
    expect(match!.elapsedSec).toBe(10 * 60);
  });

  it("returns null when the track never comes near the segment", () => {
    const raw: RawPoint[] = [
      { lat: 10, lng: 10, ele: 0, t: 0 },
      { lat: 10.01, lng: 10.01, ele: 0, t: 60_000 },
    ];
    const track = trackFrom(raw);
    expect(matchTrackToSegment(track, segmentPoints)).toBeNull();
  });

  it("returns null when the track strays outside the corridor before reaching the end", () => {
    const raw: RawPoint[] = [
      { lat: 0, lng: 0, ele: 0, t: 0 },
      { lat: 0, lng: 0.00045 * 3, ele: 0, t: 60_000 },
      // Big lateral jump off the corridor (~1km north) then back toward the end,
      // never coming within 40m of any segment vertex again.
      { lat: 0.01, lng: 0.00045 * 6, ele: 0, t: 120_000 },
      { lat: 0.01, lng: 0.00045 * 10, ele: 0, t: 180_000 },
    ];
    const track = trackFrom(raw);
    expect(matchTrackToSegment(track, segmentPoints)).toBeNull();
  });

  it("returns null when traversing the segment in the wrong direction", () => {
    const reversed = [...segmentPoints].reverse();
    const raw: RawPoint[] = reversed.map((p, i) => ({ lat: p.lat, lng: p.lng, ele: 0, t: i * 60_000 }));
    const track = trackFrom(raw);
    expect(matchTrackToSegment(track, segmentPoints)).toBeNull();
  });

  it("returns null for tracks or segments with fewer than 2 points", () => {
    expect(matchTrackToSegment([], segmentPoints)).toBeNull();
    const track = trackFrom([{ lat: 0, lng: 0, ele: 0, t: 0 }]);
    expect(matchTrackToSegment(track, segmentPoints)).toBeNull();
  });
});

describe("isSegmentNearActivity", () => {
  it("returns true when the activity passes within the prefilter radius", () => {
    const track = trackFrom([
      { lat: 0, lng: 0, ele: 0, t: 0 },
      { lat: 0.001, lng: 0.001, ele: 0, t: 1000 },
    ]);
    expect(isSegmentNearActivity({ lat: 0, lng: 0 }, track)).toBe(true);
  });

  it("returns false when the activity is far from the segment", () => {
    const track = trackFrom([
      { lat: 10, lng: 10, ele: 0, t: 0 },
      { lat: 10.001, lng: 10.001, ele: 0, t: 1000 },
    ]);
    expect(isSegmentNearActivity({ lat: 0, lng: 0 }, track)).toBe(false);
  });
});
