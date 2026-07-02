"use client";

import { useEffect, useState } from "react";
import { Card, Badge, Button, Input, TableHead, TableRow, Td, TableShell, Th } from "@/components/ui";
import { VerticalBadge } from "@/components/vertical-badge";
import { useVertical } from "@/components/vertical-context";
import { currentMonthRef } from "@/lib/utils";
import { AmbassadorNameLink } from "@/components/ambassador-name-link";
import { verticalRowClass, verticalStatCardClass, verticalTitleClass } from "@/lib/vertical-styles";
import { cn } from "@/lib/utils";

type Summary = {
  month: string;
  byVertical: { OAB: number; ECJ: number };
  byModality: Record<string, number>;
  rows: Array<{
    id: string;
    fullName: string;
    program: string;
    modality: string | null | undefined;
    courseName: string | null | undefined;
    couponCode: string | null | undefined;
    agreedValue: number | null | undefined;
    paidTotal: number;
    pctDelivered: number;
    paymentStatus: string;
  }>;
};

function exportCsv(data: Summary, vertical: string) {
  const headers = ["Nome", "Vertical", "Modalidade", "Curso", "Cupom", "Valor acordado", "Já recebeu", "% mês", "Pagamento"];
  const lines = data.rows.map((r) => [
    r.fullName,
    r.program,
    r.modality || "",
    r.modality === "Remuneração" ? "" : (r.courseName || ""),
    r.modality === "Remuneração" ? "" : (r.couponCode || ""),
    r.modality === "Remuneração" ? String(r.agreedValue ?? "") : "",
    r.paidTotal.toFixed(2),
    r.pctDelivered.toFixed(0),
    r.paymentStatus,
  ]);
  const csv = [headers, ...lines]
    .map((row) => row.map((c) => `"${String(c).replace(/"/g, '""')}"`).join(","))
    .join("\n");
  const blob = new Blob(["\uFEFF" + csv], { type: "text/csv;charset=utf-8" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = `super-embaixadores-${vertical}-${data.month}.csv`;
  a.click();
  URL.revokeObjectURL(url);
}

export function ExecutiveClient() {
  const { vertical } = useVertical();
  const [month, setMonth] = useState(currentMonthRef());
  const [data, setData] = useState<Summary | null>(null);

  useEffect(() => {
    fetch(`/api/executive?monthRef=${month}&program=${vertical}`).then((r) => r.json()).then(setData);
  }, [month, vertical]);

  if (!data) return <p className="text-muted-foreground">Carregando...</p>;

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center gap-3">
        <Input type="month" value={month} onChange={(e) => setMonth(e.target.value)} className="max-w-xs" />
        <Button variant="secondary" onClick={() => exportCsv(data, vertical)}>Exportar CSV</Button>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        <Card title={`Ativos ${vertical}`} className={verticalStatCardClass(vertical)}>
          <p className={cn("text-3xl font-bold tabular", verticalTitleClass(vertical))}>
            {data.byVertical[vertical]}
          </p>
        </Card>
        <Card title="Assinatura + Cupom" className={verticalStatCardClass(vertical)}>
          <p className={cn("text-3xl font-bold tabular", verticalTitleClass(vertical))}>
            {data.byModality["Assinatura + Cupom"] || 0}
          </p>
        </Card>
        <Card title="Remuneração" className={verticalStatCardClass(vertical)}>
          <p className={cn("text-3xl font-bold tabular", verticalTitleClass(vertical))}>
            {data.byModality["Remuneração"] || 0}
          </p>
        </Card>
      </div>

      <div className="space-y-3 lg:hidden">
        {data.rows.map((r) => (
          <div
            key={r.id}
            className={cn(
              "rounded-xl border border-hairline bg-card p-4 shadow-soft",
              verticalRowClass(r.program)
            )}
          >
            <AmbassadorNameLink id={r.id} className="font-medium">
              {r.fullName}
            </AmbassadorNameLink>
            <div className="mt-2 flex flex-wrap gap-2">
              <VerticalBadge vertical={r.program} />
              <Badge>{r.paymentStatus}</Badge>
            </div>
            <dl className="mt-3 grid grid-cols-2 gap-x-3 gap-y-2 text-sm">
              <div>
                <dt className="text-xs text-muted-foreground">Modalidade</dt>
                <dd>{r.modality || "—"}</dd>
              </div>
              <div>
                <dt className="text-xs text-muted-foreground">% mês</dt>
                <dd className="tabular">{r.pctDelivered.toFixed(0)}%</dd>
              </div>
              <div className="col-span-2">
                <dt className="text-xs text-muted-foreground">Curso / Cupom</dt>
                <dd>
                  {r.modality === "Remuneração"
                    ? "—"
                    : [r.courseName, r.couponCode].filter(Boolean).join(" / ") || "—"}
                </dd>
              </div>
              <div>
                <dt className="text-xs text-muted-foreground">Valor acordado</dt>
                <dd className="tabular">
                  {r.modality === "Remuneração" ? `R$ ${r.agreedValue?.toFixed(2) ?? "—"}` : "—"}
                </dd>
              </div>
              <div>
                <dt className="text-xs text-muted-foreground">Já recebeu</dt>
                <dd className="tabular">R$ {r.paidTotal.toFixed(2)}</dd>
              </div>
            </dl>
          </div>
        ))}
      </div>

      <TableShell className="hidden lg:block">
        <TableHead>
          <TableRow>
            <Th>Nome</Th>
            <Th>Vertical</Th>
            <Th>Modalidade</Th>
            <Th>Curso / Cupom</Th>
            <Th>Valor acordado</Th>
            <Th>Já recebeu</Th>
            <Th>% mês</Th>
            <Th>Pagamento</Th>
          </TableRow>
        </TableHead>
        <tbody>
          {data.rows.map((r) => (
            <TableRow key={r.id} className={verticalRowClass(r.program)}>
              <Td>
                <AmbassadorNameLink id={r.id}>{r.fullName}</AmbassadorNameLink>
              </Td>
              <Td><VerticalBadge vertical={r.program} /></Td>
              <Td>{r.modality || "—"}</Td>
              <Td>
                {r.modality === "Remuneração"
                  ? "—"
                  : [r.courseName, r.couponCode].filter(Boolean).join(" / ") || "—"}
              </Td>
              <Td className="tabular">
                {r.modality === "Remuneração" ? `R$ ${r.agreedValue?.toFixed(2) ?? "—"}` : "—"}
              </Td>
              <Td className="tabular">R$ {r.paidTotal.toFixed(2)}</Td>
              <Td className="tabular">{r.pctDelivered.toFixed(0)}%</Td>
              <Td><Badge>{r.paymentStatus}</Badge></Td>
            </TableRow>
          ))}
        </tbody>
      </TableShell>
    </div>
  );
}
