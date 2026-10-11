---
title: Enterprise E-Commerce Data Platform & GenAI Entity Extraction
candidate: sebastian
company: Cheers Health
role: Senior Data Engineer
timeline: Jul 2025 - May 2026
tech_stack: [Python, PySpark, Delta Lake, AWS S3, AWS Glue, AWS Athena, AWS Lambda, CDC, SCD Type 2, GenAI, LLM APIs]
key_metrics: [4M+ daily transactions, -42% query latency, 8h to 45min processing]
core_topics: [Distributed ETL, Cloud Lakehouse, Query Optimization, Automated Data Quality]
---

# Project STAR: Enterprise E-Commerce Data Platform & GenAI Entity Extraction

- **Company / Client:** Cheers Health
- **Role:** Senior Data Engineer
- **Timeline:** Jul 2025 – May 2026 (Remote, USA)
- **Domain:** E-Commerce, Multi-Channel Retail & Health Analytics
- **Primary Tech Stack:** Python, PySpark, Delta Lake, AWS (S3, Glue, Athena, Lambda), CDC, SCD Type 2, GenAI/LLM pipelines, CI/CD

---

## 1. Situation (Context & Problem)
Cheers Health operated across multiple retail and direct-to-consumer e-commerce channels (Shopify, Amazon, ERP, marketing APIs), generating over 4 million daily transaction and event records. The existing legacy ingestion suffered from:
- Fragile batch jobs taking ~8 hours to process daily feeds.
- Complex downstream analytical SQL queries experiencing high latency and escalating cloud compute bills.
- Unstructured text and customer support feedback requiring manual, error-prone entity extraction and categorization.

---

## 2. Task (Objectives & Responsibilities)
- Architect decoupled, highly resilient ELT pipelines to ingest 4M+ daily transactions into an AWS cloud data lakehouse.
- Modernize the analytical storage layer with Delta Lake and optimize dimensional models to slash query latency.
- Implement robust automated data quality frameworks, anomaly detection, and Change Data Capture (CDC) with Slowly Changing Dimensions (SCD Type 2).
- Design and integrate an automated GenAI/LLM pipeline to classify customer feedback and extract structured product entities from raw text.

---

## 3. Action (Architecture, Technical Implementation & Decisions)
1. **Decoupled AWS Ingestion & Lakehouse Design:**
   - Ingested multi-source REST API payloads into AWS S3 raw landing zone using serverless AWS Lambda and AWS Glue ETL jobs.
   - Converted raw JSON/CSV streams into optimized Delta Lake tables with z-order indexing and partition strategies tailored to high-cardinality access patterns.
2. **Performance Tuning & Dimensional Modeling:**
   - Enforced Kimball dimensional modeling with SCD Type 2 historical tracking to maintain audit-ready customer and subscription dimensions.
   - Refactored complex analytical SQL queries and optimized storage layouts, reducing complex analytical query latency by 42%.
3. **Automated Quality & Governance:**
   - Implemented automated schema evolution policies, Great Expectations / custom validation checks, and alert triggers to halt contaminated loads before reaching gold marts.
4. **GenAI / LLM-Assisted Processing Engine:**
   - Built a Python-orchestrated asynchronous workflow using LLM APIs to parse unstructured support transcripts and product feedback.
   - Implemented prompt caching, chunking, and structured JSON output validation, reducing multi-step classification batches from ~8 hours to under 45 minutes daily.

---

## 4. Result (Business Impact & Measurable Outcomes)
- **42% reduction** in complex analytical query latency across production dashboards.
- **90% reduction** in unstructured data processing time (from 8 hours to <45 minutes).
- **Zero corrupted data incidents** reaching business stakeholders due to automated quality gates.
- Significant monthly savings on AWS Athena and warehouse compute costs.
