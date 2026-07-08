import { NextResponse } from "next/server";
import { requireSession } from "@/lib/auth";
import {
  getCandidaturasSyncStatus,
  syncCandidaturasFromSheets,
} from "@/lib/candidaturas-sync";
import { invalidateCandidaturasSyncCache } from "@/lib/sync-status-cache";
import { isSheetsSyncConfigured } from "@/lib/google-sheets";

export const dynamic = "force-dynamic";

export async function GET() {
  try {
    await requireSession(["admin"]);
    const status = await getCandidaturasSyncStatus();
    return NextResponse.json(status);
  } catch (e) {
    const msg = e instanceof Error ? e.message : String(e);
    if (msg === "UNAUTHORIZED") return NextResponse.json({ error: "Não autenticado" }, { status: 401 });
    if (msg === "FORBIDDEN") return NextResponse.json({ error: "Sem permissão" }, { status: 403 });
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}

export async function POST(req: Request) {
  try {
    await requireSession(["admin"]);

    if (!isSheetsSyncConfigured()) {
      return NextResponse.json(
        {
          error:
            "Google Sheets não configurado. Defina GMAIL_REFRESH_TOKEN com escopo spreadsheets.readonly (reconecte em /api/gmail/connect).",
        },
        { status: 503 }
      );
    }

    let full = false;
    try {
      const body = await req.json();
      full = Boolean(body?.full);
    } catch {
      /* body vazio = incremental */
    }

    const result = await syncCandidaturasFromSheets({ full });
    invalidateCandidaturasSyncCache();
    return NextResponse.json({ ok: true, ...result });
  } catch (e) {
    const msg = e instanceof Error ? e.message : String(e);
    if (msg === "UNAUTHORIZED") return NextResponse.json({ error: "Não autenticado" }, { status: 401 });
    if (msg === "FORBIDDEN") return NextResponse.json({ error: "Sem permissão" }, { status: 403 });
    console.error("POST /api/candidaturas/sync", e);
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}
