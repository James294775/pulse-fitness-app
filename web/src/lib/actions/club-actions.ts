"use server";

import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { requireUser } from "@/lib/auth";
import { db } from "@/lib/db";
import { createClubSchema } from "@/lib/validation";
import type { FormState } from "@/lib/actions/auth-actions";

export async function createClubAction(_prev: FormState, formData: FormData): Promise<FormState> {
  const user = await requireUser();

  const parsed = createClubSchema.safeParse({
    name: formData.get("name"),
    description: formData.get("description"),
    sportType: formData.get("sportType"),
  });
  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? "Invalid input" };
  }

  const club = await db.club.create({
    data: {
      name: parsed.data.name,
      description: parsed.data.description || null,
      sportType: parsed.data.sportType || null,
      createdByUserId: user.id,
      members: { create: { userId: user.id, role: "owner" } },
    },
  });

  revalidatePath("/clubs");
  redirect(`/clubs/${club.id}`);
}

/** Called directly (not via a <form>) from the club page's join/leave button. */
export async function toggleClubMembershipAction(clubId: string): Promise<{ joined: boolean } | { error: string }> {
  const user = await requireUser();

  const club = await db.club.findUnique({ where: { id: clubId } });
  if (!club) return { error: "Club not found" };
  if (club.createdByUserId === user.id) return { error: "You can't leave a club you own" };

  const existing = await db.clubMember.findUnique({
    where: { clubId_userId: { clubId, userId: user.id } },
  });

  if (existing) {
    await db.clubMember.delete({ where: { clubId_userId: { clubId, userId: user.id } } });
  } else {
    await db.clubMember.create({ data: { clubId, userId: user.id } });
  }

  revalidatePath(`/clubs/${clubId}`);
  revalidatePath("/clubs");
  return { joined: !existing };
}
