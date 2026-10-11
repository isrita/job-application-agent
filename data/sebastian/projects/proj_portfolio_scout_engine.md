---
title: Scout Engine — Football Player Similarity & Breakout Watch
candidate: sebastian
repository: bona1204/Portafolio (scout_engine)
domain: Sports Analytics & Machine Learning
tech_stack: [DuckDB, dbt Core, SCD Type 2, scikit-learn, k-NN, K-Means, Streamlit, Parquet]
key_metrics: [27K+ player seasons across 6 leagues, zero cluster costs, millisecond similarity retrieval]
core_topics: [In-process OLAP, Incremental dbt, SCD2 Snapshots, Vector Similarity Search]
---

# Project STAR: Scout Engine — Football Player Similarity & Breakout Watch

- **Repository:** [bona1204/Portafolio](https://github.com/bona1204/Portafolio) (`projects/scout_engine`)
- **Candidate:** Sebastian Bonilla
- **Domain:** Sports Analytics, Machine Learning & Analytical Modeling
- **Status:** Live Deployment
- **Tech Stack:** DuckDB, dbt (incremental models & snapshots), scikit-learn (k-NN, K-Means), Streamlit, Parquet, Python, Pytest

---

## 1. Situation (Context & Problem)
Traditional sports analytics scouting tools are either expensive enterprise platforms or slow to calculate multi-dimensional player similarities over large historical datasets. 
- Over 10 years of expected goals (xG), assists (xA), and match statistics across the top 6 European leagues (2014–2025) needed fast, in-memory analytical querying without expensive cloud cluster infrastructure.
- Needed a "Breakout Watch" feature to track year-over-year attacking output improvements and player team changes over time.

---

## 2. Task (Objectives & Responsibilities)
- Architect a local-first, lightweight data pipeline that eliminates cluster overhead by using DuckDB and Parquet.
- Build incremental dbt models and Slowly Changing Dimensions (SCD Type 2) to track mid-season transfers and player history.
- Train nearest-neighbor (k-NN) similarity search algorithms and unsupervised clustering models (K-Means) on normalized player performance vectors.
- Deploy an interactive, responsive Streamlit dashboard on Streamlit Community Cloud / Hugging Face Spaces.

---

## 3. Action (Architecture & Technical Implementation)
1. **Data Pipeline & Incremental dbt Modeling:**
   - Ingested player and match telemetry from Understat API into raw staging tables.
   - Built an incremental dbt model (`mart_player_season`) keyed on `(player_id, league, season)` that reprocesses only new rows instead of the entire ~27k-row history.
   - Implemented `snapshots/player_team_snapshot.sql` to capture player team, league, and position changes as Type-2 SCDs with `dbt_valid_from` and `dbt_valid_to`.
   - Engineered `mart_player_breakout` using self-joins comparing consecutive seasons to identify breakout attacking talent (npxG + xA per 90).
2. **Machine Learning & Vector Search:**
   - Preprocessed and scaled features using Scikit-learn; serialized models and feature matrices into Parquet and Joblib artifacts.
   - Built a dynamic k-Nearest Neighbors (`NearestNeighbors`) similarity search fitting fresh candidate pools on user-selected filters with near-instant query latency.
3. **Application & Caching Layer:**
   - Designed a decoupled Streamlit architecture separating UI widgets from data access (`app/data.py` with `@st.cache_resource` / `@st.cache_data` keyed on file `mtime`).

---

## 4. Result (Impact & Demonstrations)
- **Zero cluster compute costs** by leveraging DuckDB in-process OLAP over ~27k historical player seasons.
- High-performance, millisecond-level similarity retrieval and live deployment.
- Demonstrates advanced engineering in dimensional modeling, SCD2 snapshots, machine learning integration, and clean software architecture.
