# Section 9: Debugging and Deploying

> Track: Databricks Certified Data Engineer Professional | Certification Preparation Guide

---


> [!NOTE]
> **Exam Weight: 10%** — Covers diagnostic tools (Spark UI, cluster logs, system tables, query profiles), job repairs and parameter overrides, debugging Lakeflow pipelines, Databricks Asset Bundles deployment, and Git based CI/CD workflows with Databricks Git Folders.


---



## Diagnostic Tools (Spark UI, Cluster Logs, System Tables)


### Topic Overview

When a data pipeline fails or performs poorly, you need tools to understand what went wrong. Databricks provides a multi layered diagnostic toolkit: the Spark UI for real time stage and task execution details, cluster logs for driver and executor level errors, system tables for queryable event history, and the Query Profiler for bottleneck identification. Each tool reveals different aspects of pipeline behavior.

The Professional exam expects you to quickly navigate these tools, interpret execution plans, identify performance bottlenecks, and extract actionable insights. You should know when to check the Spark UI for task failures versus when to query system tables for historical analysis, and how to read a query execution plan.


### Key Concepts


<details>
<summary><b>**Spark UI: Stages, Tasks, Storage, SQL Execution**</b></summary>

The Spark UI runs on localhost:4040 (or the Databricks notebook UI) and shows real time job execution. The Stages tab breaks down a job into stages and shows task counts, durations, and shuffle data. The Tasks tab lists individual task execution times, skew, and failures. The Storage tab shows RDD and DataFrame caching. The SQL tab shows parsed and optimized execution plans. This is your primary tool for debugging slow queries or task failures.


</details>


<details>
<summary><b>**Driver and Executor Logs**</b></summary>

The driver process runs the main Spark application; executors do the actual data processing. Logs from both are available in Databricks clusters. Driver logs show initialization errors, task scheduling decisions, and application level events. Executor logs show memory errors, serialization failures, and compute errors. Use the Logs tab in the cluster UI or query system tables like system.compute.logs to retrieve logs for analysis.


</details>


<details>
<summary><b>**System Tables for Historical Analysis (system.compute.clusters, system.access.audit_logs)**</b></summary>

System tables store cluster configuration, event logs, and audit trails. Query system.compute.clusters to understand cluster state changes, autoscaling events, and termination reasons. Query system.access.audit_logs to track who accessed what resources. These tables allow historical analysis and trend detection without relying on the UI.


</details>


<details>
<summary><b>**Query Profiler for Bottleneck Analysis**</b></summary>

The Query Profiler breaks down SQL query execution into operator costs: shuffle, scan, filter, aggregate, etc. Each operator shows the percentage of total time consumed. Identify which operators are slowest and whether the slowness is due to I/O (data reading), CPU (processing), or network (shuffle). Use this to guide optimization: if scans dominate, try data skipping or indexing; if shuffles dominate, rethink joins.


</details>


### Code Examples


#### Accessing Cluster Logs Programmatically


```python
from databricks.sdk import WorkspaceClient

client = WorkspaceClient()

# Get cluster details and status
cluster = client.clusters.get('cluster-id-here')
print(f"Cluster state: {cluster.state}")
print(f"Autoscale: {cluster.autoscale}")
print(f"Executor memory: {cluster.spark_conf}")

# Query logs from system tables (if available)
result = spark.sql("""
  SELECT timestamp, source, level, message
  FROM system.compute.logs
  WHERE cluster_id = 'cluster-id-here'
    AND timestamp > NOW() - INTERVAL 1 HOUR
  ORDER BY timestamp DESC
  LIMIT 100
""").collect()

for row in result:
    print(f"[{row.level}] {row.message}")
```


#### Reading Event Logs and Execution Plans


```sql
-- Query system tables for cluster lifecycle events
SELECT timestamp, cluster_id, action, result, details
FROM system.compute.clusters_history
WHERE cluster_id = 'my-cluster'
ORDER BY timestamp DESC
LIMIT 50;

-- Get job run history
SELECT run_id, job_id, state, start_time, end_time, 
       (unix_timestamp(end_time) - unix_timestamp(start_time)) / 60 as duration_minutes
FROM system.compute.job_runs
WHERE job_id = 123
ORDER BY start_time DESC
LIMIT 20;

-- Audit log for access patterns
SELECT timestamp, user_identity, action, resource_name, result
FROM system.access.audit_logs
WHERE action = 'SELECT'
  AND timestamp > NOW() - INTERVAL 24 HOUR
ORDER BY timestamp DESC;
```


#### Analyzing Query Performance with EXPLAIN


```sql
-- Get the execution plan (physical and logical)
EXPLAIN FORMATTED
SELECT c.customer_id, SUM(o.order_amount) as total
FROM customers c
JOIN orders o ON c.customer_id = o.customer_id
GROUP BY c.customer_id;

-- Extended plan shows estimated costs
EXPLAIN EXTENDED
SELECT *
FROM large_table
WHERE date = '2025-02-15';

-- Profile shows actual runtime statistics
EXPLAIN PROFILE
SELECT *
FROM fact_sales
WHERE region = 'WEST';
```


### Common Exam Scenarios

**A Lakeflow pipeline runs slowly intermittently but you cannot reproduce the issue in testing. You check the Spark UI but it has already cleared. How do you investigate?**

Query system.compute.job_runs to find the slow run's duration. Check system.access.audit_logs for concurrent queries that might have competed for resources. Review system.compute.clusters_history to see if autoscaling or node terminations occurred. These tables persist longer than the Spark UI and provide historical context. You can correlate job run times with cluster events to find patterns.

**A task in a Spark job fails with an Out of Memory error, but only on one executor. The job retries and sometimes succeeds. What diagnostic approach would you use?**

Check the Spark UI Tasks tab to see which executor reported the error. Look at the Data Distribution to see if data is skewed toward that executor. Check executor logs in system.compute.logs for memory spikes. The intermittent nature suggests data skew or unlucky task scheduling. Use the Query Profiler to see if the operation is shuffling heavily. Consider repartitioning or using liquid clustering to distribute data more evenly.


### Key Takeaways

* The Spark UI is for real time debugging; system tables are for historical analysis and trend detection.
* EXPLAIN FORMATTED and PROFILE show you where time is spent in a query.
* Executor logs reveal serialization, memory, and compute errors; driver logs show scheduling and initialization.
* Data skew and cluster autoscaling events are often the root cause of intermittent failures.

### Gotchas and Tips


> [!NOTE]
> The Spark UI is ephemeral. Once the cluster is terminated or a job finishes, the UI may be cleared. Always enable event log persistence or use system tables for long term analysis.


> [!NOTE]
> System tables have retention policies. Audit logs are typically retained for 90 days. Plan accordingly for compliance and troubleshooting needs.


---


### Links and Resources

* **[Spark UI Guide](https://docs.databricks.com/aws/en/optimizations/spark-ui-guide/)** — Interpreting Spark UI stages, tasks, and shuffle metrics for debugging.
* **[System Tables Overview](https://docs.databricks.com/aws/en/admin/system-tables/)** — Using system tables for cluster logs and compute diagnostics.
* **[Debugging with Spark UI](https://docs.databricks.com/aws/en/compute/troubleshooting/debugging-spark-ui)** — Troubleshooting common Spark performance issues.


## Job Repairs and Parameter Overrides


### Topic Overview

Data pipelines fail. Sometimes a step times out, a dependency is unavailable, or a data quality check fails. Rather than rerunning the entire job from scratch, Databricks allows you to repair a failed job run by retrying only the failed tasks. You can also override parameters at run time to test fixes without modifying the job definition. This capability is critical for production reliability and cost efficiency.

The Professional exam tests your ability to use the repair run API, understand idempotent design, and apply parameter overrides strategically. You need to know when repair is safe (idempotent tasks) and when it risks data inconsistency (non idempotent operations).


### Key Concepts


<details>
<summary><b>**Repair Run API: Retrying Failed Job Runs**</b></summary>

The repair_run API retries a failed job run, skipping tasks that already succeeded. Instead of rerunning all tasks, only the failed ones execute. This saves time and resources. Use the Databricks Jobs API or CLI to call repair_run with the run_id. The API allows you to specify which tasks to retry or repair the entire run.


</details>


<details>
<summary><b>**Parameter Overrides at Run Time**</b></summary>

When you trigger a job run, you can override parameters defined in the job configuration. For example, if the job takes a date parameter and defaults to today, you can run it for yesterday's date by passing a different value. This allows testing, backfilling, and ad hoc execution without changing the permanent job definition. Parameter overrides are specified as JSON in the notebook_params or spark_submit_params.


</details>


<details>
<summary><b>**Idempotent Task Design and Safety Implications**</b></summary>

A task is idempotent if running it multiple times produces the same result as running it once. For example, a task that deletes and recreates a table is idempotent. A task that appends to a table without deduplication is not idempotent and will create duplicates if repaired. Design tasks to be idempotent by using REPLACE or merge operations instead of raw APPEND. If a task is not idempotent, repair is risky and may create data inconsistencies.


</details>


<details>
<summary><b>**Task level vs. Run level Repairs**</b></summary>

You can repair a single task, a set of tasks, or the entire job run. Repairing a single task is safer because it limits scope, but requires understanding task dependencies. If task B depends on task A and task B failed, repairing only task B may not help if task A's output was incomplete. Repair the entire job run to ensure all dependencies are satisfied.


</details>


### Code Examples


#### Using the Repair Run API


```python
from databricks.sdk import WorkspaceClient

client = WorkspaceClient()

# Get details of a failed run
run = client.jobs.get_run(run_id=123456)
print(f"Run state: {run.state}")
print(f"Job ID: {run.job_id}")

# Repair the entire run (retry all failed tasks)
repaired_run = client.jobs.repair_run(run_id=123456)
print(f"Repaired run ID: {repaired_run.run_id}")

# Repair specific tasks only
repaired_run = client.jobs.repair_run(
    run_id=123456,
    rerun_tasks=['task_1', 'task_2']
)
print(f"Rerunning specific tasks in run: {repaired_run.run_id}")
```


#### Overriding Parameters at Job Submission


```python
from databricks.sdk import WorkspaceClient
import datetime

client = WorkspaceClient()

# Submit a job run with parameter overrides
run = client.jobs.submit_run(
    job_id=789,
    notebook_params={
        'processing_date': '2025-02-15',
        'environment': 'production',
        'target_table': 'my_catalog.my_schema.results'
    }
)
print(f"Submitted run with parameters: {run.run_id}")

# Trigger a job with Spark SQL overrides
run = client.jobs.submit_run(
    job_id=790,
    spark_submit_params=['--conf', 'spark.sql.shuffle.partitions=200']
)
print(f"Submitted run with Spark config: {run.run_id}")

# Check run status
status = client.jobs.get_run(run_id=run.run_id)
print(f"Current state: {status.state}")
```


#### Writing Idempotent Task Logic


```sql
-- IDEMPOTENT: Uses REPLACE to overwrite existing data
CREATE OR REPLACE TABLE my_catalog.my_schema.daily_summary AS
SELECT date, product_id, SUM(amount) as total
FROM my_catalog.my_schema.transactions
WHERE date = CURRENT_DATE
GROUP BY date, product_id;

-- IDEMPOTENT: Uses MERGE to handle inserts and updates
MERGE INTO my_catalog.my_schema.customer_status cs
USING (
  SELECT customer_id, status
  FROM my_catalog.my_schema.processed_events
  WHERE event_date = CURRENT_DATE
) pe
ON cs.customer_id = pe.customer_id
WHEN MATCHED THEN UPDATE SET cs.status = pe.status
WHEN NOT MATCHED THEN INSERT (customer_id, status) VALUES (pe.customer_id, pe.status);

-- NOT IDEMPOTENT: Raw append creates duplicates if run twice
INSERT INTO my_catalog.my_schema.event_log
SELECT * FROM my_catalog.my_schema.raw_events
WHERE processed = false;
-- RISK: If task restarts, same rows are inserted again
```


### Common Exam Scenarios

**A multi task Lakeflow job fails on the final validation step. Tasks 1 3 completed but task 4 (validation) timed out. You want to rerun only task 4. Is this safe?**

It depends on whether task 4 depends on outputs from earlier tasks. If task 4 is a validation (SELECT only, no writes), rerunning it is safe. If task 4 writes data and relies on task 3's output, you can rerun it alone. However, if there are dependencies between tasks 1 and 3 that you don't understand, repair the entire run to be safe. The safest approach is to repair the full run, which will skip already completed tasks and retry the failed one.

**A notebook job processes daily data. Someone accidentally triggered it with yesterday's date instead of today's. You don't want to change the job definition. How do you rerun for the correct date?**

Use submit_run with notebook_params override to trigger the job again with the correct date. Pass the date parameter when submitting: notebook_params={'processing_date': '2025-02-15'}. The job will run with the overridden parameter while the permanent job definition remains unchanged. This allows ad hoc execution for backfill or recovery without modifying the job.


### Key Takeaways

* Use repair_run to retry failed tasks without rerunning the entire job, saving time and resources.
* Parameter overrides allow ad hoc execution and testing without changing the job definition.
* Idempotent task design (REPLACE, MERGE) is essential for safe repairs.
* Repair the full run unless you fully understand task dependencies.

### Gotchas and Tips


> [!NOTE]
> Repairing a task that appends data without idempotency creates duplicates. Always use REPLACE or MERGE for tasks that will be repaired.


> [!NOTE]
> Parameter overrides are task specific, not job specific. If a job has multiple notebooks, only the notebook executed during the submit_run call receives the parameter overrides.


---


### Links and Resources

* **[Lakeflow Jobs](https://docs.databricks.com/aws/en/jobs/)** — Repairing failed job runs and overriding parameters for re-execution.


## Debugging Lakeflow Pipelines


### Topic Overview

Lakeflow Spark Declarative Pipelines abstract away much of the Spark complexity, but when they fail, debugging requires understanding the pipeline execution model. Lakeflow provides an event log and expectation framework that tracks every update, every data quality check, and every failure. You can view pipeline event logs in the UI, query system tables for detailed history, and use expectation violations to identify data quality issues.

The Professional exam tests your ability to diagnose Lakeflow pipeline failures, understand the difference between development and production modes, and use event logs and lineage to troubleshoot data quality issues.


### Key Concepts


<details>
<summary><b>**Pipeline Event Logs for Debugging**</b></summary>

Lakeflow tracks every update in an event log. The log includes start time, end time, number of rows read/written, schema changes, and failures. Access the event log via the pipeline UI or by querying system.event_log (varies by workspace version). The event log shows which tables were updated, what transformations occurred, and where failures happened.


</details>


<details>
<summary><b>**Expectation Violations and Data Quality**</b></summary>

Lakeflow allows you to define expectations (data quality checks) on tables. Expectations validate conditions like no null values, row counts within range, or specific column values. When expectations fail, the pipeline can either warn or block. The event log captures expectation violations, allowing you to diagnose data quality issues without querying tables manually.


</details>


<details>
<summary><b>**Development vs. Production Mode Behavior**</b></summary>

In development mode, pipelines are more lenient: expectation failures warn but don't block the pipeline. In production mode, failed expectations can stop the pipeline. Development mode is useful for testing and incremental fixes. Production mode ensures data quality enforcement. Understanding the difference helps you debug why a pipeline succeeds in dev but fails in prod.


</details>


<details>
<summary><b>**Lineage Debugging for Data Tracing**</b></summary>

Lakeflow automatically tracks data lineage: which source tables feed into which targets, which transforms apply, and which expectations run. Use lineage to trace the path of data through the pipeline and identify which stage introduced bad data. The lineage view shows task dependencies, making it easy to understand which tables to check when a downstream table has issues.


</details>


### Code Examples


#### Accessing Pipeline Event Logs


```sql
-- Query event history for a specific pipeline
SELECT timestamp, update_id, state, rows_read, rows_written, 
       error_message, expectation_violations
FROM dlt.event_log()
WHERE origin.pipeline_id = 'pipeline-12345'
ORDER BY timestamp DESC
LIMIT 50;

-- Find failed updates
SELECT timestamp, update_id, error_message
FROM dlt.event_log()
WHERE origin.pipeline_id = 'pipeline-12345'
  AND state = 'FAILED'
ORDER BY timestamp DESC;

-- Check expectation violations
SELECT timestamp, dataset, expectation, failed_records, error_message
FROM dlt.event_log()
WHERE origin.pipeline_id = 'pipeline-12345'
  AND dataset_error IS NOT NULL
ORDER BY timestamp DESC;
```


#### Defining and Debugging Expectations


```python
from pyspark.sql.functions import col
import dlt

# Define a target table with expectations
@dlt.table(name="customer_silver")
@dlt.expect("valid_customer_id", "customer_id > 0")
@dlt.expect("non_null_email", "email IS NOT NULL")
@dlt.expect("valid_status", "status IN ('active', 'inactive', 'pending')")
def customer_silver():
    return (
        dlt.read("customer_bronze")
        .filter(col("customer_id").isNotNull())
        .select("customer_id", "email", "status", "created_date")
    )

# Check expectation results in the event log
# Violations are captured automatically and available in the UI
```


#### Common Pipeline Failure Patterns


```sql
-- Check for schema mismatch issues
SELECT *
FROM dlt.event_log()
WHERE origin.pipeline_id = 'pipeline-id'
  AND message LIKE '%schema%'
  AND timestamp > NOW() - INTERVAL 24 HOUR;

-- Look for data validation failures
SELECT DISTINCT dataset, expectation
FROM dlt.event_log()
WHERE origin.pipeline_id = 'pipeline-id'
  AND dataset_error IS NOT NULL;

-- Identify slow stages (long update times)
SELECT update_id, timestamp,
       (unix_timestamp(end_time) - unix_timestamp(start_time)) / 60 as duration_minutes,
       rows_written
FROM dlt.event_log()
WHERE origin.pipeline_id = 'pipeline-id'
  AND state = 'COMPLETED'
ORDER BY duration_minutes DESC
LIMIT 10;
```


### Common Exam Scenarios

**A Lakeflow pipeline succeeds but downstream analysts report missing data. The event log shows rows_written = 0 for the gold table. Where would you look to diagnose?**

Check the lineage to see which silver tables feed into the gold table. Then check the event log for those silver tables: do they have rows_written > 0? If a silver table is empty, check its upstream bronze table. Look for filter conditions that might be too strict (WHERE clauses filtering out all rows). Check expectations: if an expectation failed, rows might have been rejected.

**A pipeline runs successfully in development mode but fails in production with expectation violations. You didn't change the code. What changed?**

In development mode, expectation failures are warnings and don't block the pipeline. In production mode, they stop it. The expectations are the same code; the difference is the environment setting. Check which expectation is failing in production by examining the event log. Either fix the upstream data quality, adjust the expectation threshold, or change the expectation mode to warn instead of block.


### Key Takeaways

* Event logs are your primary debugging tool for Lakeflow; check rows_written, state, and error_message first.
* Expectations validate data quality and capture violations in the event log.
* Development mode is lenient; production mode enforces strict data quality.
* Use lineage to trace which upstream tables are causing issues in downstream tables.

### Gotchas and Tips


> [!NOTE]
> A pipeline can appear successful (state = COMPLETED) but write zero rows due to overly strict filters. Always check rows_written in the event log, not just the pipeline state.


> [!NOTE]
> Expectation violations in development mode don't stop the pipeline but are still logged. Check the event log to find these failures before moving to production.


---


### Links and Resources

* **[Lakeflow Spark Declarative Pipelines](https://docs.databricks.com/aws/en/ldp/)** — Debugging pipeline failures, event logs, and data quality expectations.
* **[Lakeflow SDP Concepts](https://docs.databricks.com/aws/en/ldp/concepts)** — Understanding pipeline modes, full refresh vs incremental, and error handling.


## Databricks Asset Bundles Deployment


### Topic Overview

Databricks Asset Bundles (DABs) are the modern way to define, test, and deploy data engineering workflows as code. Instead of clicking through the UI to create jobs, notebooks, and pipelines, you define them in YAML, commit them to Git, and deploy across environments. This approach brings infrastructure as code practices to Databricks, enabling version control, code review, and continuous deployment.

The Professional exam tests your ability to structure DAB projects, understand the deployment lifecycle, and integrate DABs with CI/CD pipelines. You need to know the difference between development and production deployment modes, how to manage secrets, and how to promote code across workspaces.


### Key Concepts


<details>
<summary><b>**Bundle Lifecycle: Init, Validate, Deploy, Destroy**</b></summary>

bundle init scaffolds a new DAB project. bundle validate checks syntax and references. bundle deploy pushes resources to a Databricks workspace. bundle destroy removes deployed resources. This lifecycle mirrors infrastructure management tools like Terraform.


</details>


<details>
<summary><b>**Development vs. Production Deployment Modes**</b></summary>

Development mode deploys to a dev workspace with shorter job timeouts and lenient defaults, ideal for testing. Production mode deploys to a prod workspace with strict resource controls and enforcement. The same bundle.yml can target both environments by using profiles. Profiles allow environment specific variable overrides without changing the core bundle definition.


</details>


<details>
<summary><b>**Artifact Management and Dependencies**</b></summary>

DABs support artifact references: notebooks, JAR files, Python wheels, and more. You can reference artifacts by path, and the bundle system resolves dependencies. Libraries are packaged and deployed alongside jobs. This ensures reproducible deployments where code and dependencies are versioned together.


</details>


<details>
<summary><b>**Multi Workspace Promotion Strategy**</b></summary>

Deploy the same bundle to dev, staging, and prod workspaces using profiles and workspace parameters. Each workspace has its own resource IDs but runs the same logic. This enables code promotion: test in dev, promote through staging, and finally to prod. Use CI/CD pipelines to automate validation and promotion across workspaces.


</details>


### Code Examples


#### Basic DAB Structure and bundle.yml


```yaml
# bundle.yml - Root configuration
name: my-data-pipeline
bundle:
  environment: dev  # Can be overridden by profile

resources:
  jobs:
    daily_etl:
      name: Daily ETL Job
      job_cluster_config:
        spark_version: "13.3.x-scala2.12"
        node_type_id: "i3.xlarge"
        num_workers: 2
      tasks:
        - task_key: ingest
          notebook_task:
            notebook_path: ./notebooks/ingest
          libraries:
            - pypi:
                package: pydantic==1.0.0
        - task_key: transform
          depends_on:
            - task_key: ingest
          sql_task:
            file: ./sql/transform.sql

  pipelines:
    silver_pipeline:
      name: Silver Data Pipeline
      storage: /Volumes/my_catalog/pipelines/silver
      clusters:
        - label: default
          num_workers: 2

profiles:
  development:
    bundle:
      environment: dev
    resources:
      jobs:
        daily_etl:
          max_concurrent_runs: 1
  production:
    bundle:
      environment: prod
    resources:
      jobs:
        daily_etl:
          max_concurrent_runs: 5
          timeout_seconds: 7200
```


#### DAB CLI Commands and Deployment


```bash
# Initialize a new bundle
databricks bundle init

# Validate the bundle without deploying
databricks bundle validate

# Deploy to development workspace (default profile)
databricks bundle deploy

# Deploy to production using profile
databricks bundle deploy --profile production

# Show what will be deployed (dry run)
databricks bundle deploy --dry-run

# Destroy resources (removes from workspace)
databricks bundle destroy

# List deployed resources
databricks bundle summary
```


#### Parameterization and Variable Substitution


```yaml
variables:
  cluster_size:
    default: 2
  notebook_path:
    default: ./notebooks/process
  job_schedule:
    default: "0 2 * * *"  # 2 AM daily

resources:
  jobs:
    process_job:
      name: Processing Job
      schedule:
        quartz_cron_expression: ${var.job_schedule}
        timezone_id: UTC
      tasks:
        - task_key: main
          notebook_task:
            notebook_path: ${var.notebook_path}
          new_cluster:
            spark_version: 13.3.x-scala2.12
            node_type_id: i3.xlarge
            num_workers: ${var.cluster_size}

# Override variables in profile
profiles:
  production:
    variables:
      cluster_size: 8
      job_schedule: "0 1 * * *"  # 1 AM for prod
```


### Common Exam Scenarios

**You want to deploy the same pipeline code to dev and prod workspaces but with different cluster sizes. The dev cluster should have 1 worker, prod should have 4. How would you structure this in DAB?**

Use profiles with variable overrides. Define a variable cluster_size in the main bundle.yml. Create a development profile and a production profile, each overriding the variable with the appropriate value. Deploy with bundle deploy --profile development or bundle deploy --profile production.

**After deploying a job with DAB, someone makes a manual change in the UI (edits the job schedule). The next DAB deploy will overwrite this change. How do you prevent accidental overwrites?**

Always use bundle deploy --dry-run before applying changes to see what will change. Enforce code review: require PRs before deploying. Use CI/CD pipelines to deploy only from approved commits. Document the rule that DAB is the source of truth and manual UI changes should not be made.


### Key Takeaways

* DABs bring infrastructure as code to Databricks, enabling version control and code review.
* Use profiles to deploy the same bundle to multiple environments with different configurations.
* Validate before deploying with bundle validate to catch errors early.
* DAB is the source of truth; avoid making manual changes in the UI.

### Gotchas and Tips


> [!NOTE]
> bundle deploy will overwrite UI changes. If someone manually edits a job after deployment, the next deploy will revert to the bundle configuration.


> [!NOTE]
> Variables in DAB are only substituted during deployment. Changes to variable values in a profile require a redeploy to take effect.


---


### Links and Resources

* **[Databricks Asset Bundles](https://docs.databricks.com/aws/en/dev-tools/bundles)** — Deploying jobs, pipelines, and notebooks using DABs with environment-specific overrides.
* **[CI/CD with Databricks](https://docs.databricks.com/aws/en/dev-tools/ci-cd/)** — Integrating DAB deployments into CI/CD pipelines.


## Git Integration and CI/CD Workflows


### Topic Overview

Modern data engineering requires integration with Git and CI/CD systems. Databricks Git Folders (formerly Repos) connect your workspace to a Git repository, enabling branch management, pull request workflows, and collaborative development. Combined with DABs and GitHub Actions or Azure DevOps, you can automate testing and promotion across environments.

The Professional exam tests your understanding of Git workflows in Databricks, how to structure CI/CD pipelines for data engineering, and best practices for code promotion and testing.


### Key Concepts


<details>
<summary><b>**Databricks Git Folders and Branch Management**</b></summary>

Git Folders connect a Databricks workspace to a Git repository. You can clone a repo, check out branches, and create new branches without leaving the UI. This enables multiple developers to work on different features in parallel. Commits are made from the Databricks UI or CLI, and changes sync back to the remote repository.


</details>


<details>
<summary><b>**Pull Request Workflows**</b></summary>

Create a feature branch, make changes, commit, and push to the remote. Open a PR for code review. Automated CI checks run on the PR (unit tests, linting, DAB validation). Once approved, merge to main. The main branch becomes the source of truth for production deployments. This workflow enforces quality gates before code reaches prod.


</details>


<details>
<summary><b>**CI/CD Integration with GitHub Actions and Azure DevOps**</b></summary>

GitHub Actions and Azure DevOps can automatically run tests, validate DABs, and deploy to Databricks when code is pushed or PRs are merged. Use the Databricks CLI in workflow files to run validation and deployment commands. This enables fully automated testing and promotion from dev through prod environments.


</details>


<details>
<summary><b>**Testing in CI Pipelines**</b></summary>

CI pipelines should run unit tests (using pytest on Spark with assertDataFrameEqual), validate PySpark code for syntax errors, and test Lakeflow pipelines in development mode. Fail fast: if unit tests fail, don't proceed to integration testing. Use code coverage tools to track test coverage and ensure critical paths are tested.


</details>


### Code Examples


#### GitHub Actions Workflow for DAB Validation and Deployment


```yaml
# .github/workflows/deploy.yml
name: Deploy Data Pipeline

on:
  push:
    branches:
      - main
  pull_request:
    branches:
      - main

jobs:
  validate:
    runs on: ubuntu latest
    steps:
      - uses: actions/checkout@v3
      
      - name: Install Databricks CLI
        run: pip install databricks-cli
      
      - name: Validate DAB
        env:
          DATABRICKS_HOST: ${{ secrets.DATABRICKS_HOST }}
          DATABRICKS_TOKEN: ${{ secrets.DATABRICKS_TOKEN }}
        run: |
          cd databricks_bundle
          databricks bundle validate --profile dev
      
      - name: Run Unit Tests
        run: |
          pip install pytest pyspark
          pytest tests/ -v

  deploy_to_prod:
    needs: validate
    if: github.ref == 'refs/heads/main' && github.event_name == 'push'
    runs on: ubuntu latest
    steps:
      - uses: actions/checkout@v3
      
      - name: Install Databricks CLI
        run: pip install databricks-cli
      
      - name: Deploy to Production
        env:
          DATABRICKS_HOST: ${{ secrets.DATABRICKS_PROD_HOST }}
          DATABRICKS_TOKEN: ${{ secrets.DATABRICKS_PROD_TOKEN }}
        run: |
          cd databricks_bundle
          databricks bundle deploy --profile production
```


#### Testing PySpark Code with assertDataFrameEqual


```python
import pytest
from pyspark.sql import SparkSession
from pyspark.testing import assertDataFrameEqual
from my_pipeline import process_customers

class TestCustomerProcessing:
    @pytest.fixture(scope="function")
    def spark(self):
        return SparkSession.builder.appName("test").getOrCreate()
    
    def test_process_customers(self, spark):
        # Arrange: Create test data
        input_data = [
            (1, "John", "john@example.com"),
            (2, "Jane", "jane@example.com")
        ]
        input_df = spark.createDataFrame(input_data, ["id", "name", "email"])
        
        # Act: Call the function
        result_df = process_customers(input_df)
        
        # Assert: Check the output
        expected_data = [
            (1, "JOHN", "john@example.com"),
            (2, "JANE", "jane@example.com")
        ]
        expected_df = spark.createDataFrame(expected_data, ["id", "name", "email"])
        
        assertDataFrameEqual(result_df, expected_df)
    
    def test_handles_nulls(self, spark):
        input_data = [(1, None, "email@example.com")]
        input_df = spark.createDataFrame(input_data, ["id", "name", "email"])
        
        result_df = process_customers(input_df)
        
        # Should handle null values gracefully
        assert result_df.count() == 1
```


### Common Exam Scenarios

**A developer creates a feature branch, makes changes to a notebook, and opens a PR. Your CI pipeline should automatically validate and test the changes. What checks would you include?**

Include: (1) DAB validation with bundle validate, (2) unit tests with pytest and assertDataFrameEqual, (3) linting (pylint or flake8 for Python), (4) code coverage checks, (5) DAB dry run to show what would be deployed. If any check fails, block the PR merge.

**You need to ensure that only code from the main branch gets deployed to production. How would you set this up with GitHub Actions and DABs?**

Create a GitHub Actions workflow that deploys only when the event is a push to main. Use conditional gates: if: github.ref == 'refs/heads/main' && github.event_name == 'push'. This ensures deployments only happen after PRs are merged into main and all checks pass.


### Key Takeaways

* Git Folders enable collaborative development with branch management and code review.
* CI/CD pipelines automate testing and validation before code reaches production.
* Always include DAB validation, unit tests, and linting in CI workflows.
* Main branch should be production ready; enforce strict merge requirements.

### Gotchas and Tips


> [!NOTE]
> Git Folder syncing is one way by default from the remote to the workspace. Commits go back to the remote, but changes from other users require a manual pull in the UI.


> [!NOTE]
> Secrets in CI/CD workflows should be managed as repository secrets, not hardcoded in workflow files.


---


### Links and Resources

* **[Git Folders (Repos)](https://docs.databricks.com/aws/en/repos/)** — Syncing notebooks and code with Git repositories for version control.
* **[CI/CD with Databricks](https://docs.databricks.com/aws/en/dev-tools/ci-cd/)** — Building automated CI/CD workflows with GitHub Actions, Azure DevOps, and Jenkins.
