"""Pydantic data models for job-application-agent."""
from datetime import date, datetime
from typing import List, Optional, Dict, Any
from pydantic import BaseModel, Field


class Candidate(BaseModel):
    id: str
    name: str
    full_name: Optional[str] = None
    headline: Optional[str] = None
    email: Optional[str] = None
    created_at: Optional[datetime] = None


class Document(BaseModel):
    id: str
    candidate_id: str  # 'israel', 'sebastian', or 'shared'
    doc_type: str      # 'cv', 'certificate', 'project', 'note', 'shared'
    file_name: str
    file_path: str
    file_hash: str
    file_size: Optional[int] = None
    title: Optional[str] = None
    raw_text: str
    extracted_metadata: Optional[str] = None  # JSON string
    created_at: Optional[datetime] = None
    updated_at: Optional[datetime] = None


class Skill(BaseModel):
    id: Optional[int] = None
    candidate_id: str
    skill_name: str
    category: str = "general"
    proficiency: str = "intermediate"
    source_doc_id: Optional[str] = None
    verified: bool = False


class Application(BaseModel):
    id: Optional[int] = None
    candidate_id: str
    company: str
    role_title: str
    job_description: Optional[str] = None
    salary_range: Optional[str] = None
    location: Optional[str] = None
    application_url: Optional[str] = None
    status: str = "applied"
    applied_date: Optional[date] = None
    notes: Optional[str] = None


class Interview(BaseModel):
    id: Optional[int] = None
    application_id: int
    candidate_id: str
    stage: str
    interview_date: Optional[date] = None
    interviewers: Optional[str] = None
    questions_asked: Optional[str] = None
    candidate_answers: Optional[str] = None
    status: str = "completed"
    key_impressions: Optional[str] = None


class Feedback(BaseModel):
    id: Optional[int] = None
    interview_id: Optional[int] = None
    application_id: Optional[int] = None
    candidate_id: str
    outcome: str  # 'rejected', 'offer', 'withdrawn', 'in_progress'
    source: str   # 'recruiter_feedback', 'interviewer_email', 'self_reflection'
    raw_feedback: str
    strengths_mentioned: Optional[str] = None
    gaps_identified: Optional[str] = None
    action_items: Optional[str] = None
    feedback_date: Optional[date] = None


class GapLearning(BaseModel):
    id: Optional[int] = None
    candidate_id: str
    topic: str
    category: str = "technical"
    gap_description: str
    improvement_plan: Optional[str] = None
    status: str = "identified"  # 'identified', 'studying', 'resolved', 'mastered'
    occurrence_count: int = 1
    last_feedback_id: Optional[int] = None
    updated_at: Optional[datetime] = None


class SearchResult(BaseModel):
    doc_id: str
    candidate_id: str
    category: str
    title: str
    snippet: str
