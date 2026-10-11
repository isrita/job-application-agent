### Guía de Estudio Técnica Avanzada: Dominio de Azure Databricks, PySpark y Delta Lake

#### 1\. Módulo 1: Fundamentos de Delta Lake y Formato de Almacenamiento

##### Contexto Estratégico y Prosa Analítica

En las arquitecturas de datos empresariales contemporáneas, el patrón Lakehouse exige desacoplar el almacenamiento de la computación sin sacrificar la integridad ACID ni la velocidad de ejecución. [Delta Lake para ETL](https://delta.io/blog/) se constituye como la capa de almacenamiento unificada del Lakehouse al abstraer los archivos subyacentes en formato abierto Apache Parquet e integrarlos dinámicamente con un log de transacciones ACID totalmente administrado (\_delta\_log). Esta arquitectura híbrida resuelve de manera definitiva las deficiencias históricas de los data lakes tradicionales basados en objetos, tales como escrituras parciales o inconsistentes por caídas de nodos, falta de aislamiento entre lectores y escritores, elevadas latencias en la gestión de metadatos y la degradación del rendimiento por la acumulación descontrolada de archivos pequeños.

##### Arquitectura Interna y Transacciones ACID

###### *El Directorio \_delta\_log y Archivos Parquet Subyacentes*

Cada tabla Delta se almacena físicamente como un directorio en el almacenamiento en la nube que contiene:

1. **Archivos de datos Parquet** : Almacenan los registros reales organizados de forma columnar.  
2. **El registro de transacciones (**  **\_delta\_log**  **)** : Un subdirectorio que contiene archivos JSON ordenados cronológicamente (por ejemplo, 00000000000000000000.json), los cuales registran de manera atómica cada modificación realizada sobre la tabla (adición o eliminación de archivos Parquet, cambios en el esquema y metadatos). De forma periódica, estos registros JSON se consolidan en archivos  *checkpoint*  en formato Parquet para acelerar la lectura del estado actual de la tabla.

###### *Las 4 Garantías ACID en Delta Lake*

* **Atomicidad** : Cada operación de escritura en el registro de transacciones se completa al 100% o se revierte por completo. Si un clúster de cómputo falla a mitad de una operación, no quedan archivos parciales huérfanos expuestos a las consultas downstream.  
* **Consistencia** : Delta Lake valida que las escrituras cumplan de forma estricta con las reglas de integridad de la tabla antes de confirmar el commit en el log.  
* **Aislamiento** : Implementa aislamiento en las transacciones mediante control de concurrencia optimista ( *Optimistic Concurrency Control*  \- OCC). Lectores y escritores operan sin bloquearse mutuamente; los lectores leen una versión inmutable del log mientras los escritores realizan commits atómicos.  
* **Durabilidad** : Una vez confirmado el commit en el almacenamiento en la nube persistente (ADLS Gen2), los cambios son permanentes y resistentes a interrupciones del sistema o fallos eléctricos.

##### Control e Integridad del Esquema

###### *Validación y Enforcement del Esquema ( Schema Enforcement )*

Para evitar la corrupción silenciosa del data lake derivada de la ingesta accidental de columnas no deseadas o tipos de datos incompatibles, Delta Lake aplica  *Schema Enforcement*  de forma explícita al momento de escribir. Si los datos entrantes no coinciden exactamente con la estructura de la tabla de destino, la ejecución se interrumpe inmediatamente y la plataforma arroja una excepción explícita:  
AnalysisException: \[\_LEGACY\_ERROR\_TEMP\_DELTA\_0007\] A schema mismatch detected when writing to the Delta table

###### *Evolución Controlada del Esquema ( Schema Evolution )*

Cuando las necesidades del negocio exigen adaptar el modelo de datos para incorporar nuevas columnas sin necesidad de reescribir la tabla completa, es posible activar  *Schema Evolution*  utilizando la opción mergeSchema:  
\# Permitir la adición explícita de nuevas columnas mediante mergeSchema  
df.write \\  
  .format("delta") \\  
  .mode("append") \\  
  .option("mergeSchema", "true") \\  
  .save("abfss://container@storageaccount.dfs.core.windows.net/data/toy\_data")

Durante este procedimiento, las filas previamente existentes en la tabla que no contengan valores para las nuevas columnas añadidas se rellenarán automáticamente con valores NULL.

##### Auditoría y Resiliencia con Time Travel

Al registrar atómicamente cada transacción en el directorio \_delta\_log, Delta Lake conserva el historial completo de versiones de la tabla. Esta capacidad permite realizar  *Time Travel*  para consultar o restaurar estados anteriores del dataset mediante la versión de la tabla (versionAsOf) o mediante marcas de tiempo exactas:  
\# Consulta histórica por versión explícita de la tabla Delta  
df\_historical \= spark.read \\  
  .format("delta") \\  
  .option("versionAsOf", 0\) \\  
  .load("abfss://container@storageaccount.dfs.core.windows.net/data/census\_data")

El mecanismo de  *Time Travel*  permite auditar transformaciones, corregir errores lógicos introducidos por desarrolladores y revertir estados dañados en producción de forma instantánea sin requerir el recomputo completo e ineficiente de los pipelines de datos.

##### Optimización del Layout Físico de Datos

###### *Compactación de Archivos Pequeños (OPTIMIZE)*

La escritura frecuente de micro-lotes genera el problema de los archivos pequeños ( *small file problem* ), lo que sobrecarga el almacenamiento con metadatos y ralentiza los tiempos de escaneo. Para resolverlo, el comando OPTIMIZE consolida físicamente múltiples archivos Parquet pequeños en archivos compactados más grandes, manteniendo como tamaño objetivo de escritura entre  **128 MB y 1 GB**  (siendo 128 MB el objetivo típico para escrituras optimizadas y 1 GB el valor por defecto estándar de OPTIMIZE):  
OPTIMIZE delta\_census;

###### *Comparativa: Partitioning Tradicional vs. Z-ORDER vs. Liquid Clustering*

Criterio / Técnica,Partitioning Tradicional (partitionBy),Z-ORDER (ZORDER BY),Liquid Clustering (CLUSTER BY)  
Mecanismo Físico,Divide los datos en subdirectorios físicos independientes basados en columnas específicas.,Co-localiza datos similares dentro de los mismos archivos Parquet organizando múltiples dimensiones.,Agrupamiento dinámico y flexible que ajusta incrementalmente la disposición de datos según los patrones de acceso.  
Cardinalidad de Columna Recomendada,"Muy  baja cardinalidad  (ej. fecha, región, país). Evitar en campos únicos o IDs.",Media a alta cardinalidad  sobre 1 o 2 columnas consultadas conjuntamente.,Alta cardinalidad  o patrones de acceso dinámicos y cambiantes.  
Mantenimiento Requerido,Estático. Cambiar las claves de partición requiere reescribir toda la tabla.,Requiere ejecuciones manuales o programadas periódicas de OPTIMIZE ... ZORDER BY.,Automático mediante  Predictive Optimization  en Unity Catalog o ejecución simple de OPTIMIZE.  
Escenarios de Uso Ideales,Tablas estables muy grandes (\>1 TB) con filtros fijos en una sola columna clave.,Tablas maduras donde los patrones de filtro en 1 o 2 columnas están completamente consolidados.,"Nuevas tablas administradas en Unity Catalog, tablas con rápido crecimiento o patrones de consulta variables."  
**Nota de Arquitectura sobre Predictive Optimization:**  Para tablas administradas en Unity Catalog, Databricks activa por defecto la función  *Predictive Optimization*  (habilitada automáticamente para cuentas creadas a partir del 11 de noviembre de 2024 y en despliegue generalizado desde mayo de 2025). Esta funcionalidad automatiza las ejecuciones de OPTIMIZE y VACUUM, eliminando la necesidad de programar trabajos de mantenimiento manuales para tablas con Liquid Clustering.

###### *Limpieza de Archivos Obsoletos (VACUUM)*

El proceso de compactación o modificación de datos genera archivos Parquet que quedan obsoletos para el estado actual de la tabla, pero se conservan temporalmente para permitir  *Time Travel* . Para liberar espacio físico en el almacenamiento en la nube, se ejecuta el comando VACUUM. Por defecto, elimina archivos obsoletos fuera del periodo de retención de seguridad (usualmente 168 horas / 7 días):  
\-- Eliminación de archivos obsoletos que superen el periodo de retención de 7 días  
VACUUM delta\_census RETAIN 168 HOURS;

##### Capa "So What?": Impacto Financiero y de Rendimiento

Optimizar la disposición física de los datos mediante OPTIMIZE, la omisión de archivos ( *file skipping* ) con  *Z-ORDER*  o  *Liquid Clustering* , y el reciclaje de espacio con VACUUM reduce de forma sustancial las llamadas I/O de red en la infraestructura subyacente de ADLS Gen2.Al evitar que los clústeres de cómputo escaneen terabytes de datos irrelevantes, las consultas de analítica avanzada y tableros BI pasan de responder en minutos a responder en segundos. Como documenta [Revefi \- Performance Tuning](https://www.revefi.com/blog/databricks-performance-tuning-cost-optimization), esta drástica reducción en los tiempos de uptime del clúster disminuye directamente el consumo de unidades de cómputo ( *Databricks Units*  \- DBUs) y máquinas virtuales asociadas, reduciendo el costo operativo global de la plataforma de datos.**Tejido Conectivo:**  Una vez garantizada la integridad ACID, la estructura correcta del esquema y el rendimiento óptimo del almacenamiento en Delta Lake, el siguiente desafío técnico consiste en ingerir grandes volúmenes de datos hacia estas tablas de forma continua, eficiente y escalable.

#### 2\. Módulo 2: Ingesta Incremental Escalable con Auto Loader

##### Contexto Estratégico y Prosa Analítica

La ingesta masiva de archivos desde sistemas origen hacia la capa inicial del data lakehouse suele enfrentarse al problema de escalabilidad en la detección de nuevos archivos. Los métodos de escaneo batch tradicionales necesitan explorar periódicamente la estructura completa de directorios en el almacenamiento en la nube (ej. ADLS Gen2, AWS S3, GCS).A medida que el volumen histórico acumula millones de archivos, este escaneo de directorios experimenta latencias excesivas, consumo desproporcionado de memoria en el nodo driver y fallos por llamadas masivas a las APIs del almacenamiento. Azure Databricks resuelve este problema técnico mediante  **Auto Loader**  (cloudFiles), una solución optimizada para la ingesta de archivos incremental, estructurada e impulsada por eventos en tiempo real o micro-lotes.

##### Mecanismos de Detección de Archivos (cloudFiles)

Auto Loader proporciona dos modos operativos para rastrear la llegada de nuevos archivos a la nube:

###### *1\. Directory Listing (Listado de Directorios)*

Auto Loader identifica nuevos archivos listando progresivamente el directorio de almacenamiento y comparando las marcas de tiempo.

* **Recomendación de uso** : Adecuado para directorios con volúmenes de archivos moderados o cuando no se disponen de permisos administrativos para aprovisionar servicios de eventos en Azure.

###### *2\. File Notification (Notificación de Archivos)*

Auto Loader configura automáticamente un servicio de notificaciones por eventos (utilizando Azure Event Grid y colas de mensajes) en la infraestructura de la nube. Cada vez que se deposita un nuevo archivo en ADLS Gen2, se emite una notificación ligera que Auto Loader consume directamente desde la cola.

* **Recomendación de uso** : Imprescindible para directorios de gran escala que acumulan cientos de miles o millones de archivos, eliminando por completo la necesidad de escanear el almacenamiento subyacente.

##### Procesamiento Incremental y Garantías Exact-Once

La integración de Auto Loader con  **Structured Streaming**  garantiza un procesamiento de datos tolerante a fallos y con semántica de procesamiento exactamente una vez ( *exact-once execution* ).  
\# Ingesta incremental optimizada utilizando Auto Loader (cloudFiles)  
df\_incremental \= (spark.readStream  
  .format("cloudFiles")  
  .option("cloudFiles.format", "json")  
  .option("cloudFiles.useNotifications", "true") \# Activación del modo File Notification  
  .option("cloudFiles.schemaLocation", "dbfs:/mnt/checkpoints/bronze\_schema")  
  .load("abfss://raw-container@storageaccount.dfs.core.windows.net/events/"))

(df\_incremental.writeStream  
  .format("delta")  
  .outputMode("append")  
  .option("checkpointLocation", "dbfs:/mnt/checkpoints/bronze\_ingest")  
  .table("bronze\_events"))

###### *Papel del Checkpointing y Registros de Estado*

* **Checkpointing** : Almacena en almacenamiento persistente el estado de la transmisión y los desplazamientos ( *offsets* ) exactos consumidos hasta el momento.  
* **Tolerancia a fallos** : De acuerdo con análisis operativos detallados por [HexaCorp \- Databricks Data Pipeline Best Practices](https://hexacorp.com/databricks-data-pipeline-best-practices/), más del  **80% de los fallos**  en trabajos de streaming son causados por errores transitorios de red o interrupción de nodos de cómputo. Si el pipeline se interrumpe, el motor de ejecución no necesita procesar los datos desde el origen; se reinicia exactamente desde el último offset registrado de forma atómica en el directorio del  *checkpoint* . Se ha demostrado que la implementación rigurosa de  *checkpointing*  y mecanismos de recuperación reduce el tiempo de recuperación ante desastres ( *Recovery Time* ) hasta en un  **50%** .

##### Capa "So What?": Implicaciones Operativas y de Costos

Elegir el método de ingesta correcto impacta de manera directa la factura de Azure y la latencia operativa. Utilizar la opción de  *File Notification*  evita millones de operaciones masivas de listado sobre las APIs de ADLS Gen2, reduciendo el costo por peticiones I/O de almacenamiento y el tiempo invertido por el nodo driver procesando metadatos.En combinación con los  *checkpoints* , las interrupciones del clúster no provocan la re-procesación duplicada de archivos ni generan inconsistencias, permitiendo estabilizar los tiempos de ingesta en SLA estrictos con clústeres de cómputo más pequeños y económicos.**Tejido Conectivo:**  Una vez que Auto Loader ingiere eficientemente los datos crudos hacia el almacenamiento Delta Lake, es imprescindible organizar y transformar progresivamente estos datos bajo una arquitectura que garantice calidad, gobernanza y valor analítico.

#### 3\. Módulo 3: Arquitectura Medallion y Pipelines ETL/ELT Robustos

##### Contexto Estratégico y Prosa Analítica

La  **Arquitectura Medallion**  (o patrón de capas Bronze, Silver y Gold) es un estándar arquitectónico clave en el Lakehouse para la estructuración lógica e incremental de los datos. El valor estratégico de esta separación por capas radica en el aislamiento de responsabilidades: los datos evolucionan desde su formato nativo inmutable hasta modelos semánticos de negocio mediante pipelines escalables. Según la guía sobre [Databricks Gold Layer Design Best Practices](https://blog.devops.dev/databricks-gold-layer-design-best-practices-explained-cd0f7852a806), este flujo progresivo previene la propagación de variaciones en el esquema ( *schema drift* ) y frena la corrosión silenciosa de datos ( *silent corruption* ), asegurando gobernanza, trazabilidad y máxima calidad en los entregables analíticos.

##### Operacionalización de las Capas Medallion

Dimensión,Capa Bronze,Capa Silver,Capa Gold  
Propósito Principal,Ingesta de datos crudos ( raw ).,"Datos limpios, consolidados y validados.",Analítica de negocio lista para consumo.  
Estado del Dato,"Solo adición ( append-only ), sin procesar.","Desduplicado, estandarizado, enriquecido.","Agregado, curado, modelado semánticamente."  
Manejo de Esquema,"Flexible, tolerante a  schema evolution .",Aplicación estricta del esquema ( schema enforcement ).,"Esquema estricto, altamente estable."  
Controles de Calidad,Validación básica de ingesta de archivos.,Validación automatizada y reglas de derivación.,Cumplimiento estricto de reglas de negocio y KPIs.  
Estrategia de Recuperación,"Re-procesamiento desde el origen, vía  checkpoints .",Reversión con  Delta Time Travel .,Refresco controlado y recomputo incremental.  
Modelo de Latencia,Streaming / Micro-lotes de alta frecuencia.,Structured Streaming / Procesamiento incremental.,Agregaciones incrementales optimizadas / Batch.  
Seguimiento de Linaje,Captura de metadatos del sistema origen.,Linaje a nivel de transformación física.,Linaje end-to-end orientado a la entidad de negocio.  
Nivel de Gobernanza,Control de acceso restringido a ingeniería.,Control de acceso basado en roles (RBAC).,"Seguridad a nivel de columna, enmascaramiento (PII)."  
Usuarios Típicos,Ingenieros de datos.,"Ingenieros de datos, analistas de datos avanzados.","Equipos BI, científicos de datos (ML), ejecutivos."  
Enfoque de Optimización,Ingesta confiable y rápida.,Corrección y consistencia de los datos.,Rendimiento de consulta y eficiencia de costo.

##### Calidad de Datos e Ingesta Declarativa con Delta Live Tables (DLT)

Delta Live Tables (DLT) simplifica la construcción de pipelines ETL/ELT al permitir una definición declarativa de las transformaciones y la integración nativa de barreras de calidad ( *Data Quality Gates* ).

###### *Expectativas de Calidad en DLT ( Expectations )*

Las expectativas son declaraciones en línea que validan la calidad de los registros conforme fluyen por el pipeline:

* **EXPECT**  **(Warn)** : Registra la métrica del fallo pero permite que el registro inválido continúe su flujo.  
* **EXPECT OR DROP**  **(Drop)** : Filtra y elimina los registros que violan la condición de calidad antes de escribir en la tabla.  
* **EXPECT OR FAIL**  **(Fail)** : Aborta inmediatamente la ejecución del pipeline si un solo registro rompe la regla de calidad.

import dlt  
from pyspark.sql.functions import col

\# Pipeline declarativo DLT demostrando las tres severidades de expectativas  
@dlt.table(  
  comment="Tabla Silver de clientes validados con Data Quality Gates estrictos."  
)  
@dlt.expect\_or\_fail("valid\_customer\_id\_format", "customer\_id IS NOT NULL")  
@dlt.expect\_or\_drop("valid\_email\_presence", "email IS NOT NULL")  
@dlt.expect("valid\_spend\_range", "daily\_spend \>= 0")  
def silver\_customers():  
    return (  
        dlt.read("bronze\_customers")  
        .select("customer\_id", "customer\_name", "email", "daily\_spend", "updated\_at")  
        .dropDuplicates(\["customer\_id"\])  
    )

###### *Patrón de Arquitectura de Cuarentena (No Bloqueante)*

Para mantener la disponibilidad de los datos en producción sin detener el pipeline por anomalías aisladas, se implementan patrones de cuarentena: los registros que incumplen las validaciones se desvían automáticamente a una tabla paralela de discrepancias (quarantine\_table) para su posterior inspección, permitiendo que el flujo limpio continúe hacia las capas Silver y Gold.

##### Gobernanza, Seguridad y Linaje con Unity Catalog

Unity Catalog centraliza la gobernanza de todos los activos de datos e IA dentro de Azure Databricks bajo un espacio de nombres de tres niveles (catalog.schema.table).

###### *Seguridad Granular y Enmascaramiento de Datos*

Permite implementar seguridad basada en roles (RBAC) y en atributos (ABAC), restringiendo el acceso mediante permisos directos:  
\-- Restricción de acceso a nivel de tabla  
GRANT SELECT ON TABLE analytics.gold.sales\_summary TO group\_analysts;

\-- Definición de máscara de datos para protección de información sensible (PII)  
CREATE MASKING POLICY email\_mask AS  
  (email STRING) \-\> CASE WHEN IS\_MEMBER('admin\_group') THEN email ELSE 'CONFIDENCIAL' END;

ALTER TABLE analytics.gold.customer\_metrics   
  ALTER COLUMN email SET MASKING POLICY email\_mask;

###### *Linaje End-to-End y Tablas del Sistema*

Unity Catalog captura automáticamente el linaje end-to-end a nivel de tabla y columna sin sobrecargar la ejecución. Este linaje se puede auditar mediante consultas SQL sobre las tablas del sistema:  
\-- Auditoría de linaje a nivel de columna desde capas de sistema  
SELECT \*   
FROM system.information\_schema.column\_lineage  
WHERE downstream\_column\_name \= 'daily\_spend';

##### Capa "So What?": Detección Temprana de Corrosión Silenciosa

Como destacan los estudios de la industria citados en [HexaCorp \- Databricks Data Pipeline Best Practices](https://hexacorp.com/databricks-data-pipeline-best-practices/), cerca del  **40% de los fallos analíticos**  provienen de controles deficientes de calidad de datos, y más del  **60% de los incidentes de datos**  permanecen inadvertidos durante días en sistemas tradicionales.Si la arquitectura Medallion no se refuerza con expectativas de DLT y segregación estricta con Unity Catalog, la  *corrosión silenciosa del dato*  (registros duplicados, nulos imprevistos, discrepancias métricas) se propaga hasta los tableros ejecutivos y modelos de Machine Learning. Prevenir esta degradación en las capas Bronze y Silver ahorra cientos de horas de depuración manual y evita la toma de decisiones empresariales basadas en información errónea.**Tejido Conectivo:**  Con los pipelines lógicos de la Arquitectura Medallion estructurados y gobernados, el siguiente paso técnico consiste en optimizar el motor de ejecución Spark que procesa las transformaciones masivas de estas capas.

#### 4\. Módulo 4: Optimización Avanzada y Performance Tuning de Trabajos de Spark

##### Contexto Estratégico y Prosa Analítica

El rendimiento de Apache Spark en Azure Databricks está supeditado a la gestión eficiente de tres recursos físicos: memoria, CPU y transferencia de red. Como analiza la guía técnica sobre [Optimización de Trabajos de Spark en Azure Databricks](https://oneuptime.com/blog/post/2026-02-16-how-to-optimize-spark-jobs-for-performance-in-azure-databricks/view), los trabajos de datos lentos o ineficientes rara vez obedecen a deficiencias del motor, sino a configuraciones subóptimas de particionado, cuellos de botella por intermedios de red ( *shuffling* ) o desbalanceos de datos ( *data skew* ). Un perfilamiento proactivo del motor Spark transforma cargas de trabajo frágiles y de alta latencia en pipelines deterministas de alto rendimiento.

##### Diagnóstico de Rendimiento mediante Spark UI

Para diagnosticar problemas de rendimiento de forma estructurada, siga el siguiente flujo de trabajo secuencial dentro de Spark UI:

1. **Acceso al Motor** : Ingrese a la consola de  *Clusters* , seleccione el clúster activo o el trabajo ejecutado y haga clic en la pestaña  **Spark UI** .  
2. **Evaluación de Volúmenes de Shuffle** : Navegue a la pestaña  **Stages**  e inspeccione las columnas  *Shuffle Read*  y  *Shuffle Write* . Las fases con volúmenes de gigabytes o terabytes transferidos indican puntos de alta sobrecarga de red por joins o agrupaciones.  
3. **Análisis de Desbalanceo (**  ***Data Skew / Stragglers***  **)** : Ingrese al detalle de las fases lentas y compare la distribución de duración de las tareas ( *Task Execution Timeline* ). Si la gran mayoría de tareas finalizan en segundos pero unas pocas ( *stragglers* ) tardan decenas de minutos, existe un desbalanceo severo de datos concentrado en pocas particiones.  
4. **Inspección del Plan Físico DAG** : Abra la pestaña  **SQL/DataFrame**  y examine el gráfico acíclico dirigido (DAG). Localice los nodos  **Exchange** , los cuales representan transferencias físicas de datos a través de la red entre executores.  
5. **Verificación de Garbage Collection (GC)** : En la pestaña  **Executors** , analice la columna  *GC Time* . Si el tiempo dedicado a la recolección de basura supera el  **10%**  del tiempo total de ejecución del executor, la carga de trabajo sufre de presión de memoria y requiere reajustar el tamaño del nodo o la memoria por core.

##### Optimizaciones del Motor de Ejecución

###### *Adaptive Query Execution (AQE)*

AQE re-optimiza dinámicamente los planes lógicos y físicos de las consultas SQL durante la ejecución basándose en las estadísticas reales recopiladas en runtime:  
\# Habilitación de características clave de AQE  
spark.conf.set("spark.sql.adaptive.enabled", True)

\# Coalescencia automática de particiones pequeñas de shuffle  
spark.conf.set("spark.sql.adaptive.coalescePartitions.enabled", True)  
spark.conf.set("spark.sql.adaptive.advisoryPartitionSizeInBytes", "128MB")

###### *Ajuste Manual de Particiones de Shuffle*

Si no se utiliza coalescencia dinámica, el valor predeterminado de spark.sql.shuffle.partitions (200) suele ser insuficiente para grandes volúmenes. Para cargas masivas, se debe dimensionar para que cada partición contenga entre  **128 MB y 200 MB** :\$\$\\text{Número de Particiones} \\approx \\frac{\\text{Volumen Total de Shuffle (GB)} \\times 1000}{128}\$\$  
\# Configuración manual optimizada para procesar grandes cruces de datos (\>100 GB)  
spark.conf.set("spark.sql.shuffle.partitions", "800")

##### Estrategias de Joins y Mitigación de Desbalanceo ( *Data Skew* )

###### *Broadcast Joins*

Cuando se cruza una tabla de hechos masiva con una tabla de dimensión pequeña, la tabla pequeña se distribuye a la memoria de todos los executores, eliminando por completo el  *shuffle*  a través de la red.  
from pyspark.sql.functions import broadcast

\# El umbral por defecto es 10 MB, pero se puede elevar manualmente si la tabla cabe en memoria  
spark.conf.set("spark.sql.autoBroadcastJoinThreshold", 100 \* 1024 \* 1024\) \# 100 MB

\# Forzar explícitamente Broadcast Join en el código  
df\_result \= fact\_sales.join(broadcast(dim\_products), on="product\_id", how="inner")

*Regla práctica* : Las tablas con un tamaño inferior a  **200 MB**  son candidatas óptimas para Broadcast Joins; para tamaños superiores, los joins de tipo  *Sort-Merge*  resultan más eficientes.

###### *Mitigación de  Data Skew : AQE Skew Join y Salting*

El  *Data Skew*  ocurre cuando una clave de join (ejemplo: un customer\_id genérico o NULL) concentra una proporción desmedida de las filas.

###### *Solución 1: AQE Skew Join (Automático)*

spark.conf.set("spark.sql.adaptive.skewJoin.enabled", True)  
spark.conf.set("spark.sql.adaptive.skewJoin.skewedPartitionThresholdInBytes", "256MB")

###### *Solución 2: Salting Manual (Técnica Sintética)*

Consiste en añadir un valor aleatorio ( *salt* ) a la clave de cruce en la tabla sesgada para redistribuir las filas uniformemente entre múltiples particiones, y duplicar la tabla de dimensión sobre el rango del  *salt* :  
from pyspark.sql.functions import col, hash, lit, pmod

\# 1\. Aplicar salt aleatorio (0 a 9\) a la tabla de hechos sesgada  
fact\_salted \= fact\_sales.withColumn(  
    "salt", pmod(hash(col("product\_id")), lit(10)).cast("string")  
)

\# 2\. Explotar la tabla de dimensión sobre el mismo rango de salt (0 a 9\)  
dim\_exploded \= dim\_products.crossJoin(  
    spark.range(10).withColumnRenamed("id", "salt").withColumn("salt", col("salt").cast("string"))  
)

\# 3\. Realizar el join sobre la clave compuesta (product\_id \+ salt) y eliminar el salt  
df\_balanced \= fact\_salted.join(dim\_exploded, on=\["product\_id", "salt"\], how="inner").drop("salt")

##### Aceleración Vectorizada con Photon

**Photon**  es el motor de ejecución nativo de Azure Databricks desarrollado en C++ para reemplazar el motor de ejecución tradicional basado en JVM.

###### *Ventajas Principales:*

* **Ejecución Vectorizada** : Procesa bloques de datos en paralelo a nivel de instrucciones de CPU.  
* **Compatibilidad Transparente** : Totalmente compatible con las APIs de Spark SQL y DataFrame; no requiere modificar código en PySpark.  
* **Aceleración de Cargas Específicas** : Ofrece el mayor retorno de inversión (ROI) en cargas con escaneos intensivos, agregaciones masivas, Joins complejos y consultas analíticas sobre Delta Lake.

##### Capa "So What?": Eliminación de Desbordamiento a Disco ( *Spill to Disk* )

Resolver la desproporción de datos y eliminar el  *shuffling*  de red previene que los executores sufran de desbordamiento a disco ( *Spill to disk: Memory/Disk* ). El  *spill*  degrada drásticamente el tiempo de procesamiento y genera fallos catastróficos de memoria agotada ( *Out Of Memory \- OOM* ).Un trabajo optimizado mediante  *Broadcast Joins* ,  *Salting*  y  *Photon*  reduce los tiempos de ejecución de horas a minutos, liberando nodos de cómputo de manera anticipada y reduciendo drásticamente el consumo global de DBUs.**Tejido Conectivo:**  El dominio del rendimiento técnico en Spark debe sincronizarse directamente con la sostenibilidad económica de la plataforma a través de una estrategia integral de FinOps y gobernanza de cómputo.

#### 5\. Módulo 5: FinOps, Gestión de Compute y Optimización de Costos en Azure Databricks

##### Contexto Estratégico y Prosa Analítica

La agilidad de la nube permite desplegar miles de núcleos de cómputo en segundos, pero la ausencia de una gobernanza de costos rigurosa conduce a gastos descontrolados. Los principios de [FinOps y Optimización de Costos en Azure Databricks](https://learn.microsoft.com/en-us/azure/databricks/lakehouse-architecture/cost-optimization/best-practices) establecen que la gobernanza no consiste en recortar recursos indiscriminadamente, sino en alinear el gasto operativo con el valor real del negocio. La gobernanza activa exige la elección precisa de los recursos de cómputo, el auto-escalado inteligente, el apagado estricto de recursos inactivos y la trazabilidad financiera granular mediante la asignación de costos a las unidades operativas responsables.

##### Elegibilidad de Recursos de Cómputo

Azure Databricks clasifica sus tipos de cómputo según el caso de uso y la arquitectura requerida:

###### *Job Compute vs. All-Purpose Compute*

* **Job Compute** : Diseñado estrictamente para la ejecución de pipelines automáticos de producción en lotes o programados vía Databricks Workflows. Se inicia automáticamente para ejecutar el trabajo y se destruye al finalizar.  **Tiene un costo por DBU sustancialmente menor**  que el cómputo interactivo.  
* **All-Purpose Compute** : Destinado al desarrollo interactivo, análisis ad-hoc y exploración en cuadernos ( *notebooks* ). Presenta tarifas de DBUs más elevadas.

###### *Databricks SQL Warehouses (Serverless vs. Classic)*

Para cargas de trabajo analíticas en SQL y dashboards BI:

* **Serverless SQL Warehouses** : Inician y escalan en cuestión de  **segundos** . Incorporan desacople total, apagan el cómputo inactivo de forma agresiva e incluyen optimización dinámica mediante Gestión Inteligente de Cargas de Trabajo ( *Intelligent Workload Management \- IWM* ) y el motor Photon por defecto.  
* **Classic SQL Warehouses** : Presentan tiempos de arranque de varios minutos, lo que a menudo provoca que los administradores mantengan los recursos encendidos durante periodos de inactividad, elevando los costos.

###### *Runtimes y GPUs*

* **Databricks Runtime (DBR)** : Runtimes actualizados periódicamente que optimizan las bibliotecas de ingeniería de datos e incrementan la eficiencia de ejecución entre versiones.  
* **Uso de GPUs** : Las instancias con GPU son significativamente más costosas que las basadas en CPU. Deben restringirse mediante políticas exclusivamente a cargas de trabajo de Deep Learning que utilicen bibliotecas aceleradas por GPU.

##### Asignación Dinámica y Mecanismos de Control

* **Auto-scaling y Auto-termination** :  
* Configurar  **Auto-termination**  en todo clúster interactivo (ej. apagar tras  **15 a 30 minutos**  de inactividad).  
* Establecer límites mínimos y máximos en el  **Autoscaling**  para evitar el aprovisionamiento ilimitado de nodos durante picos atípicos.  
* **Cluster Pools (Pozo de Clústeres)** :  
* Mantienen un conjunto de instancias de máquinas virtuales en estado preparado para reducir el tiempo de arranque de clústeres nuevos.  
* **Azure Databricks no cobra DBUs por las instancias inactivas en el Pool**  (solo aplica el costo directo de la infraestructura de máquinas virtuales del proveedor de nube), lo que optimiza el balance entre rendimiento de arranque y costo.  
* **Compute Policies (Políticas de Cómputo)** :  
* Permiten a los administradores restringir la creación de clústeres mediante plantillas estandarizadas ("T-Shirt sizes": Small, Medium, Large).  
* Imponen reglas estrictas sobre los tipos de instancia permitidos, obligan la activación del auto-apagado y limitan el número máximo de  *workers* .

##### Diseño de Cargas Eficientes y Modelos de Precios

###### *Instancias Spot vs. On-Demand*

Las instancias Spot aprovechan la capacidad ociosa de Azure con descuentos de entre el  **60% y el 90%**  en la infraestructura de computo de máquinas virtuales.

* **Patrón Recomendado** : Configurar el nodo  **Driver en On-Demand**  (para evitar la caída total del trabajo si la VM es reclamada por la nube) y los nodos  **Workers en Spot** .

###### *Streaming Eficiente con el Disparador AvailableNow*

Tradicionalmente se asocia el procesamiento en streaming con un clúster ejecutándose las 24 horas del día. Si el negocio no requiere latencia en tiempo real sub-segunda, Databricks recomienda utilizar Structured Streaming con el disparador AvailableNow:  
\# Procesamiento de micro-lotes incrementales con apagado automático del clúster  
(df\_incremental.writeStream  
  .format("delta")  
  .trigger(availableNow=True) \# Procesa todos los datos pendientes y apaga el trabajo  
  .option("checkpointLocation", "dbfs:/mnt/checkpoints/batch\_stream")  
  .table("silver\_events"))

Este patrón procesa incrementalmente todos los datos nuevos disponibles como si fuera un trabajo streaming, pero finaliza la ejecución inmediatamente al terminar, liberando el cómputo de producción.

##### Atribución de Gastos, Monitoreo y Gobernanza Financiera

###### *Estrategia de Etiquetado ( Custom Tags )*

Para imputar costos ( *chargebacks* ) a áreas específicas, se deben definir etiquetas estándar aplicadas obligatoriamente en espacios de trabajo, clústeres, SQL Warehouses y Pools:

* Business Units (ej.  *Finance, Marketing, Operations* )  
* Projects (ej.  *ChurnPrediction, SupplyChain* )  
* Environment (ej.  *Dev, QA, Prod* )Las etiquetas se propagan a los registros de uso y a la facturación del proveedor de nube de Azure.

###### *Monitoreo con Tablas del Sistema de Unity Catalog*

La tabla del sistema system.billing.usage permite consultar de manera centralizada el consumo de DBUs y correlacionarlo con las etiquetas personalizadas:  
\-- Consulta de consumo de DBUs agrupado por Unidad de Negocio y Proyecto  
SELECT  
  custom\_tags.BusinessUnits AS business\_unit,  
  custom\_tags.Projects AS project,  
  SUM(usage\_quantity) AS total\_dbus\_consumed,  
  SUM(usage\_quantity \* dollar\_offering\_id) AS estimated\_cost \-- Cálculo sobre tarifa DBU  
FROM system.billing.usage  
WHERE usage\_date \>= DATE\_SUB(current\_date(), 30\)  
GROUP BY 1, 2  
ORDER BY total\_dbus\_consumed DESC;

Adicionalmente, se deben configurar presupuestos y alertas automáticas ( *Budgets & Alerts* ) en la consola de administración de Databricks y en  *Azure Cost Manager*  para notificar por correo electrónico ante desviaciones del gasto presupuestado.

##### Capa "So What?": Reducción Directa del 40% al 70% en Costos Operativos

El impacto consolidado de la gobernanza FinOps altera de forma drástica el perfil de costos en Azure Databricks:\$\$\\text{Job Compute} \+ \\text{Workers Spot (60-90\\% desc.)} \+ \\text{Auto-termination} \+ \\text{Trigger AvailableNow}\$\$\$\$\\mathbf{\\text{Reducción del 40\\% al 70\\% en la factura global de producción.}}\$\$Esta optimización financiera libera presupuesto operativo que puede reinvertirse en el desarrollo de nuevos productos de datos, modelos de IA generativa e iniciativas analíticas de alto impacto para la organización.  
