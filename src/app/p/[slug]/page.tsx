import { notFound } from "next/navigation";
import { AmbassadorBriefingView } from "@/components/campanhas/ambassador-briefing-view";
import { getAmbassadorBriefingBySlug } from "@/lib/collab-briefing";

export default async function AmbassadorBriefingPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const data = await getAmbassadorBriefingBySlug(slug);
  if (!data) notFound();

  return (
    <div className="min-h-screen bg-[#faf8f4]">
      <div className="mx-auto min-h-screen w-full max-w-lg border-x border-hairline/60 bg-canvas px-4 py-6 sm:max-w-xl sm:px-6 md:max-w-2xl md:px-8 md:py-8 lg:my-6 lg:max-w-3xl lg:min-h-[calc(100vh-3rem)] lg:rounded-2xl lg:border lg:border-hairline/60 lg:px-10 lg:py-10 lg:shadow-soft xl:max-w-4xl">
        <AmbassadorBriefingView data={data} />
      </div>
    </div>
  );
}
