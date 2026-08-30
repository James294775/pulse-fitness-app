import { describe, expect, it } from "vitest";
import { clipTrackToZones, type Zone } from "./privacy";

// ~0.0009 degrees of latitude is roughly 100m — used to place points at a
// known rough distance from a zone center without pulling in haversineMeters.
function line(n: number) {
  return Array.from({ length: n }, (_, i) => ({ lat: i * 0.0009, lng: 0 }));
}

describe("clipTrackToZones", () => {
  it("returns the track unchanged when there are no zones", () => {
    const track = line(5);
    expect(clipTrackToZones(track, [])).toBe(track);
  });

  it("returns the track unchanged for an empty track", () => {
    const zones: Zone[] = [{ lat: 0, lng: 0, radiusM: 200 }];
    expect(clipTrackToZones([], zones)).toEqual([]);
  });

  it("strips points near the start that fall inside a zone", () => {
    const track = line(10); // point 0 at the zone center, roughly 100m apart
    const zones: Zone[] = [{ lat: 0, lng: 0, radiusM: 150 }]; // covers points 0 and 1 (~100m), not point 2 (~200m)
    const clipped = clipTrackToZones(track, zones);
    expect(clipped[0]).toEqual(track[2]);
    expect(clipped).toHaveLength(8);
  });

  it("strips points near the end that fall inside a zone", () => {
    const track = line(10);
    const last = track[track.length - 1];
    const zones: Zone[] = [{ lat: last.lat, lng: last.lng, radiusM: 150 }];
    const clipped = clipTrackToZones(track, zones);
    expect(clipped[clipped.length - 1]).toEqual(track[track.length - 3]);
  });

  it("strips both ends when zones cover the start and end", () => {
    const track = line(10);
    const zones: Zone[] = [
      { lat: track[0].lat, lng: track[0].lng, radiusM: 150 },
      { lat: track[9].lat, lng: track[9].lng, radiusM: 150 },
    ];
    const clipped = clipTrackToZones(track, zones);
    expect(clipped[0]).toEqual(track[2]);
    expect(clipped[clipped.length - 1]).toEqual(track[7]);
  });

  it("does not touch points in the middle of the track even if a zone covers them", () => {
    const track = line(10);
    const mid = track[5];
    const zones: Zone[] = [{ lat: mid.lat, lng: mid.lng, radiusM: 150 }];
    const clipped = clipTrackToZones(track, zones);
    expect(clipped).toHaveLength(10);
    expect(clipped).toEqual(track);
  });

  it("returns an empty array when the entire track sits inside a zone", () => {
    const track = line(3); // ~200m total span
    const zones: Zone[] = [{ lat: track[1].lat, lng: track[1].lng, radiusM: 10_000 }];
    expect(clipTrackToZones(track, zones)).toEqual([]);
  });
});
