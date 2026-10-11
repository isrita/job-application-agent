# Section 10: Data Modelling

> Track: Databricks Certified Data Engineer Professional | Certification Preparation Guide

---


> [!NOTE]
> **Exam Weight: 6%** — Covers scalable data models with Delta Lake, choosing between liquid clustering, partitioning, and Z-order, and dimensional modelling for analytical workloads (star schema, slowly changing dimensions).


---



## Scalable Data Models with Delta Lake


### Topic Overview

Delta Lake is the foundation for building scalable data models in Databricks. Unlike traditional databases, Delta Lake's support for ACID transactions, schema enforcement, and time travel enables data engineers to build models that are both fast and reliable. When designing tables, you must consider how data will be read and written, whether concurrent access is needed, and how to handle schema evolution.

The Professional exam tests your ability to design tables that scale, use Delta features (ACID transactions, MERGE, time travel) effectively, and understand trade offs between different data organization strategies.


### Key Concepts


<details>
<summary><b>**ACID Transactions and Consistency Guarantees**</b></summary>

Delta Lake guarantees ACID semantics: Atomicity (all or nothing), Consistency (data integrity), Isolation (concurrent writes don't interfere), Durability (committed data persists). This allows you to safely use MERGE and UPDATE operations without worrying about partial writes or inconsistent state. Traditional data lakes cannot guarantee these properties.


</details>


<details>
<summary><b>**Schema Enforcement and Evolution**</b></summary>

Delta Lake enforces the defined schema: writes that violate the schema are rejected. You can evolve the schema by adding new columns with ALTER TABLE ADD COLUMNS. Use schema mode='merge_schema' on writes to allow adding missing columns. This prevents silent data corruption and makes data contracts explicit.


</details>


<details>
<summary><b>**Time Travel and Point in Time Recovery**</b></summary>

Delta Lake maintains a log of all changes. You can query tables as they existed at a previous version using SELECT * FROM table VERSION AS OF 10 or SELECT * FROM table TIMESTAMP AS OF '2025-02-15'. This enables auditing, rollbacks, and debugging without restoring from backups. Older versions are retained for a configurable period (default 30 days).


</details>


<details>
<summary><b>**Designing for Concurrent Reads and Writes**</b></summary>

Use MERGE to handle concurrent updates safely without conflicts. Partition tables by a column with low cardinality (e.g., date) to reduce the amount of data locked during updates. Use clustering (Liquid Clustering or Z Order) to co locate related data. Avoid full table scans on large tables by creating appropriate indexes or using data skipping.


</details>


### Code Examples


#### Creating Tables with Schema Enforcement


```sql
-- Create a Delta table with explicit schema
CREATE TABLE IF NOT EXISTS my_catalog.my_schema.customers (
  customer_id INT NOT NULL,
  name STRING NOT NULL,
  email STRING NOT NULL,
  created_date DATE,
  updated_date TIMESTAMP
)
USING DELTA
PARTITIONED BY (created_date);

-- Schema enforcement: This will FAIL if email column is missing
INSERT INTO my_catalog.my_schema.customers
VALUES (1, 'John', 'john@example.com', CURRENT_DATE, CURRENT_TIMESTAMP);

-- Evolve schema by adding a column
ALTER TABLE my_catalog.my_schema.customers
ADD COLUMN phone_number STRING;

-- Allow schema evolution on insert
INSERT INTO my_catalog.my_schema.customers
VALUES (2, 'Jane', 'jane@example.com', CURRENT_DATE, CURRENT_TIMESTAMP, '555-1234');
```


#### Using Time Travel for Auditing and Recovery


```sql
-- View table version history
DESC HISTORY my_catalog.my_schema.customers;

-- Query table as it was at a previous version
SELECT * FROM my_catalog.my_schema.customers VERSION AS OF 5;

-- Query table as it was at a specific timestamp
SELECT * FROM my_catalog.my_schema.customers 
TIMESTAMP AS OF '2025-02-01 10:00:00';

-- Restore table to a previous version
RESTORE TABLE my_catalog.my_schema.customers TO VERSION AS OF 5;

-- Get row count at a point in time
SELECT COUNT(*) FROM my_catalog.my_schema.customers 
TIMESTAMP AS OF '2025-02-10';
```


#### Using MERGE for Safe Concurrent Updates


```sql
-- MERGE enables atomic updates without conflicts
MERGE INTO my_catalog.my_schema.customers c
USING staging_data s
ON c.customer_id = s.customer_id
WHEN MATCHED AND s.operation = 'UPDATE'
  THEN UPDATE SET c.email = s.email, c.updated_date = CURRENT_TIMESTAMP
WHEN MATCHED AND s.operation = 'DELETE'
  THEN DELETE
WHEN NOT MATCHED
  THEN INSERT (customer_id, name, email, created_date, updated_date)
       VALUES (s.customer_id, s.name, s.email, CURRENT_DATE, CURRENT_TIMESTAMP);

-- MERGE is atomic: all changes succeed or all fail
-- No partial updates or corruption possible
```


### Common Exam Scenarios

**A downstream report is showing incorrect customer counts. You suspect data was corrupted in a recent update. How would you use Delta Lake to investigate?**

Query the history of the table to see what changed and when. Use DESC HISTORY to find versions. Check the data before and after the suspected update using TIMESTAMP AS OF. Once you identify the bad version, use RESTORE TABLE TO VERSION AS OF to roll back to a good state. This is possible only with Delta Lake.

**You need to update customer records, but you're worried about race conditions. Multiple ETL jobs run in parallel and update the same table. How do you ensure data consistency?**

Use MERGE instead of INSERT or UPDATE. MERGE is atomic and handle concurrent writes safely. Partition the table by a low cardinality column (e.g., processing_date) so that different jobs lock different partitions. Apply LIQUID CLUSTERING to reduce the scope of locked data if you're updating on high cardinality columns.


### Key Takeaways

* ACID transactions in Delta Lake ensure data consistency even with concurrent writes.
* Schema enforcement prevents silent data corruption.
* Time travel enables auditing and recovery without backup restoration.
* Use MERGE for safe updates; partition for concurrent access.

### Gotchas and Tips


> [!NOTE]
> Time travel is only available for versions within the retention period (default 30 days). After that, old versions are garbage collected and cannot be recovered.


> [!NOTE]
> MERGE on large tables can be slow if the merge key is high cardinality. Use clustering to improve performance.


---


### Links and Resources

* **[Delta Best Practices](https://docs.databricks.com/aws/en/delta/best-practices)** — Building scalable data models with Delta Lake table design patterns.
* **[Tables and Views](https://docs.databricks.com/aws/en/data-engineering/tables-views)** — Creating and managing tables and views for analytical workloads.


## Liquid Clustering vs Partitioning and ZOrder


### Topic Overview

Databricks offers three main strategies for optimizing data layout to improve query performance: traditional partitioning, Z-order indexing, and the newer liquid clustering. Understanding when and how to use each is critical for the Professional exam. Liquid clustering represents a significant shift in how Databricks approaches data organization, offering automatic, incremental optimization without the maintenance overhead of traditional partitioning.

Traditional partitioning divides data physically on disk based on column values, making it excellent for filtering on low cardinality columns. Z-order builds multi dimensional co locality using the OPTIMIZE ZORDER BY command, which reorders files to improve performance across multiple columns simultaneously. Liquid clustering, introduced as the modern approach, automatically and incrementally clusters data by specified columns without requiring full data rewrites.

On the exam, expect questions about performance trade offs, migration strategies, when to choose one approach over another, and how liquid clustering integrates into Delta Lake optimization workflows.


---


### Key Concepts


<details>
<summary><b>Traditional Partitioning</b></summary>

Data is divided into separate directories based on the values of one or more columns. For example, partitioning a sales table by year creates year=2023, year=2024 subdirectories. Works best with low cardinality columns (few unique values). Queries that filter on the partition column skip entire partitions (partition pruning), dramatically improving performance. However, too many partitions create excessive small files and metadata overhead. Requires manual maintenance and the table schema must be defined with partitioning upfront.


</details>


<details>
<summary><b>Z-Order Indexing</b></summary>

Reorders data within files to improve locality across multiple columns simultaneously using a Z-order curve algorithm. Applied via OPTIMIZE table_name ZORDER BY col1, col2. Beneficial when you have high cardinality columns or need to filter on multiple columns frequently. Unlike partitioning, Z-order works on any data type and does not create the small files problem. However, running OPTIMIZE ZORDER is an explicit command that rewrites the entire table.


</details>


<details>
<summary><b>Liquid Clustering</b></summary>

A built in optimization strategy that automatically clusters data by specified columns without requiring explicit OPTIMIZE commands or full table rewrites. Defined using CLUSTER BY col1, col2 in the CREATE TABLE statement. Data is clustered incrementally as new data is written, making it ideal for streaming and constantly updated tables. No partition explosion even with high cardinality columns.


</details>


<details>
<summary><b>Migration Path from Traditional Partitioning</b></summary>

When migrating from a partitioned table to liquid clustering, create a new table with CLUSTER BY instead of PARTITION BY, then insert data from the old table. The migration is typically one way because liquid clustering provides benefits without the maintenance burden.


</details>


---


### Code Examples


#### Traditional Partitioning


```sql
CREATE TABLE sales_partitioned (
  order_id INT,
  customer_id INT,
  amount DECIMAL(10, 2),
  order_date DATE
)
USING DELTA
PARTITIONED BY (order_date);

INSERT INTO sales_partitioned VALUES
  (1, 100, 99.99, '2024-01-15'),
  (2, 101, 149.99, '2024-01-20');

SELECT * FROM sales_partitioned 
WHERE order_date = '2024-01-15';
```


#### Z-Order Optimization


```sql
CREATE TABLE sales_zorder (
  order_id INT,
  customer_id INT,
  amount DECIMAL(10, 2),
  order_date DATE,
  region STRING
)
USING DELTA;

OPTIMIZE sales_zorder
ZORDER BY (customer_id, order_date);

SELECT * FROM sales_zorder
WHERE customer_id = 100 AND order_date >= '2024-01-01';
```


#### Liquid Clustering


```sql
CREATE TABLE sales_liquid CLUSTER BY (customer_id, order_date) (
  order_id INT,
  customer_id INT,
  amount DECIMAL(10, 2),
  order_date DATE
)
USING DELTA;

INSERT INTO sales_liquid VALUES
  (1, 100, 99.99, '2024-01-15'),
  (2, 101, 149.99, '2024-01-20');

SELECT * FROM sales_liquid
WHERE customer_id = 100;
```


#### Migration from Partitioning to Liquid Clustering


```sql
CREATE TABLE sales_new CLUSTER BY (customer_id, order_date) (
  order_id INT,
  customer_id INT,
  amount DECIMAL(10, 2),
  order_date DATE
)
USING DELTA;

INSERT INTO sales_new
SELECT * FROM sales_old;

DROP TABLE sales_old;
ALTER TABLE sales_new RENAME TO sales;
```


---


### Common Exam Scenarios


#### Choosing Between Strategies for High Cardinality

A table has 1 million customer IDs and you need fast queries filtering on customer_id. Traditional partitioning would create 1 million partitions (unusable due to metadata explosion). Z-order would work but requires manual OPTIMIZE runs. Liquid clustering handles high cardinality automatically without partition explosion and clusters incrementally as data arrives. The key is recognizing when cardinality rules out partitioning.


#### Optimizing a Real Time Streaming Table

Data arrives in real time and queries filter on user_id and event_timestamp. Z-order requires periodic OPTIMIZE operations which are expensive and delay improvements. Liquid clustering clusters data automatically as it streams in, requires no maintenance, and queries benefit immediately.


#### Cost Optimization for a Large Historical Table

An existing table has 10 years of data partitioned by year, but queries now filter on product_id (high cardinality). Running OPTIMIZE ZORDER on this large table is expensive. Migrating to liquid clustering during a maintenance window eliminates future optimization costs, while Z-order is only a temporary fix.


---


### Key Takeaways

Use traditional partitioning only for low cardinality columns and when you know the partition scheme upfront. Avoid partitioning on high cardinality columns.

Z-order is useful for high cardinality columns and multi column filtering, but requires scheduled OPTIMIZE operations which incur compute cost.

Liquid clustering is the modern choice: it handles high cardinality, works incrementally, requires no maintenance, and performs well for streaming.

Liquid clustering clusters data as writes occur, not after the fact, making it cost effective and eliminating the maintenance burden.

When migrating from partitioning or Z-order to liquid clustering, create a new table with CLUSTER BY and migrate the data. This is the recommended path.


---


### Gotchas and Tips


> [!NOTE]
> Partition Explosion Risk: Creating too many partitions (1000+) from high cardinality columns causes metadata overhead that slows down the metastore and query planning. This is why liquid clustering and Z-order are preferred.


> [!NOTE]
> OPTIMIZE Costs: Running OPTIMIZE ZORDER scans and rewrites the entire table. For large tables, schedule these during off peak hours and batch operations together. Liquid clustering avoids this cost by clustering incrementally.


> [!NOTE]
> Liquid Clustering Requires Table Recreation: You cannot add CLUSTER BY to an existing table without creating a new table and migrating data. Plan migrations during maintenance windows.


---


### Links and Resources

* **[Liquid Clustering](https://docs.databricks.com/aws/en/delta/clustering)** — Adaptive data layout that replaces traditional partitioning and Z-ordering.
* **[OPTIMIZE Command](https://docs.databricks.com/aws/en/delta/optimize)** — File compaction and Z-ordering for legacy table optimization.
* **[Data Skipping](https://docs.databricks.com/aws/en/delta/data-skipping)** — How clustering and partitioning enable data skipping for faster queries.


## Dimensional Modelling for Analytical Workloads


### Topic Overview

Dimensional modelling is a structured approach to designing databases for analytics and reporting, and it is a core topic on the Professional exam. This design methodology organizes data into fact tables (containing metrics and measurements) and dimension tables (containing descriptive attributes). On Databricks, dimensional models are implemented using Delta Lake, which provides the ACID guarantees, time travel, and schema enforcement needed for complex analytical schemas.

The medallion architecture (bronze, silver, gold layers) naturally aligns with dimensional modelling, where the gold layer contains the final dimensional model. Star schemas and snowflake schemas are the two main dimensional patterns, with star schemas preferred for simplicity and query performance, and snowflake schemas used when dimension tables need further normalization. Slowly Changing Dimensions (SCD) are a critical concept: they handle how dimension data changes over time, with Type 1 (overwrite), Type 2 (history with surrogate keys), and Type 3 (current and previous values) being the most common approaches.

On the exam, expect questions about designing star schemas, implementing SCDs using MERGE statements, when to denormalize fact tables, surrogate key generation, and how dimensional models support fast analytical queries and business intelligence tools.


---


### Key Concepts


<details>
<summary><b>Star Schema</b></summary>

A fact table sits at the center surrounded by multiple dimension tables connected via foreign keys. The fact table contains measures (aggregatable metrics like sales, quantities) and foreign key references to dimensions. Dimension tables contain the descriptive attributes (customer name, product category, date). This structure enables fast queries because dimension tables are typically small and can be joined efficiently. Star schemas are intuitive for business users and simplify query writing. The design is denormalized, trading some storage space for query performance.


</details>


<details>
<summary><b>Snowflake Schema</b></summary>

An extension of the star schema where dimension tables are further normalized into sub dimensions. For example, a Product dimension might be split into Product, Category, and Subcategory dimensions, each with its own table and relationships. This reduces redundancy and storage but adds complexity and additional joins. Useful when dimensions have hierarchies or shared attributes across multiple dimensions. However, the extra joins can slow down query performance compared to a fully denormalized star schema. Modern analytical workloads on Databricks typically favor star schemas because storage is cheap and query performance is critical.


</details>


<details>
<summary><b>Slowly Changing Dimensions (SCD) Types</b></summary>

Type 1: Overwrite the old value with the new value. Used when historical tracking is not required. Type 2: Keep a full history of changes by adding new rows with surrogate keys and effective date ranges. Most common approach for analytics. Allows analysis of how dimensions changed over time. Type 3: Store current and previous values in the same row using multiple columns. Used when you only need to track the most recent change. On Databricks, Type 2 is implemented using MERGE with INSERT and UPDATE operations to handle insertions of new dimension members and updates to existing ones.


</details>


<details>
<summary><b>Surrogate Keys and Denormalization</b></summary>

Surrogate keys are system generated primary keys (typically auto incrementing integers) that uniquely identify dimension rows. They are preferred over business keys (like customer ID or product SKU) because business keys can change and be reused. Surrogate keys are essential for Type 2 SCDs because they uniquely identify each version of a dimension member. Denormalization in fact tables involves optionally storing frequently accessed dimension attributes directly in the fact table to avoid joins. This is a trade off: denormalization reduces query complexity but increases storage and maintenance overhead. On Databricks with Delta Lake, denormalization decisions depend on query patterns and the cost of computing resources versus storage.


</details>


---


### Code Examples


#### Star Schema Design


```sql
-- Dimension tables
CREATE TABLE dim_customer (
  customer_key INT PRIMARY KEY,
  customer_id INT,
  customer_name STRING,
  country STRING,
  segment STRING
);

CREATE TABLE dim_product (
  product_key INT PRIMARY KEY,
  product_id INT,
  product_name STRING,
  category STRING,
  unit_price DECIMAL(10, 2)
);

CREATE TABLE dim_date (
  date_key INT PRIMARY KEY,
  full_date DATE,
  year INT,
  month INT,
  day INT
);

-- Fact table
CREATE TABLE fact_sales (
  sales_id INT,
  customer_key INT,
  product_key INT,
  date_key INT,
  quantity INT,
  amount DECIMAL(12, 2),
  FOREIGN KEY (customer_key) REFERENCES dim_customer,
  FOREIGN KEY (product_key) REFERENCES dim_product,
  FOREIGN KEY (date_key) REFERENCES dim_date
);
```


#### SCD Type 2 Implementation with MERGE


```sql
-- SCD Type 2: Insert new customer or update existing
MERGE INTO dim_customer t
USING staging_customer s
ON t.customer_id = s.customer_id AND t.is_active = true
WHEN MATCHED AND t.customer_name <> s.customer_name THEN
  UPDATE SET is_active = false, end_date = current_date
WHEN MATCHED AND t.customer_name = s.customer_name THEN
  UPDATE SET last_updated = current_timestamp
WHEN NOT MATCHED THEN
  INSERT (customer_key, customer_id, customer_name, country, is_active, start_date, end_date)
  VALUES (next_val('customer_seq'), s.customer_id, s.customer_name, s.country, true, current_date, NULL);

-- Insert new version with updated attributes
INSERT INTO dim_customer
SELECT next_val('customer_seq'), customer_id, customer_name, country, true, current_date, NULL
FROM staging_customer
WHERE customer_id NOT IN (SELECT customer_id FROM dim_customer);
```


#### SCD Type 1: Simple Overwrite


```sql
-- SCD Type 1: Just overwrite the old value
MERGE INTO dim_product t
USING staging_product s
ON t.product_id = s.product_id
WHEN MATCHED THEN
  UPDATE SET
    product_name = s.product_name,
    category = s.category,
    unit_price = s.unit_price,
    last_updated = current_timestamp
WHEN NOT MATCHED THEN
  INSERT (product_key, product_id, product_name, category, unit_price, last_updated)
  VALUES (next_val('product_seq'), s.product_id, s.product_name, s.category, s.unit_price, current_timestamp);
```


#### Analytical Query on Star Schema


```sql
-- Query total sales by customer and product
SELECT
  dc.customer_name,
  dp.product_name,
  dd.year,
  SUM(fs.amount) as total_sales,
  SUM(fs.quantity) as total_quantity
FROM fact_sales fs
JOIN dim_customer dc ON fs.customer_key = dc.customer_key
JOIN dim_product dp ON fs.product_key = dp.product_key
JOIN dim_date dd ON fs.date_key = dd.date_key
WHERE dd.year = 2024
GROUP BY dc.customer_name, dp.product_name, dd.year
ORDER BY total_sales DESC;
```


---


### Common Exam Scenarios


#### Building a Star Schema for an E commerce Business

You need to design a dimensional model for tracking online sales. The fact table contains order details (quantity, amount, discount). Dimensions include customer (with geographic and demographic attributes), product (with category hierarchy), and date (with fiscal calendar). The candidate should recognize that a star schema is appropriate here because joins are efficient, dimensions are relatively static, and queries benefit from the denormalized structure. Performance is critical for the BI tool connecting to this model.


#### Handling Customer Address Changes with SCD Type 2

A customer moves to a new city. Should you overwrite their old address (SCD Type 1) or keep history (SCD Type 2)? The answer depends on analytical requirements. If you need to analyze sales by the customer's address at the time of purchase (historical accuracy), use Type 2 with surrogate keys and date ranges. If you only care about the current address for reporting, Type 1 is simpler. The exam tests whether candidates understand this trade off and can implement MERGE statements correctly.


#### Denormalizing a Fact Table for Performance

Queries on a star schema frequently join the fact table with dimensions to retrieve product_category. Rather than always joining, you decide to denormalize by adding product_category directly to the fact table. This eliminates joins but increases storage and requires updating denormalized columns when the dimension changes. The candidate should understand when denormalization is worthwhile (frequent joins on that dimension) versus when it creates maintenance overhead.


---


### Key Takeaways

Star schemas are the foundation of dimensional modelling on Databricks: one fact table surrounded by dimension tables, optimized for fast analytical queries.

Surrogate keys (auto incrementing integers) uniquely identify dimension rows and enable SCD Type 2 implementations. Always use surrogate keys instead of business keys in fact tables.

SCD Type 2 tracks full history of dimension changes using surrogate keys and date ranges. Implement using MERGE: UPDATE old rows to mark as inactive, INSERT new rows with new surrogate keys.

The medallion architecture maps naturally to dimensional modelling: bronze is raw data, silver is cleansed staging, gold is the final dimensional model for analytics.

Denormalize fact tables strategically when specific column combinations are queried frequently. Balance storage costs against query performance and maintenance overhead.


---


### Gotchas and Tips


> [!NOTE]
> Business Keys vs Surrogate Keys: Do not use business keys (customer ID, product SKU) directly in fact tables. They can change or be reused. Always use auto incrementing surrogate keys and store business keys in dimension tables for traceability.


> [!NOTE]
> SCD Type 2 Complexity: Implementing Type 2 correctly requires careful logic in MERGE statements. Test thoroughly with examples where attributes change and new records are added simultaneously. Mistakes can corrupt dimensional history.


> [!NOTE]
> Snowflake Schema Overhead: While snowflake schemas reduce redundancy, the extra joins degrade query performance. Only normalize dimensions if storage or data quality issues justify the additional query complexity.


---


### Links and Resources

* **[Medallion Architecture](https://docs.databricks.com/aws/en/lakehouse/medallion)** — Star schema and dimensional modelling patterns within the medallion architecture.
* **[Delta Best Practices](https://docs.databricks.com/aws/en/delta/best-practices)** — Designing fact and dimension tables optimized for analytical queries.
