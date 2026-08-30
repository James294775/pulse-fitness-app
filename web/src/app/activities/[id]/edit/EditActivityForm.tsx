"use client";

import { useActionState } from "react";
import { updateActivityAction } from "@/lib/actions/activity-actions";
import type { ActivityPrivacy } from "@/generated/prisma/client";

const inputClass =
  "rounded border border-border-strong bg-surface px-3 py-2.5 text-sm outline-none focus:border-accent";
const labelClass = "text-[11px] font-semibold tracking-[0.1em] text-secondary";

export function EditActivityForm({
  activityId,
  title,
  description,
  privacy,
}: {
  activityId: string;
  title: string;
  description: string;
  privacy: ActivityPrivacy;
}) {
  const [state, formAction, pending] = useActionState(updateActivityAction, undefined);

  return (
    <form action={formAction} className="flex flex-col gap-4">
      <input type="hidden" name="activityId" value={activityId} />
      <label className="flex flex-col gap-1.5">
        <span className={labelClass}>TITLE</span>
        <input name="title" defaultValue={title} required maxLength={140} className={inputClass} />
      </label>
      <label className="flex flex-col gap-1.5">
        <span className={labelClass}>DESCRIPTION</span>
        <textarea name="description" defaultValue={description} rows={4} className={inputClass} />
      </label>
      <label className="flex flex-col gap-1.5">
        <span className={labelClass}>WHO CAN SEE THIS</span>
        <select name="privacy" defaultValue={privacy} className={inputClass}>
          <option value="everyone">Everyone</option>
          <option value="followers">Followers only</option>
          <option value="only_me">Only me</option>
        </select>
      </label>
      {state?.error && <p className="text-sm text-red-400">{state.error}</p>}
      <button
        type="submit"
        disabled={pending}
        className="mt-2 rounded bg-accent py-3 text-sm font-bold tracking-[0.1em] text-accent-ink disabled:opacity-60"
      >
        {pending ? "SAVING…" : "SAVE CHANGES"}
      </button>
    </form>
  );
}
