import { orderWorstCaseCents } from "./market-math.ts";
import type { Decision, Limits } from "./types.ts";
import { validateDecision } from './ai/decision.ts';

export type RiskContext = {
  limits: Limits;
  balanceUsd: number;
  todayLossUsd: number;
  openWorstCaseUsd: number;
  alreadyTradedWindow: boolean;
  offerAvailable: boolean;
};

type RiskResult = {
  allowed: boolean;
  code: string;
  contracts: number;
  stakeUsd: number;
  worstCaseCents: number;
};

function denied(code: string): RiskResult {
  return { allowed: false, code, contracts: 0, stakeUsd: 0, worstCaseCents: 0 };
}

export function assessDecision(decision: Decision, context: RiskContext): RiskResult {
  try{validateDecision(decision);}catch{return denied('INVALID_DECISION');}
  if(![context.balanceUsd,context.todayLossUsd,context.openWorstCaseUsd].every(n=>Number.isFinite(n)&&n>=0))return denied('INVALID_ACCOUNT_STATE');
  if (decision.decision === "SKIP") return denied("AI_SKIP");
  if (context.alreadyTradedWindow) return denied("WINDOW_LIMIT");
  if (context.todayLossUsd + context.openWorstCaseUsd >= context.limits.dailyLossLimitUsd) return denied("DAILY_STOP");
  if (!context.offerAvailable) return denied("NO_OFFER");
  const stakeUsd = Math.min(context.limits.maxStakeUsd, Math.max(context.limits.minStakeUsd, decision.stake));
  let contracts = 0;
  for (let candidate = 1; candidate <= 10_000; candidate += 1) {
    if (orderWorstCaseCents(candidate, decision.limit) > Math.floor(stakeUsd * 100)) break;
    contracts = candidate;
  }
  if (!contracts) return denied("STAKE_TOO_SMALL");
  const worstCaseCents = orderWorstCaseCents(contracts, decision.limit);
  if(context.todayLossUsd+context.openWorstCaseUsd+worstCaseCents/100>context.limits.dailyLossLimitUsd)return denied('DAILY_BUDGET');
  const postTradeUsd = context.balanceUsd - context.openWorstCaseUsd - worstCaseCents / 100;
  if (postTradeUsd < context.limits.balanceFloorUsd) return denied("BALANCE_FLOOR");
  return { allowed: true, code: "ALLOWED", contracts, stakeUsd, worstCaseCents };
}
