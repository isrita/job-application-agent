## 1. dbt (Data Build Tool)

### A. dbt Testing (Data Quality)

- **Generic / Built-in Tests:** Defined in YAML (`schema.yml`). 4 default tests:
    1. `unique` (no duplicate values)
    2. `not_null` (no null values)
    3. `accepted_values` (checks allowed list, e.g., `values: ['F', 'C', 'P']`)
    4. `relationships` (referential integrity / foreign keys)
- **Singular Tests:** Custom SQL queries in the `/tests` folder. If the query returns **0 rows**, the test passes; if it returns ≥1≥1 rows, it fails.
- **Packages:** Mention `dbt-expectations` (inspired by Great Expectations) for statistical checks.
- **Command:** `dbt test --select tag:daily`

### B. Materializations & Incremental Strategies

- **Materializations:** `view`, `table`, `incremental`, `ephemeral`.
- **Incremental Models (`is_incremental()` macro):** Only processes new/modified records rather than rebuilding the entire table:
    
    {{ config(materialized='incremental', unique_key='flight_id', incremental_strategy='merge') }}
    
    select * from {{ ref('stg_flights') }}
    
    {% if is_incremental() %}
    
      where updated_at > (select max(updated_at) from {{ this }})
    
    {% endif %}
    
- **Incremental Strategies:**
    - `merge` (default in Databricks/Snowflake): Performs an `UPSERT` matching on `unique_key`.
    - `append`: Pure insert of new records without updating existing ones.
    - `delete+insert`: Deletes matching keys and re-inserts.

### C. Sources, Macros, and Selectors

- **Sources (`source('source_name', 'table_name')`):** Declare raw data tables in YAML. Enables `dbt source freshness` to alert on stale data.
- **Macros:** Reusable Jinja functions (like code templates) in the `/macros` folder (e.g., date transformations, custom surrogate keys).
- **Selectors:** Advanced execution syntax (e.g., `dbt run --select +model_name+` runs the model plus its upstream and downstream dependencies).

### D. Tagging Strategies

- **Purpose:** Group models and tests for selective execution, CI/CD, and orchestration.
- **Common Strategies:**
    1. **By Schedule / Frequency:** `hourly`, `daily`, `monthly` →→ `dbt run --select tag:daily`.
    2. **By Medallion Layer:** `bronze`, `silver`, `gold` or `staging`, `intermediate`, `marts`.
    3. **By Domain / Department:** `aviation`, `claims`, `commercial`, `finance`.
    4. **By Tier / SLA:** `tier_1_critical` (run every 15 min with strict alerts), `tier_2`.

---

## 2. SQL (Senior Level)

### A. Window Functions (Must Know)

- **Ranking:**
    - `ROW_NUMBER()`: Unique sequential integer (1, 2, 3, 4). Used for **deduplication**.
    - `RANK()`: Skips ranks on ties (1, 2, 2, 4).
    - `DENSE_RANK()`: Does not skip ranks on ties (1, 2, 2, 3).
- **Offset:** `LEAD(col, 1)` (next row value), `LAG(col, 1)` (previous row value).
- **Aggregations over window:** `SUM(amount) OVER (PARTITION BY client_id ORDER BY tx_date ROWS BETWEEN UNBOUNDED PRECEDING AND CURRENT ROW)` (running total).

### B. Deduplication Pattern (Classic Interview Question)


WITH ranked AS (

    SELECT *,

           ROW_NUMBER() OVER (PARTITION BY entity_id ORDER BY updated_at DESC) AS rn

    FROM silver_table

)

SELECT * EXCEPT (rn) FROM ranked WHERE rn = 1;

---

## 3. Python & Object-Oriented Programming (OOP)

### A. Classes & Methods

- **Instance Method:** Takes `self` as the first argument, modifies instance state.
- **Class Method (`@classmethod`):** Takes `cls` as first argument. Used for factory constructors:
    
    python
    
    @classmethod
    
    def from_config(cls, cfg: dict):
    
        return cls(cfg["host"], cfg["port"])
    
- **Static Method (`@staticmethod`):** Independent utility method inside a class. Takes neither `self` nor `cls`.
- **Abstract Class (`ABC` & `@abstractmethod`):** Enforces child classes to implement specific methods:
    
    python
    
    from abc import ABC, abstractmethod
    
    class BaseETL(ABC):
    
        @abstractmethod
    
        def extract(self): pass
    

### B. Decorators

- A function that takes another function, extends its behavior without modifying it, and returns it.
- **Interview Example (Timing / Logging):**
    
    python
    
    import time
    
    from functools import wraps
    
    def log_runtime(func):
    
        @wraps(func)
    
        def wrapper(*args, **kwargs):
    
            t0 = time.time()
    
            result = func(*args, **kwargs)
    
            print(f"{func.__name__} executed in {time.time() - t0:.2f}s")
    
            return result
    
        return wrapper
    

### C. Unit Testing & Mocking

- **Framework:** `pytest` or `unittest`.
- **Mocking (`unittest.mock.patch`, `MagicMock`):** Isolates unit tests from external dependencies (databases, APIs, Azure Blob Storage):
    
    python
    
    from unittest.mock import patch, MagicMock
    
    @patch("requests.get")
    
    def test_fetch_data(mock_get):
    
        mock_get.return_value.status_code = 200
    
        mock_get.return_value.json.return_value = {"status": "success"}
    
        # Assert expected vs actual:
    
        assert my_function() == {"status": "success"}
    

---

## 4. Databricks & Modern Lakehouse Architecture

### A. Unity Catalog (Governance & Modern Architecture)

- **3-Level Namespace:** `catalog.schema.table_or_view` (e.g., `prod_aviation.silver.s_flight`).
- **Key Features:**
    - **Centralized Data Governance:** Single permission model across multiple workspaces.
    - **Data Lineage:** Automated column-level and table-level lineage.
    - **Volumes:** Governance for non-tabular data (images, PDFs, CSV landing files).
    - **External Locations & Storage Credentials:** Access Azure storage without hardcoding access keys or secrets.

### B. Delta Lake Performance Optimizations

- **Liquid Clustering (`CLUSTER BY`):** Replaces legacy partitioning and Z-Ordering. Flat layout, self-tuning, handles high/low cardinality, eliminates small-file problems.
- **Z-Ordering (`OPTIMIZE ... ZORDER BY`):** Co-locates multi-dimensional data into files using space-filling curves for high data skipping.
- **VACUUM:** Permanently deletes physical Parquet files no longer referenced by the transaction log older than retention period (default 7 days).

---

## 5. Terraform (Infrastructure as Code for Databricks & Azure)

### A. Core Concepts

- **Commands:** `terraform init` (download providers), `plan` (preview changes), `apply` (provision infrastructure), `destroy`.
- **State (`terraform.tfstate`):** Tracks current deployed state vs desired code state.
    - **Best Practice:** Use a **Remote Backend** in Azure Blob Storage with state locking (via Azure Blob lease) to prevent concurrent applies.

### B. Terraform with Databricks

- Uses the official `databricks` provider.
- **Common Resources managed:**
    - `databricks_cluster` / `databricks_cluster_policy`
    - `databricks_job` (Workflows)
    - `databricks_catalog`, `databricks_schema` (Unity Catalog objects)
    - `databricks_secret_scope` / `databricks_secret`
- **Key Benefit:** Standardized environment replication across `dev`, `qas`, and `prod` using Terraform workspaces or modular variables.

---

## 6. Azure & CI/CD Pipelines

### A. Azure Stack for Data Engineering

- **ADLS Gen2:** Hierarchical namespace object storage (Bronze, Silver, Gold data lake).
- **Azure Data Factory (ADF):** Orchestrator for data movement and triggering Databricks Jobs via REST API.
- **Azure Key Vault:** Centralized secret management (tokens, database passwords) accessed via Databricks Secret Scopes.
- **Microsoft Entra ID (Azure AD) & Service Principals:** Token-less identity authentication for automated pipelines.

### B. CI/CD Pipeline (Azure DevOps / GitHub Actions)

1. **Pull Request (PR) Validation:**
    - Linting: `sqlfluff` (SQL) + `flake8` / `black` / `ruff` (Python).
    - Unit tests with mocking (`pytest`).
    - Slim CI for dbt: `dbt build --select state:modified+` (only tests modified models using deferral).
2. **CD (Automated Deployment):**
    - Merge to `main` →→ triggers Terraform plan/apply to deploy Databricks assets.
    - Promotes dbt artifacts and updates orchestrator jobs across environments (`dev` →→ `uat` →→ `prod`).

---

### How to use this in your interview:

- When asked a conceptual question, give the **30-second definition first**, mention a **production trade-off**, and end with a **concrete real-world example** (e.g., _"In my pipelines, we used dbt incremental models with a merge strategy on Databricks Unity Catalog tables, orchestrated via Azure DevOps CI/CD"_).