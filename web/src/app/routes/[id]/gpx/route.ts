import { NextResponse } from "next/server";
import { AuthError, requireUser } from "@/lib/auth";
import { db } from "@/lib/db";
import { parseTrack } from "@/lib/track";
import { buildRouteGpx } from "@/lib/gpx-export";

export async function GET(_request: Request, { params }: RouteContext<"/routes/[id]/gpx">) {
  const { id } = await params;

  let user;
  try {
    user = await requireUser();
  } catch (e) {
    if (e instanceof AuthError) return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
    throw e;
  }

  const route = await db.route.findUnique({ where: { id } });
  if (!route || route.userId !== user.id) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  const points = parseTrack(route.points);
  const gpx = buildRouteGpx(route.name, points);
  const filename = `${route.name.replace(/[^a-z0-9]+/gi, "-").toLowerCase() || "route"}.gpx`;

  return new NextResponse(gpx, {
    headers: {
      "Content-Type": "application/gpx+xml",
      "Content-Disposition": `attachment; filename="${filename}"`,
    },
  });
}
