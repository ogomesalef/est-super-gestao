import { redirect } from "next/navigation";
import { getSession } from "@/lib/auth";
import { AppShell } from "@/components/app-shell";
import { CampaignDetailClient } from "@/components/campanhas/campaign-detail-client";

export default async function CampaignDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const user = await getSession();
  if (!user) redirect("/login");
  if (user.role !== "admin") redirect("/executive");

  const { id } = await params;

  return (
    <AppShell user={user}>
      <CampaignDetailClient campaignId={id} />
    </AppShell>
  );
}
