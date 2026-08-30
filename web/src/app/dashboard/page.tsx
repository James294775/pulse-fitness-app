import Link from "next/link";
import { requireUserOrRedirect, toPublicUser } from "@/lib/auth";
import { AppShell } from "@/components/AppShell";
import { AppHeader } from "@/components/AppHeader";
import { TrainingCalendar } from "@/components/TrainingCalendar";
import { FitnessFormChart } from "@/components/FitnessFormChart";
import { GoalCard } from "@/components/GoalCard";
import { getFitnessForm, getPeriodTotals, getTrainingCalendar, percentChange, type PeriodTotal } from "@/lib/dashboard";
import { getPersonalRecords } from "@/lib/personal-records";
import { getGoalsWithProgress } from "@/lib/goals";
import { sportLabels } from "@/lib/validation";
import { formatDistance, formatDuration, formatElevation } from "@/lib/units";
import type { SportType } from "@/generated/prisma/client";

const CALENDAR_WEEKS = 13;
const FITNESS_WEEKS = 12;

export default async function DashboardPage({ searchParams }: PageProps<"/dashboard">) {
  const user = await requireUserOrRedirect();
  const { sport: sportParam } = await searchParams;
  const sportFilter: SportType | null = sportParam === "all" ? null : user.primarySport;

  const [totals, calendar, fitnessForm, personalRecords, goals] = await Promise.all([
    getPeriodTotals(user.id, sportFilter),
    getTrainingCalendar(user.id, CALENDAR_WEEKS),
    getFitnessForm(user.id, FITNESS_WEEKS),
    getPersonalRecords(user.id),
    getGoalsWithProgress(user.id),
  ]);

  const weekChange = percentChange(totals.thisWeek.distanceM, totals.lastWeek.distanceM);
  const monthChange = percentChange(totals.thisMonth.distanceM, totals.lastMonth.distanceM);
  const latestFitness = fitnessForm[fitnessForm.length - 1];

  return (
    <AppShell>
      <AppHeader user={toPublicUser(user)} />
      <div className="flex flex-col gap-6 px-5 py-5">
        <div className="flex items-center justify-between">
          <div>
            <div className="text-sm font-semibold">{user.displayName}</div>
            <div className="text-[10px] tracking-[0.1em] text-secondary">
              TRAINING · WEEK {getIsoWeek(new Date())}
            </div>
          </div>
          <div className="flex overflow-hidden rounded border border-border">
            <Link
              href="/dashboard?sport=primary"
              className={`px-3 py-2 text-[10px] font-bold tracking-[0.1em] ${
                sportFilter ? "bg-accent text-accent-ink" : "bg-surface text-secondary"
              }`}
            >
              {sportLabels[user.primarySport].toUpperCase()}
            </Link>
            <Link
              href="/dashboard?sport=all"
              className={`px-3 py-2 text-[10px] font-bold tracking-[0.1em] ${
                !sportFilter ? "bg-accent text-accent-ink" : "bg-surface text-secondary"
              }`}
            >
              ALL
            </Link>
          </div>
        </div>

        <div className="grid grid-cols-2 gap-px overflow-hidden rounded border border-border-weak bg-border-weak">
          <PeriodCard label="THIS WEEK" total={totals.thisWeek} changePct={weekChange} changeLabel="VS LAST WK" units={user.units} />
          <PeriodCard
            label={new Intl.DateTimeFormat("en-US", { month: "long" }).format(new Date()).toUpperCase()}
            total={totals.thisMonth}
            changePct={monthChange}
            changeLabel="VS LAST MO"
            units={user.units}
          />
        </div>

        <Section title="TRAINING LOG" meta={`${CALENDAR_WEEKS} WEEKS · EFFORT`}>
          <TrainingCalendar days={calendar} weeks={CALENDAR_WEEKS} />
        </Section>

        <Section title="FITNESS & FORM" meta={`${FITNESS_WEEKS} WEEKS`}>
          {latestFitness && (
            <div className="mb-3.5 flex items-end justify-between">
              <div>
                <div className="text-[9.5px] tracking-[0.13em] text-secondary">FITNESS (CTL)</div>
                <div className="tabular mt-1 text-[28px] font-bold tracking-tight">
                  {Math.round(latestFitness.fitness)}
                </div>
              </div>
              <div className="text-right">
                <div className="text-[9.5px] tracking-[0.13em] text-secondary">FORM (TSB)</div>
                <div className="tabular mt-1 text-[28px] font-bold tracking-tight">
                  {latestFitness.form >= 0 ? "+" : ""}
                  {Math.round(latestFitness.form)}
                </div>
              </div>
            </div>
          )}
          <FitnessFormChart points={fitnessForm} />
          <div className="mt-3 flex gap-4">
            <LegendKey swatch={<div className="h-[2.5px] w-4 bg-accent" />} label="FITNESS" />
            <LegendKey swatch={<div className="h-0 w-4 border-t-2 border-dashed border-[#8a8a8a]" />} label="FORM" />
          </div>
        </Section>

        <Section title="PERSONAL RECORDS" meta="ALL TIME">
          {personalRecords.length === 0 ? (
            <p className="text-sm text-secondary">No records yet — race distances and rides will show up here.</p>
          ) : (
            <div className="flex flex-col gap-1 overflow-hidden rounded border border-border-weak">
              {personalRecords.map((r) => (
                <Link
                  key={r.label}
                  href={`/activities/${r.activityId}`}
                  className="flex items-center gap-3 border-b border-border-weak bg-surface px-3.5 py-3 last:border-b-0"
                >
                  <div className="w-28 text-[11px] font-bold tracking-[0.1em] text-secondary">
                    {r.label.toUpperCase()}
                  </div>
                  <div className="tabular flex-1 text-xl font-semibold tracking-tight">{r.value}</div>
                  <div className="text-[11px] text-secondary">
                    {new Intl.DateTimeFormat("en-US", { day: "numeric", month: "short", year: "numeric" }).format(r.date)}
                  </div>
                </Link>
              ))}
            </div>
          )}
        </Section>

        <Section
          title="GOALS"
          meta={
            <Link href="/dashboard/goals/new" className="text-[11px] font-semibold tracking-[0.1em] text-accent">
              + ADD
            </Link>
          }
        >
          {goals.length === 0 ? (
            <p className="text-sm text-secondary">No goals set yet.</p>
          ) : (
            <div className="flex flex-col gap-3">
              {goals.map((g) => (
                <GoalCard key={g.goal.id} progress={g} units={user.units} />
              ))}
            </div>
          )}
        </Section>
      </div>
    </AppShell>
  );
}

function PeriodCard({
  label,
  total,
  changePct,
  changeLabel,
  units,
}: {
  label: string;
  total: PeriodTotal;
  changePct: number | null;
  changeLabel: string;
  units: import("@/generated/prisma/client").Units;
}) {
  const positive = (changePct ?? 0) >= 0;
  return (
    <div className="min-w-0 bg-bg p-3.5">
      <div className="truncate text-[10px] tracking-[0.14em] text-secondary">{label}</div>
      <div className="tabular mt-2 truncate text-[28px] font-bold tracking-tight">{formatDistance(total.distanceM, units, 1)}</div>
      {changePct !== null && (
        <div className="mt-2 flex items-center gap-1.5">
          <svg width="10" height="10" viewBox="0 0 11 11" fill={positive ? "#0066FF" : "#8a8a8a"} className="shrink-0">
            {positive ? <path d="M5.5 0L11 8H0z" /> : <path d="M5.5 11L0 3h11z" />}
          </svg>
          <span className={`tabular shrink-0 text-[11px] font-semibold ${positive ? "text-[var(--color-accent-bright)]" : "text-secondary"}`}>
            {positive ? "+" : ""}
            {changePct.toFixed(1)}%
          </span>
          <span className="truncate text-[9.5px] tracking-[0.08em] text-secondary">{changeLabel}</span>
        </div>
      )}
      <div className="mt-3.5 grid grid-cols-3 gap-1.5 border-t border-border-weak pt-3">
        <MiniStat value={formatDuration(total.movingTimeSec)} label="TIME" />
        <MiniStat value={formatElevation(total.elevationGainM, units)} label="ELEV" />
        <MiniStat value={String(total.sessionCount)} label="SESSIONS" />
      </div>
    </div>
  );
}

function MiniStat({ value, label }: { value: string; label: string }) {
  return (
    <div className="min-w-0">
      <div className="tabular truncate text-[13px] font-semibold">{value}</div>
      <div className="mt-0.5 truncate text-[8.5px] tracking-[0.08em] text-secondary">{label}</div>
    </div>
  );
}

function LegendKey({ swatch, label }: { swatch: React.ReactNode; label: string }) {
  return (
    <div className="flex items-center gap-1.5">
      {swatch}
      <span className="text-[10px] tracking-[0.1em] text-secondary">{label}</span>
    </div>
  );
}

function Section({ title, meta, children }: { title: string; meta?: React.ReactNode; children: React.ReactNode }) {
  return (
    <div>
      <div className="mb-2 flex items-baseline justify-between">
        <span className="text-xs font-semibold tracking-[0.16em]">{title}</span>
        {typeof meta === "string" ? <span className="text-[11px] tracking-[0.1em] text-secondary">{meta}</span> : meta}
      </div>
      {children}
    </div>
  );
}

function getIsoWeek(date: Date): number {
  const d = new Date(Date.UTC(date.getFullYear(), date.getMonth(), date.getDate()));
  d.setUTCDate(d.getUTCDate() + 4 - (d.getUTCDay() || 7));
  const yearStart = new Date(Date.UTC(d.getUTCFullYear(), 0, 1));
  return Math.ceil(((d.getTime() - yearStart.getTime()) / 86400000 + 1) / 7);
}
