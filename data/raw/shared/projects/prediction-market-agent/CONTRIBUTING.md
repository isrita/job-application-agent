# Contributing

Read AGENTS.md and the architecture, contract, and data-platform documents first.
Use small branches and pull requests describing the behavior, validation, and limitations.
Keep text in English and configuration portable; do not commit machine-specific credentials.

## Development

```powershell
uv sync --locked
npm ci --prefix apps/kalshi-btc15m
uv run --locked python -m unittest discover -s tests -v
uv run --locked python -m market_agent doctor
uv run --locked python -m market_agent blueprint
npm test
npm run check
```

Commit lockfiles when deliberately changing dependencies. Keep the reference app independent.
Do not create empty implementation packages to imply functionality that is not implemented.
Add meaningful offline tests when introducing adapters, financial rules, migrations, or recovery behavior.
Tests and CI must not require API keys, paid models, or live trades.

All monetary calculations use Decimal. New/changed settlement matches require human evidence review.
Unknown costs, stale quotes, or incomplete coverage produce rejection records rather than optimistic signals.
Schema deployment must use versioned migrations and preserve replayable raw evidence.
