import Link from "next/link";
import { notFound } from "next/navigation";
import { requireUserOrRedirect } from "@/lib/auth";
import { db } from "@/lib/db";
import { getSegmentLeaderboard, type LeaderboardRange } from "@/lib/leaderboard";
import { parseTrack } from "@/lib/track";
import { trackToSvgPath } from "@/lib/route-thumbnail";
import { sportLabels } from "@/lib/validation";
import { formatDistance, formatDuration, formatElevation } from "@/lib/units";
import { AppShell } from "@/components/AppShell";
import { BackHeader } from "@/components/BackHeader";

export default async function SegmentLeaderboardPage({
  params,
  searchParams,
}: PageProps<"/segments/[id]">) {
  const { id } = await params;
  const { range: rangeParam } = await searchParams;
  const range: LeaderboardRange = rangeParam === "this-year" ? "this-year" : "all-time";
  const user = await requireUserOrRedirect();

  const segment = await db.segment.findUnique({
    where: { id },
    include: { createdBy: { select: { displayName: true } } },
  });
  if (!segment) notFound();

  const leaderboard = await getSegmentLeaderboard(id, user.id, range);
  const segmentPath = trackToSvgPath(parseTrack(segment.points), 390, 190, 16);

  return (
    <AppShell withTabBar={false}>
      <BackHeader label="BACK" href="/explore" />
      <div className="flex flex-col gap-5 px-5 py-5">
        <div>
          <div className="text-[10px] tracking-[0.16em] text-secondary">
            SEGMENT · {sportLabels[segment.sportType].toUpperCase()}
          </div>
          <h1 className="mt-2 text-2xl font-semibold tracking-tight">{segment.name}</h1>
          <div className="mt-2 text-[11px] tracking-[0.1em] text-secondary">
            CREATED BY {segment.createdBy.displayName.toUpperCase()}
          </div>
        </div>

        <div className="h-[190px] overflow-hidden rounded border border-border-weak bg-surface-2">
          {segmentPath && (
            <svg viewBox="0 0 390 190" width="100%" height="100%" fill="none">
              <path d={segmentPath} stroke="#0066FF" strokeWidth="4.5" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
          )}
        </div>

        <div className="grid grid-cols-3 gap-px overflow-hidden rounded border border-border-weak bg-border-weak">
          <div className="bg-bg p-3.5">
            <div className="text-[10px] tracking-[0.13em] text-secondary">DISTANCE</div>
            <div className="tabular mt-1.5 text-[22px] font-semibold">{formatDistance(segment.distanceM, user.units)}</div>
          </div>
          <div className="bg-bg p-3.5">
            <div className="text-[10px] tracking-[0.13em] text-secondary">AVG GRADE</div>
            <div className="tabular mt-1.5 text-[22px] font-semibold">{segment.avgGrade.toFixed(1)}%</div>
          </div>
          <div className="bg-bg p-3.5">
            <div className="text-[10px] tracking-[0.13em] text-secondary">ELEV GAIN</div>
            <div className="tabular mt-1.5 text-[22px] font-semibold">{formatElevation(segment.elevationGainM, user.units)}</div>
          </div>
        </div>

        <div className="flex overflow-hidden rounded border border-border">
          <Link
            href={`/segments/${id}?range=all-time`}
            className={`flex-1 py-2.5 text-center text-[10.5px] font-bold tracking-[0.1em] ${
              range === "all-time" ? "bg-accent text-accent-ink" : "bg-surface text-secondary"
            }`}
          >
            ALL-TIME
          </Link>
          <Link
            href={`/segments/${id}?range=this-year`}
            className={`flex-1 py-2.5 text-center text-[10.5px] font-bold tracking-[0.1em] ${
              range === "this-year" ? "bg-accent text-accent-ink" : "bg-surface text-secondary"
            }`}
          >
            THIS YEAR
          </Link>
        </div>

        <div className="overflow-hidden rounded border border-border-weak">
          <div className="grid grid-cols-[34px_1fr_66px_58px] gap-2.5 bg-surface px-3 py-2 text-[10px] tracking-[0.12em] text-secondary">
            <span>POS</span>
            <span>ATHLETE</span>
            <span className="text-right">TIME</span>
            <span className="text-right">DATE</span>
          </div>
          {leaderboard.rows.length === 0 ? (
            <p className="px-3 py-6 text-center text-sm text-secondary">No efforts recorded yet.</p>
          ) : (
            leaderboard.rows.map((row) => (
              <Link
                key={row.userId}
                href={`/athletes/${row.userId}`}
                className={`grid grid-cols-[34px_1fr_66px_58px] items-center gap-2.5 border-b border-border-weak px-3 py-2.5 last:border-b-0 ${
                  row.userId === user.id ? "bg-accent-wash" : ""
                }`}
              >
                <span className="tabular flex items-center gap-1 text-sm font-bold">
                  {row.rank}
                  {row.rank === 1 && <span className="text-accent">♛</span>}
                </span>
                <span className="truncate text-[13.5px] font-semibold">{row.displayName}</span>
                <span className="tabular text-right text-[15px] font-semibold">{formatDuration(row.elapsedSec)}</span>
                <span className="tabular text-right text-xs text-secondary">
                  {new Intl.DateTimeFormat("en-US", { day: "numeric", month: "short" }).format(row.date)}
                </span>
              </Link>
            ))
          )}
        </div>

        {leaderboard.viewerRow && leaderboard.viewerRow.rank > 20 && (
          <div className="border-t border-border-strong pt-4">
            <div className="flex items-center gap-2.5 border-l-2 border-accent bg-accent-wash px-3 py-3">
              <span className="tabular text-sm font-bold text-[var(--color-accent-bright)]">
                {leaderboard.viewerRow.rank}
              </span>
              <div className="flex-1">
                <div className="text-[13.5px] font-bold">
                  {leaderboard.viewerRow.displayName} <span className="text-[10px] text-accent">· YOU</span>
                </div>
              </div>
              <span className="tabular text-[15px] font-bold">{formatDuration(leaderboard.viewerRow.elapsedSec)}</span>
            </div>
            <div className="mt-2 text-[10px] tracking-[0.1em] text-secondary">
              TOP {Math.max(1, Math.round((leaderboard.viewerRow.rank / leaderboard.participantCount) * 100))}% OF{" "}
              {leaderboard.participantCount} ATHLETES
            </div>
          </div>
        )}
      </div>
    </AppShell>
  );
}
