import { redirect } from "next/navigation";
import { getSession } from "@/lib/auth";
import { AppShell } from "@/components/app-shell";
import { PageHeader } from "@/components/ui";
import { ParceriasClient } from "@/components/parcerias-client";

export default async function ParceriasPage() {
  const user = await getSession();
  if (!user) redirect("/login");
  if (user.role !== "admin") redirect("/executive");

  return (
    <AppShell user={user}>
      <PageHeader title="Parcerias" description="Embaixadores, modalidades e metas" />
      <ParceriasClient />
    </AppShell>
  );
}
