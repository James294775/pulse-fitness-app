import { describe, expect, it } from "vitest";
import { parseTcx } from "./tcx";

const VALID_TCX = `<?xml version="1.0"?>
<TrainingCenterDatabase>
  <Activities>
    <Activity>
      <Lap>
        <Track>
          <Trackpoint>
            <Time>2026-01-01T00:00:00Z</Time>
            <Position><LatitudeDegrees>49.28</LatitudeDegrees><LongitudeDegrees>-123.12</LongitudeDegrees></Position>
            <AltitudeMeters>10</AltitudeMeters>
          </Trackpoint>
          <Trackpoint>
            <Time>2026-01-01T00:00:10Z</Time>
            <Position><LatitudeDegrees>49.281</LatitudeDegrees><LongitudeDegrees>-123.121</LongitudeDegrees></Position>
            <AltitudeMeters>12</AltitudeMeters>
          </Trackpoint>
        </Track>
      </Lap>
    </Activity>
  </Activities>
</TrainingCenterDatabase>`;

describe("parseTcx", () => {
  it("parses trackpoints with position/altitude/time", () => {
    const points = parseTcx(VALID_TCX);
    expect(points).toHaveLength(2);
    expect(points[0]).toEqual({ lat: 49.28, lng: -123.12, ele: 10, t: Date.parse("2026-01-01T00:00:00Z") });
  });

  it("defaults missing altitude to 0", () => {
    const tcx = `<TrainingCenterDatabase><Activities><Activity><Lap><Track>
      <Trackpoint><Time>2026-01-01T00:00:00Z</Time><Position><LatitudeDegrees>1</LatitudeDegrees><LongitudeDegrees>2</LongitudeDegrees></Position></Trackpoint>
    </Track></Lap></Activity></Activities></TrainingCenterDatabase>`;
    const points = parseTcx(tcx);
    expect(points[0].ele).toBe(0);
  });

  it("throws on a document that isn't TCX", () => {
    expect(() => parseTcx("<foo></foo>")).toThrow("Not a TCX file");
  });

  it("throws when there are no trackpoints with position/time", () => {
    const tcx = `<TrainingCenterDatabase><Activities><Activity><Lap><Track>
      <Trackpoint></Trackpoint>
    </Track></Lap></Activity></Activities></TrainingCenterDatabase>`;
    expect(() => parseTcx(tcx)).toThrow("No track points");
  });

  it("handles multiple laps", () => {
    const tcx = `<TrainingCenterDatabase><Activities><Activity>
      <Lap><Track><Trackpoint><Time>2026-01-01T00:00:00Z</Time><Position><LatitudeDegrees>1</LatitudeDegrees><LongitudeDegrees>1</LongitudeDegrees></Position></Trackpoint></Track></Lap>
      <Lap><Track><Trackpoint><Time>2026-01-01T00:01:00Z</Time><Position><LatitudeDegrees>2</LatitudeDegrees><LongitudeDegrees>2</LongitudeDegrees></Position></Trackpoint></Track></Lap>
    </Activity></Activities></TrainingCenterDatabase>`;
    const points = parseTcx(tcx);
    expect(points).toHaveLength(2);
  });
});
