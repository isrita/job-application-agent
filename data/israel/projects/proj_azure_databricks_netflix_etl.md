---
title: Azure Databricks & ADF Scalable Netflix Content Pipeline
candidate: israel
company: Independent / Portfolio Enterprise Project
domain: Media & Entertainment Analytics / Content Catalog Normalization
tech_stack: [Azure Databricks, PySpark, Azure Data Factory, Azure Data Lake Storage Gen2, Delta Lake, Python, SQL]
key_metrics: [Multi-dimensional relational decomposition of 8.8k+ titles, 100% ACID compliant Delta Lake storage, Automated ADF pipeline orchestration]
core_topics: [Lakehouse ETL, PySpark Distributed Processing, Data Normalization, Medallion Architecture, Schema Enforcement]
---

# Azure Databricks & ADF Scalable Netflix Content Pipeline

## Executive Summary (STAR Framework)

- **Situation:** Large streaming catalogs like Netflix contain complex, semi-structured metadata where attributes like directors, cast members, countries of production, and category genres are densely packed into delimited strings. Direct queries against unnormalized, flat files cause massive table scans, low cache efficiency, and severe analytical bottlenecks.
- **Task:** Build an automated end-to-end cloud ETL pipeline on Microsoft Azure to ingest raw catalog exports, perform distributed transformations in PySpark, normalize data into dimensional relational structures, and persist cleansed analytical datasets in Azure Data Lake Storage (ADLS Gen2) using Delta Lake.
- **Action:**
  1. Configured Azure Data Factory (ADF) pipelines to ingest raw catalog feeds into ADLS Gen2 raw storage zones.
  2. Developed modular PySpark notebooks on Azure Databricks to clean text columns, handle null values, and standardize date formats.
  3. Decomposed multi-valued comma-separated attributes into distinct 1st-Normal-Form dimension tables (`netflix_titles`, `netflix_cast`, `netflix_directors`, `netflix_countries`, `netflix_category`) using Spark SQL `explode` and array functions.
  4. Implemented Delta Lake formatting with schema validation and ACID guarantees to support incremental ingestion and time-travel querying.
- **Result:** Successfully converted flat file catalog exports into an enterprise-grade dimensional Lakehouse model. Enabled instant aggregation by genre, country, and director while eliminating repetitive string-parsing overhead for downstream BI and analytical consumers.

---

## Architecture & Data Flow

```
[Raw Catalog CSV / JSON Feeds]
              │
              ▼ (Ingest & Copy Activity)
[Azure Data Factory (ADF)] ──► [ADLS Gen2: Bronze Layer]
                                          │
                                          ▼ (Managed Databricks Cluster)
                          [Azure Databricks (PySpark ETL)]
                                  │           │
                     ┌────────────┴───────────┴────────────┐
                     ▼                                     ▼
     (Data Cleansing & Normalization)      (Dimensional Schema Decomposition)
                     │                                     │
                     └─────────────────────┬───────────────┘
                                           ▼
                            [ADLS Gen2: Delta Lake Silver/Gold]
                                ├── netflix_titles (Fact/Core)
                                ├── netflix_cast (Bridge/Dim)
                                ├── netflix_directors (Dim)
                                ├── netflix_countries (Dim)
                                └── netflix_category (Dim)
```

---

## Technical Implementation Highlights

### 1. Data Normalization & Array Decomposition
Flat catalog datasets store nested relationships as denormalized strings:
```python
from pyspark.sql.functions import split, explode, col, trim

# Exploding comma-separated cast into 1NF relational records
df_cast = df_raw.select(
    col("show_id"),
    explode(split(col("cast"), ",")).alias("cast_member")
).withColumn("cast_member", trim(col("cast_member"))).filter(col("cast_member") != "")
```

### 2. Delta Lake Optimizations
- **Schema Enforcement & Evolution:** Ensured incoming records match expected data types and column structures without silent truncation.
- **Z-Ordering & Compaction:** Optimized storage layout by running `OPTIMIZE netflix_titles ZORDER BY (release_year, type)` to accelerate filtered analytical queries.

---

## Key Interview Talking Points

1. **Why Lakehouse over Traditional RDBMS?**
   - Handling semi-structured text manipulation and horizontal scaling at low storage cost in ADLS Gen2, while maintaining SQL querying convenience with Delta Lake.
2. **Handling Data Quality & Nulls:**
   - Managed missing directors and countries with surrogate records (`'Unknown'`) rather than dropping data rows, preserving total content count metrics.
3. **Orchestration in ADF:**
   - Parameterized ADF pipelines using pipeline expressions and linked services with Key Vault credentials to securely trigger Databricks notebook execution.
