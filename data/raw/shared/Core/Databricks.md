**Control Plane** Handles **workspace UI, jobs, notebooks, permissions, and metadata**. It’s managed by **Databricks** and doesn’t access your data directly.

**Compute Plane:** Executes **Spark workloads** on **Databricks clusters** provisioned in your **Azure subscription**, where your data in **ADLS Gen2** is securely processed.

**Spark Cluster in Databricks** is a managed distributed environment used to **execute big data workloads in parallel** across multiple nodes, enabling **scalable, high-performance processing** with features like **Photon engine, autoscaling**, and **Delta Lake optimization** for efficient resource utilization.

**Databricks Managed Clusters** are automatically provisioned and maintained by Databricks, offering **autoscaling, optimized runtimes, and integrated monitoring**, so users can focus on workloads without managing infrastructure. 

**Magic commands** in Databricks (e.g., `%run`) allow you to execute one notebook inside another, enabling modular design, flow orchestration, code reuse, and standardized ETL architectures across projects.

**DBFS (Databricks File System)** is an abstraction layer over cloud storage in Databricks that lets you read, write, and manage files seamlessly from notebooks, supporting data sharing, intermediate storage, and integration with Spark.

**JDBC (Java Database Connectivity)** is a standard API that allows Databricks to connect to external relational databases like SQL Server or Oracle, enabling data extraction via SQL queries for ETL or analytics workflows.

**Secrets in Databricks** are used to securely store credentials (like client secrets or tokens) for connecting to services like ADLS via **Azure Entra ID (formerly AAD)**.  

**Access control (IAM)** in Azure uses **RBAC roles** to manage and restrict user or service access to resources like storage, compute, and secrets securely.

**dbutils** is a Databricks utility library that allows you to interact with the **file system (DBFS)**, manage **notebook workflows**, handle **secrets**, and control **runtime configurations** within notebooks.

**`dbutils.widgets`** is used to **create and retrieve input parameters** for notebooks, enabling **parameterization and dynamic workflows** when notebooks are triggered manually or by pipelines.

**`dbutils.secrets`** allows access to **secrets stored in secret scopes** (like passwords or tokens) in Databricks, enabling **secure credential management** without hardcoding sensitive values in notebooks.

**Delta Lake** is an open-source storage layer that brings **ACID transactions, versioning, and schema evolution** to big data on data lakes.  
**Delta Tables** are the structured tables built on Delta Lake, enabling **reliable, fast, and scalable** data operations in platforms like Databricks.

Delta Tables Functionalities:
- **Data versioning** in Delta Tables lets you **access past versions** of your data using a **timestamp or version number**, enabling **time travel for audits, debugging, and recovery**.
- **VACUUM** in Delta Lake physically deletes obsolete files no longer referenced by the Delta log, helping to **free up storage** and deletes files older than 7 days.
- **OPTIMIZE** in Delta Lake **compacts small files into larger ones**, improving **read performance** and query efficiencY, useful after frequent inserts or streaming workloads.
- **ZORDER BY** in Delta Lake **co-locates related data** in storage by sorting on specified columns, allowing **faster filtering and skipping** during queries, ideal for high-selectivity columns.

**MapReduce** is a parallel computing model where **Map** transforms data into key-value pairs, and **Reduce** aggregates them by key—enabling scalable processing across distributed nodes, especially for large datasets.

**writeStream** in Databricks is used to **output streaming DataFrames** to sinks like Delta Lake, Kafka, or ADLS, enabling **continuous, real-time data processing** with Structured Streaming.

**checkpointLocation** in Databricks defines where to store **streaming state and metadata** in **ADLS**, enabling **fault tolerance and exactly-once processing** in Structured Streaming jobs.

---

**Unity Catalog** in Databricks is a centralized governance layer that manages data access, metadata, and security across all workspaces. It enables fine-grained permissions, data lineage, and auditing—fully integrated with Azure AD for unified access control.

**Unity Catalog object model** in Databricks defines a hierarchical structure to manage and govern data assets across the platform:

`Metastore > Catalog > Schema (Database) > Table / View / Function`

🔹 **Metastore**: Top-level container that holds all catalogs (1 per region per workspace).  
🔹 **Catalog**: Logical group of schemas, often mapped by domain or business unit.  
🔹 **Schema** (Database): Contains tables, views, and functions—used to organize data.  
🔹 **Table/View/Function**: Actual data objects governed by Unity Catalog with fine-grained permissions.

First create the metastore => accounst.azuredatabricks.net use Azure Entra ID > External ID 
(Create automatically but you can setup to personalize de the setuo and source)

**Unity Catalog Metastore**  
In Databricks, the **Unity Catalog Metastore** can be created **with or without a storage root path**, impacting how data is managed:
- **With Storage Assigned**  
Enables **managed tables**, where Databricks handles the storage path in **ADLS Gen2**. This allows full write capabilities like `CREATE TABLE`, supports **Delta Lake features**, and enables **governance tools** such as **automated lineage** and **fine-grained access control**.
- **Without Storage Assigned**  
Supports only **external tables**, meaning you reference existing data using `LOCATION`. No managed tables can be created, and fe atures like **automated lineage tracking** are unavailable. This mode is mostly **read-only** or for **cataloging existing datasets**.

The **Resource Access Connector Databricks** is a **managed identity** created by Azure Databricks to securely access **ADLS Gen2** using **RBAC (Role-Based Access Control)**—without storing secrets. It’s required for **Unity Catalog managed tables**, and must   be granted roles like **Storage Blob Data Contributor** on the storage account.

An **External Catalog** in Databricks refers to a **Unity Catalog without storage assigned**, allowing only **external tables** that reference existing data via `LOCATION`. It supports **read-only access**, without managed storage, write operations, or advanced governance features.

In **Unity Catalog**, when you drop a **managed table**, the data is **not deleted immediately**. Instead, it’s moved to a **soft-deleted state**, and retained for **7 days** by default. This allows you to **restore** it within that retention window, similar to a recycle bin for managed data.

you can run **SQL queries** directly on files by specifying the path with the `LOCATION` clause—no need to create a table or view. This is useful for ad-hoc exploration of external data (e.g., Delta, Parquet) stored in ADLS, keeping the catalog clean and flexible

**Views** in Databricks are **saved SQL queries** stored in the metastore; they persist across sessions and can be reused or shared.  
**Temporary Views** are **session-scoped**, exist only during the active Spark session, and are not stored in the metastore.
**Materialized View** stores precomputed results physically—used for **faster query performance** on static or semi-static data.

Use **DataFrames** when performing **programmatic transformations** in PySpark—ideal for complex logic, chaining operations, and leveraging Spark optimizations.  
Use **Temporary Views** when you want to **query intermediate results using SQL**, especially for ad-hoc analysis or to bridge between PySpark and SQL workflows.

**Volumes** in Unity Catalog are **managed storage containers** that let you organize and access **non-tabular files** (like images, JSON, CSV) directly from **structured and unstructured workloads**. They support **fine-grained access control** and are ideal for **staging data**, ML assets, or files used in notebooks—**without creating tables**.

**Deletion Vectors** allow Delta Lake to mark rows as deleted **without rewriting files**, improving performance.  
However, setting it to `false` forces **physical file rewrite on deletes**, which may be needed for **compatibility or performance tuning** in specific workloads (like streaming or integrations that don’t support deletion vectors).

**DESCRIBE EXTENDED** provides **detailed metadata** about a table, including its **schema, location, format, table properties**, and **storage details** like partitioning or Delta features.

Setting `TBLPROPERTIES('delta.enableDeletionVectors' = false)` disables **Deletion Vectors**, so deleted rows create **tombstoned files** instead. **Tombstoned files** are data files that have been **logically deleted** from a Delta table—marked in the Delta transaction log as removed, but **still exist physically** in storage until a `VACUUM` operation is run. 

**Delta Lake Versioning and Time Travel** allow you to **query previous states of a table** using a **timestamp or version number**, enabling **auditing, rollback, and reproducibility**.  
This is possible because **every write operation is stored as a new version** in the Delta transaction log.

**Deep Clone** copies both the **metadata and the data files**, creating a **fully independent table**—ideal for backups or sandboxing without affecting the source.
**Shallow Clone** copies only the **metadata**, referencing the original data files—great for fast duplication with minimal storage, but changes to the data in source may reflect unless overwritten.

**Auto Loader** in Databricks incrementally loads new files from **ADLS** using a **metadata log**, enabling scalable real-time ingestion with **structured streaming**. When you use `readStream`, nothing is executed immediately due to **lazy evaluation**. The process only starts when you apply an **action** like `writeStream`. With the `trigger(processingTime)` option, you define the **trigger interval**, which controls how often the stream checks for new files—ideal for combining with **window functions** for time-based aggregations.

**checkpointLocation** in Databricks is a **required path** where Spark **stores metadata** about the streaming job—such as **commits, schema, offsets**, and **progress information**. It ensures **exactly-once processing**, supports **streaming recovery** after failure, and allows Spark to **track what has already been processed**. Without it, structured streaming cannot maintain state across batches.


## Compute Arquitecture

![[Pasted image 20260923204751.png]]