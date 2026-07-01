import { redirect } from "next/navigation";
import { getSession } from "@/lib/auth";
import { AppShell } from "@/components/app-shell";
import { PageHeader } from "@/components/ui";
import { ContatosClient } from "@/components/contatos-client";

export default async function ContatosPage() {
  const user = await getSession();
  if (!user) redirect("/login");
  if (user.role !== "admin") redirect("/executive");

  return (
    <AppShell user={user}>
      <PageHeader title="Contatos" description="CRM de leads e prospecção" />
      <ContatosClient />
    </AppShell>
  );
}
