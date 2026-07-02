import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { appendFinanceLog } from "@/lib/finance-log";
import { buildTermActivityText } from "@/lib/termo-data";
import { isSignedTermoUploadConfigured, uploadSignedTermo } from "@/lib/termo-assinado";

export const dynamic = "force-dynamic";

const MAX_FILE_BYTES = 15 * 1024 * 1024;

export async function POST(req: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;

    if (!isSignedTermoUploadConfigured()) {
      return NextResponse.json(
        { error: "Integração com Google Drive não configurada (GMAIL_REFRESH_TOKEN)" },
        { status: 503 }
      );
    }

    const fin = await prisma.monthlyFinance.findUnique({
      where: { id },
      include: { ambassador: true },
    });
    if (!fin) return NextResponse.json({ error: "Não encontrado" }, { status: 404 });

    const formData = await req.formData();
    const file = formData.get("file");
    if (!file || !(file instanceof File)) {
      return NextResponse.json({ error: "Arquivo PDF obrigatório (campo file)" }, { status: 400 });
    }

    if (file.type !== "application/pdf" && !file.name.toLowerCase().endsWith(".pdf")) {
      return NextResponse.json({ error: "Apenas arquivos PDF são aceitos" }, { status: 400 });
    }

    if (file.size > MAX_FILE_BYTES) {
      return NextResponse.json({ error: "Arquivo excede 15 MB" }, { status: 400 });
    }

    const pdfBuffer = Buffer.from(await file.arrayBuffer());
    const result = await uploadSignedTermo(fin, pdfBuffer, file.name);

    if (!result.ok || !result.signedTermLink) {
      return NextResponse.json(
        { error: result.error || "Falha ao enviar termo assinado" },
        { status: 500 }
      );
    }

    const logLine = `${new Date().toISOString()} — Termo assinado anexado (${file.name})`;
    await prisma.monthlyFinance.update({
      where: { id },
      data: {
        signedTermLink: result.signedTermLink,
        termSigned: true,
        termLink: result.signedTermLink,
        termDocLink: null,
        paymentStatus: "Pronto para enviar ao Financeiro",
        log: appendFinanceLog(fin.log, logLine),
      },
    });

    const updated = await prisma.monthlyFinance.findUnique({
      where: { id },
      include: { ambassador: { include: { partnership: true } } },
    });
    if (!updated) return NextResponse.json({ error: "Não encontrado" }, { status: 404 });

    const control = await prisma.monthlyControl.findUnique({
      where: {
        ambassadorId_monthRef: { ambassadorId: updated.ambassadorId, monthRef: updated.monthRef },
      },
    });

    return NextResponse.json({
      ...updated,
      termActivityAuto: buildTermActivityText(updated.monthRef, control),
    });
  } catch (e) {
    console.error("POST /api/financeiro/[id]/termo-assinado", e);
    const message = e instanceof Error ? e.message : "Erro ao enviar termo assinado";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
