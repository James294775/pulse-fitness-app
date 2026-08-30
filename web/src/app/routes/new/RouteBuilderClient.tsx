"use client";

import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { RouteBuilderMap, type LatLng } from "@/components/RouteBuilderMap";
import { createRouteAction } from "@/lib/actions/route-actions";
import { haversineMeters } from "@/lib/geo";
import { formatDistance, type Units } from "@/lib/units";

export function RouteBuilderClient({ units }: { units: Units }) {
  const router = useRouter();
  const [points, setPoints] = useState<LatLng[]>([]);
  const [name, setName] = useState("");
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const distanceM = useMemo(() => {
    let d = 0;
    for (let i = 1; i < points.length; i++) d += haversineMeters(points[i - 1], points[i]);
    return d;
  }, [points]);

  function handleUndo() {
    setPoints((p) => p.slice(0, -1));
  }
  function handleClear() {
    setPoints([]);
  }

  async function handleSave() {
    if (points.length < 2 || !name.trim() || saving) return;
    setSaving(true);
    setError(null);
    const result = await createRouteAction({ name: name.trim(), points });
    if ("error" in result) {
      setError(result.error);
      setSaving(false);
      return;
    }
    router.push(`/routes/${result.id}`);
  }

  return (
    <div className="flex flex-col gap-4 px-5 py-5">
      <p className="text-sm text-secondary">Tap the map to add waypoints. Tap undo to remove the last one.</p>

      <RouteBuilderMap
        points={points}
        onAddPoint={(p) => setPoints((prev) => [...prev, p])}
        className="h-[300px] rounded border border-border-weak"
      />

      <div className="flex gap-2.5">
        <button
          onClick={handleUndo}
          disabled={points.length === 0}
          className="flex-1 rounded border border-border-strong py-2.5 text-xs font-bold tracking-[0.1em] text-tertiary disabled:opacity-40"
        >
          UNDO POINT
        </button>
        <button
          onClick={handleClear}
          disabled={points.length === 0}
          className="flex-1 rounded border border-border-strong py-2.5 text-xs font-bold tracking-[0.1em] text-tertiary disabled:opacity-40"
        >
          CLEAR
        </button>
      </div>

      <div className="rounded border border-border-weak bg-surface p-3.5">
        <div className="text-[10px] tracking-[0.14em] text-secondary">DISTANCE</div>
        <div className="tabular mt-1.5 text-[22px] font-semibold">{formatDistance(distanceM, units)}</div>
      </div>

      <label className="flex flex-col gap-1.5">
        <span className="text-[11px] font-semibold tracking-[0.1em] text-secondary">ROUTE NAME</span>
        <input
          value={name}
          onChange={(e) => setName(e.target.value)}
          placeholder="Seawall loop"
          maxLength={120}
          className="rounded border border-border-strong bg-surface px-3 py-2.5 text-sm outline-none focus:border-accent"
        />
      </label>

      {error && <p className="text-sm text-red-400">{error}</p>}

      <button
        onClick={handleSave}
        disabled={points.length < 2 || !name.trim() || saving}
        className="rounded bg-accent py-3 text-sm font-bold tracking-[0.1em] text-accent-ink disabled:opacity-40"
      >
        {saving ? "SAVING…" : "SAVE ROUTE"}
      </button>
    </div>
  );
}
