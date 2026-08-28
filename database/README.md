# GramPulse AI - Database Module

This directory contains the database migration schema and seeding utilities for the **GramPulse AI** rural governance analytics platform, built on **PostgreSQL** and **PostGIS**.

---

## 📁 Files

- [`schema.sql`](file:///c:/Users/DILIP/OneDrive/Desktop/Grampulse%20AI/database/schema.sql): Production schema with PostGIS extensions, relational tables, constraints, foreign keys, triggers, and GIST spatial indexes.
- [`seed_data.py`](file:///c:/Users/DILIP/OneDrive/Desktop/Grampulse%20AI/database/seed_data.py): Python seeding script using `psycopg2` with connection pooling, transactional consistency, structured logging, and realistic Indian rural governance datasets.

---

## 🗄️ Database Schema Details

### Tables
1. **`gram_panchayats`**:
   - Master entity table for Gram Panchayats.
   - Fields: `gp_id`, `gp_code` (unique), `gp_name`, `district`, `state`, `created_at`, `updated_at`.
2. **`village_metrics`**:
   - Historical census and rural infrastructure records.
   - Fields: `metric_id`, `gp_id` (FK), `record_year`, `population`, `households`, `daily_water_supply_liters`, `school_classrooms_count`, `road_coverage_km`, `created_at`.
   - Constraints: `UNIQUE (gp_id, record_year)`, range checks on demographic & infrastructure values.
3. **`citizen_issues`**:
   - Geotagged civic complaints and grievances.
   - Fields: `issue_id`, `gp_id` (FK), `category`, `description`, `status`, `location GEOMETRY(Point, 4326)`, `created_at`, `updated_at`.
   - Spatial Index: `USING GIST (location)` for high-performance spatial/proximity queries.

---

## 🚀 Setup & Execution

### 1. Prerequisites
- PostgreSQL (v14+) with PostGIS extension installed.
- Python 3.9+ with `psycopg2-binary`:
  ```bash
  pip install psycopg2-binary
  ```

### 2. Apply the Schema
Connect to your PostgreSQL instance and execute the schema:
```bash
# Using psql CLI:
psql -U postgres -d grampulse_db -f database/schema.sql
```

### 3. Configure Environment Variables (Optional)
You can configure database credentials using standard environment variables:
```bash
# Linux / macOS
export POSTGRES_DB="grampulse_db"
export POSTGRES_USER="postgres"
export POSTGRES_PASSWORD="your_password"
export POSTGRES_HOST="localhost"
export POSTGRES_PORT="5432"

# Windows (PowerShell)
$env:POSTGRES_DB="grampulse_db"
$env:POSTGRES_USER="postgres"
$env:POSTGRES_PASSWORD="your_password"
$env:POSTGRES_HOST="localhost"
$env:POSTGRES_PORT="5432"
```
Or simply provide a connection string:
```bash
export DATABASE_URL="postgresql://postgres:password@localhost:5432/grampulse_db"
```

### 4. Run the Seeder
Execute the python seeder:
```bash
python database/seed_data.py
```
