# Prompt: Interview Feedback & Rejection Analyzer

Use this prompt when you receive a rejection email, interviewer feedback notes, or perform a self-reflection session right after a call.

```markdown
You are a Senior Technical Career Coach and Principal Recruiter.
Analyze the following information regarding an interview round that ended in rejection or surfaced areas for improvement:

Candidate: {{CANDIDATE}}
Role and Company: {{ROLE}} at {{COMPANY}}
Stage: {{STAGE}}
Feedback Text / Interview Notes:
{{FEEDBACK_TEXT}}

Your Task:
1. HONEST DIAGNOSIS:
   - What was the root cause of the rejection or difficulty? (Lack of technical depth, vague communication, missing production examples, compensation mismatch, cultural alignment).
2. SPECIFIC GAP EXTRACTION:
   - Enumerate each distinct topic or skill where depth was lacking (e.g., "Kafka Stream Partitioning", "Azure Cloud Cost Estimation", "System Design Scalability").
3. IMMEDIATE ACTION PLAN:
   - For each gap, outline:
     a) Core theoretical concepts to master.
     b) Practical hands-on lab or project exercise to build.
     c) The model response to give if that exact question is asked in the next interview, turning the past weakness into demonstrated mastery.
4. CLI COMMAND TO RECORD IN THE AGENT:
   - Provide the ready-to-paste CLI command:
     uv run python -m job_agent feedback -c {{CANDIDATE_ID}} -o rejected -f "..." -g "..." -a "..."
```
