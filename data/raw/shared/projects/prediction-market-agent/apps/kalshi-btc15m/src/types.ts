export type Direction = "UP" | "DOWN" | "SKIP";

export type Decision = {
  decision: Direction;
  stake: number;
  limit: number;
  confidence: number;
  reason: string;
};

export type Limits = {
  minStakeUsd: number;
  maxStakeUsd: number;
  dailyLossLimitUsd: number;
  balanceFloorUsd: number;
};

export type BotConfig = {
  envFile: string;
  predictefyApiKey: string;
  kalshiApiKeyId: string;
  kalshiPrivateKeyPath: string;
  kalshiPrivateKeyPem: string;
  timeZone: string;
  snapshotMinute: number;
  limits: Limits;
  model: string;
  reasoningEffort: string;
};

export type PricePoint = { timestampMs: number; price: number };

export type WindowSnapshot = {
  generatedAt: string;
  windowId: string;
  market: {
    series: "KXBTC15M";
    ticker: string;
    exchangeIndex: number;
    target: number;
    closeTime: string;
  };
  btc: {
    now: number;
    ageSeconds: number;
    reference: number;
    referenceSource: "binance_history" | "target_fallback";
    momentum60: number | null;
    momentum180: number | null;
    sigma: number;
  };
  model: { probabilityUp: number; secondsLeft: number };
  book: { yesBid: number | null; yesAsk: number | null; noAsk: number | null };
  account: { cryptoBalanceUsd: number; todayPnlUsd: number; openWorstCaseUsd: number };
  limits: Limits;
  recentCalls: Decision[];
  notices: string[];
};
