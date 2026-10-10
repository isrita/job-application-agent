"""Continuous improvement feedback loop: captures rejection feedback, extracts gaps, and updates knowledge base."""
from datetime import date
from typing import Dict, List, Optional, Any

from job_agent.db.database import (
    save_feedback, upsert_gap_learning, get_feedbacks, get_gap_learnings
)
from job_agent.db.models import Feedback, GapLearning
from job_agent.ingestion.pipeline import sync_candidate_knowledge_files


def record_feedback(
    candidate_id: str,
    outcome: str,
    source: str,
    raw_feedback: str,
    application_id: Optional[int] = None,
    interview_id: Optional[int] = None,
    strengths_mentioned: Optional[str] = None,
    gaps_identified: Optional[str] = None,
    action_items: Optional[str] = None,
    feedback_date: Optional[date] = None
) -> Dict[str, Any]:
    """
    Records an interview/rejection feedback, extracts gap topics,
    upserts them into the learning registry, and syncs knowledge files.
    """
    feedback = Feedback(
        application_id=application_id,
        interview_id=interview_id,
        candidate_id=candidate_id,
        outcome=outcome.lower(),
        source=source,
        raw_feedback=raw_feedback,
        strengths_mentioned=strengths_mentioned,
        gaps_identified=gaps_identified,
        action_items=action_items,
        feedback_date=feedback_date or date.today()
    )
    fb_id = save_feedback(feedback)

    # Process gaps
    created_gaps = []
    if gaps_identified:
        # Split gaps by line or semicolon or comma if multi-line
        gap_lines = [g.strip("-• *").strip() for g in gaps_identified.replace(";", "\n").split("\n") if g.strip()]
        for line in gap_lines:
            if not line:
                continue
            # Try splitting into Topic: Description if formatted like "Topic: details"
            if ":" in line:
                topic, desc = line.split(":", 1)
                topic = topic.strip()
                desc = desc.strip()
            else:
                topic = line
                desc = f"Identified from interview feedback: {raw_feedback[:120]}..."

            category = "technical"
            topic_lower = topic.lower()
            if any(w in topic_lower for w in ["english", "communication", "fluency", "speech", "inglés", "comunicación", "fluidez", "oratoria"]):
                category = "communication"
            elif any(w in topic_lower for w in ["leadership", "star", "behavioral", "situation", "culture", "cultural", "team", "conflict", "liderazgo", "situación", "equipo", "conflicto"]):
                category = "behavioral"
            elif any(w in topic_lower for w in ["architecture", "system design", "design", "scalability", "arquitectura", "diseño", "escalabilidad"]):
                category = "system_design"

            gap_learning = GapLearning(
                candidate_id=candidate_id,
                topic=topic,
                category=category,
                gap_description=desc,
                improvement_plan=action_items or f"Study and prepare hands-on examples for {topic}.",
                status="identified",
                last_feedback_id=fb_id
            )
            gap_id = upsert_gap_learning(gap_learning)
            created_gaps.append({"id": gap_id, "topic": topic, "category": category})

    # Automatically refresh markdown knowledge files
    sync_candidate_knowledge_files(candidate_id)

    return {
        "feedback_id": fb_id,
        "candidate_id": candidate_id,
        "outcome": outcome,
        "gaps_recorded": created_gaps
    }


def get_candidate_improvement_summary(candidate_id: str) -> Dict[str, Any]:
    """Retrieves all gaps and learnings categorized by status and recurrence."""
    all_gaps = get_gap_learnings(candidate_id)
    feedbacks = get_feedbacks(candidate_id)

    top_recurring = sorted(all_gaps, key=lambda x: x["occurrence_count"], reverse=True)
    pending = [g for g in all_gaps if g["status"] in ("identified", "studying")]
    resolved = [g for g in all_gaps if g["status"] in ("resolved", "mastered")]

    return {
        "candidate_id": candidate_id,
        "total_feedbacks": len(feedbacks),
        "total_gaps": len(all_gaps),
        "pending_gaps": pending,
        "resolved_gaps": resolved,
        "top_recurring": top_recurring[:5]
    }
