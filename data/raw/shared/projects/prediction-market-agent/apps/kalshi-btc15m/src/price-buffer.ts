import type { PricePoint } from "./types.ts";

export class PriceBuffer {
  #points: PricePoint[] = [];
  private retentionMs: number;

  constructor(retentionMs = 3_600_000) {
    this.retentionMs = retentionMs;
  }

  add(timestampMs: number, price: number): void {
    if (!Number.isFinite(timestampMs) || !Number.isFinite(price) || price <= 0) return;
    this.#points=this.#points.filter(point=>point.timestampMs!==timestampMs);
    this.#points.push({ timestampMs, price });
    this.#points.sort((a, b) => a.timestampMs - b.timestampMs);
    const cutoff = this.#points.at(-1)!.timestampMs - this.retentionMs;
    this.#points = this.#points.filter((point) => point.timestampMs >= cutoff);
  }

  latest(): PricePoint | null {
    return this.#points.at(-1) ?? null;
  }

  average(fromMs: number, toMs: number): number | null {
    if(!Number.isFinite(fromMs)||!Number.isFinite(toMs)||toMs<=fromMs)return null;
    const anchor=this.#points.findLast(point=>point.timestampMs<=fromMs);
    if(!anchor||fromMs-anchor.timestampMs>65_000)return null;
    const points=this.#points.filter(point=>point.timestampMs>fromMs&&point.timestampMs<toMs);
    let previous=anchor;let time=fromMs;let area=0;
    for(const point of points){
      if(point.timestampMs-previous.timestampMs>65_000)return null;
      area+=(point.timestampMs-time)*previous.price;time=point.timestampMs;previous=point;
    }
    if(toMs-previous.timestampMs>65_000)return null;
    area+=(toMs-time)*previous.price;
    return area/(toMs-fromMs);
  }

  momentum(nowMs: number, seconds: number): number | null {
    const latest = this.latest();
    const cutoff = nowMs - seconds * 1000;
    const reference = this.#points.findLast((point) => point.timestampMs <= cutoff);
    return latest && reference && cutoff-reference.timestampMs<=65_000 ? latest.price - reference.price : null;
  }

  movesSince(sinceMs: number): { delta: number; elapsedSeconds: number }[] {
    const points = this.#points.filter((point) => point.timestampMs >= sinceMs);
    return points.slice(1).map((point, index) => ({
      delta: point.price - points[index].price,
      elapsedSeconds: Math.max(0.001, (point.timestampMs - points[index].timestampMs) / 1000),
    }));
  }

  isStale(nowMs: number, maximumAgeMs = 5_000): boolean {
    const latest = this.latest();
    return !latest || latest.timestampMs>nowMs+1000 || nowMs - latest.timestampMs > maximumAgeMs;
  }

  toJSON(): PricePoint[] {
    return this.#points.slice();
  }
}
