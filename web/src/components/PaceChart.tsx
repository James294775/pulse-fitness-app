"use client";

import { CartesianGrid, Line, LineChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import type { Split } from "@/lib/geo";
import { CHART_ACCENT } from "@/lib/chart-colors";
import { distanceUnitLabel, isPaceSport, type Units } from "@/lib/units";

function formatPaceSecPerKm(sec: number): string {
  const m = Math.floor(sec / 60);
  const s = Math.round(sec % 60);
  return `${m}:${String(s).padStart(2, "0")}`;
}

export function PaceChart({
  splits,
  sportType,
  units,
}: {
  splits: Split[];
  sportType: string;
  units: Units;
}) {
  if (splits.length < 2) {
    return (
      <div className="flex h-[120px] items-center justify-center rounded border border-border-weak bg-surface text-xs text-secondary">
        Not enough splits to chart yet
      </div>
    );
  }

  const pace = isPaceSport(sportType);
  const unitDivisor = units === "imperial" ? 1609.344 : 1000;

  const data = splits.map((s) => {
    const km = s.distanceM / unitDivisor;
    const hours = s.timeSec / 3600;
    return {
      index: s.index,
      value: pace ? s.timeSec / km : km / hours,
    };
  });

  return (
    <div className="h-[140px] rounded border border-border-weak bg-surface p-2 text-border-weak">
      <ResponsiveContainer width="100%" height="100%">
        <LineChart data={data} margin={{ top: 8, right: 8, left: 0, bottom: 0 }}>
          <CartesianGrid stroke="currentColor" vertical={false} />
          <XAxis
            dataKey="index"
            tickFormatter={(v) => `${v}`}
            stroke="currentColor"
            tick={{ fill: "var(--color-secondary)", fontSize: 10 }}
            tickLine={false}
            axisLine={false}
          />
          <YAxis hide reversed={pace} domain={["dataMin - 5%", "dataMax + 5%"]} />
          <Tooltip
            cursor={{ stroke: "var(--color-border-strong)" }}
            content={({ active, payload }) => {
              if (!active || !payload?.length) return null;
              const p = payload[0].payload as { index: number; value: number };
              return (
                <div className="rounded border border-border-strong bg-bg px-2.5 py-1.5 text-xs shadow-none">
                  <div className="tabular text-tertiary">
                    {units === "imperial" ? "Mile" : "Km"} {p.index}
                  </div>
                  <div className="tabular font-semibold">
                    {pace
                      ? `${formatPaceSecPerKm(p.value)} /${distanceUnitLabel(units)}`
                      : `${p.value.toFixed(1)} ${units === "imperial" ? "mph" : "km/h"}`}
                  </div>
                </div>
              );
            }}
          />
          <Line type="monotone" dataKey="value" stroke={CHART_ACCENT} strokeWidth={2} dot={{ r: 3 }} />
        </LineChart>
      </ResponsiveContainer>
    </div>
  );
}
