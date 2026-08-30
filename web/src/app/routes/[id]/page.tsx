import { notFound } from "next/navigation";
import { requireUserOrRedirect } from "@/lib/auth";
import { db } from "@/lib/db";
import { parseTrack } from "@/lib/track";
import { AppShell } from "@/components/AppShell";
import { BackHeader } from "@/components/BackHeader";
import { ActivityMap } from "@/components/ActivityMap";
import { StarButton } from "@/components/StarButton";
import { deleteRouteAction } from "@/lib/actions/route-actions";
import { formatDistance, formatElevation } from "@/lib/units";

export default async function RouteDetailPage({ params }: PageProps<"/routes/[id]">) {
  const { id } = await params;
  const user = await requireUserOrRedirect();

  const route = await db.route.findUnique({ where: { id } });
  if (!route || route.userId !== user.id) notFound();

  const track = parseTrack(route.points);

  return (
    <AppShell withTabBar={false}>
      <BackHeader label="BACK" href="/routes" />
      <div className="flex flex-col gap-5 px-5 py-5">
        <div className="flex items-start justify-between gap-3">
          <h1 className="text-2xl font-semibold tracking-tight">{route.name}</h1>
          <StarButton routeId={route.id} initialStarred={route.starred} />
        </div>

        <ActivityMap
          points={track.map((p) => ({ lat: p.lat, lng: p.lng }))}
          className="h-[240px] rounded border border-border-weak"
        />

        <div className="grid grid-cols-2 gap-px overflow-hidden rounded border border-border-weak bg-border-weak">
          <div className="bg-bg p-3.5">
            <div className="text-[10px] tracking-[0.13em] text-secondary">DISTANCE</div>
            <div className="tabular mt-1.5 text-[22px] font-semibold">{formatDistance(route.distanceM, user.units)}</div>
          </div>
          <div className="bg-bg p-3.5">
            <div className="text-[10px] tracking-[0.13em] text-secondary">ELEV GAIN</div>
            <div className="tabular mt-1.5 text-[22px] font-semibold">
              {formatElevation(route.elevationGainM, user.units)}
            </div>
          </div>
        </div>

        <a
          href={`/routes/${route.id}/gpx`}
          download
          className="rounded border border-border-strong py-3 text-center text-xs font-bold tracking-[0.1em] text-tertiary"
        >
          EXPORT AS GPX
        </a>

        <form action={deleteRouteAction}>
          <input type="hidden" name="routeId" value={route.id} />
          <button type="submit" className="text-[11px] font-semibold tracking-[0.1em] text-red-400">
            DELETE ROUTE
          </button>
        </form>
      </div>
    </AppShell>
  );
}
