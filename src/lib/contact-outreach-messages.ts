import { VERTICAL_CONFIG, type Vertical } from "./constants";

export function buildContactOutreachMessage(opts: {
  vertical: string;
  handle: string;
  kind: "first" | "followup";
}): string {
  const vertical = (opts.vertical === "ECJ" ? "ECJ" : "OAB") as Vertical;
  const cfg = VERTICAL_CONFIG[vertical];
  const handle = opts.handle.replace(/^@+/, "");
  const formUrl = cfg.cupomFormUrl;

  if (opts.kind === "followup") {
    return `Oi, @${handle}! Tudo bem? Passando para saber se você teve chance de ver minha mensagem sobre o Programa Super Embaixador ${vertical}. Se tiver interesse, o formulário de candidatura está aqui: ${formUrl}\n\nQualquer dúvida, estou por aqui!`;
  }

  return `Oi, @${handle}! Tudo bem? Sou da equipe Super Embaixadores ${vertical} (${cfg.handle}). Vi seu perfil e achei que você combina muito com o nosso programa de parceria.\n\nSe quiser saber mais, preenche o formulário por aqui: ${formUrl}\n\nQualquer dúvida, me chama!`;
}
