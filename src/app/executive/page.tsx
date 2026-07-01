import { redirect } from "next/navigation";
import { getSession } from "@/lib/auth";
import { AppShell } from "@/components/app-shell";
import { PageHeader } from "@/components/ui";
import { ExecutiveClient } from "@/components/executive-client";

export default async function ExecutivePage() {
  const user = await getSession();
  if (!user) redirect("/login");

  return (
    <AppShell user={user}>
      <PageHeader
        title="Painel — Visão geral"
        description="Resumo dos embaixadores ativos para gestão executiva"
      />
      <ExecutiveClient />
    </AppShell>
  );
}
