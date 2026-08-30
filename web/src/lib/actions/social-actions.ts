"use server";

import { revalidatePath } from "next/cache";
import { requireUser } from "@/lib/auth";
import { db } from "@/lib/db";
import { canViewActivity } from "@/lib/social";
import { commentSchema } from "@/lib/validation";
import type { FormState } from "@/lib/actions/auth-actions";

/** Called directly (not via a <form>) from feed cards and the activity detail page. */
export async function toggleKudosAction(activityId: string): Promise<{ given: boolean } | { error: string }> {
  const user = await requireUser();

  const activity = await db.activity.findUnique({ where: { id: activityId } });
  if (!activity || !(await canViewActivity(activity, user.id))) {
    return { error: "Activity not found" };
  }

  const existing = await db.kudos.findUnique({
    where: { activityId_userId: { activityId, userId: user.id } },
  });

  if (existing) {
    await db.kudos.delete({ where: { id: existing.id } });
  } else {
    await db.kudos.create({ data: { activityId, userId: user.id } });
  }

  revalidatePath("/");
  revalidatePath(`/activities/${activityId}`);
  return { given: !existing };
}

export async function addCommentAction(_prev: FormState, formData: FormData): Promise<FormState> {
  const user = await requireUser();

  const parsed = commentSchema.safeParse({
    activityId: formData.get("activityId"),
    parentId: formData.get("parentId") || undefined,
    body: formData.get("body"),
  });
  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? "Invalid comment" };
  }

  const activity = await db.activity.findUnique({ where: { id: parsed.data.activityId } });
  if (!activity || !(await canViewActivity(activity, user.id))) {
    return { error: "Activity not found" };
  }

  await db.comment.create({
    data: {
      activityId: parsed.data.activityId,
      userId: user.id,
      parentId: parsed.data.parentId || null,
      body: parsed.data.body,
    },
  });

  revalidatePath(`/activities/${parsed.data.activityId}`);
  return { error: undefined };
}

/** Called directly (not via a <form>) from the athlete profile page's follow button. */
export async function toggleFollowAction(targetUserId: string): Promise<{ following: boolean } | { error: string }> {
  const user = await requireUser();
  if (user.id === targetUserId) return { error: "You can't follow yourself" };

  const existing = await db.follow.findUnique({
    where: { followerId_followingId: { followerId: user.id, followingId: targetUserId } },
  });

  if (existing) {
    await db.follow.delete({
      where: { followerId_followingId: { followerId: user.id, followingId: targetUserId } },
    });
  } else {
    const target = await db.user.findUnique({ where: { id: targetUserId } });
    if (!target) return { error: "Athlete not found" };
    await db.follow.create({ data: { followerId: user.id, followingId: targetUserId } });
  }

  revalidatePath("/");
  revalidatePath(`/athletes/${targetUserId}`);
  return { following: !existing };
}
