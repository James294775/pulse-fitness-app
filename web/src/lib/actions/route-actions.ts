"use server";

import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { z } from "zod";
import { requireUser } from "@/lib/auth";
import { db } from "@/lib/db";
import { buildTrack, elevationGainFromTrack } from "@/lib/geo";
import { serializeTrack } from "@/lib/track";

const pointSchema = z.object({ lat: z.number(), lng: z.number() });
const createRouteSchema = z.object({
  name: z.string().trim().min(1, "Name this route").max(120),
  points: z.array(pointSchema).min(2, "Add at least two waypoints"),
});

/** Called directly (not via a <form>) from the route builder once the athlete taps Save. */
export async function createRouteAction(input: {
  name: string;
  points: { lat: number; lng: number }[];
}): Promise<{ id: string } | { error: string }> {
  const user = await requireUser();

  const parsed = createRouteSchema.safeParse(input);
  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? "Invalid route" };
  }

  // No elevation API is wired up (avoiding a paid key and a flaky free
  // dependency) — see DECISIONS.md. Route elevation gain is 0 until a
  // provider is chosen.
  const track = buildTrack(parsed.data.points.map((p) => ({ ...p, ele: 0, t: 0 })));
  const distanceM = track[track.length - 1].distM;
  const elevationGainM = elevationGainFromTrack(track);

  const route = await db.route.create({
    data: {
      userId: user.id,
      name: parsed.data.name,
      points: serializeTrack(track),
      distanceM,
      elevationGainM,
    },
  });

  revalidatePath("/routes");
  return { id: route.id };
}

/** Called directly (not via a <form>) from the route detail page's star toggle. */
export async function toggleRouteStarAction(routeId: string): Promise<{ starred: boolean } | { error: string }> {
  const user = await requireUser();

  const route = await db.route.findUnique({ where: { id: routeId } });
  if (!route || route.userId !== user.id) return { error: "Route not found" };

  const updated = await db.route.update({ where: { id: routeId }, data: { starred: !route.starred } });
  revalidatePath("/routes");
  revalidatePath(`/routes/${routeId}`);
  return { starred: updated.starred };
}

export async function deleteRouteAction(formData: FormData) {
  const user = await requireUser();
  const routeId = String(formData.get("routeId"));
  const route = await db.route.findUnique({ where: { id: routeId } });
  if (!route || route.userId !== user.id) return;

  await db.route.delete({ where: { id: routeId } });
  revalidatePath("/routes");
  redirect("/routes");
}
