import sqlite3
from pathlib import Path
import unittest


class SchemaTests(unittest.TestCase):
    def setUp(self):
        self.db = sqlite3.connect(':memory:')
        schema = Path(__file__).resolve().parents[1] / 'storage/schema.sql'
        self.db.executescript(schema.read_text(encoding='utf-8-sig'))
        self.db.execute("INSERT INTO ops_scan_runs VALUES ('scan','prepared','2026-10-03T12:00:00Z','policy-v1')")

    def tearDown(self):
        self.db.close()

    def test_bronze_is_append_only(self):
        self.db.execute("""INSERT INTO bronze_observations VALUES
            ('raw','scan','fixture-venue','market','book','fixture-provider',
             '2026-10-03T12:00:00Z','2026-10-03T12:00:01Z',NULL,'hash','{}','{}')""")
        for statement in ("UPDATE bronze_observations SET payload_json='{}'", "DELETE FROM bronze_observations"):
            with self.subTest(statement=statement), self.assertRaises(sqlite3.IntegrityError):
                self.db.execute(statement)

    def test_silver_requires_raw_lineage(self):
        with self.assertRaises(sqlite3.IntegrityError):
            self.db.execute("INSERT INTO silver_contracts VALUES ('contract',1,'fixture','venue','market','rules','{}','missing')")

    def test_paper_plan_cannot_record_real_execution(self):
        self.db.execute("""INSERT INTO gold_signals VALUES
            ('signal','scan',NULL,'invalid_observation','policy-v1','{}','{}','2026-10-03T12:00:01Z')""")
        for status, orders in [('executed',0), ('prepared_not_executed',1)]:
            with self.subTest(status=status,orders=orders), self.assertRaises(sqlite3.IntegrityError):
                self.db.execute('INSERT INTO gold_paper_plans VALUES (?,?,?,?,?)',('paper','signal','[]',status,orders))
        self.db.execute("INSERT INTO gold_paper_plans VALUES ('paper','signal','[]','prepared_not_executed',0)")
