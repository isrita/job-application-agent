-- storage/schema.sql
-- Relational schema with FTS5 for job-application-agent

PRAGMA foreign_keys = ON;

-- Candidates table
CREATE TABLE IF NOT EXISTS candidates (
    id TEXT PRIMARY KEY,
    name TEXT NOT NULL,
    full_name TEXT,
    headline TEXT,
    email TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Documents ingested (CVs, certifications, projects, notes, shared)
CREATE TABLE IF NOT EXISTS documents (
    id TEXT PRIMARY KEY,
    candidate_id TEXT NOT NULL, -- 'israel', 'sebastian', or 'shared'
    doc_type TEXT NOT NULL,     -- 'cv', 'certificate', 'project', 'note', 'shared'
    file_name TEXT NOT NULL,
    file_path TEXT NOT NULL UNIQUE,
    file_hash TEXT NOT NULL,
    file_size INTEGER,
    title TEXT,
    raw_text TEXT NOT NULL,
    extracted_metadata TEXT,    -- JSON string with extracted dates, orgs, skills
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Extracted Skills inventory
CREATE TABLE IF NOT EXISTS skills (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    candidate_id TEXT NOT NULL,
    skill_name TEXT NOT NULL,
    category TEXT DEFAULT 'general', -- 'data_engineering', 'cloud', 'programming', 'soft_skills', 'devops', etc.
    proficiency TEXT DEFAULT 'intermediate', -- 'beginner', 'intermediate', 'advanced', 'expert'
    source_doc_id TEXT,
    verified BOOLEAN DEFAULT 0,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY(source_doc_id) REFERENCES documents(id) ON DELETE SET NULL
);

-- Job Applications
CREATE TABLE IF NOT EXISTS applications (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    candidate_id TEXT NOT NULL,
    company TEXT NOT NULL,
    role_title TEXT NOT NULL,
    job_description TEXT,
    salary_range TEXT,
    location TEXT,
    application_url TEXT,
    status TEXT DEFAULT 'applied', -- 'applied', 'screening', 'tech_round', 'cultural_round', 'offer', 'rejected', 'withdrawn'
    applied_date DATE DEFAULT (DATE('now')),
    notes TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Interview rounds log
CREATE TABLE IF NOT EXISTS interviews (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    application_id INTEGER NOT NULL,
    candidate_id TEXT NOT NULL,
    stage TEXT NOT NULL,          -- 'hr_screening', 'technical_1', 'technical_2', 'system_design', 'cultural_fit', 'final'
    interview_date DATE,
    interviewers TEXT,
    questions_asked TEXT,         -- JSON array or bullet text of questions asked
    candidate_answers TEXT,       -- Summary or transcript of answers given
    status TEXT DEFAULT 'completed', -- 'scheduled', 'completed', 'cancelled'
    key_impressions TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY(application_id) REFERENCES applications(id) ON DELETE CASCADE
);

-- Feedbacks received after interviews or rejections
CREATE TABLE IF NOT EXISTS feedbacks (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    interview_id INTEGER,
    application_id INTEGER,
    candidate_id TEXT NOT NULL,
    outcome TEXT NOT NULL,        -- 'rejected', 'offer', 'withdrawn', 'in_progress'
    source TEXT NOT NULL,         -- 'recruiter_feedback', 'interviewer_email', 'self_reflection'
    raw_feedback TEXT NOT NULL,
    strengths_mentioned TEXT,
    gaps_identified TEXT,         -- Identified weakness or missing knowledge
    action_items TEXT,            -- Concrete actions to take
    feedback_date DATE DEFAULT (DATE('now')),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY(interview_id) REFERENCES interviews(id) ON DELETE SET NULL,
    FOREIGN KEY(application_id) REFERENCES applications(id) ON DELETE SET NULL
);

-- Knowledge Gap & Improvement Registry (Continuous learning loop)
CREATE TABLE IF NOT EXISTS gap_learnings (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    candidate_id TEXT NOT NULL,
    topic TEXT NOT NULL,          -- e.g., 'Kafka Partitioning & Consumer Groups', 'Kubernetes Helm Deployments'
    category TEXT DEFAULT 'technical', -- 'technical', 'system_design', 'behavioral', 'communication', 'english'
    gap_description TEXT NOT NULL,
    improvement_plan TEXT,        -- Specific material, answer refinement, course or lab
    status TEXT DEFAULT 'identified', -- 'identified', 'studying', 'resolved', 'mastered'
    occurrence_count INTEGER DEFAULT 1,
    last_feedback_id INTEGER,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY(last_feedback_id) REFERENCES feedbacks(id) ON DELETE SET NULL
);

-- Full Text Search Table (FTS5) for lightning search across all documents and notes
CREATE VIRTUAL TABLE IF NOT EXISTS search_fts USING fts5(
    doc_id,
    candidate_id,
    category,       -- 'document', 'interview', 'feedback', 'gap'
    title,
    content,
    tokenize = 'porter unicode61'
);
