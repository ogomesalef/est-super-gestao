import { VERTICAL_CONFIG } from "@/lib/constants";

export type EmailSender = {
  id: string;
  label: string;
  address: string;
  program?: "OAB" | "ECJ";
};

function envOr(value: string | undefined, fallback: string) {
  return value?.trim() || fallback;
}

/** Remetentes cadastrados para envio de e-mails do Super Embaixadores. */
export function getEmailSenders(): EmailSender[] {
  return [
    {
      id: "oab",
      label: "Super Embaixadores OAB",
      address: envOr(process.env.GMAIL_FROM_OAB, VERTICAL_CONFIG.OAB.emailFrom),
      program: "OAB",
    },
    {
      id: "ecj",
      label: "Super Embaixadores Carreira Jurídica",
      address: envOr(process.env.GMAIL_FROM_ECJ, VERTICAL_CONFIG.ECJ.emailFrom),
      program: "ECJ",
    },
    {
      id: "cx",
      label: "CX Estratégia Vestibulares",
      address: envOr(process.env.GMAIL_SENDER_EMAIL, "cx@estrategiavestibulares.com.br"),
    },
  ];
}

export function getEmailSenderById(id: string): EmailSender | undefined {
  return getEmailSenders().find((s) => s.id === id);
}

export function defaultSenderIdForProgram(program: string): string {
  return program === "ECJ" ? "ecj" : "oab";
}

export function formatFromHeader(sender: EmailSender): string {
  if (sender.id === "cx") return sender.address;
  return `Programa Super Embaixadores <${sender.address}>`;
}

export function resolveSenderFromDisplay(display: string): EmailSender | undefined {
  const normalized = display.trim().toLowerCase();
  return getEmailSenders().find(
    (s) =>
      formatFromHeader(s).toLowerCase() === normalized ||
      s.address.toLowerCase() === normalized ||
      normalized.includes(s.address.toLowerCase())
  );
}
