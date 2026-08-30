"use client";

import { useState } from "react";
import Link from "next/link";
import { toggleKudosAction } from "@/lib/actions/social-actions";
import { sportLabels } from "@/lib/validation";
import { formatDistance, formatDuration, formatPace, formatSpeed, isPaceSport, type Units } from "@/lib/units";

export interface FeedCardData {
  id: string;
  sportType: string;
  title: string;
  startedAt: string; // ISO
  distanceM: number;
  movingTimeSec: number;
  effortScore: number;
  routePathD: string | null;
  kudosCount: number;
  kudosGiven: boolean;
  commentCount: number;
  athlete: { id: string; displayName: string; avatarUrl: string | null };
}

function initialsOf(name: string) {
  return name
    .split(" ")
    .map((p) => p[0])
    .slice(0, 2)
    .join("")
    .toUpperCase();
}

function relativeTime(iso: string) {
  const diffMs = Date.now() - new Date(iso).getTime();
  const mins = Math.round(diffMs / 60000);
  if (mins < 60) return `${mins}m ago`;
  const hours = Math.round(mins / 60);
  if (hours < 24) return `${hours}h ago`;
  const days = Math.round(hours / 24);
  if (days < 7) return `${days}d ago`;
  return new Intl.DateTimeFormat("en-US", { day: "numeric", month: "short" }).format(new Date(iso));
}

export function FeedCard({ activity, units }: { activity: FeedCardData; units: Units }) {
  const [kudosGiven, setKudosGiven] = useState(activity.kudosGiven);
  const [kudosCount, setKudosCount] = useState(activity.kudosCount);
  const [pending, setPending] = useState(false);
  const pace = isPaceSport(activity.sportType);

  async function handleKudos() {
    if (pending) return;
    setPending(true);
    const nextGiven = !kudosGiven;
    setKudosGiven(nextGiven);
    setKudosCount((c) => c + (nextGiven ? 1 : -1));
    const result = await toggleKudosAction(activity.id);
    if ("error" in result) {
      setKudosGiven(!nextGiven);
      setKudosCount((c) => c + (nextGiven ? -1 : 1));
    }
    setPending(false);
  }

  return (
    <div className="border-b border-border">
      <Link href={`/activities/${activity.id}`} className="block px-5 pt-4">
        <div className="flex items-center gap-2.5">
          <Link
            href={`/athletes/${activity.athlete.id}`}
            onClick={(e) => e.stopPropagation()}
            className="flex h-[38px] w-[38px] shrink-0 items-center justify-center rounded border border-border-strong bg-surface text-[13px] font-semibold text-tertiary"
          >
            {initialsOf(activity.athlete.displayName)}
          </Link>
          <div className="min-w-0 flex-1">
            <Link
              href={`/athletes/${activity.athlete.id}`}
              onClick={(e) => e.stopPropagation()}
              className="block truncate text-[15px] font-semibold"
            >
              {activity.athlete.displayName}
            </Link>
            <div className="text-[11px] uppercase tracking-[0.1em] text-secondary">
              {sportLabels[activity.sportType as keyof typeof sportLabels]?.toUpperCase() ?? activity.sportType} ·{" "}
              {relativeTime(activity.startedAt)}
            </div>
          </div>
        </div>
        <div className="mt-3.5 text-[19px] font-semibold tracking-tight">{activity.title}</div>

        {activity.routePathD ? (
          <div className="mt-3 h-[130px] overflow-hidden rounded border border-border-weak bg-surface-2">
            <svg viewBox="0 0 348 130" width="100%" height="100%" fill="none">
              <path d={activity.routePathD} stroke="#0066FF" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
          </div>
        ) : null}

        <div className="mt-3.5 grid grid-cols-3 gap-px bg-border-weak">
          <div className="bg-bg py-2.5">
            <div className="text-[10px] tracking-[0.14em] text-secondary">DISTANCE</div>
            <div className="tabular mt-1 text-[22px] font-semibold">{formatDistance(activity.distanceM, units)}</div>
          </div>
          <div className="bg-bg py-2.5 pl-3.5">
            <div className="text-[10px] tracking-[0.14em] text-secondary">TIME</div>
            <div className="tabular mt-1 text-[22px] font-semibold">{formatDuration(activity.movingTimeSec)}</div>
          </div>
          <div className="bg-bg py-2.5 pl-3.5">
            <div className="text-[10px] tracking-[0.14em] text-secondary">{pace ? "PACE" : "SPEED"}</div>
            <div className="tabular mt-1 text-[22px] font-semibold">
              {pace
                ? formatPace(activity.distanceM, activity.movingTimeSec, units)
                : formatSpeed(activity.distanceM, activity.movingTimeSec, units)}
            </div>
          </div>
        </div>
      </Link>

      <div className="mt-3 flex items-center gap-5 px-5 pb-4">
        <button
          onClick={handleKudos}
          className={`flex items-center gap-2 ${kudosGiven ? "text-accent" : "text-secondary"}`}
        >
          <svg width="19" height="19" viewBox="0 0 20 20" fill="none">
            <path d="M2 13h3.2l2-5.4L10 17l2.2-7 1.6 3H18" stroke="currentColor" strokeWidth="2" strokeLinecap="square" />
          </svg>
          <span className="tabular text-[13px] font-semibold">{kudosCount}</span>
        </button>
        <Link href={`/activities/${activity.id}#comments`} className="flex items-center gap-2 text-secondary">
          <svg width="19" height="19" viewBox="0 0 20 20" fill="none">
            <path
              d="M2.5 3h15v10.5h-9L4 17.5V13.5H2.5V3z"
              stroke="currentColor"
              strokeWidth="1.6"
              strokeLinejoin="miter"
            />
          </svg>
          <span className="tabular text-[13px] font-semibold">{activity.commentCount}</span>
        </Link>
        <div className="flex-1" />
        <span className="text-[11px] tracking-[0.1em] text-secondary">
          RELATIVE EFFORT {activity.effortScore}
        </span>
      </div>
    </div>
  );
}
