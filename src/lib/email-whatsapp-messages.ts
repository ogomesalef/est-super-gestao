import { VERTICAL_CONFIG } from "@/lib/constants";
import { displayFirstName, type AmbassadorNameFields } from "@/lib/ambassador-name";
import { formatMesDisplay, formatMoney } from "@/lib/email-formatters";

const VERTICAL_LABEL: Record<string, string> = {
  OAB: "Estratégia OAB",
  ECJ: "Estratégia Carreira Jurídica",
};

function contactEmail(program: string): string {
  const cfg = VERTICAL_CONFIG[program as keyof typeof VERTICAL_CONFIG];
  return cfg?.emailFrom || "embaixadores@estrategia.com";
}

function brandLabel(program: string): string {
  return VERTICAL_LABEL[program] || `Estratégia ${program}`;
}

function formatMesLong(ym: string): string {
  const display = formatMesDisplay(ym);
  if (!display.includes("/")) return display;
  const [mes, ano] = display.split("/");
  return `${mes} de ${ano}`;
}

function computePrazoPagamentoLong(ym: string): string {
  if (!ym || !/^\d{4}-\d{2}$/.test(ym)) return "";
  let year = parseInt(ym.substring(0, 4), 10);
  let month = parseInt(ym.substring(5, 7), 10) + 1;
  if (month > 12) {
    month = 1;
    year++;
  }
  const nomes = [
    "janeiro",
    "fevereiro",
    "março",
    "abril",
    "maio",
    "junho",
    "julho",
    "agosto",
    "setembro",
    "outubro",
    "novembro",
    "dezembro",
  ];
  return `15 de ${nomes[month - 1]} de ${year}`;
}

export type WhatsAppMessageContext = AmbassadorNameFields & {
  program: string;
  action: string;
  couponCode?: string | null;
  modality?: string | null;
  campaignName?: string | null;
  briefingUrl?: string | null;
  dueDateDisplay?: string | null;
  monthRef?: string | null;
  amountDue?: number | null;
  mesEncerramento?: string | null;
};

/** @deprecated Use buildEmailWhatsAppMessage */
export function buildFormalizacaoInstagramMessage(opts: {
  fullName: string;
  socialName?: string | null;
  program: string;
  couponCode?: string | null;
  modality?: string | null;
}): string {
  return buildEmailWhatsAppMessage({
    fullName: opts.fullName,
    program: opts.program,
    action: opts.modality === "Remuneração"
      ? "Enviar formalização (Remuneração)"
      : "Enviar formalização (Assinatura + Cupom)",
    couponCode: opts.couponCode,
    modality: opts.modality,
  });
}

/** @deprecated Use buildEmailWhatsAppMessage */
export function buildFinancePagamentoWhatsAppMessage(opts: {
  fullName: string;
  socialName?: string | null;
  monthRef: string;
  amountDue?: number | null;
}): string {
  return buildEmailWhatsAppMessage({
    fullName: opts.fullName,
    program: "OAB",
    action: "Avisar embaixador: pagamento solicitado",
    monthRef: opts.monthRef,
    amountDue: opts.amountDue,
  });
}

export function buildEmailWhatsAppMessage(ctx: WhatsAppMessageContext): string {
  const name = displayFirstName(ctx);
  const brand = brandLabel(ctx.program);
  const email = contactEmail(ctx.program);
  const action = ctx.action;

  if (action === "Enviar proposta (Assinatura + Cupom)" || action === "Enviar proposta (Remuneração)") {
    return `${name}, acabei de te enviar por e-mail a proposta do Programa Super Embaixador ${brand}. Dá uma olhada e me conta o que achou! Qualquer dúvida estou por aqui ou no e-mail ${email}.`;
  }

  if (action === "Enviar lembrete de proposta") {
    return `${name}, passando para reforçar a proposta do Programa Super Embaixador ${brand} que te enviei por e-mail. Se tiver alguma dúvida ou quiser ajustar algo, me chama por aqui ou responde o e-mail ${email}!`;
  }

  if (action === "Enviar próximos passos (Assinatura + Cupom)") {
    return `${name}, te enviei por e-mail os próximos passos da parceria Super Embaixador ${brand}. Confere lá e me avisa se precisar de algo! Também estou à disposição no e-mail ${email}.`;
  }

  if (
    action === "Enviar formalização (Assinatura + Cupom)" ||
    action === "Enviar formalização (Remuneração)"
  ) {
    const cupom = String(ctx.couponCode || "").trim();
    const isAssinatura = ctx.modality !== "Remuneração";
    if (isAssinatura) {
      const cupomPart = cupom
        ? ` Seu acesso já foi liberado e o cupom ${cupom} já está ativo.`
        : " Seu acesso já foi liberado.";
      return `${name}, passando pra avisar que acabamos de enviar o e-mail de formalização da sua parceria com o ${brand}.${cupomPart} Dá uma olhadinha no e-mail e qualquer dúvida estou à disposição por aqui ou no e-mail ${email}!`;
    }
    return `${name}, passando pra avisar que acabamos de enviar o e-mail de formalização da sua parceria com o ${brand}. Dá uma olhadinha no e-mail e qualquer dúvida estou à disposição por aqui ou no e-mail ${email}!`;
  }

  if (action === "Enviar reprovação") {
    return `${name}, te enviei um e-mail com o retorno sobre sua candidatura ao Programa Super Embaixador ${brand}. Qualquer dúvida estou à disposição por aqui ou no e-mail ${email}.`;
  }

  if (action === "Enviar cancelamento de parceria") {
    const mes = ctx.mesEncerramento ? ` referente a ${ctx.mesEncerramento}` : "";
    return `${name}, te enviei um e-mail com informações sobre a atualização da nossa parceria${mes}. Qualquer dúvida estou à disposição por aqui ou no e-mail ${email}.`;
  }

  if (action === "Enviar pedido de vídeo (collab campanha)") {
    const campaign = String(ctx.campaignName || "").trim() || "da campanha";
    const briefing = String(ctx.briefingUrl || "").trim();
    const prazo = String(ctx.dueDateDisplay || "").trim();
    let msg = `${name}, te enviei o pedido de vídeo da campanha ${campaign}.`;
    if (briefing) msg += `\n\nTudo está no briefing: ${briefing}`;
    if (prazo) msg += `\n\nPrazo: ${prazo}`;
    msg += `\n\nQualquer dúvida estou por aqui ou no e-mail ${email}.`;
    return msg;
  }

  if (action === "Enviar fechamento do mês (com termo)") {
    const mes = ctx.monthRef ? formatMesLong(ctx.monthRef) : "do mês";
    return `${name}, te enviei por e-mail o fechamento de ${mes} da parceria Super Embaixador ${brand}, com o termo de parceria para assinatura. Confere lá e me avisa se tiver alguma dúvida! Também estou no e-mail ${email}.`;
  }

  if (action === "Enviar lembrete do termo") {
    const mes = ctx.monthRef ? formatMesLong(ctx.monthRef) : "do mês";
    return `${name}, passando para lembrar do termo de parceria referente ao fechamento de ${mes}. Já te enviei o e-mail com o link — quando assinar, é só responder por lá ou me avisar por aqui!`;
  }

  if (action === "Cobrar Form Financeiro") {
    return `${name}, te enviei um lembrete por e-mail para preencher o formulário financeiro e jurídico. Isso é necessário para processarmos seus pagamentos. Qualquer dúvida estou por aqui ou no e-mail ${email}.`;
  }

  if (action === "Enviar solicitação ao Financeiro" || action === "Reenviar solicitação ao Financeiro") {
    const mes = ctx.monthRef ? formatMesLong(ctx.monthRef) : "do mês";
    const valor = formatMoney(ctx.amountDue);
    const prazo = ctx.monthRef ? computePrazoPagamentoLong(ctx.monthRef) : "";
    return `Olá, ${name}!

O pagamento referente a ${mes} foi solicitado ao time financeiro.

Valor a receber: ${valor}

${prazo ? `O pagamento será processado até ${prazo}, de acordo com os dados bancários informados no cadastro financeiro e jurídico.` : "O pagamento será processado de acordo com os dados bancários informados no cadastro financeiro e jurídico."}

Em caso de divergência, o time financeiro entrará em contato através dos dados de WhatsApp ou e-mail informados no cadastro financeiro e jurídico.

Agradecemos a parceria em ${mes}!`;
  }

  if (action === "Avisar embaixador: pagamento solicitado") {
    const mes = ctx.monthRef ? formatMesLong(ctx.monthRef) : "do mês";
    const valor = formatMoney(ctx.amountDue);
    const prazo = ctx.monthRef ? computePrazoPagamentoLong(ctx.monthRef) : "";
    return `Olá, ${name}!

O pagamento referente a ${mes} foi solicitado ao time financeiro.

Valor a receber: ${valor}

${prazo ? `O pagamento será processado até ${prazo}, de acordo com os dados bancários informados no cadastro financeiro e jurídico.` : "O pagamento será processado de acordo com os dados bancários informados no cadastro financeiro e jurídico."}

Em caso de divergência, o time financeiro entrará em contato através dos dados de WhatsApp ou e-mail informados no cadastro financeiro e jurídico.

Agradecemos a parceria em ${mes}!`;
  }

  return `${name}, acabei de te enviar um e-mail do Programa Super Embaixador ${brand}. Dá uma olhada e qualquer dúvida estou por aqui ou no e-mail ${email}.`;
}
