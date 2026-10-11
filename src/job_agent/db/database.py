"""Database management, repository operations, and FTS5 search."""
import json
import sqlite3
from pathlib import Path
from typing import List, Optional, Dict, Any

from job_agent.config import get_db_path, SCHEMA_FILE, get_candidates
from job_agent.db.models import (
    Candidate, Document, Skill, Application, Interview, Feedback, GapLearning, SearchResult
)


def get_connection() -> sqlite3.Connection:
    """Connects to SQLite database and enables foreign keys and row factory."""
    db_path = get_db_path()
    db_path.parent.mkdir(parents=True, exist_ok=True)
    conn = sqlite3.connect(str(db_path))
    conn.row_factory = sqlite3.Row
    conn.execute("PRAGMA foreign_keys = ON;")
    return conn


def init_db() -> None:
    """Initializes the database schema and populates candidates."""
    conn = get_connection()
    with open(SCHEMA_FILE, "r", encoding="utf-8") as f:
        schema_sql = f.read()

    conn.executescript(schema_sql)

    # Seed candidates from config
    candidates = get_candidates()
    for cid, cdata in candidates.items():
        conn.execute(
            """
            INSERT INTO candidates (id, name, full_name, headline, email)
            VALUES (?, ?, ?, ?, ?)
            ON CONFLICT(id) DO UPDATE SET
                name = excluded.name,
                full_name = excluded.full_name,
                headline = excluded.headline,
                email = excluded.email
            """,
            (cid, cdata.get("name", cid), cdata.get("full_name"), cdata.get("headline"), cdata.get("email"))
        )
    conn.commit()
    conn.close()


def save_document(doc: Document) -> None:
    """Upserts a document and updates the FTS5 search index."""
    conn = get_connection()
    with conn:
        conn.execute(
            """
            INSERT INTO documents (
                id, candidate_id, doc_type, file_name, file_path, file_hash,
                file_size, title, raw_text, extracted_metadata, updated_at
            ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, CURRENT_TIMESTAMP)
            ON CONFLICT(file_path) DO UPDATE SET
                file_hash = excluded.file_hash,
                file_size = excluded.file_size,
                title = excluded.title,
                raw_text = excluded.raw_text,
                extracted_metadata = excluded.extracted_metadata,
                updated_at = CURRENT_TIMESTAMP
            """,
            (
                doc.id, doc.candidate_id, doc.doc_type, doc.file_name, doc.file_path,
                doc.file_hash, doc.file_size, doc.title, doc.raw_text, doc.extracted_metadata
            )
        )
        # Refresh FTS5 index for this document
        conn.execute("DELETE FROM search_fts WHERE doc_id = ?", (doc.id,))
        conn.execute(
            """
            INSERT INTO search_fts (doc_id, candidate_id, category, title, content)
            VALUES (?, ?, ?, ?, ?)
            """,
            (doc.id, doc.candidate_id, f"document:{doc.doc_type}", doc.title or doc.file_name, doc.raw_text)
        )


def delete_document(doc_id: str) -> None:
    conn = get_connection()
    with conn:
        conn.execute("DELETE FROM search_fts WHERE doc_id = ?", (doc_id,))
        conn.execute("DELETE FROM documents WHERE id = ?", (doc_id,))
    conn.close()


def get_document_by_hash(file_hash: str) -> Optional[Dict[str, Any]]:
    conn = get_connection()
    row = conn.execute("SELECT * FROM documents WHERE file_hash = ?", (file_hash,)).fetchone()
    conn.close()
    return dict(row) if row else None


def get_documents_by_candidate(candidate_id: str, include_shared: bool = True) -> List[Dict[str, Any]]:
    conn = get_connection()
    if include_shared:
        rows = conn.execute(
            "SELECT * FROM documents WHERE candidate_id = ? OR candidate_id = 'shared' ORDER BY updated_at DESC",
            (candidate_id,)
        ).fetchall()
    else:
        rows = conn.execute(
            "SELECT * FROM documents WHERE candidate_id = ? ORDER BY updated_at DESC",
            (candidate_id,)
        ).fetchall()
    conn.close()
    return [dict(r) for r in rows]


def get_all_documents() -> List[Dict[str, Any]]:
    conn = get_connection()
    rows = conn.execute("SELECT * FROM documents ORDER BY candidate_id, updated_at DESC").fetchall()
    conn.close()
    return [dict(r) for r in rows]


def save_skills(candidate_id: str, skills_list: List[Dict[str, str]], source_doc_id: Optional[str] = None) -> None:
    conn = get_connection()
    with conn:
        for s in skills_list:
            s_name = s.get("name", "").strip()
            if not s_name:
                continue
            cat = s.get("category", "general")
            prof = s.get("proficiency", "intermediate")
            # Avoid duplicate skill per candidate
            existing = conn.execute(
                "SELECT id FROM skills WHERE candidate_id = ? AND LOWER(skill_name) = LOWER(?)",
                (candidate_id, s_name)
            ).fetchone()
            if not existing:
                conn.execute(
                    """
                    INSERT INTO skills (candidate_id, skill_name, category, proficiency, source_doc_id)
                    VALUES (?, ?, ?, ?, ?)
                    """,
                    (candidate_id, s_name, cat, prof, source_doc_id)
                )


def get_skills_by_candidate(candidate_id: str) -> List[Dict[str, Any]]:
    conn = get_connection()
    rows = conn.execute(
        "SELECT * FROM skills WHERE candidate_id = ? ORDER BY category, skill_name",
        (candidate_id,)
    ).fetchall()
    conn.close()
    return [dict(r) for r in rows]


def save_application(app: Application) -> int:
    conn = get_connection()
    with conn:
        applied_str = app.applied_date.isoformat() if app.applied_date else None
        cursor = conn.execute(
            """
            INSERT INTO applications (
                candidate_id, company, role_title, job_description,
                salary_range, location, application_url, status, applied_date, notes
            ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, COALESCE(?, DATE('now')), ?)
            """,
            (
                app.candidate_id, app.company, app.role_title, app.job_description,
                app.salary_range, app.location, app.application_url, app.status,
                applied_str, app.notes
            )
        )
        app_id = cursor.lastrowid
        # Index in FTS5
        content = f"{app.company} {app.role_title}\n{app.job_description or ''}\n{app.notes or ''}"
        conn.execute(
            """
            INSERT INTO search_fts (doc_id, candidate_id, category, title, content)
            VALUES (?, ?, 'application', ?, ?)
            """,
            (f"app_{app_id}", app.candidate_id, f"Application: {app.company} - {app.role_title}", content)
        )
        return app_id


def get_applications(candidate_id: Optional[str] = None, status: Optional[str] = None) -> List[Dict[str, Any]]:
    conn = get_connection()
    query = "SELECT * FROM applications WHERE 1=1"
    params = []
    if candidate_id:
        query += " AND candidate_id = ?"
        params.append(candidate_id)
    if status:
        query += " AND status = ?"
        params.append(status)
    query += " ORDER BY applied_date DESC, id DESC"
    rows = conn.execute(query, tuple(params)).fetchall()
    conn.close()
    return [dict(r) for r in rows]


def save_interview(interview: Interview) -> int:
    conn = get_connection()
    with conn:
        int_date_str = interview.interview_date.isoformat() if interview.interview_date else None
        cursor = conn.execute(
            """
            INSERT INTO interviews (
                application_id, candidate_id, stage, interview_date,
                interviewers, questions_asked, candidate_answers, status, key_impressions
            ) VALUES (?, ?, ?, COALESCE(?, DATE('now')), ?, ?, ?, ?, ?)
            """,
            (
                interview.application_id, interview.candidate_id, interview.stage,
                int_date_str, interview.interviewers, interview.questions_asked,
                interview.candidate_answers, interview.status, interview.key_impressions
            )
        )
        int_id = cursor.lastrowid
        # Index questions in FTS
        content = f"Stage: {interview.stage}\nQuestions: {interview.questions_asked or ''}\nAnswers: {interview.candidate_answers or ''}\nImpressions: {interview.key_impressions or ''}"
        conn.execute(
            """
            INSERT INTO search_fts (doc_id, candidate_id, category, title, content)
            VALUES (?, ?, 'interview', ?, ?)
            """,
            (f"interview_{int_id}", interview.candidate_id, f"Interview Round: {interview.stage}", content)
        )
        return int_id


def get_interviews_for_app(application_id: int) -> List[Dict[str, Any]]:
    conn = get_connection()
    rows = conn.execute(
        "SELECT * FROM interviews WHERE application_id = ? ORDER BY interview_date ASC, id ASC",
        (application_id,)
    ).fetchall()
    conn.close()
    return [dict(r) for r in rows]


def save_feedback(feedback: Feedback) -> int:
    conn = get_connection()
    with conn:
        fb_date_str = feedback.feedback_date.isoformat() if feedback.feedback_date else None
        cursor = conn.execute(
            """
            INSERT INTO feedbacks (
                interview_id, application_id, candidate_id, outcome,
                source, raw_feedback, strengths_mentioned, gaps_identified, action_items, feedback_date
            ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, COALESCE(?, DATE('now')))
            """,
            (
                feedback.interview_id, feedback.application_id, feedback.candidate_id,
                feedback.outcome, feedback.source, feedback.raw_feedback,
                feedback.strengths_mentioned, feedback.gaps_identified, feedback.action_items,
                fb_date_str
            )
        )
        fb_id = cursor.lastrowid
        # Update application status if outcome is rejected or offer
        if feedback.application_id and feedback.outcome in ('rejected', 'offer'):
            conn.execute(
                "UPDATE applications SET status = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?",
                (feedback.outcome, feedback.application_id)
            )
        # Index feedback in FTS
        content = f"Outcome: {feedback.outcome}\nFeedback: {feedback.raw_feedback}\nGaps: {feedback.gaps_identified or ''}\nActions: {feedback.action_items or ''}"
        conn.execute(
            """
            INSERT INTO search_fts (doc_id, candidate_id, category, title, content)
            VALUES (?, ?, 'feedback', ?, ?)
            """,
            (f"feedback_{fb_id}", feedback.candidate_id, f"Feedback ({feedback.outcome})", content)
        )
        return fb_id


def get_feedbacks(candidate_id: Optional[str] = None) -> List[Dict[str, Any]]:
    conn = get_connection()
    query = "SELECT * FROM feedbacks WHERE 1=1"
    params = []
    if candidate_id:
        query += " AND candidate_id = ?"
        params.append(candidate_id)
    query += " ORDER BY feedback_date DESC, id DESC"
    rows = conn.execute(query, tuple(params)).fetchall()
    conn.close()
    return [dict(r) for r in rows]


def upsert_gap_learning(gap: GapLearning) -> int:
    conn = get_connection()
    with conn:
        # Check if topic already exists for candidate
        existing = conn.execute(
            "SELECT id, occurrence_count FROM gap_learnings WHERE candidate_id = ? AND LOWER(topic) = LOWER(?)",
            (gap.candidate_id, gap.topic)
        ).fetchone()

        if existing:
            gap_id = existing["id"]
            new_count = existing["occurrence_count"] + 1
            conn.execute(
                """
                UPDATE gap_learnings SET
                    occurrence_count = ?,
                    gap_description = gap_description || '\n---\n' || ?,
                    improvement_plan = COALESCE(?, improvement_plan),
                    last_feedback_id = COALESCE(?, last_feedback_id),
                    updated_at = CURRENT_TIMESTAMP
                WHERE id = ?
                """,
                (new_count, gap.gap_description, gap.improvement_plan, gap.last_feedback_id, gap_id)
            )
        else:
            cursor = conn.execute(
                """
                INSERT INTO gap_learnings (
                    candidate_id, topic, category, gap_description,
                    improvement_plan, status, occurrence_count, last_feedback_id
                ) VALUES (?, ?, ?, ?, ?, ?, ?, ?)
                """,
                (
                    gap.candidate_id, gap.topic, gap.category, gap.gap_description,
                    gap.improvement_plan, gap.status, gap.occurrence_count, gap.last_feedback_id
                )
            )
            gap_id = cursor.lastrowid

        # Index in FTS
        conn.execute("DELETE FROM search_fts WHERE doc_id = ?", (f"gap_{gap_id}",))
        conn.execute(
            """
            INSERT INTO search_fts (doc_id, candidate_id, category, title, content)
            VALUES (?, ?, 'gap', ?, ?)
            """,
            (f"gap_{gap_id}", gap.candidate_id, f"Gap/Learning: {gap.topic}", f"{gap.gap_description}\nPlan: {gap.improvement_plan or ''}")
        )
        return gap_id


def get_gap_learnings(candidate_id: Optional[str] = None, status: Optional[str] = None) -> List[Dict[str, Any]]:
    conn = get_connection()
    query = "SELECT * FROM gap_learnings WHERE 1=1"
    params = []
    if candidate_id:
        query += " AND candidate_id = ?"
        params.append(candidate_id)
    if status:
        query += " AND status = ?"
        params.append(status)
    query += " ORDER BY occurrence_count DESC, updated_at DESC"
    rows = conn.execute(query, tuple(params)).fetchall()
    conn.close()
    return [dict(r) for r in rows]


def search_fts(query: str, candidate_id: Optional[str] = None, limit: int = 15) -> List[SearchResult]:
    """Searches across documents, interviews, feedback, and learnings using FTS5."""
    conn = get_connection()
    # Format query for FTS5 (escape quotes or match terms)
    cleaned_query = " OR ".join([f'"{term}"' for term in query.split() if len(term) > 1])
    if not cleaned_query:
        cleaned_query = f'"{query}"'

    sql = """
        SELECT doc_id, candidate_id, category, title, snippet(search_fts, 4, '[b]', '[/b]', '...', 25) as snippet
        FROM search_fts
        WHERE search_fts MATCH ?
    """
    params = [cleaned_query]

    if candidate_id:
        sql += " AND (candidate_id = ? OR candidate_id = 'shared')"
        params.append(candidate_id)

    sql += " ORDER BY rank LIMIT ?"
    params.append(limit)

    try:
        rows = conn.execute(sql, tuple(params)).fetchall()
        results = [
            SearchResult(
                doc_id=r["doc_id"],
                candidate_id=r["candidate_id"],
                category=r["category"],
                title=r["title"] or "Untitled",
                snippet=r["snippet"] or ""
            )
            for r in rows
        ]
    except sqlite3.OperationalError:
        # Fallback to simple LIKE search if query syntax fails
        sql_fallback = """
            SELECT doc_id, candidate_id, category, title, substr(content, 1, 150) as snippet
            FROM search_fts
            WHERE content LIKE ?
        """
        params_fb = [f"%{query}%"]
        if candidate_id:
            sql_fallback += " AND (candidate_id = ? OR candidate_id = 'shared')"
            params_fb.append(candidate_id)
        sql_fallback += " LIMIT ?"
        params_fb.append(limit)
        rows = conn.execute(sql_fallback, tuple(params_fb)).fetchall()
        results = [
            SearchResult(
                doc_id=r["doc_id"],
                candidate_id=r["candidate_id"],
                category=r["category"],
                title=r["title"] or "Untitled",
                snippet=r["snippet"] or ""
            )
            for r in rows
        ]
    conn.close()
    return results
