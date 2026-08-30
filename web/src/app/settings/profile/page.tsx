import { requireUserOrRedirect, toPublicUser } from "@/lib/auth";
import { AppShell } from "@/components/AppShell";
import { BackHeader } from "@/components/BackHeader";
import { ProfileForm } from "./ProfileForm";
import { LogOutButton } from "./LogOutButton";

export default async function ProfileSettingsPage() {
  const user = await requireUserOrRedirect();

  return (
    <AppShell withTabBar={false}>
      <BackHeader label="BACK" href="/" title="PROFILE" />
      <div className="flex flex-col gap-6 px-5 py-6">
        <ProfileForm user={toPublicUser(user)} />
        <div className="border-t border-border pt-6">
          <LogOutButton />
        </div>
      </div>
    </AppShell>
  );
}
