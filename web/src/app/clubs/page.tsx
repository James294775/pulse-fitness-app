import Link from "next/link";
import { requireUserOrRedirect, toPublicUser } from "@/lib/auth";
import { db } from "@/lib/db";
import { AppShell } from "@/components/AppShell";
import { AppHeader } from "@/components/AppHeader";
import { sportLabels } from "@/lib/validation";

export default async function ClubsPage() {
  const user = await requireUserOrRedirect();

  const clubs = await db.club.findMany({
    orderBy: { createdAt: "desc" },
    include: { _count: { select: { members: true } }, members: { where: { userId: user.id }, select: { userId: true } } },
  });

  return (
    <AppShell>
      <AppHeader user={toPublicUser(user)} />
      <div className="flex flex-col gap-4 px-5 py-5">
        <Link
          href="/clubs/new"
          className="rounded border border-border-strong px-4 py-3 text-center text-xs font-bold tracking-[0.1em] text-tertiary"
        >
          + CREATE CLUB
        </Link>

        {clubs.length === 0 ? (
          <p className="py-10 text-center text-sm text-secondary">No clubs yet — start one.</p>
        ) : (
          <div className="flex flex-col gap-1 overflow-hidden rounded border border-border-weak">
            {clubs.map((c) => (
              <Link
                key={c.id}
                href={`/clubs/${c.id}`}
                className="flex items-center justify-between gap-3 border-b border-border-weak bg-surface px-4 py-3 last:border-b-0"
              >
                <div className="min-w-0">
                  <div className="truncate text-sm font-semibold">{c.name}</div>
                  <div className="mt-0.5 text-[11px] tracking-[0.08em] text-secondary">
                    {c.sportType ? `${sportLabels[c.sportType].toUpperCase()} · ` : ""}
                    {c._count.members} {c._count.members === 1 ? "MEMBER" : "MEMBERS"}
                  </div>
                </div>
                {c.members.length > 0 && (
                  <span className="shrink-0 text-[10px] font-bold tracking-[0.1em] text-accent">JOINED</span>
                )}
              </Link>
            ))}
          </div>
        )}
      </div>
    </AppShell>
  );
}
