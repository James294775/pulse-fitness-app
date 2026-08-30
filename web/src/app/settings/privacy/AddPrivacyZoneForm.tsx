"use client";

import { useActionState, useEffect, useRef, useState } from "react";
import { createPrivacyZoneAction } from "@/lib/actions/privacy-actions";
import { PrivacyZoneMap } from "@/components/PrivacyZoneMap";

const inputClass =
  "rounded border border-border-strong bg-surface px-3 py-2.5 text-sm outline-none focus:border-accent";
const labelClass = "text-[11px] font-semibold tracking-[0.1em] text-secondary";

export function AddPrivacyZoneForm() {
  const [state, formAction, pending] = useActionState(createPrivacyZoneAction, undefined);
  const [point, setPoint] = useState<{ lat: number; lng: number } | null>(null);
  const formRef = useRef<HTMLFormElement>(null);
  const lastState = useRef(state);

  useEffect(() => {
    if (state !== lastState.current && state && !state.error) {
      setPoint(null);
      formRef.current?.reset();
    }
    lastState.current = state;
  }, [state]);

  return (
    <form ref={formRef} action={formAction} className="flex flex-col gap-4">
      <p className="text-sm text-secondary">
        Tap the map where you want to hide the start and end of your activities — home, work, wherever.
      </p>
      <PrivacyZoneMap point={point} onPick={setPoint} className="h-[220px] rounded border border-border-weak" />
      <input type="hidden" name="lat" value={point?.lat ?? ""} />
      <input type="hidden" name="lng" value={point?.lng ?? ""} />

      <label className="flex flex-col gap-1.5">
        <span className={labelClass}>LABEL</span>
        <input name="label" required maxLength={80} placeholder="Home" className={inputClass} />
      </label>
      <label className="flex flex-col gap-1.5">
        <span className={labelClass}>HIDE RADIUS</span>
        <select name="radiusM" defaultValue="400" className={inputClass}>
          <option value="200">200 m</option>
          <option value="400">400 m</option>
          <option value="800">800 m</option>
          <option value="1500">1.5 km</option>
        </select>
      </label>

      {state?.error && <p className="text-sm text-red-400">{state.error}</p>}
      <button
        type="submit"
        disabled={pending || !point}
        className="rounded bg-accent py-3 text-sm font-bold tracking-[0.1em] text-accent-ink disabled:opacity-40"
      >
        {pending ? "SAVING…" : point ? "ADD ZONE" : "TAP THE MAP FIRST"}
      </button>
    </form>
  );
}
