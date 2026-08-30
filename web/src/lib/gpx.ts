import { XMLParser } from "fast-xml-parser";
import type { RawPoint } from "@/lib/track";

function asArray<T>(value: T | T[] | undefined): T[] {
  if (value === undefined) return [];
  return Array.isArray(value) ? value : [value];
}

const parser = new XMLParser({ ignoreAttributes: false, attributeNamePrefix: "" });

/** Parses a GPX file's track points into raw lat/lng/ele/time points. Throws if no track points are found. */
export function parseGpx(xml: string): RawPoint[] {
  const doc = parser.parse(xml);
  const gpx = doc.gpx;
  if (!gpx) throw new Error("Not a GPX file");

  const points: RawPoint[] = [];
  for (const trk of asArray(gpx.trk)) {
    for (const trkseg of asArray(trk.trkseg)) {
      for (const trkpt of asArray(trkseg.trkpt)) {
        const lat = Number(trkpt.lat);
        const lng = Number(trkpt.lon);
        const ele = trkpt.ele !== undefined ? Number(trkpt.ele) : 0;
        const time = trkpt.time ? Date.parse(trkpt.time) : NaN;
        if (Number.isFinite(lat) && Number.isFinite(lng) && Number.isFinite(time)) {
          points.push({ lat, lng, ele: Number.isFinite(ele) ? ele : 0, t: time });
        }
      }
    }
  }

  if (points.length === 0) throw new Error("No track points with timestamps found in GPX file");
  return points;
}
