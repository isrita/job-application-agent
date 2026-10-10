import assert from "node:assert/strict";
import test from "node:test";

import { estimateUpProbability, normalCdf } from "../src/math-model.ts";

test("normal CDF is centered at one half", () => {
  assert.ok(Math.abs(normalCdf(0) - 0.5) < 1e-7);
});

test("probability uses the target fallback and the sigma floor", () => {
  const result = estimateUpProbability({
    nowPrice: 100_010,
    target: 100_000,
    referenceAverage: null,
    moves: [{ delta: 1, elapsedSeconds: 1 }],
    secondsLeft: 300,
  });
  assert.equal(result.referenceSource, "target_fallback");
  assert.equal(result.sigma, 2);
  assert.ok(result.probabilityUp > 0.5 && result.probabilityUp < 1);
});
