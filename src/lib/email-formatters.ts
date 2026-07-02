export function formatMoney(value: unknown): string {
  if (typeof value === "number" && isFinite(value)) {
    return (
      "R$ " +
      value
        .toFixed(2)
        .replace(".", ",")
        .replace(/\B(?=(\d{3})+(?!\d))/g, ".")
    );
  }
  const s = String(value || "")
    .replace(/[R$\s]/g, "")
    .replace(/\./g, "")
    .replace(",", ".");
  const n = parseFloat(s);
  if (isNaN(n)) return String(value || "");
  return (
    "R$ " +
    n
      .toFixed(2)
      .replace(".", ",")
      .replace(/\B(?=(\d{3})+(?!\d))/g, ".")
  );
}

export function formatPercent(value: unknown): string {
  if (value === null || value === undefined || value === "") return "—";
  if (typeof value === "number") {
    const pct = value <= 1 ? value * 100 : value;
    return pct.toFixed(2).replace(".", ",") + "%";
  }
  const s = String(value).replace("%", "").replace(",", ".").trim();
  const n = parseFloat(s);
  if (isNaN(n)) return String(value);
  const pct = n <= 1 ? n * 100 : n;
  return pct.toFixed(2).replace(".", ",") + "%";
}

export function formatMesDisplay(ym: string): string {
  if (!ym || !/^\d{4}-\d{2}$/.test(ym)) return String(ym || "");
  const nomes = [
    "",
    "Janeiro",
    "Fevereiro",
    "Março",
    "Abril",
    "Maio",
    "Junho",
    "Julho",
    "Agosto",
    "Setembro",
    "Outubro",
    "Novembro",
    "Dezembro",
  ];
  const year = parseInt(ym.substring(0, 4), 10);
  const month = parseInt(ym.substring(5, 7), 10);
  return (nomes[month] || ym) + "/" + year;
}
