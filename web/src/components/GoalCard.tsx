import { deleteGoalAction } from "@/lib/actions/goal-actions";
import { sportLabels } from "@/lib/validation";
import { formatDistance, formatDuration, type Units } from "@/lib/units";
import type { GoalProgress } from "@/lib/goals";

export function GoalCard({ progress, units }: { progress: GoalProgress; units: Units }) {
  const { goal, currentValue, periodEnd } = progress;
  const pct = Math.min(100, (currentValue / goal.targetValue) * 100);

  const format = (v: number) => (goal.metric === "distance" ? formatDistance(v, units, 0) : formatDuration(v));
  const scopeLabel = goal.sportType ? sportLabels[goal.sportType].toUpperCase() : "ALL SPORTS";

  return (
    <div className="rounded border border-border-weak bg-surface p-4">
      <div className="flex items-baseline justify-between">
        <span className="text-[11px] font-semibold tracking-[0.14em] text-secondary">
          {goal.period.toUpperCase()} · {scopeLabel}
        </span>
        <form action={deleteGoalAction}>
          <input type="hidden" name="goalId" value={goal.id} />
          <button type="submit" className="text-[10px] font-semibold tracking-[0.1em] text-secondary">
            REMOVE
          </button>
        </form>
      </div>
      <div className="mt-2 flex items-end gap-2">
        <span className="tabular text-2xl font-bold tracking-tight">{format(currentValue)}</span>
        <span className="pb-0.5 text-sm text-secondary">of {format(goal.targetValue)}</span>
      </div>
      <div className="mt-3 h-2.5 overflow-hidden rounded-full bg-border-weak">
        <div className="h-full rounded-full bg-accent" style={{ width: `${pct}%` }} />
      </div>
      <div className="mt-2 text-[10px] tracking-[0.1em] text-secondary">
        RESETS {new Intl.DateTimeFormat("en-US", { month: "short", day: "numeric" }).format(periodEnd)}
      </div>
    </div>
  );
}
