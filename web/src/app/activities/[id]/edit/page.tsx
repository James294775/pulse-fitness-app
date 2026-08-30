import { notFound } from "next/navigation";
import { requireUserOrRedirect } from "@/lib/auth";
import { db } from "@/lib/db";
import { AppShell } from "@/components/AppShell";
import { BackHeader } from "@/components/BackHeader";
import { EditActivityForm } from "./EditActivityForm";

export default async function EditActivityPage({ params }: PageProps<"/activities/[id]/edit">) {
  const { id } = await params;
  const user = await requireUserOrRedirect();

  const activity = await db.activity.findUnique({ where: { id } });
  if (!activity || activity.userId !== user.id) notFound();

  return (
    <AppShell withTabBar={false}>
      <BackHeader label="BACK" href={`/activities/${id}`} title="EDIT ACTIVITY" />
      <div className="px-5 py-6">
        <EditActivityForm
          activityId={activity.id}
          title={activity.title}
          description={activity.description ?? ""}
          privacy={activity.privacy}
        />
      </div>
    </AppShell>
  );
}
