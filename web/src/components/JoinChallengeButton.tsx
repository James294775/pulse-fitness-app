"use client";

import { useState } from "react";
import { joinChallengeAction } from "@/lib/actions/challenge-actions";

export function JoinChallengeButton({ challengeId }: { challengeId: string }) {
  const [joined, setJoined] = useState(false);
  const [pending, setPending] = useState(false);

  async function handleClick() {
    if (pending || joined) return;
    setPending(true);
    const result = await joinChallengeAction(challengeId);
    if (!("error" in result)) setJoined(true);
    setPending(false);
    // Refresh so the leaderboard picks up the new participant server-side.
    if (!("error" in result)) window.location.reload();
  }

  return (
    <button
      onClick={handleClick}
      disabled={pending || joined}
      className="rounded bg-accent px-4 py-2 text-xs font-bold tracking-[0.1em] text-accent-ink disabled:opacity-60"
    >
      {joined ? "JOINED" : pending ? "JOINING…" : "JOIN CHALLENGE"}
    </button>
  );
}
