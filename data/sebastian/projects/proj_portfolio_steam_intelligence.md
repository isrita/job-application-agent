---
title: Steam Intelligence — Game Niche Detector & Tag Mining
candidate: sebastian
repository: bona1204/Portafolio (steam_intelligence)
domain: Market Intelligence & Association Rule Mining
tech_stack: [Apriori Algorithm, K-Means Clustering, Prefect, SteamSpy API, DuckDB, dbt, Streamlit]
key_metrics: [Tens of thousands of game tags, automated Prefect pipelines]
core_topics: [Unsupervised ML, Association Rule Mining, Workflow Orchestration, dbt Models]
---

# Project STAR: Steam Intelligence — Game Niche Detector & Tag Mining

- **Repository:** [bona1204/Portafolio](https://github.com/bona1204/Portafolio) (`projects/steam_intelligence`)
- **Candidate:** Sebastian Bonilla
- **Domain:** Market Intelligence, Unsupervised ML & Association Rule Mining
- **Tech Stack:** Apriori Algorithm, K-Means Clustering, Prefect, SteamSpy API, DuckDB, dbt, Streamlit

---

## 1. Situation (Context & Problem)
Indie video game developers face high failure rates on Steam due to oversaturated genres or poor game tag positioning. Identifying viable, underserved market niches requires mining tens of thousands of tag combinations, owner estimates, and player review sentiment.

---

## 2. Task (Objectives & Responsibilities)
- Ingest Steam store catalogue and player ownership metrics via the SteamSpy API using modern workflow orchestration.
- Discover high-affinity tag combinations and genre clusters using association rule mining and unsupervised clustering.
- Model market viability scores to highlight underserved niches with high owner-to-competitor ratios.
- Automate scheduled pipeline execution with Prefect.

---

## 3. Action (Architecture & Technical Implementation)
1. **Orchestrated Ingestion with Prefect:**
   - Designed modular Prefect flows and tasks with automatic retries and rate-limiting to ingest SteamSpy catalog data reliably.
   - Stored raw JSON responses in DuckDB analytical tables.
2. **Association Mining & Clustering Algorithms:**
   - Implemented the Apriori algorithm to discover frequent itemsets and strong association rules (support, confidence, lift) among game tags.
   - Applied K-Means clustering on tag co-occurrence matrices to segment games into distinct thematic and gameplay clusters.
3. **Data Transformation & Insights Marts:**
   - Used dbt SQL models on DuckDB to compute competitive density and revenue potential indices across clusters.
   - Built a Streamlit exploration interface allowing developers to evaluate intended tag combinations.

---

## 4. Result (Impact & Demonstrations)
- Reliable, automated workflow execution managed by Prefect.
- Actionable market intelligence platform demonstrating advanced unsupervised learning, association mining, and data orchestration.
