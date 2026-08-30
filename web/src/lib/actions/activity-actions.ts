"use server";

import { redirect } from "next/navigation";
import { z } from "zod";
import { requireUser } from "@/lib/auth";
import { db } from "@/lib/db";
import { createActivityFromTrack, createManualActivity } from "@/lib/activities";
import { parseGpx } from "@/lib/gpx";
import { parseTcx } from "@/lib/tcx";
import {
  editActivitySchema,
  manualActivitySchema,
  sportTypes,
  uploadActivitySchema,
} from "@/lib/validation";
import { savePhotos } from "@/lib/photos";
import type { RawPoint } from "@/lib/track";
import type { FormState } from "@/lib/actions/auth-actions";

const rawPointSchema = z.object({
  lat: z.number(),
  lng: z.number(),
  ele: z.number(),
  t: z.number(),
});

const liveActivitySchema = z.object({
  sportType: z.enum(sportTypes),
  title: z.string().trim().min(1).max(140),
  privacy: z.enum(["everyone", "followers", "only_me"]),
  points: z.array(rawPointSchema).min(2, "Need at least a couple of GPS points"),
});

/** Called directly (not via a <form>) from the live Record page once the athlete taps Finish. */
export async function createLiveActivityAction(input: {
  sportType: string;
  title: string;
  privacy: string;
  points: RawPoint[];
}): Promise<{ id: string } | { error: string }> {
  const user = await requireUser();
  const parsed = liveActivitySchema.safeParse(input);
  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? "Invalid recording" };
  }

  const activity = await createActivityFromTrack({
    userId: user.id,
    sportType: parsed.data.sportType as never,
    title: parsed.data.title,
    privacy: parsed.data.privacy as never,
    source: "live",
    points: parsed.data.points,
  });

  return { id: activity.id };
}

export async function createManualActivityAction(_prev: FormState, formData: FormData): Promise<FormState> {
  const user = await requireUser();

  const unit = formData.get("distanceUnit") === "mi" ? "mi" : "km";
  const distanceInput = Number(formData.get("distanceValue"));
  const distanceM = unit === "mi" ? distanceInput * 1609.344 : distanceInput * 1000;

  const hours = Number(formData.get("durationHours") || 0);
  const minutes = Number(formData.get("durationMinutes") || 0);
  const seconds = Number(formData.get("durationSeconds") || 0);
  const movingTimeSec = hours * 3600 + minutes * 60 + seconds;

  const elevationUnit = formData.get("elevationUnit") === "ft" ? "ft" : "m";
  const elevationInput = Number(formData.get("elevationGainValue") || 0);
  const elevationGainM = elevationUnit === "ft" ? elevationInput / 3.28084 : elevationInput;

  const parsed = manualActivitySchema.safeParse({
    sportType: formData.get("sportType"),
    title: formData.get("title"),
    description: formData.get("description"),
    privacy: formData.get("privacy"),
    startedAt: formData.get("startedAt"),
    distanceM,
    movingTimeSec,
    elevationGainM,
  });
  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? "Invalid input" };
  }

  const activity = await createManualActivity({
    userId: user.id,
    sportType: parsed.data.sportType,
    title: parsed.data.title,
    description: parsed.data.description,
    privacy: parsed.data.privacy,
    startedAt: new Date(parsed.data.startedAt),
    distanceM: parsed.data.distanceM,
    movingTimeSec: parsed.data.movingTimeSec,
    elevationGainM: parsed.data.elevationGainM,
  });

  redirect(`/activities/${activity.id}`);
}

export async function uploadActivityAction(_prev: FormState, formData: FormData): Promise<FormState> {
  const user = await requireUser();

  const parsed = uploadActivitySchema.safeParse({
    sportType: formData.get("sportType"),
    title: formData.get("title"),
    privacy: formData.get("privacy"),
  });
  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? "Invalid input" };
  }

  const file = formData.get("file");
  if (!(file instanceof File) || file.size === 0) {
    return { error: "Choose a GPX or TCX file" };
  }

  const text = await file.text();
  const isTcx = file.name.toLowerCase().endsWith(".tcx");

  let points;
  try {
    points = isTcx ? parseTcx(text) : parseGpx(text);
  } catch (e) {
    return { error: e instanceof Error ? e.message : "Couldn't parse that file" };
  }

  let activity;
  try {
    activity = await createActivityFromTrack({
      userId: user.id,
      sportType: parsed.data.sportType,
      title: parsed.data.title,
      privacy: parsed.data.privacy,
      source: "upload",
      points,
    });
  } catch (e) {
    return { error: e instanceof Error ? e.message : "Couldn't create the activity" };
  }

  redirect(`/activities/${activity.id}`);
}

export async function updateActivityAction(_prev: FormState, formData: FormData): Promise<FormState> {
  const user = await requireUser();
  const activityId = String(formData.get("activityId"));

  const activity = await db.activity.findUnique({ where: { id: activityId } });
  if (!activity || activity.userId !== user.id) {
    return { error: "Activity not found" };
  }

  const parsed = editActivitySchema.safeParse({
    title: formData.get("title"),
    description: formData.get("description"),
    privacy: formData.get("privacy"),
  });
  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? "Invalid input" };
  }

  await db.activity.update({
    where: { id: activityId },
    data: {
      title: parsed.data.title,
      description: parsed.data.description || null,
      privacy: parsed.data.privacy,
    },
  });

  redirect(`/activities/${activityId}`);
}

export async function addPhotosAction(_prev: FormState, formData: FormData): Promise<FormState> {
  const user = await requireUser();
  const activityId = String(formData.get("activityId"));

  const activity = await db.activity.findUnique({ where: { id: activityId } });
  if (!activity || activity.userId !== user.id) {
    return { error: "Activity not found" };
  }

  const files = formData.getAll("photos").filter((f): f is File => f instanceof File && f.size > 0);
  if (files.length === 0) {
    return { error: "Choose at least one photo" };
  }

  const saved = await savePhotos(files);
  const existingCount = await db.photo.count({ where: { activityId } });

  await db.photo.createMany({
    data: saved.map((url, i) => ({
      activityId,
      userId: user.id,
      url,
      sortOrder: existingCount + i,
    })),
  });

  redirect(`/activities/${activityId}`);
}
