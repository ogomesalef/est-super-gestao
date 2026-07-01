import { redirect } from "next/navigation";
import { getSession } from "@/lib/auth";
import { AppShell } from "@/components/app-shell";
import { DashboardClient } from "@/components/dashboard-client";
import { PageHeader } from "@/components/ui";

export default async function DashboardPage() {
  const user = await getSession();
  if (!user) redirect("/login");
  if (user.role === "executive") redirect("/executive");

  return (
    <AppShell user={user}>
      <PageHeader title="Dashboard" description="Resumo operacional por vertical" />
      <DashboardClient />
    </AppShell>
  );
}
