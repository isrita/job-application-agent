import assert from "node:assert/strict";
import test from "node:test";

import { snapshotText } from "../src/snapshot.ts";

test("snapshot is frozen text with evidence, limits, and no secrets", () => {
  const text = snapshotText({
    generatedAt: "2026-10-03T23:05:00Z",
    windowId: "W1",
    market: { series: "KXBTC15M", ticker: "T1", exchangeIndex: 2, target: 62000, closeTime: "2026-10-03T23:15:00Z" },
    btc: { now: 62010, ageSeconds: 1, reference: 62000, referenceSource: "target_fallback", momentum60: 5, momentum180: 10, sigma: 2 },
    model: { probabilityUp: 0.6, secondsLeft: 600 },
    book: { yesBid: 0.5, yesAsk: 0.52, noAsk: 0.5 },
    account: { cryptoBalanceUsd: 10, todayPnlUsd: 0, openWorstCaseUsd: 0 },
    limits: { minStakeUsd: 1, maxStakeUsd: 2, dailyLossLimitUsd: 3, balanceFloorUsd: 4 },
    recentCalls: [], notices: ["fallback"],
  });
  assert.match(text, /KXBTC15M/);
  assert.match(text, /target_fallback/);
  assert.doesNotMatch(text, /PREDICTEFY_API_KEY|PRIVATE KEY/);
});
