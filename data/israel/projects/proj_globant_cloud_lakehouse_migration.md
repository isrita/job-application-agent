---
title: Enterprise Cloud Lakehouse Migration & Architecture (Azure Databricks & Unity Catalog)
candidate: israel
company: Globant Enterprise Architecture Simulation
domain: Cloud Lakehouse Migration, Data Governance & End-to-End Analytics Platforms
tech_stack: [Azure Databricks, Unity Catalog, Delta Lake, Azure Data Lake Gen2, FastAPI, Docker, Azure Web Apps, Azure Container Registry, PostgreSQL, Power BI, Python]
key_metrics: [Complete 3-tier Medallion architecture (Bronze/Silver/Gold), Unity Catalog centralized access control & metastore, High-performance Power BI DirectQuery reporting via Delta Lake]
core_topics: [Lakehouse Migration, Unity Catalog Governance, Containerized REST Ingestion, Medallion Pipeline, Power BI Analytics]
---

# Enterprise Cloud Lakehouse Migration & Architecture (Azure Databricks & Unity Catalog)

## Executive Summary (STAR Framework)

- **Situation:** Organizations migrating away from legacy on-premises databases often face severe data consistency risks, unmanaged data lakes without governance, and fragile ingestion mechanisms that cannot guarantee format compatibility or access auditing.
- **Task:** Architect and execute an end-to-end data migration and modern Lakehouse platform on Azure, transitioning from an on-premise PostgreSQL prototype to an enterprise cloud architecture featuring containerized REST API ingestion, Databricks Unity Catalog governance, Delta Lake processing, and executive BI dashboards.
- **Action:**
  1. **Prototype Validation:** Created a local PostgreSQL prototype to validate relational data flows, entity relationships (Departments, Jobs, Employees), and batch migration requirements.
  2. **Microservice Ingestion:** Developed a FastAPI ingestion service packaged into a lightweight Docker container, pushed to Azure Container Registry (ACR), and hosted on Azure Web Apps with Managed Identity to facilitate secure file uploads directly to Azure Blob Storage and ADLS Gen2.
  3. **Lakehouse Data Processing (Medallion Pattern):**
     - **Bronze Layer:** Ingested raw payloads into ADLS Gen2 storage with schema tracking.
     - **Silver Layer:** Cleaned, validated, and normalized data using PySpark notebooks, applying data quality constraints and deduplication.
     - **Gold Layer:** Formed business-level aggregated Delta tables ready for high-throughput reporting.
  4. **Enterprise Governance:** Configured Azure Databricks **Unity Catalog** via Azure Access Connectors, creating governed external and managed tables with granular role-based access control (RBAC).
  5. **Analytics Integration:** Connected Power BI to Databricks Gold SQL endpoints and Delta transaction logs, enabling real-time dashboard analytics.
- **Result:** Successfully delivered a production-ready, governed Lakehouse blueprint. Proved seamless data migration capability with zero schema corruption, enterprise-level auditability via Unity Catalog, and instant executive visibility in Power BI.

---

## Architectural Diagram & Data Flow

```
[Local Prototype: PostgreSQL] ──► [Migration Validation]
                                           │
                                           ▼
[Source Files: CSV / JSON] ──► [FastAPI REST API (Docker on Azure Web App)]
                                           │
                                           ▼ (Secure Ingestion via Managed Identity)
                                [Azure Blob Storage / ADLS Gen2]
                                           │
                                           ▼
                    [Azure Databricks + Unity Catalog Governance]
       ┌───────────────────────────────────┼───────────────────────────────────┐
       ▼                                   ▼                                   ▼
[Bronze Layer: Raw Data]      [Silver Layer: Enriched & Cleaned]   [Gold Layer: Aggregated Business]
       │                                   │                                   │
       └───────────────────────────────────┼───────────────────────────────────┘
                                           ▼
                                [Delta Transaction Logs]
                                           │
                                           ▼
                                [Power BI Dashboards]
```

---

## Technical Implementation Highlights

### 1. Containerized Ingestion Service (`FastAPI + Docker`)
Deployed on Azure Web Apps to provide a secure upload bridge into ADLS Gen2:
```python
from fastapi import FastAPI, UploadFile, File
import shutil

app = FastAPI(title="Cloud Data Migration API")

@app.post("/upload/")
async def upload_migration_file(file: UploadFile = File(...)):
    # Stream file directly to cloud storage destination
    target_path = f"/mnt/datalake/bronze/{file.filename}"
    with open(target_path, "wb") as buffer:
        shutil.copyfileobj(file.file, buffer)
    return {"status": "success", "file": file.filename, "destination": target_path}
```

### 2. Unity Catalog Configuration & Managed Tables
Implemented metastore root binding with Azure Access Connector:
```sql
-- Creating governed catalog and schema in Databricks Unity Catalog
CREATE CATALOG IF NOT EXISTS enterprise_lakehouse;
USE CATALOG enterprise_lakehouse;

CREATE SCHEMA IF NOT EXISTS silver_curated;
CREATE TABLE silver_curated.employees
USING DELTA
LOCATION 'abfss://silver@datalakestorage.dfs.core.windows.net/employees';
```

---

## Key Interview Talking Points

1. **Unity Catalog vs. Legacy Hive Metastore:**
   - Centralized governance across multiple Databricks workspaces, fine-grained row- and column-level security, and unified data lineage tracking.
2. **Prototyping Strategy:**
   - Validating business schemas locally with PostgreSQL before provisioning cloud infrastructure reduced development cycles and cloud billing waste.
3. **Containerized Ingestion:**
   - Why containerizing the FastAPI service with Azure Managed Identity is more secure than exposing storage keys or SAS tokens directly to external clients.
