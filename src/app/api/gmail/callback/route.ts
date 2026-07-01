import { exchangeGmailCode } from "@/lib/gmail-oauth";

/** Callback OAuth Gmail — exibe refresh token para colar na Vercel. */
export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const code = searchParams.get("code");
  const error = searchParams.get("error");

  if (error) {
    return htmlPage("Erro na autorização", `<p>Google retornou: <strong>${error}</strong></p>`);
  }

  if (!code) {
    return htmlPage("Código ausente", "<p>Tente novamente em <a href='/emails'>/emails</a>.</p>");
  }

  try {
    const tokens = await exchangeGmailCode(code);
    if (!tokens.refresh_token) {
      return htmlPage(
        "Sem refresh token",
        `<p>O Google não devolveu refresh_token. Revogue o acesso em <a href='https://myaccount.google.com/permissions'>myaccount.google.com/permissions</a> e tente de novo com <strong>prompt=consent</strong>.</p>`
      );
    }

    const token = tokens.refresh_token;
    const body = `
      <p>Conta autorizada. Cole o valor abaixo em:</p>
      <ul>
        <li><code>.env</code> local → <code>GMAIL_REFRESH_TOKEN</code></li>
        <li>Vercel → Settings → Environment Variables → <code>GMAIL_REFRESH_TOKEN</code></li>
      </ul>
      <textarea readonly style="width:100%;height:120px;font-family:monospace;font-size:12px">${token}</textarea>
      <p>Depois rode <code>npm run test:gmail</code> ou redeploy na Vercel.</p>
      <p><a href="/emails">Voltar para E-mails</a></p>
    `;
    return htmlPage("Gmail conectado (cx@)", body);
  } catch (e) {
    return htmlPage("Falha", `<p>${String(e)}</p>`);
  }
}

function htmlPage(title: string, body: string) {
  const html = `<!DOCTYPE html><html lang="pt"><head><meta charset="utf-8"><title>${title}</title>
  <style>body{font-family:system-ui;max-width:640px;margin:40px auto;padding:0 16px;line-height:1.5}
  code{background:#f4f4f5;padding:2px 6px;border-radius:4px}</style></head>
  <body><h1>${title}</h1>${body}</body></html>`;
  return new Response(html, { headers: { "Content-Type": "text/html; charset=utf-8" } });
}
