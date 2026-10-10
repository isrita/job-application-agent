import io
import json
import os
from contextlib import redirect_stderr, redirect_stdout
import unittest
from unittest.mock import patch

import httpx

from market_agent.cli import main
from market_agent.integrations.predictefy import IntegrationError, fetch_catalog, integration_status


class PredictefyTests(unittest.TestCase):
    def test_real_sdk_uses_one_authenticated_get_and_preserves_metadata(self):
        requests = []
        row = {"marketId": "m1", "title": "Example", "asOf": None,
               "sourceExchange": "rain", "provenance": {"source": "fixture"},
               "sourceMetadata": {"synthetic": True}, "capabilities": {"depth": False},
               "outcomes": [{"outcomeId": "o1", "side": "yes", "label": "Over", "price": None}]}
        meta = {"asOf": "2026-10-03T10:00:00Z", "degraded": True}
        page = {"limit": 3, "hasMore": True, "nextCursor": "cursor-1"}

        def handler(request):
            requests.append(request)
            return httpx.Response(200, json={"success": True, "data": [row], "meta": meta, "page": page})

        result = fetch_catalog(api_key="unit-test-not-a-real-key", transport=httpx.MockTransport(handler))
        self.assertEqual(len(requests), 1)
        self.assertEqual(requests[0].method, "GET")
        self.assertEqual(requests[0].url.host, "data.predictefy.com")
        self.assertEqual(requests[0].url.path, "/api/router/fetchMarkets")
        self.assertEqual(dict(requests[0].url.params), {"limit": "3"})
        self.assertEqual(requests[0].headers["authorization"], "Bearer unit-test-not-a-real-key")
        self.assertEqual(result["markets"], [row])
        self.assertEqual(result["meta"], meta)
        self.assertEqual(result["page"], page)
        self.assertEqual(result["next_cursor"], "cursor-1")
        self.assertEqual(result["data_validation"], "catalog_only_not_assessed_for_signals")
        self.assertEqual(result["orders_sent"], 0)

    def test_missing_credentials_prevents_network_and_does_not_imply_verification(self):
        with patch.dict(os.environ, {}, clear=True), patch(
            "market_agent.integrations.predictefy.Predictefy"
        ) as constructor:
            with self.assertRaises(IntegrationError) as caught:
                fetch_catalog()
            self.assertEqual(caught.exception.details["code"], "MISSING_API_KEY")
            constructor.assert_not_called()
            status = integration_status()
            self.assertFalse(status["api_key_present"])
            self.assertEqual(status["authentication"], "not_checked")

    def test_auth_credit_permission_and_rate_errors_do_not_retry_or_leak_key(self):
        for status, code in [(401, "UNAUTHORIZED"), (402, "INSUFFICIENT_CREDITS"),
                             (403, "PLAN_REQUIRED"), (429, "RATE_LIMITED")]:
            with self.subTest(status=status):
                requests = []

                def handler(request):
                    requests.append(request)
                    return httpx.Response(status, json={"success": False, "error": {
                        "code": code, "message": "secret-test-key", "retryable": True}},
                        headers={"Retry-After": "0"})

                with self.assertRaises(IntegrationError) as caught:
                    fetch_catalog(api_key="secret-test-key", transport=httpx.MockTransport(handler))
                self.assertEqual(len(requests), 1)
                self.assertEqual(caught.exception.details["code"], code)
                self.assertEqual(caught.exception.details["status"], "not_verified")
                self.assertNotIn("secret-test-key", json.dumps(caught.exception.details))

    def test_empty_success_is_reported_as_zero_markets(self):
        transport = httpx.MockTransport(lambda request: httpx.Response(
            200, json={"success": True, "data": []}))
        result = fetch_catalog(api_key="test-only", transport=transport)
        self.assertEqual(result["count"], 0)
        self.assertEqual(result["status"], "authenticated_query_succeeded")

    def test_malformed_catalog_is_not_reported_as_success(self):
        transport = httpx.MockTransport(lambda request: httpx.Response(
            200, json={"success": True, "data": [{"unexpected": "value"}]}))
        with self.assertRaises(IntegrationError) as caught:
            fetch_catalog(api_key="test-only", transport=transport)
        self.assertEqual(caught.exception.details["code"], "INVALID_RESPONSE")

    def test_limit_is_bounded_before_constructing_client(self):
        for limit in (0, 11, True, "3"):
            with self.subTest(limit=limit), patch("market_agent.integrations.predictefy.Predictefy") as client:
                with self.assertRaises(IntegrationError):
                    fetch_catalog(limit=limit, api_key="test-only")
                client.assert_not_called()

    def test_cli_status_offline_and_missing_key_exit_code(self):
        with patch.dict(os.environ, {}, clear=True):
            with patch("sys.argv", ["market_agent", "predictefy", "status"]), redirect_stdout(io.StringIO()) as output:
                self.assertEqual(main(), 0)
                self.assertEqual(json.loads(output.getvalue())["api_calls"], 0)
            with patch("sys.argv", ["market_agent", "predictefy", "markets"]), redirect_stderr(io.StringIO()) as error:
                self.assertEqual(main(), 2)
                self.assertEqual(json.loads(error.getvalue())["code"], "MISSING_API_KEY")
