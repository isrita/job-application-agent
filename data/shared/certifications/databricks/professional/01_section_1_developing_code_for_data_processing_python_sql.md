# Section 1: Developing Code for Data Processing (Python & SQL)

> Track: Databricks Certified Data Engineer Professional | Certification Preparation Guide

---


> [!NOTE]
> **Exam Weight: 22%** — The heaviest section on the Professional exam. Covers Python project structure for DABs, third party library management, UDFs, Lakeflow Spark Declarative Pipelines for batch and streaming, ETL automation with Jobs, streaming tables vs materialized views, APPLY CHANGES APIs for CDC, and unit/integration testing.


---



## Python Project Structure for DABs


### Topic Overview

When you are building production data engineering projects on Databricks, how you structure your Python code matters a lot. **Databricks Asset Bundles (DABs)** give you a way to package your notebooks, libraries, pipelines, and job definitions into a single deployable unit. Think of DABs as your project's blueprint: they define what gets deployed, where it goes, and how it all connects together.

A well structured DAB project separates your source code, configuration files, tests, and deployment definitions into clear directories. This makes it easier to collaborate with your team, run CI/CD pipelines, and promote code across environments (dev, staging, production). The exam expects you to know what a typical DAB project looks like and how the pieces fit together.

DABs use a `databricks.yml` file at the project root as the main configuration file. This YAML file references your resources (jobs, pipelines, experiments) and defines how they should be deployed. You can also use variable substitution and target environments to manage differences between dev and prod setups without duplicating configuration.


---


### Key Concepts


<details>
<summary><b>**Standard DAB Project Layout**</b></summary>

A typical DAB project follows this structure: a root `databricks.yml` file for configuration, a `src/` directory for your Python modules and notebooks, a `resources/` directory for job and pipeline YAML definitions, a `tests/` directory for unit and integration tests, and optionally a `setup.py` or `pyproject.toml` for packaging your Python code as a wheel.


</details>


<details>
<summary><b>**The databricks.yml Configuration File**</b></summary>

This is the heart of your DAB project. It defines the bundle name, workspace targets (e.g., dev, staging, prod), and references to resource definition files. You can use variable substitution with `${var.environment}` syntax to parameterize deployments. The file also supports includes to pull in resource definitions from the `resources/` directory.


</details>


<details>
<summary><b>**Targets and Environment Management**</b></summary>

DABs support multiple deployment targets. Each target can override default values like the workspace URL, catalog, schema, and compute resources. This lets you use the same codebase for dev, test, and production without changing any source code. You deploy to a specific target using `databricks bundle deploy --target prod`.


</details>


<details>
<summary><b>**Python Wheel Builds in DABs**</b></summary>

For modular Python projects, you can package your code as a Python wheel and reference it in your DAB configuration. The bundle can automatically build the wheel during deployment using `artifacts` in `databricks.yml`. This is the recommended approach for sharing reusable code across multiple jobs and pipelines.


</details>


---


### Code Examples


#### Minimal databricks.yml


```yaml
bundle:
  name: my_data_pipeline

include:
  - resources/*.yml

targets:
  dev:
    mode: development
    default: true
    workspace:
      host: https://dbc-abc123.cloud.databricks.com

  prod:
    mode: production
    workspace:
      host: https://dbc-xyz789.cloud.databricks.com
    run_as:
      service_principal_name: sp-data-pipeline
```


#### Resource Definition (resources/pipeline_job.yml)


```yaml
resources:
  jobs:
    daily_etl:
      name: "Daily ETL Pipeline"
      schedule:
        quartz_cron_expression: "0 0 6 * * ?"
        timezone_id: "UTC"
      tasks:
        - task_key: ingest_data
          notebook_task:
            notebook_path: src/ingest.py
          job_cluster_key: etl_cluster
        - task_key: transform_data
          depends_on:
            - task_key: ingest_data
          notebook_task:
            notebook_path: src/transform.py
          job_cluster_key: etl_cluster
      job_clusters:
        - job_cluster_key: etl_cluster
          new_cluster:
            spark_version: "15.4.x-scala2.12"
            num_workers: 4
```


#### Project Directory Structure


```plain text
my_data_pipeline/
├── databricks.yml           # Main bundle configuration
├── resources/
│   ├── pipeline_job.yml     # Job definitions
│   └── dlt_pipeline.yml     # Lakeflow pipeline definitions
├── src/
│   ├── __init__.py
│   ├── ingest.py            # Ingestion notebook/script
│   ├── transform.py         # Transformation logic
│   └── utils/
│       ├── __init__.py
│       └── helpers.py       # Shared utility functions
├── tests/
│   ├── test_transform.py    # Unit tests
│   └── test_integration.py  # Integration tests
├── setup.py                 # For wheel packaging
└── requirements.txt         # Python dependencies
```


---


### Common Exam Scenarios

**Scenario 1: Choosing Where to Place Pipeline Definitions**

A team is setting up a new DAB project and needs to decide where to define their Lakeflow pipeline configuration. The correct approach is to place pipeline resource definitions in the `resources/` directory as separate YAML files and reference them from `databricks.yml` using the `include` directive. This keeps the main config clean and allows different team members to work on different resources without merge conflicts.

**Scenario 2: Deploying to Multiple Environments**

A data engineer needs to deploy the same pipeline to dev and prod with different compute configurations. The solution is to define multiple targets in `databricks.yml`, each with its own workspace URL, catalog, and cluster settings. Variable substitution using `${var.catalog_name}` lets you parameterize these differences. Deploy with `databricks bundle deploy --target prod`.

**Scenario 3: Packaging Shared Python Code**

Your team has utility functions used across multiple jobs. Rather than duplicating code in each notebook, the recommended approach is to package the shared code as a Python wheel using `setup.py` and configure the `artifacts` section in `databricks.yml` to build and upload the wheel automatically during deployment.


---


### Key Takeaways

* `databricks.yml` is the central configuration file for every DAB project. It defines the bundle name, targets, and references resource definitions.
* Keep resource definitions (jobs, pipelines) in a separate `resources/` directory and include them via the `include` directive.
* Use targets to manage multi environment deployments (dev, staging, prod) without duplicating code or config.
* Package shared Python code as wheels using `setup.py` or `pyproject.toml` and configure the `artifacts` section for automated builds.
* The CLI commands to know: `databricks bundle init`, `databricks bundle validate`, `databricks bundle deploy`, and `databricks bundle run`.

---


### Gotchas and Tips


> [!NOTE]
> Production targets should always use `mode: production` and set `run_as` to a service principal. Running production jobs as your personal user account is a common mistake that leads to failures when your credentials expire or your account is modified.


> [!NOTE]
> Do not put all your resource definitions directly in `databricks.yml`. This file can get unwieldy fast. Use the `include` pattern to split resources into smaller, focused files.


> [!NOTE]
> Always run `databricks bundle validate` before deploying. This catches configuration errors (wrong paths, invalid YAML, missing variables) before they reach your workspace.


---


### Links and Resources

* **[Databricks Asset Bundles](https://docs.databricks.com/aws/en/dev-tools/bundles)** — Overview of DABs for managing project deployments and CI/CD workflows.
* **[CI/CD with Databricks](https://docs.databricks.com/aws/en/dev-tools/ci-cd/)** — Best practices for continuous integration and deployment pipelines.


## Managing Third Party Libraries


### Topic Overview

Managing third party libraries is a critical part of building real world data pipelines on Databricks. Your code often depends on external packages like pandas, numpy, requests, or domain specific libraries. The challenge is getting these libraries available on the compute where your code runs, and managing dependency conflicts across different jobs and notebooks.

Databricks gives you multiple ways to manage libraries depending on your use case. You can attach libraries directly to clusters, install them dynamically in notebooks, embed them in Databricks Asset Bundles (DABs) with requirements files, or store them in Unity Catalog volumes for central management. Each approach has tradeoffs in terms of reproducibility, ease of use, and scope (cluster wide vs notebook wide).

For the Professional exam, you need to understand when to use each method and how to properly specify dependencies in production code. The exam tests your knowledge of library attachment, notebook scoped libraries with %pip, requirements.txt in DABs, and how to avoid version conflicts.


---


### Key Concepts


<details>
<summary><b>Cluster Libraries vs Notebook Scoped Libraries</b></summary>

Cluster libraries are installed on the cluster itself and available to all users and notebooks on that cluster. This is the traditional approach and is useful when many jobs need the same dependency. Notebook scoped libraries using %pip are installed dynamically within a single notebook session and do not affect the cluster or other notebooks. Notebook scoped libraries are ideal for experiments, quick iterations, and when you want isolation between different notebooks.


</details>


<details>
<summary><b>Init Scripts for Custom Library Management</b></summary>

Init scripts are bash scripts that run when a cluster starts. You can use them to install packages, set environment variables, or run any startup logic. For library management, init scripts are useful when you need to install packages from a custom PyPI index, set up credentials for private repos, or install system level dependencies that packages depend on. However, init scripts add startup time and can be harder to debug than declarative approaches.


</details>


<details>
<summary><b>Requirements.txt in Databricks Asset Bundles</b></summary>

When deploying code via Databricks Asset Bundles, you define dependencies in a requirements.txt file (following Python standards) and reference it in your databricks.yml config. The DAB deployment process handles installing these libraries on the job cluster. This is the recommended approach for production pipelines because dependencies are version controlled, reproducible, and clearly documented alongside your code.


</details>


<details>
<summary><b>Unity Catalog Volumes for Library Storage</b></summary>

Unity Catalog volumes provide a centralized, governed way to store and distribute Python wheel files or JAR files across your workspace. Instead of uploading libraries to individual clusters, you store them in a UC volume and reference them from any cluster. This approach is useful in regulated environments where you need to track lineage of library assets and control who can access which libraries.


</details>


---


### Code Examples


#### Notebook Scoped Installation with %pip


```python
%pip install requests==2.28.1 --quiet

# Restart Python to use the new library
%restart_python

import requests
response = requests.get('https://api.example.com/data')
print(response.json())
```


#### Requirements.txt in a DAB


```yaml
# File: requirements.txt
pandas==1.5.3
numpy==1.24.1
scikit-learn==1.2.0
pyarrow>=10.0.0

# File: databricks.yml
resources:
  jobs:
    my_job:
      name: Data Processing Job
      tasks:
        - task_key: process
          python_wheel_task:
            package_name: my_package
            entry_point: run
          job_cluster_key: compute
      job_clusters:
        - job_cluster_key: compute
          new_cluster:
            spark_version: 13.3.x-scala2.12
            node_type_id: i3.xlarge
            num_workers: 2
            python_requirements:
              - /Workspace/requirements.txt
```


#### Init Script for Custom Package Index


```bash
#!/bin/bash
# Save as init_script.sh and attach to cluster

# Install from private PyPI index
pip install --index-url https://private-pypi.example.com/simple mycompany-utils==1.0.0

# Install system dependencies
apt-get update && apt-get install -y libxml2-dev

# Set environment variable
export MY_API_KEY="${DATABRICKS_SECRET_API_KEY}"
```


---


### Common Exam Scenarios

A developer is creating a DAB with a Lakeflow job that requires the requests library. The requirements must be deterministic and version pinned. The job runs on a job cluster that is created fresh each time. What is the correct approach? The answer involves specifying dependencies in a requirements.txt file in the DAB repository and referencing it in the databricks.yml config. This ensures reproducibility because the exact versions are checked in with the code. Using %pip in a notebook would work for exploration but is not suitable for production jobs in a DAB because notebook scoped libraries only persist within that notebook session and would be lost on cluster restart.

A data engineer needs to ensure that a specific version of pandas is available across all notebooks running on a shared all purpose cluster. Multiple teams use this cluster and they want to avoid version conflicts. The best approach is to attach the library to the cluster itself (via the Clusters UI or API) with a specific version constraint. This way, all notebooks and jobs using that cluster get the same library version. The alternative of using %pip in each notebook would be tedious and error prone because each notebook owner would need to install it independently.

An organization has private Python packages hosted on an internal PyPI server. Developers need these packages installed on all clusters. What approach works best? Init scripts are the right choice here. The script can authenticate to the private server, install the packages, and any cluster using that init script will have the packages available at startup. This is better than manually installing with %pip because it is consistent and automated, and better than attaching cluster libraries because init scripts handle authentication and custom indices more naturally.


---


### Key Takeaways

* Use requirements.txt in DABs for production code to ensure dependencies are version controlled and reproducible.
* Use %pip in notebooks for interactive development and testing, not for production jobs.
* Attach libraries directly to clusters when multiple notebooks/jobs on the same cluster need the same dependency.
* Use init scripts for system level dependencies, private package indices, or complex setup logic.
* Use UC volumes to centrally store and govern wheel files and JARs, especially in regulated environments.

---


### Gotchas and Tips


> [!NOTE]
> ⚠️ After installing a library with %pip, always run %restart_python to restart the Python interpreter. Otherwise, the new library might not be available in the current session.


> [!NOTE]
> ⚠️ Init scripts run as the root user on the cluster. Avoid setting user specific paths or permissions that might not work across different users.


> [!NOTE]
> ⚠️ If you attach conflicting library versions to a cluster (e.g., two versions of the same package), the cluster startup will fail. Always be careful when updating cluster libraries on shared clusters.


---


### Links and Resources

* **[Databricks Libraries](https://docs.databricks.com/aws/en/libraries/)** — Installing and managing third-party libraries on clusters and notebooks.
* **[Cluster Libraries](https://docs.databricks.com/aws/en/libraries/cluster-libraries)** — Managing cluster-scoped library installations and dependency resolution.


## User Defined Functions (Pandas/Python UDFs)


### Topic Overview

User Defined Functions (UDFs) allow you to extend Spark's built in functionality with custom logic written in Python. When Spark's SQL functions and DataFrame transformations are not enough, UDFs let you apply your own logic row by row or across groups of rows.

Databricks supports two main types of Python UDFs: traditional Python UDFs (which serialize Python objects and execute in a Python worker) and Pandas UDFs (which use Arrow columnar transfer and run in vectorized batches). Pandas UDFs are significantly faster because they avoid row by row serialization overhead and can take advantage of vectorized operations. The tradeoff is that Pandas UDFs require your function to work with pandas Series or DataFrames instead of individual Python values.

For the Professional exam, you need to understand when to use Python UDFs vs Pandas UDFs, scalar vs grouped map functions, how to register UDFs for use in SQL, and how to measure the performance difference. The exam expects you to recognize scenarios where Pandas UDFs would outperform traditional UDFs.


---


### Key Concepts


<details>
<summary><b>Python UDFs vs Pandas UDFs</b></summary>

Traditional Python UDFs execute row by row. Each row is serialized to Python, passed to your function, and the result is serialized back. This creates significant overhead. Pandas UDFs use Apache Arrow for efficient data transfer and process data in batches (columnar format). A Pandas UDF receives a pandas Series or batch of Series and returns a Series. Because of this vectorized approach, Pandas UDFs are often 5 to 100 times faster than traditional Python UDFs. The tradeoff is that Pandas UDFs require you to write code that works with pandas objects, not scalar Python values.


</details>


<details>
<summary><b>Scalar vs Grouped Map UDFs</b></summary>

Scalar UDFs (Pandas or Python) take one or more inputs and produce one output per input row. They are suitable for element wise transformations. Grouped map UDFs are Pandas UDFs that partition data by key, receive each group as a separate pandas DataFrame, apply transformations to the entire DataFrame, and return a modified DataFrame. Grouped map UDFs are useful when you need to apply the same complex logic to multiple groups in your data, like rolling window calculations or group specific aggregations.


</details>


<details>
<summary><b>Registering UDFs for SQL</b></summary>

UDFs defined in Python can be registered as SQL functions using `spark.udf.register()`. This makes the UDF available in SQL queries just like a built in function. When registering, you specify the Python function, a name for the SQL function, and the return type as a Spark SQL type. Once registered, you can use the function in SQL SELECT statements, WHERE clauses, and any other SQL context. This is useful when you want to share custom functions across multiple notebooks or when your pipeline uses both Python and SQL code.


</details>


<details>
<summary><b>Arrow Optimization for Performance</b></summary>

Arrow is an in memory columnar format that allows efficient transfer of data between Java and Python. Pandas UDFs use Arrow to serialize data from the JVM to Python workers and back. This is much faster than pickling individual row objects. The Arrow format is standardized and optimized for columnar operations, which aligns well with pandas Series and vectorized operations. If you need to call a Python UDF many times or process large datasets, using a Pandas UDF with Arrow serialization can provide massive speedups compared to traditional Python UDFs.


</details>


---


### Code Examples


#### Traditional Python UDF


```python
from pyspark.sql.functions import col
from pyspark.sql.types import StringType

# Define the UDF
def upper_and_length(s):
    if s is None:
        return None
    return f"{s.upper()}_{len(s)}"

# Create UDF
upper_length_udf = spark.udf.register(
    "upper_length", 
    upper_and_length, 
    StringType()
)

# Use in PySpark
df = spark.createDataFrame([("hello",), ("world",)], ["word"])
result = df.select(upper_length_udf(col("word")).alias("result"))
result.show()
```


#### Pandas UDF (Scalar)


```python
from pyspark.sql.functions import pandas_udf
import pandas as pd
from pyspark.sql.types import StringType

# Define Pandas UDF with @decorator
@pandas_udf(StringType())
def upper_and_length_pandas(s: pd.Series) -> pd.Series:
    return s.str.upper() + "_" + s.str.len().astype(str)

# Use in PySpark
df = spark.createDataFrame([("hello",), ("world",)], ["word"])
result = df.select(upper_and_length_pandas("word").alias("result"))
result.show()

# Use in SQL
spark.sql("""
    SELECT upper_and_length_pandas(word) as result FROM your_table
""")
```


#### Grouped Map Pandas UDF


```python
from pyspark.sql.functions import col, pandas_udf
from pyspark.sql.types import StructType, StructField, StringType, IntegerType
import pandas as pd

# GroupedMap UDF that normalizes values per group
@pandas_udf(
    StructType([
        StructField("category", StringType()),
        StructField("value", IntegerType()),
        StructField("normalized", IntegerType())
    ])
)
def normalize_per_group(pdf: pd.DataFrame) -> pd.DataFrame:
    max_val = pdf["value"].max()
    pdf["normalized"] = (pdf["value"] * 100) // max_val
    return pdf

# Use with groupedApply
df = spark.createDataFrame(
    [("A", 10), ("A", 20), ("B", 5), ("B", 15)],
    ["category", "value"]
)

result = df.groupby("category").applyInPandas(
    normalize_per_group,
    schema="category string, value int, normalized int"
)
result.show()
```


---


### Common Exam Scenarios

A pipeline processes millions of records and applies a complex string transformation to a column. The current Python UDF implementation is slow. What is the likely issue and solution? The issue is that traditional Python UDFs serialize each row individually, creating massive overhead. The solution is to rewrite the UDF as a Pandas UDF using the @pandas_udf decorator. By processing data in batches using Arrow and pandas vectorized operations, the Pandas UDF will be 10 to 100 times faster. The exam expects you to recognize the performance characteristics of each UDF type.

A data engineer has a Python UDF that performs calculations on individual scalar values and needs to use it in SQL queries. How should they make the UDF available in SQL? They should register the UDF using `spark.udf.register()`, providing the function name, the Python function, and the return type as a Spark SQL type. Once registered, the UDF becomes available as a SQL function that can be called in SELECT, WHERE, and other SQL clauses. This is more convenient than always wrapping SQL data in Python DataFrames.

A grouped aggregation needs to apply custom logic within each group, such as ranking, normalization, or statistical analysis per group. Should you use a scalar Pandas UDF or a grouped map UDF? The correct choice is a grouped map UDF. Scalar UDFs process individual rows and cannot access other rows in the same group. Grouped map UDFs receive each group as a pandas DataFrame, allowing you to perform complex group level operations. You would use `groupby().applyInPandas()` to apply the grouped map UDF.


---


### Key Takeaways

* Pandas UDFs are 5 to 100 times faster than traditional Python UDFs due to Arrow vectorization.
* Use scalar Pandas UDFs for element wise transformations on individual rows or columns.
* Use grouped map Pandas UDFs when you need to apply logic to an entire group of rows at once.
* Register UDFs with `spark.udf.register()` to make them available as SQL functions.
* Always specify the return type explicitly when registering UDFs to help Spark optimize execution.

---


### Gotchas and Tips


> [!NOTE]
> ⚠️ Pandas UDFs must return the exact output type specified in the decorator. If your function returns a different type, Spark will raise an error at runtime. Always test the return types carefully.


> [!NOTE]
> ⚠️ Traditional Python UDFs cannot be optimized by Spark's Catalyst optimizer because Spark does not understand Python code. Pandas UDFs are better because they work with Arrow which Catalyst can partially optimize.


> [!NOTE]
> ⚠️ Grouped map UDFs using `applyInPandas()` trigger a shuffle if the grouping column is not already partitioned. Be aware of this when working with large datasets.


---


### Links and Resources

* **[User-Defined Functions Overview](https://docs.databricks.com/aws/en/udf/)** — Introduction to UDFs in Databricks including scalar, Python, and Pandas UDFs.
* **[Pandas UDFs (Vectorized UDFs)](https://docs.databricks.com/aws/en/udf/pandas)** — High-performance vectorized UDFs using Apache Arrow for batch operations.
* **[Python UDFs](https://docs.databricks.com/aws/en/udf/python)** — Creating and registering Python scalar UDFs for SQL and DataFrame use.


## Lakeflow Spark Declarative Pipelines (Batch & Streaming)


### Topic Overview

Lakeflow Spark Declarative Pipelines are a framework for building reliable, maintainable data pipelines on Databricks. Formerly known as Delta Live Tables (DLT), this framework lets you define transformations declaratively using SQL or Python, and Databricks handles scheduling, error handling, and quality monitoring automatically.

The key difference between Lakeflow and traditional Spark code is the declarative approach. Instead of writing imperative code that says how to compute results (collect, compute, write), you declare what you want to compute using decorators like @dlt.table or @dlt.view. Databricks analyzes your declarations, understands data dependencies, and orchestrates execution. This makes it easy to add expectations (data quality checks), handle recovery automatically, and trigger pipeline reruns only on affected datasets.

The Professional exam expects you to understand the syntax, the difference between batch and streaming tables, when to use views vs tables, how to define expectations, and the difference between triggered and continuous pipeline modes.


---


### Key Concepts


<details>
<summary><b>Declarative vs Imperative Pipelines</b></summary>

Imperative pipelines are traditional Spark code where you explicitly define each step: read data, transform, write output, etc. Declarative pipelines describe what results you want without specifying every step. Lakeflow Spark Declarative Pipelines use a declarative model. You annotate Python or SQL functions with @dlt.table or @dlt.view, Databricks infers dependencies and automatically manages orchestration, retries, and incremental updates. The declarative approach is more maintainable because your code is focused on transformation logic, not plumbing.


</details>


<details>
<summary><b>Tables vs Views in Lakeflow Pipelines</b></summary>

Lakeflow tables are materialized results written to storage. They persist across pipeline runs and are useful when you want to reuse the computed data multiple times or when the computation is expensive. Lakeflow views are temporary, computed on the fly during the pipeline run. Views are useful for intermediate transformations that are only used once. Views do not persist and are recomputed if referenced by downstream tables. Choose tables when results are expensive to recompute or frequently accessed; use views for temporary intermediate results.


</details>


<details>
<summary><b>Batch vs Streaming Tables</b></summary>

Batch tables process all available data each run. They are ideal for daily or hourly job patterns where you process a full dataset from scratch (or incrementally via Lakeflow logic). Streaming tables process data continuously as new records arrive from a streaming source like Kafka or Auto Loader. Streaming tables maintain state across runs and can keep track of what was already processed. Use batch tables for scheduled jobs; use streaming tables when data arrives continuously and you want real time or near real time processing.


</details>


<details>
<summary><b>Expectations for Data Quality</b></summary>

Expectations let you define quality rules directly in your Lakeflow pipeline code. You use the @dlt.expect* decorator to assert conditions on your data. For example, @dlt.expect("valid_email", "email like '%@%.%'") checks that the email column matches a pattern. Lakeflow tracks which records fail expectations and quarantines them or logs violations. You can choose to fail the pipeline if violations exceed a threshold or just log them for monitoring. This declarative quality checking is much cleaner than writing separate validation code.


</details>


---


### Code Examples


#### Batch Table with SQL


```sql
-- Define a batch table in Lakeflow using SQL
CREATE OR REPLACE TABLE dlt.customer_orders
COMMENT "Cleaned customer orders"
AS
SELECT 
    order_id,
    customer_id,
    order_date,
    amount,
    CASE 
        WHEN amount < 0 THEN NULL
        ELSE amount
    END AS valid_amount
FROM dlt.raw_orders
WHERE order_date >= CURRENT_DATE() - INTERVAL 30 DAYS
```


#### Streaming Table with Python and Expectations


```python
import dlt
from pyspark.sql.functions import col

# Define a streaming table with expectations
@dlt.table(
    name="events_stream",
    comment="Real time streaming events",
    table_properties={"quality": "silver"}
)
@dlt.expect("valid_user_id", "user_id IS NOT NULL")
@dlt.expect("positive_timestamp", "event_timestamp > 0")
def events_stream():
    # Auto Loader reads new files as they arrive
    return dlt.read_stream("cloud_files") \
        .select("user_id", "event_timestamp", "event_type", "data")

# Define a materialized view that transforms the stream
@dlt.table(
    name="events_enriched",
    comment="Enriched events with user info"
)
def events_enriched():
    events = dlt.read("events_stream")
    users = dlt.read("dim_users")
    return events.join(users, on="user_id", how="left")
```


#### View for Intermediate Transformation


```sql
-- Views are temporary and recomputed each run
CREATE OR REPLACE VIEW dlt.orders_by_month AS
SELECT 
    DATE_TRUNC('month', order_date) AS month,
    COUNT(*) AS order_count,
    SUM(amount) AS total_revenue
FROM dlt.customer_orders
GROUP BY DATE_TRUNC('month', order_date);

-- This table uses the view above
CREATE OR REPLACE TABLE dlt.monthly_summary AS
SELECT 
    month,
    order_count,
    total_revenue,
    ROUND(total_revenue / order_count, 2) AS avg_order_value
FROM dlt.orders_by_month
```


---


### Common Exam Scenarios

A team is building a daily batch ingestion pipeline. Raw data arrives each day in cloud storage. They need to clean it and make it available to analysts. Should they use streaming tables or batch tables? Batch tables are the correct choice. Since data arrives daily in batches (not continuously), a batch pipeline that runs on a schedule processes all available data. Streaming tables are better for continuous data streams like event logs from Kafka. The exam expects you to recognize that streaming is not always better; batch is more appropriate for periodic data arrivals.

A Lakeflow pipeline defines multiple intermediate transformations that feed into a single final table. Should the intermediate steps be tables or views? They should be views. Views are temporary and do not persist. Because they are only used as inputs to the final table, materializing them would waste storage without benefit. The final result should be a table so it is available to downstream consumers. This choice optimizes for performance and storage efficiency.

A data quality requirement states that all customer IDs must be non null and all order amounts must be positive. How should this be enforced in a Lakeflow pipeline? Use expectations with @dlt.expect decorators. Define @dlt.expect("non_null_customer_id", "customer_id IS NOT NULL") and @dlt.expect("positive_amount", "amount > 0"). Lakeflow tracks violations and can quarantine bad records. This is cleaner and more maintainable than writing separate validation code outside the pipeline.


---


### Key Takeaways

* Lakeflow Spark Declarative Pipelines use decorators (@dlt.table, @dlt.view) to define transformations declaratively.
* Use tables for results you want to persist and reuse; use views for temporary intermediate computations.
* Batch tables process scheduled batches of data; streaming tables process continuous data arrivals.
* Define quality rules with @dlt.expect to declaratively specify data quality constraints.
* Lakeflow handles dependency tracking automatically based on which tables/views you read from.

---


### Gotchas and Tips


> [!NOTE]
> ⚠️ Lakeflow pipelines can run in triggered or continuous mode. Triggered pipelines run on demand or on a schedule. Continuous pipelines continuously ingest from streaming sources. Choose the mode based on your data arrival pattern.


> [!NOTE]
> ⚠️ When a Lakeflow table definition changes (e.g., new column), downstream tables that depend on it are automatically invalidated and will be recomputed on the next pipeline run.


> [!NOTE]
> ⚠️ Records that fail expectations can be quarantined instead of failing the entire pipeline. Configure this in the pipeline settings based on your quality tolerance.


---


### Links and Resources

* **[Lakeflow Spark Declarative Pipelines](https://docs.databricks.com/aws/en/ldp/)** — Building reliable batch and streaming ETL pipelines with declarative syntax.
* **[Lakeflow SDP Concepts](https://docs.databricks.com/aws/en/ldp/concepts)** — Core concepts including datasets, expectations, and pipeline modes.
* **[Streaming Tables](https://docs.databricks.com/aws/en/ldp/streaming-tables)** — Defining append-only streaming tables for incremental data processing.


## ETL Automation with Jobs (UI/APIs/CLI)


### Topic Overview

Lakeflow Jobs (formerly Databricks Workflows) are the way to orchestrate and automate data pipelines in production. A job is a set of tasks that can depend on each other, can be triggered on a schedule, and can be monitored centrally. Instead of manually running notebooks or Python scripts, jobs handle scheduling, retries, error notifications, and logging automatically.

You can create and manage jobs through the Databricks UI, the REST API, or the CLI. The REST API and CLI approaches are especially important for production because they let you define jobs in code (infrastructure as code). Multi task jobs let you orchestrate complex workflows where some tasks run in parallel and others depend on earlier tasks. This level of control is essential for production data pipelines.

The Professional exam focuses on creating jobs via API and CLI, understanding task dependencies, parameterized jobs, and choosing between job clusters and all purpose clusters. You need to know how to trigger jobs, repair failed runs, and override parameters.


---


### Key Concepts


<details>
<summary><b>Jobs vs Lakeflow Pipelines</b></summary>

Lakeflow Spark Declarative Pipelines are best for complex ETL where you define tables and views with automatic dependency tracking. Jobs are more general orchestration tools. A job can run notebooks, Python scripts, jars, or SQL queries. Jobs provide more flexibility for arbitrary workflows. Lakeflow pipelines are specifically optimized for data transformations with quality checks and incremental updates. In practice, you often use Lakeflow pipelines for the data transformations and wrap them in a job for scheduling and monitoring.


</details>


<details>
<summary><b>Task Dependencies and Multi-Task Jobs</b></summary>

A multi task job is a job with multiple tasks that can run in sequence or in parallel. Each task can depend on other tasks, creating a DAG (directed acyclic graph) of work. For example, Task A might ingest data, Task B and Task C might do independent transformations in parallel, and Task D might combine the results. You define dependencies using the depends_on field in task configuration. This is more powerful than a single task because it lets you express complex workflows and parallelize work where possible.


</details>


<details>
<summary><b>Job Clusters vs All Purpose Clusters</b></summary>

Job clusters are created when the job starts and terminated when the job completes. This is cost effective for batch jobs because you only pay for compute during job execution. All purpose clusters persist and are used by multiple users or jobs. Use job clusters for production batch jobs. Use all purpose clusters for interactive development or when multiple jobs share a cluster. For DABs, job clusters are the preferred approach because they are isolated, reproducible, and cost effective.


</details>


<details>
<summary><b>Parameterized Jobs</b></summary>

Jobs can accept parameters that are passed to tasks at runtime. Parameters make jobs reusable and flexible. For example, a data ingestion job might accept a date range parameter so you can rerun it for different time periods without changing the code. You define parameters in the job config and access them in your code via task parameters. This is essential for maintaining a single job definition that can handle multiple scenarios.


</details>


---


### Code Examples


#### Multi-Task Job via REST API


```python
# Create a multi task job using the Databricks REST API
import requests
import json

api_url = "https://<instance>.cloud.databricks.com/api/2.1/jobs/create"
headers = {"Authorization": f"Bearer {token}"}

job_config = {
    "name": "ETL Pipeline",
    "tasks": [
        {
            "task_key": "ingest",
            "notebook_task": {
                "notebook_path": "/Workspace/etl/ingest",
                "source": "WORKSPACE"
            },
            "job_cluster_key": "compute",
            "max_retries": 2,
            "timeout_seconds": 3600
        },
        {
            "task_key": "transform",
            "notebook_task": {
                "notebook_path": "/Workspace/etl/transform"
            },
            "depends_on": [{"task_key": "ingest"}],
            "job_cluster_key": "compute"
        },
        {
            "task_key": "publish",
            "notebook_task": {
                "notebook_path": "/Workspace/etl/publish"
            },
            "depends_on": [{"task_key": "transform"}],
            "job_cluster_key": "compute"
        }
    ],
    "job_clusters": [
        {
            "job_cluster_key": "compute",
            "new_cluster": {
                "spark_version": "13.3.x-scala2.12",
                "node_type_id": "i3.xlarge",
                "num_workers": 2
            }
        }
    ],
    "schedule": {
        "quartz_cron_expression": "0 0 * * * ?",
        "timezone_id": "UTC"
    }
}

response = requests.post(api_url, json=job_config, headers=headers)
job_id = response.json()["job_id"]
print(f"Created job {job_id}")
```


#### Parameterized Job via CLI


```bash
# Create a job with parameters using the Databricks CLI
databricks jobs create --json '{                                           
  "name": "Data Backfill",
  "tasks": [
    {
      "task_key": "backfill",
      "notebook_task": {
        "notebook_path": "/Workspace/jobs/backfill_data",
        "base_parameters": {
          "start_date": "2024-01-01",
          "end_date": "2024-01-31"
        }
      },
      "new_cluster": {
        "spark_version": "13.3.x-scala2.12",
        "node_type_id": "i3.xlarge",
        "num_workers": 2
      }
    }
  ]
}'

# Trigger the job with different parameters
databricks jobs run-now \
  --job-id 123 \
  --notebook-params '{"start_date": "2024-02-01", "end_date": "2024-02-29"}'
```


#### Repair a Failed Job Run


```bash
# Get the job run ID and repair it
databricks runs list --job-id 123 --limit 1

# Repair the failed run (rerun from the point of failure)
databricks runs repair-run --run-id 456

# Repair a specific failed task within a multi task job
databricks runs repair-run --run-id 456 --task-key transform
```


---


### Common Exam Scenarios

A data pipeline has three stages: ingest raw data, validate and clean it, then publish to a data mart. The team wants these to run in sequence on a schedule, with automatic retries if any step fails. How should this be set up? Create a multi task job with three tasks (ingest, validate, publish) where validate depends on ingest and publish depends on validate. Use a job cluster to keep costs low and set max_retries on each task. This is cleaner and more reliable than running three separate scheduled jobs.

A backfill job needs to reprocess data for a specific date range, but the pipeline code itself is generic. Should the same job definition be reused for different date ranges? Yes, use a parameterized job. Define parameters for start_date and end_date in the job config, then trigger the job with different parameter values for different date ranges. This way, you maintain a single job definition in code and avoid duplication.

A job run failed partway through a multi task pipeline. The engineer wants to retry from the point of failure without rerunning all earlier tasks. What command should they use? Use databricks runs repair-run --run-id <run_id> to rerun only the failed task and its downstream dependents. You can optionally specify a task_key to repair only that specific task. This is more efficient than rerunning the entire job.


---


### Key Takeaways

* Use Lakeflow Jobs to orchestrate multi task pipelines with dependencies and scheduling.
* Define task dependencies using the depends_on field to create complex workflows.
* Use job clusters for production batch jobs to minimize costs.
* Parameterize jobs to reuse the same definition for different inputs or date ranges.
* Create and manage jobs via REST API or CLI for infrastructure as code practices.

---


### Gotchas and Tips


> [!NOTE]
> ⚠️ Job clusters take time to start up. If you have many short tasks, the startup overhead might dominate. For very fast tasks, consider using an all purpose cluster instead.


> [!NOTE]
> ⚠️ When defining task dependencies, be careful not to create circular dependencies. Databricks will reject job configs with circular dependencies.


> [!NOTE]
> ⚠️ Parameters are passed to tasks as environment variables or notebook widgets depending on the task type. Always check how your task type receives parameters before using them.


---


### Links and Resources

* **[Lakeflow Jobs](https://docs.databricks.com/aws/en/jobs/)** — Orchestrating ETL workflows with Databricks Jobs, including UI, API, and CLI methods.
* **[Job Notifications](https://docs.databricks.com/aws/en/jobs/notifications)** — Configuring alerts and notifications for job run events.


## Streaming Tables vs Materialized Views


### Topic Overview

Streaming tables and materialized views are two different approaches to maintaining computed results in Lakeflow pipelines. Both are defined using the @dlt.table decorator, but they have different refresh semantics and are optimized for different use cases. Understanding when to use each is crucial for building efficient pipelines.

Streaming tables are designed for append only data. They process each input record exactly once, maintain state about what has been processed, and produce append only output. This is ideal for real time or near real time workloads where data arrives continuously. Materialized views, on the other hand, are recomputed from scratch (or incrementally if possible) every time the pipeline runs. They support arbitrary transformations including aggregations and joins, but are more expensive to compute.

For the Professional exam, you need to understand the syntax differences, when to choose each type, the performance implications, and how they behave in a Lakeflow pipeline. The exam may test your ability to recognize which data flow patterns require streaming tables vs materialized views.


---


### Key Concepts


<details>
<summary><b>Streaming Tables</b></summary>

Streaming tables process data continuously and maintain state about what has been ingested. Each record is processed exactly once, making them ideal for append only data sources like Kafka topics or Auto Loader directories. Streaming tables output is always append only. Because they maintain state, they are efficient for continuous ingestion patterns. Use streaming tables when you have a continuous stream of events or data and want to process them in real time or near real time without recomputing the entire dataset.


</details>


<details>
<summary><b>Materialized Views</b></summary>

Materialized views compute results from their dependencies and materialize (store) the results. Every time a pipeline run executes, the materialized view is recomputed based on current data. This allows for arbitrary transformations including aggregations, joins, windowing, and filtering. The downside is that recomputation can be expensive. Use materialized views when you need to support complex transformations or when data arrives in batches and you want results recomputed periodically.


</details>


<details>
<summary><b>Refresh Semantics</b></summary>

Streaming tables refresh incrementally by processing only new input records. Materialized views refresh by recomputing from their source tables. If a materialized view depends on a streaming table, the materialized view processes only the new records appended since the last run. If a materialized view depends on another materialized view, it recomputes based on the current state of that parent. This distinction matters for performance: streaming tables are more efficient for incremental processing.


</details>


<details>
<summary><b>Stateful vs Stateless Operations</b></summary>

Streaming tables maintain state between runs (e.g., what records have been seen). This allows them to track incremental progress and avoid reprocessing. Materialized views are stateless; they recompute from scratch or from current source state. Stateful operations like deduplication, exactly once semantics, and state dependent joins are natural for streaming tables. Stateless operations like filtering, mapping, and simple aggregations work well with both.


</details>


---


### Code Examples


#### Streaming Table with Auto Loader


```python
import dlt
from pyspark.sql.functions import col, from_json, schema_of_json

# Streaming table that ingests JSON events continuously
@dlt.table(
    name="raw_events",
    comment="Raw event stream from Auto Loader"
)
def raw_events():
    # Auto Loader processes new files as they arrive
    return dlt.read_stream("cloud_files") \
        .option("cloudFiles.format", "json") \
        .option("cloudFiles.schemaLocation", "/tmp/schema") \
        .load("/Volumes/data/events")

# Materialized view that processes streaming table (supports aggregations)
@dlt.table(
    name="events_by_type",
    comment="Event counts by type (materialized view)"
)
def events_by_type():
    return dlt.read("raw_events") \
        .groupBy("event_type") \
        .count() \
        .alias("event_count")
```


#### Streaming Table for Deduplication


```python
import dlt
from pyspark.sql.functions import col, row_number, desc
from pyspark.sql.window import Window

# Streaming table that deduplicates on event_id
@dlt.table(
    name="deduplicated_events",
    comment="Events deduplicated by ID, keeping latest"
)
def deduplicated_events():
    events = dlt.read_stream("raw_events")
    
    # Window function to rank by timestamp within each ID
    window_spec = Window.partitionBy("event_id").orderBy(desc("timestamp"))
    
    # Keep only the latest record for each event_id
    return events \
        .withColumn("rn", row_number().over(window_spec)) \
        .filter(col("rn") == 1) \
        .drop("rn")
```


#### Materialized View for Complex Aggregation


```sql
-- Materialized view computed from multiple sources
CREATE OR REPLACE TABLE dlt.hourly_metrics AS
SELECT 
    DATE_TRUNC('hour', event_timestamp) AS hour,
    event_type,
    COUNT(*) AS event_count,
    COUNT(DISTINCT user_id) AS unique_users,
    PERCENTILE(duration_ms, 0.5) AS median_duration,
    MAX(duration_ms) AS max_duration
FROM dlt.deduplicated_events
WHERE event_timestamp >= CURRENT_TIMESTAMP() - INTERVAL 24 HOURS
GROUP BY 
    DATE_TRUNC('hour', event_timestamp),
    event_type
```


---


### Common Exam Scenarios

An ingestion pipeline receives JSON events from a Kafka topic continuously. Each event has a unique event_id and should be processed exactly once. Should the initial table be a streaming table or materialized view? Use a streaming table. Kafka is a continuous streaming source, and streaming tables are optimized for processing append only data exactly once. Streaming tables maintain state about which records have been processed, preventing duplicates.

A pipeline computes hourly metrics (counts, averages, percentiles) from raw events. This requires aggregation and statistical calculations. Can this be done with a streaming table or does it need a materialized view? A materialized view is required. Streaming tables are designed for append only transformations. Aggregations like COUNT and PERCENTILE require materializing the results. The materialized view processes the streaming table and computes metrics on demand.

A deduplication pipeline needs to keep only the latest version of each record based on a timestamp. Can this be a streaming table? Yes, streaming tables support stateful operations like deduplication. Use a streaming table with a window function to rank records by timestamp within each group, then keep only rank 1. This is efficient because the streaming table only needs to track new records, not recompute the entire dataset.


---


### Key Takeaways

* Streaming tables process append only data continuously and maintain state between runs.
* Materialized views are recomputed from source data and support arbitrary transformations including aggregations.
* Use streaming tables for continuous ingestion from Kafka, Auto Loader, or other streaming sources.
* Use materialized views for aggregations, joins, and complex transformations that recompute from source.
* A materialized view can process a streaming table as input and refine the data with aggregations.

---


### Gotchas and Tips


> [!NOTE]
> ⚠️ Streaming tables must read from streaming sources (dlt.read_stream). If you try to read a static table with dlt.read_stream, the pipeline will fail. Use dlt.read() for non streaming sources.


> [!NOTE]
> ⚠️ Materialized views can become expensive if they recompute complex aggregations over large datasets on every run. Monitor performance and consider filtering data by time window (e.g., CURRENT_TIMESTAMP() - INTERVAL 24 HOURS) to reduce recomputation.


> [!NOTE]
> ⚠️ Streaming tables output is always append only, even if the input appears to have updates. If you need to handle updates or deletes, use a materialized view with appropriate logic to handle state changes.


---


### Links and Resources

* **[Streaming Tables](https://docs.databricks.com/aws/en/ldp/streaming-tables)** — Defining and managing streaming tables for append-only incremental pipelines.
* **[Materialized Views](https://docs.databricks.com/aws/en/ldp/materialized-views)** — Pre-computed views that automatically refresh when upstream data changes.


## APPLY CHANGES APIs for CDC


### Topic Overview

Change Data Capture (CDC) is a pattern for capturing and propagating data changes from a source system into your Lakehouse. In Lakeflow Spark Declarative Pipelines, the APPLY CHANGES API simplifies CDC implementation by automatically handling Slowly Changing Dimensions (SCD) Type 1 and Type 2 logic. Instead of writing complex SQL merge statements yourself, you declare the source of changes, the keys that identify records, and how to apply them. Lakeflow manages the rest: sequencing changes in the correct order, handling duplicates, and maintaining historical records if needed.

The APPLY CHANGES syntax is designed to work seamlessly with streaming sources like Kafka, Kinesis, or cloud storage (when polled). You specify the target table where changes land, the keys that identify rows, and optionally the sequencing field that determines the order of changes. For SCD Type 2, Lakeflow automatically manages start_date and end_date columns and closure logic without you having to code it.

On the exam, you will encounter scenarios asking you to choose between SCD Type 1 (overwrite) vs Type 2 (keep history), how to sequence changes correctly from a streaming source, and how to apply transformations alongside CDC logic. Understanding the trade offs between these approaches and when to use each is critical.


---


### Key Concepts


<details>
<summary><b>**SCD Type 1 vs SCD Type 2**</b></summary>

SCD Type 1 (Slowly Changing Dimension Type 1) overwrites the entire row when a change is detected. No history is kept; only the current state exists. Use Type 1 when you do not need to track changes over time, such as correcting a misspelled name or updating a customer's current address.

SCD Type 2 (Slowly Changing Dimension Type 2) creates a new row for each change and marks the previous version as closed. It maintains a complete audit trail. Lakeflow automatically manages start_date and end_date columns so you can easily query the state of a record at any point in time. Use Type 2 when you need historical context, like tracking how a product's price changed over time.


</details>


<details>
<summary><b>**Keys and Sequence By**</b></summary>

The keys parameter identifies which columns uniquely identify a row (like a primary key). Lakeflow uses keys to match incoming changes to existing records.

The sequence_by parameter specifies the column that determines the order in which changes are applied (usually a timestamp or sequence number). This is critical when changes arrive out of order from a streaming source. Without proper sequencing, you might apply an old change after a newer one, corrupting your data.


</details>


<details>
<summary><b>**Applying Changes from Streaming Sources**</b></summary>

Lakeflow's APPLY CHANGES is designed to work with streaming tables fed from sources like Kafka. Changes flow in continuously, and Lakeflow ensures they are applied in order, even if micro batches arrive out of sequence. The declarative nature means you don't worry about managing state or checkpoints yourself.


</details>


<details>
<summary><b>**Where Clause and Filtering**</b></summary>

APPLY CHANGES supports an optional WHERE clause to filter which rows from the source are processed. For example, you might only apply changes where status is not 'deleted', or only include records from a specific region. This keeps your target table clean and focused.


</details>


---


### Code Examples


#### SCD Type 1: APPLY CHANGES SQL


```sql
APPLY CHANGES INTO my_catalog.my_schema.customers
FROM stream customer_changes
KEYS (customer_id)
SEQUENCE BY updated_at
WHEN MATCHED THEN UPDATE SET *
WHEN NOT MATCHED THEN INSERT *
```

This Type 1 SCD applies each change directly, overwriting the entire row. Old values are lost. Suitable for corrections or simple updates where history is not needed.


#### SCD Type 2: APPLY CHANGES SQL with History


```sql
APPLY CHANGES INTO my_catalog.my_schema.products
FROM stream product_changes
KEYS (product_id)
SEQUENCE BY change_timestamp
WHEN MATCHED AND (change_type = 'UPDATE') THEN UPDATE SET *
WHEN MATCHED AND (change_type = 'DELETE') THEN DELETE
WHEN NOT MATCHED THEN INSERT *;
```

For Type 2, Lakeflow automatically adds start_date and end_date columns. When a row is updated, the old version is closed (end_date set) and a new version is inserted. This maintains full audit trail for temporal queries.


#### Python dlt.apply_changes (Lakeflow Pipelines)


```python
import dlt
from pyspark.sql import functions as F

@dlt.table
def customer_raw():
    return spark.readStream.format("cloudFiles") \
        .option("cloudFiles.format", "json") \
        .option("cloudFiles.schemaLocation", "/checkpoints/customers") \
        .load("/source/customers")

@dlt.table
def customers_scd2():
    return dlt.apply_changes(
        target="my_catalog.my_schema.customers_scd2",
        source="customer_raw",
        keys=["customer_id"],
        sequence_by="updated_at",
        as_of_delta_timestamp="2024-01-01",
        ignore_null_updates=False,
        apply_as_merge=True
    )
```

The Python API handles CDC declaratively. You define the streaming source, specify keys and sequencing, and Lakeflow manages the SCD logic for you. The ignore_null_updates flag lets you skip updates where certain columns are null (useful when partial updates arrive from the source).


---


### Common Exam Scenarios

**Scenario 1: Customer address history tracking**

Your retail company receives customer address updates from an upstream system. Some customers have moved multiple times, and you need to be able to generate reports like 'which states did customer X live in during 2023?' and 'what was the customer's primary address on January 15, 2024?' You would choose SCD Type 2 to maintain the full history with start_date and end_date. APPLY CHANGES automatically manages these temporal columns, so your downstream analysts can simply filter the table where start_date <= query_date AND (end_date IS NULL OR end_date > query_date).

**Scenario 2: Out of order change events**

Data arrives from Kafka in micro batches, but network delays mean that changes for product ID 1234 arrive in the wrong order: a price update from 10:00 AM arrives after a price update from 9:00 AM. Without the sequence_by parameter, you would overwrite the 9 AM price with the 10 AM price even though it happened first. By specifying sequence_by with a reliable timestamp, Lakeflow ensures changes are applied in logical order regardless of physical arrival sequence.

**Scenario 3: Filtering invalid changes**

Your source stream includes test records and deletions mixed with production updates. You add a WHERE clause to APPLY CHANGES to filter out rows where environment != 'production' or where change_type = 'TEST'. This keeps your target table clean without requiring a separate transformation step before CDC.


---


### Key Takeaways

* APPLY CHANGES simplifies CDC by handling SCD Type 1 (overwrite) and Type 2 (keep history) without manual merge code
* Use keys to identify matching rows and sequence_by to ensure changes are applied in logical order, even if micro batches arrive out of sequence
* Lakeflow automatically manages start_date and end_date columns for Type 2, enabling temporal queries without additional code
* Filter source changes with WHERE clauses to exclude test data or invalid records before they land in the target table
* APPLY CHANGES works seamlessly with streaming sources like Kafka and cloud storage, making it ideal for real time CDC pipelines

---


### Gotchas and Tips


> [!NOTE]
> ⚠️ Sequence by must be reliable: If your sequence_by column has duplicate timestamps or is not monotonically increasing, Lakeflow may not apply changes in the correct order. Use high resolution timestamps or sequence numbers from the source system.


> [!NOTE]
> ⚠️ Type 1 vs Type 2 trade off: SCD Type 1 is faster and uses less storage, but you lose historical context. Only use Type 1 when you truly do not need to audit changes over time.


> [!NOTE]
> ⚠️ Keys must be stable: If your key values change (e.g., customer_id gets reassigned), APPLY CHANGES treats it as a new row. Ensure keys are immutable identifiers.


---


### Links and Resources

* **[APPLY CHANGES APIs for CDC](https://docs.databricks.com/aws/en/ldp/cdc)** — Processing change data capture feeds with APPLY CHANGES and APPLY CHANGES FROM SNAPSHOT.
* **[Change Data Feed](https://docs.databricks.com/aws/en/delta/delta-change-data-feed)** — Reading row-level changes from Delta tables for downstream processing.


## Spark Structured Streaming vs Lakeflow Pipelines


### Topic Overview

Spark Structured Streaming and Lakeflow Spark Declarative Pipelines are two approaches to streaming data processing on Databricks. Spark Structured Streaming gives you complete control over micro batch execution, checkpointing, and stateful transformations. You write code in PySpark or Scala using readStream and writeStream APIs, manage your own state backends, and handle error recovery manually. Lakeflow Spark Declarative Pipelines offer a higher level abstraction where you declare data sources, transformations, and sinks, and Lakeflow manages the underlying streaming mechanics for you.

The choice between the two depends on your requirements. Use Spark Structured Streaming when you need fine grained control, custom trigger modes, or stateful operations that Lakeflow does not yet support. Use Lakeflow when you prioritize simplicity, built in error handling, automatic state management, and integration with Delta Lake's governance features like quality expectations and change data feed.

On the exam, you will see scenarios asking whether to use raw Structured Streaming or Lakeflow Pipelines for a given use case, how each handles state management and recovery, and how to monitor each approach. Understanding the trade offs and knowing when to reach for each tool is essential.


---


### Key Concepts


<details>
<summary><b>**Structured Streaming: Manual State and Checkpointing**</b></summary>

In Structured Streaming, you explicitly manage state using stateful operations like mapGroupsWithState or flatMapGroupsWithState. You define checkpoint directories and recovery behavior. Lakeflow abstracts this away; state is managed transparently and checkpoints are automatic.


</details>


<details>
<summary><b>**Trigger Modes and Execution Semantics**</b></summary>

Spark Structured Streaming supports trigger modes: default (micro batch ASAP), fixed interval, one time, and continuous. Lakeflow uses fixed interval triggers (you set the refresh rate). If you need continuous or event driven triggers, Structured Streaming is required. For standard batch processing with guaranteed once semantics, both work.


</details>


<details>
<summary><b>**Declarative vs Imperative Approach**</b></summary>

Lakeflow uses a declarative approach: you say 'what' you want (create a streaming table from Kafka, apply this transformation, land in Delta). Structured Streaming is imperative: you say 'how' to fetch, transform, and write. Declarative is simpler to maintain; imperative gives you more control.


</details>


<details>
<summary><b>**Streaming Table vs Materialized View**</b></summary>

Lakeflow streaming tables are continuously refreshed views backed by Delta, ideal for CDC and append only ingestion. Materialized views compute once and cache results. Understand when to use each in Lakeflow pipelines, and contrast with how Structured Streaming handles these scenarios.


</details>


---


### Code Examples


#### Spark Structured Streaming: readStream and writeStream


```python
from pyspark.sql.functions import col, window, count

df = spark.readStream \
    .format("kafka") \
    .option("kafka.bootstrap.servers", "localhost:9092") \
    .option("subscribe", "events") \
    .option("startingOffsets", "earliest") \
    .load()

df = df.select(
    col("timestamp"),
    col("value").cast("string").alias("event")
)

# Stateful transformation with window
agg_df = df.groupBy(
    window(col("timestamp"), "1 minute"),
    col("event")
).count()

# Write with checkpoint for recovery
agg_df.writeStream \
    .format("delta") \
    .option("checkpointLocation", "/checkpoints/events_agg") \
    .option("mergeSchema", "true") \
    .outputMode("append") \
    .start("/warehouse/events_agg")
```

With Structured Streaming, you explicitly define the checkpoint location for recovery. If the stream fails, it resumes from the checkpoint. You control trigger behavior (default micro batch), output mode (append, update, complete), and stateful operations.


#### Equivalent Lakeflow Spark Declarative Pipeline


```python
import dlt
from pyspark.sql.functions import col, window, count

@dlt.table
def events_stream():
    return spark.readStream \
        .format("cloudFiles") \
        .option("cloudFiles.format", "json") \
        .option("cloudFiles.schemaLocation", "/schema_checkpoint") \
        .load("/source/events")

@dlt.table
def events_agg():
    return dlt.read("events_stream") \
        .groupBy(
            window(col("timestamp"), "1 minute"),
            col("event")
        ).count()
```

With Lakeflow, you simply declare the source and transformations. Lakeflow manages checkpointing, state, and recovery automatically. The code is shorter and less error prone. Streaming tables are automatically backed by Delta with quality expectations support.


#### Trigger Options in Structured Streaming


```python
# Micro batch ASAP (default)
query1 = df.writeStream \
    .option("checkpointLocation", "/cp1") \
    .format("delta") \
    .start("/table1")

# Fixed interval (every 30 seconds)
query2 = df.writeStream \
    .trigger(processingTime="30 seconds") \
    .option("checkpointLocation", "/cp2") \
    .format("delta") \
    .start("/table2")

# One time (batch mode)
query3 = df.writeStream \
    .trigger(once=True) \
    .option("checkpointLocation", "/cp3") \
    .format("delta") \
    .start("/table3")

# Continuous (experimental)
query4 = df.writeStream \
    .trigger(continuous="1 second") \
    .option("checkpointLocation", "/cp4") \
    .format("delta") \
    .start("/table4")
```

Structured Streaming offers flexible trigger modes. Lakeflow defaults to fixed interval triggers with configurable refresh rate in the job config. If you need continuous or one time triggers, Structured Streaming is the better choice.


---


### Common Exam Scenarios

**Scenario 1: Real time event aggregation with CDC tracking**

You need to continuously ingest customer events from Kafka, aggregate them into hourly windows, and maintain a complete audit trail of dimension changes (e.g., customer tier upgrades). Lakeflow is the right choice because you can define streaming tables for raw events, apply APPLY CHANGES for dimension updates, and use expectations to validate quality. Structured Streaming would require you to manually manage state for both the aggregate and the slowly changing dimension.

**Scenario 2: Custom stateful processing with sessionization**

Your company wants to sessionize user behavior: group events by user into sessions separated by 30 minutes of inactivity. You need to use mapGroupsWithState to track session state across micro batches. Lakeflow does not directly expose this API, so Structured Streaming is required. You would use a Structured Streaming job and write results to Delta for downstream consumption.

**Scenario 3: Batch reconciliation with one time trigger**

You want to recompute historical aggregates one time as a batch job, triggered manually from a Lakeflow Job. Use Structured Streaming with trigger(once=True) to ensure it processes all pending data in the stream and stops. This is faster and more efficient than running a pure batch job, and it respects the streaming architecture.


---


### Key Takeaways

* Lakeflow Spark Declarative Pipelines simplify streaming pipelines with declarative syntax and automatic state/checkpoint management
* Spark Structured Streaming provides fine grained control over triggers, state management, and output modes for complex streaming logic
* Use Lakeflow for standard ingestion, CDC, and aggregation scenarios; use Structured Streaming for custom stateful operations and trigger modes
* Both approaches write to Delta and support checkpointing, but Lakeflow integrates with quality expectations and governance features
* Structured Streaming trigger modes include micro batch (default), fixed interval, one time (batch), and continuous (experimental)

---


### Gotchas and Tips


> [!NOTE]
> ⚠️ Checkpoint location matters: In Structured Streaming, an incorrect or missing checkpoint location causes the query to reprocess old data or fail on restart. Always set a unique, durable checkpoint path.


> [!NOTE]
> ⚠️ Output mode is critical: Using outputMode('complete') with large datasets is expensive. Use 'append' for insert only and 'update' for aggregations. Lakeflow defaults to 'append' for streaming tables.


> [!NOTE]
> ⚠️ Lakeflow state is opaque: You cannot inspect Lakeflow's internal state like you can with Structured Streaming. If you need visibility into session state or custom counters, Structured Streaming is more appropriate.


---


### Links and Resources

* **[Structured Streaming Tutorial](https://docs.databricks.com/aws/en/structured-streaming/tutorial)** — Getting started with Spark Structured Streaming on Databricks.
* **[Lakeflow Spark Declarative Pipelines](https://docs.databricks.com/aws/en/ldp/)** — Comparing declarative pipeline development vs manual Structured Streaming.
* **[Streaming with Delta Lake](https://docs.databricks.com/aws/en/structured-streaming/delta-lake)** — Using Delta Lake as a streaming source and sink.


## Pipeline Control Flow Operators


### Topic Overview

Lakeflow Jobs support control flow operators that let you build complex, dynamic workflows. Instead of always running tasks sequentially, you can branch logic based on task outcomes, loop over datasets, or dynamically generate tasks. These operators enable conditional execution, parameterized workflows, and smart retry logic without requiring custom orchestration code.

The main operators are if/else tasks for branching, for_each for looping over array parameters, and task values for passing data between tasks. When combined, they let you create self healing pipelines that skip unnecessary work or retry failed stages. Task outcomes (success, failure, skipped) drive these decisions.

On the exam, you will see questions about when to use control flow vs fixed task dependencies, how to pass parameters between tasks, and how to handle task failures elegantly. Understanding these patterns helps you design pipelines that adapt to data and runtime conditions.


---


### Key Concepts


<details>
<summary><b>**If/Else Task Branching**</b></summary>

If/else tasks conditionally execute other tasks based on a boolean condition. The condition can be a static parameter, a task outcome, or a metric from a previous task. For example, if a data quality check passes, proceed with transformation; otherwise, route to quarantine.


</details>


<details>
<summary><b>**For_Each Loop Operator**</b></summary>

For_each tasks iterate over an array parameter, creating a task instance for each element. Useful for processing multiple tenants, dates, or regions in parallel. All iterations run concurrently unless you set max parallelism.


</details>


<details>
<summary><b>**Task Values for Inter task Data Passing**</b></summary>

Tasks can set key value pairs via dbutils.jobs.taskValues.set(). Downstream tasks read them with dbutils.jobs.taskValues.get(). This enables parameterized pipelines where one task computes a value (e.g., row count) and the next task uses it (e.g., to decide if an aggregation is large enough to repartition).


</details>


<details>
<summary><b>**Task Outcomes and Conditional Logic**</b></summary>

Every task has an outcome: success, failure, or skipped. You can branch on outcome using if/else: if previous task succeeded, do X; if failed, do Y. This enables retry pipelines without manual intervention.


</details>


---


### Code Examples


#### If/Else Task Configuration in YAML


```yaml
jobs:
  etl_pipeline:
    tasks:
      - task_key: validate_data
        notebook_task:
          notebook_path: /notebooks/validate
      - task_key: route_data
        condition_task:
          left: "{{tasks.validate_data.values.quality_score}}"
          op: ">"
          right: "0.95"
        depends_on:
          - task_key: validate_data
      - task_key: process_good
        depends_on:
          - task_key: route_data
        condition: "{{tasks.route_data.state == 'SUCCESS'}}"
        notebook_task:
          notebook_path: /notebooks/process
      - task_key: quarantine_bad
        depends_on:
          - task_key: route_data
        condition: "{{tasks.route_data.state == 'FAILED'}}"
        notebook_task:
          notebook_path: /notebooks/quarantine
```

The condition_task routes to process_good if quality_score > 0.95, otherwise to quarantine_bad. Each downstream task evaluates its condition property independently.


#### Task Values: Set and Get Pattern


```python
# Task 1: compute_metrics
import pandas as pd
from pyspark.sql import functions as F

df = spark.table("my_catalog.my_schema.data")
row_count = df.count()
df_size_gb = spark.sql(f"SELECT SUM(size) / 1e9 AS size_gb FROM INFORMATION_SCHEMA.PARTITIONS WHERE table_schema = 'my_schema' AND table_name = 'data'").collect()[0][0]

dbutils.jobs.taskValues.set({"row_count": row_count, "size_gb": df_size_gb})

# Task 2: process_with_metrics
task_values = dbutils.jobs.taskValues.get(task_key="compute_metrics")
row_count = task_values["row_count"]
size_gb = task_values["size_gb"]

if row_count > 1_000_000 and size_gb > 10:
    # Use aggressive partitioning for large datasets
    spark.sql(f"ALTER TABLE my_table SET TBLPROPERTIES ('delta.dataSkippingNumIndexedCols' = '32')")
else:
    # Standard processing
    spark.sql(f"ALTER TABLE my_table SET TBLPROPERTIES ('delta.dataSkippingNumIndexedCols' = '10')")
```

Task 1 computes metrics and stores them as task values. Task 2 retrieves them and adapts processing based on data size. This pattern enables self tuning pipelines.


#### For Each Loop Configuration


```yaml
jobs:
  etl_pipeline:
    tasks:
      - task_key: process_regions
        for_each_task:
          list: "{{job.parameters.regions}}"
          variable: "region"
        notebook_task:
          notebook_path: /notebooks/process_region
          base_parameters:
            region: "{{region}}"
        new_cluster:
          spark_version: "14.3.x-scala2.12"
          node_type_id: "m6i.xlarge"
          num_workers: 2
```

If regions = ['US', 'EU', 'APAC'], Lakeflow creates three task instances automatically, one for each region. All run in parallel (unless you set max_parallelism). Each receives the region value as a parameter.


---


### Common Exam Scenarios

**Scenario 1: Multi tenant data pipeline with dynamic routing**

You have 100 customer tenants and want to process each in parallel. Use for_each to loop over the tenant list and create a task instance for each. Each tenant's data is isolated and processed independently. If one fails, others continue. This avoids hardcoding 100 separate task definitions.

**Scenario 2: Adaptive pipeline based on data quality**

A data validation task scores data quality (0-100). If score > 90, proceed to production load. If 70-90, route to a cleansing step. If < 70, quarantine and alert. Use condition_task and task values to set thresholds dynamically. Each branch knows what to do based on actual data quality, not static rules.

**Scenario 3: Cost optimization with dynamic cluster sizing**

The first task profiles data size. If > 100 GB, use large cluster for transformation. If < 100 GB, use small cluster. Store the cluster size as a task value and pass it to downstream tasks as a parameter. This optimizes cost and performance without manual intervention.


---


### Key Takeaways

* If/else tasks and condition_task enable conditional branching based on metrics or task outcomes
* For_each loops dynamically create task instances for each element in a list, enabling parallel processing of multiple tenants or date ranges
* Task values (dbutils.jobs.taskValues.set/get) pass data between tasks without external state stores
* Control flow operators reduce boilerplate: use them instead of hardcoding many similar tasks
* Combine control flow with task values for self healing pipelines that adapt to data and runtime conditions

---


### Gotchas and Tips


> [!NOTE]
> ⚠️ Condition must resolve correctly: If a condition references a task value or task state that does not exist, the task is skipped. Always test conditions with actual task outputs.


> [!NOTE]
> ⚠️ For_each creates new clusters for each iteration by default: Set resource constraints or use existing_cluster_id to reuse clusters and save cost.


> [!NOTE]
> ⚠️ Task values are strings: When you retrieve a task value, it is a string. Parse to int/float if needed. dbutils.jobs.taskValues.get() returns a dict.


---


### Links and Resources

* **[Lakeflow SDP Concepts](https://docs.databricks.com/aws/en/ldp/concepts)** — Understanding pipeline control flow, expectations, and dataset dependencies.
* **[Lakeflow Spark Declarative Pipelines](https://docs.databricks.com/aws/en/ldp/)** — Full reference for building and managing declarative data pipelines.


## Job and Environment Configuration


### Topic Overview

Job and environment configuration controls how and where your code runs. At the cluster level, you define instance types, node counts, Spark configurations, and libraries. At the job level, you set timeout, retries, and resource constraints. Lakeflow Jobs use Databricks Asset Bundles (DABs) to manage these configurations as code, making pipelines reproducible and version controlled.

Key configuration decisions include choosing between new clusters (spun up per job run), existing clusters (pre running), and serverless compute (managed by Databricks). You can also control Spark settings like shuffle partitions and broadcast threshold, manage library dependencies (PyPI packages, eggs, jars), and use init scripts for custom setup.

On the exam, you will encounter questions about cluster policies for compliance, environment variables for secrets, instance pools for cost optimization, and how configuration affects pipeline reliability and performance.


---


### Key Concepts


<details>
<summary><b>**Cluster Types: New vs Existing vs Serverless**</b></summary>

New clusters are provisioned for each job run and torn down afterward. Good for isolation but slower startup. Existing clusters are pre running and reused. Faster but shared with other jobs. Serverless compute (Databricks managed) abstracts away cluster provisioning entirely, ideal for light workloads and quick prototyping.


</details>


<details>
<summary><b>**Spark Configuration and Tuning**</b></summary>

Set spark.sql.shuffle.partitions to control parallelism during shuffles (default 200). Lower for small data, higher for large. spark.sql.broadcastTimeout sets max size for broadcast joins. spark.executor.memory and spark.driver.memory control memory allocation. These are task level configs in databricks.yml.


</details>


<details>
<summary><b>**Library Management and Init Scripts**</b></summary>

Use pip to install Python packages, reference jars for JVM libraries, and egg files for custom Python code. Init scripts (bash scripts executed on cluster startup) enable custom environment setup: installing system dependencies, setting env vars, configuring credentials.


</details>


<details>
<summary><b>**Cluster Policies and Instance Pools**</b></summary>

Cluster policies enforce governance: only certain node types or DBU limits allowed. Instance pools pre warm compute for faster startup. These optimize cost and comply with organizational constraints without sacrificing developer flexibility.


</details>


---


### Code Examples


#### Databricks Asset Bundle Configuration (databricks.yml)


```yaml
resources:
  jobs:
    etl_job:
      name: Daily ETL Pipeline
      tasks:
        - task_key: transform_data
          notebook_task:
            notebook_path: /notebooks/transform
          new_cluster:
            spark_version: "14.3.x-scala2.12"
            node_type_id: "m6i.xlarge"
            num_workers: 4
            spark_conf:
              spark.sql.shuffle.partitions: "512"
              spark.sql.broadcastTimeout: "300"
              spark.executor.memory: "8g"
            libraries:
              - pypi:
                  package: "pydantic==2.0.0"
              - pypi:
                  package: "requests==2.31.0"
            init_scripts:
              - destination: dbfs:/init_scripts/setup.sh
          timeout_seconds: 3600
          max_retries: 2
```

This DAB defines a job with a new cluster, Spark configs, PyPI libraries, and an init script. The timeout and max_retries provide reliability controls.


#### Cluster Policy JSON


```json
{
  "spark_conf": {
    "spark.sql.shuffle.partitions": {
      "value": "512",
      "hidden": false
    },
    "spark.executor.memory": {
      "value": "8g",
      "hidden": true
    }
  },
  "node_type_id": {
    "type": "allowed_values",
    "values": ["m6i.xlarge", "m6i.2xlarge", "r6i.xlarge"]
  },
  "num_workers": {
    "type": "range",
    "minValue": 1,
    "maxValue": 16
  },
  "aws_attributes.availability": {
    "value": "ON_DEMAND",
    "hidden": false
  }
}
```

This policy restricts node types, sets min/max workers, and enforces on demand instances. Developers can provision clusters within these guardrails.


#### Using Environment Variables and Init Scripts


```bash
# Init script (setup.sh) stored in dbfs:/init_scripts/setup.sh
#!/bin/bash
export DATABRICKS_TOKEN=$DATABRICKS_TOKEN
export API_KEY=$API_KEY

# Install system package
apt get install -y postgresql client

# Configure Spark with environment specific settings
echo "spark.driver.extraJavaOptions=-Dlog4j.configuration=file:///etc/spark/conf/log4j.properties" >> /etc/spark/conf/spark-defaults.conf

# Task in notebook accesses env vars
import os
api_key = os.environ.get("API_KEY")
token = os.environ.get("DATABRICKS_TOKEN")

# Set env var in DAB task
spark_conf:
  ENVIRONMENT: production
  LOG_LEVEL: INFO
```

Init scripts run at cluster startup to install dependencies and set environment. Task level spark_conf makes variables available to Spark.


---


### Common Exam Scenarios

**Scenario 1: Compliance driven cluster policy**

Your organization requires all clusters to use on demand instances for cost tracking and no more than 16 workers. Create a cluster policy that enforces these constraints. Developers provision clusters through the policy; any attempt to use spot instances or scale beyond 16 workers is rejected. This ensures governance without micromanaging individual job configs.

**Scenario 2: Environment specific configuration**

Your DAB targets both dev and prod. In dev, use small clusters (2 workers); in prod, use large clusters (8 workers). Use Databricks CLI targets to apply different configs per environment. Store API keys in environment variables set by init scripts so they are not hardcoded.

**Scenario 3: Serverless compute for fast feedback**

For a lightweight data quality check job that runs every hour, use serverless compute instead of provisioning a cluster. No warm up time, automatic scaling, and pay only for what you use. Ideal for short, bursty workloads.


---


### Key Takeaways

* New clusters provide isolation and custom config but slower startup. Existing clusters are faster but shared. Serverless is fastest for light workloads with no provisioning overhead.
* Databricks Asset Bundles (DABs) define job config as code in databricks.yml, making pipelines reproducible and version controlled
* Spark configs (shuffle.partitions, broadcastTimeout, executor.memory) tune performance. Set based on data size and cluster resources.
* Cluster policies enforce governance: restrict node types, DBU limits, and instance pools while keeping developers flexible
* Init scripts and environment variables manage secrets, install dependencies, and configure clusters without hardcoding in notebooks

---


### Gotchas and Tips


> [!NOTE]
> ⚠️ Spark config scope matters: spark_conf at the task level overrides job level. Be careful with defaults to avoid surprises.


> [!NOTE]
> ⚠️ Init scripts run as root: Be careful with permissions when setting environment variables. Log init script execution for debugging.


> [!NOTE]
> ⚠️ Library installation time adds to startup: Heavy libraries can add minutes. Use instance pools to pre warm clusters if startup latency matters.


---


### Links and Resources

* **[Lakeflow Jobs](https://docs.databricks.com/aws/en/jobs/)** — Configuring job clusters, task dependencies, and environment settings.
* **[Databricks Asset Bundles](https://docs.databricks.com/aws/en/dev-tools/bundles)** — Defining job and environment configurations declaratively in YAML.


## Unit and Integration Testing


### Topic Overview

Testing data pipelines is critical to catch bugs early and ensure data quality. Databricks provides frameworks for unit testing (testing individual functions) and integration testing (testing full pipeline behavior). Key testing utilities include assertDataFrameEqual for comparing DataFrames, assertSchemaEqual for schema validation, and the DataFrame.transform method for functional composition.

You can test Lakeflow pipelines locally using the Lakeflow test framework, mock Spark sessions to avoid cluster dependencies, and use pytest to organize test suites. The nutter framework provides a lightweight alternative for notebook based testing. A good testing strategy catches data quality issues, transformation bugs, and edge cases before code reaches production.

On the exam, you will see questions about unit vs integration testing, how to mock Spark for testing, using assertDataFrameEqual to validate transformations, and best practices for testing data pipelines in a CI/CD workflow.


---


### Key Concepts


<details>
<summary><b>**assertDataFrameEqual and assertSchemaEqual**</b></summary>

assertDataFrameEqual compares two DataFrames for equality, checking both data and schema. assertSchemaEqual validates only the schema (column names, types). These utilities from pyspark.testing are essential for transformation unit tests.


</details>


<details>
<summary><b>**DataFrame.transform Method for Composable Logic**</b></summary>

DataFrame.transform allows chaining transformations in a functional style. Define pure functions that take a DataFrame and return a DataFrame, then compose them. This makes testing easier because you can test each transformation function independently.


</details>


<details>
<summary><b>**Mocking Spark Sessions for Local Testing**</b></summary>

Use SparkSession.builder().master('local').config(...).getOrCreate() to create a local Spark session for testing. This avoids cluster dependencies. For testing functions that use dbutils or Databricks specific APIs, use unittest.mock to patch those methods.


</details>


<details>
<summary><b>**Lakeflow and Nutter Testing Frameworks**</b></summary>

Lakeflow includes test runners for Lakeflow pipelines defined in Python. Nutter is a lightweight notebook testing framework that runs test cells and reports results. Both simplify testing compared to writing pytest suites for every transformation.


</details>


---


### Code Examples


#### Unit Testing with assertDataFrameEqual and pytest


```python
# test_transformations.py
import pytest
from pyspark.sql import SparkSession
from pyspark.sql.functions import col, when
from pyspark.testing import assertDataFrameEqual, assertSchemaEqual

@pytest.fixture(scope="session")
def spark():
    """Create a local Spark session for testing."""
    return SparkSession.builder \
        .master("local") \
        .appName("test") \
        .getOrCreate()

def test_filter_active_users(spark):
    """Test that inactive users are filtered out."""
    input_df = spark.createDataFrame([
        (1, "Alice", True),
        (2, "Bob", False),
        (3, "Charlie", True)
    ], ["id", "name", "active"])
    
    expected = spark.createDataFrame([
        (1, "Alice", True),
        (3, "Charlie", True)
    ], ["id", "name", "active"])
    
    result = input_df.filter(col("active") == True)
    
    assertDataFrameEqual(result, expected)

def test_user_status_schema(spark):
    """Test that the schema matches expected structure."""
    df = spark.createDataFrame([
        (1, "active"),
        (2, "inactive")
    ], ["user_id", "status"])
    
    expected_schema = "user_id INT, status STRING"
    assertSchemaEqual(df, expected_schema)
```

This pytest suite tests filtering logic and schema validation using local Spark. Run with pytest test_transformations.py to execute tests without a Databricks cluster.


#### Composable Transformations with DataFrame.transform


```python
from pyspark.sql.functions import col, when, lower

def filter_by_status(df, status="active"):
    """Pure function: filter by status."""
    return df.filter(col("status") == status)

def normalize_names(df):
    """Pure function: normalize names to lowercase."""
    return df.withColumn("name", lower(col("name")))

def add_user_type(df):
    """Pure function: add user type based on activity."""
    return df.withColumn(
        "user_type",
        when(col("activity_count") > 100, "power_user").otherwise("regular")
    )

# Compose transformations using DataFrame.transform
result = (df
    .transform(filter_by_status, status="active")
    .transform(normalize_names)
    .transform(add_user_type)
)

# Each function can be tested independently
def test_normalize_names():
    input_df = spark.createDataFrame([("Alice",), ("BOB",)], ["name"])
    expected = spark.createDataFrame([("alice",), ("bob",)], ["name"])
    result = normalize_names(input_df)
    assertDataFrameEqual(result, expected)
```

Using DataFrame.transform enables function composition and makes each transformation testable in isolation. Pure functions without side effects are easier to test and reason about.


#### Mocking dbutils and Integration Testing


```python
from unittest.mock import patch, MagicMock
import pytest

def write_to_delta(df, table_name):
    """Function that depends on dbutils (Databricks specific)."""
    df.write.format("delta").mode("overwrite").saveAsTable(table_name)
    dbutils.notebook.run("/notebooks/notify", timeout_seconds=30)

def test_write_to_delta_with_mock(spark):
    """Test by mocking dbutils."""
    test_df = spark.createDataFrame([(1, "test")], ["id", "name"])
    
    with patch("builtins.__import__") as mock_import:
        # Mock dbutils to avoid cluster dependency
        mock_dbutils = MagicMock()
        mock_import.return_value = mock_dbutils
        
        # Call function (in real scenario, dbutils is available)
        # For test, we just verify the DataFrame operations work
        assert test_df.count() == 1

# Integration test: test full pipeline
def test_full_pipeline_integration(spark):
    """Test the entire transformation pipeline with realistic data."""
    # Create realistic test data
    source_data = spark.createDataFrame([
        (1, "Alice", "active", 150),
        (2, "Bob", "inactive", 20),
        (3, "Charlie", "active", 80)
    ], ["id", "name", "status", "activity_count"])
    
    # Apply full pipeline
    result = (source_data
        .transform(filter_by_status, status="active")
        .transform(normalize_names)
        .transform(add_user_type)
    )
    
    # Verify result
    assert result.count() == 2
    result.show()
    # In real test, use assertDataFrameEqual to compare with expected output
```

Mocking dbutils allows testing Databricks specific code without a cluster. Integration tests run the full pipeline with realistic data to catch end to end bugs.


---


### Common Exam Scenarios

**Scenario 1: Testing a multi stage transformation pipeline**

You have a pipeline that filters, aggregates, and enriches customer data. Use DataFrame.transform to break it into testable functions. Write unit tests for each function using pytest and assertDataFrameEqual. Then write an integration test that runs all stages together with realistic test data. This catches bugs in transformations and interactions between stages.

**Scenario 2: Testing Lakeflow pipeline locally**

You have a Lakeflow pipeline with quality expectations. Use the Lakeflow test framework to run the pipeline in a test environment without spinning up a real cluster. Validate that expectations pass and the output matches the expected schema and row count. This gives fast feedback during development.

**Scenario 3: Testing code that depends on Databricks APIs**

Your transformation calls dbutils or uses Databricks specific features. Mock those dependencies using unittest.mock so tests run locally without a Databricks cluster. Test the core logic independently, then run integration tests on Databricks to verify the mocked parts work correctly with real APIs.


---


### Key Takeaways

* Use assertDataFrameEqual and assertSchemaEqual to validate DataFrame transformations in unit tests
* DataFrame.transform enables composable, testable transformations. Write pure functions that take and return DataFrames.
* Create local Spark sessions with SparkSession.builder().master('local') for fast testing without cluster overhead
* Mock Databricks specific APIs (dbutils, notebook.run) using unittest.mock to test code locally
* Combine unit tests (individual functions) with integration tests (full pipeline) to catch transformation and interaction bugs

---


### Gotchas and Tips


> [!NOTE]
> ⚠️ Local Spark is single threaded by default: Use .master('local[*]') to enable parallelism in tests, matching cluster behavior


> [!NOTE]
> ⚠️ assertDataFrameEqual is strict about order: DataFrames must have rows in the same order. If order doesn't matter, sort both before comparing or set checkRowOrder=False


> [!NOTE]
> ⚠️ Mock sparingly: Mocking too much makes tests brittle. Mock only Databricks specific APIs; test core Spark logic against a real local Spark session


---


### Links and Resources

* **[Databricks Notebooks](https://docs.databricks.com/aws/en/notebooks/)** — Using notebooks for interactive development, testing, and debugging.
* **[CI/CD with Databricks](https://docs.databricks.com/aws/en/dev-tools/ci-cd/)** — Setting up automated testing and integration workflows.
