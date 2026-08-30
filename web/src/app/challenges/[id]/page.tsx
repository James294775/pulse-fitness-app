import { notFound } from "next/navigation";
import { requireUserOrRedirect } from "@/lib/auth";
import { db } from "@/lib/db";
import { getChallengeLeaderboard } from "@/lib/clubs";
import { AppShell } from "@/components/AppShell";
import { BackHeader } from "@/components/BackHeader";
import { JoinChallengeButton } from "@/components/JoinChallengeButton";
import { sportLabels } from "@/lib/validation";
import { formatDistance, formatDuration, formatElevation } from "@/lib/units";

export default async function ChallengeDetailPage({ params }: PageProps<"/challenges/[id]">) {
  const { id } = await params;
  const user = await requireUserOrRedirect();

  const challenge = await db.challenge.findUnique({
    where: { id },
    include: { club: { select: { id: true, name: true } } },
  });
  if (!challenge) notFound();

  const participation = await db.challengeParticipant.findUnique({
    where: { challengeId_userId: { challengeId: id, userId: user.id } },
  });
  const leaderboard = await getChallengeLeaderboard(id);
  const viewerRow = leaderboard.find((r) => r.userId === user.id);

  const now = new Date();
  const isActive = now >= challenge.startDate && now <= challenge.endDate;
  const isPast = now > challenge.endDate;

  const format = (v: number) =>
    challenge.metric === "distance"
      ? formatDistance(v, user.units)
      : challenge.metric === "elevation"
        ? formatElevation(v, user.units)
        : formatDuration(v);

  return (
    <AppShell withTabBar={false}>
      <BackHeader label="BACK" href={`/clubs/${challenge.club?.id ?? ""}`} />
      <div className="flex flex-col gap-6 px-5 py-6">
        <div className="flex items-start justify-between gap-4">
          <div>
            <div className="text-[10px] tracking-[0.16em] text-secondary">
              {challenge.club?.name.toUpperCase()}
              {challenge.sportType ? ` · ${sportLabels[challenge.sportType].toUpperCase()} ONLY` : ""} ·{" "}
              {isPast ? "ENDED" : isActive ? "ACTIVE" : "UPCOMING"}
            </div>
            <h1 className="mt-2 text-2xl font-semibold tracking-tight">{challenge.name}</h1>
            {challenge.description && <p className="mt-2 text-sm text-tertiary">{challenge.description}</p>}
            <div className="mt-2 text-[11px] tracking-[0.1em] text-secondary">
              {new Intl.DateTimeFormat("en-US", { day: "numeric", month: "short" }).format(challenge.startDate)} –{" "}
              {new Intl.DateTimeFormat("en-US", { day: "numeric", month: "short", year: "numeric" }).format(challenge.endDate)}
            </div>
          </div>
          {!participation && <JoinChallengeButton challengeId={challenge.id} />}
        </div>

        <div className="rounded border border-border-weak bg-surface p-4">
          <div className="text-[10px] tracking-[0.14em] text-secondary">TARGET</div>
          <div className="tabular mt-1.5 text-2xl font-bold tracking-tight">{format(challenge.targetValue)}</div>
          {viewerRow && (
            <>
              <div className="mt-3 h-2.5 overflow-hidden rounded-full bg-border-weak">
                <div className="h-full rounded-full bg-accent" style={{ width: `${viewerRow.progressPct}%` }} />
              </div>
              <div className="mt-2 text-[11px] tracking-[0.1em] text-secondary">
                YOUR PROGRESS: {format(viewerRow.value)} ({viewerRow.progressPct.toFixed(0)}%)
              </div>
            </>
          )}
        </div>

        <div>
          <div className="mb-2 text-xs font-semibold tracking-[0.16em]">
            LEADERBOARD <span className="text-secondary">· {leaderboard.length} PARTICIPANTS</span>
          </div>
          {leaderboard.length === 0 ? (
            <p className="text-sm text-secondary">No one has joined yet.</p>
          ) : (
            <div className="overflow-hidden rounded border border-border-weak">
              {leaderboard.map((row) => (
                <div
                  key={row.userId}
                  className={`px-3.5 py-2.5 border-b border-border-weak last:border-b-0 ${
                    row.userId === user.id ? "bg-accent-wash" : "bg-surface"
                  }`}
                >
                  <div className="flex items-center gap-3">
                    <span className="tabular flex w-6 items-center gap-1 text-sm font-bold">
                      {row.rank}
                      {row.rank === 1 && row.value > 0 && <span className="text-accent">♛</span>}
                    </span>
                    <span className="flex-1 truncate text-sm font-semibold">{row.displayName}</span>
                    <span className="tabular text-sm font-semibold">{format(row.value)}</span>
                  </div>
                  <div className="mt-2 ml-9 h-1.5 overflow-hidden rounded-full bg-border-weak">
                    <div className="h-full rounded-full bg-accent" style={{ width: `${row.progressPct}%` }} />
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </AppShell>
  );
}
