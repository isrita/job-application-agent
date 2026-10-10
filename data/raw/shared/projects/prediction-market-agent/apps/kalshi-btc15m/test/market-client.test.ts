import assert from "node:assert/strict";
import test from "node:test";

import { createVenueFetch, selectCryptoMarket, yesOutcomeId } from "../src/market-client.ts";

test("venue fetch rewrites only Kalshi's exact legacy production origin", async () => {
  const seen: string[] = [];
  const fakeFetch = async (input: RequestInfo | URL) => {
    seen.push(String(input));
    return new Response("{}", { status: 200 });
  };
  const venueFetch = createVenueFetch(fakeFetch as typeof fetch);
  await venueFetch("https://external-api.kalshi.com/trade-api/v2/portfolio/balance?exchange_index=2");
  await venueFetch("https://example.com/path");
  assert.equal(seen[0], "https://api.elections.kalshi.com/trade-api/v2/portfolio/balance?exchange_index=2");
  assert.equal(seen[1], "https://example.com/path");
});

test("market selection is strict about series, open status, and Crypto shard", () => {
  const market = selectCryptoMarket([
    { ticker: "WRONG", series_ticker: "OTHER", status: "open", exchange_index: 2 },
    { ticker: "RIGHT", series_ticker: "KXBTC15M", status: "open", exchange_index: 2 },
  ]);
  assert.equal(market.ticker, "RIGHT");
  assert.equal(yesOutcomeId({ outcomes: [{ outcomeId: "k:no", label: "No" }, { outcomeId: "k:yes", label: "Yes" }] }), "k:yes");
});
