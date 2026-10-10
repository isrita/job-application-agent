import argparse
import json
import sys

from .config import load_architecture


def prepare_plan(architecture, task):
    return {
        "project": architecture.data["project"]["name"],
        "request": task,
        "status": "prepared_not_executed",
        "mode": "monitor_and_signals",
        "steps": architecture.data["workflow"]["steps"],
        "dependencies_pending": ["Select sport, fixtures, and additional venues", "Verify sports endpoints and venue capabilities",
                                 "Implement read-only book adapters", "Deploy persistence and LangGraph runtime"],
        "api_calls": 0, "llm_calls": 0, "orders_sent": 0,
    }


def agent_context(architecture, agent):
    definition = architecture.data["agents"][agent]
    result = {"agent": agent, **definition, "model": architecture.model_for(agent),
              "stage": architecture.data["project"]["stage"]}
    if definition["kind"] == "llm":
        result["instructions"] = architecture.local_path(definition["prompt"]).read_text(encoding="utf-8")
        result["knowledge"] = architecture.local_path(definition["context"]).read_text(encoding="utf-8")
    return result


def main():
    parser = argparse.ArgumentParser(description="Sports monitoring architecture and manual read-only requests")
    commands = parser.add_subparsers(dest="command", required=True)
    commands.add_parser("doctor")
    commands.add_parser("blueprint", help="Inspect the proposed graph offline")
    plan = commands.add_parser("plan")
    plan.add_argument("--task", required=True)
    context = commands.add_parser("context")
    context.add_argument("agent")
    predictefy = commands.add_parser("predictefy", help="Read-only REST integration")
    integration_commands = predictefy.add_subparsers(dest="integration_command", required=True)
    integration_commands.add_parser("status", help="Local diagnostics without network access")
    markets = integration_commands.add_parser("markets", help="One authenticated catalog request")
    markets.add_argument("--limit", type=int, default=3)
    args = parser.parse_args()
    try:
        architecture = load_architecture()
        if args.command == "doctor":
            result = {
                "configuration": "valid", "project_root": str(architecture.root),
                "project": architecture.data["project"],
                "agents": [{"agent": key, "kind": value["kind"], "model": architecture.model_for(key)}
                           for key, value in architecture.data["agents"].items()],
                "venues": architecture.data["venues"],
                "history_status": architecture.data["orchestration"]["history_status"],
            }
        elif args.command == "blueprint":
            from .workflow import blueprint
            result = blueprint(architecture)
        elif args.command == "plan":
            result = prepare_plan(architecture, args.task)
        elif args.command == "context":
            result = agent_context(architecture, args.agent)
        else:
            from .integrations.predictefy import IntegrationError, fetch_catalog, integration_status
            try:
                if args.integration_command == "status":
                    result = integration_status()
                else:
                    if architecture.data["project"]["api_connections_enabled"] is not True:
                        raise IntegrationError("INTEGRATION_DISABLED", "API requests are disabled.")
                    result = fetch_catalog(limit=args.limit)
            except IntegrationError as error:
                print(json.dumps(error.details, ensure_ascii=False, indent=2), file=sys.stderr)
                return 2
        print(json.dumps(result, ensure_ascii=False, indent=2))
        return 0
    except (ValueError, KeyError, OSError) as error:
        print(f"Configuration error: {error}", file=sys.stderr)
        return 1
