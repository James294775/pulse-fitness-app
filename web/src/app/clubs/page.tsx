import { requireUserOrRedirect, toPublicUser } from "@/lib/auth";
import { AppShell } from "@/components/AppShell";
import { AppHeader } from "@/components/AppHeader";
import { ComingSoon } from "@/components/ComingSoon";

export default async function ClubsPage() {
  const user = await requireUserOrRedirect();

  return (
    <AppShell>
      <AppHeader user={toPublicUser(user)} />
      <ComingSoon title="CLUBS & CHALLENGES" phase="Phase 7" />
    </AppShell>
  );
}
