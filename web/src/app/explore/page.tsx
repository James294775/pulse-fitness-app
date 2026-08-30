import { requireUserOrRedirect, toPublicUser } from "@/lib/auth";
import { AppShell } from "@/components/AppShell";
import { AppHeader } from "@/components/AppHeader";
import { ComingSoon } from "@/components/ComingSoon";

export default async function ExplorePage() {
  const user = await requireUserOrRedirect();

  return (
    <AppShell>
      <AppHeader user={toPublicUser(user)} />
      <ComingSoon title="EXPLORE SEGMENTS" phase="Phase 4" />
    </AppShell>
  );
}
