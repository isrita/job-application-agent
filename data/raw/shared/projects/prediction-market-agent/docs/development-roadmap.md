# Next development session: October 4, 2026

Operator time zone: **America/Lima**. This is a development checklist, not a
scheduled task. Goal: connect one reviewed sports fixture across two prediction
venues, persist observations, and produce a reproducible paper-only comparison.

## Session order and acceptance criteria

1. **Choose scope.** Select sport/competition, one upcoming fixture, and the first
   two venues. Polymarket and Kalshi are proposed; additional soft venues remain
   unselected. Start with compatible binary USD 1 contracts. Confirm exact period,
   overtime, draw, void, and settlement rules. Save evidence and native IDs.
2. **Probe provider capabilities.** Inspect the installed SDK signatures, account
   permissions, route availability, timestamps, venue identity, degraded/cache
   flags, and depth availability. Published sports discovery methods are not proof
   that the currently pinned Python SDK supports them. Record a capability matrix
   before any deliberate SDK upgrade; retain lockfiles and test the change.
3. **Implement a read-only adapter contract.** Methods: capabilities, fixture
   discovery, contract/rules lookup, executable order-book capture, and settlement
   lookup. Each result retains raw provenance and transport timestamps. No order,
   wallet-management, or transfer methods belong to this interface.
4. **Run one explicit authenticated capture.** Bounded requests, no automatic
   pagination or blind retries. A missing key, quota, permission, or unsupported
   book capability produces an actionable error, never fake successful data.
   Accept only when both venues return the required executable depth and metadata.
5. **Deploy local evidence persistence.** Apply a versioned migration based on
   `storage/schema.sql`. Persist Bronze before Silver. Normalize decimal values,
   fixture/outcome mappings, rule fingerprints, and capture times. Replay the raw
   capture without network access and reproduce the normalized bundle.
6. **Implement the coverage evaluator.** Walk depth for matched quantities,
   include verified fees and conservative buffers, evaluate every settlement
   state, and distinguish gap/candidate/rejection. Test missing draw coverage,
   incompatible overtime, unknown fees, stale data, and insufficient liquidity.
7. **Wire the first LangGraph slice.** Install and pin a compatible runtime and
   SQLite checkpoint backend after reviewing official docs. Implement research
   review → collection → normalization → frozen bundle → deterministic evaluation
   → paper plan / rejection → Gold. Test pause, restart, resume, and fresh recapture.
8. **Adapt the visual template.** Show selected fixture, each venue and outcome,
   snapshot provenance, rule-review status, net margin, risk checks, paper legs,
   and trace IDs. Use the reference layout; remove BTC-only labels in the new
   sports interface. Keep the reference app independently runnable.

## Definition of done

- Both venues have a verified read-only sports capability record.
- One fixture match has reviewed resolution evidence and a versioned fingerprint.
- One coherent multi-venue snapshot is stored with Bronze → Silver → Gold lineage.
- Offline replay reproduces the same candidate or rejection and cost breakdown.
- A rejected case is as visible and traceable as a positive candidate.
- Restart does not lose review state or repeat a logical paper decision.
- No real orders, transfers, wallet keys, paid LLM calls, or polling are activated
  as a side effect of setup. Model calls require explicit budget and evaluation.

## Deferred research

Forecasting, ML feature pipelines, cloud lakehouse infrastructure, automated
execution, and expansion to 1X2/spreads/totals are later milestones. First validate
one pair with real books and rules. Account access, sport selection, and additional
venue selection remain inputs; architecture setup cannot invent them.

## Resume commands

```powershell
uv run --locked python -m market_agent doctor
uv run --locked python -m market_agent blueprint
uv run --locked python -m market_agent plan --task "Connect a reviewed sports fixture across Polymarket and Kalshi"
npm run dev
```

Read `docs/architecture.md`, `docs/contracts.md`, `docs/data-platform.md`, and
`docs/integrations/predictefy.md` before implementing the first adapter.
