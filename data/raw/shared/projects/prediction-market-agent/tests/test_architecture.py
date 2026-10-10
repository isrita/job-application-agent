from dataclasses import replace
from decimal import Decimal
import unittest

from market_agent.cli import agent_context, prepare_plan
from market_agent.config import load_architecture
from market_agent.domain import Level, Market, Snapshot, timestamp, utcnow


class ArchitectureTests(unittest.TestCase):
    def setUp(self):
        self.architecture = load_architecture()

    def test_project_context_cannot_reference_airport(self):
        with self.assertRaises(ValueError):
            self.architecture.local_path("../airport-data-agent/knowledge/project.md")

    def test_collector_does_not_require_llm(self):
        self.assertIsNone(self.architecture.model_for("kalshi_collector"))

    def test_equivalence_has_separate_context_and_balanced_model(self):
        context = agent_context(self.architecture, "market_equivalence")
        self.assertEqual(context["model"]["id"], "gpt-6.1-sol")
        self.assertIn("definition", context["instructions"])
        self.assertEqual(context["thread_namespace"], "prediction:equivalence")

    def test_plan_is_preparation_with_zero_external_actions(self):
        plan = prepare_plan(self.architecture, "Compare sports contracts")
        self.assertEqual(plan["status"], "prepared_not_executed")
        self.assertEqual((plan["api_calls"], plan["llm_calls"], plan["orders_sent"]), (0, 0, 0))
        self.assertEqual(len(plan["steps"]), 16)

    def test_naive_source_time_is_rejected(self):
        with self.assertRaises(ValueError):
            timestamp("2026-10-03T10:00:00")

    def test_non_finite_money_is_rejected(self):
        with self.assertRaises(ValueError):
            Level(Decimal("NaN"), Decimal("10"))

    def test_contract_review_flag_cannot_be_string(self):
        with self.assertRaises(ValueError):
            Market.from_dict({"venue": "test", "tier": "soft", "adapter": "demo", "market_id": "a",
                              "event_key": "event", "yes_definition": "Outcome", "settlement_key": "rules",
                              "equivalence_reviewed": "false"})

    def test_snapshot_requires_capture_order(self):
        now = utcnow()
        market = Market("test", "soft", "demo", "a", "event", "Outcome", "rules")
        snapshot = Snapshot(market, {"yes": (), "no": ()}, now, now)
        with self.assertRaises(ValueError):
            replace(snapshot, received_at=timestamp("2000-01-01T00:00:00Z"))


if __name__ == "__main__":
    unittest.main()
