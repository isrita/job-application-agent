---
title: Scalable Analytics Warehouse & Airflow Orchestration
candidate: sebastian
company: The Hawkers Club
role: Senior Data Engineer / Implementation Consultant
timeline: Jan 2024 - May 2025
tech_stack: [Snowflake, Azure Synapse, dbt, Apache Airflow, Python, SQL, Docker, CI/CD]
key_metrics: [800K+ daily transactions, 100+ Airflow DAGs, zero recurring pipeline incidents]
core_topics: [Dimensional Modeling, dbt DAGs, Anomaly Detection, Data Marts]
---

# Project STAR: Scalable Analytics Warehouse & Airflow Orchestration

- **Company / Client:** The Hawkers Club
- **Role:** Senior Data Engineer / Implementation Consultant
- **Timeline:** Jan 2024 – May 2025 (Remote, USA)
- **Domain:** Global E-Commerce & Subscription Commercial Feeds
- **Primary Tech Stack:** Snowflake, Azure Synapse Analytics, dbt (Data Build Tool), Apache Airflow, SQL, Python, Docker, CI/CD

---

## 1. Situation (Context & Problem)
The Hawkers Club managed high-volume global brand storefronts processing over 800,000 daily commercial transactions, subscription billing events, and CRM interactions. The existing reporting pipelines suffered from:
- Siloed data in legacy warehouses leading to conflicting KPI reporting across finance, marketing, and inventory teams.
- Unmonitored scheduled scripts that failed silently, violating executive SLAs and creating data distrust.
- Lack of data transformations version control and testing.

---

## 2. Task (Objectives & Responsibilities)
- Centralize disparate e-commerce, CRM, and subscription streams into Snowflake and Azure Synapse.
- Design modular, test-driven dimensional models and data marts using dbt.
- Build and orchestrate 100+ Apache Airflow DAGs with proactive alerting, idempotency, and automated anomaly detection.
- Deliver self-service business intelligence marts to accelerate reporting query retrieval across operations.

---

## 3. Action (Architecture, Technical Implementation & Decisions)
1. **Modern Data Stack Transformation with dbt & Snowflake:**
   - Designed a modular dbt transformation DAG with staging, intermediate, and marts layers following clean architecture best practices.
   - Built incremental models with surrogate keys, surrogate hashing, and date spine models to handle recurring subscription revenue (MRR/ARR) calculations.
   - Enforced automated dbt tests (unique, not_null, accepted_values, relationships) integrated into CI/CD git pull requests.
2. **Production Airflow Orchestration & Anomaly Detection:**
   - Authored and productionized 100+ Apache Airflow DAGs with idempotent task logic, retry backoffs, and Slack/Teams incident webhooks.
   - Engineered statistical anomaly detection checks on daily row volumes and financial totals to catch upstream source schema drift or API drops before downstream reporting was touched.
3. **Data Mart Optimization & Stakeholder Collaboration:**
   - Partnered with analytics leads to construct pre-aggregated reporting marts, drastically reducing dashboard load times and computing credit consumption in Snowflake warehouses.

---

## 4. Result (Business Impact & Measurable Outcomes)
- **Recurring pipeline failures reduced to near zero** due to idempotent DAG redesign and proactive alerting.
- **100% adherence to reporting SLAs** for commercial and executive KPI dashboards.
- Over **800K+ daily transactions** reliably ingested, transformed, and tested in under 30 minutes.
- Substantial reduction in Snowflake compute warehouse credit consumption through dbt incremental transformations and cluster keys.
