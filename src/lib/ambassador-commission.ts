export type CommissionTier = {
  /** Limite superior da faixa no mês (em reais). */
  upTo: number;
  rate: number;
  label: string;
};

export const AMBASSADOR_TERMO_URL = {
  OAB: "https://drive.google.com/file/d/145BjCgWTeFH_xm9EDjzOowTz8XOEO5Ls/view",
  ECJ: "https://drive.google.com/file/d/1SgJ-Cm74dV1SxEzd8xUNCrjzcE14mL3m/view",
} as const;

/** Faixas mensais do Termo de Adesão (ECJ 2026 / OAB 2026). */
export const AMBASSADOR_COMMISSION_TIERS: CommissionTier[] = [
  { upTo: 10_000, rate: 0.2, label: "Até R$ 10.000 no mês" },
  { upTo: 20_000, rate: 0.15, label: "De R$ 10.000,01 a R$ 20.000" },
  { upTo: 40_000, rate: 0.1, label: "De R$ 20.000,01 a R$ 40.000" },
  { upTo: 80_000, rate: 0.05, label: "De R$ 40.000,01 a R$ 80.000" },
  { upTo: 160_000, rate: 0.025, label: "De R$ 80.000,01 a R$ 160.000" },
  { upTo: Number.POSITIVE_INFINITY, rate: 0.0125, label: "Acima de R$ 160.000" },
];

export function commissionFromMonthlySales(total: number): number {
  if (!isFinite(total) || total <= 0) return 0;
  let prev = 0;
  let sum = 0;
  for (const tier of AMBASSADOR_COMMISSION_TIERS) {
    const capped = Math.min(total, tier.upTo);
    const bracket = capped - prev;
    if (bracket > 0) sum += bracket * tier.rate;
    if (total <= tier.upTo) break;
    prev = tier.upTo;
  }
  return sum;
}

export function formatCommissionRate(rate: number): string {
  const pct = rate * 100;
  return (pct % 1 === 0 ? pct.toFixed(0) : pct.toFixed(2).replace(".", ",")) + "%";
}

export function ambassadorTermUrl(program: string): string {
  return program === "ECJ" ? AMBASSADOR_TERMO_URL.ECJ : AMBASSADOR_TERMO_URL.OAB;
}
