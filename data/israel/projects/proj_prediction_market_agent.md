---
title: Autonomous Multi-Agent Prediction Market Arbitrage & Intelligence Engine
candidate: israel
company: Autonomous Quantitative Research Project
domain: Prediction Markets, Algorithmic Sports Arbitrage & Multi-Agent State Machine Systems
tech_stack: [Python 3.11+, LangGraph, SQLite, Kalshi API, Predictefy, Pydantic, Decimal Math, uv]
key_metrics: [4-tier multi-agent LangGraph orchestration, Deterministic Decimal financial execution calculations, 100% human-in-the-loop auditability for contract equivalence]
core_topics: [Multi-Agent Orchestration, LangGraph State Machine, Deterministic Risk Evaluation, Prediction Market Arbitrage, Local Medallion Storage]
---

# Autonomous Multi-Agent Prediction Market Arbitrage & Intelligence Engine

## Executive Summary (STAR Framework)

- **Situation:** Cross-venue prediction markets (such as Kalshi and peer platforms) frequently present price discrepancies and implied probability gaps across equivalent contracts. However, naive trading bots fail because price gaps alone do not guarantee risk-free arbitrage—settlement rule differences, contract clause mismatches, liquidity depth limits, and trading fee drag can quickly invalidate potential profit.
- **Task:** Architect a human-assisted, multi-agent quantitative intelligence engine to research equivalent prediction contracts, capture immutable market depth snapshots, compute rigorous deterministic arbitrage math with zero floating-point errors, and generate auditable multi-leg paper trade plans.
- **Action:**
  1. **Multi-Agent State Machine Architecture:** Implemented a LangGraph multi-agent system coordinating four specialized workflows:
     - **Coordinator:** Manages end-to-end execution flow and task delegation.
     - **ResearchGraph:** Resolves fixture identities, scrapes settlement contracts, and generates equivalence fingerprint proposals.
     - **ObservationGraph:** Captures live order books and normalizes price depth within a coherent time snapshot barrier.
     - **SignalGraph:** Applies deterministic risk rules, fee models, and paper planning.
  2. **Human-in-the-Loop Governance Boundary:** Established a hard checkpoint requiring human verification for newly proposed or modified contract equivalence fingerprints before quotes can be analyzed.
  3. **High-Precision Deterministic Pricing:** Implemented strict Python `Decimal` arithmetic for cost, payout coverage, and liquidity calculations, completely eliminating floating-point rounding inaccuracies.
  4. **Local Medallion Analytical Storage:** Structured SQLite persistence into Bronze (raw API payloads with capture timestamps), Silver (normalized contracts and order books), and Gold layers (signal calculations, risk rejections, and multi-leg paper trade strategies).
- **Result:** Successfully delivered an institutional-grade foundation for prediction market research. Prevented phantom arbitrage trades by catching nuanced settlement rule discrepancies and established an automated paper-trading testbed with complete auditability.

---

## Multi-Agent Architecture & Workflow

```
[Coordinator Agent]
        │
        ├──► [ResearchGraph] ──────► [Equivalence Proposal Specialist]
        │                                        │
        │                                        ▼
        │                         [Human-in-the-Loop Review Gate]
        │                         (Verify Contract Settlement Rules)
        │                                        │
        ├──► [ObservationGraph] ◄────────────────┘
        │           │
        │           ▼ (Read-Only Capture & Snapshot Barrier)
        │    [Bronze: Raw Payload] ──► [Silver: Normalized Books]
        │                                        │
        └──► [SignalGraph] ◄─────────────────────┘
                    │
                    ▼ (Deterministic Decimal Math & Liquidity Depth Checks)
             [Gold: Arbitrage Signals, Risk Checks & Multi-Leg Paper Plans]
```

---

## Technical Implementation Highlights

### 1. Deterministic Math & Payout Coverage Model
Unlike stochastic ML predictors that produce uncertain probabilities, arbitrage signals require strict deterministic mathematical bounds:
```python
from decimal import Decimal

def evaluate_binary_coverage(long_yes_price: Decimal, long_no_price: Decimal, fee_rate: Decimal) -> dict:
    total_cost = long_yes_price + long_no_price + (long_yes_price + long_no_price) * fee_rate
    payout = Decimal("1.00")
    
    if total_cost < payout:
        gross_margin = payout - total_cost
        return {"is_arbitrage": True, "margin": gross_margin, "status": "APPROVED"}
    return {"is_arbitrage": False, "margin": Decimal("0.00"), "status": "NO_SPREAD"}
```

### 2. Medallion Separation in SQLite
- **Bronze Table:** Stores immutable raw venue observation payloads, HTTP timestamps, and headers.
- **Silver Table:** Stores deduplicated canonical fixtures, verified outcome mappings, and standardized book depths.
- **Gold Table:** Persists evaluated opportunities, rejection codes (e.g., `INSUFFICIENT_DEPTH`, `RULE_MISMATCH`), and simulated execution orders.

---

## Key Interview Talking Points

1. **Why LangGraph for Multi-Agent Systems:**
   - Utilizing explicit state graphs with persisted checkpoints enables pause-and-resume workflows for human-in-the-loop approvals, unlike non-deterministic agent loops.
2. **Boundary Between AI and Deterministic Code:**
   - Using LLMs only for semantic rule understanding and text summarization, while delegating financial calculations, pricing, and risk management strictly to deterministic code.
3. **Floating Point Safety in Financial Systems:**
   - Preventing IEEE 754 floating-point inaccuracies in currency pricing by mandating `Decimal` types across all data models.
