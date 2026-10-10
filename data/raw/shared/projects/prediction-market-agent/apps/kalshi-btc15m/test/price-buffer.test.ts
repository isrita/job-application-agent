import assert from "node:assert/strict";
import test from "node:test";

import { PriceBuffer } from "../src/price-buffer.ts";

test("buffer calculates reference average, momentum, and staleness", () => {
  const buffer = new PriceBuffer(3_600_000);
  const base = Date.parse("2026-10-03T15:00:00Z");
  buffer.add(base, 100);
  buffer.add(base + 60_000, 110);
  buffer.add(base + 180_000, 130);
  assert.equal(buffer.average(base, base + 60_000), 100);
  assert.equal(buffer.momentum(base + 180_000, 180), 30);
  assert.equal(buffer.isStale(base + 184_000, 5_000), false);
  assert.equal(buffer.isStale(base + 186_000, 5_000), true);
});

test('reference averages weight elapsed time and reject incomplete history',()=>{
  const buffer=new PriceBuffer();buffer.add(0,100);buffer.add(30_000,110);buffer.add(59_000,110);
  assert.equal(buffer.average(0,60_000),105);
  assert.equal(buffer.average(-60_000,0),null);
});

test('partial momentum and future timestamps cannot appear fresh',()=>{
  const buffer=new PriceBuffer();buffer.add(100_000,100);buffer.add(110_000,110);
  assert.equal(buffer.momentum(110_000,60),null);
  assert.equal(buffer.isStale(90_000),true);
});
