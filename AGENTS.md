# AGENTS.md - Directives for AI Agents in this Workspace

Project: **job-application-agent** (Multi-Candidate Job Application Management & Continuous Improvement System).
Location: `C:\Users\IsraelJesusBonillaDe\Documents\job-application-agent`.

---

## 1. Workspace Mission
Coordinate job hunt preparation, resume tailoring, interview simulation, and the continuous improvement feedback loop for **Israel** and his brother **Sebastian**, sharing a centralized technical knowledge base while maintaining strictly independent candidate profiles and metrics.

---

## 2. Operating Rules for Agents
1. **Language Policy**:
   - The user may communicate with you in either English or Spanish.
   - All workspace files, source code, docstrings, comments, CLI outputs, prompts, markdown knowledge bases, and commit messages **MUST ALWAYS BE IN ENGLISH**.
2. **Strict Profile Separation**:
   - All data, resumes, or applications for Israel are stored and queried under `israel` (`data/israel/`, `knowledge/israel/`).
   - All data for Sebastian is stored and queried under `sebastian` (`data/sebastian/`, `knowledge/sebastian/`).
   - Shared technical knowledge (guides, STAR frameworks, system design cheat sheets, interviewer questions, coding challenges) is kept in `data/shared/`.
3. **Absolute Priority to Rejection & Gap Feedback**:
   - Before tailoring a CV, drafting a cover letter, or preparing for a technical interview, the agent MUST review `knowledge/<candidate>/learnings_and_gaps.md` or execute `uv run python -m job_agent match`.
   - If a job description demands a skill where the candidate had a past rejection, stumble, or identified gap, the agent must highlight it and focus prep on that weak area.
4. **Data Privacy & Security**:
   - Personal contact details, phone numbers, emails, and compensation targets reside in local SQLite (`storage/career.db`) and untracked files.
   - Never commit API keys, credentials, or proprietary company information into version control.
5. **Technical Accuracy & Integrity**:
   - Never fabricate projects, skills, or certifications not backed by ingested documents (`data/`).
   - If a role requires a technology the candidate lacks, draft honest bridging answers demonstrating transferable knowledge and proactive learning plans.

---

## 3. System CLI Commands
- **System diagnostics and health check**:
  ```bash
  uv run python -m job_agent doctor
  ```
- **Document ingestion** (PDF, DOCX, TXT, MD):
  ```bash
  uv run python -m job_agent ingest                 # Ingest all candidates and shared files
  uv run python -m job_agent ingest -c israel       # Israel only
  uv run python -m job_agent ingest -c sebastian    # Sebastian only
  ```
- **Register a new job application**:
  ```bash
  uv run python -m job_agent apply -c israel --company "Tech Corp" --role "Senior Data Engineer" --salary "120k-140k USD" --notes "LinkedIn referral"
  ```
- **Log an interview round (questions & answers)**:
  ```bash
  uv run python -m job_agent interview --app-id 1 -c israel --stage "tech_round_1" --questions "How do you optimize Delta tables?" --answers "Detailed STAR answer given"
  ```
- **Record rejection feedback & gap analysis**:
  ```bash
  uv run python -m job_agent feedback -c israel -o rejected -f "Needed deeper Kafka streaming knowledge" -g "Kafka Partitioning: consumer groups and rebalancing" -a "Build hands-on lab on Databricks" --app-id 1
  ```
- **Match job description against profile & past interview gaps**:
  ```bash
  uv run python -m job_agent match -c israel -t "Job description text..."
  uv run python -m job_agent match -c israel -f path/to/job_description.txt
  ```
- **Full-Text Search (FTS5) across all archives**:
  ```bash
  uv run python -m job_agent search "Delta Lake optimize" -c israel
  ```
- **Visual terminal dashboard**:
  ```bash
  uv run python -m job_agent dashboard
  ```
- **Run automated test suite**:
  ```bash
  uv run python -m unittest discover -s tests
  ```
