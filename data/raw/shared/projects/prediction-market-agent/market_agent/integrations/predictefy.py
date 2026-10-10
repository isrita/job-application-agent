"""Initial catalog request: authenticated, read-only REST."""

from datetime import datetime, timezone
from importlib.metadata import PackageNotFoundError, version
import os
import re

from predictefy import Predictefy, PredictefyError


class IntegrationError(Exception):
    def __init__(self, code, message, *, http_status=None, retryable=False):
        super().__init__(message)
        self.details = {
            "status": "not_verified", "code": code, "message": message,
            "http_status": http_status, "retryable": retryable,
            "automatic_retry": False,
        }


def integration_status():
    """Local diagnostics; never authenticates or prints the key."""
    try:
        sdk_version = version("predictefy")
    except PackageNotFoundError:
        sdk_version = None
    return {
        "integration": "predictefy", "sdk_version": sdk_version,
        "api_key_present": bool(os.environ.get("PREDICTEFY_API_KEY", "").strip()),
        "authentication": "not_checked", "read_only": True,
        "automatic_polling": False, "api_calls": 0,
    }


def fetch_catalog(*, limit=3, api_key=None, transport=None):
    """One catalog page; preserve data and metadata without calculating signals.

    ``transport`` tests the real SDK with mocked HTTP, without network access.
    No automatic pagination or retries.
    """
    if type(limit) is not int or not 1 <= limit <= 10:
        raise IntegrationError("INVALID_LIMIT", "Limit must be an integer between 1 and 10.")
    key = (api_key if api_key is not None else os.environ.get("PREDICTEFY_API_KEY", "")).strip()
    if not key:
        raise IntegrationError(
            "MISSING_API_KEY",
            "Save PREDICTEFY_API_KEY in .env and run uv run --env-file .env --locked "
            "python -m market_agent predictefy markets. Do not share the key in chat.",
        )
    started_at = datetime.now(timezone.utc).isoformat()
    try:
        with Predictefy(api_key=key, retry_on_429=False, timeout=20.0,
                       transport=transport) as client:
            markets = client.router.fetch_markets({"limit": limit})
    except PredictefyError as error:
        # Third-party messages are not included in logs or LLM context.
        code = error.code if re.fullmatch(r"[A-Z][A-Z0-9_]{0,63}", error.code) else "SDK_ERROR"
        messages = {
            401: "The API key was rejected. Review or rotate it in the portal.",
            402: "The account has insufficient credits. Check its portal balance.",
            403: "Read permission or the required plan is missing. Check the portal.",
            429: "Rate limit reached. Respect Retry-After before another attempt.",
        }
        raise IntegrationError(
            code, messages.get(error.status, "Predictefy could not complete the request; no data was verified."),
            http_status=error.status, retryable=error.retryable,
        ) from None
    if not isinstance(markets, list) or any(
        not isinstance(row, dict) or not isinstance(row.get("marketId"), str)
        or not isinstance(row.get("title"), str) for row in markets
    ):
        raise IntegrationError("INVALID_RESPONSE", "The catalog does not satisfy the ID and title contract.")
    return {
        "status": "authenticated_query_succeeded", "integration": "predictefy",
        "endpoint": "/api/router/fetchMarkets", "requested_limit": limit,
        "count": len(markets), "markets": list(markets),
        "meta": getattr(markets, "meta", None), "page": getattr(markets, "page", None),
        "next_cursor": getattr(markets, "next_cursor", None),
        "request_started_at": started_at,
        "received_at": datetime.now(timezone.utc).isoformat(),
        "data_validation": "catalog_only_not_assessed_for_signals",
        "api_calls": 1, "llm_calls": 0, "orders_sent": 0,
    }
