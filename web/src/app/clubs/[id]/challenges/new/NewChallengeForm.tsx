"use client";

import { useActionState, useState } from "react";
import { createChallengeAction } from "@/lib/actions/challenge-actions";
import type { Units } from "@/generated/prisma/client";

const inputClass =
  "rounded border border-border-strong bg-surface px-3 py-2.5 text-sm outline-none focus:border-accent";
const labelClass = "text-[11px] font-semibold tracking-[0.1em] text-secondary";

function todayStr() {
  return new Date().toISOString().slice(0, 10);
}
function endOfMonthStr() {
  const d = new Date();
  return new Date(d.getFullYear(), d.getMonth() + 1, 0).toISOString().slice(0, 10);
}

export function NewChallengeForm({ clubId, units }: { clubId: string; units: Units }) {
  const [state, formAction, pending] = useActionState(createChallengeAction, undefined);
  const [metric, setMetric] = useState<"distance" | "time" | "elevation">("distance");
  const distanceUnit = units === "imperial" ? "mi" : "km";
  const targetUnit = metric === "distance" ? distanceUnit : metric === "elevation" ? (units === "imperial" ? "ft" : "m") : "hours";

  return (
    <form action={formAction} className="flex flex-col gap-4">
      <input type="hidden" name="clubId" value={clubId} />
      <label className="flex flex-col gap-1.5">
        <span className={labelClass}>CHALLENGE NAME</span>
        <input name="name" required maxLength={120} className={inputClass} placeholder="100km in September" />
      </label>
      <label className="flex flex-col gap-1.5">
        <span className={labelClass}>DESCRIPTION</span>
        <textarea name="description" rows={2} className={inputClass} />
      </label>
      <label className="flex flex-col gap-1.5">
        <span className={labelClass}>METRIC</span>
        <select
          name="metric"
          value={metric}
          onChange={(e) => setMetric(e.target.value as typeof metric)}
          className={inputClass}
        >
          <option value="distance">Distance</option>
          <option value="time">Time</option>
          <option value="elevation">Elevation</option>
        </select>
      </label>
      <label className="flex flex-col gap-1.5">
        <span className={labelClass}>TARGET ({targetUnit})</span>
        <input name="targetValue" type="number" step="0.1" min="0.1" required className={inputClass} />
        <input type="hidden" name="targetUnit" value={metric === "elevation" ? (units === "imperial" ? "ft" : "m") : distanceUnit} />
      </label>
      <div className="flex gap-3">
        <label className="flex flex-1 flex-col gap-1.5">
          <span className={labelClass}>START</span>
          <input name="startDate" type="date" defaultValue={todayStr()} required className={inputClass} />
        </label>
        <label className="flex flex-1 flex-col gap-1.5">
          <span className={labelClass}>END</span>
          <input name="endDate" type="date" defaultValue={endOfMonthStr()} required className={inputClass} />
        </label>
      </div>
      {state?.error && <p className="text-sm text-red-400">{state.error}</p>}
      <button
        type="submit"
        disabled={pending}
        className="mt-2 rounded bg-accent py-3 text-sm font-bold tracking-[0.1em] text-accent-ink disabled:opacity-60"
      >
        {pending ? "CREATING…" : "CREATE CHALLENGE"}
      </button>
    </form>
  );
}
