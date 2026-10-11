---
title: Globant Data Engineering Coding Challenge & Cloud API
candidate: sebastian
repository: bona1204/Globant
domain: Database Migration, REST API & Cloud Deployment
tech_stack: [FastAPI, Python, PostgreSQL, SQLAlchemy 2.0, Pydantic, Docker, Docker Compose, AWS EC2, Pytest]
key_metrics: [1000 rows batch chunks, idempotency, live AWS deployment]
core_topics: [REST API, Advanced SQL Metrics, Docker Containerization, AWS EC2]
---

# Project STAR: Globant Data Engineering Coding Challenge & Cloud API

- **Repository:** [bona1204/Globant](https://github.com/bona1204/Globant)
- **Candidate:** Sebastian Bonilla
- **Domain:** Database Migration, REST API Architecture & Cloud Deployment
- **Tech Stack:** FastAPI, Python, PostgreSQL, SQLAlchemy 2.0, Pydantic, Docker, Docker Compose, AWS EC2, Pytest, SQL Analytics

---

## 1. Situation (Challenge Context)
In a technical evaluation for Globant, the objective was to design a production-grade database migration and analytical service from scratch. The system needed to:
- Ingest historical CSV datasets without headers across three relational tables: `departments`, `jobs`, and `hired_employees`.
- Support high-throughput batch transactions (1 to 1000 rows per request).
- Provide analytical endpoints calculating complex business metrics on historical hiring trends.
- Demonstrate production readiness with automated testing, containerization, and live cloud deployment.

---

## 2. Task (Technical Objectives)
- Build a robust REST API using FastAPI and SQLAlchemy 2.0 connected to PostgreSQL.
- Handle missing data gracefully (e.g., null foreign keys in employee records).
- Implement idempotent, chunked insertions of up to 1000 records to prevent duplicate key violations and memory exhaustion.
- Develop analytical SQL queries for:
  1. `hires-by-quarter-2021`: Employees hired per department and job broken down by quarter (Q1-Q4) ordered alphabetically.
  2. `departments-above-mean-2021`: Departments that hired more employees than the annual cross-department mean, ordered descending.
- Containerize the application and deploy it live on AWS EC2.

---

## 3. Action (Implementation & Architecture)
1. **API & Data Modeling:**
   - Designed normalized relational schemas with SQLAlchemy 2.0 declarative models and Pydantic schemas for strict request validation.
   - Built multipart CSV upload endpoints (`POST /{table_name}/upload`) streaming files in chunks of 1000 rows.
   - Enforced idempotency: existing IDs are skipped during re-uploads to prevent corrupted states.
2. **Advanced SQL Analytical Metrics:**
   - Implemented quarterly pivot queries using `CASE WHEN EXTRACT(QUARTER FROM datetime) = ...` or conditional aggregations.
   - Implemented subqueries and Common Table Expressions (CTEs) to calculate dynamic annual department averages and filter outperforming departments.
3. **Automated Testing & Containerization:**
   - Configured Docker and `docker-compose.yml` linking the FastAPI web container with PostgreSQL.
   - Wrote comprehensive unit and integration test suites using `pytest`, executing against an isolated PostgreSQL container with table truncations before each test.
4. **Cloud Infrastructure Deployment:**
   - Provisioned an AWS EC2 instance (Ubuntu), configured security groups, installed Docker, and deployed the stack with live OpenAPI documentation exposed at port 8000.

---

## 4. Result & Key Takeaways
- Complete end-to-end delivery of the coding challenge satisfying all data migration and analytical KPI requirements.
- Proven capability in full-lifecycle backend engineering: API design, SQL optimization, containerization, and cloud infrastructure deployment.
