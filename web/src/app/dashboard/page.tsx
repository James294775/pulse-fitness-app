import { requireUserOrRedirect, toPublicUser } from "@/lib/auth";
import { AppShell } from "@/components/AppShell";
import { AppHeader } from "@/components/AppHeader";
import { ComingSoon } from "@/components/ComingSoon";

export default async function DashboardPage() {
  const user = await requireUserOrRedirect();

  return (
    <AppShell>
      <AppHeader user={toPublicUser(user)} />
      <ComingSoon title="TRAINING DASHBOARD" phase="Phase 6" />
    </AppShell>
  );
}
