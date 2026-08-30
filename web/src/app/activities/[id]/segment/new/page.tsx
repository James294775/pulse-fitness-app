import { notFound } from "next/navigation";
import { requireUserOrRedirect } from "@/lib/auth";
import { db } from "@/lib/db";
import { parseTrack } from "@/lib/track";
import { buildTrack } from "@/lib/geo";
import { AppShell } from "@/components/AppShell";
import { BackHeader } from "@/components/BackHeader";
import { SegmentRangeForm } from "./SegmentRangeForm";

export default async function NewSegmentPage({ params }: PageProps<"/activities/[id]/segment/new">) {
  const { id } = await params;
  const user = await requireUserOrRedirect();

  const activity = await db.activity.findUnique({ where: { id } });
  if (!activity || activity.userId !== user.id) notFound();

  const track = buildTrack(parseTrack(activity.points));
  if (track.length < 2) notFound();

  return (
    <AppShell withTabBar={false}>
      <BackHeader label="BACK" href={`/activities/${id}`} title="NEW SEGMENT" />
      <div className="px-5 py-6">
        <p className="mb-5 text-sm text-secondary">
          Drag the start and end markers to pick the stretch of this activity you want to turn into a
          segment.
        </p>
        <SegmentRangeForm activityId={id} track={track} units={user.units} />
      </div>
    </AppShell>
  );
}
