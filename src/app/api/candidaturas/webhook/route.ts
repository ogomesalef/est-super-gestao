import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import {
  parseRespostasFromPayload,
  upsertAmbassadorFromRespostas,
} from "@/lib/candidaturas-sync";
import { normalizeHandle } from "@/lib/utils";

/** Webhook: candidatura via Google Forms (Respostas OAB/ECJ). */
export async function POST(req: Request) {
  const data = await req.json();
  const secret =
    process.env.CANDIDATURAS_WEBHOOK_SECRET ||
    process.env.WEBHOOK_SECRET ||
    process.env.APPS_SCRIPT_SECRET;

  if (!secret) {
    return NextResponse.json({ ok: false, error: "webhook not configured" }, { status: 503 });
  }
  if (data.secret !== secret) {
    return NextResponse.json({ ok: false, error: "unauthorized" }, { status: 401 });
  }

  const program = String(data.program || data.Programa || data.vertical || "OAB").trim();
  if (program !== "OAB" && program !== "ECJ") {
    return NextResponse.json({ ok: false, error: "program inválido (OAB ou ECJ)" }, { status: 400 });
  }

  const instagram = normalizeHandle(
    String(data.instagram || data.handle || data["Seu Instagram (@)"] || "")
  );
  if (!instagram || instagram === "@") {
    return NextResponse.json({ ok: false, error: "Instagram obrigatório" }, { status: 400 });
  }

  try {
    const parsed = parseRespostasFromPayload(program, data as Record<string, unknown>);
    if (!parsed) {
      return NextResponse.json({ ok: false, error: "Não foi possível interpretar a candidatura" }, { status: 400 });
    }

    const result = await upsertAmbassadorFromRespostas(parsed, {
      source: "formulario",
      markNeedsReview: parsed.status === "Pendente",
    });

    const ambassador = await prisma.ambassador.findUnique({ where: { id: result.ambassadorId } });

    return NextResponse.json({
      ok: true,
      ambassadorId: result.ambassadorId,
      created: result.created,
      linkedContactId: result.linkedContactId,
      needsReview: ambassador?.needsReview ?? false,
    });
  } catch (e) {
    const message = e instanceof Error ? e.message : "Erro ao processar candidatura";
    return NextResponse.json({ ok: false, error: message }, { status: 400 });
  }
}
