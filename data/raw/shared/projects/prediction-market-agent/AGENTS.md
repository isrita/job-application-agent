# Repository instructions

Project: prediction-market-agent, focused on sports prediction-market arbitrage
research, monitoring, and paper signals. Read README.md, config/architecture.toml,
knowledge/project.md, docs/architecture.md, docs/contracts.md, and
 docs/development-roadmap.md before changing the core. All active text is English.
Do not import logic, data, configuration, or credentials from airport-data-agent.

The CLI doctor, context, plan, and blueprint are offline. A plan reports
prepared_not_executed. LangGraph, sports adapters, and the database are proposed,
not deployed. Do not claim live sports capability from catalog authentication.
The existing predictefy markets command makes one explicit manual read-only request.
Do not activate polling, models, or order execution as a setup side effect.

Keep keys in ignored local configuration, outside datasets, graph state, prompts,
archives, and browser responses. Do not print keys or ask for keys in chat.
Use Decimal for financial values. Canonical sports fixture and settlement evidence
is required: titles, provider matches, or LLM confidence do not prove equivalence.
Price gaps and complementary coverage candidates are distinct result classes.

The isolated apps/kalshi-btc15m example is retained as a reference template. Its
own README and docs/kalshi-btc15m.md govern it. Never execute its --live command,
confirm LIVE, or launch --test-order on behalf of the user. Its exception does not
enable execution in the sports core. Do not copy its external .env or PEM into this
repository. Do not reuse BTC models, cadence, or policy as sports defaults.

Retired prototypes are source-only ZIPs under archive/prototypes. Do not restore
them into the active dependency graph without a new task. Generated caches and
runtime files are ignored. Keep .venv, active state, credentials, and source fixtures
unless the user explicitly authorizes their removal.

Validation: npm test; npm run check;
uv run --locked python -m unittest discover -s tests;
uv run --locked python -m market_agent doctor;
uv run --locked python -m market_agent blueprint.
Schema tests use in-memory SQLite only. No tests send real orders or consume APIs.
