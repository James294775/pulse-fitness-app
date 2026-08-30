"use client";

import { useState } from "react";
import { toggleKudosAction } from "@/lib/actions/social-actions";

export function KudosButton({
  activityId,
  initialGiven,
  initialCount,
}: {
  activityId: string;
  initialGiven: boolean;
  initialCount: number;
}) {
  const [given, setGiven] = useState(initialGiven);
  const [count, setCount] = useState(initialCount);
  const [pending, setPending] = useState(false);

  async function handleClick() {
    if (pending) return;
    setPending(true);
    const next = !given;
    setGiven(next);
    setCount((c) => c + (next ? 1 : -1));
    const result = await toggleKudosAction(activityId);
    if ("error" in result) {
      setGiven(!next);
      setCount((c) => c + (next ? -1 : 1));
    }
    setPending(false);
  }

  return (
    <button
      onClick={handleClick}
      disabled={pending}
      className={`flex flex-1 items-center justify-center gap-2.5 rounded border py-3.5 disabled:opacity-60 ${
        given ? "border-accent bg-accent-wash text-[var(--color-accent-bright)]" : "border-border-strong text-tertiary"
      }`}
    >
      <svg width="19" height="19" viewBox="0 0 20 20" fill="none">
        <path d="M2 13h3.2l2-5.4L10 17l2.2-7 1.6 3H18" stroke="currentColor" strokeWidth="2" strokeLinecap="square" />
      </svg>
      <span className="text-[13px] font-bold tracking-[0.12em]">{given ? "KUDOS GIVEN" : "GIVE KUDOS"}</span>
      <span className="tabular text-[13px] font-bold">{count}</span>
    </button>
  );
}
