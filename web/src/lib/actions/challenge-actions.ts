"use server";

import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { requireUser } from "@/lib/auth";
import { db } from "@/lib/db";
import { createChallengeSchema } from "@/lib/validation";
import type { FormState } from "@/lib/actions/auth-actions";

export async function createChallengeAction(_prev: FormState, formData: FormData): Promise<FormState> {
  const user = await requireUser();

  const parsed = createChallengeSchema.safeParse({
    clubId: formData.get("clubId"),
    name: formData.get("name"),
    description: formData.get("description"),
    metric: formData.get("metric"),
    targetValue: formData.get("targetValue"),
    startDate: formData.get("startDate"),
    endDate: formData.get("endDate"),
  });
  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? "Invalid input" };
  }

  const membership = await db.clubMember.findUnique({
    where: { clubId_userId: { clubId: parsed.data.clubId, userId: user.id } },
    include: { club: { select: { sportType: true } } },
  });
  if (!membership) return { error: "Join the club before creating a challenge for it" };

  const unit = formData.get("targetUnit");
  let targetValue = parsed.data.targetValue;
  if (parsed.data.metric !== "time") {
    targetValue = unit === "mi" || unit === "ft" ? convertToBase(parsed.data.targetValue, unit) : parsed.data.targetValue;
  } else {
    targetValue = parsed.data.targetValue * 3600; // hours -> seconds
  }

  const challenge = await db.challenge.create({
    data: {
      clubId: parsed.data.clubId,
      name: parsed.data.name,
      description: parsed.data.description || null,
      // Inherits the club's sport, if it has one — a challenge belongs to
      // its club, so "100km of running" in a running club should only
      // count running, not everything the athlete happened to log.
      sportType: membership.club.sportType,
      metric: parsed.data.metric,
      targetValue,
      startDate: new Date(parsed.data.startDate),
      endDate: new Date(parsed.data.endDate),
      createdByUserId: user.id,
      participants: { create: { userId: user.id } },
    },
  });

  revalidatePath(`/clubs/${parsed.data.clubId}`);
  redirect(`/challenges/${challenge.id}`);
}

function convertToBase(value: number, unit: string) {
  if (unit === "mi") return value * 1609.344;
  if (unit === "ft") return value / 3.28084;
  return value;
}

/** Called directly (not via a <form>) from the challenge page's join button. */
export async function joinChallengeAction(challengeId: string): Promise<{ joined: true } | { error: string }> {
  const user = await requireUser();

  const challenge = await db.challenge.findUnique({ where: { id: challengeId } });
  if (!challenge) return { error: "Challenge not found" };

  await db.challengeParticipant.upsert({
    where: { challengeId_userId: { challengeId, userId: user.id } },
    update: {},
    create: { challengeId, userId: user.id },
  });

  revalidatePath(`/challenges/${challengeId}`);
  return { joined: true };
}
