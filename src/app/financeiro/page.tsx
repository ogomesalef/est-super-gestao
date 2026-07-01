import { redirect } from "next/navigation";
import { getSession } from "@/lib/auth";
import { AppShell } from "@/components/app-shell";
import { PageHeader } from "@/components/ui";
import { FinanceiroClient } from "@/components/financeiro-client";

export default async function FinanceiroPage() {
  const user = await getSession();
  if (!user) redirect("/login");
  if (user.role !== "admin") redirect("/executive");

  return (
    <AppShell user={user}>
      <PageHeader title="Financeiro" description="Fechamento mensal e ações de pagamento" />
      <FinanceiroClient />
    </AppShell>
  );
}
