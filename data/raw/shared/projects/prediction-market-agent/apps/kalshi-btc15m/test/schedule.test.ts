import assert from "node:assert/strict";
import test from "node:test";

import { parseRunOptions, snapshotAt } from "../src/schedule.ts";

test("snapshot is five minutes after market open", () => {
  assert.equal(snapshotAt("2026-10-03T23:00:00Z", 5).toISOString(), "2026-10-03T23:05:00.000Z");
});

test("test orders require live mode and every run is bounded when requested", () => {
  assert.throws(() => parseRunOptions(["bot", "--test-order=up"]));
  assert.deepEqual(parseRunOptions(["bot", "--live", "--test-order=down", "--windows=2"]), {
    command: "bot", live: true, testOrder: "down", windows: 2,
  });
});
