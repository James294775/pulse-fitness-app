"use server";

import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { requireUser } from "@/lib/auth";
import { db } from "@/lib/db";
import { createGoalSchema } from "@/lib/validation";
import type { FormState } from "@/lib/actions/auth-actions";

export async function createGoalAction(_prev: FormState, formData: FormData): Promise<FormState> {
  const user = await requireUser();

  const unit = formData.get("targetUnit");
  const rawTarget = Number(formData.get("targetValue"));
  const metric = formData.get("metric");

  let targetValue = rawTarget;
  if (metric === "distance") {
    targetValue = unit === "mi" ? rawTarget * 1609.344 : rawTarget * 1000;
  } else if (metric === "time") {
    targetValue = rawTarget * 3600; // hours -> seconds
  }

  const parsed = createGoalSchema.safeParse({
    sportType: formData.get("sportType"),
    period: formData.get("period"),
    metric,
    targetValue,
  });
  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? "Invalid goal" };
  }

  await db.goal.create({
    data: {
      userId: user.id,
      sportType: parsed.data.sportType || null,
      period: parsed.data.period,
      metric: parsed.data.metric,
      targetValue: parsed.data.targetValue,
      startDate: new Date(),
    },
  });

  revalidatePath("/dashboard");
  redirect("/dashboard");
}

export async function deleteGoalAction(formData: FormData) {
  const user = await requireUser();
  const goalId = String(formData.get("goalId"));

  const goal = await db.goal.findUnique({ where: { id: goalId } });
  if (!goal || goal.userId !== user.id) return;

  await db.goal.delete({ where: { id: goalId } });
  revalidatePath("/dashboard");
}
