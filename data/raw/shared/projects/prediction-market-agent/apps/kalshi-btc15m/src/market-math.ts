export function takerFeeCents(contracts: number, price: number): number {
  if (!Number.isInteger(contracts) || contracts < 0) throw new Error("contracts must be a non-negative integer");
  if (!Number.isFinite(price) || price < 0 || price > 1) throw new Error("price must be between zero and one");
  return Math.ceil(0.07 * contracts * price * (1 - price) * 100 - 1e-10);
}

function priceStep(price: number): number {
  return price < 0.1 || price > 0.9 ? 0.001 : 0.01;
}

export function snapPrice(price: number, direction: "up" | "down"): number {
  if (!Number.isFinite(price) || price < 0.01 || price > 0.99) throw new Error("price must be from 0.01 to 0.99");
  const step = priceStep(price);
  const scaled = price / step;
  const snapped = direction === "down" ? Math.floor(scaled + 1e-9) : Math.ceil(scaled - 1e-9);
  return Number((snapped * step).toFixed(3));
}

export function orderWorstCaseCents(contracts: number, cap: number): number {
  return Math.ceil(contracts * cap * 100 - 1e-9) + takerFeeCents(contracts, cap);
}
