import { bestBook } from "./data-client.ts";
import { estimateUpProbability } from "./math-model.ts";
import { yesOutcomeId } from "./market-client.ts";
import type { OpenMarket } from "./predictefy.ts";
import type { PriceBuffer } from "./price-buffer.ts";
import type { Decision, Limits, WindowSnapshot } from "./types.ts";

function deepFreeze<T>(value: T): T {
  if (value && typeof value === "object" && !Object.isFrozen(value)) {
    Object.freeze(value);
    for (const item of Object.values(value as Record<string, unknown>)) deepFreeze(item);
  }
  return value;
}

export async function buildLiveSnapshot(input: {
  client: { kalshi: { fetchMarket(id: string): Promise<unknown>; fetchOrderBook(params: { outcomeId: string }): Promise<unknown> } };
  market: OpenMarket;
  buffer: PriceBuffer;
  balanceUsd: number;
  todayPnlUsd: number;
  openWorstCaseUsd: number;
  limits: Limits;
  recentCalls: Decision[];
  nowMs?: number;
}): Promise<WindowSnapshot> {
  const nowMs = input.nowMs ?? Date.now();
  const latest = input.buffer.latest();
  if (!latest) throw new Error("No BTC price is available to build the snapshot.");
  const openMs = Date.parse(input.market.openTime);
  const closeMs = Date.parse(input.market.closeTime);
  const referenceAverage = input.buffer.average(openMs - 60_000, openMs);
  const model = estimateUpProbability({
    nowPrice: latest.price,
    target: input.market.target,
    referenceAverage,
    moves: input.buffer.movesSince(nowMs - 30 * 60_000),
    secondsLeft: Math.max(0, Math.floor((closeMs - nowMs) / 1000)),
  });
  const catalogMarket = await input.client.kalshi.fetchMarket(input.market.ticker) as { outcomes?: { outcomeId?: string; label?: string }[] };
  const outcomeId = yesOutcomeId(catalogMarket);
  const book = bestBook(await input.client.kalshi.fetchOrderBook({ outcomeId }) as never);
  const snapshot: WindowSnapshot = {
    generatedAt: new Date(nowMs).toISOString(),
    windowId: input.market.ticker,
    market: { series: "KXBTC15M", ticker: input.market.ticker, exchangeIndex: 2, target: input.market.target, closeTime: input.market.closeTime },
    btc: {
      now: latest.price,
      ageSeconds: Math.max(0, (nowMs - latest.timestampMs) / 1000),
      reference: model.reference,
      referenceSource: model.referenceSource,
      momentum60: input.buffer.momentum(nowMs, 60),
      momentum180: input.buffer.momentum(nowMs, 180),
      sigma: model.sigma,
    },
    model: { probabilityUp: model.probabilityUp, secondsLeft: Math.max(0, Math.floor((closeMs - nowMs) / 1000)) },
    book: { yesBid: book.yesBid, yesAsk: book.yesAsk, noAsk: book.noAsk },
    account: { cryptoBalanceUsd: input.balanceUsd, todayPnlUsd: input.todayPnlUsd, openWorstCaseUsd: input.openWorstCaseUsd },
    limits: input.limits,
    recentCalls: input.recentCalls.slice(-5),
    notices: [
      "Binance BTC/USDT is a proxy baseline and does not replicate the CF Benchmarks BRTI settlement index.",
      ...(model.referenceSource === "target_fallback" ? ["Missing pre-open Binance history: target fallback used."] : []),
    ],
  };
  return deepFreeze(snapshot);
}
