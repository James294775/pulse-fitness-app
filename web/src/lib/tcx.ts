import { XMLParser } from "fast-xml-parser";
import type { RawPoint } from "@/lib/track";

function asArray<T>(value: T | T[] | undefined): T[] {
  if (value === undefined) return [];
  return Array.isArray(value) ? value : [value];
}

const parser = new XMLParser({ ignoreAttributes: false, attributeNamePrefix: "" });

/** Parses a TCX (Garmin Training Center XML) file's track points. Throws if no track points are found. */
export function parseTcx(xml: string): RawPoint[] {
  const doc = parser.parse(xml);
  const db = doc.TrainingCenterDatabase;
  if (!db) throw new Error("Not a TCX file");

  const points: RawPoint[] = [];
  for (const activity of asArray(db.Activities?.Activity)) {
    for (const lap of asArray(activity.Lap)) {
      for (const track of asArray(lap.Track)) {
        for (const tp of asArray(track.Trackpoint)) {
          const lat = tp.Position?.LatitudeDegrees;
          const lng = tp.Position?.LongitudeDegrees;
          const ele = tp.AltitudeMeters;
          const time = tp.Time ? Date.parse(tp.Time) : NaN;
          if (lat !== undefined && lng !== undefined && Number.isFinite(time)) {
            points.push({
              lat: Number(lat),
              lng: Number(lng),
              ele: ele !== undefined ? Number(ele) : 0,
              t: time,
            });
          }
        }
      }
    }
  }

  if (points.length === 0) throw new Error("No track points with position/time found in TCX file");
  return points;
}
