## 1. Opening Pitch / Elevator Pitch (English)

> **Interviewer:** _"Tell me about yourself, your background in Data Engineering, and what you’re currently working on."_

### Tu respuesta (Estructura STAR / Impact-First):

I’m a Senior Data Engineer with almost 6 years of experience architecting cloud-native Lakehouse platforms, primarily on Azure and Databricks. 

My focus has been bridging the gap between legacy core business and the cloud era, modernizing transformations with Spark engine and cloud architectures to power AI products and ML models for high-impact decisions.

Currently at BPT Software, I have the role of Lead Cloud Data Engineer for Lima Airport Partners (LAP). We modernized their entire aviation operations by unifying batch and streaming telemetry from 4 sources: SAP S/4HANA, AODB, SQL Server, and SharePoint files into Azure Databricks using Auto Loader and Delta Lake.

What sets this architecture apart are three key pillars:

1. **Metadata-Driven Orchestration:** We designed a centralized control-table framework. It dynamically configures sources, sinks, UDFs, and schema contracts across all Medallion layers, 
    
2. **AI/ML Feature Foundation:** The platform directly powers real-time machine learning. By correlating AODB flight records, airport operations, and billing systems, our Databricks pipelines feed an anomaly detection and reconciliation model that recongnized mismatched passengers and revenue leaks in real time.
    
3. **AI-Native Engineering & Governance:** I embed AI directly into our stands for **Software Development Life Cycle**. We use **Google Antigravity** for complex debugging and **Claude Code** for scaffolding features. In our CI/CD pipelines with Terraform and Azure DevOps, I deployed custom AI review agents trained on our architectural rules and framework to autonomously validate team pull requests, enforce standards, and catch bugs before staging.

## 2. Technical Deep Dive: Databricks & Lakehouse Architecture (Español)

> **Interviewer:** _"Háblame de tu arquitectura en LAP con Databricks. ¿Cómo manejaron la ingesta, el modelado y la optimización de costos/rendimiento?"_

### Tu respuesta:

"En LAP implementamos una arquitectura **Medallion** sobre Delta Lake para procesar millones de eventos de telemetría y vuelos:

- **Bronze (Ingesta):** Usamos **Databricks Auto Loader** (`cloudFiles`) para procesar archivos semiestructurados de sistemas de aviación y CDC de SAP S/4HANA casi en tiempo real. Auto Loader nos garantiza inferencia y evolución de esquemas sin caídas de pipelines.
    
- **Silver (Limpieza y Feature Stores):** Limpiamos, deduplicamos y tipamos datos usando PySpark estructurado. Aplicamos **Delta Lake Liquid Clustering** (o Z-Ordering por `flight_id` y `timestamp`) para optimizar saltos de datos (_data skipping_), evitando el clásico problema de _small files_ con `auto-compaction` y `OPTIMIZE`.
    
- **Gold (Consumo Analítico y ML):** Tablas agregadas listas para consumo de BI y _Feature Stores_ para los modelos de forecasting.
    
- **Gobernanza y Costos:** Unity Catalog para control de accesos a nivel de filas/columnas y linaje de datos. Redujimos costos operativos configurando clusters con Single-Node para testing ligero y clusters autoscaling con Spot Instances para cargas pesadas de batch."
    

## 3. The Core Requirement: Data Engineering for AI & ML (English)

> **Interviewer:** _"FullStack is an AI-native company. How do you specifically support Data Scientists and ML workflows in Databricks? Have you implemented MLOps?"_

### Tu respuesta:

"In traditional setups, data engineers and ML engineers often work in silos; at LAP, we intentionally designed our data platform around the end-to-end ML lifecycle:

- **Centralized Feature Store & Ingestion:** Instead of data scientists querying tables without context, we expose governed, tables directly in Delta Lake. Using features for passenger reconciliation, turnaround times, and flight telemetry are computed incrementally via Structured Streaming and Auto Loader, ensuring consistent feature logic between training and inference without data leakage.
    
- **MLflow & Model Governance via Unity Catalog:** We use Databricks MLflow to track experiments, register schemas, and version dataset snapshots alongside model artifacts. With Unity Catalog, we establish complete lineage from the Bronze ingestion layer down to the trained model, guaranteeing strict auditability and reproducibility.
    
- **Inference Pipelines & Automated Feedback Loops:** For our operational anomaly detection and demand forecasting models, we built automated micro-batch inference jobs. The pipelines score incoming flight and billing streams against the registered production model, publish predictions back into Gold tables for real-time dashboards, and trigger automated alerts whenever data drift or operational anomalies spike."
- 
    

## 5. Behavioral: Ownership & Complex Scenarios (English)

> **Interviewer:** _"Describe a scenario where a data pipeline failed or caused latency in production. How did you handle it?"_

### Tu respuesta (STAR):

- **Situation:** In our passenger reconciliation pipeline at LAP, during peak flight windows, data processing latency jumped from 4 minutes to over 45 minutes, risking operational SLA breaches.
    
- **Task:** As lead data engineer, I had to identify the bottleneck immediately without inflating cluster compute costs.
    
- **Action:** I analyzed the Spark UI and detected extreme **data skew** caused by unbalanced partition keys during a join between SAP passenger records and flight gate logs. I implemented salting on the skewed keys and leveraged broadcast joins for dimensional lookups. Concurrently, I automated alerts in Azure Data Factory to trigger before latency thresholds were breached.
    
- **Result:** Processing time dropped back to under 3 minutes, cluster utilization stabilized, and we prevented downtime for ground operations teams.
    

## Checklist rápido para tu entrevista

1. **Números claros:** Ten en mente el impacto cuantitativo (reducción del 40% en tiempos de procesamiento, $670K ahorrados en Indra, SLAs de minutos en LAP).
    
2. **Vocabulario técnico clave:** _Delta Lake ACID transactions, Auto Loader, Liquid Clustering, Schema Evolution, Unity Catalog, Feature Store, Data Skewness, Z-Ordering, MLflow._
    
3. **Tu valor diferencial:** Tu perfil combina ingeniería de datos pesada (distribuida, escalable) con la agilidad de desarrollo mediante agentes de IA (Google Antigravity), encajando de lleno con la propuesta de FullStack.



## Requirements

- **Core:** 5+ years experience, Senior Data Engineer, Cloud-native Lakehouse, Medallion Architecture.
    
- **Stack:** Databricks, Apache Spark / PySpark, Delta Lake, Python, SQL, Azure.
    
- **Pipelines & Lakehouse:** ETL/ELT, Auto Loader, Databricks Workflows, Structured Streaming, CDC, Liquid Clustering, Unity Catalog.
    
- **AI / ML & MLOps:** Feature Engineering, Feature Store, Model Training workflows, MLflow, Serving & Inference, Data Drift.
    
- **Quality & Performance:** Performance tuning, Data Skewness, Data Quality, Monitoring & Reliability.
    
- **Software Engineering (DataOps):** CI/CD, Azure DevOps, Git, Testing, SDLC, Agile / Scrum.
    
- **AI-Enthusiastic (Bonus):** Google Antigravity, Claude Code, Agentic workflows, AI-assisted debugging / review.
    
- **Mindset:** Extreme Ownership, Forensic attention to detail, Cross-functional collaboration, Client alignment.#





role:

## Acerca del empleo

We're looking for a Senior Data Engineer to join a US-based healthcare technology company and help build and evolve the data foundation that supports Finance, Clinical and Operations reporting. You'll work in a Databricks environment with a medallion architecture (bronze/silver/gold) that is still taking shape, plus Domo for BI and analytics, and you'll integrate data from several source systems. It's a hands-on role with real ownership: you'll lead priority pipeline work and make the analytics team's data more reliable and easier to use.

  

**Responsibilities**

- Build and maintain reliable pipelines that move data from source systems into Databricks.
- Develop curated tables and data models across the bronze, silver and gold layers for reporting and analytics.
- Improve pipeline reliability, data quality and performance through validation, monitoring and troubleshooting.
- Work with analysts and business stakeholders to turn reporting requirements into technical solutions.
- Deliver dependable, analytics-ready datasets for Domo and other downstream consumers.
- Document data flows, transformations and dependencies so the team can maintain and extend the platform.

  

**Must have**

- 5+ years of data engineering experience at a senior level.
- Strong SQL and Python/PySpark skills.
- Hands-on experience building production pipelines in Databricks.
- Experience integrating multiple data sources and building analytics-ready data models.
- Familiarity with lakehouse / medallion architectures and good engineering practices: testing, version control (Git) and CI/CD.
- Able to work independently, troubleshoot problems and explain things clearly to both technical and non-technical people.
- Based in LATAM, with regular overlap with US business hours.
- Advanced English.

  

**Nice to have**

- Experience with Domo or a similar BI tool (Power BI, Tableau, Looker) and the data it needs upstream.
- Experience with healthcare, financial or operational reporting data.
- Experience handling sensitive data (PHI/PII, HIPAA) and setting up access controls (for example, Unity Catalog).
- Experience tuning Databricks workloads for performance and cost

  

  

Additional Information

This job opening includes people registered in the National Registry for Persons with Disabilities (Registro Nacional de Personas con Discapacidad – Ley N° 19.691) who meet the conditions and suitability for the position.

If you require any accommodations during the application process, please reach out to us at **accessibility@qubika.com**