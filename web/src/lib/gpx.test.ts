import { describe, expect, it } from "vitest";
import { parseGpx } from "./gpx";

const VALID_GPX = `<?xml version="1.0"?>
<gpx version="1.1">
  <trk>
    <trkseg>
      <trkpt lat="49.28" lon="-123.12">
        <ele>10</ele>
        <time>2026-01-01T00:00:00Z</time>
      </trkpt>
      <trkpt lat="49.281" lon="-123.121">
        <ele>12</ele>
        <time>2026-01-01T00:00:10Z</time>
      </trkpt>
    </trkseg>
  </trk>
</gpx>`;

describe("parseGpx", () => {
  it("parses track points with lat/lng/ele/time", () => {
    const points = parseGpx(VALID_GPX);
    expect(points).toHaveLength(2);
    expect(points[0]).toEqual({ lat: 49.28, lng: -123.12, ele: 10, t: Date.parse("2026-01-01T00:00:00Z") });
    expect(points[1].t).toBeGreaterThan(points[0].t);
  });

  it("defaults missing elevation to 0", () => {
    const gpx = `<gpx><trk><trkseg>
      <trkpt lat="1" lon="2"><time>2026-01-01T00:00:00Z</time></trkpt>
      <trkpt lat="1.001" lon="2"><time>2026-01-01T00:00:05Z</time></trkpt>
    </trkseg></trk></gpx>`;
    const points = parseGpx(gpx);
    expect(points[0].ele).toBe(0);
  });

  it("throws on a document that isn't GPX", () => {
    expect(() => parseGpx("<foo></foo>")).toThrow("Not a GPX file");
  });

  it("throws when there are no track points with timestamps", () => {
    const gpx = `<gpx><trk><trkseg><trkpt lat="1" lon="2"></trkpt></trkseg></trk></gpx>`;
    expect(() => parseGpx(gpx)).toThrow("No track points");
  });

  it("skips points missing a valid timestamp rather than crashing", () => {
    const gpx = `<gpx><trk><trkseg>
      <trkpt lat="1" lon="2"><ele>5</ele></trkpt>
      <trkpt lat="1.001" lon="2"><ele>5</ele><time>2026-01-01T00:00:05Z</time></trkpt>
    </trkseg></trk></gpx>`;
    const points = parseGpx(gpx);
    expect(points).toHaveLength(1);
  });

  it("handles multiple track segments", () => {
    const gpx = `<gpx><trk>
      <trkseg><trkpt lat="1" lon="1"><time>2026-01-01T00:00:00Z</time></trkpt></trkseg>
      <trkseg><trkpt lat="2" lon="2"><time>2026-01-01T00:01:00Z</time></trkpt></trkseg>
    </trk></gpx>`;
    const points = parseGpx(gpx);
    expect(points).toHaveLength(2);
  });
});
