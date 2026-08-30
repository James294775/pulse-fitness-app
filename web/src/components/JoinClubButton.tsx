"use client";

import { useState } from "react";
import { toggleClubMembershipAction } from "@/lib/actions/club-actions";

export function JoinClubButton({ clubId, initialJoined }: { clubId: string; initialJoined: boolean }) {
  const [joined, setJoined] = useState(initialJoined);
  const [pending, setPending] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleClick() {
    if (pending) return;
    setPending(true);
    setError(null);
    const next = !joined;
    setJoined(next);
    const result = await toggleClubMembershipAction(clubId);
    if ("error" in result) {
      setJoined(!next);
      setError(result.error);
    }
    setPending(false);
  }

  return (
    <div className="flex flex-col items-end gap-1">
      <button
        onClick={handleClick}
        disabled={pending}
        className={`rounded px-4 py-2 text-xs font-bold tracking-[0.1em] disabled:opacity-60 ${
          joined ? "border border-border-strong text-tertiary" : "bg-accent text-accent-ink"
        }`}
      >
        {joined ? "JOINED" : "JOIN CLUB"}
      </button>
      {error && <span className="text-[10px] text-red-400">{error}</span>}
    </div>
  );
}
