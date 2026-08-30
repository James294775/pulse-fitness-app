import { requireUserOrRedirect } from "@/lib/auth";
import { AppShell } from "@/components/AppShell";
import { BackHeader } from "@/components/BackHeader";
import { RouteBuilderClient } from "./RouteBuilderClient";

export default async function NewRoutePage() {
  const user = await requireUserOrRedirect();

  return (
    <AppShell withTabBar={false}>
      <BackHeader label="BACK" href="/routes" title="NEW ROUTE" />
      <RouteBuilderClient units={user.units} />
    </AppShell>
  );
}
