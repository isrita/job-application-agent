import Predictefy from "@predictefy/sdk";

import { parseBalance } from "./data-client.ts";
import { createVenueFetch, selectCryptoMarket } from "./market-client.ts";
import type { BotConfig } from "./types.ts";

export type OpenMarket = {
  ticker: string;
  series: "KXBTC15M";
  status: "open";
  exchangeIndex: 2;
  target: number;
  openTime: string;
  closeTime: string;
  raw?: Record<string, unknown>;
};

export function createPredictefyClient(config: BotConfig) {
  return new Predictefy({
    apiKey: config.predictefyApiKey,
    retryOn429: false,
    venueFetch: createVenueFetch(),
    venueCredentials: {
      kalshi: { apiKeyId: config.kalshiApiKeyId, privateKeyPem: config.kalshiPrivateKeyPem },
    },
  });
}

export function normalizeOpenMarket(raw: Record<string, unknown>): OpenMarket {
  const selected = selectCryptoMarket([raw]) as Record<string, unknown>;
  const ticker = String(selected.ticker ?? "");
  const target = Number(selected.floor_strike);
  const openTime = String(selected.open_time ?? "");
  const closeTime = String(selected.close_time ?? "");
  if (!ticker || !Number.isFinite(target) || !Number.isFinite(Date.parse(openTime)) || !Number.isFinite(Date.parse(closeTime))) {
    throw new Error("The KXBTC15M market is missing a valid ticker, floor_strike, or schedule.");
  }
  return { ticker, series: "KXBTC15M", status: "open", exchangeIndex: 2, target, openTime, closeTime, raw };
}

export async function fetchOpenMarket(fetchImpl: typeof fetch = fetch): Promise<OpenMarket> {
  const url = "https://api.elections.kalshi.com/trade-api/v2/markets?series_ticker=KXBTC15M&status=open";
  const response = await fetchImpl(url, { headers: { Accept: "application/json" }, signal: AbortSignal.timeout(15_000) });
  if (!response.ok) throw new Error(`Kalshi market discovery failed with HTTP ${response.status}.`);
  const body = await response.json() as { markets?: Record<string, unknown>[] };
  const selected = selectCryptoMarket(body.markets ?? []) as Record<string, unknown>;
  return normalizeOpenMarket(selected);
}

export async function readAccountBalance(client: ReturnType<typeof createPredictefyClient>) {
  const response = await client.accounts.kalshi.fetchBalance();
  return parseBalance(response, 2);
}

export async function fetchMarketResult(ticker: string, fetchImpl: typeof fetch = fetch): Promise<"yes" | "no" | null> {
  const response = await fetchImpl(`https://api.elections.kalshi.com/trade-api/v2/markets/${encodeURIComponent(ticker)}`, {
    headers: { Accept: "application/json" }, signal: AbortSignal.timeout(15_000),
  });
  if (!response.ok) throw new Error(`Kalshi market result failed with HTTP ${response.status}.`);
  const body = await response.json() as { market?: { result?: string } };
  const result = body.market?.result?.toLowerCase();
  return result === "yes" || result === "no" ? result : null;
}
