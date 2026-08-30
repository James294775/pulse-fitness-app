import { notFound } from "next/navigation";
import { requireUserOrRedirect } from "@/lib/auth";
import { db } from "@/lib/db";
import { AppShell } from "@/components/AppShell";
import { BackHeader } from "@/components/BackHeader";
import { NewChallengeForm } from "./NewChallengeForm";

export default async function NewChallengePage({ params }: PageProps<"/clubs/[id]/challenges/new">) {
  const { id } = await params;
  const user = await requireUserOrRedirect();

  const membership = await db.clubMember.findUnique({
    where: { clubId_userId: { clubId: id, userId: user.id } },
  });
  if (!membership) notFound();

  return (
    <AppShell withTabBar={false}>
      <BackHeader label="BACK" href={`/clubs/${id}`} title="NEW CHALLENGE" />
      <div className="px-5 py-6">
        <NewChallengeForm clubId={id} units={user.units} />
      </div>
    </AppShell>
  );
}
