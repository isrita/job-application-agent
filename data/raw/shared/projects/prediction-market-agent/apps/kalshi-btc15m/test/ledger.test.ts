import assert from "node:assert/strict";
import { mkdtemp, readFile } from "node:fs/promises";
import os from "node:os";
import path from "node:path";
import test from "node:test";

import { Ledger } from "../src/ledger.ts";

test('decision claims persist before invoking AI and second process cannot acquire the same lock',async()=>{
  const dir=await mkdtemp(path.join(os.tmpdir(),'kx-lock-'));
  const ledger=new Ledger(dir,'dry');
  await ledger.acquireLock();
  await assert.rejects(new Ledger(dir,'live').acquireLock(),/process/);
  assert.equal(await ledger.claimWindow('w1'),true);
  assert.equal(await new Ledger(dir,'dry').claimWindow('w1'),false);
  await ledger.releaseLock();
});

test("ledger persists reservation before submission and restores state", async () => {
  const dir = await mkdtemp(path.join(os.tmpdir(), "kxbtc-ledger-"));
  const ledger = new Ledger(dir, "dry", () => new Date("2026-10-03T12:00:00-05:00"));
  await ledger.reserve({ windowId: "w1", clientOrderId: "dry-w1", worstCaseCents: 154 });
  const restored = await ledger.readState();
  assert.equal(restored.openReservations.w1.worstCaseCents, 154);
  const events = await readFile(path.join(dir, "events-2026-10-03.jsonl"), "utf8");
  assert.match(events, /"type":"ORDER_RESERVED"/);
});

test("daily PnL resets at Lima midnight while permanent stop persists", async () => {
  const dir = await mkdtemp(path.join(os.tmpdir(), "kxbtc-day-"));
  let now = new Date("2026-10-03T23:55:00-05:00");
  const ledger = new Ledger(dir, "live", () => now);
  await ledger.reserve({ windowId: "w1", clientOrderId: "live-w1", worstCaseCents: 100 });
  await ledger.settle("w1", -100, "no");
  assert.equal((await ledger.readState()).dailyPnlCents, -100);
  await ledger.latchPermanentStop("BALANCE_FLOOR");
  now = new Date("2026-10-04T00:05:00-05:00");
  const nextDay = await ledger.readState();
  assert.equal(nextDay.dailyPnlCents, 0);
  assert.equal(nextDay.permanentStop, true);
});
