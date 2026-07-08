import { NextRequest, NextResponse } from "next/server";
import { getSession } from "@/lib/auth";
import { computePipelineCountsFromItems, getPipelineList } from "@/lib/pipeline";

export async function GET(req: NextRequest) {
  const user = await getSession();
  if (!user || user.role !== "admin") {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const vertical = req.nextUrl.searchParams.get("vertical") || "OAB";
  const items = await getPipelineList(vertical);
  const counts = computePipelineCountsFromItems(items);
  return NextResponse.json({ items, counts });
}
