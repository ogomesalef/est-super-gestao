import { NextRequest, NextResponse } from "next/server";
import { getSession } from "@/lib/auth";
import { getPipelineCounts } from "@/lib/pipeline";
import { VERTICALS } from "@/lib/constants";

export async function GET(req: NextRequest) {
  const user = await getSession();
  if (!user || user.role !== "admin") {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const vertical = req.nextUrl.searchParams.get("vertical");
  if (vertical) {
    return NextResponse.json(await getPipelineCounts(vertical));
  }

  const all = await Promise.all(VERTICALS.map((v) => getPipelineCounts(v)));
  return NextResponse.json({
    sidebarTotal: all.reduce((s, c) => s + c.sidebarTotal, 0),
    pipeline: all.reduce((s, c) => s + c.pipeline, 0),
    prospeccao: all.reduce((s, c) => s + c.prospeccao, 0),
    candidaturas: all.reduce((s, c) => s + c.candidaturas, 0),
    desinteressados: all.reduce((s, c) => s + c.desinteressados, 0),
    needsReview: all.reduce((s, c) => s + c.needsReview, 0),
    staleContacts: all.reduce((s, c) => s + c.staleContacts, 0),
    staleProposals: all.reduce((s, c) => s + c.staleProposals, 0),
    needsLink: all.reduce((s, c) => s + c.needsLink, 0),
    respostasPending: all.reduce((s, c) => s + c.respostasPending, 0),
  });
}
