## SQL CORE CONCEPTS

### 1. **SELECT, WHERE, ORDER BY, GROUP BY, HAVING**

- `SELECT` defines the projection; `WHERE` filters rows before grouping.
- `GROUP BY` aggregates data; `HAVING` filters results after aggregation.
- `ORDER BY` controls result ordering, crucial for pagination or ranking logic.
- `LIKE` supports **pattern matching**, often used in filtering textual data.
- `ELSE ... END` completes a `CASE WHEN` expression, enabling **row-level conditional logic** for grouping, labeling, or transformation.
- `IN` checks **membership in a defined set**, useful for filtering or classification within a column.
### 2. **JOINS: INNER, LEFT, RIGHT, FULL, CROSS**

- Joins are used to combine data across multiple tables based on a related column.
- **INNER JOIN** returns matching records.
- **LEFT JOIN** includes all records from the left table and matched records from the right.
- **RIGHT JOIN** is the inverse of LEFT JOIN.
- **FULL OUTER JOIN** returns all matched and unmatched records from both sides.
- **CROSS JOIN** produces the **Cartesian product** of two tables—used in scenarios like matrix comparison or when joining on all combinations deliberately.
### 3. **WINDOW FUNCTIONS: ROW_NUMBER, RANK, DENSE RANK**

Window functions let me perform calculations across a set of rows that are related to the current row—without collapsing the result like `GROUP BY` does

| Escenario                                       | Función        | Razón                                       |
| ----------------------------------------------- | -------------- | ------------------------------------------- |
| IDs únicos, paginación                          | `row_number()` | Garantiza secuencia sin empates             |
| Rankings deportivos (Olympics)                  | `rank()`       | Empates comparten posición, siguiente salta |
| Top N con empates inclusivos                    | `dense_rank()` | Empates no afectan conteo siguiente         |

- **row_number**: work with orderBy column and create a ranking without the duplicates.
- **dense_rank**: order a column but for the same values repeat the ranking and for the next register use the next number of the ranking doesnt import if repeat de value
- **rank**:  order a column but for the same values repeat the ranking and for the next register in the ranking use the number of the register that keep going 
### 4. **SUBQUERIES vs CTEs (Common Table Expressions)**

- **Subqueries** are nested queries embedded inside `SELECT`, `FROM`, or `WHERE` clauses. They can be:
    - **Scalar** (returning a single value),
    - **Correlated** (depending on outer query), or
    - **Derived tables** (inline views).
- Subqueries are often used for **filtering**, **ranking**, or **aggregation** within hierarchical logic chains.
- **CTEs** (`WITH`) define a **temporary named result set**, improving **readability**, **reusability**, and **modular design**.
- CTEs are similar to subqueries but act as **logical variables**; ideal for **recursive queries** or **multi-step transformations**.
- Both CTEs and subqueries follow a structured pattern:
    - `SELECT → FROM → WHERE → GROUP BY → ORDER BY`
- Use **`DISTINCT()`** for deduplication within either approach.
### 5. **AGGREGATE FUNCTIONS: COUNT, SUM, AVG, MAX, MIN**

- **Aggregation** reduces multiple rows into **summary-level insights**—critical for KPIs, dashboards, and reports.
- **Partitioning** enables **windowed aggregations**, **splitting** data without collapsing rows, using `SUM() OVER (PARTITION BY ...)` for cumulative stats or rankings.
- In **Spark SQL**, aggregation functions run on a **distributed engine**, offering **scalable performance** on large datasets.
- You can write **pure SQL queries** in Spark, integrating with **advanced features** like:\n - `MERGE` / **UPSERT** (Delta Lake),\n - **User-Defined Functions (UDFs)**,\n - `CREATE OR REPLACE FUNCTION` for **modular logic and reusable expressions**
- **Dynamic Data Masking**, using conditional functions (e.g., `CASE WHEN is_account_group_member('admin') THEN p_user_id ELSE '******' END`) to **enforce role-based visibility** at query time.
- **Column Masking** via `ALTER TABLE ... ALTER COLUMN ... SET MASK` for runtime data obfuscation
- **Row-Level Security (RLS)** through Boolean-mapped functions (`CREATE FUNCTION ... RETURNS BOOLEAN`) applied with `SET ROW FILTER ON`, enforcing fine-grained access
- **Delta Lake DML operations** (`UPDATE`, `DELETE`, `MERGE`) and **Time Travel** features (`RESTORE TO VERSION`) to manage versioned data with ACID guarantees.


### 6. **INDEXES & PERFORMANCE**

- Indexes enhance **query efficiency** by accelerating data lookup, especially in large tables.
- Essential for optimizing `WHERE`, `JOIN`, and `ORDER BY` clauses by reducing full table scans.
- Use **execution plans** to identify which indexes are being used and detect bottlenecks.
- Avoid **over-indexing**, which can negatively impact `INSERT`, `UPDATE`, and `DELETE` performance.
- Maintain index health with strategies like **index rebuilds**, **statistics updates**, and **query plan analysis**.
- Choosing optimal **data types** improves both **storage efficiency** and **query performance**, especially for partition and join keys.
- Enforce **data integrity** and performance constraints using:
    - `PRIMARY KEY`, `FOREIGN KEY`, `UNIQUE`, `NOT NULL`, `CHECK`
- Be aware of **implicit data type conversions**, which can cause performance issues in joins, filters, and aggregations.
- For analytical workloads, use **clustered indexes** or **Z-Ordering** (in Delta Lake) to optimize **read-heavy queries**.
## PYTHON CORE CONCEPTS

### 1. **Variables and Data Types (lists, tuples, dictionaries, sets, RDD, Dataframe, Dataset)**

- **Lists** and **tuples** represent ordered sequences; lists are mutable, tuples are immutable—useful for iteration and fixed groupings.
 - **Dictionaries** store key-value mappings; ideal for structured, fast-access lookups.
- **Sets** represent unordered, non-duplicated elements—optimal for membership checks and deduplication tasks.
- Mutable types (like lists or dictionaries) can be changed in place.  
- Immutable types (like strings or tuples) can’t be altered after creation
- In **PySpark**:
    - **RDDs** (Resilient Distributed Datasets) are the **foundational structure**, supporting low-level distributed transformations (e.g., `map`, `filter`) but lack schema and optimization layers.
    - **DataFrames** build upon RDDs with a **schema-aware, tabular abstraction**, supporting SQL-like operations and runtime optimizations via **Catalyst (query planner)** and **Tungsten (execution engine)**—ideal for large-scale ETL pipelines and analytics.
    - **Datasets** (Scala/Java only) offer the benefits of DataFrames with **compile-time type safety**, preferred when combining strong typing with Spark performance.

### 2. **Control Flow:** `**if**`**,** `**for**`**,** `**while**`**,** `**break**`**,** `**continue**`

- `if`, `elif`, `else` enable branching decisions based on logic or data evaluation.
- `for` and `while` loops allow iteration over sequences or conditions, with `break` and `continue` providing early exits and loop control.
- These structures are essential for building **dynamic, reactive, and rule-based flows** in data pipelines.
- Python handles **memory management** automatically through **reference counting** and a **garbage collector**, ensuring efficient use of resources.
- For concurrency:
    - **Multithreading** enables concurrent tasks within the same memory space, but is constrained by the **Global Interpreter Lock (GIL)**.
    - **Multiprocessing** runs independent processes with separate memory, allowing **true parallelism** for CPU-bound tasks.
- **Decorators** are higher-order functions that wrap and modify behavior of other functions, commonly used for **logging**, **access control**, and **performance monitoring**—without altering the original logic.
### 3. **Functions and Parameters (**`***args**`**,** `****kwargs**`**) pyspark and pandas**

- Functions encapsulate **reusable logic**, enhancing modularity, readability, and maintainability in data workflows.
Python supports flexible definitions via:
- `*args`: for dynamic positional arguments.
- `**kwargs`: for dynamic keyword arguments, ideal for configuration-driven pipelines.
In **PySpark**
- Functions are central to `withColumn`, `selectExpr`, and DataFrame chaining.
- **UDFs** **(User-Defined Functions)** enable custom transformations within distributed Spark jobs.
    - **Standard UDFs** are slower and break Catalyst optimizations.
    - Prefer **built-in Spark functions** or **Pandas UDFs (vectorized)** for better performance on large datasets.
In **Pandas**:
- Functions are applied via `.apply()` or `.map()` and are more performant on **small to mid-size datasets**.
- While convenient for smaller datasets, these are **single-threaded** and not distributed—careful profiling is needed for performance.
Well-structured functions are key to **production-ready code**, enabling testability, reusability, and CI/CD integration. 
### 4. **Error Handling:** `**try**`**,** `**except**`**,** `**finally**`**,** `**else**`

- `try` block wraps code that might raise an exception; `except` catches and handles it gracefully.
- `finally` ensures **resource cleanup** regardless of success or failure—commonly used for closing files, releasing memory, or stopping sessions.
- `else` runs only if no exception occurs, allowing clear separation of normal and failure logic.
- **Retry logic** using custom loops, decorators, or libraries like `tenacity` is key for handling temporary I/O failures, flaky APIs, or unstable services.
- Logging exceptions with `traceback` and capturing error context supports **debugging and observability** in distributed environments.
- Python’s structured handling integrates well with orchestrators and enables the development of **fail-safe ETL processes**.
### 5. **List Comprehensions and Lambda Expressions**

- **List comprehensions** simplify iteration, filtering, and element-wise operations, reducing the need for verbose `for` loops.
- Ideal for **data wrangling**, **ETL steps**, or **feature engineering** where intermediate lists are derived from existing datasets.
- **Lambda expressions** define **anonymous functions** inline—commonly used with `map()`, `filter()`, `reduce()`, or `sorted()` for fast, stateless transformations.
- Frequently applied in **Pandas pipelines**, `.apply()` calls, or temporary logic for **PySpark UDF alternatives**.
- Promote functional programming patterns—useful in **high-order functions**, **callback handlers**, and **declarative processing flows**.
- While powerful for quick logic injection, complex lambda chains should be replaced with **named functions** for maintainability, unit testing, and traceability.
### 6. **Module Imports and Project Structure**

- - Code modularity is enforced through **Python modules, packages**, and **clean directory structures** (e.g., `src/`, `configs/`, `tests/`).
- Projects should separate **business logic**, **configuration**, and **unit tests** to support scalability and maintainability.
- In **Databricks and PySpark**, I frequently import `pyspark`, `delta`, and `databricks.sql` to enable **distributed processing**, **Delta Lake** interactions, and **SQL-level orchestration**.
- For **data storage and access**, I use `sqlalchemy`, `pyodbc`, `boto3`, and `azure-storage-blob` to interface with cloud systems like SQL Server, S3, and ADLS Gen2.
- For **streaming architectures**, libraries like `kafka-python`, `pyspark.streaming`, and `confluent-kafka` are essential for building real-time ingestion pipelines.
- In **orchestration and CI/CD**, I use `airflow`, `databricks-cli`, and `terraform` to schedule jobs, manage clusters, and automate infrastructure provisioning.
- In **ML and experimentation pipelines**, I rely on `mlflow`, `scikit-learn`, `xgboost`, and `pandas` for model development and lifecycle management.
- For **data validation and quality checks**, I use `great_expectations`, `pytest`, and `pandas-profiling` to ensure trust in the data pipeline.
- In **transformations and parsing**, `numpy`, `re`, and `json` are foundational.
- For **Generative AI and LLM integration**, I use libraries like `openai`, `transformers`, or `langchain` for tasks involving embeddings, completions, and RAG pipelines.
- Structure and imports are designed for **reusability, testability, and cloud portability**, aligning with best practices in production-grade engineering.
## Object Oriented Programming CORE CONCEPTS

### 1. **Classes and Objects**

In **procedural programming**, logic is organized into functions that operate on data—great for **simple, linear tasks**.
In contrast, **object-oriented programming (OOP)** structures code around **objects**, which combine both **data (attributes)** and **behavior (methods)**. This approach promotes **modularity, reuse**, and **scalability**—essential for **complex systems** and **large-scale applications**.
- A **class** is a reusable **blueprint** that defines how objects are structured. It declares the attributes and methods that its instances will have.
- An **object** is a **concrete instance** of a class. It stores **state (via attributes)** and **behavior (via methods)**.
- In Python, **objects are created dynamically** and memory is allocated **only upon instantiation**.
- The **class** defines structure; the **object** holds actual data and functionality—this is the foundation of **encapsulation** in OOP.
### 2. The four core pillars of OOP are **encapsulation**, **abstraction**, **inheritance**, and **polymorphism**.

Object-Oriented Programming (OOP) is built on four fundamental principles that make code more **modular**, **reusable**, and **maintainable**—ideal for building **scalable systems**.

**Encapsulation** means grouping related data and methods into a class and restricting access to the internal details—this protects the state of an object.
**Abstraction** is about simplifying complexity—so we only expose what's necessary and hide the implementation. It helps reduce noise and makes the code easier to maintain.
**Inheritance** lets a class reuse code from another class, which promotes code reuse and consistency.
**polymorphism** allows different classes to implement the same interface or method in their own way—this gives us flexibility and scalability when dealing with different types of objects.
### 3. **Magic Methods (**`**__init__**`**,** `**__str__**`**, etc.)**

Python’s **magic methods** customize how objects interact with **built-in functions** and **operators**.

- `__init__`: Constructor — runs on object creation.
- `__str__` / `__repr__`: String representation for `print()` and debugging.
- `__eq__`, `__lt__`, `__add__`: Enable **operator overloading**.

These hooks allow for **clean syntax**, better **integration with Python internals**, and **custom object behavior**.
### 4. **SOLID Principles** _(Advanced Design Foundation)

**SOLID principles** are foundational design guidelines in object-oriented programming that help create software systems that are:

- **S - Single Responsibility Principle**: A class should have one and only one reason to change.
- **O - Open/Closed Principle**: Classes should be open for extension but closed for modification.
- **L - Liskov Substitution Principle**: Subclasses should be substitutable for their base classes.
- **I - Interface Segregation Principle**: Prefer small, specific interfaces over large, general-purpose ones.
- **D - Dependency Inversion Principle**: High-level modules should not depend on low-level modules; both should depend on abstractions.

These principles are critical for writing scalable, testable, robust, reusable and maintainable object-oriented systems.

## DATABRICKS CORE CONCEPTS

### 1. **Workspace Architecture**

Databricks **architecture** is key to designing **secure, scalable**, and **governed Lakehouse solutions**.
- **Control Plane**: Manages the Databricks interface, jobs, notebooks, permissions, and metadata. It is fully managed by Databricks and does not interact directly with user data.
- **Compute Plane**: Executes Spark workloads within the customer’s Azure subscription, providing secure access to data in **Azure Data Lake Storage Gen2 (ADLS Gen2)**.
- **Databricks File System (DBFS)**: Abstraction layer over cloud storage, enabling seamless file operations for Spark jobs.
- **JDBC Connectivity**: Allows integration with external RDBMS (e.g., SQL Server, Oracle) for data ingestion and analytics.
- **Pipelines and Workflows**: Orchestrate **notebooks, Delta Live Tables**, and **tasks** into production pipelines. Supports dependencies, retries, and parameters — ideal for ETL/ELT workflows and modular design.
- **Monitoring and Logging**: Built-in tools like **job run history**, **cluster metrics**, and integration with **Azure Monitor** or **logging endpoints** allow teams to track performance, detect bottlenecks, and ensure SLAs.
- **Machine Learning Tools**: Native support for ML lifecycle with **MLflow**, enabling **experiment tracking**, **model registry**, and **deployment pipelines**. Compatible with popular frameworks (scikit-learn, XGBoost, TensorFlow).

1. Escribes query en PySpark/SQL ↓ 
2. CATALYST analiza y optimiza el plan lógico ↓ 
3. CATALYST genera plan físico optimizado ↓ 
4. PHOTON/TUNGSTEN ejecuta el plan (C++ vectorizado en Databricks / JVM en Spark OSS) ↓ 
5. AQE ajusta dinámicamente durante ejecución (cambia joins, balancea partitions, etc.) ↓ 
6. Resultado optimizado

### 2. **Apache Spark and DataFrames**

Apache Spark is the **distributed execution engine** at the core of Databricks, designed for **parallel, large-scale processing** and efficient data pipeline execution.

- **Managed Spark Clusters**: Auto-scalable, distributed clusters optimized with the **Photon Engine** (vectorized C++ execution), supporting both **batch and streaming workloads**.
- **DataFrame API**: High-level, tabular abstraction in PySpark that enables **expressive and optimized transformations**. Backed by the **Catalyst Optimizer** and **Tungsten Engine** for efficient execution planning and memory management.+

**Spark Cluster in Databricks** is a fully managed distributed environment used to **run big data workloads in parallel** across multiple nodes. It supports **scalable, high-performance processing** through features like **Photon**, **Delta Lake optimizations**, **Z-Ordering**, **Auto Optimize**, and **Adaptive Query Execution (AQE)**.

### 3. **Delta Lake**

The **Lakehouse architecture** combines the **scalability of data lakes** with the **performance and reliability** of data warehouses, powered by **Delta Lake** in Databricks.
- Brings **ACID transactions**, **schema enforcement**, and **time travel** to data lakes, enabling **governed, high-performance analytics** on large-scale, low-cost storage.
- **Managed Delta Table:**  
	Databricks **controls both the metadata and data location**. When you create or drop the table, it **automatically stores and deletes the data** in the default storage path (usually defined in Unity Catalog).
- **External Delta Table:**  
	You **define the data location manually** using the `LOCATION` keyword. Dropping the table **removes only the metadata**, not the underlying files—data stays intact unless manually deleted.
- **Versioning & Time Travel**: Query previous snapshots using `VERSION AS OF` or `TIMESTAMP AS OF`.
- **Schema Evolution**: Dynamically adapts to schema changes during ingestion with `mergeSchema`.
- **Performance Tools**:
    - `OPTIMIZE`: Compacts small files for faster reads.
    - `ZORDER BY`: Sorts data for **accelerated filtering and pruning**.
    - `VACUUM`: Deletes obsolete files, reducing storage cost.
    - `REORG TABLE`: Rewrites physical files for layout improvements.
- **Tombstoning & Deletion Vectors**: Tracks logically deleted files for consistent reads and efficient cleanup.
### 4. **Delta Live Tables (DLT)**

**DLT** is a **declarative framework** to build **streaming and batch ETL pipelines** using **SQL or Python**, optimized for **cloud**, **AI workflows**, and **real-time ingestion**.
- Automates: **Data quality rules (EXPECTATIONS)**, **schema evolution**, **CDC**, **lineage tracking**, and **pipeline orchestration**.
- Supports the **Medallion Architecture** (Bronze → Silver → Gold) with native **streaming and batch** handling.
- Enables **append-only pipelines** with **idempotency**—avoiding file duplication.
- Uses `writeStream` + `checkpointLocation` for **fault-tolerant**, **exactly-once delivery**.
- Streaming capabilities:
    - `writeStream`: Outputs real-time data to Delta, Kafka, or ADLS.
    - `checkpointLocation`: Ensures fault tolerance and exactly-once semantics.
You can **add a column** like `processing_status` to track state:
- Retry logic can be applied using filters:  
    `WHERE processing_status = 'FAILED'` → send to retry queue or reprocess in next run.
- Ideal for **AI/ML pipelines**, **IoT ingestion**, **telecom events**, or any **event-driven system**.
### 5. **Unity Catalog**

**Unity Catalog** is Databricks' unified **governance layer** for **access control**, **metadata**, and **lineage** across all workspaces.
- Integrated with **Azure AD (Entra ID)**
- Enables **fine-grained RBAC**, **audit logs**, and **data discovery**
- Supports **lineage**, **schema enforcement**, and **multi-workspace security**
- Hierarchical model:
    - `Metastore > Catalog > Schema > Table / View / Function`
- **Metastore**: Top-level container (1 per region)
- **Catalog**: Domain grouping (e.g., marketing, finance)
- **Schema**: Organizes objects (tables, views)
- **Table/View**: Governed assets with RBAC and lineage
- Deployment modes:
    - **With Storage (Managed Tables)**
    - Databricks controls **data + metadata**
    - Enables `CREATE TABLE`, **Delta features**, **lineage**, **soft deletes**
    - Requires **Resource Access Connector** with **Storage Blob Data Contributor**
	- **Without Storage (External Tables)**
    - Metadata only; data via `LOCATION`
    - No write ops, no lineage — **read-only cataloging**
**Deep Clone** copies both the **metadata and the data files**, creating a **fully independent table**—ideal for backups or sandboxing without affecting the source.
**Shallow Clone** copies only the **metadata**, referencing the original data files—great for fast duplication with minimal storage, but changes to the data in source may reflect unless overwritten.
### 6. **Jobs and Workflows and Magic Commands**

- Orchestrate **notebooks, scripts, and SQL tasks** with dependency management and scheduling.
- **dbutils** utilities:
    - `dbutils.widgets`: Enable parameterization for dynamic executions.
    - `dbutils.secrets`: Securely retrieve credentials from secret scopes.
    - File system utilities for workflow integration and runtime configuration.

- **Magic commands**
- `%run`: Import and run external notebooks — enables **modular ETL**, **code reuse**, and **task chaining**.
- `%fs`: File system access for **DBFS**, **ADLS**, or **mounts**.
- `%sql`, `%md`: Run SQL directly or render Markdown in cells.
### 7. **Performance Optimization**

- **DataFrames**: Recommended for programmatic, large-scale transformations.
- **Views** in Databricks are **saved SQL queries** stored in the metastore; they persist across sessions and can be reused or shared.  
- **Materialized View** stores precomputed results physically—used for **faster query performance** on static data.
- **Temporary Views**: Useful for intermediate SQL querying in hybrid pipelines.
- **Auto Loader**: Enables scalable, incremental file ingestion using metadata logs.
- **Volumes (Unity Catalog)**: Managed storage for unstructured and non-tabular assets (e.g., JSON, images).
- **Lazy Evaluation**: Streaming actions initiate processing only when a terminal operation like `writeStream` is triggered.
- **Trigger(processingTime)**: Defines frequency of micro-batch processing for time-window aggregations.
## AZURE CORE CONCEPTS
### 1. **Azure resources**
- **App Service**: Host web apps and REST APIs with autoscaling and CI/CD support.
- **Azure Container Registry (ACR)**: Store and manage Docker images for deployment into Azure services (e.g., App Service, AKS).
- **Managed Identity**: Provides **secure, password-less authentication** to Azure services using **RBAC**, eliminating the need for storing secrets.
- **Azure Functions**: Serverless compute to run code on demand—ideal for event-driven ETL tasks or automation triggers.
- **Azure Storage**:
    - **ADLS Gen2**: Hierarchical namespace + POSIX ACLs; optimized for **big data analytics**, streaming ingestion, and **Spark-based processing**.
    - **Blob Storage**: Flat object store for **unstructured data** like logs, backups, media files—cost-effective and highly scalable.
### 2. **Azure Data Factory (ADF)**

- **Dataset**: Metadata definition of a data source (table, file, etc.) used by activities within a pipeline.
- **Data Flow**: Visual interface for building **code-free transformations** that run on **Spark clusters**, enabling scalable ETL operations.
- **If Condition**: Control activity for conditional branching based on boolean expressions.
- **ForEach**: Iterates over a collection, enabling **parallel execution** via the **Batch Count** property.
- **Triggers**: Initiate pipelines based on schedules, tumbling windows, or **event-based triggers** (e.g., file creation in ADLS).
- **Set Variable Activity**: Enables dynamic logic by assigning values to **pipeline-scoped variables** at runtime.
- **Storage Event Trigger**: Reacts to file-level events in Azure Storage to enable **real-time data ingestion** workflows.
- **Execute Pipeline Activity**: Invokes child pipelines from a parent pipeline to promote **modular, maintainable workflows**.
- **Parallel Copy Optimization**: Use **Copy Activity’s degree of copy parallelism** to boost performance when transferring large datasets.
- Copy Data, Data Flow, Databricks Notebook, Stored Procedure, Azure Function, HDInsight Hive, HDInsight Pig, HDInsight Spark, HDInsight MapReduce, ForEach, If Condition, Switch, Wait, Until, Execute Pipeline, Lookup, Get Metadata, Validation, Web Activity, Webhook, Azure Batch, Custom Activity, Set Variable, Append Variable, Script, Delete, Filter, Fail
### 3. **Azure Databricks Integration**

Azure Databricks integrates natively with Azure services for **secure, scalable, and orchestrated data pipelines**.

- **Linked Services (ADF)**: Establish secure connections between **Azure Databricks**, **ADLS Gen2**, **Blob Storage**, and **SQL DBs** for **notebook execution**, **parameter passing**, and **pipeline orchestration**.
- **Azure Databricks Service**: Fully managed **Spark-based analytics platform** deployed within your Azure subscription, supporting **autoscaling**, **VNet injection**, and **enterprise-grade security**.
- **Access Connector for Azure Databricks**: Managed identity that enables **RBAC-based access** to **ADLS Gen2** without exposing credentials—required for **Unity Catalog managed tables**.
### 4. **Azure Synapse Analytics**

**Azure Synapse** is a unified platform for **enterprise data warehousing** and **big data analytics** at scale.
- Supports both **on-demand (serverless)** and **provisioned SQL pools** for flexible cost/performance trade-offs.
- Native integration with **Spark**, **T-SQL**, and **Power BI** enables **end-to-end analytics**, from raw ingestion to dashboarding.
- Connects with **ADLS Gen2**, **Synapse Pipelines**, and **Azure ML** for advanced **data science** and **ETL workflows**.
- Ideal for **batch analytics**, **exploratory queries**, and **BI workloads** with built-in **security, RBAC**, and **monitoring**.
### 5. **Azure Monitor & Log Analytics**

Azure's built-in **observability stack** for **monitoring**, **troubleshooting**, and **performance optimization**.
- **Azure Monitor**: Tracks **metrics**, **logs**, and **health status** across all Azure resources, including data pipelines and compute services.
- **Log Analytics**: Query and correlate logs from **Databricks**, **ADF**, **Functions**, and **storage** to diagnose failures and latency.
- Integrates with **Databricks job logs**, **Spark UI**, and **alert rules** for real-time **incident detection** and **automated responses**.
- Supports **dashboards**, **custom alerts**, and **resource-level insights** for proactive operations and SLA enforcement.
### 6. **Identity & Access Management (IAM)**

Azure’s security model ensures **controlled, role-based access** to data and compute resources across the platform.
- Built on **Azure Active Directory (Azure AD)** for unified identity management.
- Use **Service Principals** or **Managed Identities** for secure, passwordless authentication in pipelines and services.
- Assign roles like **Storage Blob Data Contributor** using **Role-Based Access Control (RBAC)** to enforce **least privilege**.
- Access **ADLS Gen2** securely via `dbutils.fs.mount()` or **Spark configs** (`spark.hadoop.fs.azure.account.key` or OAuth-based access).
- Required for integrating with **Unity Catalog**, **Access Connectors**, and **secure data ingestion flows**.
### 7. **Networking & Security**

Ensure secure and isolated **data access** across Azure using **network-level controls**.
- Use **Virtual Networks (VNets)**, **Private Endpoints**, and **Network Security Groups (NSGs)** to **restrict public exposure** and enforce **internal-only access** to services like **Databricks**, **ADLS**, and **SQL**.
- Configure **firewalls**, **route tables**, and **service tags** to control traffic flow and protect perimeter access.
- ⚙️ Key considerations:
    - **Latency-sensitive design** for distributed pipelines
    - **High availability** with zone-redundant services
    - **Resilience and failover** strategies for critical workloads
- Essential for compliance, especially in **regulated environments** (e.g., finance, healthcare).

## BIG DATA CORE CONCEPTS

### 1. **What is Big Data?**
**Big Data** refers to datasets that are **too large, fast, or diverse** to be processed using traditional systems.
- Defined by the **5 Vs**:
    - **Volume** (scale of data)
    - **Velocity** (speed of generation/processing)
    - **Variety** (structured, semi-structured, unstructured)
    - **Veracity** (data quality and trust)
    - **Value** (insights derived from data)
- Requires **distributed storage**, **parallel processing**, and **scalable architectures** (e.g., Hadoop, Spark, Databricks).
- **CAP Theorem**: In distributed systems, you can only guarantee **two out of three**:
- **Consistency**, **Availability**, **Partition Tolerance**  
        Most big data platforms favor **availability and partition tolerance**, trading off strict consistency.
### 2. **Batch vs Streaming Processing**

- **Batch Processing**:  
    Processes large volumes of **historical data** at scheduled intervals. Ideal for **ETL pipelines**, **reporting**, and **data warehousing** using tools like **Azure Data Factory**, **Databricks notebooks**, or **SQL-based transformations**.
- **Streaming Processing**:  
    Handles data **in real time** as it arrives. Enables **low-latency use cases** like **fraud detection**, **monitoring**, or **live dashboards**. Commonly implemented using **Structured Streaming**, **Delta Live Tables**, or **Event Hub → Databricks pipelines**.
- **LangChain Context**:  
    Streaming outputs or batched analytics (e.g., logs, embeddings) can feed **LLM pipelines** in **LangChain**, enabling **real-time conversational AI** over fresh or processed data sources.
### 3. **MapReduce, Spark, and Parallelism**

- **MapReduce**:  
    Legacy big data model (Hadoop) that processes data in two steps—`map()` and `reduce()`—executed across a cluster. Disk-heavy and slower due to lack of in-memory processing.
- **Apache Spark**:  
    Modern **in-memory distributed engine** used in platforms like **Databricks**. Supports high-performance processing with:
    - **RDDs**: Low-level resilient distributed datasets.
    - **DataFrames**: Optimized, schema-aware API for batch/streaming.
    - **Structured Streaming**: Real-time processing with micro-batching.
    - **MLlib**: Scalable machine learning library.
- **Parallelism**:  
    Achieved through **data partitioning**, **task scheduling**, and **distributed execution** across worker nodes and executors. Enables massive scalability for both **batch and streaming** pipelines.
### 4. **Data Lake vs Data Warehouse**

- **Data Lake**:  
    Stores **raw data** in all formats (structured, semi-structured, unstructured). Built on **object storage** (e.g., **ADLS Gen2**, **S3**), it's highly **scalable**, **cost-effective**, and ideal for **big data ingestion** and **AI/ML pipelines**.
- **Data Warehouse**:  
    Stores **cleaned, structured data** optimized for **analytical queries** and **BI dashboards**. Backed by engines like **Synapse**, **Snowflake**, or **BigQuery**, it offers **high performance** with **SQL**-based access.
- **Delta Lake / Lakehouse Architecture**:  
    Combines the **flexibility of Data Lakes** with the **reliability of Warehouses**:
    - Adds **ACID transactions**, **schema enforcement**, **time travel**, and **governance** to data lakes.
    - Enables **streaming + batch** processing, **incremental updates**, and **unified data modeling**.
    - Core component in **Databricks**, powering the **Bronze → Silver → Gold** pipeline model.
### 5. **Partitioning and Sharding**

- **Partitioning**:  
    Divides data **logically** within a table or dataset—commonly by **date**, **region**, or **customer_id**—to enable **predicate pushdown**, **parallel reads**, and efficient **query pruning** (e.g., in **Delta Lake**, **Spark**, **Synapse**).
- **Sharding**:  
    Splits data **physically** across multiple **storage nodes** or **database instances**, distributing load to improve **scalability**, **availability**, and **fault tolerance** (used in distributed systems like **Cosmos DB**, **MongoDB**, or **Cassandra**).
- Both improve **read/write performance** and are critical for large-scale datasets.
### 6. **Incremental Load & Data Governance**

- **Full Load**: Reloads the entire dataset each time. Simple, but inefficient for large volumes or frequent updates.
- **Incremental Load**: Ingests only **new or changed records** using **timestamps**, **watermarks**, or **CDC (Change Data Capture)**—commonly used in tools like **Databricks**, **ADF**, or **Delta Lake** (`MERGE INTO`).
- Enables faster pipelines, reduced compute cost, and better scalability.
- **Data Governance**:  
    Involves **lineage tracking**, **metadata management**, **RBAC**, and **data quality rules**.  
    Platforms like **Unity Catalog**, **Apache Atlas**, and **Azure Purview** provide governance over **access, usage, and lifecycle**.  
    Critical for ensuring **compliance**, **auditability**, and **trust** in enterprise data workflows.
### 7. **ACID Transactions in Big Data**

- ACID ensures **reliable and consistent data operations** in distributed systems.
- **Atomicity** means all operations in a transaction succeed or none at all — no partial updates.  
- **Consistency** ensures the database stays valid before and after a transaction by enforcing rules.  
- **Isolation** keeps transactions from interfering with each other — each runs as if it's alone.  
- **Durability** guarantees committed changes are saved permanently, even after a system crash.
- Enables **MERGE**, **UPDATE**, **DELETE**, and **schema evolution** in large datasets with transactional guarantees.
### 8. **Slowly Changing Dimensions (SCD)**

SCDs define how dimensional attributes handle changes over time in data warehousing. They determine whether history is kept, overwritten, or partially tracked. Common in Kimball models, ETL/ELT pipelines, Delta Lake, ADF, SSIS, and Fabric.

**SCD Type 0 — Fixed Dimension**  
No changes allowed; the original value is never updated. Example: date of birth.

**SCD Type 1 — Overwrite**  
The old value is overwritten with the new one; no history is retained. Example: correcting a misspelled name.

**SCD Type 2 — Full History**  
Each change creates a new record, preserving complete history. Uses validity fields such as `Start_Date`, `End_Date`, and `Is_Current`.

**SCD Type 3 — Partial History**  
Stores only the immediately previous value in an additional column. Does not maintain full historical versions. Example: `Previous_City`.

**SCD Type 4 — History Table**  
The main table stores only the current record, while historical changes are saved in a separate history table.

**SCD Type 6 — Hybrid (1 + 2 + 3)**  
Combines overwrite (Type 1), full historical versioning (Type 2), and partial history columns (Type 3). Supports faster reporting while preserving full change history.
## ARQUITECTURES

## 1. **Incremental Load**  

This architecture implements an **incremental ingestion strategy** using **Azure Data Factory** and **Databricks** over **ADLS Gen2**, following a **Bronze–Silver–Gold (Medallion)** pattern:
- **Ingestion Layer**:
    - Data is pulled from **SQL sources** (or GitHub) via **ADF pipelines**, incrementally loading only **new or modified records**.
    - Techniques like **timestamps**, **watermarks**, or Delta Lake `MERGE` logic ensure minimal overhead. with a store procedure
- **Transformation Layer (Databricks)**:
    - Data flows from **Raw (Bronze)** to **Transformed (Silver)**, and finally to **Serving (Gold)**, improving quality and structure at each step.
    - Files are stored in **Parquet** or **Delta format**, enabling scalable analytics.
- **Checkpointing**:
    - `checkpointLocation` ensures **exactly-once delivery** and **fault tolerance** in **Structured Streaming** jobs—storing metadata like **offsets, schema, and progress** for recovery and tracking.
- **Data Models**:
    - Bronze = raw, partitioned parquet
    - Silver = one big cleaned table
    - Gold = **Star schema** for BI tools like **Power BI**
- **Security**:
    - Managed with **Azure Active Directory**, **Key Vault**, and **RBAC** for secure access to all components.
    ![[Pasted image 20250519152615.png]]
"Watermark pattern: two Lookups—one reads last processed timestamp from control table, second gets current max from source. Copy Data filters with dynamic content `WHERE ModifiedDate > @{activity('LookupOld').output.firstRow.WatermarkValue}`. Update control table on success. Reduced processing time 40%."
## 2. **Container & API-Based Ingestion Pipeline with Azure Lakehouse**
This architecture demonstrates a **cloud-native data ingestion and transformation pipeline**, built to support **semi-structured/unstructured data migration** from containerized environments and REST APIs into a **governed Delta Lakehouse** on Azure.
**1. Ingestion Layer**
- Sources include:
    - Files uploaded via **FastAPI**, deployed on **Azure App Service** (Linux Plan).
    - REST endpoints from **Dockerized apps**, published through **Azure API Management**.
    - **Azure Blob Storage** for semi-structured/raw files.
- Ingestion flows into **ADLS Gen2** using the FastAPI interface and blob triggers.
- **Managed Identity** ensures secure, passwordless access to storage and services.

**2. Data Lakehouse in Databricks**
- The pipeline follows the **Medallion Architecture**:
    - **Bronze**: Raw ingestion layer; all files stored as-is for traceability.
    - **Silver**: Data is filtered, normalized, and enriched using PySpark notebooks.
    - **Gold**: Final business-level datasets modeled as **Star Schema**, ready for reporting.
- **Delta Lake** adds ACID transactions, time travel, schema enforcement, and log tracking.
- **Access Connector for Azure Databricks** is configured to enable **managed tables** and secure interaction with ADLS Gen2.

**3. Orchestration and Quality**
- Data quality checks are embedded at every stage.
- Unity Catalog provides centralized **RBAC**, **lineage**, and **governance** across environments.
- Delta Logs track every transformation for **audits** and **debugging**.

**4. Deployment and DevOps**

- The FastAPI app is **Dockerized** and published to **Azure Container Registry**.
- The image is deployed via **Azure Web App (Linux)**, simulating production-grade API ingestion.
- Infrastructure includes:
    - **Storage accounts** for raw and processed zones.
    - **Azure Databricks Workspace** for processing.
    - **App Service Plan** and **Managed Identity** for secure deployment.

**5. Reporting**
- Processed Gold data is connected to **Power BI**, enabling self-service dashboards with real-time insights.
- Full visibility of data lifecycle is ensured with **Delta Logs + Power BI refresh logic**.
![[Pasted image 20250519152636.png]]
## 3. **Real-Time Streaming with Delta Live Tables (DLT)**
This architecture implements a **streaming-first Lakehouse solution** using **Apache Spark Structured Streaming** and **Delta Live Tables (DLT)** for **real-time processing**, **data quality enforcement**, and **automated orchestration**.

**1. Streaming Ingestion Sources**
- Data flows from **GitHub**, **ADF**, or file drops (e.g., landing zones) into **ADLS Gen2**.
- **Databricks Structured Streaming** ingests and processes incremental events using DLT pipelines.

**2. Delta Live Tables Pipeline**
- **Bronze (Raw)**: Incremental data ingested and versioned using Delta.
    - Includes data arrival time, schema version, and CDC support.
- **Silver (Transformed)**: Data is cleaned, deduplicated, and normalized.
    - Applied transformations use DLT with **expectations** for data quality validation.
- **Gold (Serving)**: Final **Star Schema** models generated for business reporting.
- All layers reside in **Delta Lake tables**, supporting **time travel**, **schema evolution**, and **optimized storage** via **Z-Ordering**, **Auto Optimize**, and **Vacuum**.

**3. Governance & Monitoring**
- **DLT** automates **lineage tracking**, **monitoring**, and **pipeline scheduling**.
- Security is managed with **Azure AD**, **Managed Identity**, and **Key Vault**.
- **checkpointLocation** ensures exactly-once semantics and failure recovery.

**4. Output & Consumption**
- Final datasets are pushed to **Azure Synapse** for advanced analytics and warehousing.
- **Power BI** consumes Gold layer data directly for near real-time dashboards.
    ![[Pasted image 20250519153039.png]]
## 4. **Change Data Capture (CDC) with LogMiner + Azure Databricks**
This architecture implements a **real-time change data ingestion pipeline** using **Oracle LogMiner** to track **inserts, updates, and deletes**, and delivers those changes into a **Delta Lakehouse** using **Azure Event Hubs** and **Databricks Structured Streaming**.

**1. CDC Source (Oracle Database)**
- Oracle database uses **LogMiner** to extract transactional changes from **redo/archived logs**.
- Events include **INSERT**, **UPDATE**, and **DELETE** statements at the row level.
**2. CDC Publishers**
- Tools like **StreamSets**, publish changes from LogMiner to **Azure Event Hub**.
- Events are serialized as JSON/Avro and include metadata such as timestamp, operation type, and row before/after state.
**3. CDC Staging (Event Hubs)**
- **Azure Event Hub** serves as a scalable buffer for high-throughput CDC events.
- Ensures decoupling between source systems and the processing layer.
**4. CDC Consumer (Azure Databricks)**
- **Apache Spark Structured Streaming** reads events from Event Hub in micro-batches.
- **CDC logic** is implemented in Databricks to handle:
    - **MERGE INTO** operations for upserts
    - **Soft deletes** using flags or deletion vectors
    - **Watermarking and deduplication** to avoid reprocessing
**5. Operational Data Store (Delta Lake)**
- Final output is written to **Delta Tables in ADLS Gen2**, with full support for:
    - **ACID compliance**
    - **Schema enforcement and evolution**
    - **Time travel and audit logs**
    ![[Pasted image 20250519160633.png]]
## 5. Auto Loader Architecture
**Auto Loader** is a **scalable, incremental ingestion mechanism** in Databricks that automatically detects new files in **cloud storage** (e.g., **ADLS Gen2** or **S3**).
- It leverages a **metadata log** to track processed files, avoiding duplication and improving reliability in **streaming data pipelines**.
- Works with **Structured Streaming** and supports **schema evolution**, enabling dynamic handling of changing data structures.
- Ingested data is written directly to **Delta Tables**, combining the benefits of **ACID transactions**, **versioning**, and **streaming upserts**.
- Uses **lazy evaluation**: the pipeline is only triggered upon an action (e.g., `writeStream`).
- The `trigger(processingTime)` setting allows defining how frequently the stream polls for new files—ideal for **time-based aggregations** using **window functions**.
- Common use cases: **real-time ETL**, **landing zones**, **IoT ingestion**, or replacing traditional batch ingestion patterns with near-real-time delivery.
![[Pasted image 20250519161522.png]]
## 6. CI/CD Automation with Azure DevOps and GitHub Actions
- Implements **Continuous Integration and Continuous Deployment** pipelines for **data workflows**, **notebooks**, and **infrastructure-as-code (IaC)**.
- Developers push code to **Azure Repos Git** using a **branching strategy** (`feature`, `develop`, `master`), managed via **Pull Requests (PRs)** for version control and code review.
- Upon code check-in, the **Build Pipeline** triggers automatically:
    - Validates notebooks and code via **automated tests**.
    - Packages artifacts (e.g., Python scripts, notebooks, configs).
    - Publishes artifacts to a centralized pipeline repository.
- A **Release Pipeline** deploys the artifacts to environments such as **Azure App Service**, after optional **manual approval**
- Ensures **traceable deployments**, **rollback capabilities**, and **audit-friendly workflows**.
- When using **GitHub Actions**, similar CI/CD stages are defined using YAML and GitHub-hosted runners, allowing cross-platform automation and integration with Databricks CLI, Terraform, or Docker.
- This setup accelerates delivery, improves **governance**, and supports **production-grade data platform management**.
![[Pasted image 20250519163403.png]]
## 7. Microsoft Fabric Experience
This solution enables **real-time sensor monitoring** using **IoT devices** (SP32 with Arduino), Azure’s cloud-native services, and **Power BI dashboards** for live reporting.
**1. Edge Device (SP32 + Arduino)**
- SP32 is connected to sensors (e.g., temperature, humidity, pH).
- Coded in **Arduino IDE** to:
    - Capture sensor data
    - Serialize readings (e.g., JSON)
    - Send via **Wi-Fi** to the cloud every **60 seconds**
**2. Ingestion Layer**
- Data flows into **Azure IoT Central** or directly into **Azure Event Hub**.
- Handles high-throughput, time-stamped event ingestion from multiple devices.
**3. Processing Layer**
- **Azure Functions** are triggered on new events:
    - Parse incoming payloads
    - Perform lightweight transformations or filtering
    - Route data to storage and analytics services
**4. Storage & Analytics**
- Data is stored in **Azure Cosmos DB** for flexible, scalable document storage.
- In parallel, it’s pushed to **Azure Synapse Analytics** for advanced querying, aggregation, and batch analytics.
**5. Visualization**
- Final data is connected to **Power BI** dashboards for real-time reporting.
- Dashboards update every minute, visualizing trends and anomalies.
**6. Security & DevOps**
- **Azure Key Vault** stores sensitive credentials and connection strings securely.
- **Azure DevOps** is used for version control, CI/CD automation, and code deployments.
![[Pasted image 20250519163850.png]]
## 8. **Neural Network Evaluation Architecture for ML Models**

**Empresa:** SAUNA CLINIC salud)  
**Objetivo:** Desarrollar un sistema de IA para clasificar **6 tipos de cardiac arrhythmias** basándose en datos de electrocardiogramas (ECG)  
**Dataset:** 10,000 pacientes con 57 características extraídas de señales ECG  
**Clases:**

1. Normal (ritmo sinusal normal)
2. Fibrilación auricular
3. Taquicardia ventricular
4. Bradicardia
5. Extrasístoles ventriculares
6. Bloqueo cardíaco

**Desafío crítico:** El modelo debe ser **confiable** y **generalizable** porque errores de clasificación pueden tener consecuencias fatales para los pacientes.

This architecture focuses on building, training, and evaluating **deep neural networks** with an emphasis on **model generalization**, **complexity control**, and **data-driven evaluation strategie**. We use **TensorFlow to create multiple neural network models and evaluate them using **training**, **cross-validation**, and **test sets**, focusing on **classification accuracy**, **regularization tuning**, and **bias-variance analysis**

**1. Data Preparation**
- Dataset split into **training (60%)**, **cross-validation (20%)**, and **test (20%)** sets using `train_test_split`.
- Data is visualized to analyze cluster separation and identify ambiguous regions.
**2. Neural Network Models (Keras Sequential API)**
- **Complex Model**: 3 layers → 120 units → 40 units → 6 units (linear output).
- **Simple Model**: 2 layers → 6 units → 6 units (linear output).
- **Regularized Model**: Same as complex model but with **L2 regularization** on hidden layers using `kernel_regularizer`.
**3. Training & Optimization**
- All models compiled with:
    - `SparseCategoricalCrossentropy(from_logits=True)`
    - `Adam(learning_rate=0.01)`
- Epochs = 1000 to ensure convergence.
- Output predictions computed using `tf.nn.softmax + np.argmax`.
**4. Evaluation Metrics**
- **Classification error** is calculated as the percentage of misclassified samples.
- Comparison between models highlights:
    - Overfitting in complex models
    - Underfitting in simple models
    - Balanced performance with regularized models

![[Pasted image 20250519172514.png]]

## 9. AI Sales Agent for a University (Tool-Enabled LLM Architecture)

**Cliente:** UCAL - Universidad privada en Lima, Perú  
**Desafío:** Reciben **15,000+ consultas mensuales** vía WhatsApp, web chat, y redes sociales sobre programas académicos. Solo 30% se convierten en citas con asesores.

Automate the sales and admissions process by deploying a **conversational AI agent** capable of engaging leads, answering questions, retrieving real-time pricing, booking appointments, and escalating complex cases. The agent must understand **context**, use **external tools**, and access both **structured and unstructured data**—providing an intelligent, self-service experience.
### 1. **Multi-Tool Orchestration**
Built using frameworks **LangChain Agents**, the LLM acts as a **decision-making core**, interpreting the user’s message and invoking the correct **Tool** (function/API) based on intent. Tools are dynamically selected via prompt + reasoning chain:
#### Example Toolset:
- `get_pricing_tool`: Calls an external **REST API** with parameters like program, location, and scholarship to fetch the real-time price.
- `query_crm_tool`: Uses lead ID/email to **read or update CRM data** (e.g., campaign, stage).
- `book_appointment_tool`: Interacts with the university’s calendar API (e.g., Outlook or Bookings) to set an appointment.
- `send_followup_tool`: Sends a WhatsApp/email message via Twilio or CRM integration if the user disengages.
- `escalation_tool`: Outputs a **structured JSON** for human agents when the AI cannot resolve intent confidently.
> **LLM Role**: The LLM interprets natural language, decides which tool to call, formats the inputs, parses the outputs, and determines what to say next—**not hardcoded** but learned.
### 2. **Memory & Context Awareness**
The AI agent needs to remember what the user said earlier—especially across long conversations. This is achieved by:

- **Short-Term Memory**: `ConversationBufferMemory` stores the recent chat in plaintext.
- **Long-Term Memory**: `VectorStoreRetrieverMemory` stores past turns as **embeddings**. When a user returns later, the system retrieves semantically similar interactions to restore context.
This allows the agent to say: “Ah, I see you were asking about the psychology program last time—would you like to continue?”
### 3. **Knowledge Source Embeddings (RAG Logic)**
When the user asks things the LLM wasn’t trained on (e.g., “¿Cuál es la duración del MBA?”), the model **cannot answer accurately** from its base knowledge. This is where **Retrieval-Augmented Generation (RAG)** steps in.
#### How It Works:
1. Raw documents (PDFs, brochures, web pages) are **split into chunks** (e.g., 512 tokens) using a text splitter.
2. Each chunk is **vectorized** using an embedding model (OpenAI, Azure, HuggingFace).
3. Vectors + metadata are stored in **FAISS, Chroma, or Pinecone**.
4. On query, the agent searches the vector index using cosine similarity to **retrieve top-k chunks**.
5. These chunks are passed to the LLM via prompt (“Here’s what the docs say about that…”).
RAG = combining retrieval with generation. It **grounds the LLM** in enterprise truth, prevents hallucination, and keeps answers up to date.
### 4. **Vector Cache for High-Frequency Queries**
For repetitive queries like “¿Cuánto cuesta ingeniería?”, the system embeds the question and looks for a **nearby vector** in a **response cache**.
#### Logic:
- If **similarity > threshold**, return cached response (instant).
- Else, **call the API**, return answer, and optionally **store a new embedding-response pair** in the cache.
This prevents unnecessary API calls and ensures faster response times.
### 5. **Fallback & Escalation Strategy**

If the agent:
- Fails to match a tool,
- Cannot retrieve accurate content from the vectorstore,
- Or receives an ambiguous or unsupported request...

Then it invokes a **final fallback tool**. This JSON is sent to the CRM or inbox for **human review**, ensuring no lead is lost even if the AI fails.
## Technical Concepts Explained

**Rags: are vectors that provide context for queries. Have a window of context, "how many words support" Separate words and perform a vector relation search.

The information is separated into vectors, which is related to my query, and the pieces can be from different chunks and everything is modified in the database.

| Concept         | Description                                                                 |
| --------------- | --------------------------------------------------------------------------- |
| **LLM**         | Large Language Model (e.g., GPT-4) understands, reasons, and generates text |
| **RAG**         | Retrieval-Augmented Generation. Combines embeddings + search + LLM response |
| **Chunking**    | Splitting documents into semantic units for vector storage & retrieval      |
| **Embeddings**  | Numeric vector representations of text used for similarity search           |
| **VectorStore** | A database optimized for nearest neighbor search (FAISS, Chroma)            |
| **Agent**       | LLM-based controller that routes to tools based on reasoning                |
| **Tool**        | A callable function the agent can use (API, DB, calendar, CRM, etc.)        |
| **Fallback**    | Final recovery strategy when no confident result is available               |
| **Wrapper**     | component that **defines the input and output schema** of a tool            |
## Deployment with Azure & Databricks

| Layer                 | Technology Used                             |
| --------------------- | ------------------------------------------- |
| Orchestration         | LangChain Agent + Databricks Notebooks      |
| Embedding / Chunking  | PySpark + HuggingFace / OpenAI              |
| Vector DB             | FAISS / Chroma on ADLS                      |
| LLM Backend           | Azure OpenAI (ChatGPT)                      |
| CRM / API Integration | FastAPI connectors, secured with OAuth      |
| CI/CD                 | Azure DevOps Pipelines                      |
| Logging & Monitoring  | Azure Monitor + Delta Logs + Prompt History |


This was an **end-to-end solution** deployed in production, reducing human workload in the admissions process by **over 80%**, cutting **response time from 3 hours to under 30 seconds**, and increasing lead conversion by **26%** within the first month. The architecture is **modular, explainable, and enterprise-grade**, capable of scaling across departments and programs. The project represents a successful application of GenAI for real business transformation.

---

## 10. **FABRIC - Unified SaaS Platform Architecture**

Arquitectura centralizada con **OneLake** eliminando duplicación de datos y permitiendo acceso concurrente:

- **Storage Layer (OneLake)**:
    - Datos almacenados **una sola vez** en formato **Delta Lake** con logs transaccionales en Parquet.
    - Versionado automático y linaje completo mediante Delta logs.
    - Redundancia configurable: **LRS** (local), **GRS** (geo-replicado), **GZRS** (geo-zona redundante).
- **Hybrid Access Layer**:
    - **Lake Warehouse**: Combina data lake + warehouse relacional en una entidad.
    - **SQL Analytics Endpoint**: Consultas SQL estándar sobre Delta/Parquet.
    - **KQL Database**: Motor para streaming con sintaxis SQL-like optimizada para series temporales.
- **Security**:
    - Autenticación **Microsoft Entra ID** + **RBAC** granular por workspace/lakehouse/warehouse.

 **Three-Method Data Ingestion Architecture**

Implementé **tres patrones de ingesta** según latencia y gobierno:

### **Método 1: ETL Orchestration**

- **Pipelines** con Copy Data extraen desde SQL Server/APIs con carga incremental basada en timestamps.
- **Dataflow Gen2** (Power Query visual) transforma sin código antes de OneLake.
- **Notebooks PySpark** para lógica compleja con clústeres instantáneos.
- **EventStream** captura datos real-time desde Kafka/IoT Hub.
- **Orchestration**: Master pipelines con **Invoke Pipeline** para flujos anidados + **ForEach** procesando múltiples archivos vía JSON config.
- **Parametrización**: Variables globales (`@pipeline().parameters`) para entornos DEV/PRD.

### **Método 2: Federated Shortcuts**

- **Shortcuts** como punteros lógicos a ADLS Gen2/S3/Snowflake—sin movimiento físico.
- Query pushdown ejecuta consultas directamente en origen.
- Requiere **RBAC** (Storage Blob Data Reader) en cuenta de almacenamiento.
- URL format: `abfss://container@account.dfs.core.windows.net/path`.

### **Método 3: Mirroring**

- Replicación bidireccional automática con **CDC** (Change Data Capture).
- Sincronización continua entre Fabric y Snowflake/BigQuery.
- Latencia de segundos con eventual consistency.

### **NeuroAgent Project**

**NeuroAgent – Multi-Tenant AI Conversational System**

**Type:** B2B SaaS Platform  
**Goal:** Monetizable AI assistant for customer support and appointment handling  
**Pricing:** $150–400/month per client  
**Status:** MVP production-ready with Docker deployment

NeuroAgent is a **multi-tenant AI SaaS platform** designed to automate customer interaction and scheduling across multiple businesses from a single instance. It supports industries such as real estate, clinics, and restaurants. The core architecture uses a **RAG pipeline** with a **Qdrant vector database**, allowing each tenant to maintain an isolated knowledge base while sharing infrastructure. Built with **Python, FastAPI, LangChain, and GPT-4**, it integrates with **Google Calendar**, includes a structured **human handoff mechanism**, and uses **Celery + Redis** for asynchronous workloads like reminders. Operational costs enable **60% profit margins** and sub-200ms API latency.

**Stack:**  
Backend: Python 3.10+, FastAPI, Celery  
AI/ML: LangChain, GPT-4o-mini, sentence-transformers  
Data: MySQL 8.0, Qdrant, Redis 7  
Deploy: Docker Compose (4 services)  
APIs: Google Calendar, Google Maps, Telegram

**Key Features:**  
• Multi-tenant architecture (7 industries on one instance)  
• RAG pipeline with isolated knowledge bases per tenant  
• Calendar-synced appointment management  
• Human handoff with Redis-backed state machine  
• Asynchronous processing (Celery for notifications and emails)  
• Trust scoring and rate limiting for reliability

**Numbers:**  
• 60% profit margins  
• <200ms average API latency

**“How does RAG work?”**  
“Documents are embedded using sentence-transformers and stored in Qdrant. Queries perform vector search to retrieve top chunks for GPT-4. Redis caches frequent lookups. Each tenant uses a separate Qdrant collection.”

**“Biggest challenge?”**  
“Implementing lossless human handoff. Solved with a Redis-driven state machine and queued message buffer, with automatic timeout handling.”

**“Why this stack?”**  
“Optimized for cost and scale. GPT-4o-mini reduces LLM cost significantly. FastAPI provides async performance. Redis reduces redundant calls. Entire system runs on a low-cost VPS.”

---
### **Apache Airflow – Core Concept for Azure & Databricks Data Engineers**

**Apache Airflow** is a platform to programmatically author, schedule, and monitor **data workflows** using Python. It enables **declarative DAG (Directed Acyclic Graph)** design to represent task dependencies, making it ideal for orchestrating complex ETL pipelines.
#### Key Features for Azure & Databricks Integration:

- **Databricks Operator**: Trigger and monitor notebooks or jobs using `DatabricksSubmitRunOperator`, enabling orchestration of Delta workflows directly from Airflow.
- **Azure Integration**: Use hooks like `WasbHook`, `AzureDataLakeHook`, and ARM SDKs to interact with **Blob Storage**, **ADLS Gen2**, **Azure SQL**, and **Azure Functions**.
- **Task-Level Modularity**: Each task can call a different system (e.g., copy data to ADLS → run Spark job in Databricks → trigger Azure Function for downstream logic).
- **Dynamic DAGs**: You can create DAGs dynamically for multi-tenant workloads, batch + streaming triggers, or config-driven pipeline execution.
- **Retry, Alerting, SLA**: Airflow offers built-in retry logic, SLAs, alerting via email or webhook, and logs for debugging complex distributed pipelines.
- **CI/CD Ready**: DAGs can be version-controlled and deployed via **Azure DevOps** or **GitHub Actions** into Airflow environments (e.g., MWAA, Astro, or self-hosted on AKS).
#### Common Use Case in Azure–Databricks:

> Trigger a **daily Delta Lake pipeline** on Databricks via Airflow, which:
> - Extracts files from ADLS Gen2,
> - Executes a notebook for data cleaning and upserts,
> - Validates data with Great Expectations,
> - Sends a summary to Microsoft Teams via webhook,
> - And updates a Power BI refresh endpoint.

---

**Kappa Architecture** is a **data processing architecture** designed for **real-time (streaming) systems**, proposed by **Jay Kreps** (co-creator of Apache Kafka). It simplifies the traditional **Lambda Architecture** by removing the batch layer and focusing only on **streaming data pipelines**.

**One unified streaming pipeline** handles **both real-time** and **historical** data — using the same logic.
Unlike **Lambda Architecture** (which has separate batch and stream processing layers), **Kappa** proposes:
- **Streaming-first architecture**
- No dual-maintenance of code (no need to maintain batch + stream logic)
- Easier debugging and operational overhead







