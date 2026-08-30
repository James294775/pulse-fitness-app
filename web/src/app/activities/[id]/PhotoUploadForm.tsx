"use client";

import { useActionState } from "react";
import { addPhotosAction } from "@/lib/actions/activity-actions";

export function PhotoUploadForm({ activityId }: { activityId: string }) {
  const [state, formAction, pending] = useActionState(addPhotosAction, undefined);

  return (
    <form action={formAction} className="flex items-center gap-3">
      <input type="hidden" name="activityId" value={activityId} />
      <input
        name="photos"
        type="file"
        accept="image/jpeg,image/png,image/webp,image/gif"
        multiple
        className="flex-1 text-xs text-secondary file:mr-3 file:rounded file:border-0 file:bg-accent file:px-3 file:py-1.5 file:text-xs file:font-bold file:text-accent-ink"
      />
      <button
        type="submit"
        disabled={pending}
        className="rounded border border-border-strong px-3 py-2 text-xs font-bold tracking-[0.1em] text-tertiary disabled:opacity-60"
      >
        {pending ? "…" : "ADD"}
      </button>
      {state?.error && <p className="text-xs text-red-400">{state.error}</p>}
    </form>
  );
}
