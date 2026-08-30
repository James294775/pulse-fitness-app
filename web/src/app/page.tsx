import { requireUserOrRedirect, toPublicUser } from "@/lib/auth";
import { AppShell } from "@/components/AppShell";
import { AppHeader } from "@/components/AppHeader";
import { sportLabels } from "@/lib/validation";

export default async function FeedPage() {
  const user = await requireUserOrRedirect();

  return (
    <AppShell>
      <AppHeader user={toPublicUser(user)} />
      <div className="flex flex-1 flex-col items-center justify-center gap-2 px-8 text-center">
        <p className="text-sm font-semibold tracking-[0.12em] text-secondary">
          WELCOME, {user.displayName.split(" ")[0].toUpperCase()}
        </p>
        <p className="max-w-[280px] text-sm text-tertiary">
          Your feed of activities from people you follow lands in Phase 3. For now: your profile
          is set up as a {sportLabels[user.primarySport]} athlete, tracking in{" "}
          {user.units === "imperial" ? "miles" : "kilometres"}.
        </p>
      </div>
    </AppShell>
  );
}
