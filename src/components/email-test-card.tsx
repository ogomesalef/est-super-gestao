"use client";

import { useEffect, useMemo, useState } from "react";
import { Eye, Loader2, Mail } from "lucide-react";
import { Button, Select } from "@/components/ui";
import { EmailPreviewModal } from "@/components/email-preview-modal";
import { SavedEmailInput, rememberTestEmail } from "@/components/saved-email-input";
import { useVertical } from "@/components/vertical-context";
import { EMAIL_ACTIONS, MODALITIES } from "@/lib/constants";
import { cn } from "@/lib/utils";
import { loadSavedTestEmails } from "@/lib/saved-test-emails";

const TEMPLATE_KEY = "super-gestao:test-email-template";
const MODALITY_KEY = "super-gestao:test-email-modality";

function filterActions(modality: string) {
  if (modality === "Remuneração") {
    return EMAIL_ACTIONS.filter((a) => a.includes("Remuneração") || a === "Enviar reprovação");
  }
  return EMAIL_ACTIONS.filter(
    (a) => a.includes("Assinatura + Cupom") || a === "Enviar reprovação"
  );
}

export function EmailTestCard() {
  const { vertical } = useVertical();
  const [email, setEmail] = useState("");
  const [modality, setModality] = useState<string>(MODALITIES[0]);
  const [action, setAction] = useState<string>(EMAIL_ACTIONS[0]);
  const [sending, setSending] = useState(false);
  const [previewing, setPreviewing] = useState(false);
  const [savedKey, setSavedKey] = useState(0);
  const [previewOpen, setPreviewOpen] = useState(false);
  const [subject, setSubject] = useState("");
  const [html, setHtml] = useState("");
  const [feedback, setFeedback] = useState<{ type: "ok" | "err"; text: string } | null>(null);

  const filteredActions = useMemo(() => filterActions(modality), [modality]);

  useEffect(() => {
    const saved = loadSavedTestEmails();
    if (saved[0]) setEmail(saved[0]);
    const savedModality = localStorage.getItem(MODALITY_KEY);
    if (savedModality && MODALITIES.includes(savedModality as (typeof MODALITIES)[number])) {
      setModality(savedModality);
    }
    const savedTemplate = localStorage.getItem(TEMPLATE_KEY);
    if (savedTemplate) setAction(savedTemplate);
  }, []);

  useEffect(() => {
    if (filteredActions.length && !filteredActions.includes(action as (typeof EMAIL_ACTIONS)[number])) {
      setAction(filteredActions[0]);
    }
  }, [filteredActions, action]);

  function persistPrefs(nextAction: string, nextModality: string) {
    localStorage.setItem(TEMPLATE_KEY, nextAction);
    localStorage.setItem(MODALITY_KEY, nextModality);
  }

  async function requestEmail(previewOnly: boolean) {
    const to = email.trim();
    if (!to) return null;

    const res = await fetch("/api/emails/test", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ to, program: vertical, modality, action, previewOnly }),
    });
    const data = await res.json();
    if (!res.ok || (!previewOnly && !data.ok)) {
      throw new Error(data.error || "Falha na requisição");
    }
    return data as { subject: string; html: string; action?: string; ok?: boolean };
  }

  async function preview() {
    setPreviewing(true);
    setFeedback(null);
    try {
      const data = await requestEmail(true);
      if (!data) return;
      setSubject(data.subject);
      setHtml(data.html);
      setPreviewOpen(true);
    } catch (e) {
      setFeedback({ type: "err", text: e instanceof Error ? e.message : "Erro ao gerar preview." });
    } finally {
      setPreviewing(false);
    }
  }

  async function sendTest() {
    const to = email.trim();
    if (!to) return;

    setSending(true);
    setFeedback(null);

    try {
      const data = await requestEmail(false);
      if (!data) return;

      rememberTestEmail(to);
      persistPrefs(action, modality);
      setSavedKey((k) => k + 1);
      setFeedback({
        type: "ok",
        text: `Enviado para ${to} — ${data.action || action}`,
      });
    } catch (e) {
      setFeedback({
        type: "err",
        text: e instanceof Error ? e.message : "Erro de rede ao enviar.",
      });
    } finally {
      setSending(false);
    }
  }

  return (
    <>
      <div
        className={cn(
          "mx-auto mb-4 max-w-lg space-y-3 rounded-xl border border-dashed bg-card/80 p-4 shadow-hairline",
          vertical === "OAB" ? "border-oab/20" : "border-ecj/25"
        )}
      >
        <div className="flex items-start gap-2">
          <div className="mt-0.5 rounded-md bg-surface p-1.5 text-muted-foreground">
            <Mail className="h-4 w-4" />
          </div>
          <div>
            <h3 className="text-sm font-medium text-ink">E-mail de teste</h3>
            <p className="text-xs text-muted-foreground">
              Escolha o template real ({vertical}). Dados de exemplo preenchidos automaticamente.
            </p>
          </div>
        </div>

        <SavedEmailInput
          value={email}
          onChange={setEmail}
          disabled={sending || previewing}
          refreshKey={savedKey}
        />

        <div className="grid gap-2 sm:grid-cols-2">
          <Select
            value={modality}
            onChange={(e) => {
              setModality(e.target.value);
              persistPrefs(action, e.target.value);
            }}
            disabled={sending || previewing}
          >
            {MODALITIES.map((m) => (
              <option key={m} value={m}>
                {m}
              </option>
            ))}
          </Select>

          <Select
            value={filteredActions.includes(action as (typeof EMAIL_ACTIONS)[number]) ? action : filteredActions[0]}
            onChange={(e) => {
              setAction(e.target.value);
              persistPrefs(e.target.value, modality);
            }}
            disabled={sending || previewing}
          >
            {filteredActions.map((a) => (
              <option key={a} value={a}>
                {a}
              </option>
            ))}
          </Select>
        </div>

        <div className="flex flex-wrap gap-2">
          <Button
            type="button"
            variant="secondary"
            onClick={preview}
            disabled={previewing || sending || !email.trim()}
          >
            {previewing ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <Eye className="h-4 w-4" />
            )}
            Preview
          </Button>
          <Button
            type="button"
            onClick={sendTest}
            disabled={sending || previewing || !email.trim()}
          >
            {sending ? (
              <>
                <Loader2 className="h-4 w-4 animate-spin" />
                Enviando…
              </>
            ) : (
              "Enviar teste"
            )}
          </Button>
        </div>

        <p className="text-[11px] leading-relaxed text-muted-foreground">
          Envio com prioridade alta, Reply-To do programa e versão em texto — mesmo padrão da planilha,
          para favorecer a aba Principal.
        </p>

        {feedback && (
          <p
            className={cn(
              "text-xs",
              feedback.type === "ok" ? "text-emerald-700" : "text-destructive"
            )}
          >
            {feedback.text}
          </p>
        )}
      </div>

      <EmailPreviewModal
        open={previewOpen}
        onClose={() => setPreviewOpen(false)}
        subject={subject}
        html={html}
      />
    </>
  );
}
