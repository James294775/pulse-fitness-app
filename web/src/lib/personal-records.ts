import { db } from "@/lib/db";
import { isPaceSport } from "@/lib/units";

/**
 * PRs approximated from whole-activity totals, not a true "best N meters
 * anywhere in any activity" sliding-window search (that's a much harder
 * problem — akin to segment matching but over arbitrary distances rather
 * than a fixed course). An activity counts toward a distance PR if its
 * total distance falls within +/-5% of that distance; the fastest overall
 * time among those activities is the "PR". Good enough for races/planned
 * distance runs, less so for e.g. a 5K PR set mid-way through a 10K.
 */
const RACE_DISTANCES_M: { label: string; meters: number }[] = [
  { label: "1K", meters: 1000 },
  { label: "5K", meters: 5000 },
  { label: "10K", meters: 10000 },
  { label: "Half Marathon", meters: 21097.5 },
  { label: "Marathon", meters: 42195 },
];
const TOLERANCE = 0.05;

export interface PersonalRecord {
  label: string;
  activityId: string;
  value: string; // pre-formatted (time for distance PRs, distance for longest ride, etc.)
  date: Date;
}

export async function getPersonalRecords(userId: string): Promise<PersonalRecord[]> {
  const activities = await db.activity.findMany({
    where: { userId },
    select: {
      id: true,
      sportType: true,
      distanceM: true,
      movingTimeSec: true,
      elevationGainM: true,
      startedAt: true,
    },
  });

  const records: PersonalRecord[] = [];

  const paceActivities = activities.filter((a) => isPaceSport(a.sportType));
  for (const { label, meters } of RACE_DISTANCES_M) {
    const candidates = paceActivities.filter((a) => Math.abs(a.distanceM - meters) / meters <= TOLERANCE);
    if (candidates.length === 0) continue;
    const best = candidates.reduce((a, b) => (a.movingTimeSec < b.movingTimeSec ? a : b));
    records.push({ label, activityId: best.id, value: formatClock(best.movingTimeSec), date: best.startedAt });
  }

  const rides = activities.filter((a) => a.sportType === "ride" || a.sportType === "gravel_ride");
  if (rides.length > 0) {
    const longest = rides.reduce((a, b) => (a.distanceM > b.distanceM ? a : b));
    records.push({
      label: "Longest Ride",
      activityId: longest.id,
      value: `${(longest.distanceM / 1000).toFixed(1)} km`,
      date: longest.startedAt,
    });
    const biggestClimb = rides.reduce((a, b) => (a.elevationGainM > b.elevationGainM ? a : b));
    if (biggestClimb.elevationGainM > 0) {
      records.push({
        label: "Biggest Climb",
        activityId: biggestClimb.id,
        value: `${Math.round(biggestClimb.elevationGainM)} m`,
        date: biggestClimb.startedAt,
      });
    }
  }

  return records;
}

function formatClock(totalSeconds: number): string {
  const s = Math.round(totalSeconds);
  const h = Math.floor(s / 3600);
  const m = Math.floor((s % 3600) / 60);
  const sec = s % 60;
  return h > 0
    ? `${h}:${String(m).padStart(2, "0")}:${String(sec).padStart(2, "0")}`
    : `${m}:${String(sec).padStart(2, "0")}`;
}
