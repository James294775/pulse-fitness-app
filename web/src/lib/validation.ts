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

export const profileSchema = z.object({
  displayName: z.string().trim().min(1, "Enter your name").max(80),
  bio: z.string().trim().max(500).optional().or(z.literal("")),
  location: z.string().trim().max(120).optional().or(z.literal("")),
  avatarUrl: z.string().trim().url("Enter a valid URL").optional().or(z.literal("")),
  primarySport: z.enum(sportTypes),
  units: z.enum(["metric", "imperial"]),
});
