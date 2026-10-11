Big data - Definition: Velocity, Volume, Variety, Varicity

**Delta Lake** is an **open-source storage layer** built on top of **Parquet**, designed to bring **ACID transactions**, **versioning**, and **schema enforcement** to data lakes.

It’s part of the **Delta open format**, which means data written in Delta Lake can be read and managed by any system that supports the forma

**Tombstoning** in Delta Lake is the process of **logically deleting files** by marking them as **removed** in the Delta transaction log, instead of immediately deleting them from storage.

**Managed Delta Table:**  
Databricks **controls both the metadata and data location**. When you create or drop the table, it **automatically stores and deletes the data** in the default storage path (usually defined in Unity Catalog).

**External Delta Table:**  
You **define the data location manually** using the `LOCATION` keyword. Dropping the table **removes only the metadata**, not the underlying files—data stays intact unless manually deleted.

**Deletion Vectors** allow Delta Lake to mark rows as deleted without rewriting files, improving performance.  
You can disable them by setting `spark.databricks.io.deletionVector.enabled = false` to force physical deletes instead.

When you update or delete data in a Delta table, Delta Lake doesn't overwrite existing Parquet files. Instead, it:

1. **Creates a new Parquet file** that reflects the updated state (e.g., merged data from previous files).
2. **Marks previous files as removed** (tombstoned) in the Delta transaction log.
3. **If Deletion Vectors are enabled**, it also writes a **deletion vector file** that tracks which rows in the Parquet file are logically deleted — without rewriting the entire file.

This approach boosts performance by avoiding expensive file rewrites and enables efficient versioning and **time travel**.

 In Delta Lake, you can use `VACUUM` with the `DRY RUN` option to preview which files would be deleted **without actually removing them**. This helps identify which **older versions** and **tombstoned files** are eligible for cleanup based on the retention period (default: 7 days).

 **Liquid Clustering** in Delta Lake dynamically organizes data based on column statistics during write operations—eliminating the need for static partitions or manual ZORDER, and improving query performance automatically.
 
**Schema Enforcement** ensures that incoming data matches the table’s defined schema—rejecting incompatible writes to maintain data integrity.

**Schema Evolution** allows the table schema to adapt by automatically adding new columns during writes—useful for handling changing data structures over time.

**Explicit Schema Updates** require you to manually define and approve changes to a Delta table’s schema—ensuring full control over structure modifications and avoiding unintended schema drift.

**REORG TABLE** in Delta Lake is used to optimize physical layout by compacting small files and rewriting them for better performance

**Delta Live Tables (DLT)** is a Databricks framework for **building reliable, declarative ETL pipelines** using **SQL or Python**. It automates **data quality enforcement**, **lineage tracking**, **schema management**, and **pipeline orchestration**—ideal for **streaming and batch workflows**. Brings **declarative Medallion architecture** to life—automating **streaming/batch ingestion**, **data quality with expectations**, and **orchestration** across **Bronze, Silver, and Gold layers**. It handles **lineage, CDC, schema evolution**, and ensures **robust, production-grade pipelines** with minimal setup.

---

**Delta live tables

 append pipelines is used when you pass the data in differents tables and you dont want to repeat the files in another run