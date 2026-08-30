import Link from "next/link";
import { notFound } from "next/navigation";
import { requireUserOrRedirect } from "@/lib/auth";
import { db } from "@/lib/db";
import { getClubLeaderboard } from "@/lib/clubs";
import { AppShell } from "@/components/AppShell";
import { BackHeader } from "@/components/BackHeader";
import { JoinClubButton } from "@/components/JoinClubButton";
import { sportLabels } from "@/lib/validation";
import { formatDistance } from "@/lib/units";

export default async function ClubDetailPage({ params }: PageProps<"/clubs/[id]">) {
  const { id } = await params;
  const user = await requireUserOrRedirect();

  const club = await db.club.findUnique({
    where: { id },
    include: {
      members: { include: { user: { select: { id: true, displayName: true } } }, orderBy: { joinedAt: "asc" } },
      challenges: { orderBy: { startDate: "desc" } },
    },
  });
  if (!club) notFound();

  const isMember = club.members.some((m) => m.userId === user.id);
  const isOwner = club.createdByUserId === user.id;
  const leaderboard = isMember ? await getClubLeaderboard(club.id, club.sportType) : [];

  return (
    <AppShell withTabBar={false}>
      <BackHeader label="BACK" href="/clubs" />
      <div className="flex flex-col gap-6 px-5 py-6">
        <div className="flex items-start justify-between gap-4">
          <div>
            <div className="text-[10px] tracking-[0.16em] text-secondary">
              {club.sportType ? sportLabels[club.sportType].toUpperCase() : "ALL SPORTS"} CLUB
            </div>
            <h1 className="mt-2 text-2xl font-semibold tracking-tight">{club.name}</h1>
            {club.description && <p className="mt-2 text-sm text-tertiary">{club.description}</p>}
          </div>
          {!isOwner && <JoinClubButton clubId={club.id} initialJoined={isMember} />}
        </div>

        <div>
          <div className="mb-2 text-xs font-semibold tracking-[0.16em]">
            MEMBERS <span className="text-secondary">· {club.members.length}</span>
          </div>
          <div className="flex flex-wrap gap-2">
            {club.members.map((m) => (
              <Link
                key={m.userId}
                href={`/athletes/${m.userId}`}
                className="rounded border border-border-weak bg-surface px-2.5 py-1.5 text-xs text-tertiary"
              >
                {m.user.displayName}
                {m.role === "owner" && <span className="ml-1 text-accent">·OWNER</span>}
              </Link>
            ))}
          </div>
        </div>

        {isMember ? (
          <div>
            <div className="mb-2 flex items-baseline justify-between">
              <span className="text-xs font-semibold tracking-[0.16em]">CLUB LEADERBOARD</span>
              <span className="text-[11px] tracking-[0.1em] text-secondary">
                {new Intl.DateTimeFormat("en-US", { month: "long" }).format(new Date()).toUpperCase()}
              </span>
            </div>
            <div className="overflow-hidden rounded border border-border-weak">
              {leaderboard.map((row) => (
                <div
                  key={row.userId}
                  className={`flex items-center gap-3 border-b border-border-weak px-3.5 py-2.5 last:border-b-0 ${
                    row.userId === user.id ? "bg-accent-wash" : "bg-surface"
                  }`}
                >
                  <span className="tabular flex items-center gap-1 w-6 text-sm font-bold">
                    {row.rank}
                    {row.rank === 1 && row.value > 0 && <span className="text-accent">♛</span>}
                  </span>
                  <span className="flex-1 truncate text-sm font-semibold">{row.displayName}</span>
                  <span className="tabular text-sm font-semibold">{formatDistance(row.value, user.units)}</span>
                </div>
              ))}
            </div>
          </div>
        ) : (
          <p className="text-sm text-secondary">Join this club to see this month&rsquo;s leaderboard.</p>
        )}

        <div>
          <div className="mb-2 flex items-baseline justify-between">
            <span className="text-xs font-semibold tracking-[0.16em]">CHALLENGES</span>
            {isMember && (
              <Link
                href={`/clubs/${club.id}/challenges/new`}
                className="text-[11px] font-semibold tracking-[0.1em] text-accent"
              >
                + NEW
              </Link>
            )}
          </div>
          {club.challenges.length === 0 ? (
            <p className="text-sm text-secondary">No challenges yet.</p>
          ) : (
            <div className="flex flex-col gap-1 overflow-hidden rounded border border-border-weak">
              {club.challenges.map((c) => (
                <Link
                  key={c.id}
                  href={`/challenges/${c.id}`}
                  className="flex items-center justify-between gap-3 border-b border-border-weak bg-surface px-3.5 py-3 last:border-b-0"
                >
                  <div className="min-w-0">
                    <div className="truncate text-sm font-semibold">{c.name}</div>
                    <div className="mt-0.5 text-[11px] tracking-[0.08em] text-secondary">
                      {new Intl.DateTimeFormat("en-US", { day: "numeric", month: "short" }).format(c.startDate)} –{" "}
                      {new Intl.DateTimeFormat("en-US", { day: "numeric", month: "short" }).format(c.endDate)}
                    </div>
                  </div>
                </Link>
              ))}
            </div>
          )}
        </div>
      </div>
    </AppShell>
  );
}
