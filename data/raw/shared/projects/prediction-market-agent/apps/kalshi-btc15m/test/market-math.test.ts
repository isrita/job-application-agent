import assert from "node:assert/strict";
import test from "node:test";

import { takerFeeCents, snapPrice } from "../src/market-math.ts";

test("fee is rounded up once for the whole order", () => {
  assert.equal(takerFeeCents(2, 0.5), 4);
});

test("price caps snap in the conservative direction on the active grid", () => {
  assert.equal(snapPrice(0.856, "down"), 0.85);
  assert.equal(snapPrice(0.856, "up"), 0.86);
  assert.equal(snapPrice(0.9567, "down"), 0.956);
  assert.equal(snapPrice(0.9561, "up"), 0.957);
});
