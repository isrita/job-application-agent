# Section 6: Cost & Performance Optimisation

> Track: Databricks Certified Data Engineer Professional | Certification Preparation Guide

---


> [!NOTE]
> **Exam Weight: 13%** — The second heaviest section. Covers Unity Catalog managed tables benefits, Delta optimization with deletion vectors and liquid clustering, data skipping and file pruning, Change Data Feed (CDF), and query profile analysis for identifying bottlenecks.


---



## Unity Catalog Managed Tables Benefits


### Topic Overview

Unity Catalog managed tables represent a fundamental shift in how you manage data in Databricks. When you create a managed table in Unity Catalog, Databricks takes ownership of the underlying files, handling their lifecycle automatically. This is different from external tables where you manage the files yourself.

The benefits go beyond convenience. Managed tables give you automatic file compaction, streamlined drop operations, and integrated governance. You also get uniform access control, data lineage tracking, and the ability to enforce retention policies at the Catalog level. For organizations dealing with compliance requirements like GDPR or HIPAA, this centralized approach to data management significantly reduces operational overhead.

When you drop a managed table, the data is deleted automatically. This is powerful for compliance but also means you need to understand the implications. Unlike external tables where files linger, managed tables immediately remove data from storage when you drop them. This matters when you need to demonstrate data deletion for audits.


---


### Key Concepts


<details>
<summary><b>Managed vs External Tables</b></summary>

Managed tables store data in a location managed by Databricks, typically in Unity Catalog's managed storage. When you drop a managed table, the underlying files are deleted automatically. External tables point to data you manage in cloud storage like S3 or ADLS. You can drop an external table without deleting the data files.


</details>


<details>
<summary><b>Automatic File Lifecycle Management</b></summary>

Databricks automatically handles file compaction and cleanup for managed tables. The system merges small files, removes unused deletion vectors, and optimizes the file layout without requiring manual optimization commands. This reduces the operational burden on your data engineers.


</details>


<details>
<summary><b>PURGE on DROP</b></summary>

Dropping a managed table with PURGE immediately and permanently deletes the data. Without PURGE, the table metadata is removed but data remains recoverable briefly. This is essential for compliance scenarios where you need immediate deletion guarantees.


</details>


<details>
<summary><b>Unified Governance</b></summary>

All managed tables in Unity Catalog inherit consistent access controls, audit logging, and data lineage tracking. You define permissions once at the schema or catalog level, and all tables comply with the same policies. This eliminates the fragmentation you get with external tables scattered across different cloud storage locations.


</details>


---


### Code Examples


#### Creating Managed Tables in Unity Catalog


```sql
-- Managed table (Databricks manages the files)
CREATE TABLE my_catalog.my_schema.customers (
  customer_id INT,
  name STRING,
  email STRING,
  created_at TIMESTAMP
)
USING DELTA;

-- External table (you manage the files)
CREATE EXTERNAL TABLE my_catalog.my_schema.raw_events (
  event_id INT,
  event_type STRING,
  timestamp TIMESTAMP
)
USING DELTA
LOCATION 's3://my-bucket/events/';
```


#### Dropping with PURGE


```sql
-- Immediately delete managed table data (GDPR deletion)
DROP TABLE my_catalog.my_schema.customers PURGE;

-- External table drop (data remains in S3)
DROP TABLE my_catalog.my_schema.raw_events;
```


#### Setting Retention Policies


```sql
-- Set retention policy on a managed table
ALTER TABLE my_catalog.my_schema.transactions
SET TBLPROPERTIES ('delta.logRetentionDuration' = '30 days');

-- Enable automatic VACUUM runs
ALTER TABLE my_catalog.my_schema.transactions
SET TBLPROPERTIES ('delta.enableDeletionVectors' = 'true');
```


---


### Common Exam Scenarios

Scenario 1: GDPR Right to Be Forgotten

A company stores customer PII in Unity Catalog managed tables. When a customer requests deletion under GDPR, you need to ensure data is removed immediately and permanently. Using DROP TABLE with PURGE is the right approach because it immediately deletes files and generates an audit log entry proving deletion. External tables would require manual deletion of S3 files, making compliance harder to demonstrate.

Scenario 2: Reducing Storage Costs for Time Series Data

A data platform stores 24 months of clickstream data in managed tables. You want to keep only the last 12 months and delete older partitions. Managed tables with automatic lifecycle management allow you to drop old partitions and immediately free storage. External tables would require you to manually delete files from cloud storage, increasing operational complexity.

Scenario 3: Cross Team Data Governance

Multiple teams share a Unity Catalog with managed tables. Instead of managing separate access control systems for each cloud storage location, you use unified permissions at the catalog and schema level. This ensures consistent governance and audit trails across all teams. New team members automatically inherit correct permissions without manual S3 policy updates.


---


### Key Takeaways

* Managed tables in UC reduce operational overhead by automatically handling file lifecycle, compaction, and cleanup
* Use DROP TABLE with PURGE for immediate data deletion required by GDPR, HIPAA, and other compliance frameworks
* Unified access control and audit logging across all managed tables eliminates governance fragmentation
* Managed tables enforce consistent retention policies at the catalog level, simplifying data lifecycle management

---


### Gotchas and Tips


> [!NOTE]
> PURGE is Permanent: DROP TABLE with PURGE permanently deletes data. There is no trash or recycle bin for managed tables. Test your deletion logic on non production tables first.


> [!NOTE]
> Storage Location: Managed table files are stored in Unity Catalog's managed storage location, not your own cloud account. You cannot access these files directly via cloud storage APIs.


> [!NOTE]
> Migration from External: Migrating from external tables to managed tables requires copying data and updating all downstream dependencies. Plan this migration carefully in your Lakeflow pipelines.


---


### Links and Resources

* **[Managed Tables](https://docs.databricks.com/aws/en/tables/managed)** — Benefits of Unity Catalog managed tables for governance and lifecycle management.
* **[Unity Catalog Overview](https://docs.databricks.com/aws/en/data-governance/unity-catalog/)** — Centralized governance model and its cost optimization benefits.


## Delta Optimization (Deletion Vectors, Liquid Clustering)


### Topic Overview

Delta Lake optimizations fundamentally change how your data is stored and accessed. Deletion vectors and liquid clustering are two complementary features that together unlock significant performance gains and cost reductions. Deletion vectors enable soft deletes without rewriting entire files, while liquid clustering automatically reorganizes data by column values as you load it.

Deletion vectors track which rows are deleted logically rather than requiring the entire file to be rewritten. This is game changing for high volume delete and update operations. Liquid clustering handles the physical data layout automatically, grouping similar values together without the manual intervention required by Z-order or partitioning. These work together to reduce file count, minimize query time, and lower compute costs.

Understanding when to use each optimization matters for the exam. Deletion vectors are always beneficial for tables with frequent updates and deletes. Liquid clustering is ideal for tables where certain columns are frequently filtered or joined. The OPTIMIZE command with these features enabled ensures your tables stay performant as they grow.


---


### Key Concepts


<details>
<summary><b>Deletion Vectors</b></summary>

Deletion vectors are bitmap like structures that mark which rows in a file are deleted. Instead of rewriting an entire file when you delete or update rows, Delta tracks deleted row positions. This reduces I/O and CPU for DML operations. When you query the table, the engine skips rows marked as deleted without touching the actual data.


</details>


<details>
<summary><b>Liquid Clustering</b></summary>

Liquid clustering is automatic column level data organization that happens as data is written. You specify one or more clustering columns and Databricks automatically groups rows with similar values. Unlike Z-order which requires manual optimization, liquid clustering is incremental and works with streaming and batch loads. The system learns from query patterns and adapts the layout over time.


</details>


<details>
<summary><b>OPTIMIZE Command</b></summary>

Running OPTIMIZE on a table with deletion vectors enabled triggers cleanup of deleted rows and file compaction. With liquid clustering, OPTIMIZE reorders data to improve clustering effectiveness. You can schedule OPTIMIZE as a maintenance task in Lakeflow pipelines to keep tables performant without manual intervention.


</details>


<details>
<summary><b>File Count Impact</b></summary>

Tables with many small files slow down queries due to metadata overhead. Deletion vectors reduce the number of files by avoiding rewrites. Liquid clustering combined with OPTIMIZE merges small files into larger ones. This directly reduces query latency and improves scan performance.


</details>


---


### Code Examples


#### Enabling Deletion Vectors


```sql
-- Create a new table with deletion vectors enabled
CREATE TABLE my_catalog.my_schema.events (
  event_id BIGINT,
  user_id BIGINT,
  event_type STRING,
  timestamp TIMESTAMP
)
USING DELTA
TBLPROPERTIES ('delta.enableDeletionVectors' = 'true');

-- Enable on an existing table
ALTER TABLE my_catalog.my_schema.events
SET TBLPROPERTIES ('delta.enableDeletionVectors' = 'true');
```


#### Creating Liquid Clustered Tables


```sql
-- Liquid clustering by user_id (single column)
CREATE TABLE my_catalog.my_schema.user_events (
  user_id BIGINT,
  event_id BIGINT,
  event_type STRING,
  timestamp TIMESTAMP
)
USING DELTA
CLUSTER BY (user_id);

-- Liquid clustering by multiple columns
CREATE TABLE my_catalog.my_schema.transactions (
  customer_id INT,
  product_id INT,
  amount DECIMAL(10, 2),
  transaction_date DATE
)
USING DELTA
CLUSTER BY (customer_id, product_id);
```


#### Running OPTIMIZE


```sql
-- Basic OPTIMIZE (compacts files, clears deletion vectors)
OPTIMIZE my_catalog.my_schema.user_events;

-- OPTIMIZE with Z-order (for non liquid clustered tables)
OPTIMIZE my_catalog.my_schema.products
ZORDER BY (category, price);

-- OPTIMIZE in a Lakeflow pipeline (Python example)
from databricks.sdk import WorkspaceClient

ws = WorkspaceClient()
table_name = "my_catalog.my_schema.user_events"
ws.query(f"OPTIMIZE {table_name}")
```


---


### Common Exam Scenarios

Scenario 1: High Volume Update Operations

A customer data platform updates customer records daily, modifying 20 percent of rows each day. Without deletion vectors, each update would rewrite entire files, consuming compute and storage. Enabling deletion vectors means updates mark rows logically without file rewrites. Running OPTIMIZE periodically cleans up the deletion markers, maintaining query performance while keeping DML fast.

Scenario 2: Frequent Joins on Specific Columns

An orders table is frequently joined with customers on customer_id and filtered by order_date. Using liquid clustering on both columns automatically co locates related data. This reduces shuffle during joins and enables better file pruning. Unlike Z-order which requires manual OPTIMIZE runs, liquid clustering works incrementally as new data arrives.

Scenario 3: Combining Both Optimizations

A table has frequent updates (deletion vectors benefit) and frequent queries filtered by region (liquid clustering benefit). Enable both in the table definition. Deletion vectors handle the DML efficiency while liquid clustering optimizes query performance. OPTIMIZE commands maintain both simultaneously.


---


### Key Takeaways

* Deletion vectors eliminate file rewrites for deletes and updates, significantly improving DML performance
* Liquid clustering automatically organizes data by column values, improving query performance without manual intervention
* OPTIMIZE cleans up deletion vectors and compacts files for both optimization approaches
* Use deletion vectors for any table with frequent updates, use liquid clustering for tables with predictable filter or join patterns

---


### Gotchas and Tips


> [!NOTE]
> Liquid Clustering Requires Cluster By: You cannot add liquid clustering to existing tables with ALTER TABLE. Create a new table with CLUSTER BY in the definition.


> [!NOTE]
> OPTIMIZE Takes Time: Running OPTIMIZE can be resource intensive on large tables. Schedule it during off peak hours or use incremental OPTIMIZE strategies.


> [!NOTE]
> Deletion Vectors + VACUUM: VACUUM permanently removes deleted rows. Running VACUUM before querying ensures deleted data is actually removed from storage.


---


### Links and Resources

* **[Deletion Vectors](https://docs.databricks.com/aws/en/delta/deletion-vectors)** — Efficient row-level deletes without rewriting entire data files.
* **[Liquid Clustering](https://docs.databricks.com/aws/en/delta/clustering)** — Adaptive data layout optimization that replaces partitioning and Z-ordering.
* **[OPTIMIZE Command](https://docs.databricks.com/aws/en/delta/optimize)** — Compacting small files and optimizing Delta table layout.


## Data Skipping and File Pruning


### Topic Overview

Data skipping is one of Delta Lake's most powerful performance features. When you query a table with a WHERE clause, Delta uses min and max statistics stored in the transaction log to skip files that cannot possibly contain matching rows. This means your query engine doesn't have to scan every file, dramatically reducing I/O and query time.

File pruning takes this further by using column statistics to eliminate files before the actual scan starts. For example, if you query WHERE date = '2026-01-15' and a file's statistics show all dates in that file are from 2025, that file is skipped entirely. Bloom filters add another layer, enabling skipping for specific values within files.

Understanding how statistics are collected and used is essential for optimizing queries. Different data types and storage organizations affect which skipping techniques apply. Z-order and liquid clustering both improve skipping by co locating related data.


---


### Key Concepts


<details>
<summary><b>Min Max Statistics</b></summary>

Delta stores minimum and maximum values for columns in each file. When you filter on a column, Delta checks if a file's min/max range could contain matching rows. If your filter is WHERE id > 1000 and a file has max id of 500, that file is skipped entirely.


</details>


<details>
<summary><b>Column Statistics Collection</b></summary>

Statistics are automatically collected when data is written. You can manually collect or update statistics with the ANALYZE command. More comprehensive statistics enable better skipping decisions but require extra processing during writes.


</details>


<details>
<summary><b>Bloom Filters</b></summary>

Bloom filters store a compact probabilistic representation of values in a file. They enable skipping even for non comparable types and provide finer grained skipping than min/max statistics alone. Bloom filters have a small memory footprint but are more CPU intensive to evaluate.


</details>


<details>
<summary><b>Predicate Pushdown</b></summary>

Predicate pushdown applies filters before scanning actual data. Combined with data skipping, predicates eliminate files at the planning stage, further reducing the data engine needs to process. This is especially powerful in distributed query execution.


</details>


---


### Code Examples


#### Viewing Table Statistics


```sql
-- View table statistics
DESC DETAIL my_catalog.my_schema.events;

-- Check column statistics
DESC FORMATTED my_catalog.my_schema.events;

-- Analyze and collect statistics
ANALYZE TABLE my_catalog.my_schema.events COMPUTE STATISTICS;
ANALYZE TABLE my_catalog.my_schema.events COMPUTE STATISTICS FOR COLUMNS user_id, event_type;
```


#### Enabling Bloom Filters


```sql
-- Enable Bloom filters for specific columns
ALTER TABLE my_catalog.my_schema.users
SET TBLPROPERTIES ('delta.dataSkippingNumIndexedCols' = '5');

-- Create table with data skipping optimization
CREATE TABLE my_catalog.my_schema.orders (
  order_id BIGINT,
  customer_id BIGINT,
  order_date DATE,
  amount DECIMAL(10, 2)
)
USING DELTA
TBLPROPERTIES ('delta.enableDeletionVectors' = 'true',
               'delta.dataSkippingNumIndexedCols' = '3');
```


#### Query Optimization with Data Skipping


```sql
-- Queries that benefit from data skipping

-- Single column filter
SELECT * FROM my_catalog.my_schema.events
WHERE event_date = '2026-02-15';

-- Range filter
SELECT * FROM my_catalog.my_schema.transactions
WHERE created_at BETWEEN '2026-01-01' AND '2026-02-01';

-- Compound filter
SELECT * FROM my_catalog.my_schema.users
WHERE country = 'US' AND signup_date > '2025-01-01';
```


---


### Common Exam Scenarios

Scenario 1: Query Performance on Partitioned Data

A table stores 3 years of event data partitioned by date. A query filters on a specific date. Without data skipping, the engine scans files from all dates. With skipping enabled, min max statistics show which files contain the target date, and other files are skipped entirely. This can reduce I/O by 90 percent or more.

Scenario 2: Bloom Filters for Non Partitioned Data

A table has user IDs scattered across many files with no particular organization. Bloom filters on user_id column enable skipping files that definitely do not contain a specific user. This provides skipping benefits even when data is not partitioned or clustered.

Scenario 3: Compound Filters with Predicate Pushdown

A query has WHERE region = 'EU' AND revenue > 100000. Predicate pushdown evaluates both conditions early, and data skipping eliminates files that do not overlap the specified ranges. Statistics on both columns work together to minimize data scanned.


---


### Key Takeaways

* Min max statistics enable Delta to skip files based on column value ranges
* Bloom filters provide finer grained skipping than statistics alone for specific value searches
* Statistics are automatically collected when data is written and can be manually updated with ANALYZE
* Data skipping works best with filters on columns that have good selectivity and are frequently queried

---


### Gotchas and Tips


> [!NOTE]
> Statistics Staleness: Column statistics can become stale if data is frequently updated without re analyzing. Stale statistics lead to ineffective skipping. Automate ANALYZE in your pipelines for high velocity tables.


> [!NOTE]
> Bloom Filter Overhead: Bloom filters add small overhead during writes. For tables where data skipping is not beneficial (random access patterns), avoid enabling too many Bloom filters.


> [!NOTE]
> Column Type Matters: Data skipping works differently for different types. Numeric columns benefit most from min max statistics. String columns benefit more from Bloom filters.


---


### Links and Resources

* **[Data Skipping](https://docs.databricks.com/aws/en/delta/data-skipping)** — Leveraging column-level statistics to skip irrelevant files during queries.
* **[Dynamic File Pruning](https://docs.databricks.com/aws/en/optimizations/dynamic-file-pruning)** — Runtime optimization that prunes files based on join predicates.


## Change Data Feed (CDF)


### Topic Overview

Change Data Feed enables you to capture and propagate only the rows that changed in a Delta table. Instead of reprocessing entire tables during ETL, you can read only the inserts, updates, and deletes that occurred since the last run. This dramatically reduces compute, improves latency, and enables real time data propagation.

CDF is essential for incremental ETL pipelines and Change Data Capture scenarios. You enable it at the table level, then query changes using the table_changes() function. The _change_type column tells you whether each row was inserted, updated, or deleted. This works seamlessly with Lakeflow pipelines and downstream systems.

CDF also powers Delta Sharing, allowing external partners to receive only the changes relevant to them rather than entire snapshots. For data warehouses handling billions of rows, CDF transforms the economics of data pipelines.


---


### Key Concepts


<details>
<summary><b>Enabling CDF on Tables</b></summary>

CDF is enabled via table properties. Once enabled, Delta tracks inserts, updates, and deletes. You can enable it at creation time or add it to existing tables. There is minimal overhead, and historical changes are available if versioning is enabled.


</details>


<details>
<summary><b>Reading Changes with table_changes()</b></summary>

The table_changes() function reads changes between two versions or timestamps. Each change record has _change_type (insert, update_preimage, update_postimage, delete) and commit_version timestamp. This enables point in time recovery and audit trails.


</details>


<details>
<summary><b>Incremental ETL Patterns</b></summary>

Instead of SELECT * FROM source WHERE updated_at > last_checkpoint, use CDF to read only changes. This works for all DML operations including updates and deletes, not just new rows. Lakeflow pipelines can consume CDF streams directly.


</details>


<details>
<summary><b>CDF with Delta Sharing</b></summary>

Delta Sharing partners can consume changes via CDF instead of receiving full table snapshots. This is crucial for large tables where sending the entire dataset per share is economically infeasible. Only changes are transmitted, reducing bandwidth and cost.


</details>


---


### Code Examples


#### Enabling CDF


```sql
-- Enable CDF on new table
CREATE TABLE my_catalog.my_schema.customers (
  customer_id BIGINT,
  name STRING,
  email STRING,
  updated_at TIMESTAMP
)
USING DELTA
TBLPROPERTIES ('delta.enableChangeDataFeed' = 'true');

-- Enable on existing table
ALTER TABLE my_catalog.my_schema.customers
SET TBLPROPERTIES ('delta.enableChangeDataFeed' = 'true');
```


#### Reading Changes


```sql
-- Read all changes between version 5 and 10
SELECT * FROM table_changes('my_catalog.my_schema.customers', 5, 10);

-- Read changes with filter on _change_type
SELECT customer_id, email, _change_type, commit_version
FROM table_changes('my_catalog.my_schema.customers', 0, 100)
WHERE _change_type IN ('insert', 'update_postimage');

-- Read changes since specific timestamp
SELECT * FROM table_changes(
  'my_catalog.my_schema.customers',
  timestampAsOf => '2026-02-01 00:00:00'
);
```


#### Incremental ETL in Lakeflow


```python
from databricks.sdk.python.lakehouse import *

@dlt.table
def incrementally_loaded_customers():
    return (
        spark.sql("""
            SELECT *
            FROM table_changes('my_catalog.source.customers', 0, 100)
            WHERE _change_type != 'update_preimage'
        """)
    )

@dlt.table
def silver_customers():
    # Consume changes and apply business logic
    return (
        dlt.read('incrementally_loaded_customers')
        .withColumn('processed_at', current_timestamp())
    )
```


---


### Common Exam Scenarios

Scenario 1: Real Time Streaming ETL

A product catalog gets updated frequently with price and inventory changes. Instead of full scans, you enable CDF and stream changes to downstream systems in real time. Only the insert, update, and delete records are processed. This keeps multiple systems in sync with minimal latency.

Scenario 2: GDPR Compliance with Audit Trail

Customer data changes are tracked with CDF. When a deletion request arrives, you can prove which rows were deleted and when. The _change_type column shows deletes, and commit_version provides a complete audit trail for compliance demonstrations.

Scenario 3: Delta Sharing with Partners

You share customer transaction data with external partners. Sending the entire 10TB table daily is cost prohibitive. With CDF, partners receive only the daily changes via Delta Sharing, reducing bandwidth from terabytes to gigabytes.


---


### Key Takeaways

* CDF tracks inserts, updates, and deletes at the row level with _change_type and commit_version
* Enable CDF via table property for minimal overhead, available on new and existing tables
* Use table_changes() to read incremental data, reducing compute by processing only what changed
* CDF enables efficient Delta Sharing and provides audit trails for compliance

---


### Gotchas and Tips


> [!NOTE]
> update_preimage vs update_postimage: Updates generate two rows in CDF: preimage (old value) and postimage (new value). Filter wisely to avoid duplicates in downstream systems.


> [!NOTE]
> Version History Required: CDF requires Delta log retention. Very old changes may become unavailable if log retention is too short. Plan retention policies accordingly.


> [!NOTE]
> Exactly Once Semantics: When consuming CDF, use commit_version to track progress and avoid reprocessing the same changes.


---


### Links and Resources

* **[Change Data Feed](https://docs.databricks.com/aws/en/delta/delta-change-data-feed)** — Enabling and reading row-level change data for incremental downstream processing.
* **[Streaming with Delta Lake](https://docs.databricks.com/aws/en/structured-streaming/delta-lake)** — Using CDF with streaming queries for efficient incremental pipelines.


## Query Profile Analysis and Bottlenecks


### Topic Overview

Query profiling reveals exactly where your queries spend time and resources. By reading query profiles, you can identify bottlenecks like shuffle operations, spill to disk, and inefficient scans. This knowledge lets you optimize table design, partitioning, and query logic to run faster and cheaper.

The Spark UI shows detailed task execution metrics, including CPU time, I/O time, and memory usage. Photon, Databricks' native query engine, accelerates query execution by orders of magnitude for complex analytical queries. Adaptive query execution automatically adjusts plans based on real runtime statistics.

Understanding bottlenecks is crucial for cost optimization. A query spending 80 percent of time in shuffle typically needs better partitioning or clustering. One spending 80 percent in scan needs data skipping or liquid clustering. Profiling transforms guessing into data driven optimization.


---


### Key Concepts


<details>
<summary><b>Spark UI Metrics</b></summary>

The Spark UI displays task execution details: duration, input size, output size, and shuffle read/write. Identifying tasks with long durations or high spill indicates bottlenecks. Memory spill signals that partition sizes are too large or join operations are unbalanced.


</details>


<details>
<summary><b>Query Profiler</b></summary>

Databricks SQL query profiler shows execution plan with real execution time per node. It identifies expensive operations and helps rewrite queries. Timeline view shows what was happening on the cluster at each moment.


</details>


<details>
<summary><b>Photon Acceleration</b></summary>

Photon is a native vectorized query engine that speeds up analytical queries. It handles scans, aggregations, and joins faster than Spark. Many queries automatically use Photon when the cluster is configured for it. Identifying non Photon operations can reveal optimization opportunities.


</details>


<details>
<summary><b>Adaptive Query Execution</b></summary>

Adaptive Query Execution (AQE) changes the execution plan based on runtime statistics. It enables broadcast join optimization, partition coalescing, and skew handling. AQE is transparent and typically improves performance without code changes.


</details>


---


### Code Examples


#### Accessing Query Profiles


```sql
-- Run a query and profile it
SELECT customer_id, COUNT(*) as order_count
FROM my_catalog.my_schema.orders
GROUP BY customer_id
ORDER BY order_count DESC;

-- Access the query profile via Databricks SQL editor
-- Click "Query Profile" tab to see execution details

-- Or use Python SDK
from databricks.sdk import WorkspaceClient

ws = WorkspaceClient()
statement_execution_id = ws.query("SELECT * FROM my_table LIMIT 1000")
# Use Spark UI to view detailed metrics
```


#### Identifying Bottlenecks with Metrics


```sql
-- Query prone to shuffle (indicator of bottleneck)
SELECT o.order_id, c.customer_name, SUM(o.amount) as total
FROM my_catalog.my_schema.orders o
JOIN my_catalog.my_schema.customers c ON o.customer_id = c.customer_id
GROUP BY o.order_id, c.customer_name;

-- Optimized version with clustering
-- Ensure orders and customers are clustered by customer_id
-- This reduces shuffle by collocating matching rows

CREATE TABLE my_catalog.my_schema.orders_optimized (
  order_id BIGINT,
  customer_id BIGINT,
  amount DECIMAL(10, 2)
)
USING DELTA
CLUSTER BY (customer_id);
```


#### Enabling Photon


```sql
-- Check if Photon is enabled
SET spark.databricks.photon.enabled = true;

-- Verify in query profile that operations use Photon
-- Photon supported operations: scans, filters, projections, aggregations, joins

-- Some operations may fall back to Spark
-- Check query profile for unsupported operations and optimize if possible
```


---


### Common Exam Scenarios

Scenario 1: Identifying Shuffle Bottleneck

A join query takes 5 minutes with most time spent shuffling. The query profile shows shuffle is moving 50GB across the network. Applying liquid clustering to both tables on the join key reduces shuffle to 500MB. Query now runs in 30 seconds.

Scenario 2: Memory Spill Detection

An aggregation query spills to disk, indicating partitions are uneven. The profile shows some tasks process 10GB while others process 100MB. Repartitioning or using skew hints in the join distributes work more evenly.

Scenario 3: Photon vs Spark Trade Off

Photon accelerates most of the query but a custom UDF forces fallback to Spark. The profile shows the UDF is the bottleneck. Rewriting it in SQL or using a built in function enables Photon for the entire query, improving performance.


---


### Key Takeaways

* Query profilers reveal exactly where time is spent, enabling data driven optimization
* Shuffle, scan, and memory spill are common bottlenecks addressable with clustering and data skipping
* Photon acceleration works transparently but some operations force fallback to Spark
* Adaptive Query Execution optimizes plans automatically without code changes

---


### Gotchas and Tips


> [!NOTE]
> Profile Multiple Runs: Query performance varies with data distribution and cluster state. Profile the same query multiple times to get representative metrics.


> [!NOTE]
> Photon Limitations: Some UDFs, formats, and operations are not supported by Photon. Check the query profile and Photon documentation for compatibility.


> [!NOTE]
> Skew Handling: Highly skewed data leads to uneven task execution. Detect skew in the profile and use Salt joins or Photon skew handling.


---


### Links and Resources

* **[Query Profile](https://docs.databricks.com/aws/en/sql/user/queries/query-profile)** — Analyzing query execution plans to identify bottlenecks and optimize performance.
* **[Spark UI Guide](https://docs.databricks.com/aws/en/optimizations/spark-ui-guide/)** — Diagnosing skew, spill, and shuffle bottlenecks via the Spark UI.
