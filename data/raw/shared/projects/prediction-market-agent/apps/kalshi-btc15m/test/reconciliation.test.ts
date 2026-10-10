import assert from 'node:assert/strict';
import test from 'node:test';
import { fillSummary, settleReservations, responseFill } from '../src/reconciliation.ts';
import { Ledger } from '../src/ledger.ts';
import { mkdtemp } from 'node:fs/promises';
import os from 'node:os';
import path from 'node:path';

test('missing fill count is unknown and DOWN costs use NO prices', () => {
  assert.equal(responseFill({ orderId: 'o1' }, 'DOWN'), null);
  assert.deepEqual(responseFill({ fillCount: 2, averageFillPrice: .6, averageFeePaid: .01 }, 'DOWN'),
    { filled: 2, fillPrice: .4, costCents: 80, feeCents: 2 });
});
test('fills are attributed to this order only, deduplicated, and retain exact fees', () => {
  const row = { fill_id:'f1', order_id:'o1', count_fp:'2.00', yes_price_dollars:'0.6000', fee_cost:'0.0300' };
  assert.deepEqual(fillSummary([row, row, {...row, fill_id:'other', order_id:'o2'}], 'o1', 'DOWN'),
    { filled:2, fillPrice:.4, costCents:80, feeCents:3 });
});
test('uncertain order is reconciled by client ID and terminal order before settlement', async () => {
  const dir = await mkdtemp(path.join(os.tmpdir(),'kx-reconcile-'));
  const ledger = new Ledger(dir,'live');
  await ledger.reserve({ windowId:'w', clientOrderId:'c1', ticker:'T', direction:'DOWN', contracts:2, worstCaseCents:124, status:'unknown' });
  const account = {
    fetchOpenOrders: async () => ({ orders:[{ order_id:'o1', client_order_id:'c1', status:'executed', fill_count:'2.00' }] }),
    fetchFills: async () => ({ fills:[{ fill_id:'f1', order_id:'o1', count_fp:'2.00', yes_price_dollars:'0.6000', fee_cost:'0.0300' }] }),
  };
  await settleReservations(ledger, account, async () => 'no');
  const state = await ledger.readState();
  assert.equal(Object.keys(state.openReservations).length,0);
  assert.equal(state.settledPnlCents,117);
});
test('empty fills alone do not release an uncertain order', async () => {
  const dir = await mkdtemp(path.join(os.tmpdir(),'kx-unknown-'));
  const ledger = new Ledger(dir,'live');
  await ledger.reserve({windowId:'w',clientOrderId:'c1',ticker:'T',direction:'UP',worstCaseCents:200,status:'unknown'});
  await settleReservations(ledger,{fetchOpenOrders:async()=>({orders:[]}),fetchFills:async()=>({fills:[]})},async()=>'yes');
  assert.equal((await ledger.readState()).openReservations.w.worstCaseCents,200);
});
