# System Design & Data Architecture Cheat Sheet

Essential concepts and patterns for tackling technical system design and large-scale data engineering interviews.

---

## 1. Ingestion & Processing Patterns
- **Batch vs Streaming**:
  - *Batch (Micro-batches)*: PySpark, Azure Data Factory, Delta Lake. Best suited for high volumes where latency of minutes or hours is acceptable.
  - *Streaming*: Apache Kafka, Azure Event Hubs, Spark Structured Streaming. Tailored for event processing requiring sub-second or real-time latency.
- **Medallion Architecture (Lakehouse)**:
  - **Bronze (Raw)**: Ingested source data, immutable, historical append-only keeping raw schemas.
  - **Silver (Cleaned & Conformed)**: Cleansed, deduplicated, enriched, strongly typed, and normalized.
  - **Gold (Curated & Aggregated)**: Dimensional models (Star Schema / Kimball), aggregated business metrics ready for BI, reporting, and ML feature stores.

---

## 2. Idempotency & Fault Tolerance
- **Idempotency**: Ensuring that executing a pipeline or query $N$ times yields identical state without generating duplicate records.
  - Patterns: `MERGE INTO` (Upsert), date partition overwrites (`overwrite`), event watermarking, and Change Data Capture (CDC).
- **Schema Evolution & Schema Drift**:
  - Managing newly added, deprecated, or mutated columns without crashing downstream production pipelines.

---

## 3. Performance Tuning & Cost Optimization
- **Partitioning & Z-Ordering in Delta Lake**:
  - Avoid over-partitioning (tiny partitions cause the Small File Problem).
  - Regularly trigger `OPTIMIZE` and `VACUUM` in Databricks / Delta Lake.
- **Data Skew in Apache Spark**:
  - Diagnose when a single task/partition processes the vast majority of volume while other executors idle.
  - Solutions: Key salting, broadcast hash joins for small lookup tables, and enabling Adaptive Query Execution (AQE).
