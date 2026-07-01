import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { generateTermoAdesao, isTermoGenerationConfigured } from "@/lib/termo-adesao";

export async function POST(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const body = await req.json().catch(() => ({}));
  const force = Boolean(body.force);

  if (!isTermoGenerationConfigured()) {
    return NextResponse.json(
      {
        error:
          "Geração de termo não configurada. Conecte o Google (cx@) com escopos Drive+Docs e defina TERM_TEMPLATE_DOC_ID.",
      },
      { status: 503 }
    );
  }

  const fin = await prisma.monthlyFinance.findUnique({
    where: { id },
    include: { ambassador: { include: { partnership: true } } },
  });
  if (!fin) return NextResponse.json({ error: "Registro não encontrado" }, { status: 404 });

  const control = await prisma.monthlyControl.findUnique({
    where: {
      ambassadorId_monthRef: { ambassadorId: fin.ambassadorId, monthRef: fin.monthRef },
    },
  });

  const result = await generateTermoAdesao(fin, control, {
    force,
    shareWithEmail: fin.ambassador.email,
  });

  if (!result.ok || !result.termLink) {
    return NextResponse.json(
      { ok: false, error: result.error || "Falha ao gerar termo" },
      { status: 502 }
    );
  }

  const updated = await prisma.monthlyFinance.update({
    where: { id },
    data: {
      termLink: result.termLink,
      termDocLink: result.docLink || null,
      log: `${new Date().toISOString()} — Termo gerado${result.docLink ? ` (doc: ${result.docLink})` : ""}`,
    },
  });

  return NextResponse.json({
    ok: true,
    termLink: result.termLink,
    docLink: result.docLink,
    finance: updated,
  });
}
