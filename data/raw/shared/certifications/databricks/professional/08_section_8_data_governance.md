# Section 8: Data Governance

> Track: Databricks Certified Data Engineer Professional | Certification Preparation Guide

---


> [!NOTE]
> **Exam Weight: 7%** — Focuses on data discoverability through metadata (tags, comments, documentation) and the Unity Catalog permission inheritance model across metastore, catalog, schema, and table levels.


---



## Data Discoverability and Metadata


### Topic Overview

Data discoverability and metadata management are foundational to building trust in the Lakehouse. When you have hundreds of tables and external data sources, users need a way to understand what data exists, what it means, and how it relates to other assets. Unity Catalog (UC) provides a centralized metadata layer that makes this possible.

As a Data Engineer, you need to document your data products, make them searchable, and help analysts discover tables. This includes tagging for business alignment, writing column level documentation, and querying the catalog using INFORMATION_SCHEMA to understand data lineage and dependencies.


### Key Concepts


<details>
<summary><b>**Tagging and Comments in Unity Catalog**</b></summary>

UC supports custom tags (key value pairs) on tables, columns, and schemas. Use tags to mark tables by business domain, sensitivity level (PII, confidential, public), or data quality tier (bronze, silver, gold). Comments explain the business purpose, valid ranges, and update frequency. Comments appear in the catalog UI and help analysts understand data without external documentation.


</details>


<details>
<summary><b>**INFORMATION_SCHEMA for Programmatic Access**</b></summary>

The system.information_schema schema provides standard SQL views for querying metadata. Query tables, columns, schemata, or catalogs to discover by name, owner, catalog, or schema. Use INFORMATION_SCHEMA in lineage jobs to identify all upstream and downstream dependencies without relying on the UI.


</details>


<details>
<summary><b>**Data Lineage for Discovery and Impact Analysis**</b></summary>

UC automatically tracks read and write relationships between tables. The lineage view shows upstream sources and downstream consumers. Use lineage to identify which tables feed into a dimension or what downstream tables depend on a source. During troubleshooting, trace which downstream tables are affected if data quality drops.


</details>


<details>
<summary><b>**Searching and Browsing the Catalog UI**</b></summary>

The UC catalog UI provides a searchable browser for metastore objects. Search by table name, column name, owner, or tag. Full text search includes comments, so well documented tables are more discoverable. Browse the schema hierarchy and view column level metadata. The UI is the primary discovery mechanism for most analysts.


</details>


### Code Examples


#### Adding Comments and Tags


```sql
-- Add table comment
COMMENT ON TABLE my_catalog.my_schema.customers IS
  'Master customer dimension. Updated daily at 2 AM UTC.';

-- Add column comment
COMMENT ON COLUMN my_catalog.my_schema.customers.email IS
  'Customer email address. Primary contact method.';

-- Tag a table
ALTER TABLE my_catalog.my_schema.customers
SET TAGS ('business_unit' = 'sales', 'sensitivity' = 'pii');

-- Tag a column
ALTER TABLE my_catalog.my_schema.customers
ALTER COLUMN ssn SET TAGS ('pii' = 'yes');
```


#### Querying INFORMATION_SCHEMA


```sql
-- Find tables by name
SELECT table_catalog, table_schema, table_name
FROM system.information_schema.tables
WHERE table_catalog = 'my_catalog'
  AND table_name LIKE '%customer%';

-- Get column metadata
SELECT column_name, data_type, is_nullable, column_comment
FROM system.information_schema.columns
WHERE table_catalog = 'my_catalog'
  AND table_schema = 'my_schema'
  AND table_name = 'customers'
ORDER BY ordinal_position;

-- Find tables by owner
SELECT table_catalog, table_schema, table_name, table_owner
FROM system.information_schema.tables
WHERE table_owner = 'analytics@company.com'
ORDER BY table_schema;
```


### Common Exam Scenarios

**Cannot discover a newly created table. You documented it with comments but no one can find it in the catalog. What approach would you take?**

Tag the table with a business domain tag and ensure the owner is correct. Comments are searchable via the catalog UI full text search, but tags make the table filterable. Add a tag like domain = features so analysts can browse by domain. Ensure the table is in a schema that analysts typically access.

**Audit which downstream tables depend on a critical raw data source before making schema changes. How would you gather this programmatically?**

Query system.access.audit_logs to see which jobs and notebooks read from the source table. UC automatically tracks table dependencies, allowing you to fetch this information via API. This shows exactly which tables, jobs, or dashboards would be affected by schema changes.


### Key Takeaways

* Use comments and tags strategically for governance and discoverability.
* INFORMATION_SCHEMA is your programmatic gateway to metadata.
* Lineage is automatic in UC. Use it for impact analysis.
* Well documented, tagged tables are more discoverable.

### Gotchas and Tips


> [!NOTE]
> Comments are not searchable in INFORMATION_SCHEMA queries. The catalog UI searches comments, but SQL queries do not. Use tags for programmatic discovery.


> [!NOTE]
> Lineage only tracks UC tables. If your pipeline mixes UC and non UC tables, you lose visibility into some dependencies.


---


### Links and Resources

* **[Unity Catalog Overview](https://docs.databricks.com/aws/en/data-governance/unity-catalog/)** — Data discoverability through tags, comments, and metadata management in Unity Catalog.
* **[Data Lineage](https://docs.databricks.com/aws/en/data-governance/unity-catalog/data-lineage)** — Tracking data provenance and metadata across the entire data lifecycle.


## Unity Catalog Permission Inheritance


### Topic Overview

Understanding the Unity Catalog permission hierarchy is critical for designing secure, scalable governance in the Lakehouse. Permissions flow downward from the metastore level to schemas, tables, and columns. If you grant a user USAGE on a catalog, they automatically inherit USAGE on all schemas within it, even if you never explicitly grant schema level permissions. This hierarchical model makes governance easier but also means a single permission grant can have cascading effects.

The Professional exam tests your ability to troubleshoot permission issues, design least privilege access models, and explain how ownership, inheritance, and explicit permissions interact. You need to know when to use table level grants versus catalog level grants, and how DENY permissions work in UC.


### Key Concepts


<details>
<summary><b>**Hierarchical Permission Model (Metastore > Catalog > Schema > Table/View)**</b></summary>

The UC metastore is the top level container. Catalogs live in the metastore, schemas live in catalogs, and tables/views live in schemas. Permissions granted at a parent level propagate to children automatically. If you grant SELECT on a catalog, users can SELECT from all tables in all schemas within that catalog without additional grants.


</details>


<details>
<summary><b>**USAGE Privilege and Its Role in Permission Chains**</b></summary>

USAGE is a special privilege. To access any table in a schema, a user must have USAGE on both the parent catalog and the parent schema. USAGE does not grant the right to SELECT or manipulate data; it is just a gate. If a user lacks USAGE on the catalog, they cannot see or access any schema within it, even if they are granted SELECT directly on a table. USAGE is purely about traversal through the hierarchy.


</details>


<details>
<summary><b>**Inheritance vs. Explicit Grants and Permission Checking Order**</b></summary>

UC evaluates permissions from the most specific to the least specific. A table level grant overrides a schema level grant. If a user has DENY SELECT at the catalog level but GRANT SELECT at the table level, the table level grant wins. The permission checking order is: object level (most specific) > parent schema level > parent catalog level > metastore level (least specific).


</details>


<details>
<summary><b>**Owner Privileges and Implicit Rights**</b></summary>

The owner of a table or schema has full rights to that object and can grant and revoke permissions without restrictions. Ownership is independent of explicit GRANT statements. If you are the owner of a table, you can always SELECT, INSERT, UPDATE, DELETE, and ALTER that table, even if no explicit grant exists. You can also change ownership and transfer permissions.


</details>


### Code Examples


#### Granting Permissions at Different Levels


```sql
-- Grant USAGE on catalog (must have this to access any schema)
GRANT USAGE ON CATALOG my_catalog TO `data_team@company.com`;

-- Grant USAGE on schema (required to access tables in schema)
GRANT USAGE ON SCHEMA my_catalog.my_schema TO `data_team@company.com`;

-- Grant SELECT on all tables in schema
GRANT SELECT ON SCHEMA my_catalog.my_schema TO `data_team@company.com`;

-- Grant SELECT on specific table only
GRANT SELECT ON TABLE my_catalog.my_schema.customers TO `data_team@company.com`;

-- Grant multiple privileges on table
GRANT SELECT, INSERT, UPDATE ON TABLE my_catalog.my_schema.orders 
  TO `analytics@company.com`;

-- Grant privileges to a group (members inherit)
GRANT SELECT ON CATALOG my_catalog TO `group_analysts`;
```


#### Testing Permission Inheritance


```sql
-- View all permissions on a table
SHOW GRANT ON TABLE my_catalog.my_schema.customers;

-- View all permissions on a schema
SHOW GRANT ON SCHEMA my_catalog.my_schema;

-- View all permissions on a catalog
SHOW GRANT ON CATALOG my_catalog;

-- Check effective permissions (what a principal can actually do)
SHOW GRANT `user@company.com` ON SCHEMA my_catalog.my_schema;

-- List all principals with access to a catalog
SHOW GRANT ON CATALOG my_catalog;
```


#### Managing Ownership and Explicit Denies


```sql
-- Change table owner
ALTER TABLE my_catalog.my_schema.customers
OWNER TO `new_owner@company.com`;

-- Explicitly DENY a privilege (overrides parent grants)
DENY SELECT ON TABLE my_catalog.my_schema.sensitive_data 
  TO `external_user@company.com`;

-- REVOKE a privilege
REVOKE SELECT ON TABLE my_catalog.my_schema.customers
FROM `user@company.com`;

-- Change schema owner
ALTER SCHEMA my_catalog.my_schema
OWNER TO `schema_admin@company.com`;
```


### Common Exam Scenarios

**A user reports they cannot SELECT from a table even though they have SELECT on the schema. You check SHOW GRANT and see the user has SELECT on the schema but not the table. What is likely happening?**

The user likely lacks USAGE on the parent catalog. While SELECT on a schema grants read access to tables, the user must also have USAGE on the catalog to traverse the hierarchy. Ask them to check: do they have USAGE on the catalog? If not, grant it. The permission checking order requires USAGE at every level before data access privileges take effect.

**You granted SELECT on a catalog to all analysts, but a new sensitive table was added that should only be readable by a specific team. The table is inheriting the catalog level SELECT grant. How do you restrict access without revoking the catalog grant?**

Use an explicit DENY on the sensitive table for the broader group, then GRANT SELECT to just the specific team. Explicit object level permissions override parent permissions. The DENY on the table will prevent the inherited catalog level SELECT from taking effect for users in the broader group, while the specific team members receive a direct GRANT.


### Key Takeaways

* USAGE is required at every level in the hierarchy. A user needs USAGE on the catalog AND schema to access a table.
* Permissions flow downward from metastore to catalog to schema to table.
* More specific grants always win. Table level permissions override schema level permissions.
* Owners have implicit rights and can revoke permissions even without explicit grants.

### Gotchas and Tips


> [!NOTE]
> Granting SELECT on a schema does not grant USAGE on the parent catalog. You must grant both USAGE on the catalog and SELECT on the schema for a user to read tables.


> [!NOTE]
> DENY does not cascade downward. If you DENY a privilege on a schema, child tables can still be accessed if a lower level GRANT exists. Permissions are evaluated from most specific to least specific.


---


### Links and Resources

* **[Unity Catalog Access Control](https://docs.databricks.com/aws/en/data-governance/unity-catalog/access-control)** — Understanding permission inheritance across metastore, catalog, schema, and table levels.
* **[Unity Catalog Overview](https://docs.databricks.com/aws/en/data-governance/unity-catalog/)** — Three-level namespace hierarchy and governance model.
