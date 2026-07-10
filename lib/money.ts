const SYMBOLS: Record<string, string> = {
  USD: "$",
  INR: "₹",
};

export function formatMoney(amount: number, currency: string) {
  const symbol = SYMBOLS[currency] ?? `${currency} `;
  return `${symbol}${amount.toLocaleString("en-US", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  })}`;
}

/** Sums amounts per currency, e.g. { USD: 120.5, INR: 4500 }. */
export function sumByCurrency(
  items: { amount: string; currency: string }[]
): Record<string, number> {
  const totals: Record<string, number> = {};
  for (const item of items) {
    const value = parseFloat(item.amount) || 0;
    const currency = item.currency || "USD";
    totals[currency] = (totals[currency] ?? 0) + value;
  }
  return totals;
}

export function formatCurrencyTotals(totals: Record<string, number>) {
  const entries = Object.entries(totals).filter(([, v]) => v !== 0);
  if (entries.length === 0) return formatMoney(0, "USD");
  return entries.map(([currency, value]) => formatMoney(value, currency)).join(" · ");
}
