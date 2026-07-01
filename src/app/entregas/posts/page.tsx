import { redirect } from "next/navigation";
import { getSession } from "@/lib/auth";
import { AppShell } from "@/components/app-shell";
import { PageHeader } from "@/components/ui";
import { EntregasNav } from "@/components/entregas/entregas-nav";
import { PostsClient } from "@/components/entregas/posts/posts-client";

export default async function EntregasPostsPage() {
  const user = await getSession();
  if (!user) redirect("/login");
  if (user.role !== "admin") redirect("/executive");

  return (
    <AppShell user={user}>
      <PageHeader
        title="Posts do Forms"
        description="Entregas individuais sincronizadas da aba ENTREGAS — atribua posts sem embaixador"
      />
      <EntregasNav />
      <PostsClient />
    </AppShell>
  );
}
