import assert from "node:assert/strict";
import test from "node:test";

import { capDecision, orderIntent, simulateIoc } from "../src/execution.ts";

test("AI cap cannot exceed ask plus three cents or probability minus three cents", () => {
  const capped = capDecision(
    { decision: "UP", stake: 2, limit: 0.9, confidence: 0.8, reason: "edge" },
    { sideAsk: 0.55, sideProbability: 0.64 },
  );
  assert.equal(capped.limit, 0.58);
});

test("UP and DOWN become conservative YES-book IOC intents", () => {
  assert.deepEqual(orderIntent("UP", 0.556, 2, "id-1", "T1"), {
    marketId: "T1", outcomeId: "yes", side: "buy", type: "market", amount: 2, price: 0.55, clientOrderId: "id-1",
  });
  assert.equal(orderIntent("DOWN", 0.443, 2, "id-2", "T1").price, 0.56);
  assert.equal(orderIntent("DOWN", 0.443, 2, "id-2", "T1").side, "sell");
});

test("dry IOC fills only displayed liquidity inside the cap", () => {
  assert.deepEqual(simulateIoc("UP", 0.56, 4, { yesAsk: 0.55, yesAskSize: 2, noAsk: 0.49, noAskSize: 3 }), {
    filled: 2, price: 0.55, simulated: true,
  });
  assert.equal(simulateIoc("UP", 0.54, 4, { yesAsk: 0.55, yesAskSize: 2, noAsk: 0.49, noAskSize: 3 }).filled, 0);
});
