"""Command-line interface for job-application-agent."""
import sys
from pathlib import Path
from typing import Optional

# Ensure UTF-8 output on Windows
if sys.platform == "win32":
    try:
        sys.stdout.reconfigure(encoding="utf-8", errors="replace")
        sys.stderr.reconfigure(encoding="utf-8", errors="replace")
    except Exception:
        pass

import click
from rich.console import Console
from rich.table import Table

from job_agent.config import (
    PROJECT_ROOT, RAW_DATA_DIR, KNOWLEDGE_DIR, get_candidates, get_db_path, SCHEMA_FILE
)
from job_agent.db.database import (
    init_db, search_fts, get_all_documents, get_gap_learnings, get_applications
)
from job_agent.ingestion.pipeline import (
    ingest_all, ingest_candidate_files, sync_candidate_knowledge_files
)
from job_agent.core.interview_tracker import (
    register_application, log_interview_round, list_candidate_applications
)
from job_agent.core.feedback_loop import record_feedback
from job_agent.core.matcher import analyze_job_match
from job_agent.reports.dashboard import render_dashboard

console = Console(legacy_windows=False)


@click.group()
def cli():
    """Job Application Agent - Multi-candidate application tracking and continuous improvement system."""
    pass


@cli.command()
def doctor():
    """Checks project health, database readiness, and raw ingestion directories."""
    console.print("\n[bold cyan][*] Running Job Application Agent system health check...[/bold cyan]\n")

    db_path = get_db_path()
    candidates = get_candidates()

    table = Table(show_header=True, header_style="bold magenta")
    table.add_column("Component", style="bold")
    table.add_column("Path / Status")
    table.add_column("Detail")

    # DB status
    if db_path.exists():
        table.add_row("SQLite Database", f"[green]OK[/green] ({db_path.name})", f"{db_path.stat().st_size} bytes")
    else:
        table.add_row("SQLite Database", "[yellow]Pending initialization[/yellow]", "Run 'job-agent init' or 'job-agent ingest'")

    # Data directories
    for cid, cinfo in candidates.items():
        cand_dir = RAW_DATA_DIR / cid
        docs_count = len(list(cand_dir.rglob("*.*"))) if cand_dir.exists() else 0
        table.add_row(f"Ingestion: {cinfo.get('name', cid)}", f"[green]Exists[/green]" if cand_dir.exists() else "[red]Missing[/red]", f"{docs_count} files in data")

    shared_dir = RAW_DATA_DIR / "shared"
    shared_count = len(list(shared_dir.rglob("*.*"))) if shared_dir.exists() else 0
    table.add_row("Ingestion: Shared Documents", f"[green]Exists[/green]" if shared_dir.exists() else "[red]Missing[/red]", f"{shared_count} files in data")

    console.print(table)
    console.print("\n[green][OK] System check completed successfully.[/green]\n")


@cli.command()
def init():
    """Initializes SQLite database and creates relational and FTS5 tables."""
    init_db()
    console.print("[bold green][OK] SQLite database and FTS5 search tables initialized successfully.[/bold green]")


@cli.command()
@click.option("--candidate", "-c", default=None, help="Candidate ID ('israel', 'sebastian', 'shared', or omit for all)")
@click.option("--force", "-f", is_flag=True, help="Force re-ingestion of files even if hash is unchanged")
def ingest(candidate: Optional[str], force: bool):
    """Executes full or incremental document ingestion (PDF, DOCX, TXT, MD)."""
    console.print("[bold cyan][*] Starting document ingestion pipeline...[/bold cyan]")
    if candidate:
        res = ingest_candidate_files(candidate, force=force)
        console.print(f"[bold green][OK] Candidate {candidate}:[/bold green] {res['processed']} processed, {res['skipped']} skipped (unchanged), {len(res['errors'])} errors.")
        if res["errors"]:
            for err in res["errors"]:
                console.print(f"  [red][!] {err}[/red]")
    else:
        results = ingest_all(force=force)
        for res in results:
            console.print(f"[bold green][OK] {res['candidate'].upper()}:[/bold green] {res['processed']} processed, {res['skipped']} skipped (unchanged), {len(res['errors'])} errors.")
            if res["errors"]:
                for err in res["errors"]:
                    console.print(f"  [red][!] {err}[/red]")

    console.print("\n[bold green][OK] Ingestion and knowledge base synchronization completed.[/bold green]")


@cli.command()
@click.option("--candidate", "-c", required=True, help="Candidate ID ('israel', 'sebastian')")
@click.option("--company", required=True, help="Company name")
@click.option("--role", required=True, help="Job title / role")
@click.option("--jd", default=None, help="Job description text or summary")
@click.option("--salary", default=None, help="Target or offered salary range")
@click.option("--location", default=None, help="Location or mode (Remote, Hybrid, On-site)")
@click.option("--url", default=None, help="Link to job posting")
@click.option("--notes", default=None, help="Additional notes")
def apply(candidate: str, company: str, role: str, jd: Optional[str], salary: Optional[str], location: Optional[str], url: Optional[str], notes: Optional[str]):
    """Registers a new job application."""
    app_id = register_application(
        candidate_id=candidate,
        company=company,
        role_title=role,
        job_description=jd,
        salary_range=salary,
        location=location,
        application_url=url,
        notes=notes
    )
    console.print(f"[bold green][OK] Application #{app_id} registered for {candidate} at {company} ({role}).[/bold green]")


@cli.command()
@click.option("--app-id", required=True, type=int, help="Job application ID")
@click.option("--candidate", "-c", required=True, help="Candidate ID ('israel', 'sebastian')")
@click.option("--stage", required=True, help="Stage ('screening', 'tech_round_1', 'system_design', 'cultural', 'final')")
@click.option("--questions", help="Questions asked during the interview")
@click.option("--answers", help="Summary of answers given")
@click.option("--interviewers", help="Interviewer names or roles")
@click.option("--impressions", help="General impressions and key takeaways")
def interview(app_id: int, candidate: str, stage: str, questions: Optional[str], answers: Optional[str], interviewers: Optional[str], impressions: Optional[str]):
    """Logs an interview round with questions asked and answers given."""
    int_id = log_interview_round(
        application_id=app_id,
        candidate_id=candidate,
        stage=stage,
        questions_asked=questions,
        candidate_answers=answers,
        interviewers=interviewers,
        key_impressions=impressions
    )
    console.print(f"[bold green][OK] Interview round #{int_id} (Stage: {stage}) recorded for application #{app_id}.[/bold green]")


@cli.command()
@click.option("--candidate", "-c", required=True, help="Candidate ID ('israel', 'sebastian')")
@click.option("--outcome", "-o", type=click.Choice(["rejected", "offer", "withdrawn", "in_progress"]), required=True, help="Application outcome")
@click.option("--source", "-s", default="recruiter_feedback", help="Feedback source (recruiter_feedback, interviewer_email, self_reflection)")
@click.option("--feedback", "-f", required=True, help="Feedback text or post-call debrief")
@click.option("--gaps", "-g", help="Weak spots or areas requiring deeper mastery (separated by ';')")
@click.option("--actions", "-a", help="Action plan or study roadmap")
@click.option("--app-id", type=int, default=None, help="Associated application ID")
def feedback(candidate: str, outcome: str, source: str, feedback: str, gaps: Optional[str], actions: Optional[str], app_id: Optional[int]):
    """Records interview/rejection feedback to fuel the continuous improvement loop."""
    res = record_feedback(
        candidate_id=candidate,
        outcome=outcome,
        source=source,
        raw_feedback=feedback,
        application_id=app_id,
        gaps_identified=gaps,
        action_items=actions
    )
    console.print(f"[bold green][OK] Feedback recorded (#{res['feedback_id']}).[/bold green]")
    if res["gaps_recorded"]:
        console.print("[bold yellow]Improvement areas logged in gap registry and knowledge base:[/bold yellow]")
        for g in res["gaps_recorded"]:
            console.print(f"  * [bold red]{g['topic']}[/bold red] ({g['category']})")
    console.print(f"[cyan][i] Knowledge file 'knowledge/{candidate}/learnings_and_gaps.md' updated.[/cyan]")


@cli.command()
@click.option("--candidate", "-c", required=True, help="Candidate ID ('israel', 'sebastian')")
@click.option("--text", "-t", default=None, help="Job description text")
@click.option("--file", "-f", default=None, type=click.Path(exists=True), help="Path to file containing job description")
def match(candidate: str, text: Optional[str], file: Optional[str]):
    """Matches a job description against profile, certificates, and past interview gaps."""
    jd_content = text
    if file:
        with open(file, "r", encoding="utf-8", errors="replace") as f:
            jd_content = f.read()

    if not jd_content:
        console.print("[red]Error: You must provide either --text or --file with the job description.[/red]")
        return

    analysis = analyze_job_match(candidate, jd_content)

    console.print(f"\n[bold cyan][*] JOB MATCH ANALYSIS ({candidate.upper()}): {analysis['match_percentage']}% Match[/bold cyan]\n")

    # Matched skills
    if analysis["matched_skills"]:
        m_table = Table(title="Matched Skills", show_header=True, header_style="bold green")
        m_table.add_column("Skill")
        m_table.add_column("Category")
        m_table.add_column("Profile Level")
        for s in analysis["matched_skills"]:
            m_table.add_row(s["name"], s["category"], s["candidate_level"])
        console.print(m_table)

    # Missing skills
    if analysis["missing_skills"]:
        miss_table = Table(title="Required Skills Not Found in Profile", show_header=True, header_style="bold yellow")
        miss_table.add_column("Skill")
        miss_table.add_column("Category")
        for s in analysis["missing_skills"]:
            miss_table.add_row(s["name"], s["category"])
        console.print(miss_table)

    # Risky gaps from past interviews
    if analysis["risky_gaps_from_past_interviews"]:
        gap_table = Table(title="[!] ALERT: Required Skills Overlapping with Past Interview Gaps", show_header=True, header_style="bold red")
        gap_table.add_column("Required Skill")
        gap_table.add_column("Interview Gap")
        gap_table.add_column("Times Detected")
        gap_table.add_column("Suggested Action Plan")
        for g in analysis["risky_gaps_from_past_interviews"]:
            gap_table.add_row(g["skill"], g["gap_topic"], str(g["occurrences"]), g["improvement_plan"] or "-")
        console.print(gap_table)
    else:
        console.print("[green][OK] No conflicts detected with past interview gaps.[/green]")


@cli.command()
@click.argument("query")
@click.option("--candidate", "-c", default=None, help="Filter by candidate ID ('israel', 'sebastian')")
@click.option("--limit", "-l", default=10, type=int, help="Maximum number of results")
def search(query: str, candidate: Optional[str], limit: int):
    """Searches across resumes, certifications, notes, interviews, and feedback using FTS5."""
    results = search_fts(query, candidate_id=candidate, limit=limit)
    if not results:
        console.print(f"[yellow]No results found for '{query}'.[/yellow]")
        return

    console.print(f"\n[bold green]Search results for '{query}':[/bold green]\n")
    for r in results:
        console.print(f"• [bold cyan]{r.title}[/bold cyan] ({r.category}) - [magenta]{r.candidate_id}[/magenta]")
        from rich.markup import escape
        clean_snippet = r.snippet.replace("[b]", "[bold yellow]").replace("[/b]", "[/bold yellow]")
        try:
            console.print(f"  [dim]{clean_snippet}[/dim]\n")
        except Exception:
            console.print(f"  {escape(r.snippet)}\n")


@cli.command()
@click.option("--candidate", "-c", default=None, help="Filter by candidate ID ('israel', 'sebastian')")
def dashboard(candidate: Optional[str]):
    """Displays terminal visual dashboard with applications and improvement areas."""
    render_dashboard(candidate_id=candidate)


if __name__ == "__main__":
    cli()
