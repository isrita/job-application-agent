import assert from "node:assert/strict";
import test from "node:test";

import { buildUiServer } from "../src/ui/server.ts";

test("review UI exposes a demo snapshot and never enables live execution", async () => {
  const server = buildUiServer();
  await new Promise<void>((resolve) => server.listen(0, "127.0.0.1", resolve));
  try {
    const address = server.address();
    if (!address || typeof address === "string") throw new Error("missing address");
    const origin = `http://127.0.0.1:${address.port}`;
    const page = await fetch(origin);
    assert.equal(page.status, 200);
    assert.match(await page.text(), /Kalshi BTC 15M/);
    const status = await (await fetch(`${origin}/api/status`)).json();
    assert.equal(status.mode, "dry_run_review");
    assert.equal(status.liveExecution, false);
    const demo = await (await fetch(`${origin}/api/demo`)).json();
    assert.equal(demo.market.series, "KXBTC15M");
    const review=await (await fetch(`${origin}/api/review`)).json();
    assert.equal(review.mode,'dry');
    assert.equal(review.ordersSent,0);
    assert.equal((await fetch(`${origin}/api/review`,{method:'POST'})).status,405);
  } finally {
    await new Promise<void>((resolve, reject) => server.close((error) => error ? reject(error) : resolve()));
  }
});
