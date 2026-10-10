import unittest
from copy import deepcopy
from market_agent.config import load_architecture
from market_agent.workflow import blueprint, validate_workflow


class WorkflowTests(unittest.TestCase):
    def setUp(self):
        self.architecture = load_architecture()

    def test_blueprint_is_offline_and_preserves_review_and_snapshot_boundaries(self):
        result = blueprint(self.architecture)
        self.assertEqual(result['status'], 'prepared_not_executed')
        self.assertEqual((result['api_calls'], result['llm_calls'], result['orders_sent']), (0, 0, 0))
        routes = {(edge['source'], edge['target']) for edge in result['edges']}
        self.assertIn(('match_contracts', 'human_approval'), routes)
        self.assertIn(('human_approval', 'collect_quotes'), routes)
        self.assertIn(('freeze_snapshot', 'quarantine'), routes)
        self.assertIn(('risk_checks', 'paper_plan'), routes)
        self.assertFalse(result['langgraph_runtime_implemented'])

    def test_unknown_edge_target_is_rejected(self):
        data = deepcopy(self.architecture.data)
        data['workflow']['edges'][0]['target'] = 'missing_node'
        with self.assertRaises(ValueError):
            validate_workflow(data)

    def test_unreachable_node_is_rejected(self):
        data = deepcopy(self.architecture.data)
        data['workflow']['steps'].append({'id':'orphan','agent':'audit_writer'})
        with self.assertRaises(ValueError):
            validate_workflow(data)

    def test_unreviewed_matches_cannot_bypass_human_review(self):
        data = deepcopy(self.architecture.data)
        data['workflow']['edges'] = [edge for edge in data['workflow']['edges']
                                    if edge['condition'] != 'review_required']
        with self.assertRaises(ValueError):
            validate_workflow(data)
