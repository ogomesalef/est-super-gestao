import { NextResponse } from "next/server";
import { getAtivosList } from "@/lib/ativos";

export const dynamic = "force-dynamic";

export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const program = searchParams.get("program") || undefined;
    const items = await getAtivosList(program === "ALL" ? undefined : program);
    return NextResponse.json(items);
  } catch (e) {
    console.error("GET /api/ativos", e);
    return NextResponse.json({ error: "Erro ao carregar ativos" }, { status: 500 });
  }
}
