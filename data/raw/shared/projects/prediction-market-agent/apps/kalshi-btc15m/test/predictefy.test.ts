import assert from "node:assert/strict";
import test from "node:test";

import { normalizeOpenMarket } from "../src/predictefy.ts";

test("raw Kalshi market requires target, times, ticker, and Crypto shard", () => {
  const market = normalizeOpenMarket({
    ticker: "KXBTC15M-TEST", series_ticker: "KXBTC15M", status: "open",
    exchange_index: 2, floor_strike: 62000, open_time: "2026-10-03T23:00:00Z", close_time: "2026-10-03T23:15:00Z",
  });
  assert.equal(market.target, 62000);
  assert.equal(market.exchangeIndex, 2);
  assert.throws(() => normalizeOpenMarket({ ticker: "X", exchange_index: 0 }));
});
