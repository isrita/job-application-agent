import type { WindowSnapshot } from '../types.ts';

export function demoSnapshot(): WindowSnapshot & {
  decision: Record<string, unknown>; risk: Record<string, unknown>;
  simulation: {filled:number;fillPrice:number;feeCents:number;closeIndex:number;pnlUsd:number};
} {
  return {
    generatedAt:'2026-10-03T18:05:00-05:00',windowId:'KXBTC15M-DEMO-1800',
    market:{series:'KXBTC15M',ticker:'KXBTC15M-DEMO',exchangeIndex:2,target:82961.40,closeTime:'2026-10-03T18:15:00-05:00'},
    btc:{now:83041.35,ageSeconds:1.2,reference:82990.15,referenceSource:'binance_history',momentum60:11.4,momentum180:37.1,sigma:3.32},
    model:{probabilityUp:.744,secondsLeft:600},book:{yesBid:.61,yesAsk:.62,noAsk:.39},
    account:{cryptoBalanceUsd:10,todayPnlUsd:0,openWorstCaseUsd:0},
    limits:{minStakeUsd:1,maxStakeUsd:2,dailyLossLimitUsd:3,balanceFloorUsd:4},recentCalls:[],
    notices:['Demonstration data and result; these do not come from a real market window.','Binance is a proxy and does not replicate the BRTI settlement index.'],
    decision:{decision:'UP',stake:2,limit:.65,confidence:.78,reason:'The 12.4-point edge exceeds the simulated fees.'},
    risk:{allowed:true,contracts:3,worstCaseUsd:2,orderMode:'SIMULATED_IOC',ordersSent:0},
    simulation:{filled:3,fillPrice:.62,feeCents:5,closeIndex:83018.72,pnlUsd:1.09},
  };
}
