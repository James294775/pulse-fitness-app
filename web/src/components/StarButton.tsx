"use client";

import { useState } from "react";
import { toggleRouteStarAction } from "@/lib/actions/route-actions";

export function StarButton({ routeId, initialStarred }: { routeId: string; initialStarred: boolean }) {
  const [starred, setStarred] = useState(initialStarred);
  const [pending, setPending] = useState(false);

  async function handleClick() {
    if (pending) return;
    setPending(true);
    const next = !starred;
    setStarred(next);
    const result = await toggleRouteStarAction(routeId);
    if ("error" in result) setStarred(!next);
    setPending(false);
  }

  return (
    <button
      onClick={handleClick}
      disabled={pending}
      className={`flex items-center gap-2 rounded border px-3.5 py-2 text-xs font-bold tracking-[0.1em] disabled:opacity-60 ${
        starred ? "border-accent text-accent" : "border-border-strong text-tertiary"
      }`}
    >
      <span>{starred ? "★" : "☆"}</span>
      {starred ? "STARRED" : "STAR"}
    </button>
  );
}
