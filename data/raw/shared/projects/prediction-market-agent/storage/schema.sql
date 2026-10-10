-- Proposed local medallion schema. Not deployed by the architecture CLI.
-- Money and quantity values are decimal strings; the application validates Decimal.
PRAGMA foreign_keys = ON;

CREATE TABLE ops_scan_runs (
    scan_id TEXT PRIMARY KEY,
    status TEXT NOT NULL,
    created_at_utc TEXT NOT NULL,
    policy_version TEXT NOT NULL
);

CREATE TABLE bronze_observations (
    observation_id TEXT PRIMARY KEY,
    scan_id TEXT NOT NULL REFERENCES ops_scan_runs(scan_id),
    venue TEXT NOT NULL,
    market_id TEXT NOT NULL,
    kind TEXT NOT NULL CHECK(kind IN ('catalog', 'rules', 'book', 'settlement')),
    provider TEXT NOT NULL,
    capture_started_at_utc TEXT NOT NULL,
    received_at_utc TEXT NOT NULL,
    source_updated_at_utc TEXT,
    payload_sha256 TEXT NOT NULL,
    payload_json TEXT NOT NULL CHECK(json_valid(payload_json)),
    transport_metadata_json TEXT NOT NULL CHECK(json_valid(transport_metadata_json))
);
CREATE TRIGGER bronze_no_update BEFORE UPDATE ON bronze_observations
BEGIN SELECT RAISE(ABORT, 'Bronze records are append-only'); END;
CREATE TRIGGER bronze_no_delete BEFORE DELETE ON bronze_observations
BEGIN SELECT RAISE(ABORT, 'Bronze records are append-only'); END;

CREATE TABLE silver_contracts (
    contract_id TEXT NOT NULL,
    version INTEGER NOT NULL CHECK(version > 0),
    event_key TEXT NOT NULL,
    venue TEXT NOT NULL,
    market_id TEXT NOT NULL,
    rules_fingerprint TEXT NOT NULL,
    canonical_definition_json TEXT NOT NULL CHECK(json_valid(canonical_definition_json)),
    bronze_observation_id TEXT NOT NULL REFERENCES bronze_observations(observation_id),
    PRIMARY KEY(contract_id, version)
);
CREATE TABLE ops_rule_reviews (
    review_id TEXT PRIMARY KEY,
    contract_id TEXT NOT NULL,
    contract_version INTEGER NOT NULL,
    rules_fingerprint TEXT NOT NULL,
    decision TEXT NOT NULL CHECK(decision IN ('approved', 'rejected')),
    reviewer TEXT NOT NULL CHECK(length(reviewer) > 0),
    evidence_json TEXT NOT NULL CHECK(json_valid(evidence_json)),
    reviewed_at_utc TEXT NOT NULL,
    FOREIGN KEY(contract_id, contract_version) REFERENCES silver_contracts(contract_id, version)
);
CREATE TABLE silver_snapshot_bundles (
    snapshot_id TEXT PRIMARY KEY,
    scan_id TEXT NOT NULL REFERENCES ops_scan_runs(scan_id),
    frozen_at_utc TEXT NOT NULL,
    bundle_sha256 TEXT NOT NULL,
    validation_policy_version TEXT NOT NULL,
    complete INTEGER NOT NULL CHECK(complete IN (0, 1))
);
CREATE TABLE silver_quotes (
    quote_id TEXT PRIMARY KEY,
    snapshot_id TEXT NOT NULL REFERENCES silver_snapshot_bundles(snapshot_id),
    contract_id TEXT NOT NULL,
    contract_version INTEGER NOT NULL,
    bronze_observation_id TEXT NOT NULL REFERENCES bronze_observations(observation_id),
    normalized_metadata_json TEXT NOT NULL CHECK(json_valid(normalized_metadata_json)),
    FOREIGN KEY(contract_id, contract_version) REFERENCES silver_contracts(contract_id, version)
);
CREATE TABLE silver_book_levels (
    quote_id TEXT NOT NULL REFERENCES silver_quotes(quote_id),
    canonical_outcome TEXT NOT NULL CHECK(canonical_outcome IN ('yes', 'no')),
    level_index INTEGER NOT NULL CHECK(level_index >= 0),
    price_decimal TEXT NOT NULL CHECK(length(price_decimal) > 0),
    size_decimal TEXT NOT NULL CHECK(length(size_decimal) > 0),
    PRIMARY KEY(quote_id, canonical_outcome, level_index)
);
CREATE TABLE silver_quarantine (
    quarantine_id TEXT PRIMARY KEY,
    bronze_observation_id TEXT NOT NULL REFERENCES bronze_observations(observation_id),
    reason_code TEXT NOT NULL,
    details_json TEXT NOT NULL CHECK(json_valid(details_json)),
    rejected_at_utc TEXT NOT NULL
);
CREATE TABLE gold_signals (
    signal_id TEXT PRIMARY KEY,
    scan_id TEXT NOT NULL REFERENCES ops_scan_runs(scan_id),
    snapshot_id TEXT REFERENCES silver_snapshot_bundles(snapshot_id),
    classification TEXT NOT NULL CHECK(classification IN (
        'price_gap', 'equivalence_pending', 'invalid_observation', 'unknown_costs',
        'insufficient_liquidity', 'coverage_candidate', 'risk_rejected', 'paper_plan')),
    policy_version TEXT NOT NULL,
    evidence_json TEXT NOT NULL CHECK(json_valid(evidence_json)),
    financial_result_json TEXT NOT NULL CHECK(json_valid(financial_result_json)),
    created_at_utc TEXT NOT NULL
);
CREATE TABLE gold_paper_plans (
    paper_plan_id TEXT PRIMARY KEY,
    signal_id TEXT NOT NULL REFERENCES gold_signals(signal_id),
    legs_json TEXT NOT NULL CHECK(json_valid(legs_json)),
    status TEXT NOT NULL CHECK(status = 'prepared_not_executed'),
    orders_sent INTEGER NOT NULL DEFAULT 0 CHECK(orders_sent = 0)
);
CREATE TABLE gold_paper_outcomes (
    paper_outcome_id TEXT PRIMARY KEY,
    paper_plan_id TEXT NOT NULL REFERENCES gold_paper_plans(paper_plan_id),
    result_json TEXT NOT NULL CHECK(json_valid(result_json)),
    source_observation_id TEXT REFERENCES bronze_observations(observation_id),
    recorded_at_utc TEXT NOT NULL
);
CREATE INDEX bronze_by_venue_market_time ON bronze_observations(venue, market_id, received_at_utc);
CREATE INDEX signals_by_scan ON gold_signals(scan_id);
