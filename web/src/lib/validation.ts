import { z } from "zod";

export const sportTypes = [
  "run",
  "ride",
  "walk",
  "hike",
  "swim",
  "gym",
  "gravel_ride",
  "trail_run",
  "row",
  "ski",
] as const;

export const sportLabels: Record<(typeof sportTypes)[number], string> = {
  run: "Run",
  ride: "Ride",
  walk: "Walk",
  hike: "Hike",
  swim: "Swim",
  gym: "Gym",
  gravel_ride: "Gravel Ride",
  trail_run: "Trail Run",
  row: "Row",
  ski: "Ski",
};

export const signupSchema = z.object({
  email: z.string().trim().toLowerCase().email("Enter a valid email"),
  password: z.string().min(8, "Password must be at least 8 characters"),
  displayName: z.string().trim().min(1, "Enter your name").max(80),
});

export const loginSchema = z.object({
  email: z.string().trim().toLowerCase().email("Enter a valid email"),
  password: z.string().min(1, "Enter your password"),
});

export const activityPrivacyValues = ["everyone", "followers", "only_me"] as const;

export const manualActivitySchema = z.object({
  sportType: z.enum(sportTypes),
  title: z.string().trim().min(1, "Give it a title").max(140),
  description: z.string().trim().max(2000).optional().or(z.literal("")),
  privacy: z.enum(activityPrivacyValues),
  startedAt: z.string().min(1, "Pick a date and time"),
  // distance/duration collected in the athlete's preferred units on the form, converted before this schema sees them
  distanceM: z.coerce.number().positive("Distance must be greater than 0"),
  movingTimeSec: z.coerce.number().positive("Duration must be greater than 0"),
  elevationGainM: z.coerce.number().min(0).default(0),
});

export const uploadActivitySchema = z.object({
  sportType: z.enum(sportTypes),
  title: z.string().trim().min(1, "Give it a title").max(140),
  privacy: z.enum(activityPrivacyValues),
});

export const editActivitySchema = z.object({
  title: z.string().trim().min(1, "Give it a title").max(140),
  description: z.string().trim().max(2000).optional().or(z.literal("")),
  privacy: z.enum(activityPrivacyValues),
});

export const commentSchema = z.object({
  activityId: z.string().min(1),
  parentId: z.string().optional().or(z.literal("")),
  body: z.string().trim().min(1, "Say something first").max(1000),
});

export const profileSchema = z.object({
  displayName: z.string().trim().min(1, "Enter your name").max(80),
  bio: z.string().trim().max(500).optional().or(z.literal("")),
  location: z.string().trim().max(120).optional().or(z.literal("")),
  avatarUrl: z.string().trim().url("Enter a valid URL").optional().or(z.literal("")),
  primarySport: z.enum(sportTypes),
  units: z.enum(["metric", "imperial"]),
});
