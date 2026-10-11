"""Unit tests for SQLite database operations and FTS5 search."""
import unittest
from datetime import date
from pathlib import Path
import tempfile
import sqlite3

from job_agent.db.database import (
    init_db, save_document, save_application, get_applications,
    save_interview, save_feedback, upsert_gap_learning, get_gap_learnings, search_fts,
    delete_document
)
from job_agent.db.models import Document, Application, Interview, Feedback, GapLearning


class TestDatabase(unittest.TestCase):
    def setUp(self):
        init_db()

    def test_application_and_interview_flow(self):
        app = Application(
            candidate_id="israel",
            company="Tech Corp",
            role_title="Senior Data Engineer",
            job_description="Databricks and Spark pipelines",
            salary_range="100k-120k",
            status="applied"
        )
        app_id = save_application(app)
        self.assertGreater(app_id, 0)

        # Retrieve app
        apps = get_applications(candidate_id="israel")
        self.assertTrue(any(a["id"] == app_id for a in apps))

        # Add interview
        int_id = save_interview(Interview(
            application_id=app_id,
            candidate_id="israel",
            stage="tech_round_1",
            questions_asked="How do you handle small files in Delta Lake?",
            candidate_answers="By running OPTIMIZE and AUTO COMPACT."
        ))
        self.assertGreater(int_id, 0)

    def test_fts5_search(self):
        doc = Document(
            id="test_doc_01",
            candidate_id="israel",
            doc_type="certificate",
            file_name="azure_dp203.pdf",
            file_path="data/raw/israel/certificates/azure_dp203.pdf",
            file_hash="testhash123456",
            title="Microsoft Certified: Azure Data Engineer Associate",
            raw_text="Earned certification validating skills in Azure Synapse, Data Factory, and Databricks."
        )
        save_document(doc)

        # Search
        results = search_fts("Synapse Databricks", candidate_id="israel")
        self.assertTrue(len(results) > 0)
        self.assertTrue(any(r.doc_id == "test_doc_01" for r in results))
        delete_document("test_doc_01")


if __name__ == "__main__":
    unittest.main()
