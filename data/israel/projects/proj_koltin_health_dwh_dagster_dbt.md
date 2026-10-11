---
title: Koltin Health Data Warehouse & Governance Platform (Dagster, dbt, DuckDB & LLM)
candidate: israel
company: Koltin Health
domain: Healthcare & Senior Health Insurance (+65), Clinical Data Modeling & Preventative Care Analytics
tech_stack: [Dagster, dbt (Data Build Tool), DuckDB, Groq API (Llama 3.3-70B), Python, SQL, Git]
key_metrics: [14 Medallion dbt models (5 Bronze, 5 Silver, 4 Gold), 36 automated data quality tests (100% passing), 12,423 ICD-10 diagnostic codes mapped, 70 LLM-extracted clinical diagnoses with 85-90% confidence]
core_topics: [Data Warehouse Architecture, Dagster Asset Orchestration, dbt Data Modeling, Enterprise Data Governance, Clinical Entity Extraction with LLMs]
---

# Koltin Health Data Warehouse & Governance Platform (Dagster, dbt, DuckDB & LLM)

## Executive Summary (STAR Framework)

- **Situation:** Koltin provides private health insurance and preventative medical care memberships for senior citizens (65+ years). Disparate and evolving operational data sources (policy certificates, coverage terms, dual-generation clinical consultation records, and insurance claims) resulted in fragmented patient timelines and lacked systematic data governance. Furthermore, crucial diagnoses were buried in unstructured clinical notes without standardized ICD-10 (CIE-10) codes.
- **Task:** Design, model, and deploy an end-to-end governed Data Warehouse using dbt and Dagster on an embedded DuckDB analytical engine. Establish enterprise data governance policies, implement a unified patient journey fact table, and create an automated LLM extraction pipeline to structure clinical diagnoses.
- **Action:**
  1. **Medallion Architecture & dbt Modeling:** Built 14 modular dbt models structured across Bronze (raw source ingestion), Silver (type-casting, deduplication, standardized date ranges), and Gold layers (dimensional and fact analytics).
  2. **Comprehensive Data Governance:** Authored full enterprise governance standards (`GOVERNANCE.md`) establishing naming conventions, documentation requirements, and data retention rules. Implemented 36 automated dbt tests (testing uniqueness, not-null constraints, relationships, and accepted values) achieving a 100% pass rate.
  3. **Clinical Journey Fact & Diagnosis Dimension:**
     - Created `fact_interacciones_clinicas` (658 verified events) consolidating membership starts, consultations, and claims into a chronologically ordered longitudinal patient journey.
     - Modeled `dim_diagnosticos` mapping 12,423 standardized ICD-10 codes, capturing patient age at initial diagnosis and aggregate frequency metrics.
  4. **AI-Assisted Clinical Entity Extraction:** Integrated Groq API (powered by Llama 3.3-70B) to parse unstructured clinical text notes, automatically extracting standardized ICD-10 diagnostic codes with an 85–90% confidence score.
  5. **Orchestration:** Orchestrated the entire DAG using Dagster Software-Defined Assets (`dagster-dbt`), exposing lineage and execution monitoring via Dagster Webserver.
- **Result:** Successfully delivered a governed, production-grade Healthcare Data Warehouse. Provided Koltin executives and medical coordinators with unified visibility into member clinical journeys, claims frequency, and diagnostic patterns while automating unstructured clinical data extraction.

---

## Architecture & Data Lineage

```
[Operational Sources: Certificates, Terms, Consultations, Claims, Unstructured Notes]
                                       │
                                       ▼ (Dagster Orchestrated Ingestion)
               [Bronze Layer: Raw Source Tables in DuckDB]
                                       │
                                       ▼ (dbt Silver Transformations + Tests)
               [Silver Layer: Cleansed & Normalized Entities]
                      ├── members_cleaned
                      ├── terms_standardized
                      ├── consultations_consolidated
                      └── claims_cleansed
                                       │
                     ┌─────────────────┴─────────────────┐
                     ▼                                   ▼
          [LLM Clinical Extraction]          [Dimensional Modeling]
          (Groq / Llama 3.3-70B)                         │
          (ICD-10 Diagnostic Ingestion)                  │
                     │                                   │
                     └─────────────────┬─────────────────┘
                                       ▼
                 [Gold Layer: Business Analytics & Governance]
                      ├── fact_interacciones_clinicas (Patient Journey)
                      ├── dim_diagnosticos (12.4k+ ICD-10 Codes)
                      ├── dim_members (Demographics & Risk Tiers)
                      └── fact_diagnoses_inferidos (LLM Inferred Diagnoses)
```

---

## Technical Implementation Highlights

### 1. Unified Longitudinal Clinical Journey (`fact_interacciones_clinicas`)
```sql
-- Consolidating distinct patient touchpoints into a unified event stream
WITH Consultas AS (
    SELECT 
        member_id,
        fecha_consulta AS fecha_evento,
        'CONSULTA' AS tipo_interaccion,
        diagnostico_principal AS detalle
    FROM {{ ref('silver_consultas') }}
),
Siniestros AS (
    SELECT 
        member_id,
        fecha_siniestro AS fecha_evento,
        'SINIESTRO' AS tipo_interaccion,
        monto_reclamado::VARCHAR AS detalle
    FROM {{ ref('silver_siniestros') }}
)
SELECT 
    ROW_NUMBER() OVER (ORDER BY fecha_evento) AS interaccion_id,
    member_id,
    fecha_evento,
    tipo_interaccion,
    detalle
FROM (
    SELECT * FROM Consultas
    UNION ALL
    SELECT * FROM Siniestros
);
```

### 2. Clinical LLM Diagnosis Extraction via Groq API
```python
import os
from groq import Groq

client = Groq(api_key=os.environ.get("GROQ_API_KEY"))

def extract_icd10_diagnosis(clinical_notes: str) -> dict:
    prompt = f"""
    Analyze the clinical note below and identify the primary diagnosis.
    Output JSON with 'cie10_code', 'description', and 'confidence' (0.0 to 1.0).
    Clinical Note: {clinical_notes}
    """
    response = client.chat.completions.create(
        model="llama-3.3-70b-versatile",
        messages=[{"role": "user", "content": prompt}],
        response_format={"type": "json_object"}
    )
    return response.choices[0].message.content
```

---

## Key Interview Talking Points

1. **dbt + DuckDB in Modern Data Stacks:**
   - Leveraging DuckDB for ultra-fast, local in-process analytical queries without paying high cloud warehouse idle fees during development and prototyping.
2. **Software-Defined Assets in Dagster:**
   - How Dagster treats data assets as primary citizens (tracking data dependencies and partitions) rather than just scheduling disconnected task scripts.
3. **Automated Testing & Governance (Zero-Defect Pipeline):**
   - Maintaining 36 automated assertions across all models ensuring referential integrity and data validity before tables are queried by business analysts.
