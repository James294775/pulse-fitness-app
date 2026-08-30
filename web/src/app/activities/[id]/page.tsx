import Link from "next/link";
import { notFound } from "next/navigation";
import { requireUserOrRedirect } from "@/lib/auth";
import { db } from "@/lib/db";
import { canViewActivity } from "@/lib/social";
import { computeSplits, downsample } from "@/lib/geo";
import { parseTrack } from "@/lib/track";
import { buildCommentTree } from "@/lib/comments";
import { sportLabels } from "@/lib/validation";
import { AppShell } from "@/components/AppShell";
import { BackHeader } from "@/components/BackHeader";
import { ActivityMap } from "@/components/ActivityMap";
import { ElevationProfileChart } from "@/components/ElevationProfileChart";
import { PaceChart } from "@/components/PaceChart";
import { SplitsTable } from "@/components/SplitsTable";
import { KudosButton } from "@/components/KudosButton";
import { CommentThread } from "@/components/CommentThread";
import { PhotoUploadForm } from "./PhotoUploadForm";
import {
  distanceUnitLabel,
  formatDistance,
  formatDuration,
  formatElevation,
  formatPace,
  formatSpeed,
  isPaceSport,
} from "@/lib/units";

export default async function ActivityDetailPage({ params }: PageProps<"/activities/[id]">) {
  const { id } = await params;
  const user = await requireUserOrRedirect();

  const activity = await db.activity.findUnique({
    where: { id },
    include: {
      user: true,
      photos: { orderBy: { sortOrder: "asc" } },
      kudos: { where: { userId: user.id }, select: { id: true } },
      comments: {
        orderBy: { createdAt: "asc" },
        include: { user: { select: { id: true, displayName: true } } },
      },
      _count: { select: { kudos: true } },
    },
  });

  if (!activity || !(await canViewActivity(activity, user.id))) notFound();

  const commentTree = buildCommentTree(activity.comments);

  const units = user.units;
  const track = parseTrack(activity.points);
  const unitMeters = units === "imperial" ? 1609.344 : 1000;
  const splits = computeSplits(track, unitMeters);
  const elevationPoints = downsample(track, 200).map((p) => ({ distanceM: p.distM, elevationM: p.ele }));
  const isOwner = activity.userId === user.id;
  const pace = isPaceSport(activity.sportType);

  const date = new Intl.DateTimeFormat("en-US", {
    weekday: "short",
    day: "numeric",
    month: "short",
    hour: "numeric",
    minute: "2-digit",
  }).format(activity.startedAt);

  const initials = activity.user.displayName
    .split(" ")
    .map((p) => p[0])
    .slice(0, 2)
    .join("")
    .toUpperCase();

  return (
    <AppShell withTabBar={false}>
      <BackHeader label="FEED" href="/" />
      <div className="flex flex-col gap-6 px-5 py-6">
        <div>
          <div className="flex items-center gap-2.5">
            <div className="flex h-9 w-9 items-center justify-center rounded border border-border-strong bg-surface text-xs font-semibold text-tertiary">
              {initials}
            </div>
            <div>
              <div className="text-sm font-semibold">{activity.user.displayName}</div>
              <div className="text-[11px] tracking-[0.1em] text-secondary">
                {sportLabels[activity.sportType].toUpperCase()} · {date}
              </div>
            </div>
          </div>
          <h1 className="mt-4 text-2xl font-semibold tracking-tight">{activity.title}</h1>
          {activity.description && <p className="mt-2 text-sm text-tertiary">{activity.description}</p>}
          {isOwner && (
            <Link
              href={`/activities/${activity.id}/edit`}
              className="mt-3 inline-block text-[11px] font-semibold tracking-[0.1em] text-accent"
            >
              EDIT
            </Link>
          )}
        </div>

        {track.length > 1 ? (
          <ActivityMap points={track.map((p) => ({ lat: p.lat, lng: p.lng }))} className="h-[220px] rounded border border-border-weak" />
        ) : (
          <div className="flex h-[80px] items-center justify-center rounded border border-border-weak bg-surface text-xs text-secondary">
            No GPS track — logged manually
          </div>
        )}

        <div className="grid grid-cols-3 gap-px overflow-hidden rounded border border-border-weak bg-border-weak">
          <Stat label="DISTANCE" value={formatDistance(activity.distanceM, units)} />
          <Stat label="MOVING TIME" value={formatDuration(activity.movingTimeSec)} />
          <Stat label="ELAPSED TIME" value={formatDuration(activity.elapsedTimeSec)} />
          <Stat
            label={pace ? "AVG PACE" : "AVG SPEED"}
            value={
              pace
                ? formatPace(activity.distanceM, activity.movingTimeSec, units)
                : formatSpeed(activity.distanceM, activity.movingTimeSec, units)
            }
          />
          <Stat label="ELEVATION" value={formatElevation(activity.elevationGainM, units)} />
          <Stat label="CALORIES" value={activity.calories ? `${activity.calories} kcal` : "—"} />
        </div>

        {track.length > 1 && (
          <>
            <Section title="ELEVATION">
              <ElevationProfileChart points={elevationPoints} units={units} />
            </Section>

            <Section title={pace ? "PACE" : "SPEED"} meta={`PER ${units === "imperial" ? "MI" : "KM"}`}>
              <PaceChart splits={splits} sportType={activity.sportType} units={units} />
            </Section>

            <Section title="SPLITS" meta={`PER ${distanceUnitLabel(units).toUpperCase()}`}>
              <SplitsTable splits={splits} sportType={activity.sportType} units={units} />
            </Section>
          </>
        )}

        <Section title="PHOTOS" meta={`${activity.photos.length}`}>
          {activity.photos.length > 0 && (
            <div className="mb-3 grid grid-cols-3 gap-1.5">
              {activity.photos.map((photo) => (
                // eslint-disable-next-line @next/next/no-img-element -- locally-uploaded prototype assets, not worth next/image's remote-pattern config
                <img key={photo.id} src={photo.url} alt="" className="aspect-square rounded object-cover" />
              ))}
            </div>
          )}
          {isOwner && <PhotoUploadForm activityId={activity.id} />}
        </Section>

        <KudosButton
          activityId={activity.id}
          initialGiven={activity.kudos.length > 0}
          initialCount={activity._count.kudos}
        />

        <Section title="COMMENTS" meta={`${activity.comments.length}`}>
          <CommentThread comments={commentTree} activityId={activity.id} />
        </Section>
      </div>
    </AppShell>
  );
}

function Stat({ label, value }: { label: string; value: string }) {
  return (
    <div className="bg-bg p-3.5">
      <div className="text-[10px] tracking-[0.13em] text-secondary">{label}</div>
      <div className="tabular mt-1.5 text-[22px] font-semibold tracking-tight">{value}</div>
    </div>
  );
}

function Section({ title, meta, children }: { title: string; meta?: string; children: React.ReactNode }) {
  return (
    <div>
      <div className="mb-2 flex items-baseline justify-between">
        <span className="text-xs font-semibold tracking-[0.16em]">{title}</span>
        {meta && <span className="text-[11px] tracking-[0.1em] text-secondary">{meta}</span>}
      </div>
      {children}
    </div>
  );
}
