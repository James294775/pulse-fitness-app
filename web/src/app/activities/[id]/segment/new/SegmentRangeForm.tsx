"use client";

import { useActionState, useMemo, useState } from "react";
import { createSegmentAction } from "@/lib/actions/segment-actions";
import { elevationGainFromTrack, haversineMeters } from "@/lib/geo";
import { formatDistance, formatElevation, type Units } from "@/lib/units";
import { trackToSvgPath } from "@/lib/route-thumbnail";
import type { TrackPoint } from "@/lib/track";

export function SegmentRangeForm({
  activityId,
  track,
  units,
}: {
  activityId: string;
  track: TrackPoint[];
  units: Units;
}) {
  const lastIndex = track.length - 1;
  const [range, setRange] = useState<[number, number]>([0, lastIndex]);
  const [state, formAction, pending] = useActionState(createSegmentAction, undefined);

  const slice = useMemo(() => track.slice(range[0], range[1] + 1), [track, range]);
  const distanceM = useMemo(() => {
    let d = 0;
    for (let i = 1; i < slice.length; i++) d += haversineMeters(slice[i - 1], slice[i]);
    return d;
  }, [slice]);
  const elevationGainM = useMemo(() => elevationGainFromTrack(slice), [slice]);

  const fullPath = trackToSvgPath(track, 348, 160);
  const selectedPath = trackToSvgPath(slice, 348, 160);

  function handleStartChange(value: number) {
    setRange(([, end]) => [Math.min(value, end - 1), end]);
  }
  function handleEndChange(value: number) {
    setRange(([start]) => [start, Math.max(value, start + 1)]);
  }

  return (
    <form action={formAction} className="flex flex-col gap-5">
      <input type="hidden" name="activityId" value={activityId} />
      <input type="hidden" name="startIndex" value={range[0]} />
      <input type="hidden" name="endIndex" value={range[1]} />

      <div className="relative h-[160px] overflow-hidden rounded border border-border-weak bg-surface-2">
        <svg viewBox="0 0 348 160" width="100%" height="100%" fill="none">
          {fullPath && <path d={fullPath} stroke="var(--color-border-strong)" strokeWidth="3" strokeLinecap="round" />}
          {selectedPath && <path d={selectedPath} stroke="#0066FF" strokeWidth="4" strokeLinecap="round" />}
        </svg>
      </div>

      <div className="flex flex-col gap-3">
        <label className="flex flex-col gap-1.5">
          <span className="text-[11px] font-semibold tracking-[0.1em] text-secondary">START</span>
          <input
            type="range"
            min={0}
            max={lastIndex}
            value={range[0]}
            onChange={(e) => handleStartChange(Number(e.target.value))}
          />
        </label>
        <label className="flex flex-col gap-1.5">
          <span className="text-[11px] font-semibold tracking-[0.1em] text-secondary">END</span>
          <input
            type="range"
            min={0}
            max={lastIndex}
            value={range[1]}
            onChange={(e) => handleEndChange(Number(e.target.value))}
          />
        </label>
      </div>

      <div className="grid grid-cols-2 gap-px overflow-hidden rounded border border-border-weak bg-border-weak">
        <div className="bg-bg p-3.5">
          <div className="text-[10px] tracking-[0.14em] text-secondary">DISTANCE</div>
          <div className="tabular mt-1.5 text-[20px] font-semibold">{formatDistance(distanceM, units)}</div>
        </div>
        <div className="bg-bg p-3.5">
          <div className="text-[10px] tracking-[0.14em] text-secondary">ELEV GAIN</div>
          <div className="tabular mt-1.5 text-[20px] font-semibold">{formatElevation(elevationGainM, units)}</div>
        </div>
      </div>

      <label className="flex flex-col gap-1.5">
        <span className="text-[11px] font-semibold tracking-[0.1em] text-secondary">SEGMENT NAME</span>
        <input
          name="name"
          required
          maxLength={120}
          placeholder="Seawall Sprint"
          className="rounded border border-border-strong bg-surface px-3 py-2.5 text-sm outline-none focus:border-accent"
        />
      </label>

      {state?.error && <p className="text-sm text-red-400">{state.error}</p>}
      <button
        type="submit"
        disabled={pending}
        className="rounded bg-accent py-3 text-sm font-bold tracking-[0.1em] text-accent-ink disabled:opacity-60"
      >
        {pending ? "CREATING…" : "CREATE SEGMENT"}
      </button>
    </form>
  );
}
