import assert from "node:assert/strict";
import test from "node:test";

import { buildCodexInvocation, validateDecision, sanitizedChildEnv } from "../src/ai/decision.ts";
import path from 'node:path';

test("decision validation accepts strict output and rejects extra or unsafe values", () => {
  assert.equal(validateDecision({ decision: "SKIP", stake: 0, limit: 0, confidence: 0.5, reason: "No edge" }).decision, "SKIP");
  assert.throws(() => validateDecision({ decision: "UP", stake: 2, limit: 1.1, confidence: 1, reason: "bad" }));
  assert.throws(() => validateDecision({ decision: "SKIP", stake: 1, limit: 0, confidence: 0.5, reason: "bad" }));
});

test('Codex is isolated from inherited rules and gets absolute schema paths',()=>{
  const call=buildCodexInvocation('snapshot','answer.json',{},path.resolve('fixture'));
  assert.ok(call.args.includes('--ignore-user-config'));
  assert.ok(call.args.includes('--ignore-rules'));
  assert.ok(call.args.includes('--json'));
  assert.ok(path.isAbsolute(call.args[call.args.indexOf('--output-schema')+1]));
  assert.equal('kalshi_private_key_path' in sanitizedChildEnv({kalshi_private_key_path:'secret'}),false);
});

test("Codex invocation has no shell and removes all trading secrets", () => {
  const call = buildCodexInvocation("snapshot", "answer.json", {
    PATH: "ok",
    PREDICTEFY_API_KEY: "remove",
    KALSHI_API_KEY_ID: "remove",
    KALSHI_PRIVATE_KEY_PATH: "remove",
  });
  assert.equal(call.shell, false);
  assert.equal(call.env.PATH, "ok");
  assert.equal("PREDICTEFY_API_KEY" in call.env, false);
  assert.ok(call.args.includes("--output-schema"));
});
