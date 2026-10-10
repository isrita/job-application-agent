import assert from "node:assert/strict";
import test from "node:test";

import { bestBook, loadWarmup, parseBalance } from "../src/data-client.ts";
import { PriceBuffer } from "../src/price-buffer.ts";

test("balance parser returns total and the requested Crypto shard", () => {
  const total = parseBalance({ balance_dollars: "12.3400", balance_breakdown: [{ exchange_index: 2, balance: "5.6700" }] }, 2);
  assert.deepEqual(total, { totalUsd: 12.34, shardUsd: 5.67, exchangeIndex: 2 });
  assert.throws(() => parseBalance({ balance_dollars: "12.3400", balance_breakdown: [] }, 2));
});

test('book ignores unusable prices and zero liquidity',()=>{
  assert.equal(bestBook({asks:[[1.1,20],[.4,0]],bids:[[-1,20]]}).yesAsk,null);
  assert.throws(()=>parseBalance({balance_dollars:'10',balance_breakdown:[{exchange_index:2,balance:''}]}));
});

test("warmup adds only closed candle opens and closes", async () => {
  const buffer = new PriceBuffer();
  const now = 1_000_000;
  const client = { feeds: { fetchOHLCV: async () => [
    [800_000, 100, 110, 90, 105, 1],
    [980_000, 105, 112, 100, 111, 1],
  ] } };
  await loadWarmup(client as never, buffer, now);
  assert.equal(buffer.toJSON().length, 2);
  assert.deepEqual(buffer.toJSON().map((point) => point.price), [100, 105]);
});

test("book reader takes the highest bid and lowest ask", () => {
  assert.deepEqual(bestBook({ bids: [[0.48, 5], [0.51, 2]], asks: [[0.57, 1], [0.55, 4]] }), {
    yesBid: 0.51, yesAsk: 0.55, noAsk: 0.49, yesAskSize: 4, noAskSize: 2,
  });
});
