import { requireUserOrRedirect } from "@/lib/auth";
import { AppShell } from "@/components/AppShell";
import { BackHeader } from "@/components/BackHeader";
import { NewActivityForms } from "./NewActivityForms";

export default async function NewActivityPage() {
  const user = await requireUserOrRedirect();

  return (
    <AppShell withTabBar={false}>
      <BackHeader label="BACK" href="/" title="LOG ACTIVITY" />
      <NewActivityForms defaultSport={user.primarySport} defaultUnits={user.units} />
    </AppShell>
  );
}
