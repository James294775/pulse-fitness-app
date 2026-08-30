"use server";

import { revalidatePath } from "next/cache";
import { requireUser } from "@/lib/auth";
import { db } from "@/lib/db";
import { createPrivacyZoneSchema } from "@/lib/validation";
import type { FormState } from "@/lib/actions/auth-actions";

export async function createPrivacyZoneAction(_prev: FormState, formData: FormData): Promise<FormState> {
  const user = await requireUser();

  const parsed = createPrivacyZoneSchema.safeParse({
    label: formData.get("label"),
    lat: formData.get("lat"),
    lng: formData.get("lng"),
    radiusM: formData.get("radiusM"),
  });
  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? "Invalid input" };
  }

  await db.privacyZone.create({ data: { userId: user.id, ...parsed.data } });
  revalidatePath("/settings/privacy");
  return { error: undefined };
}

export async function deletePrivacyZoneAction(formData: FormData) {
  const user = await requireUser();
  const zoneId = String(formData.get("zoneId"));

  const zone = await db.privacyZone.findUnique({ where: { id: zoneId } });
  if (!zone || zone.userId !== user.id) return;

  await db.privacyZone.delete({ where: { id: zoneId } });
  revalidatePath("/settings/privacy");
}
