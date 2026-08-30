"use client";

import { useState } from "react";
import { useActionState } from "react";
import { createManualActivityAction, uploadActivityAction } from "@/lib/actions/activity-actions";
import { sportLabels, sportTypes } from "@/lib/validation";
import type { SportType, Units } from "@/generated/prisma/client";

const inputClass =
  "rounded border border-border-strong bg-surface px-3 py-2.5 text-sm outline-none focus:border-accent";
const labelClass = "text-[11px] font-semibold tracking-[0.1em] text-secondary";

function nowForDatetimeLocal() {
  const d = new Date();
  d.setMinutes(d.getMinutes() - d.getTimezoneOffset());
  return d.toISOString().slice(0, 16);
}

export function NewActivityForms({
  defaultSport,
  defaultUnits,
}: {
  defaultSport: SportType;
  defaultUnits: Units;
}) {
  const [mode, setMode] = useState<"manual" | "upload">("manual");

  return (
    <div className="flex flex-col gap-6 px-5 py-6">
      <div className="flex gap-1 overflow-hidden rounded border border-border-strong">
        <button
          onClick={() => setMode("manual")}
          className={`flex-1 py-2.5 text-xs font-bold tracking-[0.1em] ${
            mode === "manual" ? "bg-accent text-accent-ink" : "bg-surface text-secondary"
          }`}
        >
          MANUAL ENTRY
        </button>
        <button
          onClick={() => setMode("upload")}
          className={`flex-1 py-2.5 text-xs font-bold tracking-[0.1em] ${
            mode === "upload" ? "bg-accent text-accent-ink" : "bg-surface text-secondary"
          }`}
        >
          UPLOAD GPX/TCX
        </button>
      </div>

      {mode === "manual" ? (
        <ManualForm defaultSport={defaultSport} defaultUnits={defaultUnits} />
      ) : (
        <UploadForm defaultSport={defaultSport} />
      )}
    </div>
  );
}

function SportSelect({ defaultSport }: { defaultSport: SportType }) {
  return (
    <label className="flex flex-col gap-1.5">
      <span className={labelClass}>SPORT</span>
      <select name="sportType" defaultValue={defaultSport} className={inputClass}>
        {sportTypes.map((s) => (
          <option key={s} value={s}>
            {sportLabels[s]}
          </option>
        ))}
      </select>
    </label>
  );
}

function PrivacySelect() {
  return (
    <label className="flex flex-col gap-1.5">
      <span className={labelClass}>WHO CAN SEE THIS</span>
      <select name="privacy" defaultValue="everyone" className={inputClass}>
        <option value="everyone">Everyone</option>
        <option value="followers">Followers only</option>
        <option value="only_me">Only me</option>
      </select>
    </label>
  );
}

function ManualForm({ defaultSport, defaultUnits }: { defaultSport: SportType; defaultUnits: Units }) {
  const [state, formAction, pending] = useActionState(createManualActivityAction, undefined);
  const distanceUnit = defaultUnits === "imperial" ? "mi" : "km";
  const elevationUnit = defaultUnits === "imperial" ? "ft" : "m";

  return (
    <form action={formAction} className="flex flex-col gap-4">
      <SportSelect defaultSport={defaultSport} />
      <label className="flex flex-col gap-1.5">
        <span className={labelClass}>TITLE</span>
        <input name="title" required maxLength={140} className={inputClass} placeholder="Evening run" />
      </label>
      <label className="flex flex-col gap-1.5">
        <span className={labelClass}>DATE & TIME</span>
        <input
          name="startedAt"
          type="datetime-local"
          required
          defaultValue={nowForDatetimeLocal()}
          className={inputClass}
        />
      </label>
      <div className="flex gap-3">
        <label className="flex flex-1 flex-col gap-1.5">
          <span className={labelClass}>DISTANCE ({distanceUnit})</span>
          <input
            name="distanceValue"
            type="number"
            step="0.01"
            min="0.01"
            required
            className={inputClass}
          />
          <input type="hidden" name="distanceUnit" value={distanceUnit} />
        </label>
        <label className="flex flex-1 flex-col gap-1.5">
          <span className={labelClass}>ELEVATION ({elevationUnit})</span>
          <input name="elevationGainValue" type="number" step="1" min="0" defaultValue={0} className={inputClass} />
          <input type="hidden" name="elevationUnit" value={elevationUnit} />
        </label>
      </div>
      <div>
        <span className={labelClass}>DURATION</span>
        <div className="mt-1.5 flex gap-2">
          <input name="durationHours" type="number" min="0" placeholder="H" className={`${inputClass} w-full`} />
          <input name="durationMinutes" type="number" min="0" max="59" placeholder="M" className={`${inputClass} w-full`} />
          <input name="durationSeconds" type="number" min="0" max="59" placeholder="S" className={`${inputClass} w-full`} />
        </div>
      </div>
      <label className="flex flex-col gap-1.5">
        <span className={labelClass}>NOTES</span>
        <textarea name="description" rows={3} className={inputClass} />
      </label>
      <PrivacySelect />
      {state?.error && <p className="text-sm text-red-400">{state.error}</p>}
      <button
        type="submit"
        disabled={pending}
        className="mt-2 rounded bg-accent py-3 text-sm font-bold tracking-[0.1em] text-accent-ink disabled:opacity-60"
      >
        {pending ? "SAVING…" : "SAVE ACTIVITY"}
      </button>
    </form>
  );
}

function UploadForm({ defaultSport }: { defaultSport: SportType }) {
  const [state, formAction, pending] = useActionState(uploadActivityAction, undefined);

  return (
    <form action={formAction} className="flex flex-col gap-4">
      <SportSelect defaultSport={defaultSport} />
      <label className="flex flex-col gap-1.5">
        <span className={labelClass}>TITLE</span>
        <input name="title" required maxLength={140} className={inputClass} placeholder="Evening run" />
      </label>
      <label className="flex flex-col gap-1.5">
        <span className={labelClass}>GPX OR TCX FILE</span>
        <input
          name="file"
          type="file"
          accept=".gpx,.tcx"
          required
          className={`${inputClass} file:mr-3 file:rounded file:border-0 file:bg-accent file:px-3 file:py-1.5 file:text-xs file:font-bold file:text-accent-ink`}
        />
      </label>
      <PrivacySelect />
      {state?.error && <p className="text-sm text-red-400">{state.error}</p>}
      <button
        type="submit"
        disabled={pending}
        className="mt-2 rounded bg-accent py-3 text-sm font-bold tracking-[0.1em] text-accent-ink disabled:opacity-60"
      >
        {pending ? "UPLOADING…" : "UPLOAD & SAVE"}
      </button>
    </form>
  );
}
