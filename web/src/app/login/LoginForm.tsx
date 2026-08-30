"use client";

import { useActionState } from "react";
import { logInAction } from "@/lib/actions/auth-actions";

export function LoginForm() {
  const [state, formAction, pending] = useActionState(logInAction, undefined);

  return (
    <form action={formAction} className="flex flex-col gap-4">
      <label className="flex flex-col gap-1.5">
        <span className="text-[11px] font-semibold tracking-[0.1em] text-secondary">EMAIL</span>
        <input
          name="email"
          type="email"
          required
          autoComplete="email"
          className="rounded border border-border-strong bg-surface px-3 py-2.5 text-sm outline-none focus:border-accent"
        />
      </label>
      <label className="flex flex-col gap-1.5">
        <span className="text-[11px] font-semibold tracking-[0.1em] text-secondary">PASSWORD</span>
        <input
          name="password"
          type="password"
          required
          autoComplete="current-password"
          className="rounded border border-border-strong bg-surface px-3 py-2.5 text-sm outline-none focus:border-accent"
        />
      </label>
      {state?.error && <p className="text-sm text-red-400">{state.error}</p>}
      <button
        type="submit"
        disabled={pending}
        className="mt-2 rounded bg-accent py-3 text-sm font-bold tracking-[0.1em] text-accent-ink disabled:opacity-60"
      >
        {pending ? "LOGGING IN…" : "LOG IN"}
      </button>
    </form>
  );
}
