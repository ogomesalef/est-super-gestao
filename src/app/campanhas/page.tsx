import { redirect } from "next/navigation";
import { getSession } from "@/lib/auth";
import { AppShell } from "@/components/app-shell";
import { PageHeader } from "@/components/ui";
import { CampanhasClient } from "@/components/campanhas-client";

export default async function CampanhasPage() {
  const user = await getSession();
  if (!user) redirect("/login");
  if (user.role !== "admin") redirect("/executive");

  return (
    <AppShell user={user}>
      <PageHeader title="Campanhas" description="Gestão de campanhas de entregas" />
      <CampanhasClient />
    </AppShell>
  );
}
