import { redirect } from "next/navigation";
import { getSession } from "@/lib/auth";
import { AppShell } from "@/components/app-shell";
import { AmbassadorProfileClient } from "@/components/ambassador-profile-client";

export default async function AmbassadorProfilePage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const user = await getSession();
  if (!user) redirect("/login");

  const { id } = await params;

  return (
    <AppShell user={user}>
      <AmbassadorProfileClient ambassadorId={id} />
    </AppShell>
  );
}
