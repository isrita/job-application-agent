import type { PriceBuffer } from "./price-buffer.ts";

type Level = [number, number] | { price: number; size: number };

function price(level: Level): number { return Array.isArray(level) ? Number(level[0]) : Number(level.price); }
function size(level: Level): number { return Array.isArray(level) ? Number(level[1]) : Number(level.size); }

export function parseBalance(response: unknown, exchangeIndex = 2) {
  const row = response as Record<string, unknown>;
  const breakdown = Array.isArray(row.balance_breakdown) ? row.balance_breakdown as Record<string, unknown>[] : [];
  const shard = breakdown.find((item) => Number(item.exchange_index) === exchangeIndex);
  const totalUsd = Number(row.balance_dollars ?? Number(row.balance) / 100);
  const shardUsd = Number(shard?.balance);
  if (shard?.balance===undefined||shard.balance===null||String(shard.balance).trim()===''||!Number.isFinite(totalUsd) || !Number.isFinite(shardUsd)||totalUsd<0||shardUsd<0) {
    throw new Error(`Could not read the balance for exchange_index ${exchangeIndex}.`);
  }
  return { totalUsd, shardUsd, exchangeIndex };
}

export function bestBook(book: { bids?: Level[]; asks?: Level[] }) {
  const usable=(item:Level)=>Number.isFinite(price(item))&&price(item)>0&&price(item)<1&&Number.isFinite(size(item))&&size(item)>0;
  const bids = (book.bids ?? []).filter(usable).sort((a, b) => price(b) - price(a));
  const asks = (book.asks ?? []).filter(usable).sort((a, b) => price(a) - price(b));
  const bid = bids[0];
  const ask = asks[0];
  const yesBid = bid ? price(bid) : null;
  return {
    yesBid,
    yesAsk: ask ? price(ask) : null,
    noAsk: yesBid === null ? null : Number((1 - yesBid).toFixed(3)),
    yesAskSize: ask ? size(ask) : 0,
    noAskSize: bid ? size(bid) : 0,
  };
}

export async function loadWarmup(
  client: { feeds: { fetchOHLCV(params: Record<string, unknown>): Promise<number[][]> } },
  buffer: PriceBuffer,
  nowMs = Date.now(),
): Promise<number> {
  const candles = await client.feeds.fetchOHLCV({
    feed: "binance", symbol: "BTC/USDT", timeframe: "1m", since: nowMs - 3_600_000, limit: 60,
  });
  let closed = 0;
  for (const candle of candles) {
    const [openTime, open, , , close] = candle;
    const closeTime = openTime + 59_999;
    if (closeTime > nowMs) continue;
    buffer.add(openTime, open);
    buffer.add(closeTime, close);
    closed += 1;
  }
  return closed;
}

export class ResilientTickerFeed {
  private closeSocket: (() => void) | null = null;
  private watchdog: NodeJS.Timeout | null = null;
  private reconnectTimer: NodeJS.Timeout | null = null;
  private stopped = false;
  private backoffMs = 3_000;
  private lastPriceAt = 0;
  private generation=0;

  constructor(
    privateClient: { watchFeedTicker: Function },
    privateBuffer: PriceBuffer,
    privateClock: () => number = Date.now,
  ) {
    this.client = privateClient;
    this.buffer = privateBuffer;
    this.clock = privateClock;
  }

  private client: { watchFeedTicker: Function };
  private buffer: PriceBuffer;
  private clock: () => number;

  start(): void {
    this.stopped = false;
    this.connect();
  }

  private connect(): void {
    if (this.stopped) return;
    const generation=++this.generation;this.lastPriceAt=this.clock();
    const reconnect=()=>{if(generation===this.generation)this.scheduleReconnect();};
    try {this.closeSocket = this.client.watchFeedTicker(
      { feed: "binance", symbol: "BTC/USDT" },
      (ticker: { last?: number; timestamp?: number; asOf?: string }) => {
        const value = Number(ticker.last);
        const timestamp = Number(ticker.timestamp) || Date.parse(ticker.asOf ?? "");
        if (generation===this.generation&&Number.isFinite(timestamp)&&timestamp<=this.clock()+1000&&Number.isFinite(value) && value > 0) {
          this.buffer.add(timestamp, value);
          this.lastPriceAt = this.clock();
          this.backoffMs = 3_000;
        }
      },
      { onError: reconnect, onClose: reconnect },
    );}catch{this.scheduleReconnect();return;}
    if(generation!==this.generation){this.closeSocket?.();this.closeSocket=null;return;}
    this.watchdog = setInterval(() => {
      if (!this.lastPriceAt || this.clock() - this.lastPriceAt > 30_000) this.scheduleReconnect();
    }, 5_000);
    this.watchdog.unref?.();
  }

  private scheduleReconnect(): void {
    if (this.stopped || this.reconnectTimer) return;
    this.generation++;
    if (this.watchdog) clearInterval(this.watchdog);
    const delay = this.backoffMs;
    this.backoffMs = Math.min(60_000, this.backoffMs * 2);
    this.reconnectTimer = setTimeout(() => {
      this.reconnectTimer = null;
      this.connect();
    }, delay);
    const close=this.closeSocket;this.closeSocket=null;close?.();
    this.reconnectTimer.unref?.();
  }

  stop(): void {
    this.stopped = true;
    this.generation++;
    this.closeSocket?.();
    if (this.watchdog) clearInterval(this.watchdog);
    if (this.reconnectTimer) clearTimeout(this.reconnectTimer);
  }
}
