// Demo data seed. Phase 1 seeded users only; this expands to ~8 users with
// 3 months of realistic activity history, per the brief ("the app should
// never look empty"). The most recent few activities per user get a real
// synthetic GPS track (so the detail page's map/elevation/splits demo
// properly); the rest of the 3-month history is generated the same way a
// manual-entry activity would be (no track, just summary stats) — plenty
// for feed/dashboard density without the cost of synthesizing hundreds of
// realistic-looking routes.
import bcrypt from "bcryptjs";
import { db } from "../src/lib/db";
import { createActivityFromTrack, createManualActivity } from "../src/lib/activities";
import type { RawPoint } from "../src/lib/track";
import type { SportType, Units } from "../src/generated/prisma/client";

const DEMO_PASSWORD = "password123";

interface DemoUser {
  email: string;
  displayName: string;
  primarySport: SportType;
  units: Units;
  location: string;
  bio: string;
  home: { lat: number; lng: number };
  weeklyActivities: number; // roughly how many logged activities per week
}

const demoUsers: DemoUser[] = [
  {
    email: "mara@example.com",
    displayName: "Mara Vidal",
    primarySport: "run",
    units: "metric",
    location: "Vancouver, BC",
    bio: "Marathon training, mostly seawall miles.",
    home: { lat: 49.2934, lng: -123.1443 },
    weeklyActivities: 5,
  },
  {
    email: "deni@example.com",
    displayName: "Deni Kowalski",
    primarySport: "ride",
    units: "metric",
    location: "North Vancouver, BC",
    bio: "Climbs. All of them.",
    home: { lat: 49.3163, lng: -123.0693 },
    weeklyActivities: 4,
  },
  {
    email: "theo@example.com",
    displayName: "Théo Nakamura",
    primarySport: "run",
    units: "imperial",
    location: "Seattle, WA",
    bio: "",
    home: { lat: 47.6205, lng: -122.3493 },
    weeklyActivities: 3,
  },
  {
    email: "jonas@example.com",
    displayName: "Jonas Kessler",
    primarySport: "run",
    units: "metric",
    location: "West Vancouver, BC",
    bio: "1500km in 2026 or bust.",
    home: { lat: 49.3287, lng: -123.1595 },
    weeklyActivities: 6,
  },
  {
    email: "priya@example.com",
    displayName: "Priya Baruah",
    primarySport: "trail_run",
    units: "metric",
    location: "North Vancouver, BC",
    bio: "Grouse Grind repeats before work.",
    home: { lat: 49.3806, lng: -123.0985 },
    weeklyActivities: 4,
  },
  {
    email: "sana@example.com",
    displayName: "Sana Okoro",
    primarySport: "run",
    units: "metric",
    location: "Vancouver, BC",
    bio: "Coastal Racing Team.",
    home: { lat: 49.2827, lng: -123.1207 },
    weeklyActivities: 5,
  },
  {
    email: "marcus@example.com",
    displayName: "Marcus Webb",
    primarySport: "ride",
    units: "imperial",
    location: "Bellingham, WA",
    bio: "",
    home: { lat: 48.7519, lng: -122.4787 },
    weeklyActivities: 4,
  },
  {
    email: "ingrid@example.com",
    displayName: "Ingrid Solheim",
    primarySport: "ski",
    units: "metric",
    location: "Squamish, BC",
    bio: "Winters on skis, summers on a bike.",
    home: { lat: 49.7016, lng: -123.1558 },
    weeklyActivities: 3,
  },
];

function rand(min: number, max: number) {
  return min + Math.random() * (max - min);
}
function pick<T>(arr: T[]): T {
  return arr[Math.floor(Math.random() * arr.length)];
}

const ALT_SPORTS: Partial<Record<SportType, SportType[]>> = {
  run: ["trail_run", "walk", "gym"],
  trail_run: ["run", "hike"],
  ride: ["gravel_ride", "gym"],
  ski: ["gym", "hike"],
};

const TITLES: Partial<Record<SportType, string[]>> = {
  run: ["Morning tempo", "Easy shakeout", "Progression run", "Recovery jog", "Sunday long run"],
  trail_run: ["Grind repeats", "Trail loop", "Hill repeats", "Forest miles"],
  ride: ["Climb repeats", "Coffee ride", "Endurance spin", "Interval session"],
  gravel_ride: ["Gravel loop", "Backroads ride"],
  hike: ["Ridge hike", "Sunset hike"],
  walk: ["Evening walk", "Recovery walk"],
  gym: ["Strength session", "Core & mobility"],
  swim: ["Pool intervals", "Open water swim"],
  row: ["Erg intervals", "Steady row"],
  ski: ["Backcountry lap", "Groomer laps"],
};

function synthesizeLoopTrack(opts: {
  home: { lat: number; lng: number };
  distanceM: number;
  durationSec: number;
  elevationGainM: number;
  startedAt: Date;
}): RawPoint[] {
  const { home, distanceM, durationSec, elevationGainM, startedAt } = opts;
  const n = Math.max(24, Math.min(400, Math.round(durationSec / 15)));
  const circumferenceDeg = distanceM / 111320;
  const radiusDeg = circumferenceDeg / (2 * Math.PI);
  const latCos = Math.cos((home.lat * Math.PI) / 180);
  const seed = rand(0, Math.PI * 2);
  const baseEle = rand(5, 60);

  const points: RawPoint[] = [];
  for (let i = 0; i <= n; i++) {
    const frac = i / n;
    const angle = frac * Math.PI * 2;
    const wobble = 1 + 0.18 * Math.sin(angle * 3 + seed) + 0.08 * Math.sin(angle * 7 - seed);
    const lat = home.lat + radiusDeg * wobble * Math.sin(angle);
    const lng = home.lng + (radiusDeg * wobble * Math.cos(angle)) / Math.max(0.2, latCos);
    const ele = baseEle + elevationGainM * Math.max(0, Math.sin(angle * 2)) * 0.5;
    points.push({ lat, lng, ele, t: startedAt.getTime() + frac * durationSec * 1000 });
  }
  return points;
}

function activityShape(sportType: SportType) {
  switch (sportType) {
    case "run":
      return { distanceKm: [4, 16], paceMinPerKm: [3.9, 6.2], elevPer10km: [10, 60] };
    case "trail_run":
      return { distanceKm: [5, 18], paceMinPerKm: [5.5, 9], elevPer10km: [80, 250] };
    case "hike":
      return { distanceKm: [4, 14], paceMinPerKm: [12, 20], elevPer10km: [100, 400] };
    case "walk":
      return { distanceKm: [2, 7], paceMinPerKm: [10, 14], elevPer10km: [5, 30] };
    case "ride":
      return { distanceKm: [15, 65], speedKmh: [20, 33], elevPer10km: [30, 150] };
    case "gravel_ride":
      return { distanceKm: [20, 70], speedKmh: [18, 27], elevPer10km: [50, 180] };
    case "ski":
      return { distanceKm: [8, 25], speedKmh: [15, 30], elevPer10km: [100, 300] };
    case "swim":
      return { distanceKm: [1, 3.5], paceMinPerKm: [18, 26], elevPer10km: [0, 0] };
    case "row":
      return { distanceKm: [4, 12], paceMinPerKm: [4.5, 6], elevPer10km: [0, 0] };
    case "gym":
      return { distanceKm: [0, 0], durationMin: [30, 75], elevPer10km: [0, 0] };
  }
}

async function seedActivitiesForUser(user: { id: string; primarySport: SportType }, home: { lat: number; lng: number }, weeklyActivities: number) {
  const weeks = 13;
  const today = new Date();
  const activityDates: Date[] = [];

  for (let w = 0; w < weeks; w++) {
    const count = Math.max(1, Math.round(weeklyActivities + rand(-1.5, 1.5)));
    for (let i = 0; i < count; i++) {
      const daysAgo = w * 7 + Math.floor(rand(0, 7));
      const d = new Date(today);
      d.setDate(d.getDate() - daysAgo);
      d.setHours(Math.floor(rand(6, 19)), Math.floor(rand(0, 60)), 0, 0);
      activityDates.push(d);
    }
  }
  activityDates.sort((a, b) => b.getTime() - a.getTime());

  for (let i = 0; i < activityDates.length; i++) {
    const startedAt = activityDates[i];
    const sportType = Math.random() < 0.72 ? user.primarySport : pick(ALT_SPORTS[user.primarySport] ?? [user.primarySport]);
    const shape = activityShape(sportType)!;
    const title = pick(TITLES[sportType] ?? ["Activity"]);

    let distanceM: number;
    let movingTimeSec: number;

    if (sportType === "gym") {
      distanceM = 0;
      movingTimeSec = Math.round(rand(...(shape.durationMin as [number, number])) * 60);
    } else {
      const distanceKm = rand(...(shape.distanceKm as [number, number]));
      distanceM = distanceKm * 1000;
      if (shape.paceMinPerKm) {
        movingTimeSec = Math.round(distanceKm * rand(...(shape.paceMinPerKm as [number, number])) * 60);
      } else {
        movingTimeSec = Math.round((distanceKm / rand(...(shape.speedKmh as [number, number]))) * 3600);
      }
    }
    const elevationGainM = shape.elevPer10km
      ? (distanceM / 10000) * rand(...(shape.elevPer10km as [number, number]))
      : 0;

    const isRecentDetailShowcase = i < 3 && distanceM > 0;

    if (isRecentDetailShowcase) {
      const points = synthesizeLoopTrack({ home, distanceM, durationSec: movingTimeSec, elevationGainM, startedAt });
      await createActivityFromTrack({
        userId: user.id,
        sportType,
        title,
        privacy: "everyone",
        source: "upload",
        points,
      });
    } else {
      await createManualActivity({
        userId: user.id,
        sportType,
        title,
        privacy: "everyone",
        startedAt,
        distanceM,
        movingTimeSec,
        elevationGainM,
      });
    }
  }

  return activityDates.length;
}

async function main() {
  const passwordHash = await bcrypt.hash(DEMO_PASSWORD, 10);
  let totalActivities = 0;

  for (const u of demoUsers) {
    const user = await db.user.upsert({
      where: { email: u.email },
      update: {},
      create: {
        email: u.email,
        displayName: u.displayName,
        primarySport: u.primarySport,
        units: u.units,
        location: u.location,
        bio: u.bio,
        passwordHash,
      },
    });

    const existing = await db.activity.count({ where: { userId: user.id } });
    if (existing === 0) {
      totalActivities += await seedActivitiesForUser(user, u.home, u.weeklyActivities);
    }
  }

  console.log(`Seeded ${demoUsers.length} demo users with ${totalActivities} activities. Password for all: ${DEMO_PASSWORD}`);
}

main()
  .catch((e) => {
    console.error(e);
    process.exitCode = 1;
  })
  .finally(async () => {
    await db.$disconnect();
  });
