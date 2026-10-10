vBase:: [[B - Notas]]

SOURCE > DATA FACTORY > DESTINATION

**Data Lake (ADLS Gen2)** supports hierarchical namespace, fine-grained ACLs, and is optimized for big data analytics.  
**Blob Storage** is general-purpose object storage without hierarchical file structure, better suited for unstructured data like images or backups.

**Linked Service** is the connection configuration to external data sources (like SQL, ADLS, Blob).  
**Dataset** represents the structure of data within that source (like a table or file path) used by activities in the pipeline.

**If Condition** in ADF is a control activity that executes different branches (true/false) based on an expression evaluation. Have a lot of functions 

**ForEach** in ADF is a control activity that iterates over a collection of items and executes inner activities for each item sequentially or in parallel. Have a lot of functions 

**Data Flow** in ADF is a visual activity used to design and execute scalable data transformation logic on big data without writing code, running on Spark clusters.

**Triggers** in ADF are used to automatically start pipelines based on a schedule, event, or tumbling window logic. Can support near real-time execution using Event-based Triggers.

**Set Variable Activity** in ADF is used to assign or update the value of a **pipeline variable** during execution, enabling dynamic control within the workflow.

**Storage Event Trigger** in ADF listens for real-time file changes (like creation or deletion) in Azure Storage and automatically triggers pipelines when events occur.

You can **parallelize your pipeline in Azure Data Factory** by using the **ForEach Activity** with the **“Batch Count”** property set to greater than 1. This allows multiple iterations to run in parallel instead of sequentially.

Example:
- Inside a ForEach loop, set `Batch Count = 10` to process 10 items in parallel.
- Ensure the activities inside are **idempotent** and don’t depend on each other.

Also, in **Copy Activity**, enable **parallel copy** by setting the **“Degree of Copy Parallelism”** to boost performance when copying large data.

**Execute Pipeline Activity** in ADF is used to **invoke and modularize another pipeline** from a parent pipeline, enabling **reusability, orchestration control**, and **hierarchical pipeline design** for complex workflows.

---

- What are the different types of Integration Runtimes (IR) in ADF, and when should you use each?

**Azure Integration Runtime (Azure IR)** in ADF is a fully managed compute environment used for data movement and transformation between cloud data stores.  
Use it when moving data between cloud sources or running Data Flows and transformations in Azure.
**Self-Hosted Integration Runtime (SHIR)** in ADF is a runtime installed on your own server or VM to connect securely to on-premises or private network resources.  
Use it when accessing on-prem data sources like SQL Server, Oracle, or file systems.
**Azure-SSIS Integration Runtime (SSIS IR)** in ADF is a runtime for executing existing SSIS packages in a fully managed Azure environment.  
Use it when migrating or running legacy SSIS ETL workloads in the cloud.

- How would you handle schema drift in Azure Data Factory when dealing with evolving datasets?

**Schema Drift** in ADF refers to changes in source data structure (e.g., new, missing, or reordered columns).  
In **Mapping Data Flows**, enable **"Allow schema drift"** to dynamically handle changing columns without hardcoding mappings.  
Use **Auto Mapping** or **dynamic column patterns** (like `byName()`) to adapt to evolving schemas.  
Combine with **Derived Column** and **Select** transformations to control or exclude certain columns.  
 For safety, implement **schema validation logic** or **logging** to detect and respond to unexpected changes.

- How would you load multiple data files from REST APIs using single Copy Activity

To load multiple data files from REST APIs using a single **Copy Data activity**, I use a **parameterized REST dataset** and pass dynamic URLs with `@item().relativeUrl`. Inside a **ForEach**, the Copy Activity iterates through each endpoint. We store the data directly in **GitHub** (as a source of metadata or to load into a repo), or use it to drive the list of URLs. This setup avoids hardcoding and scales easily with evolving APIs.

- How would you design a fault-tolerant ADF pipeline to process billions of records daily?

To design a fault-tolerant ADF pipeline for processing billions of records daily:
**Retry Policy**: Configure retry logic on activities to automatically handle transient failures (e.g., 3 retries with exponential backoff).
**Alerts & Monitoring**: Integrate with Azure Monitor and Log Analytics to trigger alerts on failures or performance drops.
**Parallelism**: Use ForEach with batch settings and Data Flows with partitioning to maximize throughput and distribute load efficiently.
**Failure Notification**: Add webhook/email/Teams alerts using Logic Apps or ADF Web activities to notify teams of errors in real-time.

- How would you implement incremental data load in ADF when working with large transactional databases?

I use two main methods:
**Watermarking** – Track the last loaded timestamp or ID using a control table or pipeline variable, and filter new records in the source query.  
**Change Data Capture (CDC)** – Leverage native CDC features (like in SQL Server or Oracle) or tools like **LogMiner** to capture and load only changed rows.

- You have a JSON file with an unknown structure. How would you process it in ADF?

If I have a JSON file with an unknown structure in ADF, I use **Debug mode** in **Mapping Data Flows** to inspect the schema at runtime.  
Then, I apply the **Flatten** transformation to extract nested arrays or objects and convert them into a tabular format for further processing.

- How would you implement a real-time streaming pipeline in ADF using ADF only? 

To implement real-time streaming in ADF using ADF only, I use an **Event-Based Trigger** connected to a storage account. When a new file arrives, the trigger automatically starts the pipeline. This enables near real-time processing without constant polling or manual intervention.

- How would you load data to different locations based on the file name?

To load data to different locations based on the file name in ADF, I use **Get Metadata** to fetch the file name, then a **ForEach** to iterate through files. Inside it, I add a **Switch activity** to route logic based on the file name pattern, and use separate **Copy Data activities** to load each file to its corresponding destination.

- How would you store all the file names in a variable and number of files in the folder?

To store all file names and the number of files in a folder, I use **Get Metadata** with the **child items** field to list files. Then, inside a **ForEach**, I **append file names** to a string variable. After the loop, I use the **length()** function to store the **file count** in another variable.

- You need to save the logs of the pipelines. How would you do that ? 

To save pipeline logs in ADF, I can use different approaches depending on the use case:
**Watermarking + Stored Procedure**: After a successful load, I call a stored procedure to log metadata like pipeline name, status, row count, and watermark value into a SQL table for auditing and incremental load tracking.
**Empty Files with Additional Columns**: I create a **Copy Data** activity that writes an empty file with metadata columns (e.g., pipeline ID, file name, timestamp) to a log folder — useful for file-based tracking.
**Copy Activity Logging Settings**: I enable **logging in the Copy Activity**, configuring it to write activity run details (like source, sink, rows copied) to a defined **Blob or ADLS folder path** for monitoring and debugging.

- How would you secure sensitive connection strings and credentials in ADF ?

To secure sensitive connection strings and credentials in ADF, I use **Azure Key Vault** to store secrets and reference them securely in linked services. I also enable **Managed Identities** to let ADF authenticate to Key Vault or other services without hardcoding credentials.

- You need to copy millions of record from an on-prm SQL Server to Azure Data Lake daily. How would you optimize the copy Activity to reduce execution time ?

To copy millions of records daily from on-prem SQL Server to Azure Data Lake, I optimize the **Copy Activity** by enabling **Staging** using Azure Blob as an interim store. This allows **parallel reads and writes**. I also use **Bulk Insert** to speed up data extraction on the source side, reducing overall execution time.

-  How would you integrate Databricks with ADF? Also, it sometimes fails due to transient issues. How would you handle this ?

To integrate Databricks with ADF, I use a **Databricks Notebook activity** with a **linked service** that authenticates via token or Azure Managed Identity. To handle transient failures, I configure **retry policies** in the activity settings.

- You need to move data from a rest API that paginates responses. How would you handle this in ADF ?

To move data from a REST API with pagination in ADF, I use **Copy Data** with **REST as the source**, and configure **pagination rules** like `nextPage` or `absoluteUrl` under the **source settings**. This allows ADF to automatically follow each page and retrieve the full dataset.

- How would you delete only those files which are older than 10 days ?

To delete files older than 10 days in ADF, I use **Get Metadata** to retrieve file **last modified dates**, then iterate with a **ForEach**. Inside, an **If Condition** checks if the file is older than 10 days using `@less(activity('Get Metadata').output.lastModified, addDays(utcNow(), -10))`, and deletes it with a **Delete activity** if true.

- You need to copy only those files which aare not available in the destination ?

To copy only files not available in the destination, I use **Get Metadata** on both **source and sink** to list file names. Then, I compare them using a **Filter activity** to exclude files that already exist in the sink. Only the new files are passed to the **Copy Data activity**.

- How would you call the secrets stored in the KeyVault in ADF ?

To call secrets from Key Vault in ADF, I first **create the secret** in Key Vault and assign ADF’s **Managed Identity with GET access**. Then, I use a **Web Activity** with the Key Vault REST API to retrieve the secret, and **store it in a variable** using a **Set Variable activity** for downstream use.

- Your pipeline processes large datasets and sometimes runs out of memory. How would you avoid this ?

If the pipeline runs out of memory with large datasets, I enable **partitioning in Mapping Data Flows**. This breaks the data into smaller chunks, processed in parallel across Spark clusters, reducing memory pressure and improving performance.

- Your pipeline runs daily, but sometimes the records get processed twice. How would you ensure idempotency ?

To ensure idempotency and avoid duplicate processing, I use **Upsert (MERGE)** logic in the sink, typically with a unique key. This guarantees **exactly-once processing**. I also enable this using **inline datasets** in Mapping Data Flows or stored procedures to handle inserts and updates conditionally.

- Your ADF pipeline must process files in a specific order (e.g., first "header.csv" then "data.csv") How would you enforce this ?

To process files in a specific order in ADF (e.g., "header.csv" before "data.csv"), I use a **ForEach activity** with **sequential execution enabled**.

- You have 2 different files having different schemas. You need to process both the files using single Copy Activity (with Mapping)

To process two files with different schemas using a single **Copy Activity**, I use **Get Metadata** to retrieve file names, loop through them with a **ForEach**, and configure a **dynamic source and sink** in the Copy Activity. I apply **schema mapping dynamically** using expressions or parameterized datasets based on the file name.





