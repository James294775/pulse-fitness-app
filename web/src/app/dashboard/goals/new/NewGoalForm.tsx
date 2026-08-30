"use client";

import { useActionState, useState } from "react";
import { createGoalAction } from "@/lib/actions/goal-actions";
import { sportLabels, sportTypes } from "@/lib/validation";
import type { Units } from "@/generated/prisma/client";

const inputClass =
  "rounded border border-border-strong bg-surface px-3 py-2.5 text-sm outline-none focus:border-accent";
const labelClass = "text-[11px] font-semibold tracking-[0.1em] text-secondary";

export function NewGoalForm({ units }: { units: Units }) {
  const [state, formAction, pending] = useActionState(createGoalAction, undefined);
  const [metric, setMetric] = useState<"distance" | "time">("distance");
  const distanceUnit = units === "imperial" ? "mi" : "km";

  return (
    <form action={formAction} className="flex flex-col gap-4">
      <label className="flex flex-col gap-1.5">
        <span className={labelClass}>SPORT</span>
        <select name="sportType" defaultValue="" className={inputClass}>
          <option value="">All sports</option>
          {sportTypes.map((s) => (
            <option key={s} value={s}>
              {sportLabels[s]}
            </option>
          ))}
        </select>
      </label>

      <label className="flex flex-col gap-1.5">
        <span className={labelClass}>PERIOD</span>
        <select name="period" defaultValue="weekly" className={inputClass}>
          <option value="weekly">Weekly</option>
          <option value="monthly">Monthly</option>
        </select>
      </label>

      <label className="flex flex-col gap-1.5">
        <span className={labelClass}>METRIC</span>
        <select
          name="metric"
          value={metric}
          onChange={(e) => setMetric(e.target.value as "distance" | "time")}
          className={inputClass}
        >
          <option value="distance">Distance</option>
          <option value="time">Time</option>
        </select>
      </label>

      <label className="flex flex-col gap-1.5">
        <span className={labelClass}>TARGET ({metric === "distance" ? distanceUnit : "hours"})</span>
        <input name="targetValue" type="number" step="0.1" min="0.1" required className={inputClass} />
        <input type="hidden" name="targetUnit" value={distanceUnit} />
      </label>

      {state?.error && <p className="text-sm text-red-400">{state.error}</p>}
      <button
        type="submit"
        disabled={pending}
        className="mt-2 rounded bg-accent py-3 text-sm font-bold tracking-[0.1em] text-accent-ink disabled:opacity-60"
      >
        {pending ? "SAVING…" : "SAVE GOAL"}
      </button>
    </form>
  );
}
