"use client";

import { useActionState } from "react";
import { createClubAction } from "@/lib/actions/club-actions";
import { sportLabels, sportTypes } from "@/lib/validation";

const inputClass =
  "rounded border border-border-strong bg-surface px-3 py-2.5 text-sm outline-none focus:border-accent";
const labelClass = "text-[11px] font-semibold tracking-[0.1em] text-secondary";

export function NewClubForm() {
  const [state, formAction, pending] = useActionState(createClubAction, undefined);

  return (
    <form action={formAction} className="flex flex-col gap-4">
      <label className="flex flex-col gap-1.5">
        <span className={labelClass}>CLUB NAME</span>
        <input name="name" required maxLength={120} className={inputClass} placeholder="Coastal Racing Team" />
      </label>
      <label className="flex flex-col gap-1.5">
        <span className={labelClass}>DESCRIPTION</span>
        <textarea name="description" rows={3} className={inputClass} />
      </label>
      <label className="flex flex-col gap-1.5">
        <span className={labelClass}>SPORT (OPTIONAL)</span>
        <select name="sportType" defaultValue="" className={inputClass}>
          <option value="">All sports</option>
          {sportTypes.map((s) => (
            <option key={s} value={s}>
              {sportLabels[s]}
            </option>
          ))}
        </select>
      </label>
      {state?.error && <p className="text-sm text-red-400">{state.error}</p>}
      <button
        type="submit"
        disabled={pending}
        className="mt-2 rounded bg-accent py-3 text-sm font-bold tracking-[0.1em] text-accent-ink disabled:opacity-60"
      >
        {pending ? "CREATING…" : "CREATE CLUB"}
      </button>
    </form>
  );
}
