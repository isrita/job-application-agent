type MarketLike = {
  ticker?: string;
  marketId?: string;
  series_ticker?: string;
  seriesTicker?: string;
  status?: string;
  exchange_index?: number;
  exchangeIndex?: number;
  close_time?: string;
  closeTime?: string;
  outcomes?: { outcomeId?: string; label?: string }[];
};

export function createVenueFetch(fetchImpl: typeof fetch = fetch): typeof fetch {
  return (async (input: RequestInfo | URL, init?: RequestInit) => {
    const originalUrl = input instanceof Request ? input.url : String(input);
    const url = new URL(originalUrl);
    if (url.origin === "https://external-api.kalshi.com") {
      url.protocol = "https:";
      url.host = "api.elections.kalshi.com";
    }
    const rewritten = input instanceof Request ? new Request(url, input) : url.toString();
    return fetchImpl(rewritten, init);
  }) as typeof fetch;
}

export function selectCryptoMarket(markets: MarketLike[]): MarketLike {
  const candidates = markets.filter((market) =>
    (market.series_ticker ?? market.seriesTicker) === "KXBTC15M" &&
    market.status === "open" &&
    Number(market.exchange_index ?? market.exchangeIndex) === 2,
  );
  if (candidates.length !== 1) throw new Error(`Expected one open KXBTC15M market in Crypto; found: ${candidates.length}.`);
  return candidates[0];
}

export function yesOutcomeId(market: MarketLike): string {
  const outcome = market.outcomes?.find((item) => item.label?.toLowerCase() === "yes");
  if (!outcome?.outcomeId) throw new Error("The catalog does not contain an unambiguous YES outcome.");
  return outcome.outcomeId;
}
