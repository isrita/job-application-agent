"""Ingestion pipeline: scans candidate folders, parses files, indexes in DB and updates knowledge bases."""
import json
from pathlib import Path
from typing import Dict, List, Any, Optional

from job_agent.config import (
    PROJECT_ROOT, RAW_DATA_DIR, KNOWLEDGE_DIR, get_candidates
)
from job_agent.db.database import (
    init_db, save_document, get_document_by_hash, save_skills,
    get_documents_by_candidate, get_skills_by_candidate, get_gap_learnings
)
from job_agent.db.models import Document
from job_agent.ingestion.parsers import (
    compute_file_hash, parse_document_file, extract_skills_from_text
)


SUPPORTED_EXTENSIONS = {".pdf", ".docx", ".txt", ".md", ".json", ".py", ".sql", ".yaml", ".yml", ".ts"}


def determine_doc_type(file_path: Path) -> str:
    """Classifies document type based on path ancestors."""
    parts_lower = [p.lower() for p in file_path.parts]
    if any("cv" in p or "resume" in p for p in parts_lower):
        return "cv"
    elif any("cert" in p or "diploma" in p for p in parts_lower):
        return "certificate"
    elif any("project" in p or "portfolio" in p or "challenge" in p or "test" in p for p in parts_lower):
        return "project"
    elif any("note" in p or "interview" in p or "entrevista" in p for p in parts_lower):
        return "note"
    elif any("framework" in p for p in parts_lower):
        return "shared"
    return "general"


def ingest_candidate_files(candidate_id: str, force: bool = False) -> Dict[str, Any]:
    """Ingests all files for a candidate (or 'shared')."""
    init_db()

    if candidate_id == "shared":
        cand_dir = RAW_DATA_DIR / "shared"
    else:
        cand_dir = RAW_DATA_DIR / candidate_id

    if not cand_dir.exists():
        return {"candidate": candidate_id, "processed": 0, "skipped": 0, "errors": []}

    processed_count = 0
    skipped_count = 0
    errors = []

    # Walk directory
    for file_path in cand_dir.rglob("*"):
        # Ignore hidden folders (.git, etc.) and virtual environment / cache directories
        if any(part.startswith(".") or part in ("__pycache__", ".venv", "venv", "node_modules") for part in file_path.parts):
            continue
        if file_path.is_file() and file_path.suffix.lower() in SUPPORTED_EXTENSIONS:
            try:
                file_hash = compute_file_hash(file_path)
                existing = get_document_by_hash(file_hash)

                if existing and not force:
                    skipped_count += 1
                    continue

                rel_path = file_path.relative_to(PROJECT_ROOT).as_posix()
                doc_type = determine_doc_type(file_path)

                raw_text, meta = parse_document_file(file_path)
                skills = extract_skills_from_text(raw_text)

                doc_id = f"{candidate_id}_{file_path.stem}_{file_hash[:8]}"
                title = f"{file_path.stem.replace('_', ' ').replace('-', ' ').title()}"

                doc = Document(
                    id=doc_id,
                    candidate_id=candidate_id,
                    doc_type=doc_type,
                    file_name=file_path.name,
                    file_path=rel_path,
                    file_hash=file_hash,
                    file_size=file_path.stat().st_size,
                    title=title,
                    raw_text=raw_text,
                    extracted_metadata=json.dumps(meta)
                )

                save_document(doc)

                if candidate_id != "shared" and skills:
                    save_skills(candidate_id, skills, source_doc_id=doc_id)

                processed_count += 1
            except Exception as e:
                errors.append(f"{file_path.name}: {str(e)}")

    # Update markdown knowledge base for the candidate
    if candidate_id != "shared":
        sync_candidate_knowledge_files(candidate_id)

    return {
        "candidate": candidate_id,
        "processed": processed_count,
        "skipped": skipped_count,
        "errors": errors
    }


def ingest_all(force: bool = False) -> List[Dict[str, Any]]:
    """Ingests files for all registered candidates plus shared documents."""
    candidates = get_candidates()
    results = []

    # First ingest shared knowledge
    results.append(ingest_candidate_files("shared", force=force))

    # Then ingest each candidate
    for cid in candidates.keys():
        results.append(ingest_candidate_files(cid, force=force))

    return results


def sync_candidate_knowledge_files(candidate_id: str) -> None:
    """Generates / refreshes the markdown knowledge summaries for agents."""
    cand_knowledge_dir = KNOWLEDGE_DIR / candidate_id
    cand_knowledge_dir.mkdir(parents=True, exist_ok=True)

    docs = get_documents_by_candidate(candidate_id)
    skills = get_skills_by_candidate(candidate_id)
    gaps = get_gap_learnings(candidate_id)

    # 1. Profile Summary
    profile_path = cand_knowledge_dir / "profile.md"
    cv_docs = [d for d in docs if d["doc_type"] == "cv"]
    cert_docs = [d for d in docs if d["doc_type"] == "certificate"]
    proj_docs = [d for d in docs if d["doc_type"] == "project"]

    profile_content = [
        f"# Candidate Profile: {candidate_id.upper()}",
        "",
        "> Knowledge base automatically synchronized from ingested documents.",
        "",
        "## Summary of Ingested Documentation",
        f"- **Registered Resumes / CVs**: {len(cv_docs)}",
        f"- **Certificates & Diplomas**: {len(cert_docs)}",
        f"- **Projects & Portfolio**: {len(proj_docs)}",
        f"- **Mapped Skills**: {len(skills)}",
        "",
        "### Ingested Certifications",
    ]

    if cert_docs:
        for c in cert_docs:
            profile_content.append(f"- **{c['title']}** (`{c['file_name']}`)")
    else:
        profile_content.append("_No certificates added yet in `data/raw/{0}/certificates`_".format(candidate_id))

    profile_content.extend([
        "",
        "### Resume Files",
    ])
    if cv_docs:
        for cv in cv_docs:
            profile_content.append(f"- **{cv['title']}** (`{cv['file_name']}`)")
    else:
        profile_content.append("_No resumes added yet in `data/raw/{0}/cvs`_".format(candidate_id))

    with open(profile_path, "w", encoding="utf-8") as f:
        f.write("\n".join(profile_content) + "\n")

    # 2. Skills Matrix
    skills_path = cand_knowledge_dir / "skills_matrix.md"
    skills_content = [
        f"# Skills Matrix: {candidate_id.upper()}",
        "",
        "| Category | Skill | Estimated Level |",
        "| --- | --- | --- |"
    ]
    if skills:
        for s in skills:
            skills_content.append(f"| {s['category']} | {s['skill_name']} | {s['proficiency']} |")
    else:
        skills_content.append("| General | No skills detected yet | - |")

    with open(skills_path, "w", encoding="utf-8") as f:
        f.write("\n".join(skills_content) + "\n")

    # 3. Learnings & Gaps (Continuous Improvement)
    gaps_path = cand_knowledge_dir / "learnings_and_gaps.md"
    gaps_content = [
        f"# Interview Feedback & Gap Registry: {candidate_id.upper()}",
        "",
        "> This file compiles topics where past interviews revealed gaps, weaknesses,",
        "> suboptimal answers, or recruiter feedback.",
        "",
        "| Topic / Gap | Category | Frequency | Status | Action Plan / Refined Response |",
        "| --- | --- | --- | --- | --- |"
    ]
    if gaps:
        for g in gaps:
            plan = (g['improvement_plan'] or 'Pending definition').replace('\n', ' ')
            gaps_content.append(f"| **{g['topic']}** | {g['category']} | {g['occurrence_count']} time(s) | `{g['status']}` | {plan} |")
    else:
        gaps_content.append("| No gaps recorded yet | - | 0 | `up_to_date` | Record feedback using the `job-agent feedback` command |")

    with open(gaps_path, "w", encoding="utf-8") as f:
        f.write("\n".join(gaps_content) + "\n")
