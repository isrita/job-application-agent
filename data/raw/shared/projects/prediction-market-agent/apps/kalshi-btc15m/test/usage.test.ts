import assert from "node:assert/strict";
import test from "node:test";

import { weeklyUsedPercentFromRecord } from "../src/usage.ts";

test("reads the weekly/secondary Codex limit without confusing the short window", () => {
  assert.equal(weeklyUsedPercentFromRecord({ payload: { rate_limits: {
    primary: { used_percent: 20, window_minutes: 300 },
    secondary: { used_percent: 72, window_minutes: 10080 },
  } } }), 72);
  assert.equal(weeklyUsedPercentFromRecord({ payload: {} }), null);
});
