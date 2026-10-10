# Predictefy integration

Reviewed October 3, 2026. Scope: sports research, monitoring, and paper signals.
The implemented Python adapter makes one manual read-only catalog request through
`predictefy==1.0.0b8`. It preserves raw metadata and maps errors without exposing
provider messages or credentials. No sports book adapter is implemented yet.

## Role in the architecture

Predictefy provides transport and normalized discovery; native venue identities
remain separate. Provider matches and price discrepancies are discovery inputs,
not our own equivalence approval or coverage calculation. Validate route support,
permissions, metadata, freshness, and executable depth before evaluating signals.
The [official SDK guide](https://docs.predictefy.com/guides/sdk/) describes sports
fixture discovery and price comparison, but published methods do not guarantee
support in the versions currently installed here.

Tomorrow, record capabilities for each selected venue: fixture discovery, rules,
YES/NO depth, source/capture times, degraded/cache flags, limits, and settlement
lookup. Confirm actual SDK signatures before writing adapters. Upgrade a pinned
SDK only deliberately with a reviewed lockfile and offline regression tests.
A common aggregator failure may affect multiple venue observations at once.

## Existing catalog commands

Store a read-only API key in the ignored `.env`, using `.env.example` as a template.
Never copy the key into documentation, command arguments, datasets, or AI context.

```powershell
uv run --env-file .env --locked python -m market_agent predictefy status
uv run --env-file .env --locked python -m market_agent predictefy markets --limit 3
```

`status` checks local configuration without authentication. `markets` calls
`client.router.fetch_markets({"limit": 3})` once, without automatic retries,
pagination, polling, LLM calls, or orders. An empty successful result means zero
catalog rows, not a failed request converted to success.

Errors preserve status and a safe reason: 401 requires key review; 402 requires
credit review; 403 requires permission/plan review; 429 requires respecting
Retry-After. Failures are not substituted with stale or fabricated market data.

## Verification boundary

On October 3, 2026, a single authenticated production catalog request returned
three markets, two from Kalshi and one from Polymarket. This verified catalog
access only. Sports capability, rule equivalence, executable books, and signals
remain unverified. No new authenticated request was made during the reorganization.

The originally requested [Predictefy skill](https://docs.predictefy.com/.well-known/agent-skills/predictefy/skill.md)
was used for initial setup. Existing catalog tests use the real SDK with mocked
HTTP; no credits or orders are consumed by the offline test suite.
