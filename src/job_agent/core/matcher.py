"""Job description matcher and interview readiness analyzer."""
from pathlib import Path
from typing import Dict, List, Any, Optional

from job_agent.db.database import (
    get_skills_by_candidate, get_documents_by_candidate, get_gap_learnings
)
from job_agent.ingestion.parsers import extract_skills_from_text


def analyze_job_match(candidate_id: str, job_text: str) -> Dict[str, Any]:
    """
    Analyzes a Job Description against candidate skills, certificates,
    and past interview gaps.
    """
    jd_skills = extract_skills_from_text(job_text)
    candidate_skills = get_skills_by_candidate(candidate_id)
    candidate_docs = get_documents_by_candidate(candidate_id)
    past_gaps = get_gap_learnings(candidate_id)

    cand_skill_map = {s["skill_name"].lower(): s for s in candidate_skills}
    gap_topic_map = {g["topic"].lower(): g for g in past_gaps}

    matched_skills = []
    missing_skills = []
    risky_gaps = []

    for jd_skill in jd_skills:
        name_lower = jd_skill["name"].lower()
        if name_lower in cand_skill_map:
            matched_skills.append({
                "name": jd_skill["name"],
                "category": jd_skill["category"],
                "candidate_level": cand_skill_map[name_lower]["proficiency"]
            })
        else:
            missing_skills.append({
                "name": jd_skill["name"],
                "category": jd_skill["category"]
            })

        # Check if this skill overlaps with any past interview gap
        for gap_topic, gap_data in gap_topic_map.items():
            if name_lower in gap_topic or gap_topic in name_lower:
                risky_gaps.append({
                    "skill": jd_skill["name"],
                    "gap_topic": gap_data["topic"],
                    "occurrences": gap_data["occurrence_count"],
                    "status": gap_data["status"],
                    "improvement_plan": gap_data["improvement_plan"]
                })

    # Available certificates
    cert_docs = [d["title"] for d in candidate_docs if d["doc_type"] == "certificate"]

    match_percentage = 0.0
    if jd_skills:
        match_percentage = round((len(matched_skills) / len(jd_skills)) * 100, 1)

    return {
        "candidate_id": candidate_id,
        "total_jd_skills_detected": len(jd_skills),
        "match_percentage": match_percentage,
        "matched_skills": matched_skills,
        "missing_skills": missing_skills,
        "certifications_available": cert_docs,
        "risky_gaps_from_past_interviews": risky_gaps
    }
