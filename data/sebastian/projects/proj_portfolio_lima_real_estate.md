---
title: Lima Real Estate — Predictive Property Price Valuation
candidate: sebastian
repository: bona1204/Portafolio (real_estate_lima)
domain: Real Estate Analytics & Predictive Modeling
tech_stack: [Random Forest, Scikit-learn, dbt, DuckDB, Python, MercadoLibre API, Streamlit]
key_metrics: [Cross-district price/m2 valuation, automated listing radar]
core_topics: [Web Data Ingestion, Data Normalization, Regression ML, Interactive BI]
---

# Project STAR: Lima Real Estate — Predictive Property Price Valuation

- **Repository:** [bona1204/Portafolio](https://github.com/bona1204/Portafolio) (`projects/real_estate_lima`)
- **Candidate:** Sebastian Bonilla
- **Domain:** Real Estate Analytics, Web Scraping & Machine Learning
- **Tech Stack:** Random Forest, Scikit-learn, dbt, DuckDB, Python, MercadoLibre API, Streamlit

---

## 1. Situation (Context & Problem)
Property seekers and real estate investors in Lima often struggle with pricing transparency and finding undervalued property opportunities across distinct districts. Listings on platforms such as MercadoLibre contain noisy unstructured text, inconsistent price units (PEN vs USD), and missing metadata.

---

## 2. Task (Objectives & Responsibilities)
- Ingest real estate listings across Lima districts via automated API routines.
- Normalize currency, square footage, room counts, and property attributes using dbt SQL transformations running on DuckDB.
- Train predictive regression models (Random Forest Regressor) to estimate fair price per square meter ($/m^2$).
- Surface undervalued properties where listed price is significantly below predicted valuation.

---

## 3. Action (Architecture & Technical Implementation)
1. **Pipeline & Data Normalization:**
   - Ingested property listings from MercadoLibre API into structured raw Parquet/DuckDB storage.
   - Built dbt transformations (`staging` to `marts`) standardizing currency exchange rates, removing duplicate entries, and cleaning outlier square meter values.
2. **Predictive Modeling:**
   - Engineered geospatial and property features (district encoding, total area vs covered area, bathrooms, bedrooms, amenities).
   - Trained a Random Forest Regression model with cross-validation and hyperparameter tuning to accurately predict price/$m^2$.
3. **Serving & Analytics:**
   - Developed a Streamlit web application providing interactive property filtering, fair-value benchmarks, and an undervalued listing radar.

---

## 4. Result (Impact & Demonstrations)
- Automated end-to-end valuation pipeline linking real-world web data collection, dbt transformations, and regression modeling.
- Clear demonstration of predictive modeling applied to practical business valuation problems.
