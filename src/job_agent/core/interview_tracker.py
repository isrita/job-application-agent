"""Interview & postulation tracking module."""
from datetime import date
from typing import Dict, List, Optional, Any

from job_agent.db.database import (
    save_application, get_applications, save_interview, get_interviews_for_app
)
from job_agent.db.models import Application, Interview


def register_application(
    candidate_id: str,
    company: str,
    role_title: str,
    job_description: Optional[str] = None,
    salary_range: Optional[str] = None,
    location: Optional[str] = None,
    application_url: Optional[str] = None,
    notes: Optional[str] = None,
    status: str = "applied"
) -> int:
    """Registers a new job application."""
    app = Application(
        candidate_id=candidate_id,
        company=company,
        role_title=role_title,
        job_description=job_description,
        salary_range=salary_range,
        location=location,
        application_url=application_url,
        notes=notes,
        status=status,
        applied_date=date.today()
    )
    return save_application(app)


def log_interview_round(
    application_id: int,
    candidate_id: str,
    stage: str,
    questions_asked: Optional[str] = None,
    candidate_answers: Optional[str] = None,
    interviewers: Optional[str] = None,
    interview_date: Optional[date] = None,
    key_impressions: Optional[str] = None,
    status: str = "completed"
) -> int:
    """Logs an interview round with questions and answers."""
    interview = Interview(
        application_id=application_id,
        candidate_id=candidate_id,
        stage=stage,
        interview_date=interview_date or date.today(),
        interviewers=interviewers,
        questions_asked=questions_asked,
        candidate_answers=candidate_answers,
        status=status,
        key_impressions=key_impressions
    )
    return save_interview(interview)


def list_candidate_applications(candidate_id: Optional[str] = None) -> List[Dict[str, Any]]:
    """Retrieves all applications and attaches interview counts."""
    apps = get_applications(candidate_id=candidate_id)
    for app in apps:
        interviews = get_interviews_for_app(app["id"])
        app["interviews_count"] = len(interviews)
        app["interviews"] = interviews
    return apps
