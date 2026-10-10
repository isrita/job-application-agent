"""Terminal dashboard and visual reporting for job-application-agent."""
import sys
from typing import Optional

# Ensure UTF-8 output on Windows
if sys.platform == "win32":
    try:
        sys.stdout.reconfigure(encoding="utf-8", errors="replace")
        sys.stderr.reconfigure(encoding="utf-8", errors="replace")
    except Exception:
        pass

from rich.console import Console
from rich.panel import Panel
from rich.table import Table

from job_agent.config import get_candidates
from job_agent.db.database import (
    get_documents_by_candidate, get_skills_by_candidate,
    get_applications, get_gap_learnings, get_feedbacks
)

console = Console(legacy_windows=False)


def render_dashboard(candidate_id: Optional[str] = None) -> None:
    """Renders a rich console dashboard with candidates, apps, and improvement gaps."""
    candidates = get_candidates()
    target_cands = [candidate_id] if candidate_id else list(candidates.keys())

    console.print("\n[bold cyan]==================================================================[/bold cyan]")
    console.print("[bold yellow][*] JOB APPLICATION & CONTINUOUS IMPROVEMENT AGENT - DASHBOARD[/bold yellow]")
    console.print("[bold cyan]==================================================================[/bold cyan]\n")

    for cid in target_cands:
        c_info = candidates.get(cid, {})
        full_name = c_info.get("full_name", cid.upper())
        headline = c_info.get("headline", "Candidate")

        docs = get_documents_by_candidate(cid)
        skills = get_skills_by_candidate(cid)
        apps = get_applications(candidate_id=cid)
        feedbacks = get_feedbacks(candidate_id=cid)
        gaps = get_gap_learnings(candidate_id=cid)

        # Candidate summary panel
        summary_text = (
            f"[bold green]Candidate:[/bold green] {full_name} ([cyan]{cid}[/cyan])\n"
            f"[bold]Target Role:[/bold] {headline}\n"
            f"[doc] [bold]Ingested Documents:[/bold] {len(docs)} (CVs, Certificates, Notes)\n"
            f"[skills] [bold]Mapped Skills:[/bold] {len(skills)}\n"
            f"[apps] [bold]Applications:[/bold] {len(apps)} | [feedback] [bold]Feedback Logged:[/bold] {len(feedbacks)}\n"
            f"[!] [bold]Gaps / Improvement Points:[/bold] {len(gaps)}"
        )
        console.print(Panel(summary_text, title=f"[bold white on blue] PROFILE: {full_name} [/bold white on blue]", expand=False))

        # Applications Table
        if apps:
            app_table = Table(title=f"Active Applications ({cid})", show_header=True, header_style="bold magenta")
            app_table.add_column("ID", style="dim", width=4)
            app_table.add_column("Company", style="bold")
            app_table.add_column("Role")
            app_table.add_column("Status")
            app_table.add_column("Date")

            status_colors = {
                "applied": "[blue]applied[/blue]",
                "screening": "[cyan]screening[/cyan]",
                "tech_round": "[yellow]tech_round[/yellow]",
                "offer": "[bold green]OFFER[/bold green]",
                "rejected": "[red]rejected[/red]",
                "withdrawn": "[dim]withdrawn[/dim]"
            }

            for a in apps[:5]:
                status_display = status_colors.get(a["status"], a["status"])
                app_table.add_row(
                    str(a["id"]),
                    a["company"],
                    a["role_title"],
                    status_display,
                    str(a.get("applied_date", "-"))
                )
            console.print(app_table)

        # Gaps / Learnings Table
        if gaps:
            gap_table = Table(title=f"Critical Gaps & Improvement Feedback ({cid})", show_header=True, header_style="bold red")
            gap_table.add_column("Topic / Gap", style="bold")
            gap_table.add_column("Category")
            gap_table.add_column("Times Detected", justify="center")
            gap_table.add_column("Status")
            gap_table.add_column("Improvement Plan")

            for g in gaps[:5]:
                status_style = "[green]mastered[/green]" if g["status"] in ("resolved", "mastered") else "[bold yellow]identified[/bold yellow]"
                gap_table.add_row(
                    g["topic"],
                    g["category"],
                    f"[bold red]{g['occurrence_count']}[/bold red]",
                    status_style,
                    (g["improvement_plan"] or "-")[:60] + "..." if len(g.get("improvement_plan") or "") > 60 else (g.get("improvement_plan") or "-")
                )
            console.print(gap_table)
        else:
            console.print(f"[italic dim]No gaps recorded yet for {cid}. Log interview feedback to populate automatically.[/italic dim]")

        console.print("\n")
