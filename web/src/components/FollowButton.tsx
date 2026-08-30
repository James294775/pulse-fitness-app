"use client";

import { useState } from "react";
import { toggleFollowAction } from "@/lib/actions/social-actions";

export function FollowButton({ userId, initialFollowing }: { userId: string; initialFollowing: boolean }) {
  const [following, setFollowing] = useState(initialFollowing);
  const [pending, setPending] = useState(false);

  async function handleClick() {
    if (pending) return;
    setPending(true);
    const next = !following;
    setFollowing(next);
    const result = await toggleFollowAction(userId);
    if ("error" in result) setFollowing(!next);
    setPending(false);
  }

  return (
    <button
      onClick={handleClick}
      disabled={pending}
      className={`rounded px-4 py-2 text-xs font-bold tracking-[0.1em] disabled:opacity-60 ${
        following ? "border border-border-strong text-tertiary" : "bg-accent text-accent-ink"
      }`}
    >
      {following ? "FOLLOWING" : "FOLLOW"}
    </button>
  );
}
