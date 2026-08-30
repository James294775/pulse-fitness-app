"use client";

import { Area, AreaChart, CartesianGrid, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import { CHART_ACCENT, CHART_ACCENT_WASH } from "@/lib/chart-colors";
import { formatDistance, formatElevation, type Units } from "@/lib/units";

interface ElevationPoint {
  distanceM: number;
  elevationM: number;
}

export function ElevationProfileChart({ points, units }: { points: ElevationPoint[]; units: Units }) {
  if (points.length < 2) {
    return (
      <div className="flex h-[120px] items-center justify-center rounded border border-border-weak bg-surface text-xs text-secondary">
        No elevation data for this activity
      </div>
    );
  }

  const data = points.map((p) => ({ distanceM: p.distanceM, elevationM: p.elevationM }));
  const maxDistanceM = data[data.length - 1].distanceM;
  // Short activities need decimal precision or every tick reads "0 km".
  const tickFractionDigits = maxDistanceM < (units === "imperial" ? 3218 : 2000) ? 2 : 0;

  return (
    <div className="h-[140px] rounded border border-border-weak bg-surface p-2 text-border-weak">
      <ResponsiveContainer width="100%" height="100%">
        <AreaChart data={data} margin={{ top: 8, right: 8, left: 0, bottom: 0 }}>
          <CartesianGrid stroke="currentColor" vertical={false} />
          <XAxis
            dataKey="distanceM"
            tickFormatter={(v) => formatDistance(v, units, tickFractionDigits)}
            stroke="currentColor"
            tick={{ fill: "var(--color-secondary)", fontSize: 10 }}
            tickLine={false}
            axisLine={false}
            minTickGap={40}
          />
          <YAxis hide domain={["dataMin - 5", "dataMax + 5"]} />
          <Tooltip
            cursor={{ stroke: "var(--color-border-strong)" }}
            content={({ active, payload }) => {
              if (!active || !payload?.length) return null;
              const p = payload[0].payload as { distanceM: number; elevationM: number };
              return (
                <div className="rounded border border-border-strong bg-bg px-2.5 py-1.5 text-xs shadow-none">
                  <div className="tabular text-tertiary">{formatDistance(p.distanceM, units)}</div>
                  <div className="tabular font-semibold">{formatElevation(p.elevationM, units)}</div>
                </div>
              );
            }}
          />
          <Area
            type="monotone"
            dataKey="elevationM"
            stroke={CHART_ACCENT}
            strokeWidth={2}
            fill={CHART_ACCENT_WASH}
          />
        </AreaChart>
      </ResponsiveContainer>
    </div>
  );
}
