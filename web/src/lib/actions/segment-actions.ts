"use server";

import { redirect } from "next/navigation";
import { requireUser } from "@/lib/auth";
import { createSegmentFromActivity } from "@/lib/segments";
import { createSegmentSchema } from "@/lib/validation";
import type { FormState } from "@/lib/actions/auth-actions";

export async function createSegmentAction(_prev: FormState, formData: FormData): Promise<FormState> {
  const user = await requireUser();

  const parsed = createSegmentSchema.safeParse({
    activityId: formData.get("activityId"),
    name: formData.get("name"),
    startIndex: formData.get("startIndex"),
    endIndex: formData.get("endIndex"),
  });
  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? "Invalid input" };
  }

  let segment;
  try {
    segment = await createSegmentFromActivity({ userId: user.id, ...parsed.data });
  } catch (e) {
    return { error: e instanceof Error ? e.message : "Couldn't create the segment" };
  }

  redirect(`/segments/${segment.id}`);
}
