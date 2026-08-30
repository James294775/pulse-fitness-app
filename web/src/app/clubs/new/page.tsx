import { requireUserOrRedirect } from "@/lib/auth";
import { AppShell } from "@/components/AppShell";
import { BackHeader } from "@/components/BackHeader";
import { NewClubForm } from "./NewClubForm";

export default async function NewClubPage() {
  await requireUserOrRedirect();

  return (
    <AppShell withTabBar={false}>
      <BackHeader label="BACK" href="/clubs" title="NEW CLUB" />
      <div className="px-5 py-6">
        <NewClubForm />
      </div>
    </AppShell>
  );
}
