import { NextResponse } from "next/server";
import { getExecutiveSummary } from "@/lib/services";

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const monthRef = searchParams.get("monthRef") || undefined;
  const program = searchParams.get("program") || undefined;
  const summary = await getExecutiveSummary(monthRef, program);
  return NextResponse.json(summary);
}
