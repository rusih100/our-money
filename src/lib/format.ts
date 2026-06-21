/** Format a numeric amount with thin thousands separators and 2 decimals. */
export function formatAmount(n: number): string {
  if (Number.isNaN(n)) return "—";
  const sign = n < 0 ? "-" : n > 0 ? "+" : "";
  const abs = Math.abs(n).toLocaleString("ru-RU", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  });
  return `${sign}${abs}`;
}

/** Short date: take the date portion before any time component. */
export function shortDate(raw: string | undefined): string {
  if (!raw) return "";
  return raw.split(" ")[0] ?? raw;
}
