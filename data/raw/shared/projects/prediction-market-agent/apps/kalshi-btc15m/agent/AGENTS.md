# KXBTC15M decision agent

## Strategy

Take exactly one frozen snapshot five minutes after each 15-minute window opens.
Compare the baseline model probability for UP with the Kalshi prices and trade only
when the disagreement remains positive after taker fees. Skipping is free and is
usually the correct answer.

## Market rules

- The goal is profit after fees over many windows. Skipping is free and often right.
- UP/YES wins when the 60-second average of CF Benchmarks BRTI before close is at
  least the target (`floor_strike`), which is the 60-second average before open.
- A winning contract pays USD 1.00. A losing contract pays USD 0.
- Binance BTC/USDT is a proxy baseline and does not reproduce the BRTI index.
- Taker fees apply to every fill.

## Output

- Return one JSON object only. Choose exactly `UP`, `DOWN`, or `SKIP`.
- Write the reason in English.
- For `UP` or `DOWN`, provide `stake` in USD from 1 to 2, `limit` from 0.01 to
  0.99, `confidence` from 0 to 1, and a `reason` of at most 200 characters.
- For `SKIP`, set `stake` and `limit` to 0.
- The bot sends at most one immediate-or-cancel order at the price cap. It takes
  what is offered at that cap or better and cancels the remainder.
- Price can move while the answer is produced. For a large edge, the limit may be
  at most 3 cents above the current ask for that side, and never above the model's
  probability for that side minus 3 cents.
- Code enforces stake, one-trade-per-window, daily-loss and balance-floor limits.
  A decision that breaks them is not sent.
- Decide from the snapshot alone. Do not run commands, read files, browse, or ask
  for more data.
