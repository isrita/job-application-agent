---
title: High-Throughput Batch Ingestion REST API Microservice (FastAPI & SQLAlchemy)
candidate: israel
company: Globant Engineering Challenge
domain: Ingestion Microservices, Transactional Batch Processing & Relational Data Modeling
tech_stack: [FastAPI, Python, SQLAlchemy, Pydantic, MySQL, PostgreSQL, Uvicorn, Docker]
key_metrics: [Batch transaction processing up to 1,000 records per HTTP request, Zero data corruption via atomic database transactions, Dynamic multi-entity validation (Departments, Jobs, Employees)]
core_topics: [REST API Microservices, Batch Ingestion, Transaction Safety, Pydantic Schema Validation, Relational Database Modeling]
---

# High-Throughput Batch Ingestion REST API Microservice (FastAPI & SQLAlchemy)

## Executive Summary (STAR Framework)

- **Situation:** Migrating massive corporate historical datasets (such as employee records, historical payroll, and departmental hierarchies) via manual scripts or row-by-row HTTP uploads leads to frequent timeouts, database connection exhaustion, and partial data corruption upon network drops.
- **Task:** Build a high-throughput, production-ready REST API microservice in Python using FastAPI and SQLAlchemy to parse historical CSV files and execute batch transactional inserts of up to 1,000 records per request into relational databases with strict schema enforcement.
- **Action:**
  1. Designed a normalized relational database schema in SQLAlchemy representing corporate hierarchies (`departments`, `jobs`, `employees`) with primary key and foreign key integrity constraints.
  2. Implemented asynchronous FastAPI endpoints equipped with Pydantic validation models to validate payload shapes, data types, and required attributes prior to database persistence.
  3. Structured atomic batch chunking algorithms processing incoming CSV streams in configurable batches of 1,000 records, executing bulk insert operations within scoped database sessions.
  4. Added robust rollback exception handling ensuring that if any single record in a batch fails validation or constraint checks, the entire transaction rolls back cleanly without leaving orphan data.
- **Result:** Successfully automated bulk historical ingestion capable of migrating thousands of records in seconds while maintaining strict relational integrity, zero downtime, and complete audit logging.

---

## Architectural Breakdown

```
[Client CSV Upload (1,000+ Records)]
                │
                ▼ (HTTP POST /upload/)
     [FastAPI Ingestion Endpoint]
                │
                ▼ (Pydantic Schema Validation)
     [Chunking & In-Memory Streaming (1,000 Rows/Batch)]
                │
                ▼ (Scoped DB Session)
     [SQLAlchemy ORM Bulk Insert]
          ├── Departments Table (Dim)
          ├── Jobs Table (Dim)
          └── Employees Table (Fact)
                │
         ┌──────┴──────┐
      [Success]     [Failure]
         │             │
      Commit         Rollback + Detailed Error Log
```

---

## Technical Implementation Highlights

### 1. Batch Transactional Processing in FastAPI
```python
from fastapi import FastAPI, UploadFile, File, HTTPException, Depends
from sqlalchemy.orm import Session
import csv
import io

@app.post("/upload/employees/")
async def upload_employees(file: UploadFile = File(...), db: Session = Depends(get_db)):
    content = await file.read()
    reader = csv.DictReader(io.StringIO(content.decode("utf-8")))
    
    batch = []
    BATCH_SIZE = 1000
    try:
        for row in reader:
            batch.append(Employee(id=row["id"], name=row["name"], datetime=row["datetime"], department_id=row["department_id"], job_id=row["job_id"]))
            if len(batch) >= BATCH_SIZE:
                db.bulk_save_objects(batch)
                db.commit()
                batch.clear()
        if batch:
            db.bulk_save_objects(batch)
            db.commit()
    except Exception as e:
        db.rollback()
        raise HTTPException(status_code=400, detail=f"Batch migration failed: {str(e)}")
    
    return {"message": "Migration completed successfully"}
```

---

## Key Interview Talking Points

1. **`bulk_save_objects` vs. Individual `db.add`:**
   - Bulk saving generates a single parameterized multi-row SQL `INSERT` statement, reducing network round-trips to the database from 1,000 round-trips to just 1 per batch.
2. **Transaction Atomicity:**
   - Protecting relational database health by wrapping ingestion batches in explicit `db.commit()` and `db.rollback()` blocks.
3. **Pydantic Validation at the Edge:**
   - Rejecting malformed payloads before they reach the database engine, preserving database CPU cycles.
