# Section 3: Data Transformation, Cleansing, and Quality

> Track: Databricks Certified Data Engineer Professional | Certification Preparation Guide

---


> [!NOTE]
> **Exam Weight: 10%** — Focuses on advanced Spark transformations including window functions, complex joins, and aggregations in both Spark SQL and PySpark. Also covers quarantining bad data using Lakeflow Declarative Pipelines or Auto Loader.


---



## Advanced Spark Transformations (Window Functions, Joins, Aggregations)


### Topic Overview

Advanced transformations are where the data engineering work happens. You need to master window functions to compute running totals and rank users. You need to understand different join types and when to broadcast small tables. You need to know aggregation patterns and how to use higher order functions for complex transformations.

Window functions let you compute per row values based on a partition and order. ROW_NUMBER gives you a unique row within a partition. LEAD and LAG let you access the previous or next row. RANK handles ties. You can compute running sums, moving averages, and cumulative totals. The Professional exam expects you to write window queries from scratch.

Joins are the foundation of multi table transformations. You need to know when to use INNER, LEFT, RIGHT, FULL OUTER, ANTI, and SEMI joins. Broadcast joins optimize by sending the small table to all executors. Aggregations with CUBE and ROLLUP generate subtotals and grand totals. Higher order functions like transform, filter, and reduce let you work with arrays and maps like functional programming. Master these and you can transform any data.


---


### Key Concepts


<details>
<summary><b>Window Functions: OVER, PARTITION BY, ORDER BY</b></summary>

A window function computes values over a window (set of rows). The OVER clause defines the window. PARTITION BY divides rows into groups. ORDER BY sorts within each group. For example, ROW_NUMBER() OVER (PARTITION BY user_id ORDER BY timestamp) gives each user's events a sequence number. LEAD and LAG access adjacent rows. SUM() OVER (PARTITION BY user_id ORDER BY timestamp) computes a running total. The frame (ROWS BETWEEN ...) controls which rows are included in the calculation.


</details>


<details>
<summary><b>Join Types and When to Use Each</b></summary>

INNER returns rows that match in both tables. LEFT keeps all left rows and matches from the right. RIGHT keeps all right rows and matches from the left. FULL OUTER keeps all rows from both. ANTI returns left rows with no match in the right (useful for filtering). SEMI returns left rows with at least one match in the right (without duplicating if the right has multiple matches). Choose based on whether you want to keep unmatched rows and which table's rows to preserve.


</details>


<details>
<summary><b>Broadcast Joins for Optimization</b></summary>

If one table is small enough to fit in memory, broadcast it to all executors instead of shuffling both tables. This is much faster. Spark auto broadcasts tables under a threshold (typically 10MB). You can force a broadcast with the broadcast() hint. Use broadcast for dimension tables joining with large fact tables.


</details>


<details>
<summary><b>CUBE and ROLLUP for Multi level Aggregations</b></summary>

CUBE generates all possible subtotals (all combinations of grouping columns). ROLLUP generates a hierarchy of subtotals (top down grouping). For example, GROUP BY ROLLUP (year, month, day) gives totals by year, by year and month, and by year, month, and day, plus a grand total. Use CUBE when all combinations are meaningful. Use ROLLUP when the grouping has a natural hierarchy.


</details>


<details>
<summary><b>Higher Order Functions: transform, filter, reduce</b></summary>

transform applies a function to each element of an array: transform(array_col, x -> x * 2). filter keeps elements that match a condition: filter(array_col, x -> x > 100). reduce aggregates an array to a single value: reduce(array_col, 0, (acc, x) -> acc + x). These are functional programming patterns embedded in SQL. Use them instead of explode and collect when possible because they are more efficient.


</details>


---


### Code Examples


#### Window Functions


```sql
-- ROW_NUMBER for ranking within each user
SELECT 
  user_id,
  event_timestamp,
  ROW_NUMBER() OVER (PARTITION BY user_id ORDER BY event_timestamp) as event_seq
FROM events;

-- Running total of purchases per user
SELECT 
  user_id,
  purchase_date,
  amount,
  SUM(amount) OVER (PARTITION BY user_id ORDER BY purchase_date 
    ROWS BETWEEN UNBOUNDED PRECEDING AND CURRENT ROW) as cumulative_spent
FROM purchases;

-- LEAD and LAG for comparing rows
SELECT 
  user_id,
  event_date,
  LAG(event_date) OVER (PARTITION BY user_id ORDER BY event_date) as prev_event,
  LEAD(event_date) OVER (PARTITION BY user_id ORDER BY event_date) as next_event,
  DATEDIFF(event_date, LAG(event_date) OVER (PARTITION BY user_id ORDER BY event_date)) as days_since_last
FROM user_activity;

-- RANK vs ROW_NUMBER for handling ties
SELECT 
  department,
  salary,
  ROW_NUMBER() OVER (PARTITION BY department ORDER BY salary DESC) as row_num,
  RANK() OVER (PARTITION BY department ORDER BY salary DESC) as salary_rank
FROM employees;
```


#### Join Types


```sql
-- INNER JOIN: only matching rows
SELECT o.order_id, c.customer_name, o.amount
FROM orders o
INNER JOIN customers c ON o.customer_id = c.customer_id;

-- LEFT JOIN: keep all orders, match customers if they exist
SELECT o.order_id, c.customer_name, o.amount
FROM orders o
LEFT JOIN customers c ON o.customer_id = c.customer_id;

-- ANTI JOIN: orders with no matching customer
SELECT o.order_id, o.amount
FROM orders o
LEFT ANTI JOIN customers c ON o.customer_id = c.customer_id;

-- SEMI JOIN: orders that have a matching customer (no duplication)
SELECT DISTINCT o.order_id, o.amount
FROM orders o
LEFT SEMI JOIN customers c ON o.customer_id = c.customer_id;

-- Broadcast join for small dimension
SELECT /*+ BROADCAST(regions) */ 
  s.sale_id, r.region_name, s.amount
FROM sales s
INNER JOIN regions r ON s.region_id = r.region_id;
```


#### CUBE and ROLLUP


```sql
-- ROLLUP: hierarchical subtotals (year, month, day levels)
SELECT 
  YEAR(sale_date) as year,
  MONTH(sale_date) as month,
  DAY(sale_date) as day,
  SUM(amount) as total_sales
FROM sales
GROUP BY ROLLUP (YEAR(sale_date), MONTH(sale_date), DAY(sale_date));
-- Returns: subtotals by year, by year+month, by year+month+day, and grand total

-- CUBE: all combinations of grouping columns
SELECT 
  department,
  job_title,
  location,
  COUNT(*) as num_employees,
  AVG(salary) as avg_salary
FROM employees
GROUP BY CUBE (department, job_title, location);
-- Returns: all combinations plus individual subtotals
```


#### Higher Order Functions


```sql
-- transform: apply function to each array element
SELECT 
  user_id,
  tags,
  transform(tags, x -> UPPER(x)) as tags_upper
FROM users;

-- filter: keep elements matching condition
SELECT 
  order_id,
  items,
  filter(items, x -> x.price > 100) as expensive_items
FROM orders;

-- reduce: aggregate array to single value
SELECT 
  user_id,
  purchases,
  reduce(purchases, 0, (acc, p) -> acc + p.amount) as total_spent
FROM user_purchases;

-- Complex example: transform prices in array
SELECT 
  order_id,
  items,
  transform(items, item -> named_struct('name', item.name, 'price_after_discount', item.price * 0.9)) as discounted_items
FROM orders;
```


---


### Common Exam Scenarios

Scenario 1: Computing Running Totals by User

You need to calculate each user's cumulative spending over time. Some users have multiple transactions on the same day. How do you ensure the running total is correct even with ties in timestamp?

Use a window function with ROWS BETWEEN UNBOUNDED PRECEDING AND CURRENT ROW. This frame includes all rows up to the current row. Add a secondary sort key (transaction ID or row number) to break ties consistently. This ensures reproducible results regardless of processing order.

Scenario 2: Anti Join for Data Quality

You have transactions and a list of blocked customers. You want to find transactions from customers NOT in the blocked list. Which join type should you use?

Use LEFT ANTI JOIN. It returns rows from the left table that have no match in the right table. This is more efficient than LEFT JOIN followed by filtering for NULL values. It does not require any group by or deduplication.

Scenario 3: Broadcast Join for Performance

Your queries join a 10GB fact table (sales) with a 5MB dimension table (stores). The join is slow. What can you do?

Broadcast the stores table. Use the /*+ BROADCAST(stores) */ hint or rely on Spark's auto broadcast if stores is under the threshold. This sends stores to all executors instead of shuffling both tables. It avoids an expensive shuffle and dramatically speeds up the join.


---


### Key Takeaways

* Window functions are essential for analytics. They compute per row metrics without collapsing data like GROUP BY does.
* Always specify the frame (ROWS BETWEEN ...) in window functions to avoid surprises with ties and edge cases.
* Use ANTI JOIN for exclusion filters and SEMI JOIN to find matching rows without duplication.
* Broadcast small tables to avoid shuffles. Check your Spark UI to confirm broadcast joins are happening.
* Higher order functions like transform and filter are more efficient than explode and collect for array operations.

---


### Gotchas and Tips


> [!NOTE]
> Window functions can be expensive if the partition is large. Partitioning by user ID works well if data is skewed. Consider repartitioning if one user has millions of rows.


> [!NOTE]
> CUBE generates exponentially more rows (2^n combinations). Use it carefully and filter the result to only combinations you care about.


> [!NOTE]
> Broadcast only works if the small table fits in memory on all executors. If broadcast fails silently, check the size limit setting (spark.sql.autoBroadcastJoinThreshold).


---


### Links and Resources

* **[SQL Language Reference](https://docs.databricks.com/aws/en/sql/language-manual/)** — Complete SQL reference for window functions, higher-order functions, and complex transformations.
* **[MERGE INTO](https://docs.databricks.com/aws/en/delta/merge)** — Upsert operations combining insert, update, and delete in a single statement.


## Quarantining Bad Data


### Topic Overview

Data quality expectations are critical in production pipelines. You cannot let bad data silently poison your tables. You need to define what "good" data looks like, catch violations, and decide whether to quarantine, drop, or fail.

Lakeflow provides the expect and expect_or_drop APIs to define quality checks as part of the pipeline. Auto Loader rescues unparseable records to the _rescued_data column instead of failing. You can then inspect, fix, or quarantine them. This pattern keeps your main tables clean while preserving visibility into data quality issues.

The Professional exam tests whether you can design end to end data quality systems. You need to know how to implement quality gates at each layer (Bronze, Silver, Gold), how to quarantine bad records for investigation, and how to monitor and alert on data quality violations. This is not optional. This is how mature data teams operate.


---


### Key Concepts


<details>
<summary><b>Lakeflow Expectations: expect, expect_or_drop, expect_or_fail</b></summary>

Expectations define quality constraints and are checked during pipeline execution. expect logs violations but does not stop the pipeline. expect_or_drop removes rows that fail the expectation (quarantine by dropping). expect_or_fail stops the pipeline if the expectation fails (strict mode). You can chain multiple expectations. The output is a quality report that tracks pass/fail rates over time.


</details>


<details>
<summary><b>Rescue Columns for Handling Parse Errors</b></summary>

When Auto Loader encounters unparseable data (schema mismatch, encoding errors, malformed JSON), it can rescue the raw data instead of failing. The _rescued_data column is a JSON string containing the raw bytes or unparseable fields. You then filter on _rescued_data IS NULL to get valid rows, and _rescued_data IS NOT NULL to find problematic rows. This is especially useful for evolutionary schemas where you do not want to fail on unknown fields.


</details>


<details>
<summary><b>Quarantine Tables and Bad Data Repositories</b></summary>

A quarantine table holds records that failed quality expectations or could not be parsed. Unlike discarding, quarantining preserves the bad data for investigation. You can later debug, fix, and replay. Quarantine tables should include metadata (original timestamp, reason for quarantine, attempt count) so you know when to investigate and how to route to a data steward.


</details>


<details>
<summary><b>Data Quality Metrics and Monitoring</b></summary>

Track metrics like pass rate, record counts, and quarantine rate. Use SQL alerts to notify when quality drops below a threshold. Log expectations to a metrics table for historical trending. This gives visibility into data quality over time and early warning of systemic issues.


</details>


---


### Code Examples


#### Lakeflow Expectations


```python
import dlt

# Read from Auto Loader with rescue mode
df = spark.readStream \
  .format("cloudFiles") \
  .option("cloudFiles.format", "json") \
  .option("cloudFiles.schemaEvolutionMode", "rescue") \
  .load("/path/to/data/")

# Create a streaming table with expectations
@dlt.table(
  comment="Raw user events with quality expectations"
)
@dlt.expect("valid_json", "_rescued_data IS NULL")
@dlt.expect("non_null_user_id", "user_id IS NOT NULL")
@dlt.expect("valid_email", "email LIKE '%@%'")
def raw_events():
  return df

# Create another layer with stricter expectations (drop bad records)
@dlt.table(
  comment="Valid events only"
)
@dlt.expect_or_drop("email_not_empty", "email != ''")
@dlt.expect_or_drop("positive_amount", "amount > 0")
def valid_events():
  return dlt.read("raw_events").filter("_rescued_data IS NULL")

# Fail the pipeline if critical expectation fails
@dlt.table(
  comment="Processed events (fail on critical issues)"
)
@dlt.expect_or_fail("no_duplicates", "COUNT(*) == COUNT(DISTINCT event_id)")
def processed_events():
  return dlt.read("valid_events").select("user_id", "email", "amount", "timestamp")
```


#### Quarantine Table Pattern


```python
import dlt
from pyspark.sql.functions import current_timestamp, lit

# Read raw data with rescue mode enabled
df_raw = spark.readStream \
  .format("cloudFiles") \
  .option("cloudFiles.format", "json") \
  .option("cloudFiles.schemaEvolutionMode", "rescue") \
  .load("/Volumes/my_catalog/my_schema/my_volume/events/")

# Separate good and bad records
df_good = df_raw.filter("_rescued_data IS NULL").drop("_rescued_data")
df_bad = df_raw.filter("_rescued_data IS NOT NULL").select(
  "_rescued_data",
  current_timestamp().alias("quarantine_timestamp"),
  lit("parse_error").alias("failure_reason")
)

# Append good records to main table
dlt.create_streaming_table(
  name="raw_events",
  comment="Valid events only"
)
dlt.append_or_replace_table(
  name="raw_events",
  spark_df=df_good
)

# Append bad records to quarantine table for investigation
dlt.create_streaming_table(
  name="quarantine_bad_events",
  comment="Events that could not be parsed"
)
dlt.append_or_replace_table(
  name="quarantine_bad_events",
  spark_df=df_bad
)

# Monitor quarantine table
@dlt.table(
  comment="Quarantine summary"
)
def quarantine_summary():
  return spark.sql("""
    SELECT 
      COUNT(*) as bad_record_count,
      DATE(quarantine_timestamp) as quarantine_date,
      failure_reason
    FROM quarantine_bad_events
    GROUP BY DATE(quarantine_timestamp), failure_reason
    ORDER BY quarantine_date DESC
  """)
```


#### Using expect_or_drop with Expectations


```python
import dlt
from pyspark.sql.functions import col

# Read clean data
df_silver = dlt.read("raw_events").filter("_rescued_data IS NULL")

# Apply business logic rules and drop invalid rows
@dlt.table(
  comment="Gold layer with strict quality gates"
)
@dlt.expect_or_drop("positive_revenue", "revenue > 0")
@dlt.expect_or_drop("valid_date", "sale_date >= '2020-01-01'")
@dlt.expect_or_drop("email_format", "email REGEXP '^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\\.[a-zA-Z]{2,}$'")
def gold_customers():
  return df_silver.select(
    col("customer_id"),
    col("email"),
    col("revenue"),
    col("sale_date")
  )

# Monitor quality metrics
@dlt.table(
  comment="Quality metrics for gold layer"
)
def gold_quality_metrics():
  total = dlt.read("raw_events").filter("_rescued_data IS NULL").count()
  gold_count = dlt.read("gold_customers").count()
  return spark.createDataFrame([
    ("raw_events", total),
    ("gold_customers", gold_count),
    ("dropped_records", total - gold_count),
    ("pass_rate_pct", round(100.0 * gold_count / total, 2) if total > 0 else 0)
  ], ["layer", "count_or_metric"])
```


---


### Common Exam Scenarios

Scenario 1: Handling Schema Evolution with Quality Gates

Your upstream data source adds a new optional field. The old schema expects 10 fields, now there are 11. Your existing expectations fail. How do you evolve without breaking the pipeline?

Use rescue mode in Auto Loader to gracefully handle unknown fields. They go to _rescued_data. Your existing expectations still apply to known fields. Once you understand the new field, add it to the schema explicitly and create a new expectation for it. This decouples schema changes from quality gates.

Scenario 2: Quarantine Design for Investigation

Your Bronze layer has 100K records daily. 0.1% fail expectations. Should you quarantine them or drop them?

Quarantine them. Even if it is just 100 records daily, that is 36K records per year. They deserve investigation. Create a quarantine table with metadata (timestamp, reason, original data). Route to a data steward weekly to understand patterns and fix root causes. Dropping data without investigation is lazy.

Scenario 3: Critical vs Non Critical Expectations

Your Gold table needs user_id (critical), revenue (non critical), and email (critical). How do you design expectations?

Use expect_or_fail for user_id and email (stop the pipeline if missing). Use expect_or_drop for revenue (allow records without it). This way, critical business logic is protected but non critical missing values do not halt the pipeline. Design expectations proportionally to business impact.


---


### Key Takeaways

* Expectations are assertions about data quality. Use expect to log, expect_or_drop to filter, and expect_or_fail to stop.
* Quarantine bad data instead of dropping it. Metadata helps you investigate and improve upstream processes.
* Rescue mode in Auto Loader gracefully handles parse errors and schema evolution without failing the pipeline.
* Design expectations proportionally. Critical fields get expect_or_fail. Nice to have fields get expect_or_drop.
* Monitor quality metrics and quarantine rates. Use them to identify patterns and drive improvements.

---


### Gotchas and Tips


> [!NOTE]
> expect_or_drop can silently hide quality issues if you are not monitoring the drop rate. Always log expectations to a metrics table and alert if the drop rate changes unexpectedly.


> [!NOTE]
> Quarantine tables grow unbounded unless you have a retention policy. Set up a job to archive or delete old quarantine records after a retention period (e.g., 90 days).


> [!NOTE]
> expect_or_fail will halt your entire pipeline. Use it only for truly critical constraints. For most cases, prefer expect or expect_or_drop to keep the pipeline resilient.


---


### Links and Resources

* **[Lakeflow SDP Concepts](https://docs.databricks.com/aws/en/ldp/concepts)** — Using expectations and constraints to validate and quarantine bad data.
* **[Delta Best Practices](https://docs.databricks.com/aws/en/delta/best-practices)** — Data quality patterns and best practices for production Delta pipelines.
