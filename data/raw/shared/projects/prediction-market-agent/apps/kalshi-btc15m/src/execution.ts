import { snapPrice } from "./market-math.ts";
import type { Decision } from "./types.ts";

export function capDecision(decision: Decision, market: { sideAsk: number; sideProbability: number }): Decision {
  if (decision.decision === "SKIP") return decision;
  const maximum = Math.min(0.99, market.sideAsk + 0.03, market.sideProbability - 0.03);
  if (maximum < 0.01) return { decision: "SKIP", stake: 0, limit: 0, confidence: decision.confidence, reason: "The safe price cap fell below the allowed minimum." };
  return { ...decision, limit: snapPrice(Math.min(decision.limit, maximum), "down") };
}

export function orderIntent(direction: "UP" | "DOWN", sideCap: number, contracts: number, clientOrderId: string, ticker: string) {
  const yesPrice = direction === "UP" ? snapPrice(sideCap, "down") : snapPrice(1 - sideCap, "up");
  return {
    marketId: ticker,
    outcomeId: "yes" as const,
    side: direction === "UP" ? "buy" as const : "sell" as const,
    type: "market" as const,
    amount: contracts,
    price: yesPrice,
    clientOrderId,
  };
}

export function simulateIoc(
  direction: "UP" | "DOWN",
  cap: number,
  contracts: number,
  book: { yesAsk: number | null; yesAskSize: number; noAsk: number | null; noAskSize: number },
) {
  const offer = direction === "UP" ? book.yesAsk : book.noAsk;
  const size = direction === "UP" ? book.yesAskSize : book.noAskSize;
  const filled = offer !== null && offer <= cap ? Math.min(contracts, Math.floor(size)) : 0;
  return { filled, price: filled ? offer : null, simulated: true };
}
