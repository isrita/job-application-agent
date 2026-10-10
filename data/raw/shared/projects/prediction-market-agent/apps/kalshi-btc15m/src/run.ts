import path from 'node:path';
import { runCodexDecision } from './ai/runner.ts';
import { validateDecision } from './ai/decision.ts';
import { RunControl } from './control.ts';
import { bestBook, loadWarmup, ResilientTickerFeed } from './data-client.ts';
import { capDecision, orderIntent, simulateIoc } from './execution.ts';
import { Ledger, type Reservation } from './ledger.ts';
import { buildLiveSnapshot } from './live-snapshot.ts';
import { takerFeeCents } from './market-math.ts';
import { yesOutcomeId } from './market-client.ts';
import { createPredictefyClient, fetchMarketResult, fetchOpenMarket, readAccountBalance, type OpenMarket } from './predictefy.ts';
import { PriceBuffer } from './price-buffer.ts';
import { responseFill, settleReservations } from './reconciliation.ts';
import { assessDecision } from './risk.ts';
import { snapshotAt, type RunOptions } from './schedule.ts';
import { snapshotText } from './snapshot.ts';
import type { BotConfig, Decision, WindowSnapshot } from './types.ts';
import { readWeeklyUsagePercent } from './usage.ts';

type Client = ReturnType<typeof createPredictefyClient>;
function metrics(state: Awaited<ReturnType<Ledger['readState']>>) {
  return { todayPnlUsd:state.dailyPnlCents/100, todayLossUsd:Math.max(0,-state.dailyPnlCents/100),
    openWorstCaseUsd:Object.values(state.openReservations).reduce((n,r)=>n+r.worstCaseCents,0)/100 };
}
function cash(state:Awaited<ReturnType<Ledger['readState']>>, real:number, live:boolean) {
  return live ? real : Number(state.dryInitialBalanceUsd)+state.settledPnlCents/100;
}
async function waitUntil(time:number,control:RunControl,now:()=>number=Date.now) {
  while(now()<time) await control.sleep(Math.min(1000,time-now()));
  await control.check();
}
async function waitForLivePrice(buffer:PriceBuffer,control:RunControl) {
  const deadline=Date.now()+20_000;
  while(Date.now()<deadline){await control.check();if(!buffer.isStale(Date.now()))return;await control.sleep(200);}
  throw new Error('No recent BTC price was received.');
}
async function currentBook(client:Client,ticker:string) {
  const market=await client.kalshi.fetchMarket(ticker);
  return bestBook(await client.kalshi.fetchOrderBook({outcomeId:yesOutcomeId(market)}) as never);
}
export async function showBalance(config:BotConfig) {
  const balance=await readAccountBalance(createPredictefyClient(config));
  return {status:'ok',...balance,requiredShard:2,ordersSent:0};
}
export async function checkOnce(config:BotConfig,appRoot:string) {
  const client=createPredictefyClient(config);const balance=await readAccountBalance(client);
  const market=await fetchOpenMarket();const buffer=new PriceBuffer();await loadWarmup(client,buffer);
  const feed=new ResilientTickerFeed(client,buffer);const control=new RunControl(appRoot);feed.start();
  try {
    await waitForLivePrice(buffer,control);
    const state=await new Ledger(path.join(appRoot,'data'),'dry').readState();
    const snapshot=await buildLiveSnapshot({client,market,buffer,balanceUsd:balance.shardUsd,
      ...metrics(state),limits:config.limits,recentCalls:state.recentCalls});
    if(buffer.isStale(Date.now()))throw new Error('Stale BTC price: snapshot rejected.');
    return {snapshot,text:snapshotText(snapshot),ordersSent:0,appRoot};
  } finally {feed.stop();}
}
async function chooseDecision(options:RunOptions,snapshot:WindowSnapshot,appRoot:string,signal:AbortSignal):Promise<Decision> {
  if(options.testOrder){
    const direction=options.testOrder==='auto'?((snapshot.book.yesAsk??1)<=(snapshot.book.noAsk??1)?'UP':'DOWN'):options.testOrder.toUpperCase() as 'UP'|'DOWN';
    const ask=direction==='UP'?snapshot.book.yesAsk:snapshot.book.noAsk;
    if(ask===null)return {decision:'SKIP',stake:0,limit:0,confidence:0,reason:'No offer is available for the test order.'};
    return {decision:direction,stake:snapshot.limits.maxStakeUsd,limit:Math.min(.99,ask+.02),confidence:1,reason:'Test order explicitly requested by the user.'};
  }
  const usage=await readWeeklyUsagePercent();
  if(usage===null||usage>=80)return {decision:'SKIP',stake:0,limit:0,confidence:0,reason:'Weekly usage cannot be verified or exceeds the limit.'};
  return runCodexDecision(snapshotText(snapshot),appRoot,180_000,signal);
}
export async function processWindow(input:{
  config:BotConfig;options:RunOptions;appRoot:string;client:Client;ledger:Ledger;buffer:PriceBuffer;market:OpenMarket;
  control:RunControl;now?:()=>number;decide?:(snapshot:WindowSnapshot)=>Promise<Decision>;
  result?:typeof fetchMarketResult;discover?:typeof fetchOpenMarket;
}):Promise<void> {
  const {config,options,appRoot,client,ledger,buffer,market,control}=input;const now=input.now??Date.now;
  const skip=async(code:string)=>{await ledger.record('WINDOW_SKIPPED',{windowId:market.ticker,code});};
  await control.check();await settleReservations(ledger,client.accounts.kalshi,input.result??fetchMarketResult);
  const target=snapshotAt(market.openTime,config.snapshotMinute).getTime();
  if(now()>target+30_000){await skip('MISSED_SNAPSHOT_TIME');return;}
  await waitUntil(target,control,now);
  const balance=await readAccountBalance(client);if(!options.live)await ledger.initializeDryBalance(balance.shardUsd);
  let state=await ledger.readState();let m=metrics(state);const balanceUsd=cash(state,balance.shardUsd,options.live);
  if(balanceUsd-m.openWorstCaseUsd<=config.limits.balanceFloorUsd){await ledger.latchPermanentStop('BALANCE_AT_OR_BELOW_FLOOR');return;}
  if(m.todayLossUsd+m.openWorstCaseUsd>=config.limits.dailyLossLimitUsd)await ledger.latchDailyStop();
  state=await ledger.readState();
  if(state.permanentStop||state.dailyStop){await skip(state.permanentStop?'PERMANENT_STOP':'DAILY_STOP');return;}
  if(!await ledger.claimWindow(market.ticker)){await skip('ALREADY_DECIDED');return;}
  const snapshot=await buildLiveSnapshot({client,market,buffer,balanceUsd,...m,limits:config.limits,recentCalls:state.recentCalls,nowMs:now()});
  await ledger.record('SNAPSHOT',{windowId:market.ticker,snapshot});
  if(snapshot.btc.ageSeconds>5||now()-Date.parse(snapshot.generatedAt)>5000||buffer.isStale(now())){await skip('STALE_BTC');return;}
  await control.check();
  let decision=validateDecision(await (input.decide?input.decide(snapshot):chooseDecision(options,snapshot,appRoot,control.signal)));
  const ask=decision.decision==='DOWN'?snapshot.book.noAsk:snapshot.book.yesAsk;
  const probability=decision.decision==='DOWN'?1-snapshot.model.probabilityUp:snapshot.model.probabilityUp;
  if(decision.decision!=='SKIP'&&ask!==null&&!options.testOrder)decision=capDecision(decision,{sideAsk:ask,sideProbability:probability});
  await ledger.rememberDecision(decision);await ledger.record('DECISION',{windowId:market.ticker,decision});if(decision.decision==='SKIP')return;
  await control.check();const freshMarket=await (input.discover??fetchOpenMarket)();
  if(freshMarket.ticker!==market.ticker||freshMarket.exchangeIndex!==2||freshMarket.status!=='open'||now()>=Date.parse(market.closeTime)){
    await skip('MARKET_CHANGED_OR_CLOSED');return;
  }
  const book=await currentBook(client,market.ticker);const freshBalance=await readAccountBalance(client);
  state=await ledger.readState();m=metrics(state);
  if(buffer.isStale(now())){await skip('STALE_BTC_AFTER_AI');return;}
  if(state.permanentStop||state.dailyStop){await skip('STOP_LATCHED');return;}
  const freshAsk=decision.decision==='UP'?book.yesAsk:book.noAsk;
  const risk=assessDecision(decision,{limits:config.limits,balanceUsd:cash(state,freshBalance.shardUsd,options.live),
    todayLossUsd:m.todayLossUsd,openWorstCaseUsd:m.openWorstCaseUsd,alreadyTradedWindow:state.tradedWindows.includes(market.ticker),
    offerAvailable:freshAsk!==null&&freshAsk<=decision.limit});
  await ledger.record('RISK',{windowId:market.ticker,risk});if(risk.code==='DAILY_STOP')await ledger.latchDailyStop();if(!risk.allowed)return;
  const id=`${options.live?'live':'dry'}-${market.ticker.replace(/[^A-Za-z0-9_-]/g,'-').slice(-48)}`;
  const reservation:Reservation={windowId:market.ticker,clientOrderId:id,worstCaseCents:risk.worstCaseCents,
    ticker:market.ticker,direction:decision.decision,contracts:risk.contracts,status:'reserved'};
  await control.check();await ledger.reserve(reservation);
  if(!options.live){
    const fill=simulateIoc(decision.decision,decision.limit,risk.contracts,book);
    if(!fill.filled){await ledger.release(market.ticker,'DRY_IOC_NO_FILL');return;}
    const feeCents=takerFeeCents(fill.filled,Number(fill.price));
    await ledger.updateReservation(market.ticker,{filled:fill.filled,fillPrice:fill.price,feeCents,
      costCents:Math.ceil(fill.filled*Number(fill.price)*100-1e-9),status:'simulated'});
    await ledger.record('ORDER_SIMULATED',{windowId:market.ticker,fill,feeCents,ordersSent:0});return;
  }
  await control.check();
  if(buffer.isStale(now())||now()>=Date.parse(market.closeTime)){await ledger.release(market.ticker,'NOT_SENT_STALE_OR_CLOSED');return;}
  try {
    const response=await client.accounts.kalshi.createOrder(orderIntent(decision.decision,decision.limit,risk.contracts,id,market.ticker));
    const fill=responseFill(response as unknown as Record<string,unknown>,decision.decision);
    const validFill=fill&&fill.filled<=risk.contracts?fill:null;
    await ledger.updateReservation(market.ticker,{...(validFill??{}),orderId:response.orderId,status:validFill?'submitted':'unknown'});
    await ledger.record('ORDER_RESULT',{windowId:market.ticker,orderId:response.orderId,filled:validFill?.filled??null});
    if(validFill?.filled===0)await ledger.release(market.ticker,'LIVE_IOC_CONFIRMED_NO_FILL');
  } catch {
    // A failed response can follow venue acceptance. Reconcile; never retry blindly.
    await ledger.updateReservation(market.ticker,{status:'unknown'});
    await ledger.record('ORDER_UNKNOWN',{windowId:market.ticker,code:'RECONCILE_REQUIRED'});
  }
}
export async function runBot(config:BotConfig,options:RunOptions,appRoot:string):Promise<void> {
  const ledger=new Ledger(path.join(appRoot,'data'),options.live?'live':'dry',()=>new Date(),config.timeZone);
  await ledger.acquireLock();const control=new RunControl(appRoot);
  const stop=()=>control.stop();process.once('SIGINT',stop);process.once('SIGTERM',stop);
  const monitor=setInterval(()=>{void control.check().catch(()=>{});},250);
  const client=createPredictefyClient(config);const buffer=new PriceBuffer();const feed=new ResilientTickerFeed(client,buffer);
  try {
    await control.check();const balance=await readAccountBalance(client);if(!options.live)await ledger.initializeDryBalance(balance.shardUsd);
    await settleReservations(ledger,client.accounts.kalshi,fetchMarketResult);await loadWarmup(client,buffer);feed.start();
    const limit=options.testOrder?1:(options.windows??Infinity);
    let completed=0;
    while(completed<limit){
      await waitForLivePrice(buffer,control);const market=await fetchOpenMarket();
      if(Date.now()>snapshotAt(market.openTime,config.snapshotMinute).getTime()+30_000){
        await ledger.record('WINDOW_SKIPPED',{windowId:market.ticker,code:'MISSED_SNAPSHOT_TIME'});
        await waitUntil(Date.parse(market.closeTime)+20_000,control);continue;
      }
      try{await processWindow({config,options,appRoot,client,ledger,buffer,market,control});}
      catch{await control.check();await ledger.record('WINDOW_ERROR',{windowId:market.ticker,code:'WINDOW_NOT_RETRIED'});}
      await waitUntil(Date.parse(market.closeTime)+20_000,control);
      await settleReservations(ledger,client.accounts.kalshi,fetchMarketResult);
      completed++;
      if((await ledger.readState()).permanentStop)break;
    }
  } catch(error){if(!control.signal.aborted)throw error;await ledger.record('STOPPED',{code:'USER_STOP'});}
  finally{feed.stop();clearInterval(monitor);process.removeListener('SIGINT',stop);process.removeListener('SIGTERM',stop);await ledger.releaseLock();}
}
