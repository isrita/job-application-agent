# Section 7: Ensuring Data Security and Compliance

> Track: Databricks Certified Data Engineer Professional | Certification Preparation Guide

---


> [!NOTE]
> **Exam Weight: 10%** — Covers ACLs and least privilege, row filters and column masks, anonymization and pseudonymization techniques (hashing, tokenization, suppression, generalization), PII detection and masking pipelines, and data purging for retention compliance.


---



## ACLs and Least Privilege


### Topic Overview

Unity Catalog implements fine grained access control through a privilege hierarchy. At the top is the metastore, then catalogs, schemas, and tables. You assign privileges like SELECT, MODIFY, CREATE, and USAGE to principals at each level. This hierarchical model ensures data security while enabling collaboration.

The principle of least privilege means users get only the permissions they need, no more. Account admins set access at the workspace and metastore level. Workspace admins manage catalog and schema access. Data owners grant table level permissions. This distributed responsibility model works well in organizations of all sizes.

Unity Catalog permissions are enforced everywhere: SQL, Python, notebooks, and REST APIs. There is no way to bypass these controls. Combined with audit logging, this provides both security and compliance evidence.


---


### Key Concepts


<details>
<summary><b>Securable Objects</b></summary>

Securable objects form a hierarchy: metastore > catalog > schema > table > column > row. Each level has its own permissions. A user must have USAGE on the catalog, schema, and SELECT on the table to query it. Granular control at each level enables precise access patterns.


</details>


<details>
<summary><b>Privilege Types</b></summary>

SELECT allows reading data, INSERT/UPDATE/DELETE modify data, CREATE adds new objects, USAGE enables traversing the hierarchy, MODIFY changes properties. Different securable objects support different privileges. Tables support SELECT, MODIFY, but catalogs only support USAGE.


</details>


<details>
<summary><b>GRANT and REVOKE</b></summary>

GRANT privilege ON object TO principal assigns permissions. REVOKE removes them. Principals are users, groups, or service principals. Grants can include WITH GRANT OPTION allowing the recipient to grant to others. Revoking cascades through delegated grants.


</details>


<details>
<summary><b>Ownership and Admin</b></summary>

Object owners have full control including ability to grant/revoke. Account admins can change owners. Ownership allows delegation of responsibility without making someone an admin. Users inherit workspace level permissions, but explicit grants take precedence.


</details>


---


### Code Examples


#### Granting Permissions


```sql
-- Grant SELECT to a user
GRANT SELECT ON TABLE my_catalog.my_schema.customers TO user@example.com;

-- Grant multiple privileges to a group
GRANT SELECT, MODIFY ON TABLE my_catalog.my_schema.orders TO data_engineers;

-- Grant USAGE on schema (required to access tables)
GRANT USAGE ON SCHEMA my_catalog.my_schema TO analysts;

-- Grant with delegation rights
GRANT SELECT ON TABLE my_catalog.my_schema.products 
  TO senior_engineer WITH GRANT OPTION;

-- Grant ownership
ALTER TABLE my_catalog.my_schema.transactions 
  OWNER TO data_engineering_team;
```


#### Revoking and Checking Permissions


```sql
-- Revoke a privilege
REVOKE SELECT ON TABLE my_catalog.my_schema.customers FROM user@example.com;

-- Revoke all privileges
REVOKE ALL PRIVILEGES ON TABLE my_catalog.my_schema.orders FROM contractor_group;

-- Show grants on an object
SHOW GRANTS ON TABLE my_catalog.my_schema.customers;

-- Show grants for a principal
SHOW GRANTS ON my_catalog.my_schema.customers FOR user@example.com;
```


#### Hierarchy Navigation


```sql
-- User needs USAGE on catalog to see schemas
GRANT USAGE ON CATALOG my_catalog TO analyst_group;

-- User needs USAGE on schema AND SELECT on table
GRANT USAGE ON SCHEMA my_catalog.my_schema TO analyst_group;
GRANT SELECT ON TABLE my_catalog.my_schema.products TO analyst_group;

-- Check what a user can access
-- This is implicit in the object hierarchy
-- Missing USAGE anywhere blocks access
```


---


### Common Exam Scenarios

Scenario 1: Multi Team Access Control

Finance team needs SELECT on financial tables, engineering team needs SELECT and MODIFY on product tables. Grant SELECT to finance_group on finance schema, SELECT and MODIFY to engineering_group on products schema. USAGE grants on the catalog itself allow both teams to navigate. Missing either privilege blocks access.

Scenario 2: Delegation Without Admin

A senior engineer needs to manage access to specific tables without becoming an admin. Use WITH GRANT OPTION to allow them to delegate SELECT to team members. They can grant and revoke but only SELECT, not MODIFY or administrative privileges.

Scenario 3: Service Principal Access

A machine learning pipeline needs read access to training data and write access to results. Grant SELECT on source tables and SELECT, INSERT on target tables to the service principal. The job runs with these specific privileges, enabling least privilege for automated processes.


---


### Key Takeaways

* Unity Catalog enforces hierarchical access control across all interfaces
* Users need privileges at every level: catalog USAGE, schema USAGE, table SELECT/MODIFY
* Grant privileges to groups for easier management at scale
* Use WITH GRANT OPTION to delegate responsibility without granting admin rights

---


### Gotchas and Tips


> [!NOTE]
> USAGE is Essential: A user missing USAGE at any level cannot see or access objects below. This is easy to forget when setting up new schemas or catalogs.


> [!NOTE]
> Group Membership: Use groups not individual users for easier management. Changes to group membership take effect immediately.


> [!NOTE]
> Privilege Specificity: Each privilege is distinct. Granting SELECT does not grant MODIFY. Be explicit about what each principal needs.


---


### Links and Resources

* **[Unity Catalog Access Control](https://docs.databricks.com/aws/en/data-governance/unity-catalog/access-control)** — Implementing ACLs and least privilege access on Unity Catalog securables.
* **[Unity Catalog Overview](https://docs.databricks.com/aws/en/data-governance/unity-catalog/)** — Understanding the three-level namespace and privilege inheritance model.


## Row Filters and Column Masks


### Topic Overview

Row and column level security enable fine grained access control without duplicating data. Row filters restrict which rows a user can see based on SQL expressions. Column masks hide sensitive values while showing the column structure. Together, they provide defense in depth for sensitive data.

Row filters work by adding automatic WHERE clauses to queries. If a user lacks permission to see rows where status=deleted, those rows vanish from all queries they run. Column masks replace sensitive values with NULL or hashed versions dynamically. Neither duplicates data, making them efficient and maintainable.

Performance implications exist at scale. Filters and masks execute for every query, so complex expressions on large tables can slow things down. Test performance before applying to high traffic tables.


---


### Key Concepts


<details>
<summary><b>Row Level Security</b></summary>

Row filters apply SQL predicates automatically based on user or group. Users see only rows matching the filter. Multiple filters on the same table combine with OR. Filters work across all query interfaces and cannot be bypassed.


</details>


<details>
<summary><b>Column Level Masking</b></summary>

Masks replace sensitive values dynamically. Options include hiding entirely, showing only first N characters, hashing with DIGEST, or custom SQL expressions. Masks apply to all accessors, but owners and admins see unmasked data.


</details>


<details>
<summary><b>Owner and Admin Exceptions</b></summary>

Table owners and admins automatically bypass filters and masks. This allows them to audit and manage data. Service accounts should rarely be admins due to this bypass.


</details>


<details>
<summary><b>Performance Considerations</b></summary>

Every query evaluates filters and masks, adding CPU and I/O. Complex expressions degrade performance. Indexed columns in filters can help. Test at scale before deploying.


</details>


---


### Code Examples


#### Creating Row Filters


```sql
-- Row filter that shows only rows where department = user's department
CREATE OR REPLACE ROW FILTER row_filter_dept
ON my_catalog.my_schema.employees
AS (department = current_user_name());

-- Apply filter to analyst group
ALTER ROW FILTER row_filter_dept
GRANT (APPLY) ON my_catalog.my_schema.employees TO analysts;

-- Row filter using function
CREATE OR REPLACE ROW FILTER row_filter_by_region
ON my_catalog.my_schema.orders
AS (region IN (SELECT allowed_regions FROM my_catalog.my_schema.user_regions
              WHERE user_id = current_user()));
```


#### Creating Column Masks


```sql
-- Hide entire column (show NULL)
CREATE OR REPLACE COLUMN MASK mask_salary_hidden
ON my_catalog.my_schema.employees COLUMN salary
RETURN NULL;

-- Show only first 4 digits of credit card
CREATE OR REPLACE COLUMN MASK mask_cc_partial
ON my_catalog.my_schema.payments COLUMN credit_card_number
RETURN CONCAT('****-****-****-', RIGHT(credit_card_number, 4));

-- Hash sensitive email
CREATE OR REPLACE COLUMN MASK mask_email_hash
ON my_catalog.my_schema.customers COLUMN email
RETURN REGEXP_REPLACE(email, '@.*', '@example.com');

-- Apply masks to group
ALTER COLUMN MASK mask_salary_hidden
GRANT (APPLY) ON my_catalog.my_schema.employees COLUMN salary TO non_hr_staff;
```


---


### Common Exam Scenarios

Scenario 1: Department Specific Data Access

HR employees should see all employee records. Managers should see only their department. Apply a row filter WHERE department IN (SELECT department FROM user_dept_mapping) to restrict managers.

Scenario 2: PII Column Masking

Finance analysts need to see customer amounts but not credit card numbers. Apply a mask on credit_card_number showing only last 4 digits. HR can see unmasked values. Admins always see everything.

Scenario 3: Compliance with Row Filters

Deleted user records should be invisible to most users. Create a row filter WHERE is_deleted = false. Only data governance team with DELETE privilege can see deleted records for audits.


---


### Key Takeaways

* Row filters add WHERE clauses automatically, restricting visible rows
* Column masks replace values dynamically, hiding sensitive data without duplication
* Owners and admins bypass filters and masks, enabling auditing
* Test performance impact on large tables before deploying at scale

---


### Gotchas and Tips


> [!NOTE]
> Admin Bypass: Admins see unfiltered data even if they do not need it. Minimize admin privileges to limit exposure.


> [!NOTE]
> Filter Complexity: Complex filter logic that joins to other tables can be slow. Denormalize lookup data into the main table if needed.


> [!NOTE]
> Mask Reversibility: Masks are not reversible. Once hashed or partially masked, original values are lost. Plan for audit trail separately.


---


### Links and Resources

* **[Row Filters and Column Masks](https://docs.databricks.com/aws/en/data-governance/unity-catalog/filters-and-masks)** — Applying fine-grained access control at the row and column level using SQL functions.


## Anonymization and Pseudonymization


### Topic Overview

Anonymization and pseudonymization transform PII into forms that cannot identify individuals. Anonymization removes identifiability entirely through techniques like hashing or generalization. Pseudonymization replaces identifiers with random codes while maintaining record linkability. Both reduce risk and support compliance.

Hashing creates one way transformations ideal for one time comparisons. Tokenization replaces values with random codes while storing a mapping table separately. Suppression removes values entirely. Generalization groups exact values into ranges. Each technique has tradeoffs between security and utility.

K anonymity ensures at least k records are identical on quasi identifiers. This prevents individual reidentification. Differential privacy adds mathematical guarantees about privacy. Both are exam topics and important for regulatory compliance.


---


### Key Concepts


<details>
<summary><b>Hashing</b></summary>

One way function that transforms input deterministically. Same input always produces same output. Cannot reverse. Good for comparing values without revealing them. SHA2 is common for PII like emails. Salt adds randomness to resist dictionary attacks.


</details>


<details>
<summary><b>Tokenization</b></summary>

Replace actual values with random tokens. Maintain token mapping in secure vault. Allows reidentification if needed and linkability across records. More complex than hashing but reversible. Tokens should be cryptographically random.


</details>


<details>
<summary><b>Suppression and Generalization</b></summary>

Suppression removes values entirely, replacing with NULL. Generalization groups values, e.g., exact age to age ranges. Both reduce data utility. Good for non critical fields. Combine with other techniques for defense in depth.


</details>


<details>
<summary><b>K Anonymity</b></summary>

Ensures each combination of quasi identifiers appears at least k times. Prevents reidentification through record linkage. Higher k is more private but reduces utility. Exam often tests understanding of k anonymity tradeoffs.


</details>


---


### Code Examples


#### Hashing Techniques


```sql
-- Hash with SHA2 (one way)
SELECT 
  SHA2(email, 256) as hashed_email,
  SHA2(phone, 256) as hashed_phone,
  name
FROM my_catalog.my_schema.customers;

-- Salted hash for security
SELECT 
  SHA2(CONCAT(email, 'my_salt_value'), 256) as salted_hash,
  customer_id
FROM my_catalog.my_schema.customers;
```


#### Suppression and Generalization


```sql
-- Suppression: replace sensitive data with NULL
SELECT 
  NULL as ssn,
  NULL as credit_card,
  customer_name,
  city
FROM my_catalog.my_schema.customers;

-- Generalization: group exact values into ranges
SELECT 
  customer_id,
  CASE 
    WHEN age < 18 THEN '0-17'
    WHEN age < 65 THEN '18-64'
    ELSE '65+'
  END as age_group,
  LEFT(zip_code, 3) as zip_prefix,
  purchase_amount
FROM my_catalog.my_schema.customers;
```


#### K Anonymity Check


```sql
-- Check k anonymity on quasi identifiers
SELECT 
  age_group, 
  city, 
  COUNT(*) as count
FROM (
  SELECT 
    CASE 
      WHEN age < 18 THEN '0-17'
      WHEN age < 65 THEN '18-64'
      ELSE '65+'
    END as age_group,
    city
  FROM my_catalog.my_schema.customers
)
GROUP BY age_group, city
HAVING count(*) < 5;  -- k=5, find groups with fewer than 5 records
```


---


### Links and Resources

* **[Row Filters and Column Masks](https://docs.databricks.com/aws/en/data-governance/unity-catalog/filters-and-masks)** — Using column masks for anonymization and pseudonymization of sensitive data.
* **[Unity Catalog Access Control](https://docs.databricks.com/aws/en/data-governance/unity-catalog/access-control)** — Controlling access to anonymized and pseudonymized datasets.


## PII Detection and Masking Pipelines


---


### Links and Resources

* **[Row Filters and Column Masks](https://docs.databricks.com/aws/en/data-governance/unity-catalog/filters-and-masks)** — Building PII detection and masking pipelines using column masks and SQL functions.
* **[Lakeflow Spark Declarative Pipelines](https://docs.databricks.com/aws/en/ldp/)** — Implementing data quality expectations to flag and quarantine PII violations.


## Data Purging and Retention Compliance


### Topic Overview

Data purging removes data that is no longer needed or has exceeded its retention period. GDPR right to be forgotten and similar regulations require demonstrating data deletion. Tombstone records mark deleted data without removing it physically, providing audit trails. Lakeflow pipelines automate deletion for compliance.

VACUUM permanently removes deleted data from Delta tables. Combine with deletion workflows to meet compliance requirements. Test deletion logic on non production first. Document all deletions for audits, especially GDPR requests.

Retention policies define how long different data classes are kept. Implement at the table level using lifecycle policies. Automate purging with scheduled jobs to maintain compliance without manual effort. Immutable tables protect audit logs from tampering.


---


### Key Concepts


<details>
<summary><b>GDPR Right to Be Forgotten</b></summary>

Individuals can request erasure of their data. Organizations have 30 days to comply. Must delete across all systems. VAULT command with PURGE ensures data is unrecoverable. Log deletions with timestamps and requester for audit.


</details>


<details>
<summary><b>Tombstone Records</b></summary>

Soft delete that marks records as deleted without removing them. Store deletion timestamp and reason. Enables audit trails and recovery if needed. Use is_deleted flag in filter for normal queries.


</details>


<details>
<summary><b>Retention Policies</b></summary>

Define minimum and maximum retention periods. Minimum ensures data is available when needed. Maximum ensures deletion after legal holds expire. Enforce programmatically with automated purging.


</details>


<details>
<summary><b>Audit Trail Immutability</b></summary>

Audit logs must be immutable to prevent tampering. Store separately from operational data. Use managed tables or external append only stores. Never purge audit records within retention window.


</details>


---


### Code Examples


#### Hard Delete with VACUUM


```sql
-- Delete specific records and purge immediately
DELETE FROM my_catalog.my_schema.customers
WHERE customer_id = 12345;

VACUUM my_catalog.my_schema.customers
RETAIN 0 HOURS;  -- Immediately remove deleted data

-- Drop entire table and purge
DROP TABLE my_catalog.my_schema.customers PURGE;
```


#### Soft Delete with Tombstones


```sql
-- Add tombstone fields
ALTER TABLE my_catalog.my_schema.customers
ADD COLUMN is_deleted BOOLEAN DEFAULT FALSE,
ADD COLUMN deleted_at TIMESTAMP,
ADD COLUMN deletion_reason STRING;

-- Soft delete with audit trail
UPDATE my_catalog.my_schema.customers
SET is_deleted = TRUE, deleted_at = current_timestamp(), deletion_reason = 'GDPR request'
WHERE customer_id = 12345;

-- Query excludes deleted records
SELECT * FROM my_catalog.my_schema.customers
WHERE is_deleted = FALSE;
```


#### Automated Retention Purging


```python
# Lakeflow pipeline for retention based purging
from databricks.sdk.python.lakehouse import *

@dlt.view
def expired_records():
    retention_days = 90
    return spark.sql(f"""
        SELECT customer_id FROM my_catalog.my_schema.customers
        WHERE created_at < date_sub(current_date(), {retention_days})
        AND retention_type = 'transient'
    """)

@dlt.table
def purge_expired():
    spark.sql("""
        DELETE FROM my_catalog.my_schema.customers
        WHERE customer_id IN (SELECT customer_id FROM expired_records)
    """)
    return spark.sql(f"""SELECT COUNT(*) as deleted FROM {dlt.table} LIMIT 1""")
```


---


### Common Exam Scenarios

Scenario 1: GDPR Deletion Request

Customer requests deletion of their data. You must delete across all systems within 30 days. Delete from production tables with PURGE, then from backups after retention expires. Log the deletion request and completion timestamp for compliance proof.

Scenario 2: Retention Window with Tombstones

Financial records must be kept for 7 years per regulation. Mark deleted with tombstone, not hard delete. After 7 years, hard delete with VACUUM. Tombstones provide audit trail during retention window.

Scenario 3: Automated Compliance Purging

Session logs older than 30 days have no compliance value. Schedule daily job to identify and delete expired sessions. VACUUM immediately to free storage. Alert if deletion fails.


---


### Key Takeaways

* Hard delete with VACUUM is unrecoverable. Use for GDPR requests and expired data past retention.
* Tombstone records preserve audit trails during retention windows without permanently removing data
* Automate retention purging with scheduled jobs to ensure compliance without manual effort
* Keep audit logs immutable and separate from operational data

---


### Gotchas and Tips


> [!NOTE]
> PURGE is Irreversible: Once you PURGE, there is no recovery. Double check your WHERE clause on non production first.


> [!NOTE]
> Deletion Auditing: Log all deletion requests with requester, reason, timestamp, and row count. GDPR audits require this documentation.


> [!NOTE]
> Backup Strategy: Backups may retain deleted data briefly. Ensure backup retention aligns with purge requirements.


---


### Links and Resources

* **[Deletion Vectors](https://docs.databricks.com/aws/en/delta/deletion-vectors)** — Efficient row-level deletion for GDPR/CCPA data purging compliance.
* **[Delta Best Practices](https://docs.databricks.com/aws/en/delta/best-practices)** — Retention policies and VACUUM strategies for data lifecycle management.
