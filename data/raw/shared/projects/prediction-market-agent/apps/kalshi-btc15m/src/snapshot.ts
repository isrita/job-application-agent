import type { WindowSnapshot } from "./types.ts";

export function snapshotText(snapshot: WindowSnapshot): string {
  return [
    "FROZEN WINDOW SNAPSHOT",
    `generated_at=${snapshot.generatedAt}`,
    `window_id=${snapshot.windowId}`,
    `market=${snapshot.market.series}/${snapshot.market.ticker}`,
    `exchange_index=${snapshot.market.exchangeIndex}`,
    `target_usd=${snapshot.market.target}`,
    `close_time=${snapshot.market.closeTime}`,
    `btc_now_usd=${snapshot.btc.now}`,
    `btc_age_seconds=${snapshot.btc.ageSeconds}`,
    `reference_usd=${snapshot.btc.reference}`,
    `reference_source=${snapshot.btc.referenceSource}`,
    `momentum_60_usd=${snapshot.btc.momentum60 ?? "unavailable"}`,
    `momentum_180_usd=${snapshot.btc.momentum180 ?? "unavailable"}`,
    `sigma_usd_sqrt_second=${snapshot.btc.sigma}`,
    `probability_up=${snapshot.model.probabilityUp}`,
    `seconds_left=${snapshot.model.secondsLeft}`,
    `yes_bid=${snapshot.book.yesBid ?? "none"}`,
    `yes_ask=${snapshot.book.yesAsk ?? "none"}`,
    `no_ask=${snapshot.book.noAsk ?? "none"}`,
    `crypto_balance_usd=${snapshot.account.cryptoBalanceUsd}`,
    `today_pnl_usd=${snapshot.account.todayPnlUsd}`,
    `open_worst_case_usd=${snapshot.account.openWorstCaseUsd}`,
    `limits=${JSON.stringify(snapshot.limits)}`,
    `last_five_calls=${JSON.stringify(snapshot.recentCalls.slice(-5))}`,
    `notices=${JSON.stringify(snapshot.notices)}`,
  ].join("\n");
}
