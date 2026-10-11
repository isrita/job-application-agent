## OPENING (20 seconds)

**"Hi, thanks for having me, i´m a Data Engineer specialized in building cloud data pipelines with Azure Data Factory and Databricks. I leverage the full Azure stack combined with delta lake and Databricks' engine with Unity Catalog for governance. 

---
### "Tell me about yourself"

Recently, I completed a full **data platform migration to Snowflake** for a telecom client. I designed the architecture from scratch to support **real-time streaming with CDC (Change Data Capture)** in a delta lake. One of my main responsibilities was leading the full implementation and ensuring **data governance and security** for analytics and AI use cases.

I truly enjoy solving complex data challenges, optimizing performance, and building scalable cloud architectures, enabling exactly this intersection: scalable data infrastructure powering AI orchestration

---
### "Why Shokworks?"

Because the technical stack — Azure, Databricks, and Python — perfectly matches my current experience. I’m also very interested in working on global projects where I can collaborate in English and contribute with international team members to scalable, cloud-based data solutions.

---
### "Tell me about your last project"

In my most recent project at Indra, I led a **Lakehouse migration for a major financial institution** using **Azure Databricks**. One of my key achievements was delivering **$670K in cost savings** by refactoring mainframe processes, cleaning legacy pipelines, rebuilding the orchestration layer, and migrating only active workloads to Azure.

My core tech stack includes **Azure Data Factory, Databricks, Delta Lake, pyspark and SQL, along with **dimensional modeling following the Kimball methodology** and role-based access control (RBAC)** to manage user permissions and masking sensible data. 

The most challenging part was implementing real-time CDC from Oracle to Event Hub to Databricks, bringing latency down to under one minute for transaction monitoring

---
### "Describe a time you worked in a team"

At Indra, I worked on a Lakehouse migration with a distributed team across Peru, Spain, and the US—data engineers, architects, and business stakeholders from Finance and Operations. We used Agile sprints with daily standups. The hardest part was splitting the mainframe mesh to perform the migration step by step and prevent any production process from crashing.

---
### "What's your biggest strength?" technical challenge

"Problem-solving under pressure. When a 4-hour Spark job was killing our cluster, I diagnosed data skew using Spark logs, implemented salting and broadcast joins—cut it until 25 minutes the run. I like to debug methodically, detect the bootleneck and fix the root cause, "

---
### "What's your biggest weakness?"

"I can be too detail-oriented sometimes. I'll spend extra time optimizing a query that's already working enough because I know it can be better. I'm learning to balance perfection with the deathlines

---
### "Tell me about a conflict with a team member"

At **Handytec**, one of my teammates suggested running our data pipeline every 12 hours to reduce infrastructure costs.  
However, business users were requesting **manual refreshes several times a day** 

so I gathered evidence showing that there were **manual refresh requests daily**, and I calculated that switching to **hourly runs** would save **$200 per month** in infrastructure costs while eliminating delays and manual work.  

---
### "Describe a time you failed"

During a database migration project, we underestimated the complexity of the input data. Once the process started, we discovered several undocumented formats and unstructured files that required additional analysis.  
so, we had to redesign the ingestion logic and adjust our delivery timeline. Although we missed the initial deadline, we successfully delivered a stable and accurate solution to the client.  

---
### "How do you handle tight deadlines?"

I prioritize tasks based on impact and dependencies, focusing first on the task that have more dependencies and have a high impact in the business. I also communicate early with my team if exist any risks to the timeline.  

For example, during a critical migration at Indra, I delivered the core pipeline on time and then implemented performance optimizations iteratively. This ensured both timely delivery and long-term stability with feedback of the stakeholder in any step

---
### "How do you handle learning new technologies?"

I take a hands-on approach right away. I enjoy exploring new technologies on my own — setting up environments, following the documentation, breaking things, and fixing them.  
For example, when I needed to learn Unity Catalog, I spun up a Databricks workspace and practiced directly until I fully understood the concepts.  
I also stay active in data engineering communities on GitHub, Stack Overflow, and tech blogs — I learn best by doing, not just reading.

---
### How do you handle data quality issues?

 “I implement validation rules and checkpoints in the ETL process, and I monitor logs and alerts to ensure data consistency.”

---
### How comfortable are you communicating in English with international teams?

 “Very comfortable. My last roles involved daily meetings and collaboration with teams in the U.S., so English communication is already part of my routine.”

---
### "Explain your ADF incremental load implementation"

"I use the watermark pattern in ADF: two Lookups — one reads the last processed timestamp from a control table, the second gets the current max from the source. Copy Data filters with dynamic content `WHERE ModifiedDate > @{activity('LookupOld').output.firstRow.WatermarkValue}`. On success, I update the control table. This reduced processing time by 40%."

---
### "How do you implement CDC from Azure SQL?"

"I enable CDC on SQL Server, then query `cdc.fn_cdc_get_all_changes` with LSN range in ADF. I pull INSERT/UPDATE/DELETE operations and in Databricks, I MERGE into Delta tables. I use soft deletes with an `is_deleted` flag for audit trail. Checkpoint location ensures exactly-once semantics."

---
### "How do you ensure data quality?"

"I use Multi-layer: Bronze validates schema. Silver applies business rules and Gold checks referential integrity. with Automated tests compare pipeline outputs vs source—row counts, sum checks, null percentages. Fail pipeline if variance >5%. Unit tests in pydantic and pytest for complex logic."

---
### "Describe your Agile experience"

"5 years in distributed Scrum teams across LATAM and northamerica. Two-week sprints, daily standups, retrospectives. reviews witht peer review. Keep tasks small and focused. Document everything

---
### "Explain your CI/CD setup"

"Git with feature branches → develop → main. Azure DevOps triggers PR validation: linting with pylint, unit tests with pytest, notebook validation. CD deploys to Databricks via CLI. Jobs are defined as JSON in the repo and deployed with Terraform. Secrets are in Key Vault. Full traceability — every deploy is linked to a commit."

---
### "How do you optimize Spark queries?"

"I check the execution plan first. I use predicate pushdown — filtering during read. Partition pruning on partition columns. Broadcast joins for small tables under 10MB. OPTIMIZE + ZORDER BY in Delta Lake. I avoid standard UDFs because they break the Catalyst optimizer. I monitor Spark UI for data skew and use salting if needed. I enable AQE for dynamic optimization."

---

### "ROW_NUMBER vs RANK vs DENSE_RANK?"

"**ROW_NUMBER:** Unique per row, use for deduplication. **RANK:** Same rank for ties, then gaps (1,2,2,4). **DENSE_RANK:** Same rank for ties, no gaps (1,2,2,3). Use DENSE_RANK for dashboards—no confusing gaps."

---

### "Experience with Delta Lake features?"

"I use MERGE for upserts with ACID guarantees, time travel for point-in-time queries and rollback, schema evolution with `mergeSchema=True`, OPTIMIZE to compact small files, ZORDER BY for faster filtering, VACUUM to clean old versions, and deletion vectors for efficient soft deletes. I use these daily at Indra."

---
### **2. Tu historia profesional (enfocada en el perfil AI Data Engineer)**

I’ve been working as a Data Engineer for over 5 years, mainly on the Azure ecosystem — designing end-to-end data pipelines with **Data Factory, Databricks and Unity Catalog for governance in Delta Lakehouse** following the **medallion architecture**  
My focus has always been on **automation, scalability, and data quality** — implementing **incremental loads, and real-time streaming** solutions.  
More recently, I’ve been expanding into **AI-driven workflows**, building **generative AI projects and intelligent agents** using **LangChain, RAG architectures, and multi-tenant arquitecture** to bring adaptive intelligence into data pipelines.  
What really excites me about this oportunity is how you’re bridging **data engineering with applied generative AI** — that’s exactly where my recent work has been focused, and where I believe I can add the most value.

### **3. key projects

### **A. Incremental Delta Lakehouse (Azure Data Factory + Databricks)**

"In one of my main projects, I designed a full **Delta Lakehouse** on Azure using **ADF and Databricks**. 
I designed a **production Delta Lakehouse** on Azure. Built **incremental ingestion** with **watermarking and Delta merges**, cutting **ETL time by 70%** and **costs by 40%**. 

Fully automated via **Azure DevOps** with **Power BI** connected to Gold layer for **near-real-time insights**. "

**Tech Stack:**

- **Azure Data Factory**, **Azure Databricks (PySpark)**, **Delta Lake**, **Azure Data Lake Gen2**,
- **Azure Key Vault**, **Azure Active Directory (RBAC)**, **Power BI**, **GitHub Actions (CI/CD)**

**Implementation:**

> I designed and built an **end-to-end delta lakehouse pipeline** on Azure following the **Medallion Architecture (Bronze, Silver, Gold)**.  
> Data ingestion was orchestrated through **Azure Data Factory**, pulling data from multiple sources — mainly **SQL Server, APIs, and flat files in Blob Storage**.
> 
> Each batch was processed in **Databricks** using **PySpark notebooks**. I implemented **incremental ingestion** through **watermarking** and **merge (upsert)** logic in **Delta Tables**, reducing load times by over **70%** compared to full loads.
> 
> Data quality was enforced via **validation layers** that checked schema consistency and null thresholds before promoting data to the Silver layer.

> For **security**, I used **Azure Key Vault** for secrets and **RBAC** for role-based access at the dataset level and unity catalog for the Governance Layer
> 
> Finally, i implemented dimensional tables in the Gold layer were consumed in **Power BI** via **DirectQuery**, enabling near-real-time dashboards for business monitoring.
> 
> All pipelines were versioned andi deployed automatically through **GitHub Actions**, achieving full CI/CD automation. 

**Outcome:**

Delivered **production Delta Lakehouse with Unity Catalog governance**, processing **2TB+ daily** with **99.9% uptime**. Reduced **ETL time by 70%** and **cloud costs by 40%**. This **governed, incremental architecture** became the **data foundation for production AI models** and analytics

---

### **B. Real-Time CDC Streaming (Oracle → Event Hub → Databricks)**

"Another project was a **CDC streaming system** from **Oracle to Event Hub to Databricks**.  
I used **logminer connectors** and **Structured Streaming** to merge incoming events into Delta tables in real time.  
It brought latency down to less than a minute — enabling instant transaction monitoring."

**Tech Stack:**

- **Oracle DB**, **logminer Connector**, **Azure Event Hub**, **Azure Databricks (Structured Streaming, PySpark)**, **Delta Lake**, **Azure Data Lake**, **Power BI**

**Implementation:**

> This project focused on implementing **Change Data Capture (CDC)** to enable **real-time analytics** for financial transactions.
> 
> I configured a logminer connector** on top of **Oracle**, which captured inserts, updates, and deletes from transactional tables and streamed them into **Azure Event Hub** in JSON format.
> 
> Then, using **Databricks Structured Streaming**, I processed the Event Hub stream in near real time. Each message was parsed and **merged into Delta Tables** using **mergeInto** logic — ensuring the data lake always reflected the latest state.
> 
> The data was aggregated into real-time views for **fraud detection and transaction monitoring**, visualized in **Power BI streaming dashboards**.

**Outcome:**

> Reduced latency to under **one minute** between data generation and analytics availability, enabling continuous monitoring and faster decision-making.

---

### C. Generative AI for Clinical Intelligence (Healthcare Sector)

I participated in a **Generative AI project** at _Sauna Clinic_, focused on improving **clinical decision support** through automated analysis of patient data. where we built a system that automatically **summarized patient histories** and **generated risk insights** from unstructured clinical notes.  
We used **Databricks, LangChain, Azure Cognitive Search, and OpenAI models**, integrated through a **FastAPI microservice** and visualized in **Power BI**.  
It clearly showed me how **data engineering and generative AI** can converge to create explainable, high-impact solutions in sensitive domains.

****Tech Stack:**

- **Azure Databricks (PySpark, MLflow)**, **OpenAI API**, **LangChain**, **Azure Cognitive Search**, **Azure Data Lake**, **FastAPI**, **Docker**, **Power BI**, **Azure DevOps Pipelines**

**Implementation:**

> At _Clínica Sauna_, I led the design and development of the **AI-driven clinical intelligence platform**.  
   The system ingested heterogeneous datasets — **structured data** (SQL, HL7 messages, CSV) and **unstructured text** from **EHR progress notes and discharge summaries** — via **Azure Data Factory** into **Azure Data Lake** bronze layer.
> 
> Using **PySpark in Databricks**, I implemented preprocessing pipelines for **de-identification of PHI**, **tokenization of clinical terminology**, and **standardization of medical ontologies (ICD-10, LOINC)**.
> 
> A **LangChain-based RAG layer** retrieved patient-specific context from **Azure Cognitive Search**, combining embeddings with **OpenAI GPT models** to generate summaries and risk assessments.
> 
> Example output:  
> _“If one doctor writes 'high blood pressure' and another writes 'HTN', both get mapped to ICD-10 code I10 (hypertension). This allows our AI to recognize these as the same condition, improving accuracy and consistency across patient records..”_
> 
> The service was deployed via **FastAPI**, enabling clinicians to query by patient ID and retrieve **AI-generated, evidence-based summaries**.  
> All outputs were **tracked and versioned in MLflow** for auditability and clinical governance.
> 
> The results were presented in **Power BI**, combining AI insights with historical trends to support **preventive care and early intervention**.  
> Deployment and CI/CD pipelines were managed through **Azure DevOps** and **Docker containers**.

- **Embeddings generation:** Convert clinical notes → vector embeddings using OpenAI
- **Vector storage:** Azure Cognitive Search indexes embeddings
- **Retrieval:** When doctor queries patient ID → system retrieves relevant context
- **Generation:** LangChain orchestrates OpenAI GPT to generate summary

**Why RAG for Healthcare?**

> "Healthcare requires accuracy and explainability. RAG ensures the AI's responses are grounded in actual patient data. We can trace every claim back to source documents."

---
**Outcome:**

> Delivered a **clinically interpretable generative AI** that reduced **manual chart review time by over 60%**, enhanced **risk stratification accuracy**, and demonstrated how **AI and data engineering** can deliver **explainable clinical intelligence** in real-world healthcare settings.

### **D. NeuroAgent – AI Conversational System for Real Estate

My most recent project is **NeuroAgent** — a multi-tenant business assistant I built from scratch for Airbnb hosts and small hotels. It's an AI-powered system that handles guest communications intelligently using **RAG with LangChain and Qdrant for vector search**.

The architecture runs on **FastAPI with Redis for caching**, all containerized with **Docker Compose** for easy deployment. **The multi-tenant isolation works through dedicated Qdrant collections per client** — so Property A's knowledge base is completely separate from Property B's, ensuring data privacy and personalized responses based on each property's specific rules, pricing, and amenities.

It's already generating revenue from multiple clients on a **subscription-based model**. It a production system that actually solves real problems for hospitality businesses.

**Tech Stack:**

- **LangChain**, **FastAPI**, **Qdrant (Vector DB)**, **Redis**, **MySQL**, **Docker Compose**, **OpenAI API**, **Google Maps API**, **Celery**, **Nginx**, **GitHub Actions (CI/CD)**

**Architecture & Implementation:**

The core uses a **LangChain agent orchestration pattern** with custom tools I developed to handle specific business logic:

- **Location intelligence tool** — Integrates Google Maps API to provide guests with nearby attractions, restaurants, and transit info
- **Booking sync tool** — Queries MySQL in real-time to check property availability and pricing
- **Sentiment analysis tool** — Processes guest reviews using OpenAI embeddings to surface actionable insights for hosts

Each property gets its own **isolated knowledge base in Qdrant** (vector database), enabling **RAG-powered responses** that are contextually aware of house rules, check-in procedures, amenities, and pricing policies specific to that property.

**Infrastructure & Multi-Tenancy:**

I implemented **FastAPI** as the API layer, handling tenant routing, authentication, and rate limiting. **Redis** caches embeddings and frequently-accessed data to keep response times under 2 seconds even during peak loads.

The entire stack runs on **Docker Compose** with separate containers for the API, Qdrant, Redis, and **Celery workers** for async tasks like embedding generation and batch updates.

CI/CD runs on **GitHub Actions** — every merge to main triggers automated tests, builds new images, and deploys to production with zero downtime using rolling updates.

**Outcome:**

> The system now supports multiple clients, with complete data isolation.. It’s currently monetized at **$60–200/month per property**, showing the commercial potential of AI systems built on robust data engineering principles.

### **4. Closing

I can help you solve the next challenge: **feeding those agents with real-time, compliant, production-grade data** from **Delta Lakehouses with data governance**, **CDC streams**, and **enterprise systems**.

That intersection of **AI orchestration and data engineering** — that's where I think the real opportunity is, and honestly, **that's the work I'm most excited to build**.

Yo puedo aportar justo ahí: diseñando **arquitecturas modernas y gobernadas** que sirvan de base para **analítica avanzada y modelos de IA generativa**, asegurando que los datos clínicos y operativos estén siempre disponibles, seguros y listos para generar valor."_
