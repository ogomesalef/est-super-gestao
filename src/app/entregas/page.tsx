import { redirect } from "next/navigation";
import { getSession } from "@/lib/auth";
import { AppShell } from "@/components/app-shell";
import { PageHeader } from "@/components/ui";
import { EntregasClient } from "@/components/entregas-client";
import { EntregasNav } from "@/components/entregas/entregas-nav";

export default async function EntregasPage() {
  const user = await getSession();
  if (!user) redirect("/login");
  if (user.role !== "admin") redirect("/executive");

  return (
    <AppShell user={user}>
      <PageHeader title="Entregas do mês" description="Metas vs realizadas por embaixador" />
      <EntregasNav />
      <EntregasClient />
    </AppShell>
  );
}
