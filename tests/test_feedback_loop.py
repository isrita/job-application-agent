"""Unit tests for feedback loop and gap learning engine."""
import unittest

from job_agent.db.database import init_db, get_gap_learnings
from job_agent.core.feedback_loop import record_feedback, get_candidate_improvement_summary


class TestFeedbackLoop(unittest.TestCase):
    def setUp(self):
        init_db()

    def test_record_feedback_and_recurrence(self):
        # First feedback identifying Kafka gap
        res1 = record_feedback(
            candidate_id="israel",
            outcome="rejected",
            source="recruiter_feedback",
            raw_feedback="Candidate was strong in SQL, but lacked depth in Kafka stream partitioning.",
            gaps_identified="Kafka Partitioning: Failed to clearly explain partitioning and consumer group rebalancing",
            action_items="Study Kafka architecture and consumer rebalancing protocols."
        )
        self.assertGreater(res1["feedback_id"], 0)

        # Check gap was recorded with count 1
        gaps = get_gap_learnings("israel")
        kafka_gap = next((g for g in gaps if "Kafka" in g["topic"]), None)
        self.assertIsNotNone(kafka_gap)
        initial_count = kafka_gap["occurrence_count"]

        # Second feedback identifying the SAME gap
        res2 = record_feedback(
            candidate_id="israel",
            outcome="rejected",
            source="interview_notes",
            raw_feedback="Technical interview: Candidate struggled again with Kafka partitioning.",
            gaps_identified="Kafka Partitioning: Unclear on partitioning and offset commitments",
            action_items="Build hands-on practical lab on Databricks with Kafka."
        )

        gaps_after = get_gap_learnings("israel")
        kafka_gap_after = next((g for g in gaps_after if "Kafka" in g["topic"]), None)
        self.assertIsNotNone(kafka_gap_after)
        self.assertEqual(kafka_gap_after["occurrence_count"], initial_count + 1)

        # Improvement summary
        summary = get_candidate_improvement_summary("israel")
        self.assertGreater(summary["total_feedbacks"], 0)
        self.assertGreater(len(summary["top_recurring"]), 0)


if __name__ == "__main__":
    unittest.main()
