export const IVA_RATE = 0.10;
export const IVA_PERCENT = 10;

export function toCents(eur: number) {
  return Math.round(Number(eur) * 100);
}
export function fromCents(cents: number) {
  return cents / 100;
}

export function calcTotalsFromItems(items: Array<{ price: number; quantity: number }>) {
  const subtotalCents = items.reduce(
    (sum, it) => sum + toCents(it.price) * Number(it.quantity),
    0
  );
  const taxCents = Math.round(subtotalCents * IVA_RATE);
  const totalCents = subtotalCents + taxCents;

  return {
    subtotal: fromCents(subtotalCents),
    tax: fromCents(taxCents),
    total: fromCents(totalCents),
    subtotalCents,
    taxCents,
    totalCents,
  };
}
