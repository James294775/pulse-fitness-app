// Central unit conversion — every distance/elevation is stored in the DB as
// metres and every duration as seconds. All display formatting funnels
// through here so metric/imperial is never computed ad hoc in a component.

export type Units = "metric" | "imperial";

const METERS_PER_MILE = 1609.344;
const FEET_PER_METER = 3.28084;

export function metersToDistance(meters: number, units: Units): number {
  return units === "imperial" ? meters / METERS_PER_MILE : meters / 1000;
}

export function distanceUnitLabel(units: Units): string {
  return units === "imperial" ? "mi" : "km";
}

export function metersToElevation(meters: number, units: Units): number {
  return units === "imperial" ? meters * FEET_PER_METER : meters;
}

export function elevationUnitLabel(units: Units): string {
  return units === "imperial" ? "ft" : "m";
}

export function formatDistance(meters: number, units: Units, fractionDigits = 2): string {
  return `${metersToDistance(meters, units).toFixed(fractionDigits)} ${distanceUnitLabel(units)}`;
}

export function formatElevation(meters: number, units: Units): string {
  return `${Math.round(metersToElevation(meters, units))} ${elevationUnitLabel(units)}`;
}

/** mm:ss for < 1h, h:mm:ss beyond. */
export function formatDuration(totalSeconds: number): string {
  const s = Math.max(0, Math.round(totalSeconds));
  const h = Math.floor(s / 3600);
  const m = Math.floor((s % 3600) / 60);
  const sec = s % 60;
  if (h > 0) {
    return `${h}:${String(m).padStart(2, "0")}:${String(sec).padStart(2, "0")}`;
  }
  return `${m}:${String(sec).padStart(2, "0")}`;
}

/** Pace as min:sec per km or mile, from a total distance + duration. */
export function formatPace(meters: number, seconds: number, units: Units): string {
  const distance = metersToDistance(meters, units);
  if (distance <= 0) return "--";
  const secPerUnit = seconds / distance;
  const m = Math.floor(secPerUnit / 60);
  const s = Math.round(secPerUnit % 60);
  return `${m}:${String(s).padStart(2, "0")} /${distanceUnitLabel(units)}`;
}

/** Speed in km/h or mph. */
export function formatSpeed(meters: number, seconds: number, units: Units): string {
  if (seconds <= 0) return "--";
  const distance = metersToDistance(meters, units);
  const hours = seconds / 3600;
  return `${(distance / hours).toFixed(1)} ${units === "imperial" ? "mph" : "km/h"}`;
}

/** Sports whose primary display metric is pace (min/distance) rather than speed. */
export const PACE_SPORTS = new Set(["run", "trail_run", "hike", "walk", "ski"]);

export function isPaceSport(sportType: string): boolean {
  return PACE_SPORTS.has(sportType);
}
