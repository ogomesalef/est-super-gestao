import { VERTICAL_CONFIG } from "@/lib/constants";

function formatMoneyLocal(value: number): string {
  return (
    "R$ " +
    value
      .toFixed(2)
      .replace(".", ",")
      .replace(/\B(?=(\d{3})+(?!\d))/g, ".")
  );
}

type VerticalTheme = {
  accent: string;
  accentDark: string;
  tableBorder: string;
  tableHeaderBg: string;
  highlightBg: string;
  brand: string;
  verticalDisplay: string;
  verticalFull: string;
  catalog: string;
  plataforma: string;
  cupomForm: string;
  handle: string;
  site: string;
  instagram: string;
  tiktok: string;
  youtube: string;
  blog: string;
  youtubeLabel: string;
};

const THEMES: Record<string, VerticalTheme> = {
  OAB: {
    accent: "#6B0A09",
    accentDark: "#5a0808",
    tableBorder: "#e8b4b4",
    tableHeaderBg: "#f9e0e0",
    highlightBg: "#fff8f8",
    brand: "Estratégia OAB",
    verticalDisplay: "OAB",
    verticalFull: "Programa Super Embaixador OAB",
    catalog: "https://oab.estrategia.com",
    plataforma: "https://oab.estrategia.com/todos-os-cursos",
    cupomForm: "https://estrategiaeducacional.typeform.com/embaixadoresoab",
    handle: "@estrategiaoab",
    site: "https://oab.estrategia.com",
    instagram: "https://www.instagram.com/estrategiaoab/",
    tiktok: "https://www.tiktok.com/@estrategiaoab",
    youtube: "https://www.youtube.com/@EstrategiaOAB",
    blog: "https://oab.estrategia.com/portal",
    youtubeLabel: "Estratégia OAB",
  },
  ECJ: {
    accent: "#D08C00",
    accentDark: "#7a5200",
    tableBorder: "#f0d88a",
    tableHeaderBg: "#fff3cc",
    highlightBg: "#fffbf0",
    brand: "Estratégia Carreira Jurídica",
    verticalDisplay: "Carreira Jurídica",
    verticalFull: "Programa Super Embaixador Carreira Jurídica",
    catalog: "https://cj.estrategia.com",
    plataforma: "https://cj.estrategia.com/todos-os-cursos",
    cupomForm: "https://forms.gle/FkUgVntiSHN47pti9",
    handle: "@estrategiacarreirajuridica",
    site: "https://cj.estrategia.com",
    instagram: "https://www.instagram.com/estrategiacarreirajuridica/",
    tiktok: "https://www.tiktok.com/@estratcarreirajuridica",
    youtube: "https://www.youtube.com/@EstratégiaCarreiraJurídica",
    blog: "https://cj.estrategia.com/portal",
    youtubeLabel: "Estratégia Carreira Jurídica",
  },
};

function esc(v: unknown): string {
  return String(v ?? "")
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;");
}

function toInt(v: unknown): number {
  const s = String(v ?? "").trim();
  if (!s) return 0;
  const m = s.replace(",", ".").match(/-?\d+(\.\d+)?/);
  if (!m) return 0;
  const n = Number(m[0]);
  return !isFinite(n) || n <= 0 ? 0 : Math.floor(n);
}

function parseMoneyNumber(v: unknown): number {
  if (typeof v === "number" && isFinite(v) && v > 0) return v;
  const s = String(v || "")
    .replace(/[R$\s]/g, "")
    .replace(/\./g, "")
    .replace(",", ".");
  const n = parseFloat(s);
  return isNaN(n) || n <= 0 ? 0 : n;
}

function commission(total: number): number {
  const tier = 10000;
  if (total <= tier) return total * 0.2;
  return tier * 0.2 + (total - tier) * 0.15;
}

function obsBlock(text: string, accent: string): string {
  return `
    <div style="margin-top:12px;padding:12px;border-left:4px solid ${accent};background:#ffffff;border-radius:0 10px 10px 0;border-top:1px solid #eef2f7;border-right:1px solid #eef2f7;border-bottom:1px solid #eef2f7;">
      <div style="font-family:Arial,Helvetica,sans-serif;font-size:13px;line-height:1.6;color:#344054;">${text}</div>
    </div>`;
}

function rowHtml(label: string, value: string): string {
  return `
    <tr>
      <td style="font-family:Arial,Helvetica,sans-serif;font-size:14px;color:#344054;padding:6px 0;">${label}</td>
      <td align="right" style="font-family:Arial,Helvetica,sans-serif;font-size:14px;color:#111827;font-weight:700;padding:6px 0;">${value}</td>
    </tr>`;
}

export function getVerticalTheme(program: string): VerticalTheme {
  return THEMES[program === "ECJ" ? "ECJ" : "OAB"];
}

export function buildPropostaIncludedBlock(opts: {
  program: string;
  courseName?: string;
  courseDescription?: string;
  courseUrl?: string;
  careerUrl?: string;
  productValue?: unknown;
}): string {
  const t = getVerticalTheme(opts.program);
  const name = String(opts.courseName || "").trim();
  const desc = String(opts.courseDescription || "").trim();
  const url = String(opts.courseUrl || "").trim();
  const career = String(opts.careerUrl || "").trim();
  const price = parseMoneyNumber(opts.productValue);

  let productBody = `Você recebe acesso completo a <strong>1 produto</strong> do ${esc(t.brand)}, para usar no seu dia a dia de estudos e como base para o seu conteúdo.`;

  if (name) {
    productBody += `<br/><br/>Nossa sugestão, com base no seu perfil, é <strong>${esc(name)}</strong>.`;
    if (desc) productBody += ` ${esc(desc)}`;
    if (url) {
      productBody += `<br/><br/>Para conferir todos os detalhes:<br/>
        <a href="${esc(url)}" style="color:${t.accent};text-decoration:none;font-weight:700;">${esc(url.replace(/^https?:\/\//, ""))}</a>`;
    }
    if (career) {
      productBody += `<br/><br/>Se preferir focar em um concurso específico:<br/>
        <a href="${esc(career)}" style="color:${t.accent};text-decoration:none;font-weight:700;">${esc(career.replace(/^https?:\/\//, ""))}</a>`;
    }
    productBody += `<br/><br/>Ou qualquer outro curso ou assinatura do catálogo:<br/>
      <a href="${t.catalog}" style="color:${t.accent};text-decoration:none;font-weight:700;">${t.catalog.replace(/^https?:\/\//, "")}</a>`;
  } else {
    productBody += `<br/><br/>
      <a href="${t.catalog}" style="color:${t.accent};text-decoration:none;font-weight:700;">Acessar catálogo de cursos</a>`;
  }

  const simRows = price
    ? [1, 4, 6]
        .map((n) => {
          const total = price * n;
          const com = commission(total);
          return `
            <tr>
              <td style="font-family:Arial,Helvetica,sans-serif;font-size:12px;color:#344054;padding:7px 10px;border-left:1px solid ${t.tableBorder};border-bottom:1px solid ${t.tableBorder};">${n} compra${n > 1 ? "s" : ""}</td>
              <td style="font-family:Arial,Helvetica,sans-serif;font-size:12px;color:#344054;padding:7px 10px;border-bottom:1px solid ${t.tableBorder};">${formatMoneyLocal(total)}</td>
              <td style="font-family:Arial,Helvetica,sans-serif;font-size:12px;font-weight:700;color:${t.accentDark};padding:7px 10px;border-right:1px solid ${t.tableBorder};border-bottom:1px solid ${t.tableBorder};">${formatMoneyLocal(com)}</td>
            </tr>`;
        })
        .join("")
    : "";

  const simIntro = price && name
    ? `Simulação considerando que o seu público usasse o cupom para comprar <strong>${esc(name)}</strong> (${formatMoneyLocal(price)}):`
    : price
      ? `Simulação considerando compras com o cupom (${formatMoneyLocal(price)} por compra):`
      : "";

  const simulation = simRows
    ? `
      <div style="margin-top:12px;">
        <div style="font-family:Arial,Helvetica,sans-serif;font-size:12px;color:#344054;margin-bottom:8px;">${simIntro}</div>
        <table role="presentation" width="100%" cellspacing="0" cellpadding="0">
          <tr>
            <td style="font-family:Arial,Helvetica,sans-serif;font-size:12px;font-weight:700;color:${t.accentDark};background:${t.tableHeaderBg};padding:7px 10px;border-radius:6px 0 0 0;border:1px solid ${t.tableBorder};">Compras com cupom</td>
            <td style="font-family:Arial,Helvetica,sans-serif;font-size:12px;font-weight:700;color:${t.accentDark};background:${t.tableHeaderBg};padding:7px 10px;border-top:1px solid ${t.tableBorder};border-bottom:1px solid ${t.tableBorder};">Total gerado</td>
            <td style="font-family:Arial,Helvetica,sans-serif;font-size:12px;font-weight:700;color:${t.accentDark};background:${t.tableHeaderBg};padding:7px 10px;border-radius:0 6px 0 0;border:1px solid ${t.tableBorder};">Sua comissão</td>
          </tr>
          ${simRows}
        </table>
        <div style="font-family:Arial,Helvetica,sans-serif;font-size:11px;color:#667085;margin-top:5px;line-height:1.4;">
          * A comissão da 6ª compra considera duas faixas: 20% até R$ 10.000 e 15% sobre o restante. O cupom é válido para todos os cursos do ${esc(t.brand)}. Os valores reais variam conforme o produto utilizado.
        </div>
      </div>`
    : "";

  return `
    <div style="margin-top:18px;padding:16px;border:1px solid #e6eaf2;border-radius:12px;background:#fbfcff;">
      <div style="font-family:Arial,Helvetica,sans-serif;font-size:14px;font-weight:700;color:#111827;margin-bottom:12px;">
        O que está incluído na proposta
      </div>
      <div style="padding:14px;border-radius:10px;background:#ffffff;border:1px solid #eef2f7;border-left:4px solid ${t.accent};">
        <div style="font-family:Arial,Helvetica,sans-serif;font-size:13px;font-weight:700;color:${t.accent};margin-bottom:6px;">Acesso a um curso da plataforma</div>
        <div style="font-family:Arial,Helvetica,sans-serif;font-size:13px;color:#344054;line-height:1.55;">${productBody}</div>
      </div>
      <div style="margin-top:10px;padding:14px;border-radius:10px;background:#ffffff;border:1px solid #eef2f7;border-left:4px solid ${t.accent};">
        <div style="font-family:Arial,Helvetica,sans-serif;font-size:13px;font-weight:700;color:${t.accent};margin-bottom:6px;">Cupom personalizado</div>
        <div style="font-family:Arial,Helvetica,sans-serif;font-size:13px;color:#344054;line-height:1.55;">
          Você terá um cupom com o seu nome, válido para todos os cursos e assinaturas do ${esc(t.brand)}.
          <br/><br/>
          A ideia é simples: você usa a plataforma, fala sobre ela no seu conteúdo do jeito que faz sentido pra você, e compartilha o cupom com o seu público. Quem quiser comprar usando o seu cupom ganha <strong>10% de desconto</strong>, e você recebe <strong>até 20% de comissão</strong> sobre cada compra feita com ele.
        </div>
        <div style="margin-top:12px;padding:12px;border-radius:8px;background:#f8fafc;border:1px solid #eef2f7;">
          <div style="font-family:Arial,Helvetica,sans-serif;font-size:12px;font-weight:700;color:#111827;margin-bottom:6px;">Como funciona a comissão</div>
          <div style="font-family:Arial,Helvetica,sans-serif;font-size:12px;line-height:1.6;color:#344054;">
            Calculada por faixas sobre o total de compras feitas com o seu cupom no mês:
            <ul style="margin:6px 0 0 14px;padding:0;color:#344054;">
              <li style="margin:3px 0;">Até R$ 10.000 no mês: <strong>20%</strong></li>
              <li style="margin:3px 0;">O que ultrapassar R$ 10.000: <strong>15%</strong></li>
            </ul>
            <div style="margin-top:5px;font-size:11px;color:#667085;">Cada faixa é calculada separadamente, como um sistema de degraus.</div>
          </div>
        </div>
        ${simulation}
      </div>
    </div>`;
}

function buildSobreConteudoBlock(networks: { feed: number; stories: number; tk: number; yt: number }): string {
  const parts = ["stories", "reels e publicações no feed"];
  if (networks.tk > 0) parts.push("TikTok");
  return `
    <div style="margin-top:12px;padding:12px;border-radius:10px;background:#ffffff;border:1px solid #eef2f7;">
      <div style="font-family:Arial,Helvetica,sans-serif;font-size:13px;font-weight:700;color:#111827;margin-bottom:6px;">Sobre o conteúdo</div>
      <div style="font-family:Arial,Helvetica,sans-serif;font-size:13px;line-height:1.55;color:#344054;">
        A ideia é manter constância nas redes, principalmente em ${parts.slice(0, 2).join(", ")}, mostrando sua rotina de estudos e incluindo o Estratégia de forma natural: usando a plataforma, falando sobre o curso que recebeu, ou compartilhando recursos, eventos e campanhas vigentes.
      </div>
    </div>`;
}

function buildNetworkBlocks(
  feed: number,
  stories: number,
  tk: number,
  yt: number,
  opts?: { tiktokReelsNote?: boolean }
): string {
  let html = "";
  const igRows: string[] = [];
  if (feed > 0) igRows.push(rowHtml("Feed/Reels:", `${feed} / semana`));
  if (stories > 0) {
    igRows.push(rowHtml("Sequências de stories (link):", `${stories} seq. / semana`));
    igRows.push(`<tr><td colspan="2" style="font-family:Arial,Helvetica,sans-serif;font-size:12px;color:#667085;padding:2px 0 6px;line-height:1.4;">Cada sequência é composta por 3 stories consecutivos com link</td></tr>`);
  }
  if (igRows.length) {
    html += `
      <div style="margin-top:10px;padding:12px;border-radius:10px;background:#ffffff;border:1px solid #eef2f7;">
        <div style="font-family:Arial,Helvetica,sans-serif;font-size:14px;font-weight:700;color:#111827;">Instagram</div>
        <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="margin-top:8px;">${igRows.join("")}</table>
      </div>`;
  }
  if (tk > 0) {
    const note = opts?.tiktokReelsNote
      ? `<tr><td colspan="2" style="font-family:Arial,Helvetica,sans-serif;font-size:12px;color:#667085;padding:2px 0 6px;line-height:1.4;">O mesmo vídeo do Reels pode ser republicado no TikTok</td></tr>`
      : "";
    html += `
      <div style="margin-top:10px;padding:12px;border-radius:10px;background:#ffffff;border:1px solid #eef2f7;">
        <div style="font-family:Arial,Helvetica,sans-serif;font-size:14px;font-weight:700;color:#111827;">TikTok</div>
        <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="margin-top:8px;">
          ${rowHtml("Vídeos:", `${tk} / semana`)}
          ${note}
        </table>
      </div>`;
  }
  if (yt > 0) {
    html += `
      <div style="margin-top:10px;padding:12px;border-radius:10px;background:#ffffff;border:1px solid #eef2f7;">
        <div style="font-family:Arial,Helvetica,sans-serif;font-size:14px;font-weight:700;color:#111827;">YouTube</div>
        <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="margin-top:8px;">
          ${rowHtml("Vídeos:", `${yt} / semana`)}
        </table>
      </div>`;
  }
  return html;
}

export function buildPropostaEntregasBlock(opts: {
  program: string;
  feed: string | number;
  stories: string | number;
  tiktok: string | number;
  youtube: string | number;
}): string {
  const t = getVerticalTheme(opts.program);
  const feed = toInt(opts.feed);
  const stories = toInt(opts.stories);
  const tk = toInt(opts.tiktok);
  const yt = toInt(opts.youtube);
  if (!feed && !stories && !tk && !yt) return "";

  const networks = buildNetworkBlocks(feed, stories, tk, yt);
  const storiesObs =
    stories > 0
      ? obsBlock(
          "Nos conteúdos com link, a orientação é direcionar o público para páginas oficiais da marca, como páginas de assinatura, cursos ou campanhas vigentes.",
          t.accent
        )
      : "";

  return `
    <div style="margin-top:18px;padding:16px;border:1px solid #e6eaf2;border-radius:12px;background:#fbfcff;">
      <div style="font-family:Arial,Helvetica,sans-serif;font-size:14px;font-weight:700;color:#111827;margin-bottom:10px;">Entregas semanais</div>
      <div style="font-family:Arial,Helvetica,sans-serif;font-size:14px;line-height:1.6;color:#344054;">
        As entregas são avaliadas mensalmente para manutenção da parceria.
      </div>
      ${buildSobreConteudoBlock({ feed, stories, tk, yt })}
      ${networks}
      ${storiesObs}
    </div>`;
}

export function buildPropostaPassosBlock(program: string): string {
  const t = getVerticalTheme(program);
  return `
    <div style="margin-top:18px;padding:16px;border:1px solid #e6eaf2;border-radius:12px;background:#fbfcff;">
      <div style="font-family:Arial,Helvetica,sans-serif;font-size:14px;font-weight:700;color:#111827;margin-bottom:10px;">Aceita a proposta? Veja o que fazer</div>
      <div style="font-family:Arial,Helvetica,sans-serif;font-size:14px;line-height:1.6;color:#344054;">Se esse modelo fizer sentido pra você, siga os passos abaixo.</div>
      <div style="margin-top:14px;padding:14px;border-radius:10px;background:#ffffff;border:1px solid #eef2f7;border-left:4px solid ${t.accent};">
        <div style="font-family:Arial,Helvetica,sans-serif;font-size:13px;font-weight:700;color:${t.accent};margin-bottom:4px;">1. Crie sua conta na plataforma</div>
        <div style="font-family:Arial,Helvetica,sans-serif;font-size:13px;color:#344054;line-height:1.55;">
          Se ainda não tem cadastro, acesse o link abaixo e crie sua conta. Se já tiver, pode seguir para o próximo passo.
          <br/><br/><a href="https://perfil.estrategia.com/login" style="color:${t.accent};text-decoration:none;font-weight:700;">perfil.estrategia.com/login</a>
        </div>
      </div>
      <div style="margin-top:10px;padding:14px;border-radius:10px;background:#ffffff;border:1px solid #eef2f7;border-left:4px solid ${t.accent};">
        <div style="font-family:Arial,Helvetica,sans-serif;font-size:13px;font-weight:700;color:${t.accent};margin-bottom:4px;">2. Preencha o formulário de cadastro do cupom</div>
        <div style="font-family:Arial,Helvetica,sans-serif;font-size:13px;color:#344054;line-height:1.55;">
          No formulário, você vai escolher o nome do seu cupom e informar seus dados para recebimento da comissão.
          <br/><br/><a href="${t.cupomForm}" style="color:${t.accent};text-decoration:none;font-weight:700;">Acessar formulário de cadastro</a>
        </div>
      </div>
      <div style="margin-top:10px;padding:16px;border:2px solid ${t.accent};border-radius:10px;background:${t.highlightBg};">
        <div style="font-family:Arial,Helvetica,sans-serif;font-size:13px;font-weight:700;color:${t.accent};margin-bottom:10px;">3. Responda este e-mail com as informações abaixo</div>
        <table role="presentation" width="100%" cellspacing="0" cellpadding="0">
          <tr><td style="padding:10px 12px;border-radius:8px 8px 0 0;background:#ffffff;border:1px solid ${t.tableBorder};font-family:Arial,Helvetica,sans-serif;font-size:13px;color:#344054;"><strong style="color:${t.accent};">1.</strong> O e-mail que você usou no cadastro da plataforma</td></tr>
          <tr><td style="padding:10px 12px;background:#ffffff;border-left:1px solid ${t.tableBorder};border-right:1px solid ${t.tableBorder};border-bottom:1px solid ${t.tableBorder};font-family:Arial,Helvetica,sans-serif;font-size:13px;color:#344054;"><strong style="color:${t.accent};">2.</strong> O curso ou assinatura que você deseja receber</td></tr>
          <tr><td style="padding:10px 12px;border-radius:0 0 8px 8px;background:#ffffff;border-left:1px solid ${t.tableBorder};border-right:1px solid ${t.tableBorder};border-bottom:1px solid ${t.tableBorder};font-family:Arial,Helvetica,sans-serif;font-size:13px;color:#344054;"><strong style="color:${t.accent};">3.</strong> O nome do cupom que você escolheu no formulário</td></tr>
        </table>
        <div style="margin-top:12px;font-family:Arial,Helvetica,sans-serif;font-size:13px;color:#344054;line-height:1.6;">
          Assim que recebermos, vamos liberar seu acesso e formalizar tudo em até <strong>3 dias úteis</strong>.
        </div>
      </div>
    </div>`;
}

export function buildPropostaRodapeBlock(program: string): string {
  const cfg = VERTICAL_CONFIG[program === "ECJ" ? "ECJ" : "OAB"];
  return `
    <div style="margin-top:14px;font-family:Arial,Helvetica,sans-serif;font-size:13px;color:#667085;line-height:1.6;padding:0 2px;">
      Quer ajustar algum ponto antes de confirmar? É só responder este e-mail, estamos abertos para conversar.
      <br/><br/>
      Obs.: durante a parceria, pedimos que a identificação <strong>Embaixador(a) ${esc(cfg.handle)}</strong> esteja na bio das suas redes sociais.
    </div>`;
}

export function buildFormalizacaoAcessoBlock(opts: {
  program: string;
  courseName?: string;
  courseDate?: string;
}): string {
  const t = getVerticalTheme(opts.program);
  const course = String(opts.courseName || "Produto liberado").trim();
  const date = String(opts.courseDate || "").trim();
  return `
    <div style="margin-top:18px;padding:16px;border:1px solid #e6eaf2;border-radius:12px;background:#fbfcff;">
      <div style="font-family:Arial,Helvetica,sans-serif;font-size:14px;font-weight:700;color:#111827;margin-bottom:10px;">Acesso liberado</div>
      <div style="font-family:Arial,Helvetica,sans-serif;font-size:14px;line-height:1.6;color:#344054;">
        Seu acesso ao produto escolhido já foi liberado na plataforma. Recomendamos entrar e confirmar que está conseguindo visualizar o curso normalmente.
      </div>
      <div style="margin-top:12px;padding:12px;border-radius:10px;background:#ffffff;border:1px solid #eef2f7;">
        <div style="font-family:Arial,Helvetica,sans-serif;font-size:12px;color:#667085;margin-bottom:4px;">Produto liberado</div>
        <div style="font-family:Arial,Helvetica,sans-serif;font-size:14px;color:#111827;font-weight:700;line-height:1.4;">${esc(course)}</div>
        ${date ? `<div style="font-family:Arial,Helvetica,sans-serif;font-size:12px;color:#667085;margin-top:6px;">Data de liberação: <strong>${esc(date)}</strong></div>` : ""}
      </div>
      <table role="presentation" cellspacing="0" cellpadding="0" style="margin-top:12px;">
        <tr>
          <td style="border-radius:10px;background:${t.accent};">
            <a href="${t.plataforma}" style="display:inline-block;padding:12px 16px;font-family:Arial,Helvetica,sans-serif;font-size:14px;font-weight:700;color:#ffffff;text-decoration:none;border-radius:10px;">Acessar plataforma de estudos</a>
          </td>
        </tr>
      </table>
    </div>`;
}

export function buildFormalizacaoCupomBlock(opts: { program: string; couponCode?: string }): string {
  const t = getVerticalTheme(opts.program);
  const code = String(opts.couponCode || "—").trim();
  return `
    <div style="margin-top:18px;padding:16px;border:1px solid #e6eaf2;border-radius:12px;background:#fbfcff;">
      <div style="font-family:Arial,Helvetica,sans-serif;font-size:14px;font-weight:700;color:#111827;margin-bottom:10px;">Cupom ativo</div>
      <div style="font-family:Arial,Helvetica,sans-serif;font-size:14px;line-height:1.6;color:#344054;">Seu cupom já está <strong>ativo</strong> e pronto para divulgar.</div>
      <div style="margin-top:12px;padding:12px;border-radius:10px;background:#ffffff;border:1px solid #eef2f7;">
        <div style="font-family:Arial,Helvetica,sans-serif;font-size:12px;color:#667085;margin-bottom:4px;">Seu cupom</div>
        <div style="font-family:Arial,Helvetica,sans-serif;font-size:18px;color:${t.accent};font-weight:700;letter-spacing:1px;">${esc(code)}</div>
      </div>
      ${obsBlock("Aproveite para simular uma compra na plataforma e aplicar o seu cupom, assim você confirma que está tudo funcionando antes de divulgar para o seu público.", t.accent)}
      <div style="margin-top:12px;font-family:Arial,Helvetica,sans-serif;font-size:14px;line-height:1.6;color:#344054;">
        Com ele, seus seguidores ganham <strong>10% de desconto</strong> em qualquer produto do ${esc(t.brand)} e você recebe comissão sobre cada venda realizada.
        <br/><br/>
        Em breve, você também receberá <strong>um e-mail separado</strong> com:
        <ul style="margin:10px 0 0 18px;padding:0;color:#344054;">
          <li style="margin:6px 0;">link para acompanhar suas vendas e comissões;</li>
          <li style="margin:6px 0;">acesso ao grupo de embaixadores;</li>
          <li style="margin:6px 0;">drive com artes para divulgação.</li>
        </ul>
        <br/>Sempre que houver uma venda com o seu cupom, você será avisado automaticamente por e-mail.
      </div>
    </div>`;
}

export function buildFormalizacaoEntregasBlock(opts: {
  program: string;
  feed: string | number;
  stories: string | number;
  tiktok: string | number;
  youtube: string | number;
}): string {
  const t = getVerticalTheme(opts.program);
  const feed = toInt(opts.feed);
  const stories = toInt(opts.stories);
  const tk = toInt(opts.tiktok);
  const yt = toInt(opts.youtube);
  if (!feed && !stories && !tk && !yt) return "";

  const networks = buildNetworkBlocks(feed, stories, tk, yt, { tiktokReelsNote: feed > 0 && tk > 0 });
  const storiesObs =
    stories > 0
      ? obsBlock(
          "Nos conteúdos com link, a orientação é direcionar o público para páginas oficiais da marca, como páginas de assinatura, cursos ou campanhas vigentes.",
          t.accent
        )
      : "";
  const marcaObs = obsBlock(
    `Sempre que mencionar o Estratégia nos posts, marque o perfil <strong>${esc(t.handle)}</strong>. Isso ajuda a ampliar o alcance e mantém a parceria bem alinhada.`,
    t.accent
  );

  return `
    <div style="margin-top:18px;padding:16px;border:1px solid #e6eaf2;border-radius:12px;background:#fbfcff;">
      <div style="font-family:Arial,Helvetica,sans-serif;font-size:14px;font-weight:700;color:#111827;margin-bottom:10px;">Entregas semanais</div>
      <div style="font-family:Arial,Helvetica,sans-serif;font-size:14px;line-height:1.6;color:#344054;">As entregas são avaliadas mensalmente para manutenção da parceria.</div>
      ${buildSobreConteudoBlock({ feed, stories, tk, yt })}
      ${networks}
      ${storiesObs}
      ${marcaObs}
    </div>`;
}

export function buildPrimeiroPostBlock(program: string): string {
  const t = getVerticalTheme(program);
  return `
    <div style="margin-top:18px;padding:16px;border:1px solid #e6eaf2;border-radius:12px;background:#fbfcff;">
      <div style="font-family:Arial,Helvetica,sans-serif;font-size:14px;font-weight:700;color:#111827;margin-bottom:10px;">Primeiro post</div>
      <div style="font-family:Arial,Helvetica,sans-serif;font-size:14px;line-height:1.6;color:#344054;">
        Como pontapé inicial, que tal contar para o seu público essa novidade? Um post anunciando que você agora faz parte do ${esc(t.verticalFull)} é uma ótima forma de começar.
        <br/><br/>
        Pode ser no formato que você preferir: vídeo, reels, carrossel ou stories. O importante é que seja do seu jeito, com a sua cara. A gente fica feliz em ver esse primeiro conteúdo.
      </div>
    </div>`;
}

export function buildNossasRedesBlock(program: string): string {
  const t = getVerticalTheme(program);
  const rows = [
    ["🌐 Site", t.site, t.site.replace(/^https?:\/\//, "")],
    ["📸 Instagram", t.instagram, t.handle],
    ["🎵 TikTok", t.tiktok, t.handle === "@estrategiacarreirajuridica" ? "@estratcarreirajuridica" : t.handle],
    ["▶️ YouTube", t.youtube, t.youtubeLabel],
    ["📝 Blog", t.blog, t.blog.replace(/^https?:\/\//, "")],
  ];
  return `
    <div style="margin-top:18px;padding:16px;border:1px solid #e6eaf2;border-radius:12px;background:#fbfcff;">
      <div style="font-family:Arial,Helvetica,sans-serif;font-size:14px;font-weight:700;color:#111827;margin-bottom:10px;">Nossas redes</div>
      <div style="font-family:Arial,Helvetica,sans-serif;font-size:14px;line-height:1.6;color:#344054;margin-bottom:14px;">
        Acompanhe o ${esc(t.brand)} nas redes sociais para conhecer melhor a marca, se inspirar e ter referências na hora de criar conteúdo.
      </div>
      <table role="presentation" width="100%" cellspacing="0" cellpadding="0">
        ${rows
          .map(
            ([label, href, sub]) => `
          <tr><td style="padding:6px 0;">
            <a href="${href}" style="font-family:Arial,Helvetica,sans-serif;font-size:13px;color:${t.accent};text-decoration:none;font-weight:700;">${label}</a>
            <span style="font-family:Arial,Helvetica,sans-serif;font-size:13px;color:#667085;"> — ${esc(sub)}</span>
          </td></tr>`
          )
          .join("")}
      </table>
    </div>`;
}

export function buildBioFormalizacaoBlock(program: string): string {
  const cfg = VERTICAL_CONFIG[program === "ECJ" ? "ECJ" : "OAB"];
  const t = getVerticalTheme(program);
  return `
    <div style="margin-top:18px;padding:16px;border:1px solid #e6eaf2;border-radius:12px;background:#fbfcff;">
      <div style="font-family:Arial,Helvetica,sans-serif;font-size:14px;font-weight:700;color:#111827;margin-bottom:10px;">Identificação na bio</div>
      <div style="font-family:Arial,Helvetica,sans-serif;font-size:14px;line-height:1.6;color:#344054;">
        Enquanto você estiver no programa, mantenha na bio das suas redes a identificação abaixo. Ela sinaliza para o seu público que você é uma embaixadora oficial do ${esc(t.brand)} e faz parte de como a gente acompanha a parceria ativa.
        <div style="margin-top:10px;padding:10px 12px;border-radius:10px;background:#ffffff;border:1px solid #eef2f7;">
          <span style="font-family:Arial,Helvetica,sans-serif;font-size:14px;font-weight:700;color:#111827;">Embaixador(a) ${esc(cfg.handle)}</span>
        </div>
      </div>
    </div>`;
}

export function buildComprovacaoBlock(program: string): string {
  const t = getVerticalTheme(program);
  const form =
    "https://docs.google.com/forms/d/e/1FAIpQLScAfuntqtprs_jMG-WaxdIu-k4_9z_BGjKYxKV5rXaC6mUCcg/viewform";
  return `
    <div style="margin-top:18px;padding:16px;border:1px solid #f0c97a;border-radius:12px;background:#fffbf0;">
      <div style="font-family:Arial,Helvetica,sans-serif;font-size:14px;font-weight:700;color:#111827;margin-bottom:10px;">⚠️ Comprovação das entregas — obrigatório</div>
      <div style="font-family:Arial,Helvetica,sans-serif;font-size:14px;line-height:1.6;color:#344054;">
        Cada post precisa ser registrado no formulário de entregas. É por ele que a gente faz o acompanhamento e consegue manter a parceria ativa.
        <br/><br/>
        O ideal é registrar assim que o post for publicado. Se não conseguir na hora, faça o registro <strong>na mesma semana</strong>. Posts sem registro dentro do prazo não entram na contagem do mês.
        <br/><br/>O que registrar:
        <ul style="margin:10px 0 0 18px;padding:0;color:#344054;">
          <li style="margin:6px 0;">link do post publicado;</li>
          <li style="margin:6px 0;">print como comprovação, quando necessário.</li>
        </ul>
      </div>
      ${obsBlock("O registro das entregas é o que garante a manutenção da parceria. Sem comprovação, a entrega não é considerada.", t.accent)}
      <table role="presentation" cellspacing="0" cellpadding="0" style="margin-top:14px;">
        <tr>
          <td style="border-radius:10px;background:${t.accent};">
            <a href="${form}" style="display:inline-block;padding:12px 16px;font-family:Arial,Helvetica,sans-serif;font-size:14px;font-weight:700;color:#ffffff;text-decoration:none;border-radius:10px;">Abrir formulário de entregas</a>
          </td>
        </tr>
      </table>
    </div>`;
}
