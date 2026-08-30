"use client";

import { useActionState } from "react";
import { updateProfileAction } from "@/lib/actions/profile-actions";
import { sportLabels, sportTypes } from "@/lib/validation";
import type { PublicUser } from "@/lib/auth";

export function ProfileForm({ user }: { user: PublicUser }) {
  const [state, formAction, pending] = useActionState(updateProfileAction, undefined);

  return (
    <form action={formAction} className="flex flex-col gap-4">
      <label className="flex flex-col gap-1.5">
        <span className="text-[11px] font-semibold tracking-[0.1em] text-secondary">
          DISPLAY NAME
        </span>
        <input
          name="displayName"
          defaultValue={user.displayName}
          required
          className="rounded border border-border-strong bg-surface px-3 py-2.5 text-sm outline-none focus:border-accent"
        />
      </label>
      <label className="flex flex-col gap-1.5">
        <span className="text-[11px] font-semibold tracking-[0.1em] text-secondary">
          AVATAR URL
        </span>
        <input
          name="avatarUrl"
          defaultValue={user.avatarUrl ?? ""}
          placeholder="https://…"
          className="rounded border border-border-strong bg-surface px-3 py-2.5 text-sm outline-none focus:border-accent"
        />
      </label>
      <label className="flex flex-col gap-1.5">
        <span className="text-[11px] font-semibold tracking-[0.1em] text-secondary">BIO</span>
        <textarea
          name="bio"
          defaultValue={user.bio ?? ""}
          rows={3}
          className="rounded border border-border-strong bg-surface px-3 py-2.5 text-sm outline-none focus:border-accent"
        />
      </label>
      <label className="flex flex-col gap-1.5">
        <span className="text-[11px] font-semibold tracking-[0.1em] text-secondary">
          LOCATION
        </span>
        <input
          name="location"
          defaultValue={user.location ?? ""}
          className="rounded border border-border-strong bg-surface px-3 py-2.5 text-sm outline-none focus:border-accent"
        />
      </label>
      <label className="flex flex-col gap-1.5">
        <span className="text-[11px] font-semibold tracking-[0.1em] text-secondary">
          PRIMARY SPORT
        </span>
        <select
          name="primarySport"
          defaultValue={user.primarySport}
          className="rounded border border-border-strong bg-surface px-3 py-2.5 text-sm outline-none focus:border-accent"
        >
          {sportTypes.map((s) => (
            <option key={s} value={s}>
              {sportLabels[s]}
            </option>
          ))}
        </select>
      </label>
      <label className="flex flex-col gap-1.5">
        <span className="text-[11px] font-semibold tracking-[0.1em] text-secondary">UNITS</span>
        <select
          name="units"
          defaultValue={user.units}
          className="rounded border border-border-strong bg-surface px-3 py-2.5 text-sm outline-none focus:border-accent"
        >
          <option value="metric">Metric (km)</option>
          <option value="imperial">Imperial (mi)</option>
        </select>
      </label>
      {state?.error && <p className="text-sm text-red-400">{state.error}</p>}
      <button
        type="submit"
        disabled={pending}
        className="mt-2 rounded bg-accent py-3 text-sm font-bold tracking-[0.1em] text-accent-ink disabled:opacity-60"
      >
        {pending ? "SAVING…" : "SAVE CHANGES"}
      </button>
    </form>
  );
}
