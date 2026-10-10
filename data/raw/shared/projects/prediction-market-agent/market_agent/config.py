from dataclasses import dataclass
from pathlib import Path
import tomllib

ROOT = Path(__file__).resolve().parents[1]


@dataclass(frozen=True)
class Architecture:
    root: Path
    data: dict

    def local_path(self, value: str) -> Path:
        path = (self.root / value).resolve()
        if not path.is_relative_to(self.root):
            raise ValueError("Context must belong to prediction-market-agent")
        return path

    def model_for(self, agent: str) -> dict | None:
        definition = self.data["agents"][agent]
        if definition["kind"] == "deterministic":
            return None
        return self.data["models"][definition["profile"]]


def load_architecture(root: Path = ROOT) -> Architecture:
    root = root.resolve()
    with (root / "config/architecture.toml").open("rb") as file:
        data = tomllib.load(file)
    if data["version"] != 1:
        raise ValueError("Unsupported configuration version")
    if data["project"]["stage"] not in {"architecture", "integration"}:
        raise ValueError("Unsupported project stage")
    for key in ("runtime_enabled", "order_execution_enabled"):
        if data["project"][key] is not False:
            raise ValueError(f"{key} is not implemented at this stage")
    if data["project"]["api_connections_enabled"] is not False:
        integration = data.get("integrations", {}).get("predictefy", {})
        if (data["project"]["api_connections_enabled"] is not True
                or data["project"]["stage"] != "integration"
                or integration.get("read_only") is not True
                or integration.get("automatic_polling") is not False
                or integration.get("activation") != "explicit_cli_command"):
            raise ValueError("Only manual read-only Predictefy requests are enabled")
    if data["models"]["policy"]["automatic_calls"] is not False:
        raise ValueError("AI calls are not enabled")
    architecture = Architecture(root, data)
    for agent, definition in data["agents"].items():
        if definition["kind"] not in {"llm", "deterministic"}:
            raise ValueError(f"Unknown agent type: {agent}")
        if definition["kind"] == "llm":
            architecture.model_for(agent)
            for key in ("prompt", "context"):
                if not architecture.local_path(definition[key]).is_file():
                    raise ValueError(f"Missing {key} for {agent}")
        if definition.get("venue") not in {None, *data["venues"]}:
            raise ValueError(f"Unknown venue: {agent}")
    identifiers = []
    for step in data["workflow"]["steps"]:
        agents = step.get("agents", [step.get("agent")])
        if not agents or not set(agents).issubset(data["agents"]):
            raise ValueError(f"Unknown specialists in {step['id']}")
        identifiers.append(step["id"])
    if len(identifiers) != len(set(identifiers)):
        raise ValueError("Duplicate workflow steps")
    from .workflow import validate_workflow
    validate_workflow(data)
    return architecture
