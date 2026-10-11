# Section 2: Data Ingestion & Acquisition

> Track: Databricks Certified Data Engineer Professional | Certification Preparation Guide

---


> [!NOTE]
> **Exam Weight: 7%** — Covers ingesting diverse data formats (Delta, Parquet, ORC, AVRO, JSON, CSV, XML, Text, Binary) from message buses and cloud storage, and building append only pipelines for both batch and streaming workloads.


---



## Ingesting Diverse Data Formats


### Topic Overview

The Professional exam expects you to handle real world data coming in multiple formats from diverse sources. You need to know how to read Delta, Parquet, ORC, AVRO, JSON, CSV, XML, text, and binary files from cloud storage and message buses. This is not just about knowing the syntax. You need to understand when to use each format, how to handle schema evolution, and how Auto Loader handles discovery and ingestion at scale.

Auto Loader is the recommended pattern for cloud storage ingestion. It uses cloudFiles to discover new files efficiently, optionally infer schema from files in the source location, and can rescind corrupt or unreadable records to a rescue column instead of failing. Understanding the difference between directory listing (slower, reliable) and notification based discovery (faster, eventually consistent) matters for high throughput pipelines.

Schema inference and evolution are critical in real world pipelines. You need to know how to provide hints to the schema detection, how Spark infers types from file samples, and how to merge new columns as your upstream data changes. The exam tests whether you can build pipelines that adapt to schema changes without breaking.


---


### Key Concepts


<details>
<summary><b>File Format Trade offs: Delta vs Parquet vs ORC vs AVRO</b></summary>

Delta is the Databricks standard. It adds transactions, schema enforcement, and time travel on top of Parquet. Use it when you own the table and can enforce schema. Parquet is the industry standard columnar format. It's fast, compressed, and works everywhere. Use Parquet when you need interoperability with non Databricks tools. ORC is columnar like Parquet, slightly smaller files, but less common. AVRO is row based and includes schema in every file, making it good for Kafka or schema evolution scenarios. JSON is human readable but slower and takes more storage. Use JSON when schema is dynamic or you're integrating with APIs. CSV is still common in legacy systems but has edge cases with delimiters and escaping. Binary formats are rare in data pipelines but appear in image, audio, or proprietary data.


</details>


<details>
<summary><b>Auto Loader Discovery Modes: Directory Listing vs Notifications</b></summary>

Auto Loader uses cloudFiles with two discovery modes. Directory listing (default) checks the folder for new files every trigger. It's simple and reliable but slower for high throughput. Notification mode subscribes to cloud events (S3 EventNotifications, Azure Event Hubs, GCS Pub/Sub). It's faster and cheaper at scale because Auto Loader only processes files that were actually added. The exam tests whether you know when to pick each mode. Use notifications for streaming ingestion at scale. Use directory listing for batch or when notification infrastructure is not available.


</details>


<details>
<summary><b>Schema Inference and Evolution</b></summary>

Schema inference samples files in the source path and infers types. Spark is conservative and samples a fraction of files, so sometimes types are guessed wrong. You can provide hints via schema option. Schema evolution happens when new columns appear or types change. The mergeSchema option in spark.read accepts new columns. For Lakeflow streaming tables, the cloudFiles.schemaEvolutionMode controls how to handle schema changes: "rescue" adds an extras column for unknown fields, "evolution" merges them as new columns, and "none" fails. The exam asks which mode suits which scenario.


</details>


<details>
<summary><b>Rescue Columns and Corrupt Records</b></summary>

When Auto Loader encounters a file it cannot parse (corruption, encoding mismatch, schema mismatch), it can fail or rescind the record. The _rescued_data column is a JSON string containing the raw bytes or unparseable fields. You can then inspect, quarantine, or manually fix these records. Setting cloudFiles.inferColumnTypes helps detect type issues early. The key question is: do you want the pipeline to fail loudly or gracefully handle bad data? The Professional exam expects you to choose the right mode.


</details>


---


### Code Examples


#### Reading Different File Formats with spark.read


```python
# Delta
df_delta = spark.read.format("delta").load("/path/to/table")

# Parquet
df_parquet = spark.read.parquet("/path/to/file.parquet")

# ORC
df_orc = spark.read.orc("/path/to/file.orc")

# AVRO with schema registry
df_avro = spark.read.format("avro").load("/path/to/file.avro")

# JSON with schema inference
df_json = spark.read.json("/path/to/file.json")

# CSV with explicit schema
schema = "id INT, name STRING, age INT"
df_csv = spark.read.schema(schema).csv("/path/to/file.csv", header=True)

# Multiple files with same format
df_multi = spark.read.parquet("/path/to/dir/*.parquet")
```


#### Auto Loader cloudFiles Syntax


```python
# Basic Auto Loader with directory listing
df = spark.readStream \
  .format("cloudFiles") \
  .option("cloudFiles.format", "parquet") \
  .load("/Volumes/my_catalog/my_schema/my_volume/data/")

# Auto Loader with notifications (AWS S3)
df = spark.readStream \
  .format("cloudFiles") \
  .option("cloudFiles.format", "parquet") \
  .option("cloudFiles.useNotifications", "true") \
  .option("cloudFiles.subscriptionId", "arn:aws:sqs:....") \
  .load("s3://my-bucket/data/")

# Auto Loader with schema hints
schema = "id INT, name STRING, created_at TIMESTAMP"
df = spark.readStream \
  .format("cloudFiles") \
  .option("cloudFiles.format", "json") \
  .option("cloudFiles.schemaLocation", "/Volumes/schemas/") \
  .schema(schema) \
  .load("/Volumes/my_catalog/my_schema/my_volume/json_data/")

# Auto Loader with schema evolution
df = spark.readStream \
  .format("cloudFiles") \
  .option("cloudFiles.format", "json") \
  .option("cloudFiles.schemaEvolutionMode", "rescue") \
  .load("/Volumes/my_catalog/my_schema/my_volume/data/")
```


#### Handling Schema Evolution in Lakeflow Pipelines


```python
from databricks.sdk.python import DatabricksSession

# Lakeflow streaming table with rescue mode
df = dlt.create_streaming_table(
  name="raw_events",
  comment="Events from Event Hub with rescue column"
)

df = spark.readStream \
  .format("cloudFiles") \
  .option("cloudFiles.format", "json") \
  .option("cloudFiles.schemaEvolutionMode", "rescue") \
  .load("/Volumes/my_catalog/my_schema/my_volume/events/")

dlt.append_or_replace_table(
  name="raw_events",
  spark_df=df,
  expect_all_or_drop={"valid_json": "_rescued_data IS NULL"}
)

# Read the _rescued_data for debugging
df_with_rescue = spark.readStream \
  .format("cloudFiles") \
  .option("cloudFiles.format", "json") \
  .option("cloudFiles.schemaEvolutionMode", "rescue") \
  .load("/path/to/data/")

# Filter bad records
df_good = df_with_rescue.filter("_rescued_data IS NULL")
df_bad = df_with_rescue.filter("_rescued_data IS NOT NULL").select("_rescued_data")
```


#### mergeSchema for Dynamic Schema


```python
# Read with schema merge enabled
df = spark.read \
  .option("mergeSchema", "true") \
  .parquet("/path/to/parquet/dir/")

# For JSON, similar approach
df = spark.read \
  .option("mergeSchema", "true") \
  .json("/path/to/json/dir/")

# In streaming context with Auto Loader
df = spark.readStream \
  .format("cloudFiles") \
  .option("cloudFiles.format", "parquet") \
  .option("cloudFiles.schemaEvolutionMode", "evolution") \
  .load("/Volumes/my_catalog/my_schema/my_volume/data/")
```


---


### Common Exam Scenarios

Scenario 1: Schema Evolution Challenge

You are building a real time pipeline that ingests events from a data lake. The upstream team occasionally adds new fields to the JSON payloads without warning. Your pipeline crashes when it encounters the new fields. Which schemaEvolutionMode should you use, and why?

Use "rescue" mode. This captures unknown fields in the _rescued_data column instead of failing the pipeline. You can then decide whether to merge those fields later or quarantine records with unexpected schema. "evolution" mode would add new columns automatically, which might cause downstream issues if you have strict schema enforcement. "none" mode fails the pipeline entirely.

Scenario 2: Reducing Cloud Storage Costs

Your team ingests millions of files daily from S3. Your current Auto Loader setup uses directory listing and polls every 5 minutes, but you are paying high bills for ListObject API calls. The S3 bucket supports EventNotifications. How can you reduce costs?

Switch to notification mode. Set cloudFiles.useNotifications to true and provide the S3 EventNotifications queue ARN via cloudFiles.subscriptionId. Auto Loader will subscribe to events instead of polling. This eliminates the ListObject API calls and is much cheaper at scale. You still get reliable delivery because notifications are eventually consistent.

Scenario 3: Handling Corrupt Data

You are reading CSV files with mixed encodings (some UTF 8, some Latin 1). Some files have malformed rows. You want to extract the malformed rows for inspection without failing the entire job. How should you handle this?

Use Auto Loader with cloudFiles.schemaEvolutionMode set to "rescue". Provide a schema hint so Spark knows the expected structure. When it encounters malformed rows, they go to _rescued_data. Then filter and save records where _rescued_data IS NOT NULL to a quarantine table for manual review. This pattern keeps your main pipeline clean while capturing errors for debugging.


---


### Key Takeaways

* Auto Loader with cloudFiles is the modern, recommended pattern for cloud storage ingestion. It handles discovery, schema inference, and error handling elegantly.
* Use notification mode for high throughput at scale. Directory listing is fine for lower volume or when notifications are not available.
* schemaEvolutionMode="rescue" is your friend for real world pipelines. It lets you handle schema changes gracefully without failing the job.
* Always provide schema hints when possible. Spark's inference is conservative and can guess wrong if it only samples a few files.
* _rescued_data is a JSON string of unparseable fields. Use it to build quarantine tables for bad records, not as a production column.

---


### Gotchas and Tips


> [!NOTE]
> Notification mode is eventually consistent. Events can be delayed or arrive out of order. If you need strict ordering, stick with directory listing or add your own sorting logic downstream.


> [!NOTE]
> schemaEvolutionMode="evolution" adds new columns automatically, which can break downstream transformations that expect a fixed schema. Use "rescue" if you want to review before merging.


> [!NOTE]
> Parquet files with mergeSchema=true can be slow on large directories. Spark reads all files to infer the union of schemas. Provide explicit schemas when possible.


---


### Links and Resources

* **[Auto Loader](https://docs.databricks.com/aws/en/ingestion/cloud-object-storage/auto-loader)** — Incrementally ingesting files from cloud storage in diverse formats (JSON, CSV, Avro, Parquet).
* **[Streaming with Delta Lake](https://docs.databricks.com/aws/en/structured-streaming/delta-lake)** — Using Delta Lake as a streaming source and sink for diverse data formats.


## Append Only Pipelines (Batch & Streaming)


### Topic Overview

Append only pipelines are a fundamental pattern in data lakes. You ingest data once, and it flows into Bronze, Silver, and Gold tables without being modified or deleted. This pattern guarantees immutability and simplifies debugging because you can always replay history.

The challenge is ensuring idempotency. If your job fails and reruns, you must not duplicate records. Batch append uses INSERT INTO with deduplication logic. Streaming append uses Auto Loader with exactly once semantics via Lakeflow pipelines. The Professional exam expects you to understand the trade offs between batch and streaming, and when to combine them in a single pipeline architecture.

Append only is not just a technical pattern. It is a data governance best practice. It ensures an auditable history and makes compliance easier because you never lose data. The key is building deduplication and exactly once semantics into your pipeline from the start.


---


### Key Concepts


<details>
<summary><b>Idempotent Writes and Exactly Once Semantics</b></summary>

Idempotency means running the same operation twice produces the same result as running it once. In append only pipelines, you need to guarantee that retries do not create duplicates. Exactly once semantics (EOS) means every record is delivered and processed exactly once, no more, no less. Delta Lake provides this via transactions and checkpointing. When using Auto Loader in Lakeflow, checkpoints automatically track which files have been processed. If the job restarts, it resumes from the checkpoint rather than reprocessing the same files.


</details>


<details>
<summary><b>Batch Append vs Streaming Append</b></summary>

Batch append processes a fixed set of files in one shot. You run INSERT INTO with a WHERE clause to deduplicate by a key (usually file name or timestamp). It is simple and predictable. Streaming append processes new files continuously as they arrive. Auto Loader discovers files and Auto Loader generates micro batches. Streaming is lower latency but requires more operational overhead. Choose batch for daily or weekly ingestion. Choose streaming for real time requirements.


</details>


<details>
<summary><b>COPY INTO for Idempotent Batch Loads</b></summary>

COPY INTO is a Databricks SQL command designed for idempotent batch ingestion. It reads files from a source path and inserts only new files into the target table. It keeps an internal state of which files have been processed. If you run the same COPY INTO command twice, the second run does nothing. This is simpler than manually deduplicating with INSERT INTO WHERE.


</details>


<details>
<summary><b>Checkpointing in Lakeflow Pipelines</b></summary>

Lakeflow streaming tables automatically maintain checkpoints in a hidden directory under the Lakeflow location. The checkpoint tracks which files Auto Loader has already processed. If the pipeline restarts, it reads the checkpoint and skips already processed files. This guarantees no duplicates even if the job crashes mid execution. You do not configure checkpoints manually. They are automatic.


</details>


---


### Code Examples


#### Batch Append with INSERT INTO and Deduplication


```sql
-- Batch append with deduplication by file name
INSERT INTO my_catalog.my_schema.raw_events
SELECT * 
FROM read_files(
  '/Volumes/my_catalog/my_schema/my_volume/events/',
  format => 'json'
)
WHERE file_path NOT IN (
  SELECT DISTINCT _metadata.file_path FROM my_catalog.my_schema.raw_events
);

-- Or use a timestamp based approach
INSERT INTO my_catalog.my_schema.raw_events
SELECT * 
FROM external_table_path
WHERE ingestion_date = CURRENT_DATE()
AND NOT EXISTS (
  SELECT 1 FROM my_catalog.my_schema.raw_events re
  WHERE re.event_id = external_table_path.event_id
  AND re.ingestion_date = CURRENT_DATE()
);
```


#### COPY INTO for Idempotent Batch Loads


```sql
-- COPY INTO automatically tracks processed files
COPY INTO my_catalog.my_schema.raw_events
FROM 's3://my-bucket/data/events/'
FILEFORMAT = JSON
FORMAT_OPTIONS ('inferSchema' = 'true')
COPY_OPTIONS ('mergeSchema' = 'true');

-- Run this command multiple times safely. Only new files are added.
-- COPY INTO maintains internal state of processed files

-- For CSV with specific schema
COPY INTO my_catalog.my_schema.customers
FROM '/Volumes/my_catalog/my_schema/my_volume/customers/'
FILEFORMAT = CSV
FORMAT_OPTIONS ('header' = 'true', 'delimiter' = ',')
COLUMN_MAPPING = {
  'customer_id' : 'customer_id',
  'name' : 'customer_name',
  'email' : 'email_address'
};
```


#### Streaming Append with Auto Loader and Lakeflow


```python
# Lakeflow streaming table with Auto Loader
# Automatically handles exactly once semantics via checkpoints

df = dlt.create_streaming_table(
  name="raw_events",
  comment="Real time events from message bus"
)

df = spark.readStream \
  .format("cloudFiles") \
  .option("cloudFiles.format", "json") \
  .option("cloudFiles.schemaEvolutionMode", "rescue") \
  .load("/Volumes/my_catalog/my_schema/my_volume/events/")

# Append to target table
dlt.append_or_replace_table(
  name="raw_events",
  spark_df=df
)

# Bronze to Silver transformation (also streaming and append only)
df_silver = dlt.read_stream("raw_events") \
  .filter("_rescued_data IS NULL") \
  .select("event_id", "event_name", "timestamp", "user_id")

dlt.create_streaming_table(name="silver_events")
dlt.append_or_replace_table(
  name="silver_events",
  spark_df=df_silver
)
```


#### Combining Batch and Streaming in One Pipeline


```python
# Scenario: Ingest historical data via batch, real time data via streaming

# Batch: Catch up historical events from S3 snapshot
df_historical = spark.read.format("parquet").load("s3://my-bucket/historical/events/")
df_historical = df_historical.withColumn("_ingestion_type", lit("batch"))
df_historical.write.format("delta").mode("append").saveAsTable("my_catalog.my_schema.all_events")

# Streaming: Real time events from message bus
df_realtime = spark.readStream \
  .format("cloudFiles") \
  .option("cloudFiles.format", "json") \
  .load("/Volumes/my_catalog/my_schema/my_volume/realtime_events/")

df_realtime = df_realtime.withColumn("_ingestion_type", lit("stream"))

# Both feed the same table
df_realtime.writeStream \
  .format("delta") \
  .mode("append") \
  .option("checkpointLocation", "/Volumes/my_catalog/my_schema/my_volume/checkpoints/realtime") \
  .toTable("my_catalog.my_schema.all_events")

# Query sees unified view of both batch and streaming data
df_all = spark.read.table("my_catalog.my_schema.all_events")
```


---


### Common Exam Scenarios

Scenario 1: Batch Append with Duplicates

You run a daily batch job that loads customer records from a CRM export. Yesterday the job failed midway and you restarted it. Today you run the same job again on new data. How do you avoid loading duplicate records from yesterday?

Use COPY INTO instead of INSERT INTO. COPY INTO tracks which files it has already processed and skips them on retry. Alternatively, use INSERT INTO with a WHERE clause that checks against a file manifest table or deduplicates by a key like customer_id + last_modified_date. Always include a deduplication step in your batch logic.

Scenario 2: Streaming Pipeline Crash and Recovery

Your Lakeflow streaming pipeline processes events from a message bus. The cluster crashed while processing a batch. You restart the job. Do you risk reprocessing the same batch twice?

No. Lakeflow maintains automatic checkpoints that track the last successfully processed offset or file. When the job restarts, it reads the checkpoint and resumes from that point, not from the beginning. This guarantees exactly once semantics. You do not need to configure anything. It is built in.

Scenario 3: Combining Historical and Real Time Data

You need to load 10 years of historical events from a data warehouse export, then continuously ingest new events from a Kafka topic into the same table. How do you design this?

Use batch COPY INTO or INSERT INTO for historical data (run once). Then set up a separate streaming Lakeflow pipeline for real time events. Both write to the same target table in append mode. Lakeflow handles the checkpoint automatically so real time data starts from where historical left off. Both paths write to the same table without conflicts because they append only.


---


### Key Takeaways

* Append only is a governance best practice. It creates an immutable audit trail and simplifies replay and debugging.
* Batch append uses COPY INTO for automatic idempotency or INSERT INTO with manual deduplication logic.
* Streaming append with Lakeflow auto Loader guarantees exactly once semantics via automatic checkpointing.
* You can combine batch and streaming writes to the same table safely. Both use append mode and do not conflict.
* Always design idempotency from the start. Retries and restarts are inevitable in production.

---


### Gotchas and Tips


> [!NOTE]
> COPY INTO is only idempotent within the same source directory. If you move files or change the source path, COPY INTO may reprocess them. Use file naming conventions (dates, UUIDs) to avoid this.


> [!NOTE]
> Checkpoints are stored in the Lakeflow location. Do not delete checkpoints manually or your streaming pipeline will restart from the beginning and duplicate data.


> [!NOTE]
> Append only does not mean no deletes. You can still use time travel or maintain a separate "tombstone" table for logical deletes. But the Bronze table itself should never have UPDATE or DELETE operations.


---


### Links and Resources

* **[Streaming Tables](https://docs.databricks.com/aws/en/ldp/streaming-tables)** — Building append-only streaming pipelines for batch and streaming ingestion.
* **[Auto Loader](https://docs.databricks.com/aws/en/ingestion/cloud-object-storage/auto-loader)** — Incrementally loading new files as they arrive in cloud storage.
