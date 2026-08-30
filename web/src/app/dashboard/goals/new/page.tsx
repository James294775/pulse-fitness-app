import { requireUserOrRedirect } from "@/lib/auth";
import { AppShell } from "@/components/AppShell";
import { BackHeader } from "@/components/BackHeader";
import { NewGoalForm } from "./NewGoalForm";

export default async function NewGoalPage() {
  const user = await requireUserOrRedirect();

  return (
    <AppShell withTabBar={false}>
      <BackHeader label="BACK" href="/dashboard" title="NEW GOAL" />
      <div className="px-5 py-6">
        <NewGoalForm units={user.units} />
      </div>
    </AppShell>
  );
}
