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
import { createSegmentFromActivity } from "../src/lib/segments";
import { elevationGainFromTrack } from "../src/lib/geo";
import { parseTrack } from "../src/lib/track";
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

const COMMENT_BODIES = [
  "Nice work out there.",
  "That pace is quick — nice negative split.",
  "See you out there next time.",
  "Solid effort on that climb.",
  "Love this route.",
];

/** Everyone follows the next few people in the roster (wrapping around) — enough of a social graph that the feed, follower counts, and follow buttons all have real data on first load. */
async function seedSocialGraph(users: { id: string }[]) {
  for (let i = 0; i < users.length; i++) {
    for (let offset = 1; offset <= 3; offset++) {
      const target = users[(i + offset) % users.length];
      if (target.id === users[i].id) continue;
      await db.follow.create({ data: { followerId: users[i].id, followingId: target.id } }).catch(() => {});
    }
  }

  for (const user of users) {
    const recentActivities = await db.activity.findMany({
      where: { userId: user.id },
      orderBy: { startedAt: "desc" },
      take: 3,
    });
    const followers = await db.follow.findMany({ where: { followingId: user.id }, select: { followerId: true } });

    for (const activity of recentActivities) {
      for (const f of followers) {
        if (Math.random() < 0.6) {
          await db.kudos.create({ data: { activityId: activity.id, userId: f.followerId } }).catch(() => {});
        }
      }
      if (followers.length > 0 && Math.random() < 0.7) {
        const commenter = pick(followers).followerId;
        await db.comment.create({
          data: { activityId: activity.id, userId: commenter, body: pick(COMMENT_BODIES) },
        });
      }
    }
  }
}

const SEGMENT_NAMES: Partial<Record<SportType, string>> = {
  run: "Seawall Sprint",
  trail_run: "Grouse Grind",
  ride: "Cypress Bowl Lower Wall",
  gravel_ride: "Backroads Straight",
  hike: "Ridge Approach",
  walk: "Waterfront Stretch",
  ski: "Groomer Run",
};

// Real segment matching needs two activities to have actually covered the
// same ground, which independently-randomized synthetic loops never do (see
// synthesizeLoopTrack). So for seed data, segments are carved from one
// user's real track via the normal creation path, and *effort* rows for
// other users are fabricated directly against one of their own existing
// activities — enough to populate a real-looking leaderboard without
// pretending the matcher found something it couldn't have.
async function seedSegments() {
  if ((await db.segment.count()) > 0) return;

  const tracked = await db.activity.findMany({ where: { NOT: { points: "[]" } } });
  const bySport = new Map<SportType, typeof tracked>();
  for (const a of tracked) {
    if (!bySport.get(a.sportType)) bySport.set(a.sportType, []);
    bySport.get(a.sportType)!.push(a);
  }

  let segmentCount = 0;
  for (const [sportType, activities] of bySport) {
    if (activities.length < 3) continue;
    const source = activities[0];
    const track = parseTrack(source.points);
    if (track.length < 8) continue;

    const segment = await createSegmentFromActivity({
      activityId: source.id,
      userId: source.userId,
      name: SEGMENT_NAMES[sportType] ?? "Segment",
      startIndex: Math.floor(track.length * 0.2),
      endIndex: Math.floor(track.length * 0.65),
    });
    segmentCount++;

    const paceSecPerKm = sportType === "ride" || sportType === "gravel_ride" || sportType === "ski" ? 140 : 300;
    const baseSec = (segment.distanceM / 1000) * paceSecPerKm;

    // source already got its founding effort from createSegmentFromActivity above
    const others = activities.filter((a) => a.userId !== source.userId);
    const participants = others.sort(() => Math.random() - 0.5).slice(0, 7);
    for (const activity of participants) {
      await db.segmentEffort.create({
        data: {
          segmentId: segment.id,
          activityId: activity.id,
          userId: activity.userId,
          elapsedSec: Math.round(baseSec * rand(0.82, 1.35)),
          startedAt: activity.startedAt,
          isPr: true,
        },
      });
    }
  }

  return segmentCount;
}

const ROUTE_NAMES = ["Seawall Loop", "Sunset Out-and-Back", "Long Way Home"];

/** Saves one user's own tracked-activity route as a planned Route, so /routes isn't empty on first login. Real elevation gain (the actual track has it); a hand-drawn route would be 0 per the no-elevation-API decision in DECISIONS.md. */
async function seedRoutes(users: { id: string }[]) {
  if ((await db.route.count()) > 0) return 0;

  let count = 0;
  for (const user of users) {
    const tracked = await db.activity.findFirst({
      where: { userId: user.id, NOT: { points: "[]" } },
      orderBy: { startedAt: "desc" },
    });
    if (!tracked) continue;

    const track = parseTrack(tracked.points);
    const distanceM = track[track.length - 1]?.distM ?? 0;
    if (distanceM < 100) continue;

    await db.route.create({
      data: {
        userId: user.id,
        name: pick(ROUTE_NAMES),
        points: tracked.points,
        distanceM,
        elevationGainM: elevationGainFromTrack(track),
        starred: Math.random() < 0.4,
      },
    });
    count++;
  }
  return count;
}

/** A weekly all-sports distance goal for each user, roughly 20% above their actual recent weekly average — ambitious but not absurd, so the dashboard's progress bar looks real. */
async function seedGoals(users: { id: string }[]) {
  if ((await db.goal.count()) > 0) return 0;

  let count = 0;
  for (const user of users) {
    const fourWeeksAgo = new Date();
    fourWeeksAgo.setDate(fourWeeksAgo.getDate() - 28);
    const recent = await db.activity.aggregate({
      where: { userId: user.id, startedAt: { gte: fourWeeksAgo } },
      _sum: { distanceM: true },
    });
    const weeklyAvgM = (recent._sum.distanceM ?? 0) / 4;
    if (weeklyAvgM < 500) continue;

    await db.goal.create({
      data: {
        userId: user.id,
        period: "weekly",
        metric: "distance",
        targetValue: Math.round(weeklyAvgM * 1.2),
        startDate: new Date(new Date().getFullYear(), 0, 1),
      },
    });
    count++;
  }
  return count;
}

async function seedClubs(users: { id: string; displayName: string }[]) {
  if ((await db.club.count()) > 0) return 0;

  const byName = new Map(users.map((u) => [u.displayName, u]));
  const founder = byName.get("Sana Okoro") ?? users[0];
  const members = users.filter((u) => u.id !== founder.id).slice(0, 4);

  const club = await db.club.create({
    data: {
      name: "Coastal Racing Team",
      description: "Vancouver-based, mostly road and trail. All paces welcome.",
      sportType: "run",
      createdByUserId: founder.id,
      members: {
        create: [{ userId: founder.id, role: "owner" }, ...members.map((m) => ({ userId: m.id }))],
      },
    },
  });

  const now = new Date();
  const monthStart = new Date(now.getFullYear(), now.getMonth(), 1);
  const monthEnd = new Date(now.getFullYear(), now.getMonth() + 1, 0);
  const challengeParticipants = [founder, ...members.slice(0, 3)];

  await db.challenge.create({
    data: {
      clubId: club.id,
      name: `${monthStart.toLocaleString("en-US", { month: "long" })} 100km`,
      description: "100km of running this month, any pace.",
      sportType: club.sportType,
      metric: "distance",
      targetValue: 100_000,
      startDate: monthStart,
      endDate: monthEnd,
      createdByUserId: founder.id,
      participants: { create: challengeParticipants.map((p) => ({ userId: p.id })) },
    },
  });

  return 1;
}

async function main() {
  const passwordHash = await bcrypt.hash(DEMO_PASSWORD, 10);
  let totalActivities = 0;
  const createdUsers: { id: string; displayName: string }[] = [];

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
    createdUsers.push(user);

    const existing = await db.activity.count({ where: { userId: user.id } });
    if (existing === 0) {
      totalActivities += await seedActivitiesForUser(user, u.home, u.weeklyActivities);
    }
  }

  const followCount = await db.follow.count();
  if (followCount === 0) {
    await seedSocialGraph(createdUsers);
  }

  const segmentCount = await seedSegments();
  const routeCount = await seedRoutes(createdUsers);
  const goalCount = await seedGoals(createdUsers);
  const clubCount = await seedClubs(createdUsers);

  console.log(
    `Seeded ${demoUsers.length} demo users with ${totalActivities} activities${
      segmentCount ? `, ${segmentCount} segments` : ""
    }${routeCount ? `, ${routeCount} routes` : ""}${goalCount ? `, ${goalCount} goals` : ""}${
      clubCount ? `, ${clubCount} club` : ""
    }. Password for all: ${DEMO_PASSWORD}`
  );
}

main()
  .catch((e) => {
    console.error(e);
    process.exitCode = 1;
  })
  .finally(async () => {
    await db.$disconnect();
  });
