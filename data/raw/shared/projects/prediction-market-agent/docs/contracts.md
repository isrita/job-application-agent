# Sports contracts and signal specification

The current `market_agent/domain.py` models binary USD 1 contracts and snapshots.
It is an implemented data contract, not a sports adapter or signal engine. Its
schema must be extended deliberately before accepting other payoff structures.

## Canonical fixture and contract

A fixture record must identify sport, competition, canonical participant IDs,
scheduled UTC start, and venue fixture IDs. Normalize aliases using reviewed
mappings; do not join markets solely by similar titles. Rescheduling creates a
versioned change rather than overwriting the original fixture evidence.

The contract fingerprint includes market type, line/threshold and unit, outcome
orientation, period, overtime handling, draw handling, settlement source,
postponement/cancellation/void rules, payout, collateral, and rules version.
For example, regulation-time winner and winner including overtime are not the
same settlement definition. Unknown rules require human evidence review.

Required review fields are `resolution_evidence`, `reviewed_by`, review time,
fingerprint, and compatibility decision. The LLM proposes a match; its confidence
does not set approval automatically. A rules change invalidates cached review.

Initial integration scope: a reviewed pair of binary equivalent contracts with
USD 1 equivalent payouts. A soccer 1X2 market must cover home, draw, and away;
it cannot be treated as a two-outcome match. Spread, totals, and mixed sportsbook
odds require explicit additional payoff and stake conventions.

## Quote bundle

Keep YES and NO asks and size at every usable depth level, minimum quantity,
lot/price steps, native market and outcome IDs, open status, source/proxy identity,
capture start/end, source timestamp when present, cache age, and degraded flags.
Use Decimal for price, fees, quantity, and all financial comparisons.

Freshness is based on capture and provider cache evidence, not just the last book
change. An unchanged book can still be fresh. Preserve source-clock uncertainty;
reject future or contradictory timestamps instead of filling them with local time.
The snapshot barrier requires all legs, reviewed fingerprints, bounded capture
skew, and configurable age limits. Thresholds must be measured per transport and
sport; no BTC-specific timing or presumed soft/reference speed is inherited.

## Coverage and costs

For each candidate quantity, walk executable ask depth on every leg and verify
minimum size, lot rounding, fees, fixed charges, and collateral/FX assumptions.
A midpoint or last trade cannot replace a purchasable ask.

For matched binary YES/NO contracts with equivalent USD 1 payout, the conditional
net margin is:

```text
net_margin(q) = q - YES_depth_cost(q) - NO_depth_cost(q)
                - verified_fees(q) - fixed_costs - conservative_buffers
```

Generalize through a payoff matrix over every permitted settlement state:
`min_state(total_payout) - total_cost`. Include void, cancellation, and draw
scenarios where applicable. Unknown fees or settlement behavior reject the
candidate. The formula assumes the matched quantities and compatible payouts;
partial execution, changing liquidity, and collateral differences remain material.

The same-outcome gap `YES_A - YES_B` is a latency or relative-value observation,
not complementary coverage. ML probabilities can support future directional
research, but they are not part of an arbitrage proof.

## Results

| Class | Meaning |
| --- | --- |
| `price_gap` | Same-outcome price difference; no coverage claim |
| `equivalence_pending` | Rules or fixture mapping await evidence review |
| `invalid_observation` | Missing, closed, stale, degraded, or inconsistent data |
| `unknown_costs` | Fee/collateral assumptions lack verified evidence |
| `insufficient_liquidity` | Not enough executable depth for matched quantities |
| `coverage_candidate` | Conditional positive margin after costs and compatible payouts |
| `risk_rejected` | Candidate fails deterministic policy |
| `paper_plan` | Non-executing legs linked to a snapshot and policy version |

Every result carries evidence IDs, rule and fee versions, policy version, source
and capture times, quantities, depth costs, and rejection reasons. Paper outcomes
must be separated from actual fills. No order endpoint belongs to the sports MVP.
