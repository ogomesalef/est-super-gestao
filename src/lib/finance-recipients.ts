import { VERTICAL_CONFIG } from "@/lib/constants";

/** Destinatários oficiais do time financeiro (não sobrescrever via env). */
export const FINANCE_TEAM_TO = [
  "financeiro@estrategia.com",
  "fabio.almeida@estrategia.com",
] as const;

export const FINANCE_TEAM_CC = "heloisa.tondinelli@estrategia.com";

export const FINANCE_TEAM_TO_DISPLAY =
  "Financeiro Estratégia <financeiro@estrategia.com>, Fabio Almeida <fabio.almeida@estrategia.com>";

export const FINANCE_TEAM_CC_DISPLAY = "Heloísa Tondinelli <heloisa.tondinelli@estrategia.com>";

export function financeTeamToHeader(): string {
  return FINANCE_TEAM_TO.join(", ");
}

export function financeTeamCcHeader(): string {
  return FINANCE_TEAM_CC;
}

export function financeTeamShareEmails(): string[] {
  return [...FINANCE_TEAM_TO, FINANCE_TEAM_CC];
}

export function verticalFromDisplay(program: string): string {
  const key = program === "ECJ" ? "ECJ" : "OAB";
  const cfg = VERTICAL_CONFIG[key];
  const alias =
    key === "ECJ"
      ? process.env.GMAIL_FROM_ECJ || cfg.emailFrom
      : process.env.GMAIL_FROM_OAB || cfg.emailFrom;
  return `Programa Super Embaixadores <${alias}>`;
}
