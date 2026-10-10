# Section 4: Data Sharing and Federation

> Track: Databricks Certified Data Engineer Professional | Certification Preparation Guide

---


> [!NOTE]
> **Exam Weight: 5%** — The smallest section, but still tested. Covers Delta Sharing (Databricks to Databricks and Databricks to Open), Lakehouse Federation with governance, and sharing live data from the Lakehouse to external platforms.


---



## Delta Sharing (D2D and D2O)


### Topic Overview

Delta Sharing is Databricks' open protocol for sharing live data with external organizations without copying it. You've got two main scenarios: Databricks to Databricks (D2D) sharing, where both parties run Databricks, and Databricks to Open (D2O) sharing, where consumers use any tool like Spark, pandas, or Power BI. The key advantage is that the data stays in the provider's storage, and the consumer gets real time access with full governance through Unity Catalog.

On the Databricks side, you create a share object that contains the tables or views you want to distribute. You then add recipients (either Databricks accounts or open protocol consumers) to that share. Once activated, consumers get an activation link or credentials to access the shared data. All access is read only and logged in the provider's audit system, giving you complete visibility over who accessed what and when.


### Key Concepts


<details>
<summary><b>**Databricks to Databricks (D2D) Sharing**</b></summary>

D2D sharing is the native path between two Databricks workspaces or organizations. The consumer workspace connects directly to the provider's account using their Databricks identity. This is the simplest approach and offers the tightest integration with Unity Catalog. The provider controls permissions and can revoke access instantly. Consumers see the shared data as if it were their own tables in a catalog.


</details>


<details>
<summary><b>**Databricks to Open (D2O) and Open Protocol**</b></summary>

D2O sharing uses the open Delta Sharing protocol, which works with any consumer that supports it. This includes Spark clusters, pandas DataFrames, Power BI, Tableau, and other tools. The consumer receives a share credentials file (a signed URL or API token) that grants time limited access to specific tables. The open protocol reads data via HTTPS directly from the provider's cloud storage, so no Databricks workspace is required on the consumer side.


</details>


<details>
<summary><b>**Shares, Recipients, and Activation Links**</b></summary>

A share is a named object in Unity Catalog that groups tables and views you want to distribute. You add recipients to a share. A recipient is either a Databricks account ID (for D2D) or an email address (for open sharing). When you add a recipient to a share, Databricks generates an activation link that the recipient uses to claim access. Once activated, they get credentials stored in their Databricks account (D2D) or a downloadable JSON file (open sharing).


</details>


<details>
<summary><b>**Read Only Access and Audit Logging**</b></summary>

All shares grant read only access. Consumers cannot write to or modify shared tables. Every access is logged in the provider's audit system. The `system.access` table records which recipients accessed which shares and when. This gives you complete compliance visibility without needing additional external logging.


</details>


---


### Code Examples


#### Creating and Managing Shares (SQL)


```sql
-- Create a share
CREATE SHARE sales_data_share COMMENT 'Sales data for external partners';

-- Add tables to the share
ALTER SHARE sales_data_share ADD TABLE analytics.gold_sales;
ALTER SHARE sales_data_share ADD TABLE analytics.gold_customers;

-- Add a recipient (for Databricks to Databricks)
ALTER SHARE sales_data_share ADD RECIPIENT <account-id>;

-- Add a recipient (for open sharing)
ALTER SHARE sales_data_share ADD RECIPIENT partner@externalorg.com;

-- List recipients in a share
SHOW RECIPIENTS IN SHARE sales_data_share;

-- Remove a recipient
ALTER SHARE sales_data_share REMOVE RECIPIENT <account-id>;
```


#### Querying Audit Logs for Delta Sharing Access


```sql
-- Query access logs for a specific share
SELECT 
  timestamp,
  user_identity,
  action,
  request.share_name,
  request.object_type,
  request.object_name
FROM system.access
WHERE action = 'SHARE_ACCESS' 
  AND request.share_name = 'sales_data_share'
ORDER BY timestamp DESC;

-- Monitor which recipients access what
SELECT 
  DATE(timestamp) as access_date,
  user_identity as recipient,
  COUNT(*) as access_count
FROM system.access
WHERE action = 'SHARE_ACCESS'
GROUP BY DATE(timestamp), user_identity
ORDER BY access_date DESC, access_count DESC;
```


#### Consumer Side: Accessing Shared Data in PySpark


```python
# For Databricks to Databricks sharing, access is seamless
# The shared catalog appears in your catalog list

shared_data = spark.read.table("shared_catalog.schema.table_name")
shared_data.display()

# For open sharing with pandas
import pandas as pd
from delta_sharing import DeltaSharingClient

# Load credentials from the activation link JSON file
client = DeltaSharingClient("/path/to/share_credentials.json")

# List tables in the share
shares = client.list_shares()
for share in shares:
    print(share.name)

# Read a table as pandas DataFrame
df = client.load_as_pandas(share_name, schema_name, table_name)
print(df.head())
```


---


### Common Exam Scenarios

Scenario: Your company needs to share a gold table with an external partner who uses Power BI for reporting. The partner does not have a Databricks account. Which sharing approach would you use?

The answer is Databricks to Open (D2O) sharing. Since the consumer uses Power BI and not Databricks, you need the open Delta Sharing protocol. You create a share, add the partner's email as a recipient, and they get an activation link. Once activated, they download a credentials file that allows Power BI to connect directly via HTTPS. D2D only works when both parties have Databricks workspaces.

Scenario: A manager asks if shared Delta tables can be written to by external recipients. What do you tell them?

Delta Sharing always provides read only access. This is by design and cannot be changed. If the external party needs to write data, they would need to use a different mechanism like a copy of the data in their own storage, or a separate ingestion pipeline. This read only guarantee is one of the core security features.

Scenario: You need to prove compliance by showing that only authorized users accessed a shared table. Where do you look?

Query the `system.access` table with filters for `action = 'SHARE_ACCESS'` and the specific share and table name. This table is managed by Databricks and automatically logs every access attempt. It's the authoritative record for compliance audits and includes timestamp, user identity, and the object accessed.


---


### Key Takeaways

* Delta Sharing is a read only, governed way to share live data. D2D is for Databricks to Databricks. D2O uses the open protocol and works with any tool (Spark, pandas, Power BI, Tableau).
* Shares group tables and views. Recipients are either Databricks account IDs (D2D) or email addresses (open sharing). Activation links grant access and store credentials.
* All access is logged in `system.access`. Use this table to audit who accessed what and when for compliance reporting.
* Open sharing credentials are time limited and can be revoked. Consumers access data via HTTPS directly from the provider's storage, so no Databricks workspace is needed.

---


### Gotchas and Tips


> [!NOTE]
> Delta Sharing reads from the provider's object storage (S3, Azure, GCS). If the shared table is in a managed Unity Catalog location, Databricks handles the storage transparently. If it's an external table in an external catalog location, make sure the consumer's cloud identity has read access to that location, or use Databricks managed storage.


> [!NOTE]
> Activation links expire. If a consumer loses their credentials, regenerate them by creating a new activation link. For open sharing, you can also regenerate the share credentials JSON file without changing the link.


> [!NOTE]
> Sharing a view instead of a table is common. Views can filter or transform the underlying table, so you control exactly what the consumer sees. Remember to grant `SELECT` on the underlying tables if you're sharing a view.


---


### Links and Resources

* **[Delta Sharing Overview](https://docs.databricks.com/aws/en/delta-sharing/)** — Introduction to the open protocol for secure data sharing.
* **[Databricks-to-Databricks Sharing](https://docs.databricks.com/aws/en/delta-sharing/share-data-databricks)** — Sharing live data between Databricks workspaces.
* **[Open Sharing with Non-Databricks Recipients](https://docs.databricks.com/aws/en/delta-sharing/share-data-open)** — Sharing data with external consumers via the open Delta Sharing protocol.


## Lakehouse Federation Configuration


### Topic Overview

Lakehouse Federation lets you query data from external databases directly in Databricks without moving it into Delta Lake. You can connect to PostgreSQL, MySQL, SQL Server, Snowflake, BigQuery, and other sources through foreign catalogs. The key idea is that Databricks acts as a query engine that can push work down to the remote database, so you get federation with governance through Unity Catalog. It's perfect when you have existing data warehouses or operational databases that you want to query alongside your data lake.

To set up federation, you create a connection object with credentials to the external database, then create a foreign catalog that references that connection. The foreign catalog appears in your Unity Catalog hierarchy just like a normal catalog. When you query a table in a foreign catalog, Databricks optimizes the query and pushes it to the remote database when possible. Access is governed by the same UC permissions model, so you get consistent access control across all your data.


### Key Concepts


<details>
<summary><b>**Connections and Foreign Catalogs**</b></summary>

A connection stores credentials and connection details for an external database. A foreign catalog is a named reference to that connection, which creates a catalog in Unity Catalog that maps to the external database. Tables in foreign catalogs are read only. The foreign catalog uses the connection to authenticate and query the remote database. You can have multiple foreign catalogs pointing to the same connection, or pointing to different databases via the same connection.


</details>


<details>
<summary><b>**Query Pushdown and Optimization**</b></summary>

Query pushdown means that when you execute a query on a foreign table, Databricks translates the SQL and sends it to the remote database to execute, rather than pulling all the data to Spark. This minimizes data movement and leverages the remote database's query engine for efficiency. Not all queries can be pushed down. Queries with Spark specific functions or very complex logic may need to be executed in Spark on the remote data. The Databricks query planner handles this automatically.


</details>


<details>
<summary><b>**Unity Catalog Governance on Federated Data**</b></summary>

Foreign catalogs inherit the same UC permission model. You can grant catalog level permissions, schema level permissions, and object level permissions just like on Delta Lake. Row filters and column masks apply to federated queries too. This means your data security policies are consistent whether data lives in your data lake or in an external system.


</details>


<details>
<summary><b>**Supported Data Sources**</b></summary>

Lakehouse Federation supports PostgreSQL, MySQL, MariaDB, SQL Server, Snowflake, BigQuery, and Azure Data Warehouse. Each has specific connection parameters and driver requirements. Query pushdown compatibility varies by database. For example, Snowflake shares many SQL functions with Spark, so pushdown is generally effective. PostgreSQL also has good pushdown support.


</details>


---


### Code Examples


#### Setting Up a Connection and Foreign Catalog (SQL)


```sql
-- Create a connection to a PostgreSQL database
CREATE CONNECTION postgres_prod
FOR DATABASE DRIVER 'postgresql'
WITH (
  host = 'my-postgres-server.example.com',
  port = '5432',
  database = 'analytics_db',
  user = 'databricks_user',
  password = '{{ secrets/scope/postgres_password }}'
);

-- Create a foreign catalog using the connection
CREATE FOREIGN CATALOG postgres_catalog
  USING CONNECTION postgres_prod
  PROPERTY 'schema_mapping' = 'public';

-- Query a table from the foreign catalog
SELECT * FROM postgres_catalog.public.customers LIMIT 10;

-- Create a Snowflake connection with network binding
CREATE CONNECTION snowflake_prod
FOR DATABASE DRIVER 'snowflake'
WITH (
  account = 'xy12345.us-east-1',
  warehouse = 'compute_wh',
  database = 'analytics_db',
  schema = 'public',
  user = 'databricks_user',
  password = '{{ secrets/scope/snowflake_password }}'
);
```


#### Querying Federated Data in PySpark


```python
# Read from a foreign catalog table
df = spark.read.table("postgres_catalog.public.orders")

# Filter and transform
filtered = df.filter(col("order_date") > "2024-01-01")
result = filtered.groupBy("customer_id").agg({"total": "sum"})

# Join across local and foreign data
gold_customers = spark.read.table("catalog.gold.customers")
join_result = result.join(
  gold_customers,
  result.customer_id == gold_customers.customer_id,
  "inner"
)

# Collect results to Databricks
join_result.write.mode("overwrite").saveAsTable("catalog.gold.order_summary")
```


#### Monitoring Query Pushdown


```sql
-- Check if queries are being pushed down
-- Use EXPLAIN to see the execution plan
EXPLAIN SELECT 
  customer_id, 
  COUNT(*) as order_count
FROM postgres_catalog.public.orders
WHERE order_date > '2024-01-01'
GROUP BY customer_id;

-- Look for "ForeignRelation" or "ForeignScan" in the output
-- This indicates the query is being pushed to the remote database

-- Query Spark system tables for execution statistics
SELECT 
  query_id,
  total_user_time_ms,
  total_scan_time_ms
FROM system.query_history
WHERE query LIKE '%postgres_catalog%'
ORDER BY start_time DESC
LIMIT 10;
```


---


### Common Exam Scenarios

Scenario: Your company has customer data in a Snowflake data warehouse and transaction data in Databricks. You need to join them for analysis. Should you move the Snowflake data to Databricks, or use Lakehouse Federation?

Lakehouse Federation is the right choice. You create a foreign catalog that connects to Snowflake via a connection object. Queries automatically push down to Snowflake when possible, and you avoid copying data. If the join is simple, Databricks may push the entire query to Snowflake. If the join logic requires Spark, Databricks fetches data from Snowflake and performs the join locally. You maintain single versions of truth in both systems.

Scenario: You have a foreign catalog connected to PostgreSQL. A business analyst needs to read from one schema but not another. How do you enforce this with Unity Catalog?

Grant the analyst SELECT permission on the schema they need, and deny permission on the other schema. Unity Catalog permissions apply to foreign catalogs just like local catalogs. You can grant permissions at the catalog level, schema level, or table level. The analyst sees only the objects they have permission for, regardless of what exists in the external database.

Scenario: Your query on a foreign table is slow. You suspect it's not being pushed down to the remote database. How would you verify this?

Run EXPLAIN on your query and look at the execution plan. If you see "ForeignRelation" or "ForeignScan" nodes, the query is being pushed down. If the plan shows multiple stages and shuffles, it's likely that the query could not be fully pushed and is being executed in Spark. Check system.query_history for timing details. Some queries with non pushable operations (custom UDFs, certain Spark functions) will always execute in Spark.


---


### Key Takeaways

* Lakehouse Federation lets you query external databases (Snowflake, PostgreSQL, BigQuery, etc.) without copying data. Create a connection, then a foreign catalog, and query just like local tables.
* Query pushdown optimizes performance by sending queries to the remote database to execute, minimizing data movement. Use EXPLAIN to verify pushdown is happening.
* Foreign catalogs support full Unity Catalog governance. Permissions, row filters, and column masks work the same way on federated data as on local data.
* Foreign catalog tables are read only. If you need to write data, copy it to a local Delta table or use a separate ingestion process.

---


### Gotchas and Tips


> [!NOTE]
> Store connection passwords and credentials in a Databricks secret scope using `{{ secrets/scope/key_name }}` syntax. Never hardcode credentials in queries or notebooks. The connection will reference the secret at runtime.


> [!NOTE]
> Some SQL dialects differ between databases. If a query works on the remote database directly but fails when pushed down from Databricks, the syntax may need translation. Consider breaking the query into simpler parts that are more likely to push down.


> [!NOTE]
> Network connectivity between Databricks and the external database is critical. If the connection times out or the remote database is unreachable, all queries on that foreign catalog will fail. Test connections and consider network binding to ensure reliable access.


---


### Links and Resources

* **[Lakehouse Federation](https://docs.databricks.com/aws/en/query-federation/)** — Configuring federated queries to external databases without data movement.
* **[Federation Connections](https://docs.databricks.com/aws/en/query-federation/connections)** — Creating and managing connections to external data sources like PostgreSQL, MySQL, and Snowflake.


## Sharing Live Data Across Platforms


---


### Links and Resources

* **[Delta Sharing Overview](https://docs.databricks.com/aws/en/delta-sharing/)** — Sharing live data across platforms using the open Delta Sharing protocol.
* **[Lakehouse Federation](https://docs.databricks.com/aws/en/query-federation/)** — Querying data across external systems without replication.
