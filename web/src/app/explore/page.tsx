import Link from "next/link";
import { requireUserOrRedirect, toPublicUser } from "@/lib/auth";
import { db } from "@/lib/db";
import { AppShell } from "@/components/AppShell";
import { AppHeader } from "@/components/AppHeader";
import { sportLabels } from "@/lib/validation";
import { formatDistance } from "@/lib/units";

export default async function ExplorePage() {
  const user = await requireUserOrRedirect();

  const segments = await db.segment.findMany({
    orderBy: { createdAt: "desc" },
    take: 30,
    include: { _count: { select: { efforts: true } } },
  });

  return (
    <AppShell>
      <AppHeader user={toPublicUser(user)} />
      <div className="flex flex-col gap-4 px-5 py-5">
        <div>
          <div className="text-xs font-semibold tracking-[0.16em]">SEGMENTS</div>
          <p className="mt-1 text-sm text-secondary">
            Created from a stretch of someone&rsquo;s activity — matched automatically against future
            activities that cover the same ground.
          </p>
        </div>

        {segments.length === 0 ? (
          <p className="py-10 text-center text-sm text-secondary">
            No segments yet — create one from any tracked activity&rsquo;s detail page.
          </p>
        ) : (
          <div className="flex flex-col gap-1 overflow-hidden rounded border border-border-weak">
            {segments.map((s) => (
              <Link
                key={s.id}
                href={`/segments/${s.id}`}
                className="flex items-center justify-between gap-3 border-b border-border-weak bg-surface px-4 py-3 last:border-b-0"
              >
                <div className="min-w-0">
                  <div className="truncate text-sm font-semibold">{s.name}</div>
                  <div className="mt-0.5 text-[11px] tracking-[0.08em] text-secondary">
                    {sportLabels[s.sportType].toUpperCase()} · {s._count.efforts} EFFORTS
                  </div>
                </div>
                <div className="tabular shrink-0 text-right text-xs text-tertiary">
                  {formatDistance(s.distanceM, user.units)}
                </div>
              </Link>
            ))}
          </div>
        )}
      </div>
    </AppShell>
  );
}
