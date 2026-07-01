const WORKSPACE_DOMAIN = "estrategiavestibulares.com.br";

function bridgeCandidateUrls(base: string): string[] {
  const urls = new Set<string>([base.trim()]);
  const match = base.match(/\/s\/([^/]+)\/exec/);
  if (match) {
    const id = match[1];
    urls.add(`https://script.google.com/macros/s/${id}/exec`);
    urls.add(`https://script.google.com/a/macros/${WORKSPACE_DOMAIN}/s/${id}/exec`);
  }
  return [...urls];
}

function parseBridgeError(text: string, status: number): string {
  if (text.trimStart().startsWith("<!DOCTYPE") || text.trimStart().startsWith("<html")) {
    if (status === 401 || status === 403) {
      return (
        "Web App bloqueado para acesso externo (401). No Apps Script: Implantar → editar implantação → " +
        "Quem tem acesso: Qualquer pessoa (não só a organização)."
      );
    }
    return "Web App retornou página HTML em vez de JSON — verifique a URL e o deploy.";
  }
  return text.slice(0, 300);
}

export async function sendViaAppsScriptBridge(payload: {
  action: string;
  ambassadorId?: string;
  financeId?: string;
  html?: string;
  subject?: string;
  to?: string;
  program?: string;
  cc?: string;
  campaignNames?: string;
}): Promise<{ ok: boolean; error?: string }> {
  const baseUrl = process.env.APPS_SCRIPT_BRIDGE_URL || process.env.APPS_SCRIPT_WEBAPP_URL;
  const secret = process.env.APPS_SCRIPT_SECRET || process.env.API_CONTACTS_SECRET;
  if (!baseUrl) {
    return { ok: false, error: "APPS_SCRIPT_BRIDGE_URL não configurada" };
  }
  if (!secret) {
    return { ok: false, error: "APPS_SCRIPT_SECRET não configurada" };
  }

  const body = JSON.stringify({ secret, ...payload });
  let lastError = "Falha ao contactar Apps Script";

  for (const url of bridgeCandidateUrls(baseUrl)) {
    try {
      const res = await fetch(url, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body,
        redirect: "follow",
      });
      const text = await res.text();

      let data: { ok?: boolean; error?: string } = {};
      try {
        data = JSON.parse(text) as { ok?: boolean; error?: string };
      } catch {
        lastError = parseBridgeError(text, res.status);
        continue;
      }

      if (res.ok && data.ok !== false) {
        return { ok: true };
      }
      lastError = data.error || parseBridgeError(text, res.status);
    } catch (e) {
      lastError = String(e);
    }
  }

  return { ok: false, error: lastError };
}

/** Testa conectividade da bridge (uso em scripts/diagnóstico). */
export async function pingAppsScriptBridge(): Promise<{ ok: boolean; error?: string }> {
  return sendViaAppsScriptBridge({ action: "ping" });
}
