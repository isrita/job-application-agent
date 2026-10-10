import assert from 'node:assert/strict';
import test from 'node:test';
import { mkdtemp } from 'node:fs/promises';
import path from 'node:path';
import os from 'node:os';
import { Ledger } from '../src/ledger.ts';
import { processWindow } from '../src/run.ts';
import { PriceBuffer } from '../src/price-buffer.ts';
import { RunControl } from '../src/control.ts';
import { settleReservations } from '../src/reconciliation.ts';

test('complete offline dry window simulates, persists, and cannot ask AI twice on restart', async () => {
  const dir = await mkdtemp(path.join(os.tmpdir(),'kx-runtime-'));
  const ledger = new Ledger(dir,'dry',()=>new Date('2026-10-03T23:05:00Z'));
  await ledger.initializeDryBalance(10);
  const now = Date.parse('2026-10-03T23:05:00Z');
  const market={ticker:'KXBTC15M-T',series:'KXBTC15M',status:'open',exchangeIndex:2,target:62000,openTime:'2026-10-03T23:00:00Z',closeTime:'2026-10-03T23:15:00Z'};
  const buffer = new PriceBuffer(); buffer.add(now-1000,62100);
  let asks=0; let orders=0;
  const client={
    kalshi:{fetchMarket:async()=>({outcomes:[{label:'Yes',outcomeId:'YES'}]}),fetchOrderBook:async()=>({bids:[[.4,20]],asks:[[.5,20]]})},
    accounts:{kalshi:{fetchBalance:async()=>({balance_dollars:'10',balance_breakdown:[{exchange_index:2,balance:'10'}]}),createOrder:async()=>{orders++;throw new Error('must not send')}}},
  };
  const config={limits:{minStakeUsd:1,maxStakeUsd:2,dailyLossLimitUsd:3,balanceFloorUsd:4},snapshotMinute:5};
  const input={config,options:{live:false,testOrder:null,windows:1,command:'bot'},appRoot:dir,client,ledger,buffer,market,control:new RunControl(dir),now:()=>now,
    decide:async()=>{asks++;return {decision:'UP',stake:2,limit:.5,confidence:.8,reason:'fixture'}},result:async()=>null,
    discover:async()=>market};
  await processWindow(input as never);
  await processWindow(input as never);
  const state=await ledger.readState();
  assert.equal(asks,1);assert.equal(orders,0);
  assert.equal(state.openReservations[market.ticker].filled,3);
  assert.equal(state.recentCalls.length,1);
  await settleReservations(ledger,client.accounts.kalshi as never,async()=>'yes');
  const settled=await ledger.readState();
  assert.equal(settled.settledPnlCents,144);
  assert.deepEqual(settled.openReservations,{});
  assert.equal(settled.dryInitialBalanceUsd,10);
});
