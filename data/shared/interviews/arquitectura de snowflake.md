---
title: Enterprise Snowflake Migration Strategy & Multi-Tenant PostgreSQL Optimization
candidate: shared
category: system_design_case_study
domain: Cloud Data Platform Migration & Enterprise Database Architecture
core_topics:
  - PostgreSQL to Snowflake Migration Blueprint
  - Medallion Architecture on Snowflake (Bronze / Silver / Gold)
  - Orchestration with Apache Airflow & dbt Core
  - Enterprise Data Governance & Lineage (Access History, RLS, Tagging)
  - PostgreSQL Query Profiling & Tuning (pg_stat_statements, EXPLAIN ANALYZE)
  - Multi-Tenant Database Architecture (Pooled vs Partitioned Hybrid Pattern)
  - Microkernel Architecture & Strategy Patterns
author: Israel Bonilla - Senior Cloud Data Engineer / Architect
---

# Enterprise Snowflake Migration Strategy & Multi-Tenant PostgreSQL Optimization

A two-part architectural blueprint and executive consulting case study:
1. **Executive Migration Pitch & Roadmap:** Modernizing a legacy PostgreSQL reporting warehouse into an automated, governed Snowflake platform orchestrated with dbt and Airflow.
2. **High-Performance PostgreSQL Case Study (Moonflow):** Deep query performance tuning and multi-tenant database design leveraging hybrid partitioning, Row-Level Security (RLS), and the Microkernel architectural pattern.

---

# PART 1: Executive Migration Pitch – PostgreSQL to Snowflake Modernization

## 1. Executive Summary & Consulting Profile
- **Initiative:** Enterprise Data Warehouse Modernization (PostgreSQL ➔ Snowflake Cloud Data Platform)
- **Architect & Lead Consultant:** Israel Bonilla (Senior Cloud Data Engineer / Lakehouse Architect)
- **Engagement Scope:** 3-Month Structured Migration & Modernization Roadmap
- **Target Architecture:** Snowflake Medallion Architecture orchestrated via Apache Airflow and dbt Core

---

## 2. Problem Statement & Scalable Architectural Vision

### The Legacy Bottleneck
Relying on an operational PostgreSQL database for complex analytical reporting and business intelligence creates severe systemic risks:
- **Compute Contention:** Analytical scans and ad-hoc aggregations compete directly with transactional application workloads, causing query timeouts and endpoint latency.
- **Fragmented Logic & Technical Debt:** Proliferation of unversioned manual SQL scripts and stored procedures leads to inconsistent business metrics, lack of testability, and zero data lineage.
- **Operational Drag:** Inability to isolate workloads across reporting, machine learning, and ETL pipelines.

### The Target Solution: Governed Medallion Architecture on Snowflake
Rather than executing a naive "lift-and-shift", we implement a modular **Medallion Architecture** inside Snowflake, establishing clear separation of concerns across data stages:

```
┌────────────────────────────────────────────────────────────────────────┐
│                      OPERATIONAL SOURCE LAYER                          │
│                     Production PostgreSQL Database                     │
└───────────────────────────────────┬────────────────────────────────────┘
                                    │ Automated CDC / S3 Micro-Batch Ingestion
┌───────────────────────────────────▼────────────────────────────────────┐
│                  SNOWFLAKE MEDALLION ARCHITECTURE                      │
│                                                                        │
│  ┌──────────────────────────────────────────────────────────────────┐  │
│  │ BRONZE LAYER: Raw Ingestion Zone                                 │  │
│  │ - Immutable raw data staged via AWS S3 / Azure Blob Storage      │  │
│  │ - Append-only history preserving raw JSON / table state          │  │
│  │ - Tagging of sensitive entities & Role-Based Access Control      │  │
│  └────────────────────────────────┬─────────────────────────────────┘  │
│                                   │ dbt Cleansing, Testing & Normalization
│  ┌────────────────────────────────▼─────────────────────────────────┐  │
│  │ SILVER LAYER: Conformed & Cleansed Zone                          │  │
│  │ - Deduplicated, standardized schemas and typed columns           │  │
│  │ - SCD Type 2 dimension tracking for temporal entity tracking     │  │
│  │ - Automated data contract assertions (uniqueness, not-null, FKs) │  │
│  └────────────────────────────────┬─────────────────────────────────┘  │
│                                   │ dbt Dimensional Modeling & Rollups 
│  ┌────────────────────────────────▼─────────────────────────────────┐  │
│  │ GOLD LAYER: Business Analytics Marts                             │  │
│  │ - Kimball Star Schemas (Fact & Dimension tables)                 │  │
│  │ - Certified metric layers feeding Power BI, Domo, and Analytics  │  │
│  │ - Granular Row Access Policies (RLS) & Access History auditing   │  │
│  └──────────────────────────────────────────────────────────────────┘  │
└───────────────────────────────────┬────────────────────────────────────┘
                                    │
┌───────────────────────────────────▼────────────────────────────────────┐
│                    CONSUMPTION & GOVERNANCE LAYER                      │
│   Power BI / Domo BI Dashboards │ Automated Alerting │ Lineage Auditing │
└────────────────────────────────────────────────────────────────────────┘
```

### Integrated Governance & Security at Every Layer
- **Bronze:** Source data is ingested into an isolated schema with strict RBAC limits. Sensitive PII/financial fields are tagged using Snowflake Object Tagging.
- **Silver:** Transformations are modularized and version-controlled in dbt. Automated data quality tests validate referential integrity, null thresholds, and format constraints on every commit.
- **Gold:** Native Snowflake security features are activated:
  - **Row Access Policies (RLS):** Restricting data visibility dynamically by tenant or business division.
  - **Dynamic Data Masking (DDM):** Masking sensitive attributes for non-cleared roles.
  - **Access History & Object Dependencies:** Full visibility into query access patterns, downstream BI dependencies, and compliance auditability.

---

## 3. Phased 3-Month Migration Plan

| Phase & Timeline | Primary Objectives | Deliverables & Milestones |
| :--- | :--- | :--- |
| **Phase 1: Setup & Architecture** *(Month 1)* | - Audit legacy PostgreSQL schemas, table volumes, and query dependencies.<br>- Provision Snowflake cloud accounts, virtual warehouses, and role hierarchy (RBAC).<br>- Configure CI/CD deployment pipelines (GitHub Actions / GitLab CI) and dbt project structure. | - Architecture blueprint & naming standards document.<br>- Dedicated Virtual Warehouses configured (`ETL_WH`, `BI_WH`).<br>- Base Medallion schemas established in Snowflake. |
| **Phase 2: Incremental Ingestion & Modeling** *(Month 2)* | - Develop ingestion pipelines (full historical baseline + incremental timestamp/CDC feeds).<br>- Author modular dbt models transforming Bronze tables into conformed Silver models.<br>- Build Gold dimensional tables (Kimball Star Schema). | - Automated ingestion pipelines running from PostgreSQL into Bronze.<br>- 100% test coverage on primary keys and business constraints.<br>- Parallel validation comparing legacy vs. Snowflake query outputs. |
| **Phase 3: Go-Live & Knowledge Transfer** *(Month 3)* | - Connect Power BI / Domo dashboards to certified Gold views.<br>- Implement automated monitoring, Slack alerting, and cost budgets.<br>- Conduct hands-on engineering training and documentation handover. | - Production cutover with zero downtime.<br>- Legacy analytical queries decommissioned from PostgreSQL.<br>- Full technical runbook delivered to internal engineering team. |

---

# PART 2: PostgreSQL Performance Optimization & Multi-Tenant Design (Moonflow Case Study)

## 1. Deep Query Profiling & Optimization Playbook

When addressing high-latency API endpoints or degraded reporting queries on PostgreSQL, systematic profiling precedes code changes.

### Diagnostic Toolkit
1. **`pg_stat_statements`:** Identifies top queries consuming the highest cumulative CPU time, execution count, and mean execution duration:
   ```sql
   SELECT 
       query, 
       calls, 
       round(total_exec_time::numeric, 2) AS total_time_ms,
       round(mean_exec_time::numeric, 2) AS avg_time_ms,
       rows
   FROM pg_stat_statements
   ORDER BY total_exec_time DESC
   LIMIT 10;
   ```
2. **`EXPLAIN (ANALYZE, BUFFERS)`:** Exposes the query execution plan, identifying cost bottlenecks, memory spills, and full table sequential scans (`Seq Scan`).

### Optimization Tactics
- **Compound & Partial Indexes:** Indexing specifically for query WHERE and ORDER BY clauses while excluding non-qualifying records to minimize index bloat:
  ```sql
  CREATE INDEX idx_invoices_pending_tenant 
  ON invoices (tenant_id, due_date) 
  WHERE status = 'PENDING';
  ```
- **Refactoring Nested Subqueries to CTEs:** Replacing unoptimized correlated subqueries with Common Table Expressions (CTEs) or window functions (`ROW_NUMBER() OVER (...)`).
- **Engine Memory Tuning:**
  - `work_mem`: Increased for complex sorting and hashing operations to prevent writing intermediate sort batches to temporary disk files.
  - `autovacuum`: Tuned scale factors (`autovacuum_vacuum_scale_factor = 0.05`) to prevent table bloat and outdated catalog statistics on high-write tables.

---

## 2. Multi-Tenant Architectural Design: Hybrid Strategy

For scalable SaaS applications managing thousands of clients with divergent data volumes (e.g., Moonflow debt management software), a naive "one-size-fits-all" model fails. We employ a **Hybrid Pooled + Partitioned Architecture**.

```
                           ┌────────────────────────────┐
                           │    CONTROL METABASE (DB)   │
                           │  - tenants (ID, Tier, Keys)│
                           │  - feature_flags           │
                           │  - rls_policies            │
                           └─────────────┬──────────────┘
                                         │
                 ┌───────────────────────┴──────────────────────┐
                 ▼                                              ▼
┌─────────────────────────────────┐            ┌─────────────────────────────────┐
│     POOLED MULTI-TENANT DB      │            │     DEDICATED ENTERPRISE DB     │
│   (SMB & Mid-Market Clients)    │            │     (Tier-1 Enterprise Clients) │
│                                 │            │                                 │
│  - Shared Tables partitioned    │            │  - Fully isolated storage &     │
│    by logical `tenant_id`       │            │    dedicated compute resources  │
│  - Enforced by PostgreSQL RLS   │            │  - Dedicated maintenance and    │
│  - Cost-efficient infrastructure│            │    independent backup SLA       │
└─────────────────────────────────┘            └─────────────────────────────────┘
```

### Multi-Tenancy Strategy Matrix

| Dimension | Strategy A: Database-per-Tenant | Strategy B: Schema-per-Tenant | Strategy C: Shared Table (Pooled) | Recommended: Hybrid Model |
| :--- | :--- | :--- | :--- | :--- |
| **Isolation & Security** | Highest (physical separation) | High (logical namespace) | Moderate (software-enforced) | **Optimal:** Physical isolation for enterprise; logical for SMBs. |
| **Compute Efficiency** | Low (high idle compute overhead) | Moderate | Highest (maximum compute consolidation) | **High:** Shared resources for 90% of base; dedicated for top 10%. |
| **Maintenance Complexity** | Extreme (hundreds of DB migrations) | High | Minimal (single schema migration) | **Controlled:** Scripted CI/CD migrations with control metabase routing. |
| **Cost Profile** | Very Expensive | Moderately Expensive | Cost-Effective | **Cost-Optimized:** Lowest cost per seat while maintaining enterprise readiness. |

### Row-Level Security (RLS) Implementation
In the pooled multi-tenant tables, tenant data isolation is guaranteed at the database engine level, preventing cross-tenant leakage:
```sql
-- Enable RLS on core tables
ALTER TABLE customer_debts ENABLE ROW LEVEL SECURITY;

-- Create policy leveraging session tenant context
CREATE POLICY tenant_isolation_policy ON customer_debts
    FOR ALL
    TO application_user
    USING (tenant_id = CURRENT_SETTING('app.current_tenant_id')::UUID);
```

---

## 3. Software Architecture & Design Patterns

To maintain a maintainable, extensible platform that supports unique customer rules without polluting core codebase logic:

### 1. The Microkernel Architecture Pattern
- **Core Kernel:** Handles universal data pipelines, transaction logging, user authentication, and base billing models.
- **Plug-and-Play Extension Modules:** Tenant-specific features—such as custom credit scoring algorithms, regional payment gateway adapters, and localized notification cadences—are implemented as modular plugins loaded dynamically based on tenant configuration.

### 2. Behavioral & Creational Design Patterns
- **Strategy Pattern:** Decoupling collection algorithm strategies per tenant. For example, selecting between aggressive notification cadences vs. relationship-first reminders based on tenant risk profile.
- **Adapter Pattern:** Standardizing external integrations (e.g., disparate banking APIs, SMS gateways, and CRM platforms) into uniform internal interfaces.

---

## 4. Business Impact & Measurable Outcomes (STAR Framework)

- **Situation:** Moonflow needed to automate collection processes across 1.5M+ Latin American businesses struggling with manual spreadsheets, high operational friction, and extended Days Sales Outstanding (DSO / PMC).
- **Task:** Architect a reliable data and database foundation capable of sub-second query performance, strict multi-tenant isolation, and automated intelligent workflows.
- **Action:** Implemented PostgreSQL query profiling, established an RLS-enforced hybrid multi-tenant structure, and built automated AI decision pipelines reducing manual communication intervals.
- **Result:**
  - **80%+ reduction** in manual operational tasks through automated workflows.
  - **15% improvement** in Average Collection Period (DSO / PMC).
  - Sub-50ms API query latencies under sustained peak load.