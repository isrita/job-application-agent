# Section 5: Monitoring and Alerting

> Track: Databricks Certified Data Engineer Professional | Certification Preparation Guide

---


> [!NOTE]
> **Exam Weight: 10%** — Covers system tables for observability, Query Profiler and Spark UI, REST APIs and CLI for monitoring, Lakeflow pipeline event logs, SQL Alerts for data quality, and job notifications and alerting configuration.


---



## System Tables for Observability


### Topic Overview

Databricks system tables give you direct access to metadata about billing, compute, access, and query execution. These tables are in the `system` schema and contain real time information about your workspace. You can query them with SQL just like regular tables, which makes it easy to build dashboards, alerts, and compliance reports. System tables are the foundation for observability in a modern data lakehouse.

The main system tables are `system.billing.usage` for cost tracking, `system.compute.*` tables for cluster and job metrics, `system.access` for audit logs, and `system.query_history` for SQL and DataFrame execution details. These tables update continuously as activity happens in your workspace. You can join them with your own tables to correlate costs with business outcomes, track resource consumption by team, or detect anomalies in data access patterns.


### Key Concepts


<details>
<summary><b>**System Tables and Schemas**</b></summary>

System tables live in the `system` catalog and are organized into schemas like `system.billing`, `system.compute`, `system.access`, and `system.query`. Each schema contains tables related to a specific aspect of workspace operations. You access them with three part naming: `system.schema.table`. System tables are read only. They're managed by Databricks and updated automatically.


</details>


<details>
<summary><b>**Billing and Cost Tracking**</b></summary>

The `system.billing.usage` table tracks compute cost, storage cost, and other charges. Each row represents usage for a workspace, cluster, or job during a time interval. You can query it to find which clusters or jobs are most expensive, track trends over time, or allocate costs to departments. The table includes fields for usage quantity, rate, and cost.


</details>


<details>
<summary><b>**Access Logs and Audit Trail**</b></summary>

The `system.access` table records every action that requires Unity Catalog permission checks. This includes table reads, writes, and metadata operations. Each row has timestamp, user identity, action type (SELECT, INSERT, etc.), and the object accessed. It's the authoritative source for compliance and auditing. Filter by action type and timestamp to find specific events.


</details>


<details>
<summary><b>**Query Execution History**</b></summary>

The `system.query_history` table stores details about every SQL query and DataFrame operation executed in the workspace. Fields include query text, execution duration, rows scanned, user identity, and compute resources used. This is useful for identifying slow queries, finding expensive operations, and understanding usage patterns.


</details>


---


### Code Examples


#### Cost Analysis Using Billing Tables


```sql
-- Find the most expensive clusters
SELECT 
  cluster_id,
  SUM(cost) as total_cost,
  COUNT(*) as usage_records
FROM system.billing.usage
WHERE usage_date >= DATE_SUB(CURRENT_DATE, 30)
  AND cluster_id IS NOT NULL
GROUP BY cluster_id
ORDER BY total_cost DESC;

-- Track daily compute costs by workspace
SELECT 
  usage_date,
  workspace_id,
  SUM(cost) as daily_cost
FROM system.billing.usage
WHERE usage_date >= DATE_SUB(CURRENT_DATE, 7)
  AND sku_name = 'COMPUTE'
GROUP BY usage_date, workspace_id
ORDER BY usage_date DESC, daily_cost DESC;
```


#### Access Audit and Compliance


```sql
-- Find all data access in the last 7 days
SELECT 
  timestamp,
  user_identity.user_name,
  action,
  request.full_name
FROM system.access
WHERE timestamp >= DATE_SUB(CURRENT_TIMESTAMP, 7)
  AND action IN ('SELECT', 'INSERT', 'UPDATE', 'DELETE')
ORDER BY timestamp DESC;

-- Track who accessed sensitive tables
SELECT 
  user_identity.user_name,
  COUNT(*) as access_count,
  MAX(timestamp) as last_access
FROM system.access
WHERE request.full_name LIKE '%.gold_customers' 
  AND action = 'SELECT'
GROUP BY user_identity.user_name
ORDER BY access_count DESC;
```


#### Query Performance Analysis


```sql
-- Find the slowest queries
SELECT 
  query_id,
  statement_type,
  total_user_time_ms / 1000.0 as duration_seconds,
  rows_produced,
  user_name
FROM system.query_history
WHERE start_time >= CURRENT_TIMESTAMP - INTERVAL 24 HOUR
ORDER BY total_user_time_ms DESC
LIMIT 10;

-- Track query execution by user
SELECT 
  user_name,
  COUNT(*) as query_count,
  AVG(total_user_time_ms) as avg_duration_ms,
  SUM(rows_produced) as total_rows_produced
FROM system.query_history
WHERE start_time >= DATE_SUB(CURRENT_TIMESTAMP, 7)
GROUP BY user_name
HAVING query_count > 10
ORDER BY query_count DESC;
```


---


### Common Exam Scenarios

Scenario: Your manager asks which table in the data lake is being accessed most frequently. How do you find this?

Query the `system.access` table filtered by action = 'SELECT' and the table name. Group by the object name and count the access events. You can filter by time range to see trends. This tells you which tables are most valuable and should be optimized or monitored closely.

Scenario: You're building a cost allocation model for your data engineering team. How do you use system tables to track costs by team or project?

Query `system.billing.usage` and join it with your own metadata tables that map cluster IDs or job names to teams or projects. Sum costs by team and time period. You can also tag clusters and jobs with metadata labels, then parse those in the billing table. This gives you a way to charge back costs to the right teams.

Scenario: An external auditor asks for a report of all data modifications in the past 90 days, showing who changed what and when.

Query `system.access` filtered for actions INSERT, UPDATE, DELETE with a timestamp >= 90 days ago. Include user identity, object name, action type, and timestamp. Export to CSV or generate a dashboard. This is a compliance standard requirement and system.access is the source of truth.


---


### Key Takeaways

* System tables provide real time data about workspace operations, costs, access, and query execution. Query them with SQL to build observability into your data platform.
* `system.billing.usage` tracks costs by cluster, job, and workspace. Use it for cost allocation, budgeting, and identifying expensive operations.
* `system.access` is the audit trail for data access. Query it for compliance, security monitoring, and tracking data lineage by user.
* `system.query_history` records query execution details. Use it to find slow queries, identify expensive operations, and understand usage patterns.

---


### Gotchas and Tips


> [!NOTE]
> System tables have retention periods. Old records are automatically purged to manage storage. For compliance, export important audit or billing data to your own tables regularly if you need longer term retention.


> [!NOTE]
> Querying system tables counts as a query and uses compute. If you run large or frequent queries on system tables, monitor the cost. Consider materializing important views or exporting summaries periodically rather than querying raw system tables every time.


> [!NOTE]
> System tables are read only and cannot be modified directly. You can create views or tables based on system table data, but the original system tables themselves are immutable.


---


### Links and Resources

* **[System Tables Overview](https://docs.databricks.com/aws/en/admin/system-tables/)** — Querying system tables for billing, audit, compute, and lineage observability.
* **[Audit Log System Tables](https://docs.databricks.com/aws/en/admin/system-tables/audit-logs)** — Monitoring workspace activity and user actions via audit logs.


## Query Profiler and Spark UI


### Topic Overview

The Spark UI and Query Profiler are your windows into how Databricks executes your code. The Spark UI shows the stage DAG (directed acyclic graph), task execution timelines, and data movement across the cluster. The SQL/DataFrame query profiler gives you a detailed execution plan showing where time and resources are spent. Together, they help you identify bottlenecks like shuffles, data skew, and inefficient operations.

Learning to read execution plans and Spark UI visualizations is critical for performance optimization. You'll spot patterns like unnecessary shuffles, missing indexes, joins on mismatched data types, or stages that process tiny partitions. The query profiler lets you understand if time is spent scanning data, executing operations, or moving data between nodes.


### Key Concepts


<details>
<summary><b>**Spark UI Stages, Tasks, and DAG**</b></summary>

A stage is a group of tasks that can run in parallel. The DAG (directed acyclic graph) shows how stages depend on each other. A task is the atomic unit of work executed by a single executor on a partition. The Spark UI displays the stage DAG visually, showing which stages run sequentially and which depend on shuffles. Wide transformations (like joins and group bys) create shuffle boundaries and multiple stages.


</details>


<details>
<summary><b>**Execution Plan and EXPLAIN**</b></summary>

The execution plan is a tree of operations that Databricks will execute to compute your result. EXPLAIN EXTENDED shows both the logical plan (what you asked for) and physical plan (how Databricks will do it). The physical plan includes details about joins (broadcast vs sort merge), filters (predicate pushdown), and data flow. Read from top to bottom to understand the order of operations.


</details>


<details>
<summary><b>**Shuffles, Spills, and Skew**</b></summary>

A shuffle is when data moves between executors, usually because of a join or group by. Shuffles are expensive. A spill occurs when intermediate data doesn't fit in memory and is written to disk. Data skew means some tasks process much more data than others, creating a bottleneck. The Spark UI highlights these in red. Looking at task execution timelines helps you spot skewed partitions.


</details>


<details>
<summary><b>**SQL Query Profiler**</b></summary>

The SQL query profiler (available in Databricks SQL editor) shows timing at each step of the execution plan. It breaks down where time is spent: scanning, filtering, joining, writing, etc. You can click on stages to see metrics like rows processed, bytes read, and execution time. This is more granular than the Spark UI.


</details>


---


### Code Examples


#### Reading Execution Plans with EXPLAIN


```sql
-- Simple EXPLAIN shows the physical plan
EXPLAIN SELECT 
  o.customer_id,
  COUNT(*) as order_count,
  SUM(o.amount) as total_spent
FROM orders o
JOIN customers c ON o.customer_id = c.id
WHERE c.region = 'US'
GROUP BY o.customer_id;

-- EXPLAIN EXTENDED shows both logical and physical plans
EXPLAIN EXTENDED SELECT * FROM gold_sales WHERE year = 2024;

-- Key terms to look for in execution plans:
-- BroadcastHashJoin = efficient for small tables
-- SortMergeJoin = used for large joins, requires shuffle
-- Scan = reading from storage
-- Filter = WHERE clause applied
-- Shuffle = data moving between nodes
-- Exchange = shuffle boundary
```


#### DataFrame API with Query Inspection


```python
from pyspark.sql.functions import col, sum as spark_sum

# Read data
orders_df = spark.read.table("orders")
customers_df = spark.read.table("customers")

# Complex query
result = (orders_df
  .join(customers_df, orders_df.customer_id == customers_df.id, "inner")
  .filter(col("region") == "US")
  .groupBy("customer_id")
  .agg(spark_sum("amount").alias("total_spent")))

# Inspect the execution plan
result.explain()

# Inspect the plan in detail
result.explain(mode="extended")

# Get the SQL representation
result.createOrReplaceTempView("temp_result")
spark.sql("EXPLAIN EXTENDED SELECT * FROM temp_result").show(truncate=False)
```


#### Identifying Performance Issues in Execution Plans


```sql
-- Query with potential performance issues
EXPLAIN EXTENDED
SELECT 
  o.order_id,
  c.name,
  p.price
FROM orders o
JOIN customers c ON o.customer_id = c.customer_id
JOIN products p ON o.product_id = p.product_id
WHERE o.year = 2024;

-- Things to look for in the plan:
-- 1. SortMergeJoin is expensive - check if broadcasting a small table would help
-- 2. Multiple shuffles in sequence - can you reduce the number of joins?
-- 3. Filter applied after join - push filters down before the join
-- 4. Exchange (shuffle) happening early - apply filters first to reduce data

-- Better approach: push filters early
EXPLAIN EXTENDED
SELECT 
  o.order_id,
  c.name,
  p.price
FROM orders o
WHERE o.year = 2024  -- Filter early!
JOIN customers c ON o.customer_id = c.customer_id
JOIN products p ON o.product_id = p.product_id;
```


---


### Common Exam Scenarios

Scenario: A data analyst runs a query that takes much longer than expected. The Spark UI shows that one stage has 100 tasks, but one task is taking 10 times longer than the others. What does this indicate?

This is data skew. One partition has much more data than the others, creating a bottleneck. To fix it, you might repartition the data on a different column, use salt keys to distribute skewed values, or rewrite the query to avoid the problematic join. The Spark UI's task timeline visualization is the key to spotting this.

Scenario: Your EXPLAIN output shows a SortMergeJoin between a large table and a small lookup table. How would you optimize this?

Use a broadcast join instead. Check the size of the lookup table. If it's small enough (typically under 2GB), Spark should automatically broadcast it, but you can force it with the broadcast() hint: `df1.join(broadcast(df2), ...). This eliminates the shuffle and makes the join much faster.

Scenario: Your execution plan shows multiple Exchange (shuffle) operations in sequence. What does this mean and how do you minimize it?

Multiple exchanges mean you have multiple wide transformations (joins, group bys) stacked together, causing data to shuffle multiple times. Each shuffle is expensive. Minimize this by combining operations when possible. For example, if you join table A with B, then with C, see if you can join B and C first and then join with A in one operation. Or use window functions instead of multiple group bys if applicable.


---


### Key Takeaways

* The Spark UI shows stages, tasks, and the DAG. The query profiler breaks down timing by operation. Use both to identify bottlenecks.
* EXPLAIN shows the execution plan. Look for SortMergeJoin, unnecessary shuffles, and opportunities to push filters early.
* Data skew (uneven partition sizes) shows up as tasks with very different execution times. Use repartitioning or salt keys to fix it.
* Use broadcast() to hint small table joins. Avoid multiple shuffles in sequence by combining operations.

---


### Gotchas and Tips


> [!NOTE]
> The Spark UI is only available while the job is running or for a short time after completion. Once the cluster shuts down or a long time passes, the UI is archived. Access it quickly during execution or enable event log persistence for later analysis.


> [!NOTE]
> EXPLAIN shows what Databricks plans to do, but actual execution might differ based on runtime statistics. Always verify with the Spark UI to see what actually happened.


> [!NOTE]
> Broadcast joins work well for small tables. If the table is too large, Databricks automatically falls back to SortMergeJoin. Check your table sizes before relying on broadcast.


---


### Links and Resources

* **[Query Profile](https://docs.databricks.com/aws/en/sql/user/queries/query-profile)** — Analyzing query execution plans and identifying performance bottlenecks.
* **[Spark UI Guide](https://docs.databricks.com/aws/en/optimizations/spark-ui-guide/)** — Understanding Spark UI stages, tasks, and execution metrics.


## REST APIs and CLI for Monitoring


### Topic Overview

The Databricks REST APIs and CLI give you programmatic control over your workspace. You can start jobs, check their status, manage clusters, query pipeline progress, and retrieve results without using the UI. This is essential for production workflows where you need to monitor job health, trigger data pipelines from external systems, or build custom observability dashboards.

The main APIs you'll use are the Jobs API to create and monitor jobs, the Clusters API to manage cluster lifecycle, and the Pipelines API to monitor Lakeflow Spark Declarative Pipelines. Each API has a REST endpoint and a CLI equivalent. Common patterns include polling for job completion, setting up webhooks for notifications, and extracting metadata for compliance audits.


### Key Concepts


<details>
<summary><b>**Jobs API Endpoints**</b></summary>

The Jobs API lets you create, update, list, and delete jobs, as well as monitor runs. Key endpoints include `POST /api/2.1/jobs/create` to create a job, `POST /api/2.1/jobs/runs/submit` to trigger a run, and `GET /api/2.1/jobs/runs/get` to retrieve run details. Each request requires authentication via a personal access token or service principal.


</details>


<details>
<summary><b>**Polling and Webhooks**</b></summary>

Polling means repeatedly calling the API to check job status. You poll the runs/get endpoint every few seconds until the job completes. Webhooks are more efficient: the API notifies you when a job succeeds or fails by sending an HTTP POST to your callback URL. Configure webhooks when creating or updating a job to get real time notifications.


</details>


<details>
<summary><b>**CLI Equivalent Operations**</b></summary>

The Databricks CLI mirrors the REST API. For every REST endpoint, there's a corresponding CLI command. For example, `databricks jobs create` is equivalent to `POST /api/2.1/jobs/create`. The CLI is convenient for scripting and running commands from the shell. You authenticate with a personal access token in your `.databrickscfg` file.


</details>


<details>
<summary><b>**Monitoring Job and Cluster Status**</b></summary>

Use the runs/list endpoint to get all runs for a job, filtering by state (RUNNING, SUCCEEDED, FAILED). Combine with query parameters to find runs within a time range. The response includes run ID, state, start/end time, and result details. For clusters, use the Clusters API to check state (RUNNING, PENDING, TERMINATED) and collect metrics.


</details>


---


### Code Examples


#### Using the Jobs API via REST


```bash
# Authenticate
token="dapi1234567890abcdef"
workspace_url="https://myworkspace.cloud.databricks.com"

# Submit a job run
curl -X POST \
  "${workspace_url}/api/2.1/jobs/runs/submit" \
  -H "Authorization: Bearer ${token}" \
  -H "Content-Type: application/json" \
  -d '{
    "job_id": 123,
    "notebook_params": {
      "date": "2024-01-01"
    }
  }'

# Get run status
run_id="456"
curl -X GET \
  "${workspace_url}/api/2.1/jobs/runs/get?run_id=${run_id}" \
  -H "Authorization: Bearer ${token}"

# List recent runs for a job
job_id="123"
curl -X GET \
  "${workspace_url}/api/2.1/jobs/runs/list?job_id=${job_id}&limit=10" \
  -H "Authorization: Bearer ${token}"
```


#### Using the Databricks CLI


```bash
# Set up authentication in ~/.databrickscfg
# [DEFAULT]
# host = https://myworkspace.cloud.databricks.com
# token = dapi1234567890abcdef

# Submit a job run
databricks jobs run-now --job-id 123 --notebook-params '{"date": "2024-01-01"}'

# Get run details
databricks runs get --run-id 456

# List runs for a job
databricks runs list --job-id 123 --limit 10

# Wait for a run to complete
databricks runs wait --run-id 456

# Create a cluster
databricks clusters create --spark-version 13.3.x-scala2.12 --node-type-id i3.xlarge --num-workers 2 --cluster-name my-cluster
```


#### Polling for Job Completion in Python


```python
import requests
import time

token = "dapi1234567890abcdef"
workspace_url = "https://myworkspace.cloud.databricks.com"
headers = {"Authorization": f"Bearer {token}"}

# Submit a job run
response = requests.post(
    f"{workspace_url}/api/2.1/jobs/runs/submit",
    headers=headers,
    json={"job_id": 123}
)
run_id = response.json()["run_id"]
print(f"Submitted run {run_id}")

# Poll for completion
while True:
    status_response = requests.get(
        f"{workspace_url}/api/2.1/jobs/runs/get?run_id={run_id}",
        headers=headers
    )
    run_status = status_response.json()["state"]
    
    if run_status == "TERMINATED":
        result_state = status_response.json()["state_message"]
        print(f"Run completed with state: {result_state}")
        break
    
    print(f"Run state: {run_status}")
    time.sleep(10)
```


---


### Common Exam Scenarios

Scenario: You need to trigger a data pipeline from an external system and wait for it to complete before proceeding. What's the most efficient approach?

Use the Jobs API to submit a run via POST /api/2.1/jobs/runs/submit. Capture the run ID from the response. Then poll GET /api/2.1/jobs/runs/get with the run ID every 10-30 seconds until the state is TERMINATED. Check the state_message to see if it SUCCEEDED or FAILED. Alternatively, configure a webhook on the job so Databricks notifies your system when the run completes.

Scenario: You want to list all failed job runs in the past 24 hours for a compliance audit. How would you do this?

Use the Runs API with filters. Call GET /api/2.1/jobs/runs/list with parameters for job_id and a time range. Then filter the results for runs with state FAILED. Iterate through paginated results if there are many runs. The response includes run details like user, start time, and error message.

Scenario: A production system needs to start a Databricks cluster, run a job, and terminate the cluster when done. What API calls are needed?

Use the Clusters API to start: POST /api/2.1/clusters/start with cluster_id. Wait for the cluster state to become RUNNING. Then use the Jobs API to run the job. Finally, use the Clusters API to terminate: POST /api/2.1/clusters/delete with cluster_id. You can automate all this with the CLI or Python API client.


---


### Key Takeaways

* REST APIs and the CLI provide programmatic access to Databricks. Use the Jobs API to submit and monitor runs, the Clusters API to manage cluster lifecycle.
* Polling means repeatedly checking run status. Webhooks are more efficient for getting real time notifications when jobs complete.
* Authenticate with a personal access token via the `Authorization: Bearer` header (REST) or in the `.databrickscfg` file (CLI).
* Combine API calls to build production workflows: submit runs, poll for completion, extract results, and trigger downstream actions.

---


### Gotchas and Tips


> [!NOTE]
> Polling too frequently (e.g., every second) wastes API rate limits and is inefficient. Wait 10-30 seconds between polls. Use exponential backoff if you hit rate limits.


> [!NOTE]
> Personal access tokens have limited lifetime. Store them securely (not in code). Use service principals for long lived automation.


> [!NOTE]
> The CLI requires the Databricks Python SDK to be installed and a valid config file. Test your setup before running production scripts.


---


### Links and Resources

* **[Lakeflow Jobs](https://docs.databricks.com/aws/en/jobs/)** — Using the Jobs REST API and CLI for programmatic job management and monitoring.
* **[Databricks CLI](https://docs.databricks.com/aws/en/dev-tools/cli/)** — Command-line interface for managing Databricks resources and monitoring.


## Lakeflow Pipeline Event Logs


### Topic Overview

Lakeflow Spark Declarative Pipelines produce event logs that track pipeline execution, data quality expectations, and lineage. These logs are stored in a Delta table and queryable with SQL. You can use them to understand pipeline health, debug failures, and validate that data quality rules passed. The event log is part of the pipeline's operational visibility, complementing the Databricks UI dashboard.

The event log includes records for when tables start updating, expectations (data quality checks) pass or fail, and when pipelines complete. Each record has a timestamp, dataset name, action type, and details. By querying the event log, you can build historical reports on pipeline performance and data quality trends.


### Key Concepts


<details>
<summary><b>**Event Log Table Structure**</b></summary>

The event log is a Delta table in the pipeline's metadata directory. Columns include timestamp, dataset (table name), action (START_UPDATE, END_UPDATE, EXPECTATION_PASSED, EXPECTATION_FAILED), details (JSON with specifics), and others. Each row represents an event in the pipeline lifecycle. The table is managed automatically by Databricks.


</details>


<details>
<summary><b>**Pipeline Expectations and Data Quality**</b></summary>

Expectations are data quality rules defined in your pipeline code. They run on each table update. Results (EXPECTATION_PASSED or EXPECTATION_FAILED) are logged with the failing rows or metrics. By querying the event log for EXPECTATION_FAILED records, you can track data quality issues and alert when thresholds are breached.


</details>


<details>
<summary><b>**Querying Event Logs for Monitoring**</b></summary>

Query the event log table with standard SQL filters. Find pipeline runs by date, check which tables updated, and see if expectations passed. Join with your own tables to correlate pipeline events with business metrics. The event log is a complete audit trail of pipeline behavior.


</details>


<details>
<summary><b>**Update History and Lineage**</b></summary>

The event log tracks which tables were updated in each pipeline run. By analyzing START_UPDATE and END_UPDATE events, you can build a lineage of data flow through your pipeline. This helps understand dependencies and detect if critical tables failed to update.


</details>


---


### Code Examples


#### Querying Pipeline Event Logs


```sql
-- Query the event log for a pipeline
-- Assuming event log is at: "/Pipelines/pipeline_id/event_log"

SELECT 
  timestamp,
  dataset,
  action,
  details
FROM pipeline_event_log
WHERE timestamp >= CURRENT_DATE - 7
ORDER BY timestamp DESC;

-- Find pipeline runs by looking for START_UPDATE events
SELECT 
  DATE(timestamp) as run_date,
  COUNT(DISTINCT DATE_TRUNC('hour', timestamp)) as updates
FROM pipeline_event_log
WHERE action = 'START_UPDATE'
GROUP BY DATE(timestamp)
ORDER BY run_date DESC;

-- Track data quality failures
SELECT 
  dataset,
  COUNT(*) as failure_count,
  MAX(timestamp) as last_failure
FROM pipeline_event_log
WHERE action = 'EXPECTATION_FAILED'
GROUP BY dataset
ORDER BY failure_count DESC;
```


#### Monitoring Table Update Success Rates


```sql
-- Track table update success rates
SELECT 
  dataset,
  COUNT(CASE WHEN action = 'END_UPDATE' THEN 1 END) as successful_updates,
  COUNT(CASE WHEN action = 'UPDATE_FAILED' THEN 1 END) as failed_updates,
  ROUND(100.0 * COUNT(CASE WHEN action = 'END_UPDATE' THEN 1 END) / 
    (COUNT(CASE WHEN action = 'START_UPDATE' THEN 1 END)), 2) as success_rate
FROM pipeline_event_log
WHERE timestamp >= DATE_SUB(CURRENT_DATE, 30)
GROUP BY dataset
ORDER BY success_rate ASC;

-- Identify slow table updates
SELECT 
  dataset,
  MIN(CASE WHEN action = 'START_UPDATE' THEN timestamp END) as start_time,
  MAX(CASE WHEN action = 'END_UPDATE' THEN timestamp END) as end_time,
  DATEDIFF(minute, 
    MIN(CASE WHEN action = 'START_UPDATE' THEN timestamp END),
    MAX(CASE WHEN action = 'END_UPDATE' THEN timestamp END)
  ) as duration_minutes
FROM pipeline_event_log
GROUP BY dataset
HAVING duration_minutes > 60
ORDER BY duration_minutes DESC;
```


#### Extracting Expectation Details from Event Logs


```sql
-- Extract details from expectation failures
SELECT 
  timestamp,
  dataset,
  details:expectation_name as expectation_name,
  details:expectation_type as expectation_type,
  details:failed_rows as failed_rows
FROM pipeline_event_log
WHERE action = 'EXPECTATION_FAILED'
  AND timestamp >= CURRENT_DATE - 1
ORDER BY timestamp DESC;

-- Summary of expectations by table
SELECT 
  dataset,
  details:expectation_name as expectation_name,
  COUNT(*) as failure_count,
  SUM(CAST(details:failed_rows as int)) as total_failed_rows
FROM pipeline_event_log
WHERE action = 'EXPECTATION_FAILED'
  AND timestamp >= DATE_SUB(CURRENT_DATE, 7)
GROUP BY dataset, expectation_name
ORDER BY failure_count DESC;
```


---


### Common Exam Scenarios

Scenario: A Lakeflow pipeline failed silently (no error in the UI), but downstream tables weren't updated. How would you investigate?

Query the pipeline's event log for START_UPDATE events on the downstream tables. If you see START_UPDATE but no END_UPDATE for a table, the update failed or hung. Look for UPDATE_FAILED or EXPECTATION_FAILED events for that table. The event log details will show the error message.

Scenario: You want to alert when a critical data quality expectation fails 3 times in 24 hours. How would you set this up?

Query the event log for EXPECTATION_FAILED on that specific table and expectation. Count failures in the last 24 hours. Use a SQL alert that triggers when the count exceeds 2. Configure the alert to send notifications to your team (email, Slack, etc.).

Scenario: You're debugging why table updates are taking longer than usual. What event log information would you examine?

Look at the time difference between START_UPDATE and END_UPDATE for each table over the past week. Compare to historical averages. If a specific table's duration increased, check for EXPECTATION_FAILED or other anomalies in the details column. The event log tells you exactly when updates started and stopped, revealing performance regressions.


---


### Key Takeaways

* Lakeflow pipeline event logs are Delta tables containing pipeline execution events. Query them with SQL to monitor pipeline health and data quality.
* Events include START_UPDATE, END_UPDATE, EXPECTATION_PASSED, EXPECTATION_FAILED, and others. Each event has a timestamp and detailed metadata.
* Track data quality by querying EXPECTATION_FAILED events. Extract failure details from the event JSON to understand which rules failed and why.
* Use event log timestamps to build lineage and detect if critical tables failed to update. Alert on patterns like repeated failures.

---


### Gotchas and Tips


> [!NOTE]
> Event log retention is finite. Databricks may archive old event logs. For long term compliance auditing, copy important events to a separate table that you manage.


> [!NOTE]
> The details column is JSON. When extracting values, use the correct syntax for your SQL engine (e.g., `details:field_name` in Databricks SQL). Test your queries to ensure you're parsing JSON correctly.


> [!NOTE]
> Event log timestamps are important. Use them for debugging, but remember there may be slight delays between event generation and log write. Don't rely on sub second precision.


---


### Links and Resources

* **[Lakeflow Spark Declarative Pipelines](https://docs.databricks.com/aws/en/ldp/)** — Monitoring pipeline health and reviewing event logs for debugging.
* **[Lakeflow SDP Concepts](https://docs.databricks.com/aws/en/ldp/concepts)** — Understanding pipeline event log schema and metrics.


## SQL Alerts for Data Quality


### Topic Overview

SQL alerts let you define data quality thresholds and trigger notifications when metrics exceed them. You write a SQL query that returns a result set, then configure the alert to fire based on the query results. For example, if your query returns any rows, or if a count exceeds a threshold, the alert triggers. Notifications can go to email, Slack, PagerDuty, or webhooks. Alerts run on a schedule (hourly, daily, etc.).

SQL alerts are perfect for data quality monitoring. You can alert on null counts, distinct values dropping, late arriving data, or business logic violations. They integrate with your data platform's native SQL engine, so no additional infrastructure is needed. Combine with system tables or your own monitoring tables to build a comprehensive observability system.


### Key Concepts


<details>
<summary><b>**Alert Query and Trigger Condition**</b></summary>

The alert query returns a result set. The trigger condition determines when the alert fires. Common conditions: "Any row returned" (fires if rows exist), "Value > threshold" (fires if a numeric result exceeds a limit), "Value == threshold" (exact match). The query can reference any table in your workspace. Keep queries simple and fast since they run on a schedule.


</details>


<details>
<summary><b>**Notification Channels and Escalation**</b></summary>

Configure where alerts should be sent: email addresses, Slack channels, PagerDuty incidents, or webhooks. You can have multiple channels for a single alert. Some alerts might escalate to different channels based on severity. For critical data quality issues, send to PagerDuty. For informational alerts, email is fine.


</details>


<details>
<summary><b>**Alert Schedules and Frequency**</b></summary>

Define how often the alert query runs: every 5 minutes, hourly, daily, etc. More frequent checks catch issues faster but cost more. Less frequent checks are cheaper but might miss short lived issues. Choose frequency based on how critical the metric is and how quickly you need to respond.


</details>


<details>
<summary><b>**Common Alert Patterns**</b></summary>

Count nulls in key columns and alert if above threshold. Count distinct values and alert if they drop. Compare today's row count to yesterday and alert if significantly lower. Check for late arriving data by looking for timestamps older than expected. Validate business logic (e.g., status transitions, referential integrity).


</details>


---


### Code Examples


#### Setting Up SQL Alerts for Data Quality


```sql
-- Alert: Check for high null count in key columns
-- Query: Select null counts and return rows if any exceed threshold
SELECT 
  'customer_id' as column_name,
  COUNT(*) as null_count,
  ROUND(100.0 * COUNT(*) / (SELECT COUNT(*) FROM customers), 2) as null_percentage
FROM customers
WHERE customer_id IS NULL
HAVING null_count > 100
UNION ALL
SELECT 
  'email',
  COUNT(*),
  ROUND(100.0 * COUNT(*) / (SELECT COUNT(*) FROM customers), 2)
FROM customers
WHERE email IS NULL
HAVING COUNT(*) > 100;

-- Alert: Compare row counts between today and yesterday
SELECT 
  today_count,
  yesterday_count,
  ROUND(100.0 * (yesterday_count - today_count) / yesterday_count, 2) as pct_drop
FROM (
  SELECT 
    (SELECT COUNT(*) FROM gold_sales WHERE DATE(created_at) = CURRENT_DATE) as today_count,
    (SELECT COUNT(*) FROM gold_sales WHERE DATE(created_at) = CURRENT_DATE - 1) as yesterday_count
)
WHERE today_count < yesterday_count * 0.5;  -- Alert if today is less than half of yesterday
```


#### Late Data Detection Alert


```sql
-- Alert: Detect late arriving data
-- Expected: data arrives within 1 hour, processed within 24 hours
SELECT 
  source_system,
  COUNT(*) as late_record_count,
  MIN(ingestion_time) as oldest_unprocessed,
  DATEDIFF(hour, MIN(ingestion_time), CURRENT_TIMESTAMP) as hours_delayed
FROM raw_events
WHERE processed_at IS NULL
  AND ingestion_time < CURRENT_TIMESTAMP - INTERVAL 24 HOUR
GROUP BY source_system
HAVING COUNT(*) > 0;  -- Alert fires if any late records exist
```


#### Business Logic Validation Alert


```sql
-- Alert: Validate referential integrity
-- Check for orders with customer_ids that don't exist in customers table
SELECT 
  COUNT(DISTINCT o.order_id) as orphaned_order_count,
  COUNT(DISTINCT o.customer_id) as affected_customers
FROM orders o
LEFT JOIN customers c ON o.customer_id = c.customer_id
WHERE c.customer_id IS NULL
HAVING COUNT(DISTINCT o.order_id) > 0;
```


---


### Common Exam Scenarios

Scenario: You want to alert your team if the daily sales volume drops more than 20% from the previous day. How would you write the alert query?

Query the gold_sales table, calculate today's and yesterday's totals, compute the percentage change, and return rows if the drop exceeds 20%. Set the trigger to "Any row returned". Send the alert to your Slack channel daily at 9am, so the team can investigate anomalies early.

Scenario: Your pipeline relies on data from a source system that sends updates hourly. You want an alert if no new data arrives within 2 hours. How do you set this up?

Write a query that checks the max timestamp in the ingest log. If it's more than 2 hours old, return a row. Set the alert to run every 15 minutes. Send critical alerts to PagerDuty so on call can respond immediately. This catches delays before downstream teams are impacted.

Scenario: You have a data quality alert that fires occasionally due to timing issues, causing alert fatigue. How would you reduce false positives?

Add a persistence check: alert only if the condition is true in 2 consecutive runs, not just once. Adjust the query to use a wider time window or more realistic thresholds. Consider the alert's frequency: if you're checking every 5 minutes, use a 15 minute window to allow for normal variance.


---


### Key Takeaways

* SQL alerts fire based on query results. If the query returns rows, or a metric exceeds a threshold, the alert triggers.
* Use alerts for data quality (nulls, duplicates, late data), business logic validation, and anomaly detection.
* Configure notification channels (email, Slack, PagerDuty, webhooks) and set alert frequency based on criticality.
* Tune alert thresholds and use persistence checks to reduce false positives and alert fatigue.

---


### Gotchas and Tips


> [!NOTE]
> Keep alert queries efficient. Complex queries that scan huge tables every 5 minutes are expensive. Use partitioning and indexes to speed them up.


> [!NOTE]
> Alert fatigue is real. If every minor variance triggers an alert, your team will ignore them. Set realistic thresholds and use domain knowledge to avoid false positives.


> [!NOTE]
> Document what each alert measures and why. Include remediation steps in the alert message so responders know what to do.


---


### Links and Resources

* **[SQL Alerts](https://docs.databricks.com/aws/en/sql/user/alerts/)** — Setting up threshold-based alerts on SQL query results for data quality monitoring.


## Job Notifications and Alerting


### Topic Overview

Databricks jobs have built in alerting capabilities. You can configure email notifications when a job succeeds, fails, or times out. Webhooks allow you to send job completion signals to external systems like Slack, PagerDuty, or your own monitoring platform. Job notifications are triggered automatically based on job state changes, so your team stays informed without manual polling.

For real time streaming jobs, Databricks provides health rules that monitor query progress and trigger alerts if a streaming table stalls or fails. System tables also record job execution metrics that you can query to build custom alerting on top. Together, these tools let you build comprehensive job health monitoring for your production data pipelines.


### Key Concepts


<details>
<summary><b>**Email Notifications on Job State Changes**</b></summary>

Configure notifications at job creation or update time. Specify email addresses and which events trigger notifications: on_success, on_failure, on_timeout. The email includes the job name, run ID, status, and a link to the run details. Multiple email addresses can be configured for a single job.


</details>


<details>
<summary><b>**Webhook Integrations**</b></summary>

Webhooks send HTTP POST requests to external systems when job events occur. Configure a webhook URL and which events to notify on. Databricks sends a JSON payload with job details. Use webhooks to trigger notifications in Slack, create PagerDuty incidents, or integrate with custom monitoring systems. Webhooks are more flexible than email for automation.


</details>


<details>
<summary><b>**Health Rules for Streaming Jobs**</b></summary>

Streaming tables have health rules that automatically detect stalled or failed queries. These rules monitor query lag, error rates, and data freshness. When a rule is violated, the job is marked as unhealthy and notifications can be sent. Health rules prevent silent failures in streaming pipelines.


</details>


<details>
<summary><b>**Job Run Metrics from System Tables**</b></summary>

Query system.jobs and system.job_runs tables to get historical job execution data. Metrics include start time, end time, status, error message, and compute resources used. Use these tables to build custom alerting on job SLAs, failure patterns, or performance degradation.


</details>


---


### Code Examples


#### Configuring Job Notifications (SQL/API)


```python
# Using Databricks Python SDK to create a job with notifications
from databricks.sdk import WorkspaceClient

client = WorkspaceClient()

job = client.jobs.create(
    name="daily_sales_pipeline",
    tasks=[
        {
            "task_key": "process_sales",
            "notebook_task": {
                "notebook_path": "/Workspace/Users/me/process_sales"
            },
            "cluster_id": "cluster-123"
        }
    ],
    email_notifications={
        "on_success": ["team@company.com"],
        "on_failure": ["oncall@company.com"]
    },
    webhook_notifications={
        "on_failure": [{
            "id": "slack-webhook"
        }],
        "on_success": [{
            "id": "pagerduty-webhook"
        }]
    }
)
```


#### Querying Job Run Metrics


```sql
-- Query job run metrics from system tables
SELECT 
  job_id,
  run_id,
  state,
  start_time,
  end_time,
  DATEDIFF(minute, start_time, end_time) as duration_minutes,
  state_message
FROM system.job_runs
WHERE start_time >= CURRENT_TIMESTAMP - INTERVAL 7 DAY
  AND state IN ('FAILED', 'TIMEOUT')
ORDER BY start_time DESC;

-- Alert on jobs with high failure rate
SELECT 
  job_id,
  COUNT(CASE WHEN state = 'FAILED' THEN 1 END) as failures,
  COUNT(*) as total_runs,
  ROUND(100.0 * COUNT(CASE WHEN state = 'FAILED' THEN 1 END) / COUNT(*), 2) as failure_rate
FROM system.job_runs
WHERE start_time >= DATE_SUB(CURRENT_TIMESTAMP, 1)
GROUP BY job_id
HAVING failure_rate > 10
ORDER BY failure_rate DESC;
```


#### Webhook Payload Example


```json
{
  "job_id": 123,
  "run_id": 456,
  "job_name": "daily_sales_pipeline",
  "state": "FAILED",
  "error_message": "Task failed: Invalid data format in source file",
  "start_time": "2024-01-15T09:00:00Z",
  "end_time": "2024-01-15T09:15:30Z",
  "duration_seconds": 930,
  "owner": "data-team@company.com",
  "run_url": "https://workspace.cloud.databricks.com/?o=org-id#job/123/run/456"
}
```


---


### Common Exam Scenarios

Scenario: Your team wants immediate notification when a critical job fails. Email is too slow. What's the best approach?

Configure a webhook on the job that posts to a Slack channel when on_failure occurs. Add a second webhook to PagerDuty to create an incident for on call. This way, the team sees the failure immediately in Slack and on call gets an incident to investigate.

Scenario: You need to track SLAs for job completion. Jobs should finish within 1 hour. How would you detect and alert on violations?

Query system.job_runs to find runs where `DATEDIFF(minute, start_time, end_time) > 60`. Create a SQL alert that returns rows if any violations occur. Set the alert to run daily and send notifications to your team. Track SLA compliance over time by storing violations in a metrics table.

Scenario: A streaming pipeline is supposed to update real time, but data freshness has degraded. You want to alert if data is older than 15 minutes. What health rule would you configure?

Configure a health rule on the streaming table's update latency. If the table hasn't been updated in 15 minutes, the rule fails and marks the streaming table as unhealthy. Pair this with job notifications so your team is alerted immediately when freshness degrades.


---


### Key Takeaways

* Job notifications include email and webhooks. Configure them on job creation or update to alert on success, failure, or timeout events.
* Webhooks are more flexible and enable integrations with Slack, PagerDuty, and custom systems. Use them for critical jobs that need immediate response.
* Health rules for streaming jobs automatically detect stalled or failed queries and enable proactive monitoring.
* Query system.job_runs to build custom alerting on job SLAs, failure patterns, and performance metrics.

---


### Gotchas and Tips


> [!NOTE]
> Webhooks need to be public and reachable from Databricks. Test the webhook URL before configuring it on the job. If the webhook fails, Databricks may retry, which could trigger duplicate notifications.


> [!NOTE]
> Email notifications can get lost or filtered. For critical jobs, always use webhooks for immediate visibility. Email is fine for informational notifications.


> [!NOTE]
> Webhook payloads have a maximum size. If your payload is huge, consider sending only essential fields or storing full details in system tables for later query.


---


### Links and Resources

* **[Job Notifications](https://docs.databricks.com/aws/en/jobs/notifications)** — Configuring email, webhook, and PagerDuty notifications for job events.
* **[Lakeflow Jobs](https://docs.databricks.com/aws/en/jobs/)** — Overview of job orchestration and alerting capabilities.
