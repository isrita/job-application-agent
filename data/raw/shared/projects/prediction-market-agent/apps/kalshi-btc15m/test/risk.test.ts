import assert from "node:assert/strict";
import test from "node:test";

import { assessDecision } from "../src/risk.ts";

const base = {
  limits: { minStakeUsd: 1, maxStakeUsd: 2, dailyLossLimitUsd: 3, balanceFloorUsd: 4 },
  balanceUsd: 10,
  todayLossUsd: 0,
  openWorstCaseUsd: 0,
  alreadyTradedWindow: false,
  offerAvailable: true,
};

test('rejects invalid numeric state and refuses to cross the daily loss budget',()=>{
  const decision={decision:'UP',stake:2,limit:.5,confidence:.8,reason:'fixture'} as const;
  assert.equal(assessDecision(decision,{...base,balanceUsd:NaN}).allowed,false);
  assert.equal(assessDecision(decision,{...base,todayLossUsd:2}).code,'DAILY_BUDGET');
});

test("risk engine converts dollar stake to whole contracts and includes fees", () => {
  const result = assessDecision(
    { decision: "UP", stake: 2, limit: 0.5, confidence: 0.7, reason: "edge" },
    base,
  );
  assert.equal(result.allowed, true);
  assert.equal(result.contracts, 3);
  assert.equal(result.worstCaseCents, 156);
});

test("risk engine blocks daily stop, balance floor, repeat trades, and empty books", () => {
  const decision = { decision: "DOWN", stake: 2, limit: 0.5, confidence: 0.7, reason: "edge" } as const;
  assert.equal(assessDecision(decision, { ...base, todayLossUsd: 3 }).code, "DAILY_STOP");
  assert.equal(assessDecision(decision, { ...base, balanceUsd: 5 }).code, "BALANCE_FLOOR");
  assert.equal(assessDecision(decision, { ...base, alreadyTradedWindow: true }).code, "WINDOW_LIMIT");
  assert.equal(assessDecision(decision, { ...base, offerAvailable: false }).code, "NO_OFFER");
});
