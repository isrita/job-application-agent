---
title: Enterprise Telco Medallion Architecture on Azure Databricks
candidate: sebastian
company: DigitalCALA / Telcel
role: Senior Implementation Consultant (Data Engineering)
timeline: Apr 2021 - Jan 2024
tech_stack: [Azure Databricks, PySpark, Delta Lake, ADLS Gen2, Unity Catalog, Azure Data Factory, Azure DevOps, SCD Type 2]
key_metrics: [10M+ daily records, 24h to <2h processing (92% reduction), zero data loss]
core_topics: [Medallion Architecture, Distributed PySpark Tuning, Unity Catalog Governance, CI/CD]
---

# Project STAR: Enterprise Telco Medallion Architecture on Azure Databricks

- **Company / Client:** DigitalCALA / Telcel
- **Role:** Senior Implementation Consultant (Data Engineering)
- **Timeline:** Apr 2021 – Jan 2024 (Remote, USA / Central America)
- **Domain:** Telecommunications & Multi-Country Mobile Data Consumption
- **Primary Tech Stack:** Azure Databricks, PySpark (Apache Spark), Delta Lake, ADLS Gen2, Unity Catalog, Azure Data Factory, Azure DevOps (CI/CD), SCD Type 2

---

## 1. Situation (Context & Problem)
Telcel required centralized consumption monitoring and subscriber analytics across Central American markets (Guatemala, Costa Rica, El Salvador, Honduras), handling more than 10 million mobile subscriber records and CDRs (Call Detail Records) daily. 
- Legacy batch reporting took over 24 hours to generate regional consumption summaries, preventing near-real-time fraud detection and customer tier upgrades.
- Lack of data governance, data lineage, and role-based access control across international telecom jurisdictions.
- Manual deployment scripts prone to regressions during production updates.

---

## 2. Task (Objectives & Responsibilities)
- Architect and deploy an end-to-end Medallion Architecture (Bronze, Silver, Gold) on Azure Databricks and ADLS Gen2.
- Optimize PySpark distributed workloads to collapse analytical reporting turnaround time from 24 hours to under 2 hours.
- Implement strict data governance, access controls, and data lineage utilizing Unity Catalog.
- Establish automated CI/CD release pipelines via Azure DevOps for zero-downtime deployments.
- Enforce Slowly Changing Dimensions (SCD Type 2) and schema validation across subscriber plan histories.

---

## 3. Action (Architecture, Technical Implementation & Decisions)
1. **Medallion Lakehouse Implementation:**
   - **Bronze Layer:** Ingested raw CDR and network telemetry feeds into raw ADLS Gen2 storage using Azure Data Factory and auto-loader streaming.
   - **Silver Layer:** Cleaned, validated, and normalized subscriber demographics and usage records using PySpark on Databricks clusters. Enforced schema evolution, deduplication, and SCD Type 2 historical tracking.
   - **Gold Layer:** Modeled business-level aggregations, data marts, and KPI views partitioned by country, network type, and billing cycle.
2. **PySpark Performance & Cluster Optimization:**
   - Addressed severe data skew and shuffle spill issues by implementing broadcast joins on lookup tables, adaptive query execution (AQE), and Delta Lake optimize/z-order techniques.
3. **Governance & DevOps Engineering:**
   - Configured Unity Catalog fine-grained access control to segregate data access based on country regulations.
   - Built production Azure DevOps CI/CD pipelines to validate unit tests, linting, and deploy Databricks workflows automatically across dev, staging, and prod environments.
   - Mentored junior engineers on PySpark optimization, git branching strategies, and distributed debugging.

---

## 4. Result (Business Impact & Measurable Outcomes)
- **92% reduction** in analytical processing latency (from 24 hours down to under 2 hours).
- Successfully scaled to process **10M+ daily telecom records** with zero data loss.
- Unified data governance and full auditability achieved across 4 countries via Unity Catalog.
- Zero-downtime, automated deployments standardized across all sprint releases.
