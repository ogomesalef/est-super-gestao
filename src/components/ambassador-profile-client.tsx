"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { ArrowLeft, ExternalLink, Loader2, Mail } from "lucide-react";
import { Button, Card, Input, Select, TableHead, TableRow, Td, TableShell, Th } from "@/components/ui";
import { EmailPreviewModal } from "@/components/email-preview-modal";
import { AmbassadorMonthDeliveriesModal } from "@/components/ambassador-month-deliveries-modal";
import { FinanceEmailModal } from "@/components/financeiro/finance-email-modal";
import { ParceriaCancelamentoModal } from "@/components/parceria-cancelamento-modal";
import { VerticalBadge } from "@/components/vertical-badge";
import { NotionPill } from "@/components/views/notion-pill";
import { QuickNotesFloatingPanel, QuickNoteContextTarget } from "@/components/ambassador/ambassador-quick-notes";
import type { AmbassadorProfile } from "@/components/ambassador/types";
import {
  CANCELAMENTO_EMAIL_ACTION,
  COLLAB_PEDIDO_EMAIL_ACTION,
  EMAIL_ACTIONS,
  FINANCE_ACTIONS,
  filterAmbassadorEmailActions,
} from "@/lib/constants";
import { currentMonthRef, formatMonthRefLong } from "@/lib/utils";

function formatDate(iso: string | null | undefined): string {
  if (!iso) return "—";
  return new Date(iso).toLocaleDateString("pt-BR", { timeZone: "America/Sao_Paulo" });
}

function formatMoney(v: number | null | undefined): string {
  if (v == null) return "—";
  return `R$ ${v.toFixed(2)}`;
}

function DetailRow({ label, value }: { label: string; value: React.ReactNode }) {
  return (
    <div className="flex flex-col gap-0.5 sm:flex-row sm:gap-4">
      <dt className="shrink-0 text-xs font-medium text-muted-foreground sm:w-36">{label}</dt>
      <dd className="text-sm text-ink">{value}</dd>
    </div>
  );
}

const FINANCE_EMAIL_ACTIONS = new Set([
  "Enviar fechamento do mês (com termo)",
  "Enviar lembrete do termo",
  "Cobrar Form Financeiro",
  "Enviar solicitação ao Financeiro",
  "Avisar embaixador: pagamento solicitado",
]);

export function AmbassadorProfileClient({ ambassadorId }: { ambassadorId: string }) {
  const [profile, setProfile] = useState<AmbassadorProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [emailAction, setEmailAction] = useState<string>(EMAIL_ACTIONS[0]);
  const [courseName, setCourseName] = useState("");
  const [couponCode, setCouponCode] = useState("");
  const [releaseDate, setReleaseDate] = useState("");
  const [cancellationMonthRef, setCancellationMonthRef] = useState(currentMonthRef());
  const [campaignName, setCampaignName] = useState("");
  const [briefingUrl, setBriefingUrl] = useState("");
  const [dueDateDisplay, setDueDateDisplay] = useState("");
  const [videoConcept, setVideoConcept] = useState("");
  const [previewOpen, setPreviewOpen] = useState(false);
  const [previewSubject, setPreviewSubject] = useState("");
  const [previewHtml, setPreviewHtml] = useState("");
  const [cancelModalOpen, setCancelModalOpen] = useState(false);
  const [emailSending, setEmailSending] = useState(false);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  const [financeEmailModal, setFinanceEmailModal] = useState<{
    financeId: string;
    action: string;
    subject: string;
    html: string;
    recipient: string;
    termLink?: string | null;
  } | null>(null);
  const [financeLoading, setFinanceLoading] = useState<string | null>(null);
  const [monthDeliveriesModal, setMonthDeliveriesModal] = useState<string | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch(`/api/ambassadors/${ambassadorId}`, { cache: "no-store" });
      if (!res.ok) {
        setError(res.status === 404 ? "Embaixador não encontrado." : "Erro ao carregar perfil.");
        setProfile(null);
        return;
      }
      const data: AmbassadorProfile = await res.json();
      setProfile(data);
      if (data.partnership?.courseName) setCourseName(data.partnership.courseName);
      if (data.partnership?.couponCode) setCouponCode(data.partnership.couponCode);
    } catch {
      setError("Erro ao carregar perfil.");
    } finally {
      setLoading(false);
    }
  }, [ambassadorId]);

  useEffect(() => {
    load();
  }, [load]);

  const filteredEmailActions = useMemo(() => {
    if (!profile) return [...EMAIL_ACTIONS];
    const mod = profile.partnership?.modality || "Assinatura + Cupom";
    return filterAmbassadorEmailActions(mod);
  }, [profile]);

  useEffect(() => {
    if (filteredEmailActions.length && !filteredEmailActions.includes(emailAction as (typeof EMAIL_ACTIONS)[number])) {
      setEmailAction(filteredEmailActions[0]);
    }
  }, [filteredEmailActions, emailAction]);

  const isCancelAction = emailAction === CANCELAMENTO_EMAIL_ACTION;
  const isCollabEmailAction = emailAction === COLLAB_PEDIDO_EMAIL_ACTION;

  function emailVars() {
    return {
      courseName,
      couponCode,
      releaseDate,
      productValue: profile?.partnership?.agreedValue ?? undefined,
      cancellationMonthRef: isCancelAction ? cancellationMonthRef : undefined,
      ...(isCollabEmailAction
        ? { campaignName, briefingUrl, dueDateDisplay, videoConcept }
        : {}),
    };
  }

  async function previewEmail() {
    if (!profile) return;
    const res = await fetch("/api/emails", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        previewOnly: true,
        ambassadorId: profile.id,
        action: emailAction,
        vars: emailVars(),
      }),
    });
    const data = await res.json();
    setPreviewSubject(data.subject);
    setPreviewHtml(data.html);
    setPreviewOpen(true);
  }

  async function sendEmail(finalize?: { newStatus: string; cancellationMonthRef: string }) {
    if (!profile) return;
    setEmailSending(true);
    const vars = {
      ...emailVars(),
      ...(finalize ? { cancellationMonthRef: finalize.cancellationMonthRef } : {}),
    };
    const res = await fetch("/api/emails", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        ambassadorId: profile.id,
        action: emailAction,
        vars,
        finalize,
      }),
    });
    const data = await res.json();
    setEmailSending(false);

    if (data.send?.ok && data.partnershipUpdate) {
      const end = new Date(data.partnershipUpdate.endDate).toLocaleDateString("pt-BR", {
        timeZone: "America/Sao_Paulo",
      });
      setSuccessMessage(
        `E-mail enviado. Status atualizado para "${data.partnershipUpdate.status}" com encerramento em ${end}.`
      );
      setCancelModalOpen(false);
      load();
    } else if (data.send?.ok) {
      setSuccessMessage("E-mail enviado com sucesso!");
      load();
    } else {
      alert(data.send?.error || data.error || "Erro ao enviar e-mail");
    }
  }

  async function handleSendClick() {
    if (isCancelAction) {
      setCancelModalOpen(true);
      return;
    }
    await sendEmail();
  }

  async function requestFinanceEmail(financeId: string, action: string) {
    setFinanceLoading(financeId + "preview");
    const res = await fetch("/api/financeiro/actions", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ financeId, action, previewOnly: true }),
    });
    const data = await res.json();
    setFinanceLoading(null);
    if (!res.ok) {
      alert(data.error || "Erro ao preparar e-mail");
      return;
    }
    setFinanceEmailModal({
      financeId,
      action,
      subject: data.subject,
      html: data.html,
      recipient: data.recipient,
      termLink: data.termLink ?? null,
    });
  }

  async function runFinanceAction(financeId: string, action: string) {
    setFinanceLoading(financeId + action);
    await fetch("/api/financeiro/actions", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ financeId, action }),
    });
    setFinanceLoading(null);
    load();
  }

  async function confirmFinanceEmail(payload: { subject: string; html: string }) {
    if (!financeEmailModal) return;
    setFinanceLoading(financeEmailModal.financeId + "send");
    await fetch("/api/financeiro/actions", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        financeId: financeEmailModal.financeId,
        action: financeEmailModal.action,
        subject: payload.subject,
        html: payload.html,
      }),
    });
    setFinanceEmailModal(null);
    setFinanceLoading(null);
    load();
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20 text-muted-foreground">
        <Loader2 className="mr-2 h-5 w-5 animate-spin" />
        Carregando perfil…
      </div>
    );
  }

  if (error || !profile) {
    return (
      <div className="space-y-4 py-12 text-center">
        <p className="text-muted-foreground">{error || "Perfil não encontrado."}</p>
        <Link href="/" className="text-sm text-primary hover:underline">
          Voltar ao dashboard
        </Link>
      </div>
    );
  }

  const p = profile.partnership;
  const borderColor = profile.program === "ECJ" ? "#D08C00" : "#6B0A09";

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-3">
        <Link
          href="/parcerias"
          className="inline-flex items-center gap-1.5 rounded-md px-2 py-1.5 text-sm text-muted-foreground hover:bg-surface hover:text-ink"
        >
          <ArrowLeft className="h-4 w-4" />
          Voltar
        </Link>
      </div>

      {successMessage && (
        <div className="rounded-xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-900">
          <p>{successMessage}</p>
          <button
            type="button"
            className="mt-2 text-xs font-medium underline"
            onClick={() => setSuccessMessage(null)}
          >
            Fechar
          </button>
        </div>
      )}

      <QuickNoteContextTarget
        ambassadorId={profile.id}
        ambassadorName={profile.fullName}
        onChanged={load}
      >
        <div
          className="overflow-hidden rounded-xl border border-hairline bg-card shadow-soft"
          style={{ borderTopWidth: 4, borderTopColor: borderColor }}
        >
          <div className="p-5 sm:p-6">
            <div className="flex flex-wrap items-start justify-between gap-4">
              <div>
                <h1 className="font-serif text-2xl text-ink">{profile.fullName}</h1>
                <p className="mt-0.5 text-sm text-muted-foreground">{profile.instagram}</p>
                <div className="mt-2 flex flex-wrap gap-1.5">
                  <VerticalBadge vertical={profile.program} />
                  <NotionPill kind="status">{profile.status}</NotionPill>
                  {p?.modality && <NotionPill kind="modality">{p.modality}</NotionPill>}
                </div>
              </div>
              <div className="text-right text-sm text-muted-foreground">
                {profile.email && (
                  <a href={`mailto:${profile.email}`} className="block hover:text-primary">
                    {profile.email}
                  </a>
                )}
                {profile.whatsapp && <p>{profile.whatsapp}</p>}
              </div>
            </div>

            {profile.alerts && (
              <p className="mt-3 rounded-lg border border-amber-200 bg-amber-50 px-3 py-2 text-sm text-amber-950">
                {profile.alerts}
              </p>
            )}
          </div>
        </div>
      </QuickNoteContextTarget>

      <div className="grid gap-4 lg:grid-cols-2">
        <Card title="Parceria">
          <dl className="space-y-2.5">
            <DetailRow label="Modalidade" value={p?.modality || "—"} />
            <DetailRow label="Curso" value={p?.courseName || "—"} />
            <DetailRow
              label="Curso liberado"
              value={p?.courseReleased ? `Sim · ${formatDate(p.courseReleaseDate)}` : "Não"}
            />
            <DetailRow label="Cupom" value={p?.couponCode || "—"} />
            <DetailRow label="Valor acordado" value={formatMoney(p?.agreedValue)} />
            <DetailRow label="Início" value={formatDate(p?.startDate)} />
            <DetailRow label="Encerramento" value={formatDate(p?.endDate)} />
            <DetailRow label="Proposta enviada" value={formatDate(p?.proposalSentAt)} />
            <DetailRow label="Formalização enviada" value={formatDate(p?.formalizationSentAt)} />
          </dl>
        </Card>

        <Card title="Metas mensais">
          <dl className="space-y-2.5">
            <DetailRow label="Feed" value={p?.metaFeed ?? 0} />
            <DetailRow label="Stories" value={p?.metaStories ?? 0} />
            <DetailRow label="TikTok" value={p?.metaTiktok ?? 0} />
            <DetailRow label="YouTube" value={p?.metaYoutube ?? 0} />
          </dl>
          {p?.modality === "Remuneração" && (
            <div className="mt-4 border-t border-hairline pt-4">
              <p className="mb-2 text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                Dados financeiros / termo
              </p>
              <dl className="space-y-2.5">
                <DetailRow label="CPF" value={p.legalCpf || "—"} />
                <DetailRow label="Endereço" value={p.legalAddress || "—"} />
                <DetailRow label="Banco" value={p.bankDetails || "—"} />
              </dl>
            </div>
          )}
        </Card>
      </div>

      <Card title="Entregas mês a mês">
        {profile.monthlyControls.length === 0 ? (
          <p className="text-sm text-muted-foreground">Nenhum registro de entregas.</p>
        ) : (
          <TableShell>
            <TableHead>
              <TableRow>
                <Th>Mês</Th>
                <Th>%</Th>
                <Th>Feed</Th>
                <Th>Stories</Th>
                <Th>TikTok</Th>
                <Th>YouTube</Th>
                <Th>Comprovantes</Th>
              </TableRow>
            </TableHead>
            <tbody>
              {profile.monthlyControls.map((c) => (
                <TableRow
                  key={c.id}
                  className="cursor-pointer hover:bg-muted/50"
                  onClick={() => setMonthDeliveriesModal(c.monthRef)}
                >
                  <Td className="font-medium capitalize text-primary underline-offset-2 hover:underline">
                    {formatMonthRefLong(c.monthRef)}
                  </Td>
                  <Td className="tabular">{c.pctDelivered.toFixed(0)}%</Td>
                  <Td className="text-xs tabular">
                    {c.deliveredFeed}/{c.metaFeed}
                    {c.statusFeed && (
                      <NotionPill kind="status" className="ml-1">
                        {c.statusFeed}
                      </NotionPill>
                    )}
                  </Td>
                  <Td className="text-xs tabular">
                    {c.deliveredStories}/{c.metaStories}
                    {c.statusStories && (
                      <NotionPill kind="status" className="ml-1">
                        {c.statusStories}
                      </NotionPill>
                    )}
                  </Td>
                  <Td className="text-xs tabular">
                    {c.deliveredTiktok}/{c.metaTiktok}
                    {c.statusTiktok && (
                      <NotionPill kind="status" className="ml-1">
                        {c.statusTiktok}
                      </NotionPill>
                    )}
                  </Td>
                  <Td className="text-xs tabular">
                    {c.deliveredYoutube}/{c.metaYoutube}
                    {c.statusYoutube && (
                      <NotionPill kind="status" className="ml-1">
                        {c.statusYoutube}
                      </NotionPill>
                    )}
                  </Td>
                  <Td>
                    {c.proofsLink ? (
                      <a
                        href={c.proofsLink}
                        target="_blank"
                        rel="noreferrer"
                        className="inline-flex items-center gap-1 text-xs text-primary hover:underline"
                        onClick={(e) => e.stopPropagation()}
                      >
                        Abrir <ExternalLink className="h-3 w-3" />
                      </a>
                    ) : (
                      "—"
                    )}
                  </Td>
                </TableRow>
              ))}
            </tbody>
          </TableShell>
        )}
      </Card>

      {p?.modality === "Remuneração" && (
        <Card title="Financeiro mês a mês">
          {profile.monthlyFinances.length === 0 ? (
            <p className="text-sm text-muted-foreground">Nenhum registro financeiro.</p>
          ) : (
            <TableShell>
              <TableHead>
                <TableRow>
                  <Th>Mês</Th>
                  <Th>Status</Th>
                  <Th>%</Th>
                  <Th>Acordado</Th>
                  <Th>A pagar</Th>
                  <Th>Termo</Th>
                  <Th>Ação</Th>
                </TableRow>
              </TableHead>
              <tbody>
                {profile.monthlyFinances.map((f) => (
                  <TableRow key={f.id}>
                    <Td className="font-medium capitalize">{formatMonthRefLong(f.monthRef)}</Td>
                    <Td>
                      <NotionPill kind="payment">{f.paymentStatus}</NotionPill>
                    </Td>
                    <Td className="tabular">{f.pctDelivered.toFixed(0)}%</Td>
                    <Td className="tabular">{formatMoney(f.agreedValue)}</Td>
                    <Td className="tabular font-medium">{formatMoney(f.amountDue)}</Td>
                    <Td>
                      {f.termLink ? (
                        <a
                          href={f.termLink}
                          target="_blank"
                          rel="noreferrer"
                          className="text-xs text-primary hover:underline"
                        >
                          PDF
                        </a>
                      ) : (
                        "—"
                      )}
                    </Td>
                    <Td>
                      <select
                        className="max-w-[12rem] rounded-md border border-hairline bg-canvas px-2 py-1 text-xs"
                        defaultValue=""
                        disabled={!!financeLoading?.startsWith(f.id)}
                        onChange={(e) => {
                          const action = e.target.value;
                          if (!action) return;
                          if (FINANCE_EMAIL_ACTIONS.has(action)) {
                            requestFinanceEmail(f.id, action);
                          } else {
                            runFinanceAction(f.id, action);
                          }
                          e.target.value = "";
                        }}
                      >
                        <option value="">Ação…</option>
                        {FINANCE_ACTIONS.map((a) => (
                          <option key={a} value={a}>
                            {a}
                          </option>
                        ))}
                      </select>
                    </Td>
                  </TableRow>
                ))}
              </tbody>
            </TableShell>
          )}
        </Card>
      )}

      {profile.deliveries.length > 0 && (
        <Card title="Entregas individuais">
          <TableShell>
            <TableHead>
              <TableRow>
                <Th>Data</Th>
                <Th>Tipo</Th>
                <Th>Campanha</Th>
                <Th>Link</Th>
              </TableRow>
            </TableHead>
            <tbody>
              {profile.deliveries.map((d) => (
                <TableRow key={d.id}>
                  <Td>{formatDate(d.postedAt)}</Td>
                  <Td>{d.deliveryType || "—"}</Td>
                  <Td>{d.campaignName || "—"}</Td>
                  <Td>
                    {d.postLink ? (
                      <a
                        href={d.postLink}
                        target="_blank"
                        rel="noreferrer"
                        className="text-xs text-primary hover:underline"
                      >
                        Ver post
                      </a>
                    ) : (
                      "—"
                    )}
                  </Td>
                </TableRow>
              ))}
            </tbody>
          </TableShell>
        </Card>
      )}

      <Card title="Enviar e-mail">
        <div className="flex items-center gap-2 text-sm text-muted-foreground">
          <Mail className="h-4 w-4" />
          Para: {profile.email || "—"}
        </div>

        <div className="mt-4 space-y-3">
          <Select value={emailAction} onChange={(e) => setEmailAction(e.target.value)}>
            {filteredEmailActions.map((a) => (
              <option key={a} value={a}>
                {a}
              </option>
            ))}
          </Select>

          {!isCancelAction && !isCollabEmailAction && (
            <Input
              placeholder="Nome do curso"
              value={courseName}
              onChange={(e) => setCourseName(e.target.value)}
            />
          )}
          {!isCollabEmailAction && (
            <Input placeholder="Cupom" value={couponCode} onChange={(e) => setCouponCode(e.target.value)} />
          )}

          {isCollabEmailAction && (
            <>
              <Input
                placeholder="Nome da campanha"
                value={campaignName}
                onChange={(e) => setCampaignName(e.target.value)}
              />
              <Input
                placeholder="Link do briefing (/p/slug ou URL completa)"
                value={briefingUrl}
                onChange={(e) => setBriefingUrl(e.target.value)}
              />
              <Input
                placeholder="Prazo (ex.: 5 de junho)"
                value={dueDateDisplay}
                onChange={(e) => setDueDateDisplay(e.target.value)}
              />
              <textarea
                className="min-h-[80px] w-full rounded-md border border-hairline bg-canvas px-3 py-2 text-sm"
                placeholder="O que pedimos no vídeo"
                value={videoConcept}
                onChange={(e) => setVideoConcept(e.target.value)}
              />
            </>
          )}

          {isCancelAction && (
            <div>
              <label className="mb-1 block text-xs font-medium text-muted-foreground">
                Mês de encerramento
              </label>
              <Input
                type="month"
                value={cancellationMonthRef}
                onChange={(e) => setCancellationMonthRef(e.target.value)}
              />
              <p className="mt-1 text-xs text-muted-foreground">
                Aparece no e-mail de cancelamento e define o encerramento nos relatórios.
              </p>
            </div>
          )}

          {!isCancelAction && !isCollabEmailAction && (
            <Input
              type="date"
              value={releaseDate}
              onChange={(e) => setReleaseDate(e.target.value)}
            />
          )}

          <div className="flex gap-2">
            <Button variant="secondary" onClick={previewEmail}>
              Preview
            </Button>
            <Button onClick={handleSendClick} disabled={emailSending || !profile.email}>
              {emailSending ? <Loader2 className="h-4 w-4 animate-spin" /> : "Enviar"}
            </Button>
          </div>
        </div>
      </Card>

      {profile.emailLogs.length > 0 && (
        <Card title="Histórico de e-mails">
          <TableShell>
            <TableHead>
              <TableRow>
                <Th>Data</Th>
                <Th>Tipo</Th>
                <Th>Assunto</Th>
                <Th>Status</Th>
              </TableRow>
            </TableHead>
            <tbody>
              {profile.emailLogs.map((e) => (
                <TableRow key={e.id}>
                  <Td className="text-xs">{formatDate(e.sentAt || e.createdAt)}</Td>
                  <Td className="text-xs">{e.emailType}</Td>
                  <Td className="max-w-xs truncate text-xs">{e.subject || "—"}</Td>
                  <Td>
                    <NotionPill kind="status">{e.status}</NotionPill>
                  </Td>
                </TableRow>
              ))}
            </tbody>
          </TableShell>
        </Card>
      )}

      <AmbassadorMonthDeliveriesModal
        open={!!monthDeliveriesModal}
        ambassadorId={ambassadorId}
        monthRef={monthDeliveriesModal}
        onClose={() => setMonthDeliveriesModal(null)}
        onUpdated={load}
      />

      <EmailPreviewModal
        open={previewOpen}
        onClose={() => setPreviewOpen(false)}
        subject={previewSubject}
        html={previewHtml}
      />

      <ParceriaCancelamentoModal
        open={cancelModalOpen}
        ambassadorName={profile.fullName}
        initialMonthRef={cancellationMonthRef}
        saving={emailSending}
        onClose={() => setCancelModalOpen(false)}
        onConfirm={async (data) => {
          setEmailSending(true);
          await sendEmail(data);
          setEmailSending(false);
        }}
      />

      <FinanceEmailModal
        open={!!financeEmailModal}
        action={financeEmailModal?.action || ""}
        subject={financeEmailModal?.subject || ""}
        html={financeEmailModal?.html || ""}
        recipient={financeEmailModal?.recipient || ""}
        termLink={financeEmailModal?.termLink}
        sending={!!financeLoading?.endsWith("send")}
        onClose={() => setFinanceEmailModal(null)}
        onSend={confirmFinanceEmail}
      />

      <QuickNotesFloatingPanel
        ambassadorId={profile.id}
        ambassadorName={profile.fullName}
        notes={profile.quickNotes ?? []}
        onReload={load}
      />
    </div>
  );
}
