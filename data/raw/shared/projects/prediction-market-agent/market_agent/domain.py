from dataclasses import dataclass, fields, is_dataclass
from datetime import datetime, timezone
from decimal import Decimal
from typing import Any


def number(value: Any) -> Decimal:
    result = Decimal(str(value))
    if not result.is_finite():
        raise ValueError("Non-finite numeric value")
    return result


def timestamp(value: str) -> datetime:
    result = datetime.fromisoformat(value.replace("Z", "+00:00"))
    if result.tzinfo is None:
        raise ValueError("Timestamp requires a time zone")
    return result.astimezone(timezone.utc)


def utcnow() -> datetime:
    return datetime.now(timezone.utc)


def serializable(value: Any) -> Any:
    if is_dataclass(value):
        return {field.name: serializable(getattr(value, field.name)) for field in fields(value)}
    if isinstance(value, (Decimal, datetime)):
        return str(value) if isinstance(value, Decimal) else value.isoformat()
    if isinstance(value, dict):
        return {str(key): serializable(item) for key, item in value.items()}
    if isinstance(value, (list, tuple)):
        return [serializable(item) for item in value]
    return value


@dataclass(frozen=True)
class Level:
    price: Decimal
    size: Decimal

    def __post_init__(self):
        if not self.price.is_finite() or not self.size.is_finite():
            raise ValueError("Non-finite order-book level")
        if not Decimal("0") < self.price < Decimal("1") or self.size <= 0:
            raise ValueError("Price or size is out of range")


@dataclass(frozen=True)
class Market:
    venue: str
    tier: str
    adapter: str
    market_id: str
    event_key: str
    yes_definition: str
    settlement_key: str
    equivalence_reviewed: bool = False
    reviewed_by: str = ""
    resolution_evidence: str = ""
    yes_is_canonical_yes: bool = True
    payout_usd: Decimal = Decimal("1")
    collateral_equivalence_reviewed: bool = False
    fee_upper_bound_per_contract_usd: Decimal | None = None
    fixed_cost_upper_bound_usd: Decimal | None = None
    fee_verified_at: datetime | None = None
    fee_evidence: str = ""
    condition_id: str = ""
    yes_token: str = ""
    no_token: str = ""
    url: str = ""

    @classmethod
    def from_dict(cls, data: dict):
        values = dict(data)
        for key in ("payout_usd", "fee_upper_bound_per_contract_usd", "fixed_cost_upper_bound_usd"):
            if values.get(key) is not None:
                values[key] = number(values[key])
        if values.get("fee_verified_at"):
            values["fee_verified_at"] = timestamp(values["fee_verified_at"])
        market = cls(**values)
        if not all((market.venue, market.market_id, market.event_key, market.yes_definition, market.settlement_key)):
            raise ValueError("Missing identifiers or contract definition")
        for key in ("equivalence_reviewed", "yes_is_canonical_yes", "collateral_equivalence_reviewed"):
            if type(getattr(market, key)) is not bool:
                raise ValueError(f"{key} must be a boolean")
        if market.tier not in {"reference", "soft"}:
            raise ValueError("tier must be reference or soft")
        if market.payout_usd != Decimal("1"):
            raise ValueError("The MVP requires a binary USD 1 payout per contract")
        if market.adapter not in {"polymarket", "kalshi", "normalized_json", "demo"}:
            raise ValueError("Unknown adapter")
        return market


@dataclass(frozen=True)
class Snapshot:
    market: Market
    asks: dict[str, tuple[Level, ...]]
    request_started_at: datetime
    received_at: datetime
    source_updated_at: datetime | None = None
    minimum_quantity: Decimal = Decimal("1")
    is_open: bool = False
    transport: str = "rest"
    cache_age_seconds: Decimal = Decimal("0")

    def __post_init__(self):
        if set(self.asks) != {"yes", "no"}:
            raise ValueError("Both canonical outcomes are required")
        if type(self.is_open) is not bool or self.minimum_quantity <= 0:
            raise ValueError("Invalid state or minimum quantity")
        if self.received_at < self.request_started_at:
            raise ValueError("Capture timestamps are out of order")
        if self.cache_age_seconds < 0:
            raise ValueError("Negative cache age")
