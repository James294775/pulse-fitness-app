import { logOutAction } from "@/lib/actions/auth-actions";

export function LogOutButton() {
  return (
    <form action={logOutAction}>
      <button
        type="submit"
        className="rounded border border-border-strong px-4 py-2.5 text-xs font-bold tracking-[0.1em] text-tertiary"
      >
        LOG OUT
      </button>
    </form>
  );
}
