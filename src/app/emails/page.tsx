import { redirect } from "next/navigation";
import { getSession } from "@/lib/auth";
import { AppShell } from "@/components/app-shell";
import { PageHeader } from "@/components/ui";
import { EmailsClient } from "@/components/emails-client";

export default async function EmailsPage() {
  const user = await getSession();
  if (!user) redirect("/login");
  if (user.role !== "admin") redirect("/executive");

  return (
    <AppShell user={user}>
      <PageHeader title="E-mails" description="Preview e envio para embaixadores" />
      <EmailsClient />
    </AppShell>
  );
}
