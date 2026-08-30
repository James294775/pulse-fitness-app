"use client";

import { CartesianGrid, Line, LineChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import { CHART_ACCENT } from "@/lib/chart-colors";
import type { FitnessFormPoint } from "@/lib/dashboard";

// Fitness (CTL) and form (TSB) both come from the same load signal, just at
// different EWMA windows — pairing accent blue with a second, distinct blue
// fails the dataviz skill's own color-distinguishability check (see
// DECISIONS.md, Phase 2). Form is a de-emphasized *context* line for the
// primary Fitness metric, not a categorical peer, so it gets the neutral
// text-secondary gray instead, plus a dashed stroke as a second cue.
const FORM_COLOR = "#8a8a8a";

export function FitnessFormChart({ points }: { points: FitnessFormPoint[] }) {
  if (points.length < 2) {
    return (
      <div className="flex h-[140px] items-center justify-center rounded border border-border-weak bg-surface text-xs text-secondary">
        Not enough history yet
      </div>
    );
  }

  return (
    <div className="h-[160px] rounded border border-border-weak bg-surface p-2 text-border-weak">
      <ResponsiveContainer width="100%" height="100%">
        <LineChart data={points} margin={{ top: 8, right: 8, left: 0, bottom: 0 }}>
          <CartesianGrid stroke="currentColor" vertical={false} />
          <XAxis
            dataKey="date"
            tickFormatter={(v) => new Intl.DateTimeFormat("en-US", { month: "short", day: "numeric" }).format(new Date(v))}
            stroke="currentColor"
            tick={{ fill: "var(--color-secondary)", fontSize: 9.5 }}
            tickLine={false}
            axisLine={false}
            minTickGap={40}
          />
          <YAxis hide domain={["dataMin - 5", "dataMax + 5"]} />
          <Tooltip
            cursor={{ stroke: "var(--color-border-strong)" }}
            content={({ active, payload, label }) => {
              if (!active || !payload?.length || !label) return null;
              const fitness = Number(payload[0]?.value ?? 0);
              const form = Number(payload[1]?.value ?? 0);
              return (
                <div className="rounded border border-border-strong bg-bg px-2.5 py-1.5 text-xs shadow-none">
                  <div className="tabular text-tertiary">
                    {new Intl.DateTimeFormat("en-US", { month: "short", day: "numeric" }).format(new Date(label))}
                  </div>
                  <div className="tabular font-semibold" style={{ color: CHART_ACCENT }}>
                    Fitness {fitness.toFixed(0)}
                  </div>
                  <div className="tabular font-semibold" style={{ color: FORM_COLOR }}>
                    Form {form.toFixed(0)}
                  </div>
                </div>
              );
            }}
          />
          <Line type="monotone" dataKey="fitness" stroke={CHART_ACCENT} strokeWidth={2} dot={false} />
          <Line type="monotone" dataKey="form" stroke={FORM_COLOR} strokeWidth={1.5} strokeDasharray="4 4" dot={false} />
        </LineChart>
      </ResponsiveContainer>
    </div>
  );
}
