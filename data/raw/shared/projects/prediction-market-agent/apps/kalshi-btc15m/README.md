# Kalshi BTC 15M

An isolated application for reviewing and running the default `KXBTC15M` strategy
with deterministic risk controls. Node executes TypeScript directly; the only
dependency is `@predictefy/sdk@1.0.0-beta.9`.

## Visual review

The interface starts with a demonstration snapshot. It requires no credentials,
makes no market requests, and provides no endpoint for submitting orders.

```powershell
npm install
npm run ui
```

Open http://127.0.0.1:8770.

The workflow follows one window: Predictefy and Kalshi → model → snapshot →
Codex → risk checks → simulated IOC → illustrative settlement.
Select a timeline milestone to review the opening, snapshot, close, or result.
**Replay example** walks through these stages without calling any APIs.

The interface shows the target, BTC price, momentum, volatility, baseline
probability, order book, AI decision, limits, and risk-gate result. All example data
and outcomes are labeled as demonstrations.

The **Dry-run history** panel reads the dry-mode ledger and local events through a
manual refresh button. It shows PnL, reservations, and stops without querying APIs
or sending orders. Interface text, terminal messages, and AI reasons use English.

## External configuration

Commands using real data read an external `.env` through `parseEnv`. Its values are
not copied into `process.env`. The default location is:

```text
C:\Users\IsraelJesusBonillaDe\Documents\prediction-market-secrets\.env
```

The file contains:

```dotenv
PREDICTEFY_API_KEY=...
KALSHI_API_KEY_ID=...
KALSHI_PRIVATE_KEY_PATH=C:\Users\IsraelJesusBonillaDe\Documents\prediction-market-secrets\kalshi-private-key.pem
```

To use another location, set only its path; do not put keys on the command line:

```powershell
$env:KALSHI_BOT_ENV_FILE='D:\secrets\kalshi-bot.env'
```

## Commands

```powershell
npm test
npm run balance
npm run check
npm run bot -- --windows=1
node src/main.ts --live --windows=1
```

- `balance` verifies the key through a read-only request and displays the total
  balance and Crypto shard balance.
- `check` prints a real snapshot without an AI call or any orders.
- `bot` runs in dry mode and simulates an IOC against the observed order book.
- `--windows=N` stops after N processed windows. If startup misses the snapshot
  time, the bot waits for the next window without consuming that count. It waits
  for the final window to close and checks its result. If the result has not been
  published, it retains the reservation for reconciliation on the next run.
- A `STOP` file in this directory or `Ctrl+C` stops the loop.
- `--live` requires typing exactly `LIVE`. Codex must not run this command.
- `--test-order`, `--test-order=up`, and `--test-order=down` also require `--live`
  and the `LIVE` confirmation. All risk limits remain active.

Before live mode, manually fund **Account → Exchange indexes → Crypto (index 2)**
in Kalshi. The bot never transfers money between accounts or shards. If the Crypto
balance cannot cover the worst case or reaches the USD 4 floor, it sends no order.

## Default limits

- USD 1–2 of risk per trade, converted into whole contracts including fees.
- At most one trade per window.
- A daily stop until midnight in `America/Lima` after a USD 3 daily loss.
- A persistent stop when available Crypto funds reach USD 4.
- One snapshot and one AI response per window. The window is recorded before the
  call, so restarting does not repeat the decision.
- BTC data older than 5 seconds causes `SKIP`.
- Weekly Codex usage at or above 80% causes `SKIP`.

State is separated by mode in `data/state-dry.json` and `data/state-live.json`.
Events are written to `data/events-YYYY-MM-DD.jsonl`. A reservation is persisted
before order submission. A network error leaves the outcome unknown for
reconciliation; the bot does not retry the order blindly.

Pending orders are checked against terminal orders and their fills before
reservations are released or PnL is settled. An incomplete response does not mean
zero fills. A lock prevents simultaneous bot processes. STOP interrupts waits and
cancels the AI request; reservations for orders already submitted are retained.

Dry mode maintains an initial simulated balance and applies its own PnL when
checking limits. Its decisions do not change real balances.

Codex CLI must be installed and authenticated. On Windows, the bot invokes
`codex.exe` directly with stdin closed, without a shell, inherited rules, or tools.
The `.env` and valid RSA PEM files must remain outside the entire repository,
including when symbolic links are used. The AI receives the snapshot, not the keys.

Binance BTC/USDT is a proxy for the baseline model. It does not reproduce the BRTI
index used for Kalshi contract settlement.
