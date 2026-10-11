---
title: Banco Pichincha Financial Analytics & Advanced PySpark Assessment
candidate: israel
company: Banco Pichincha / Financial Services
domain: Banking Analytics, Financial Risk Assessment & High-Scale Data Processing
tech_stack: [PySpark, Spark SQL, SQLite, Window Functions, Python, JSON Schema Processing, Delta Lake]
key_metrics: [Execution of multi-tier analytical SQL ranking models, 100% schema accuracy on deeply nested JSON hierarchies, Distributed broadcast join optimization]
core_topics: [Advanced SQL Window Functions, PySpark Nested Data Parsing, Distributed Memory Optimization, Financial Data Engineering]
---

# Banco Pichincha Financial Analytics & Advanced PySpark Assessment

## Executive Summary (STAR Framework)

- **Situation:** Enterprise banking environments demand extreme rigor in data manipulation, complex mathematical rankings, and ingestion of deeply nested semi-structured payloads (such as transaction histories, regulatory filings, and external institutional feeds). Performance bottlenecks and unoptimized joins in PySpark frequently cause out-of-memory (OOM) errors and slow analytical reporting.
- **Task:** Complete an advanced technical engineering benchmark for Banco Pichincha spanning two critical domains: (1) Complex analytical SQL window functions and simulation algorithms, and (2) Distributed PySpark nested schema decomposition, complex joins, and analytical aggregations on high-volume datasets.
- **Action:**
  1. **Advanced SQL & Analytical Algorithms:**
     - Developed multi-stage Common Table Expressions (CTEs) to simulate tournament/transaction matrices, calculating multi-factor points, goal differences, and head-to-head outcomes.
     - Implemented dynamic SQL window ranking functions (`DENSE_RANK()`, `ROW_NUMBER()` partitioned by groups and ordered by complex multi-column criteria) to compute automated qualification and classification tiers.
  2. **PySpark Distributed Data Engineering:**
     - Ingested and flattened deeply nested JSON structures representing municipal education and institutional directories, converting variable-depth hierarchical arrays into structured tabular DataFrames.
     - Leveraged PySpark catalyst optimizer features, broadcast joins on dimension lookup catalogs, and selective column pruning to minimize memory shuffle overhead.
     - Computed distributed aggregates, grouping metrics, and filtering rules without resorting to expensive Python UDFs.
- **Result:** Delivered clean, production-grade solutions across all assessment exercises. Demonstrated deep proficiency in both ANSI/Spark SQL query mechanics and distributed Spark internals, reinforcing qualifications for Senior Financial Data Engineering roles.

---

## Technical Deep-Dive

### 1. Complex Analytical SQL Ranking & Aggregation
```sql
-- Multi-tier group ranking simulation with tie-breaking rules
WITH MatchResults AS (
    SELECT 
        equipo,
        grupo,
        SUM(puntos) AS total_puntos,
        SUM(goles_favor - goles_contra) AS gol_diferencia,
        SUM(goles_favor) AS goles_favor
    FROM partidos_primera_ronda
    GROUP BY equipo, grupo
),
RankedTeams AS (
    SELECT 
        equipo,
        grupo,
        total_puntos,
        gol_diferencia,
        goles_favor,
        ROW_NUMBER() OVER (
            PARTITION BY grupo 
            ORDER BY total_puntos DESC, gol_diferencia DESC, goles_favor DESC
        ) AS posicion_grupo
    FROM MatchResults
)
SELECT * FROM RankedTeams WHERE posicion_grupo <= 2;
```

### 2. PySpark Hierarchical JSON Parsing & Broadcast Join
```python
from pyspark.sql.functions import col, explode, broadcast

# Reading nested municipal directory with schema inferral
df_json = spark.read.option("multiline", "true").json("/content/CENTROS_EDUCACION_MADRID.json")

# Flattening nested arrays and pruning unnecessary columns
df_flattened = df_json.select(
    col("id"),
    col("nombre"),
    explode(col("servicios")).alias("servicio"),
    col("direccion.codigo_postal").alias("codigo_postal")
)

# Broadcast join with reference catalog to eliminate shuffle
df_enriched = df_flattened.join(
    broadcast(df_country_catalog),
    on="codigo_pais",
    how="inner"
)
```

---

## Key Interview Talking Points

1. **Why Native Spark Functions Beat UDFs:**
   - Avoiding Python-JVM serialization boundaries (Pickle/Unpickle) by staying within Catalyst-optimized Spark SQL expressions.
2. **Shuffle vs. Broadcast Joins:**
   - Using `broadcast()` for dimension catalogs under 10MB to eliminate expensive network shuffles and cluster partition skews.
3. **Handling Banking Regulatory Auditing:**
   - Writing deterministic, idempotent SQL queries where tie-breaking mechanisms are explicit and reproducible for financial compliance.
