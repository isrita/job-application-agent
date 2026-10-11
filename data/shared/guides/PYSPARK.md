Base:: [[B - Notas]]

**SPARK ARCHITECTURE:**
![[Pasted image 20250419124119.png]]

- **Lazy Evaluation**: Transformaciones no se ejecutan hasta una acción, spark construye un plan lógico (DAG) y espera una **acción** (`.count()`, `.show()`).
- **In-Memory**: Cache persiste RDDs/DataFrames en RAM para queries repetitivas.
- **Fault Tolerance**: Si un executor falla, el trabajo se redistribuye automáticamente.
### **Narrow vs Wide Transformations**

**Narrow Transformations**  
Operations where each partition processes only its own data, with no data movement across nodes. They execute quickly and are efficient in distributed systems.  
Common examples: **map, filter, flatMap**.

**Wide Transformations**  
Operations that require a **shuffle**, meaning data must be redistributed across partitions or nodes. These steps are more expensive and slower due to network and disk I/O.  
Common examples: **groupBy, reduceByKey, join**.

## **Data Reading**

```python
# CSV
df = spark.read.csv("path/file.csv", header=True, inferSchema=True)

# JSON
df = spark.read.json("path/file.json")

# Parquet (optimizado)
df = spark.read.parquet("path/file.parquet")

# Delta
df = spark.read.format("delta").load("path/table")
```

**Opciones clave:**

- `header=True`: Primera fila como nombres de columnas.
- `inferSchema=True`: Detecta tipos automáticamente (lento en archivos grandes—mejor definir schema manual).

## **FILTER vs WHERE**

**Ambos filtran FILAS** (son sinónimos en Spark):

```python
# FILTER (sintaxis DataFrame)
df.filter(df["age"] > 25)
df.filter((df["age"] > 25) & (df["city"] == "NYC"))  # Múltiples condiciones

# WHERE (sintaxis SQL)
df.where("age > 25 AND city = 'NYC'")
```

## **withColumnRenamed**

Renombra columnas a nivel DataFrame:

```python
df = df.withColumnRenamed("old_name", "new_name")

# Múltiples renombres encadenados
df = df.withColumnRenamed("col1", "new_col1") \
       .withColumnRenamed("col2", "new_col2")
```

---

## **withColumn**

Crea **nueva columna** o **modifica existente**:

```python
from pyspark.sql.functions import col, regexp_replace, upper, concat, lit

# Crear nueva columna
df = df.withColumn("full_name", concat(col("first_name"), lit(" "), col("last_name")))

# Modificar columna existente (limpiar texto)
df = df.withColumn("phone", regexp_replace(col("phone"), r"[^0-9]", ""))  # Solo números

# Agregar columna constante
df = df.withColumn("country", lit("USA"))

# Operación matemática
df = df.withColumn("price_with_tax", col("price") * 1.16)
```

---

## **Type Casting**

Cambia el tipo de dato de una columna:

```python
from pyspark.sql.types import IntegerType, DoubleType, DateType

# Método 1: .cast()
df = df.withColumn("age", col("age").cast(IntegerType()))

# Método 2: String shorthand
df = df.withColumn("price", col("price").cast("double"))
df = df.withColumn("date", col("date").cast("date"))
```

---

## **sort / orderBy**

Ordena filas (son sinónimos):

```python
from pyspark.sql.functions import asc, desc

# Ascendente (por defecto)
df.sort("age")
df.orderBy("age")

# Descendente
df.orderBy(desc("salary"))

# Múltiples columnas
df.orderBy(desc("salary"), asc("age"))
```

---

## **limit**

Limita número de filas (como SQL `LIMIT`):

```python
df.limit(10)  # Primeras 10 filas
```

---

## **drop**

Elimina columnas:

```python
# Una columna
df = df.drop("column_name")

# Múltiples columnas
df = df.drop("col1", "col2", "col3")
```

---

## **dropDuplicates / drop_duplicates**

Elimina filas duplicadas:

```python
# Eliminar duplicados completos (todas las columnas)
df = df.dropDuplicates()

# Eliminar duplicados por columna(s) específica(s)
df = df.dropDuplicates(["user_id", "email"])  # Mantiene primera ocurrencia
```

---

## **avg (Promedio)**

Calcula el promedio de una columna:

```python
from pyspark.sql.functions import avg

# Promedio de una columna
df.select(avg("salary")).show()

# Promedio agrupado
df.groupBy("department").agg(avg("salary").alias("avg_salary"))
```

**Funciones agregadas relacionadas:**

- `sum()`, `max()`, `min()`, `count()`, `stddev()`, `variance()` Mide la **dispersión** de los datos respecto a la media.

## **UNION / unionByName**

**union:** Combina 2 DataFrames **por posición** (columnas deben estar en el mismo orden).

**unionByName:** Combina **por nombre** de columna (orden no importa, más seguro).

```python
df1.union(df2)              # Por posición
df1.unionByName(df2)        # Por nombre (recomendado)
df1.unionByName(df2, allowMissingColumns=True)  # Permite columnas faltantes (rellena con NULL)
```

---
## **STRING FUNCTIONS**

```python
from pyspark.sql.functions import initcap, lower, upper

df.withColumn("name", initcap(col("name")))   # "john doe" → "John Doe"
df.withColumn("email", lower(col("email")))   # "USER@MAIL.COM" → "user@mail.com"
df.withColumn("code", upper(col("code")))     # "abc123" → "ABC123"
```

**Otras útiles:**

- `trim()` - Elimina espacios al inicio/final
- `length()` - Longitud del string
- `substring(col, start, length)` - Extrae substring

---
## **DATE FUNCTIONS**

```python
from pyspark.sql.functions import current_date, date_add, date_sub, datediff, date_format

# Fecha actual
df.withColumn("created_date", current_date())  # 2025-01-20

# Sumar/restar días
df.withColumn("due_date", date_add(col("order_date"), 30))      # +30 días
df.withColumn("past_date", date_sub(col("order_date"), 7))      # -7 días

# Diferencia entre fechas (en días)
df.withColumn("days_diff", datediff(col("end_date"), col("start_date")))

# Cambiar formato
df.withColumn("formatted_date", date_format(col("date"), "dd/MM/yyyy"))  # 20/01/2025
```

**Formatos comunes:**

- `yyyy-MM-dd` → 2025-01-20
- `dd/MM/yyyy` → 20/01/2025
- `MM-dd-yyyy HH:mm:ss` → 01-20-2025 14:30:00

---

## **HANDLING NULLS**

### **dropna - Eliminar filas con NULLs**

```python
# Eliminar si TODAS las columnas son NULL
df.dropna(how="all")

# Eliminar si CUALQUIER columna es NULL
df.dropna(how="any")   # Equivalente a dropna()

# Eliminar solo si columna específica es NULL
df.dropna(subset=["email", "phone"])
```

### **fillna - Rellenar NULLs**

```python
# Rellenar TODOS los NULLs con un valor
df.fillna("Unknown")            # Strings
df.fillna(0)                    # Numéricos

# Rellenar por columna específica
df.fillna({"age": 0, "name": "N/A", "salary": 0.0})

# Rellenar solo en columnas específicas
df.fillna("No Data", subset=["city", "state"])
```

---

## **SPLIT & INDEXING**

```python
from pyspark.sql.functions import split

# Datos originales
+-------------------+
| email             |
+-------------------+
| john.doe@mail.com |
+-------------------+

# Dividir string en array
df.withColumn("email_parts", split(col("email"), "@"))
+-------------------+-------------------+
| email             | email_parts       |
+-------------------+-------------------+
| john.doe@mail.com | [john.doe, mail.com] |
+-------------------+-------------------+

# Extraer elemento específico del array
df.withColumn("username", split(col("email"), "@")[0])   # john.doe
df.withColumn("domain", split(col("email"), "@")[1])     # mail.com

# Caso de uso: Separar nombre completo
df.withColumn("first_name", split(col("full_name"), " ")[0])
df.withColumn("last_name", split(col("full_name"), " ")[1])
```

**Nota:** Los índices empiezan en **0** (primer elemento = `[0]`).

## **EXPLODE**

Convierte cada elemento de un array en una **fila separada**, duplicando las otras columnas:

```python
from pyspark.sql.functions import explode

# Antes
+------+------------------+
| name | hobbies          |
+------+------------------+
| John | [gym, reading]   |
+------+------------------+

df.select("name", explode("hobbies").alias("hobby"))

# Después
+------+--------+
| name | hobby  |
+------+--------+
| John | gym    |
| John | reading|
+------+--------+
```

---

## **ARRAY_CONTAINS**

Retorna `True/False` si un valor existe en un array:

```python
from pyspark.sql.functions import array_contains

df.filter(array_contains(col("hobbies"), "gym"))  # Filtra filas donde "gym" está en hobbies
df.withColumn("has_gym", array_contains(col("hobbies"), "gym"))  # Nueva columna booleana
```

---
## **GROUPBY + Aggregations**

```python
from pyspark.sql.functions import sum, avg, count

# Agrupar y sumar
df.groupBy("department").agg(sum("salary").alias("total_salary"))

# Múltiples agregaciones
df.groupBy("department").agg(
    avg("salary").alias("avg_salary"),
    count("employee_id").alias("num_employees")
)
```

---
## **COLLECT_LIST vs COLLECT_SET**

```python
from pyspark.sql.functions import collect_list, collect_set

# Datos
+------+-------+
| name | hobby |
+------+-------+
| John | gym   |
| John | gym   |  ← Duplicado
| John | read  |
+------+-------+

# collect_list: Mantiene duplicados
df.groupBy("name").agg(collect_list("hobby").alias("hobbies"))
+------+-------------------+
| name | hobbies           |
+------+-------------------+
| John | [gym, gym, read]  |  ← Duplicados incluidos
+------+-------------------+

# collect_set: Solo valores únicos
df.groupBy("name").agg(collect_set("hobby").alias("hobbies"))
+------+-------------+
| name | hobbies     |
+------+-------------+
| John | [gym, read] |  ← Sin duplicados
+------+-------------+
```

---

## **PIVOT**

Transforma filas en columnas:

python

```python
# Antes
+------+--------+-------+
| name | metric | value |
+------+--------+-------+
| John | height | 180   |
| John | weight | 75    |
| Mary | height | 165   |
+------+--------+-------+

df.groupBy("name").pivot("metric").sum("value")

# Después
+------+--------+--------+
| name | height | weight |
+------+--------+--------+
| John | 180    | 75     |
| Mary | 165    | null   |
+------+--------+--------+
```

---

## **WHEN-OTHERWISE**

Condicionales tipo IF-ELSE:

```python
from pyspark.sql.functions import when

df.withColumn("category", 
    when(col("age") < 18, "Minor")
    .when((col("age") >= 18) & (col("age") < 65), "Adult")
    .otherwise("Senior")
)
```

---
## **JOINS**

```python
# INNER JOIN: Solo registros que coinciden
df1.join(df2, df1["id"] == df2["user_id"], "inner")

# LEFT JOIN: Todos de df1 + coincidencias de df2
df1.join(df2, "id", "left")

# RIGHT JOIN: Todos de df2 + coincidencias de df1
df1.join(df2, "id", "right")

# FULL OUTER JOIN: Todos los registros de ambos
df1.join(df2, "id", "outer")

# LEFT ANTI JOIN: Solo registros de df1 SIN coincidencia en df2
df1.join(df2, "id", "leftanti")
```

---
## **WINDOW FUNCTIONS**

```python
from pyspark.sql.window import Window
from pyspark.sql.functions import row_number, dense_rank, rank, sum as _sum

window = Window.partitionBy("department").orderBy(desc("salary"))

# row_number: 1, 2, 3, 4 (sin empates)
df.withColumn("row_num", row_number().over(window))

# dense_rank: 1, 2, 2, 3 (empates comparten rango, siguiente es consecutivo)
df.withColumn("dense_rnk", dense_rank().over(window))

# rank: 1, 2, 2, 4 (empates comparten rango, siguiente salta números)
df.withColumn("rnk", rank().over(window))

# Cumulative sum
window_cum = Window.partitionBy("user_id").orderBy("date").rowsBetween(Window.unboundedPreceding, Window.currentRow)
df.withColumn("cum_sales", _sum("amount").over(window_cum))
```

**Diferencias:**

|Salaries|row_number|dense_rank|rank|
|---|---|---|---|
|100|1|1|1|
|90|2|2|2|
|90|3|2|2|
|80|4|3|4|

---

## **USER DEFINED FUNCTIONS (UDF)**

```python
from pyspark.sql.functions import udf
from pyspark.sql.types import StringType

# Definir función Python
def clean_text(text):
    return text.strip().upper()

# Registrar como UDF
clean_udf = udf(clean_text, StringType())

# Usar en DataFrame
df.withColumn("clean_name", clean_udf(col("name")))
```

**⚠️ Advertencia:** UDFs son lentos (no optimizados por Catalyst)—preferir funciones nativas cuando sea posible.

---
## **DATA WRITING**


```python
# APPEND: Añade datos sin borrar existentes
df.write.mode("append").parquet("path/table")

# OVERWRITE: Reemplaza todo
df.write.mode("overwrite").parquet("path/table")

# ERROR: Falla si ya existe (default)
df.write.mode("error").parquet("path/table")

# IGNORE: No escribe si ya existe
df.write.mode("ignore").parquet("path/table")
```

---

## **PARQUET FORMAT**

Formato **columnar comprimido** optimizado para analytics:

```python
df.write.parquet("path/table")
df = spark.read.parquet("path/table")
```

**Ventajas:** Compresión eficiente, lectura rápida (solo lee columnas necesarias), schema incluido.

---
## **TABLES**

### **External Table**

```python
df.write.saveAsTable("db.external_table", format="parquet", path="abfss://container@account/path")
```

- Databricks gestiona **schema**.
- Datos permanecen en storage externo (no se borran al eliminar tabla).

### **Managed Table**

```python
df.write.saveAsTable("db.managed_table")
```

- Databricks gestiona **schema + datos**.
- **⚠️ Eliminar tabla borra los datos físicos**—no usar para datos críticos.

---
## **createTempView / createOrReplaceTempView**

```python
# Crear vista temporal (solo existe en sesión actual)
df.createTempView("temp_sales")

# Consultar con SQL
spark.sql("SELECT * FROM temp_sales WHERE amount > 100").show()

# Reemplazar si ya existe
df.createOrReplaceTempView("temp_sales")
```

---
- 1. While ingesting customer data from an external source, you notice duplicate entries. How would you remove duplicates and retain only the latest entry based on a timestamp column?

I first **cast the date column** to proper `DateType`, then **order the DataFrame** by `product_id` and `date` (descending), and use `dropDuplicates()` on `product_id` to keep only the **latest record**.

 - 2. While processing data from multiple files with inconsistent schemas, you need to merge them into a single DataFrame. How would you handle this inconsistency in PySpark?

I use **schema merging** by enabling `mergeSchema` while reading the files, or I apply a **standard schema** manually and use `selectExpr` or `withColumn` to align columns before union. This ensures consistent structure across all files.

- 3. What are the key differences between Spark and Hadoop MapReduce ?

Spark performs in-memory computation with DAG execution, making it faster and ideal for iterative and streaming workloads, while MapReduce is disk-based, follows a rigid Map → Shuffle → Reduce flow, and is better suited for batch processing.

- 4. You are working with a real-time data pipeline, and you notice missing values in your streaming data Column - Category. How would you handle null or missing values in such a scenario?

In a streaming pipeline, I handle missing values in the `Category` column using **`fillna({'Category': 'N/A'})`**, which replaces nulls with a default label like `"N/A"` to maintain data consistency without interrupting the stream.

- 5. You need to calculate the total number of actions performed by users in a system. How would you calculate the top 5 most active users based on this information?

I use **`groupBy('user_id')`** with **`count()`** to get the number of actions per user, then apply **`orderBy(desc('count'))`** and **`limit(5)`** to return the top 5 most active users.

- 6. While processing sales transaction data, you need to identify the most recent transaction for each customer. How would you approach this task?

I **cast the date column**, then use **`dense_rank()`** over a **window partitioned by `customer_id`** and ordered by `transaction_date` descending. Finally, I **filter where rank = 1** to keep only the latest transaction for each customer.

- 7. You need to identify customers who haven’t made any purchases in the last 30 days. How would you filter such customers?

 To filter customers who haven’t purchased in the last 30 days, I **convert `last_purchase_date` to date**, then use **`datediff()`** to calculate the gap from today. Finally, I **filter where the gap is greater than 30**.

- 8. While analyzing customer reviews, you need to identify the most frequently used words in the feedback. How would you implement this?

To find the most frequent words in customer feedback, I **convert text to lowercase**, then **split and explode** the feedback into individual words. Finally, I **group by word** and use `count()` to get the frequency of each term.

- 9. You need to calculate the cumulative sum of sales over time for each product. How would you approach this?

To calculate cumulative sales over time per product, I **cast the date column**, then use a **window function** with `sum('sales')` over a window **partitioned by `product_id` and ordered by `date`** to generate the running total.

- 10. While preparing a data pipeline, you notice some duplicate rows in a dataset. How would you remove the duplicates without affecting the original order?

To remove duplicates without affecting the original order, I use **`row_number()`** over a **window partitioned by the duplicate column (`name`)** and **ordered by a stable column like `age`**. Then I **filter where `row_number` = 1** to keep the first occurrence.

- 11. You are working with user activity data and need to calculate the average session duration per user. How would you implement this?

To calculate average session duration per user, I use **`groupBy('user_id')`** and apply **`avg('duration')`**, renaming it as `avg_duration` for clarity.

- 12. While analyzing sales data, you need to find the product with the highest sales for each month. How would you accomplish this?

I convert the date, extract the month, and group by `month` and `product_id` to sum sales. Then I use `dense_rank()` over a window partitioned by `month`, ordered by sales descending, and filter where rank = 1 to get the top product per month.

- 13. What is the role of SparkContext in PySpark ?

**SparkContext** is the entry point to PySpark. It manages the connection to the Spark cluster and coordinates resources and job execution.

-  14. You are working with a large Delta table that is frequently updated by multiple users. The data is stored in partitions, and sometimes updates can cause inconsistent reads due to concurrent transactions. How would you ensure ACID compliance and avoid data corruption in PySpark?

To ensure **ACID compliance** and avoid inconsistencies with concurrent updates, I use **Delta Lake’s `merge` operation**. It performs atomic **upserts** using a match condition, and Delta handles **concurrent transactions** with **optimistic concurrency control** and **transaction logs**, preventing data corruption.

- 15.  You need to process a large dataset stored in PARQUET format and ensure that all columns have the right schema (Almost). How would you do this?

To ensure correct schema when reading a Parquet file, I use **`.option("inferSchema", True)`** with `spark.read.format("parquet")`. This automatically infers column types based on the file content.

- 16. You are reading a CSV file and need to handle corrupt records gracefully by skipping them. How would you configure this in PySpark?

To handle corrupt CSV records gracefully, I set **`.option("mode", "DROPMALFORMED")`** when reading the file. This skips bad records without failing the job, ensuring smooth ingestion.

- 17. Tell us about SPARK SESSION ?

**SparkSession** is the **entry point to PySpark**. It allows you to create DataFrames, run SQL queries, read data from various sources, and manage Spark configurations. It replaces older contexts like `SQLContext` and `HiveContext` by unifying them into a single API.

- 18. Difference between wide transformations and narrow transformations ?

**Narrow transformations** (e.g., `map`, `filter`) operate on a single partition without shuffling data.  
**Wide transformations** (e.g., `groupByKey`, `reduceByKey`, `join`) require **data shuffling** across partitions, which is more expensive and impacts performance.

- 19. What is the use of COALESCE and REPARTITION?

**`coalesce(n)`** reduces the number of partitions without full shuffle—used for optimizing writes.  
**`repartition(n)`** increases or reshuffles partitions with a full shuffle—used for load balancing or parallelism.

- 20. When to use CACHE and PERSIST? 

Use **`cache()`** when you want to store DataFrame **in memory only** for repeated use.  
Use **`persist()`** when you need more control—e.g., storing data in **memory and disk** or other storage levels if memory is limited.

- 21. What is the importance of PARTITIONS in PYSPARK?

**Partitions** are the core of parallelism in PySpark. They divide the data into chunks, allowing Spark to **process tasks in parallel** across the cluster. Proper partitioning improves performance in **joins, shuffles, and writes**, and helps avoid data skew.

- 22. You have a dataset containing the names of employees and their departments. You need to find the department with the most employees.

I use **`groupBy('department')`** with **`count()`** to get the employee count per department, then apply **`orderBy(desc('count'))`** and **`limit(1)`** to find the department with the most employees.

- 23. While processing sales data, you need to classify each transaction as either 'High' or 'Low' based on its amount. How would you achieve this using a when condition

I use **`withColumn()`** and apply a **`when` condition** to create a new column `price_cat`. If `sales > 50`, it's labeled `"High"`, otherwise `"Low"`

- 24. While analyzing a large dataset, you need to create a new column that holds a timestamp of when the record was processed. How would you implement this and what can be the best USE CASE?

I use **`withColumn('processed_time', current_timestamp())`** to add a timestamp when each record is processed.

- 25. You need to register this PySpark DataFrame as a temporary SQL object and run a query on it. How would you achieve this?

I use **`df.createOrReplaceTempView('')`** to register the DataFrame as a temporary SQL view and run queries using **`spark.sql()`**. To access the view across multiple notebooks or sessions, I use **`createOrReplaceGlobalTempView('')`**.

- 27. You are ingesting data from an external API in JSON format where the schema is inconsistent. How would you handle this situation to ensure a robust pipeline?

I enable **schema inference** and use **`schema_of_json()`** with **`from_json()`** to dynamically parse records. For flexibility, I also enable **`multiline`** and **`schema evolution`** to handle structural changes without breaking the pipeline.

- 28. While reading data from Parquet, you need to optimize performance by partitioning the data based on a column. How would you implement this?

To optimize performance, I use **`partitionBy('category')`** when writing the Parquet file.

- 29. You are working with a large dataset in Parquet format and need to ensure that the data is written in an optimized manner with proper compression. How would you accomplish this? 

I write the DataFrame using **`.write.format("parquet")`** with **`.option("compression", "snappy")`** for efficient storage. Offers a good balance between speed and compression

- 30. Your company uses a large-scale data pipeline that reads from Delta tables and processes data using complex aggregations. However, performance is becoming an issue due to the growing dataset size. How would you optimize the performance of the pipeline?

 I use **`OPTIMIZE delta_table ZORDER BY ('order_date')`** to physically organize data on disk by `order_date`. This helps Spark **read only the necessary data** when filtering, reducing scan time and improving performance

- 31. What are broadcast variables, and why are theu used ?

**Broadcast variables** are used to **share small lookup data** (like reference tables) across all worker nodes efficiently. They help avoid **sending the same data multiple times**, reducing **network I/O** and improving performance in joins or filters.

- 32. What is the difference between df.show() and df.collect() ?
**`df.show()`** displays a sample of the DataFrame (default 20 rows) in the console
**`df.collect()`** retrieves **all rows** to the driver, which can cause **memory issues**

- 33. What are the advantages of Delta Lake over traditional file formats?

**ACID Transactions** for reliable and consistent writes
**Schema Enforcement & Evolution** to handle data structure changes safely
**Time Travel** to query historical versions of data
**Efficient Upserts & Deletes** using `MERGE`
**Automatic File Management** with `OPTIMIZE` and `VACUUM`

- 34. What happens when a PySpark job runs out of memory ?

When a PySpark job runs out of memory, it may trigger **GC (Garbage Collection) overhead**, cause **task failures**, or lead to a full **job crash** with `OutOfMemoryError`. To fix it, you can **optimize partitions**, use **persist with disk**, or **scale up executor memory**.

- 35. What is AQE in PySpark ? What is it useful ? 

**AQE (Adaptive Query Execution)** in PySpark is a feature that **dynamically optimizes query plans at runtime** based on actual data stats.  
It improves performance through:
**Dynamic Partition Pruning**
**Optimized Join Strategies** (e.g., switching to broadcast joins)
**Skew Join Handling** by splitting skewed partitions

- 36. What is broadcast join, and when should you use it ?

**Broadcast join** sends a small DataFrame to all worker nodes, avoiding shuffles.  
Use it when one side of the join is **small enough to fit in memory**, improving performance in large-to-small joins.

- 37. What is spill in Spark, and why does it happen ?

**Spill** in Spark happens when **data doesn’t fit in memory** during operations like shuffles, aggregations, or joins. Spark **writes intermediate data to disk** to avoid `OutOfMemoryError`.

- 38.  You are processing sales data. Group by product categories and create a list of all product names in each category ?

I use **`groupBy('category')`** and apply **`collect_list('product')`** to aggregate all product names into a list for each category. This gives a grouped view of products per category.

- 39. You are analyzing orders. Group by customer IDs and list all unique product IDs each customer purchased?

I use **`groupBy('customer_id')`** with **`collect_set('product_id')`** to get a list of **unique products** purchased by each customer. This avoids duplicates in the output.

- 40. For customer records, combine first and last names only if the email address exists ? 

I use **`withColumn()`** and a **`when` condition** to check if the email is not null, then **`concat(first_name, last_name)`**. If email is missing, I return null or skip the row.

- 41.  You have a DataFrame containing customer IDs and a list of their purchased product IDs. Calculate the number of products each customer has purchased.

I use **`withColumn()`** with **`size(col('product_ids'))`** to count the number of products in each customer's list.

- 42. You need to validate phone numbers by checking if they start with "91"

I use **`filter()`** with **`substring(col('phone_number'), 1, 2) == "91"`** to select phone numbers that start with "91".

- 43.  You have a dataset with primary and secondary contact numbers. Use the primary number if available; otherwise, use the secondary number.

I use **`withColumn()`** and **`coalesce(col('prim_contact'), col('sec_contact'))`** to create a new column that takes the primary number if present, otherwise the secondary.

- 44. You are categorizing product codes based on their lengths. If the length is 5, label it as "Standard"; otherwise, label it as "Custom"

I use **`withColumn()`** with **`when(length(col('product_code')) == 5, "Standard")`**, otherwise `"Custom"`, to categorize each product code based on its length.

 