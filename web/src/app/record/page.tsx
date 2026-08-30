import { requireUserOrRedirect } from "@/lib/auth";
import { AppShell } from "@/components/AppShell";
import { RecordingClient } from "./RecordingClient";

export default async function RecordPage() {
  const user = await requireUserOrRedirect();

  return (
    <AppShell>
      <RecordingClient defaultSport={user.primarySport} />
    </AppShell>
  );
}
