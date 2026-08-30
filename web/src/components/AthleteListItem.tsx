import Link from "next/link";
import { FollowButton } from "@/components/FollowButton";

export function AthleteListItem({
  athlete,
  viewerId,
  viewerFollows,
}: {
  athlete: { id: string; displayName: string; location: string | null };
  viewerId: string;
  viewerFollows: boolean;
}) {
  const initials = athlete.displayName
    .split(" ")
    .map((p) => p[0])
    .slice(0, 2)
    .join("")
    .toUpperCase();

  return (
    <div className="flex items-center gap-3 border-b border-border-weak px-5 py-3 last:border-b-0">
      <Link
        href={`/athletes/${athlete.id}`}
        className="flex h-10 w-10 shrink-0 items-center justify-center rounded border border-border-strong bg-surface text-xs font-semibold text-tertiary"
      >
        {initials}
      </Link>
      <Link href={`/athletes/${athlete.id}`} className="min-w-0 flex-1">
        <div className="truncate text-sm font-semibold">{athlete.displayName}</div>
        {athlete.location && <div className="truncate text-[11px] text-secondary">{athlete.location}</div>}
      </Link>
      {athlete.id !== viewerId && <FollowButton userId={athlete.id} initialFollowing={viewerFollows} />}
    </div>
  );
}
