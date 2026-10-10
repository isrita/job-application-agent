"""Inspect and validate the proposed graph; no runtime, network, or model calls."""


def validate_workflow(data):
    steps = data["workflow"]["steps"]
    nodes = {step["id"] for step in steps}
    if len(nodes) != len(steps):
        raise ValueError("Duplicate workflow nodes")
    edges = data["workflow"]["edges"]
    if not {"resolve_scope", "finish", "human_approval", "freeze_snapshot"} <= nodes:
        raise ValueError("Missing required workflow boundaries")
    seen = set()
    outgoing = {}
    for edge in edges:
        source, target, condition = edge["source"], edge["target"], edge["condition"]
        if source not in nodes or target not in nodes or not condition:
            raise ValueError("Invalid workflow edge")
        if (source, condition) in seen:
            raise ValueError("Ambiguous conditional route")
        seen.add((source, condition))
        outgoing.setdefault(source, set()).add(target)
    if outgoing.get("finish"):
        raise ValueError("The finish node must be terminal")
    reachable = set()
    queue = ["resolve_scope"]
    while queue:
        current = queue.pop()
        if current in reachable:
            continue
        reachable.add(current)
        queue.extend(outgoing.get(current, ()))
    if reachable != nodes:
        raise ValueError("Unreachable workflow nodes")
    required_routes = {
        ("match_contracts", "human_approval", "review_required"),
        ("human_approval", "collect_quotes", "approved_with_evidence"),
        ("freeze_snapshot", "quarantine", "stale_or_incomplete"),
        ("risk_checks", "paper_plan", "allowed"),
    }
    actual = {(e["source"], e["target"], e["condition"]) for e in edges}
    if not required_routes <= actual:
        raise ValueError("Required review or data-quality route is missing")


def blueprint(architecture):
    validate_workflow(architecture.data)
    return {
        "status": "prepared_not_executed",
        "mode": "monitor_and_signals",
        "engine": "langgraph_planned",
        "langgraph_runtime_implemented": False,
        "graphs": architecture.data["orchestration"]["graphs"],
        "nodes": architecture.data["workflow"]["steps"],
        "edges": architecture.data["workflow"]["edges"],
        "storage": architecture.data["storage"],
        "api_calls": 0,
        "llm_calls": 0,
        "orders_sent": 0,
    }
