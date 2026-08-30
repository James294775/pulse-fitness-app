import type { Split } from "@/lib/geo";
import { isPaceSport, type Units } from "@/lib/units";

function formatPaceSecPerKm(sec: number): string {
  const m = Math.floor(sec / 60);
  const s = Math.round(sec % 60);
  return `${m}:${String(s).padStart(2, "0")}`;
}

export function SplitsTable({
  splits,
  sportType,
  units,
}: {
  splits: Split[];
  sportType: string;
  units: Units;
}) {
  if (splits.length === 0) return null;

  const pace = isPaceSport(sportType);
  const unitDivisor = units === "imperial" ? 1609.344 : 1000;
  const elevUnit = units === "imperial" ? "ft" : "m";
  const elevScale = units === "imperial" ? 3.28084 : 1;

  const rows = splits.map((s) => {
    const distanceInUnit = s.distanceM / unitDivisor;
    const paceSecPerKm = s.timeSec / distanceInUnit;
    const speedKmh = distanceInUnit / (s.timeSec / 3600);
    return { split: s, metric: pace ? paceSecPerKm : speedKmh };
  });

  const best = pace ? Math.min(...rows.map((r) => r.metric)) : Math.max(...rows.map((r) => r.metric));

  return (
    <div className="overflow-hidden rounded border border-border-weak">
      <div className="grid grid-cols-[34px_1fr_62px_52px] gap-2.5 border-b border-border-weak bg-surface px-3 py-2 text-[10px] tracking-[0.12em] text-secondary">
        <span>{units === "imperial" ? "MI" : "KM"}</span>
        <span>{pace ? "PACE" : "SPEED"}</span>
        <span className="text-right">TIME</span>
        <span className="text-right">ELEV</span>
      </div>
      {rows.map(({ split: s, metric }, i) => {
        const isBest = metric === best;
        const barPct = pace ? (best / metric) * 100 : (metric / best) * 100;
        return (
          <div
            key={i}
            className="grid grid-cols-[34px_1fr_62px_52px] items-center gap-2.5 border-b border-border-weak px-3 py-2 last:border-b-0"
          >
            <span className="tabular text-[13px] font-semibold">{s.index}</span>
            <div className="h-[9px] bg-border-weak">
              <div
                className={`h-[9px] ${isBest ? "bg-accent" : "bg-secondary"}`}
                style={{ width: `${Math.min(100, barPct)}%` }}
              />
            </div>
            <span className="tabular text-right text-[13px] font-semibold">
              {pace ? formatPaceSecPerKm(metric) : metric.toFixed(1)}
            </span>
            <span className="tabular text-right text-xs text-secondary">
              {s.elevationChangeM >= 0 ? "+" : ""}
              {Math.round(s.elevationChangeM * elevScale)}
              {elevUnit}
            </span>
          </div>
        );
      })}
    </div>
  );
}
