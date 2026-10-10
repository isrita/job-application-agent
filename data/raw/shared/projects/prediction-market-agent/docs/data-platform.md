# Data platform and research boundaries

Status: schema and ownership **proposed**, not a deployed database. Start with
SQLite for local market evidence and a separate durable graph checkpoint database.
This avoids introducing cloud infrastructure before verifying sports feeds.

Bronze preserves raw records; Silver validates and standardizes them; Gold serves
business results. This is the layered pattern described in the
[Databricks medallion guidance](https://docs.databricks.com/aws/en/lakehouse/medallion).
Our local SQLite design is an implementation proposal, not a deployed Delta lake.

| Layer | Records | Writer | Consumer |
| --- | --- | --- | --- |
| Bronze | Raw catalog, rules, book, and settlement payloads; provenance and capture times | Read-only collector + bronze writer | Replay and Silver normalization |
| Silver | Canonical fixtures/contracts, reviewed fingerprints, quote depth, snapshot bundles; quarantine | Silver builder and snapshot barrier | Signal/risk calculations and feature jobs |
| Gold | Price gaps, coverage candidates, rejections, paper plans and outcomes, explanations | Signal graph and audit writer | Sports monitor, reporting, offline research |
| Operational | Scan progress and human reviews | Coordinator/control graph | Restart and review handling |
| Checkpoints | Framework-managed thread state in a separate database | Future LangGraph checkpointer | Resume and conversation continuity |

The proposed DDL is in `storage/schema.sql`. Applying it to a real local database
is next-session work. Offline tests instantiate it only in memory to validate
append-only Bronze behavior, lineage, and non-executing paper-plan constraints.
LangGraph checkpoint tables are managed by its chosen backend, not this DDL.

## Write and replay contract

1. Assign a scan ID and write the redacted raw observation, source, market ID,
   requested route, source time, capture times, provider flags, and payload hash.
2. Normalize canonical identifiers, outcome orientation, rules, Decimal strings,
   depth, and timestamps. Each Silver row references its Bronze evidence.
3. Record rejected data in quarantine with reason codes. Do not fabricate missing
   records or mark an error response as a valid empty book.
4. Freeze a complete bundle across required legs in one transaction. The future
   snapshot validator must enforce completeness and timing; foreign keys alone do
   not prove coherence.
5. Compute signals once from the frozen snapshot and versioned rule/fee/policy
   evidence. Gold references the immutable snapshot and preserves rejection reasons.
6. Keep paper observations and settlements separate from actual venue fills.

Store timestamps in UTC; display operator times in America/Lima. Persist prices,
fees, and quantities as decimal strings and validate with Python Decimal. Never
perform financial comparisons through SQLite REAL conversions. Rules and fees
need fingerprints and effective times; changes trigger a fresh review.

Bronze is append-only. Deduplication keys include provider identity, source record
identity or payload hash, and capture identity, so an unchanged book captured later
still has fresh observation evidence. Raw persistence excludes API keys,
authorization headers, private keys, and unrelated account data. Credentials stay
outside graph state, datasets, logs, and prompts.

## Deployment progression

- **Local development:** SQLite market database, separate SQLite checkpoints,
  versioned migrations, offline replay fixtures, and explicit manual API requests.
- **After capability verification:** bounded live collectors, retention policy,
  WAL/transaction handling, backups, an evidence review UI, and metrics.
- **After a volume/latency benchmark:** consider PostgreSQL for operational writes
  and partitioned Parquet/object storage for research. If cloud lakehouse scale is
  justified, evaluate ADLS/Delta with the same layer contracts and lineage.

No airport-data-agent resources or credentials are imported. Do not introduce
Kafka, Spark, or a second paid data provider before measuring the actual workload.

## Mathematical, ML, and generative-AI work

**Mathematics first:** payout matrix, matched quantities, depth walking, verified
fees, and conservative net-margin calculations. This is the coverage engine.
Sports forecasting is a separate decision problem.

**Machine learning later:** point-in-time features for spread, liquidity, observed
latency, market state, sport/competition, and rules stability. Use chronological
and fixture-separated splits. Features must use information available at the
snapshot time; settlement results and later corrections cannot leak into training.
Evaluate on replay before using any model output, including calibration, stability,
missing-data behavior, and paper results after costs. Register dataset, model, and
feature versions. A score may rank candidates; it cannot override evidence gates.

**Generative AI:** compare rules with citations, explain recorded signals, and
assist offline research. Give it bounded structured inputs and references to
approved evidence, not the whole data lake. Generated labels remain proposals
until reviewed. Outputs and explanations use English.
