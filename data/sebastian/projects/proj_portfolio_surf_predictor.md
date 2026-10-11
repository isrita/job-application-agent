---
title: Surf Predictor — Coastal Wave Quality Classifier
candidate: sebastian
repository: bona1204/Portafolio (surf_predictor)
domain: Marine Meteorology & Classification
tech_stack: [Decision Tree Classifier, Scikit-learn, Open-Meteo Marine API, Parquet, DuckDB, Streamlit]
key_metrics: [Hourly oceanographic telemetry, optimal 3-hour session windows]
core_topics: [Time-series Ingestion, Domain Feature Engineering, Interpretable ML]
---

# Project STAR: Surf Predictor — Coastal Wave Quality Classifier

- **Repository:** [bona1204/Portafolio](https://github.com/bona1204/Portafolio) (`projects/surf_predictor`)
- **Candidate:** Sebastian Bonilla
- **Domain:** Marine Meteorology, Time-Series & Decision Tree Classification
- **Tech Stack:** Decision Tree Classifier, Scikit-learn, Open-Meteo Marine API, Parquet, DuckDB, dbt, Streamlit

---

## 1. Situation (Context & Problem)
Surfers along Lima's Costa Verde face variable wave quality dictated by complex interactions of swell height, wave period, wave direction, wind speed, and tidal movements. Raw marine forecast APIs provide numerical metrics that are difficult for average users to interpret into actionable session quality ratings.

---

## 2. Task (Objectives & Responsibilities)
- Ingest hourly marine forecast and oceanographic telemetry from Open-Meteo Marine API.
- Process and store meteorological time-series data using columnar Parquet and DuckDB.
- Train machine learning classification models to categorize upcoming sessions into qualitative surfing grades (Poor, Fair, Good, Epic).
- Deploy an intuitive forecast app visualizing optimal surfing windows.

---

## 3. Action (Architecture & Technical Implementation)
1. **Marine Ingestion & Columnar Storage:**
   - Built automated Python ingestion pipelines pulling hourly swell, wind, and tide metrics.
   - Leveraged Parquet files partitioned by beach spot and date, queried natively via DuckDB.
2. **Feature Engineering & Classification:**
   - Engineered domain-specific features: offshore wind alignment angle, primary swell energy ($E \propto H_s^2 \cdot T$), and tide stage transitions.
   - Implemented an interpretable Decision Tree Classifier mapping multi-variable oceanic conditions to ground-truth session quality labels.
3. **Application Interface:**
   - Built a Streamlit interface highlighting the best upcoming 3-hour session windows across Costa Verde beaches.

---

## 4. Result (Impact & Demonstrations)
- High-accuracy session recommendations translating complex oceanographic metrics into practical decision-making.
- Demonstrates integration of environmental APIs, feature engineering, and domain-informed ML classification.
