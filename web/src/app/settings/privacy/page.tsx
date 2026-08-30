import { requireUserOrRedirect } from "@/lib/auth";
import { db } from "@/lib/db";
import { AppShell } from "@/components/AppShell";
import { BackHeader } from "@/components/BackHeader";
import { AddPrivacyZoneForm } from "./AddPrivacyZoneForm";
import { deletePrivacyZoneAction } from "@/lib/actions/privacy-actions";
import { formatDistance } from "@/lib/units";

export default async function PrivacySettingsPage() {
  const user = await requireUserOrRedirect();

  const zones = await db.privacyZone.findMany({ where: { userId: user.id }, orderBy: { id: "asc" } });

  return (
    <AppShell withTabBar={false}>
      <BackHeader label="BACK" href="/settings/profile" title="PRIVACY ZONES" />
      <div className="flex flex-col gap-6 px-5 py-6">
        <p className="text-sm text-secondary">
          Anyone who isn&rsquo;t you sees your activity maps with the start and end trimmed away inside
          these zones. Your own view is never affected, and your total distance/time stats are always
          the real numbers — only the map is clipped.
        </p>

        {zones.length > 0 && (
          <div className="flex flex-col gap-1 overflow-hidden rounded border border-border-weak">
            {zones.map((z) => (
              <div key={z.id} className="flex items-center gap-3 border-b border-border-weak bg-surface px-3.5 py-3 last:border-b-0">
                <div className="min-w-0 flex-1">
                  <div className="truncate text-sm font-semibold">{z.label}</div>
                  <div className="mt-0.5 text-[11px] tracking-[0.08em] text-secondary">
                    {formatDistance(z.radiusM, user.units, 2)} radius
                  </div>
                </div>
                <form action={deletePrivacyZoneAction}>
                  <input type="hidden" name="zoneId" value={z.id} />
                  <button type="submit" className="text-[10px] font-semibold tracking-[0.1em] text-red-400">
                    REMOVE
                  </button>
                </form>
              </div>
            ))}
          </div>
        )}

        <AddPrivacyZoneForm />
      </div>
    </AppShell>
  );
}
