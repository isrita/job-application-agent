"""Unit tests for parsers and skill extraction."""
import unittest
from pathlib import Path
import tempfile

from job_agent.ingestion.parsers import (
    compute_file_hash, parse_document_file, extract_skills_from_text
)


class TestParsers(unittest.TestCase):
    def test_compute_hash(self):
        with tempfile.NamedTemporaryFile("w+", delete=False, encoding="utf-8") as f:
            f.write("Hello Data Engineering")
            temp_path = Path(f.name)

        try:
            h1 = compute_file_hash(temp_path)
            self.assertEqual(len(h1), 64)
            h2 = compute_file_hash(temp_path)
            self.assertEqual(h1, h2)
        finally:
            temp_path.unlink()

    def test_extract_skills_from_text(self):
        sample_text = (
            "Senior Data Engineer experienced in Python, PySpark, Databricks, "
            "Azure Data Factory, SQL, and Docker. Also familiar with Scrum and System Design."
        )
        skills = extract_skills_from_text(sample_text)
        skill_names = [s["name"].lower() for s in skills]

        self.assertIn("python", skill_names)
        self.assertIn("pyspark", skill_names)
        self.assertIn("databricks", skill_names)
        self.assertIn("azure data factory", skill_names)
        self.assertIn("sql", skill_names)
        self.assertIn("docker", skill_names)


if __name__ == "__main__":
    unittest.main()
