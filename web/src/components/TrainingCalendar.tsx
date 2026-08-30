import type { CalendarDay } from "@/lib/dashboard";

const LEVEL_BG = [
  "var(--color-border-weak)",
  "rgba(0,102,255,0.22)",
  "rgba(0,102,255,0.45)",
  "rgba(0,102,255,0.72)",
  "#0066FF",
];

export function TrainingCalendar({ days, weeks }: { days: CalendarDay[]; weeks: number }) {
  return (
    <div className="rounded border border-border-weak bg-surface p-3.5">
      <div className="flex gap-2">
        <div className="flex flex-col justify-between py-px text-[9px] tracking-[0.08em] text-secondary">
          {["M", "T", "W", "T", "F", "S", "S"].map((d, i) => (
            <span key={i}>{d}</span>
          ))}
        </div>
        <div
          className="flex-1 grid gap-1"
          style={{ gridTemplateRows: "repeat(7, 1fr)", gridAutoFlow: "column", gridAutoColumns: "1fr" }}
        >
          {days.map((d) => (
            <div
              key={d.date}
              title={`${d.date}: effort ${d.effortScore}`}
              className="aspect-square rounded-sm"
              style={{ background: LEVEL_BG[d.level] }}
            />
          ))}
        </div>
      </div>
      <div className="mt-3.5 flex items-center justify-between border-t border-border-weak pt-3">
        <span className="text-[9.5px] tracking-[0.1em] text-secondary">{weeks} WEEKS</span>
        <div className="flex items-center gap-1.5">
          <span className="text-[9.5px] tracking-[0.1em] text-secondary">EASY</span>
          <div className="flex gap-0.5">
            {LEVEL_BG.slice(1).map((c, i) => (
              <div key={i} className="h-2.5 w-2.5" style={{ background: c }} />
            ))}
          </div>
          <span className="text-[9.5px] tracking-[0.1em] text-secondary">HARD</span>
        </div>
      </div>
    </div>
  );
}
