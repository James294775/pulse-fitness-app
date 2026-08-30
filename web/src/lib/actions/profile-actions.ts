"use server";

import { revalidatePath } from "next/cache";
import { db } from "@/lib/db";
import { requireUser } from "@/lib/auth";
import { profileSchema } from "@/lib/validation";
import type { FormState } from "@/lib/actions/auth-actions";

export async function updateProfileAction(_prev: FormState, formData: FormData): Promise<FormState> {
  const user = await requireUser();

  const parsed = profileSchema.safeParse({
    displayName: formData.get("displayName"),
    bio: formData.get("bio"),
    location: formData.get("location"),
    avatarUrl: formData.get("avatarUrl"),
    primarySport: formData.get("primarySport"),
    units: formData.get("units"),
  });
  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? "Invalid input" };
  }
  const { displayName, bio, location, avatarUrl, primarySport, units } = parsed.data;

  await db.user.update({
    where: { id: user.id },
    data: {
      displayName,
      bio: bio || null,
      location: location || null,
      avatarUrl: avatarUrl || null,
      primarySport,
      units,
    },
  });

  revalidatePath("/settings/profile");
  revalidatePath("/");
  return { error: undefined };
}
