import { redirect } from "next/navigation";
import { getSession } from "@/lib/auth";
import { AppShell } from "@/components/app-shell";
import { PageHeader } from "@/components/ui";
import { AtivosClient } from "@/components/ativos/ativos-client";

export default async function AtivosPage() {
  const user = await getSession();
  if (!user) redirect("/login");
  if (user.role !== "admin") redirect("/executive");

  return (
    <AppShell user={user}>
      <PageHeader
        title="Ativos"
        description="Embaixadores com parceria ativa — contato, benefício e entregas"
      />
      <AtivosClient />
    </AppShell>
  );
}
