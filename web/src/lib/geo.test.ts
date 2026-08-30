import { describe, expect, it } from "vitest";
import { buildTrack, computeSplits, computeTrackStats, downsample, elevationGainFromTrack, haversineMeters } from "./geo";
import type { TrackPoint } from "./track";

describe("haversineMeters", () => {
  it("returns 0 for identical points", () => {
    expect(haversineMeters({ lat: 49.28, lng: -123.12 }, { lat: 49.28, lng: -123.12 })).toBe(0);
  });

  it("matches a known distance (roughly 1° latitude ≈ 111.2 km)", () => {
    const d = haversineMeters({ lat: 0, lng: 0 }, { lat: 1, lng: 0 });
    expect(d).toBeGreaterThan(110_000);
    expect(d).toBeLessThan(112_000);
  });
});

describe("buildTrack", () => {
  it("attaches cumulative distance starting at 0", () => {
    const track = buildTrack([
      { lat: 49.28, lng: -123.12, ele: 10, t: 0 },
      { lat: 49.281, lng: -123.12, ele: 12, t: 1000 },
      { lat: 49.282, lng: -123.12, ele: 14, t: 2000 },
    ]);
    expect(track[0].distM).toBe(0);
    expect(track[1].distM).toBeGreaterThan(0);
    expect(track[2].distM).toBeGreaterThan(track[1].distM);
  });

  it("handles a single point without throwing", () => {
    const track = buildTrack([{ lat: 0, lng: 0, ele: 0, t: 0 }]);
    expect(track).toEqual([{ lat: 0, lng: 0, ele: 0, t: 0, distM: 0 }]);
  });
});

describe("elevationGainFromTrack", () => {
  it("sums only upward moves past the noise threshold", () => {
    const track: TrackPoint[] = [
      { lat: 0, lng: 0, ele: 100, t: 0, distM: 0 },
      { lat: 0, lng: 0, ele: 100.5, t: 1, distM: 1 }, // within noise threshold, ignored
      { lat: 0, lng: 0, ele: 110, t: 2, distM: 2 }, // real 10m climb
      { lat: 0, lng: 0, ele: 105, t: 3, distM: 3 }, // descent, not counted
      { lat: 0, lng: 0, ele: 120, t: 4, distM: 4 }, // another real climb, from the 105 low point: +15
    ];
    // 100 -> 110 (+10, since the +0.5 blip never resets the "last counted" baseline)
    // 110 -> 105 (descent, resets baseline to 105)
    // 105 -> 120 (+15)
    expect(elevationGainFromTrack(track)).toBeCloseTo(25, 5);
  });

  it("returns 0 for a flat track", () => {
    const track: TrackPoint[] = [
      { lat: 0, lng: 0, ele: 50, t: 0, distM: 0 },
      { lat: 0, lng: 0, ele: 50, t: 1, distM: 1 },
      { lat: 0, lng: 0, ele: 50, t: 2, distM: 2 },
    ];
    expect(elevationGainFromTrack(track)).toBe(0);
  });
});

describe("computeTrackStats", () => {
  it("excludes stationary stretches from moving time", () => {
    // 0-10s: moves 50m (5 m/s, well above the 0.5 m/s threshold)
    // 10-40s: stays put (stopped at a light)
    // 40-50s: moves another 50m
    const track: TrackPoint[] = [
      { lat: 0, lng: 0, ele: 0, t: 0, distM: 0 },
      { lat: 0, lng: 0, ele: 0, t: 10_000, distM: 50 },
      { lat: 0, lng: 0, ele: 0, t: 40_000, distM: 50 },
      { lat: 0, lng: 0, ele: 0, t: 50_000, distM: 100 },
    ];
    const stats = computeTrackStats(track);
    expect(stats.elapsedTimeSec).toBe(50);
    expect(stats.movingTimeSec).toBe(20); // the two 10s moving stretches, not the 30s stop
    expect(stats.distanceM).toBe(100);
  });

  it("returns zeros for a track with fewer than 2 points", () => {
    const stats = computeTrackStats([]);
    expect(stats).toEqual({
      distanceM: 0,
      elapsedTimeSec: 0,
      movingTimeSec: 0,
      elevationGainM: 0,
      avgPaceSecPerKm: null,
      avgSpeedKmh: null,
    });
  });
});

describe("computeSplits", () => {
  it("splits a track into fixed-length chunks", () => {
    // A straight line roughly 2.5km long (using longitude degrees at the
    // equator, where 1° ≈ 111.2km, so 0.0225° ≈ 2.5km) at a steady pace.
    const points: TrackPoint[] = [];
    for (let i = 0; i <= 50; i++) {
      points.push({ lat: 0, lng: i * 0.00045, ele: 0, t: i * 12_000, distM: 0 });
    }
    const track = buildTrack(points);
    const splits = computeSplits(track, 1000);
    expect(splits.length).toBe(3); // ~2.5km at 1km splits -> 2 full + 1 partial
    expect(splits[0].index).toBe(1);
    expect(splits[2].distanceM).toBeLessThan(1000); // the final partial split
  });

  it("returns an empty array for a track with fewer than 2 points", () => {
    expect(computeSplits([], 1000)).toEqual([]);
  });
});

describe("downsample", () => {
  it("leaves short arrays untouched", () => {
    const arr = [1, 2, 3];
    expect(downsample(arr, 10)).toEqual(arr);
  });

  it("reduces a long array to roughly the requested size, keeping the last point", () => {
    const arr = Array.from({ length: 1000 }, (_, i) => i);
    const result = downsample(arr, 50);
    expect(result.length).toBeLessThanOrEqual(51);
    expect(result[result.length - 1]).toBe(999);
  });
});
