import assert from "node:assert/strict";
import test from "node:test";

import { buildLiveSnapshot } from "../src/live-snapshot.ts";
import { PriceBuffer } from "../src/price-buffer.ts";

test("builds one immutable snapshot from normalized outcome and current book", async () => {
  const open = Date.parse("2026-10-03T23:00:00Z");
  const now = Date.parse("2026-10-03T23:05:00Z");
  const buffer = new PriceBuffer();
  buffer.add(open - 60_000, 62000);
  buffer.add(open - 1, 62002);
  buffer.add(now - 1_000, 62010);
  const client = { kalshi: {
    fetchMarket: async () => ({ outcomes: [{ outcomeId: "kalshi:T1:yes", label: "Yes" }] }),
    fetchOrderBook: async ({ outcomeId }: { outcomeId: string }) => {
      assert.equal(outcomeId, "kalshi:T1:yes");
      return { bids: [[0.5, 3]], asks: [[0.52, 4]] };
    },
  } };
  const snapshot = await buildLiveSnapshot({
    client: client as never,
    market: { ticker: "T1", series: "KXBTC15M", status: "open", exchangeIndex: 2, target: 62000, openTime: new Date(open).toISOString(), closeTime: new Date(now + 600_000).toISOString() },
    buffer, balanceUsd: 10, todayPnlUsd: 0, openWorstCaseUsd: 0,
    limits: { minStakeUsd: 1, maxStakeUsd: 2, dailyLossLimitUsd: 3, balanceFloorUsd: 4 },
    recentCalls: [], nowMs: now,
  });
  assert.equal(snapshot.book.yesAsk, 0.52);
  assert.equal(snapshot.model.secondsLeft, 600);
  assert.equal(snapshot.btc.referenceSource, "binance_history");
  assert.equal(Object.isFrozen(snapshot), true);
});
