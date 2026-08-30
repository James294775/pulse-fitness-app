import Link from "next/link";
import { requireUserOrRedirect } from "@/lib/auth";
import { db } from "@/lib/db";
import { AppShell } from "@/components/AppShell";
import { BackHeader } from "@/components/BackHeader";
import { formatDistance, formatElevation } from "@/lib/units";

export default async function RoutesPage() {
  const user = await requireUserOrRedirect();

  const routes = await db.route.findMany({
    where: { userId: user.id },
    orderBy: [{ starred: "desc" }, { createdAt: "desc" }],
  });

  return (
    <AppShell withTabBar={false}>
      <BackHeader label="BACK" href="/" title="MY ROUTES" />
      <div className="flex flex-col gap-4 px-5 py-5">
        <Link
          href="/routes/new"
          className="rounded border border-border-strong px-4 py-3 text-center text-xs font-bold tracking-[0.1em] text-tertiary"
        >
          + NEW ROUTE
        </Link>

        {routes.length === 0 ? (
          <p className="py-10 text-center text-sm text-secondary">
            No saved routes yet — build one on the map.
          </p>
        ) : (
          <div className="flex flex-col gap-1 overflow-hidden rounded border border-border-weak">
            {routes.map((r) => (
              <Link
                key={r.id}
                href={`/routes/${r.id}`}
                className="flex items-center justify-between gap-3 border-b border-border-weak bg-surface px-4 py-3 last:border-b-0"
              >
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-1.5 truncate text-sm font-semibold">
                    {r.starred && <span className="text-accent">★</span>}
                    {r.name}
                  </div>
                  <div className="mt-0.5 text-[11px] tracking-[0.08em] text-secondary">
                    {formatDistance(r.distanceM, user.units)} · {formatElevation(r.elevationGainM, user.units)} gain
                  </div>
                </div>
              </Link>
            ))}
          </div>
        )}
      </div>
    </AppShell>
  );
}
