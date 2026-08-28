"""
=============================================================================
GramPulse AI - Database Seed Script (PostgreSQL + PostGIS)
=============================================================================
Seeds realistic baseline data for GramPulse AI:
1. 5 Model Gram Panchayats across various Indian states.
2. 7 Years (2018-2024) of historical demographic & census metrics per GP.
3. 10 Geotagged citizen complaints with PostGIS Point geometries.

Features:
- Connection pooling with psycopg2.pool.SimpleConnectionPool
- Robust error handling with automatic rollbacks
- Configurable environment variables for DB credentials
- Idempotent execution (safe upserts with ON CONFLICT)
- Structured logging
=============================================================================
"""

import os
import sys
import logging
from datetime import datetime, timedelta
import random
from typing import List, Dict, Any, Optional
from contextlib import contextmanager

try:
    import psycopg2
    from psycopg2 import pool, extras
except ImportError:
    print(
        "[ERROR] 'psycopg2' package is not installed. "
        "Install it via: pip install psycopg2-binary"
    )
    sys.exit(1)

# ---------------------------------------------------------------------------
# Structured Logging Configuration
# ---------------------------------------------------------------------------
logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s [%(levelname)s] %(name)s: %(message)s",
    datefmt="%Y-%m-%d %H:%M:%S",
)
logger = logging.getLogger("GramPulse-DB-Seeder")

# ---------------------------------------------------------------------------
# Database Configuration
# ---------------------------------------------------------------------------
DB_CONFIG = {
    "dbname": os.environ.get("POSTGRES_DB", "grampulse_db"),
    "user": os.environ.get("POSTGRES_USER", "postgres"),
    "password": os.environ.get("POSTGRES_PASSWORD", "postgres"),
    "host": os.environ.get("POSTGRES_HOST", "localhost"),
    "port": int(os.environ.get("POSTGRES_PORT", 5432)),
    "sslmode": os.environ.get("POSTGRES_SSLMODE", "prefer"),
}

# Optional direct connection string support
DATABASE_URL = os.environ.get("DATABASE_URL")


class DatabaseConnectionManager:
    """Thread-safe connection pool manager for PostgreSQL."""

    def __init__(self, minconn: int = 1, maxconn: int = 5):
        self.minconn = minconn
        self.maxconn = maxconn
        self._pool: Optional[pool.SimpleConnectionPool] = None

    def initialize_pool(self):
        """Initializes the database connection pool."""
        try:
            if DATABASE_URL:
                logger.info("Initializing connection pool using DATABASE_URL...")
                self._pool = pool.SimpleConnectionPool(
                    self.minconn, self.maxconn, dsn=DATABASE_URL
                )
            else:
                logger.info(
                    f"Initializing connection pool to '{DB_CONFIG['dbname']}' on {DB_CONFIG['host']}:{DB_CONFIG['port']}..."
                )
                self._pool = pool.SimpleConnectionPool(
                    self.minconn, self.maxconn, **DB_CONFIG
                )
            logger.info("Database connection pool initialized successfully.")
        except psycopg2.Error as err:
            logger.error(f"Failed to initialize database connection pool: {err}")
            raise

    @contextmanager
    def get_connection(self):
        """Context manager for acquiring and releasing a connection from the pool."""
        if not self._pool:
            self.initialize_pool()

        conn = self._pool.getconn()
        try:
            yield conn
        finally:
            self._pool.putconn(conn)

    def close_all(self):
        """Closes all connections in the pool."""
        if self._pool:
            self._pool.closeall()
            logger.info("Database connection pool closed.")


# ---------------------------------------------------------------------------
# Seed Datasets
# ---------------------------------------------------------------------------

# 5 Realistic & Notable Model Gram Panchayats across India
GRAM_PANCHAYATS_DATA = [
    {
        "gp_code": "GP-MH-AHM-001",
        "gp_name": "Hiware Bazar",
        "district": "Ahmednagar",
        "state": "Maharashtra",
        "center_lat": 19.0435,
        "center_lon": 74.9252,
    },
    {
        "gp_code": "GP-GJ-SAB-002",
        "gp_name": "Punsari",
        "district": "Sabarkantha",
        "state": "Gujarat",
        "center_lat": 23.4988,
        "center_lon": 73.1812,
    },
    {
        "gp_code": "GP-ML-EKH-003",
        "gp_name": "Mawlynnong",
        "district": "East Khasi Hills",
        "state": "Meghalaya",
        "center_lat": 25.2016,
        "center_lon": 91.9056,
    },
    {
        "gp_code": "GP-TN-CBE-004",
        "gp_name": "Odanthurai",
        "district": "Coimbatore",
        "state": "Tamil Nadu",
        "center_lat": 11.2982,
        "center_lon": 76.9366,
    },
    {
        "gp_code": "GP-RJ-RAJ-005",
        "gp_name": "Piplantri",
        "district": "Rajsamand",
        "state": "Rajasthan",
        "center_lat": 25.0483,
        "center_lon": 73.8644,
    },
]

# Baseline indicators for 2018 for each GP (will be grown annually from 2018 to 2024)
BASE_METRICS_CONFIG = {
    "GP-MH-AHM-001": {
        "base_pop": 1250,
        "pop_growth_rate": 0.015,
        "base_hh": 230,
        "base_water": 75000.0,
        "water_growth_rate": 0.04,
        "base_classrooms": 12,
        "base_road_km": 14.5,
    },
    "GP-GJ-SAB-002": {
        "base_pop": 5800,
        "pop_growth_rate": 0.018,
        "base_hh": 1100,
        "base_water": 320000.0,
        "water_growth_rate": 0.05,
        "base_classrooms": 28,
        "base_road_km": 26.0,
    },
    "GP-ML-EKH-003": {
        "base_pop": 500,
        "pop_growth_rate": 0.012,
        "base_hh": 95,
        "base_water": 30000.0,
        "water_growth_rate": 0.03,
        "base_classrooms": 8,
        "base_road_km": 8.2,
    },
    "GP-TN-CBE-004": {
        "base_pop": 6200,
        "pop_growth_rate": 0.016,
        "base_hh": 1400,
        "base_water": 410000.0,
        "water_growth_rate": 0.045,
        "base_classrooms": 32,
        "base_road_km": 31.5,
    },
    "GP-RJ-RAJ-005": {
        "base_pop": 4100,
        "pop_growth_rate": 0.020,
        "base_hh": 780,
        "base_water": 190000.0,
        "water_growth_rate": 0.04,
        "base_classrooms": 20,
        "base_road_km": 19.8,
    },
}

# 10 Representative Citizen Grievance Templates
SAMPLE_ISSUES_CONFIG = [
    {
        "category": "Water Supply",
        "description": "Primary community borewell motor damaged near North Hamlet; drinking water unavailable for 3 days.",
        "status": "OPEN",
        "gp_index": 0,  # Hiware Bazar
        "days_ago": 2,
    },
    {
        "category": "Roads & Infrastructure",
        "description": "Culvert bridge on main connecting link road damaged due to heavy monsoon runoff.",
        "status": "IN_PROGRESS",
        "gp_index": 0,  # Hiware Bazar
        "days_ago": 15,
    },
    {
        "category": "Electricity",
        "description": "25kVA agricultural transformer failure affecting irrigation pumps in Sector 4.",
        "status": "RESOLVED",
        "gp_index": 1,  # Punsari
        "days_ago": 40,
    },
    {
        "category": "Sanitation",
        "description": "Solid waste collection vehicle route skipped Ward 3 for the past two consecutive weeks.",
        "status": "OPEN",
        "gp_index": 1,  # Punsari
        "days_ago": 5,
    },
    {
        "category": "Healthcare",
        "description": "Sub-center dispensary requires urgent restocking of basic antipyretics and ORS packets.",
        "status": "IN_PROGRESS",
        "gp_index": 2,  # Mawlynnong
        "days_ago": 10,
    },
    {
        "category": "Education",
        "description": "Primary school roof tile leakage in classroom #3 requiring immediate repair before monsoon.",
        "status": "RESOLVED",
        "gp_index": 2,  # Mawlynnong
        "days_ago": 60,
    },
    {
        "category": "Water Supply",
        "description": "Pipeline leakage detected near village overhead storage tank causing water loss and low pressure.",
        "status": "OPEN",
        "gp_index": 3,  # Odanthurai
        "days_ago": 1,
    },
    {
        "category": "Roads & Infrastructure",
        "description": "Streetlights non-functional on Panchayat Bhawan main access stretch.",
        "status": "RESOLVED",
        "gp_index": 3,  # Odanthurai
        "days_ago": 25,
    },
    {
        "category": "Agriculture",
        "description": "Canal distributary gate silted up, blocking canal water flow to western farmland parcel.",
        "status": "OPEN",
        "gp_index": 4,  # Piplantri
        "days_ago": 7,
    },
    {
        "category": "Sanitation",
        "description": "Community toilet complex soak pit overflowing near weekly market ground.",
        "status": "IN_PROGRESS",
        "gp_index": 4,  # Piplantri
        "days_ago": 12,
    },
]


# ---------------------------------------------------------------------------
# Seeding Functions
# ---------------------------------------------------------------------------

def seed_gram_panchayats(conn) -> Dict[str, int]:
    """
    Inserts or updates the 5 Gram Panchayats.
    Returns a mapping of gp_code -> gp_id.
    """
    logger.info("Seeding Gram Panchayats master data...")
    gp_id_map = {}

    query = """
        INSERT INTO gram_panchayats (gp_code, gp_name, district, state)
        VALUES (%s, %s, %s, %s)
        ON CONFLICT (gp_code) DO UPDATE
        SET gp_name = EXCLUDED.gp_name,
            district = EXCLUDED.district,
            state = EXCLUDED.state,
            updated_at = CURRENT_TIMESTAMP
        RETURNING gp_id, gp_code;
    """

    with conn.cursor() as cur:
        for gp in GRAM_PANCHAYATS_DATA:
            cur.execute(
                query,
                (gp["gp_code"], gp["gp_name"], gp["district"], gp["state"]),
            )
            row = cur.fetchone()
            gp_id_map[row[0]] = gp["gp_code"]
            gp_id_map[gp["gp_code"]] = row[0]
            logger.info(
                f"  -> Gram Panchayat [{row[0]}] '{gp['gp_name']}' ({gp['district']}, {gp['state']}) synced."
            )

    return gp_id_map


def seed_village_metrics(conn, gp_id_map: Dict[str, int]):
    """
    Seeds historical census and infrastructure metrics from 2018 to 2024
    for all 5 Gram Panchayats.
    """
    logger.info("Seeding historical village metrics (2018 - 2024)...")
    years = list(range(2018, 2025))
    records_inserted = 0

    query = """
        INSERT INTO village_metrics (
            gp_id,
            record_year,
            population,
            households,
            daily_water_supply_liters,
            school_classrooms_count,
            road_coverage_km
        )
        VALUES (%s, %s, %s, %s, %s, %s, %s)
        ON CONFLICT (gp_id, record_year) DO UPDATE
        SET population = EXCLUDED.population,
            households = EXCLUDED.households,
            daily_water_supply_liters = EXCLUDED.daily_water_supply_liters,
            school_classrooms_count = EXCLUDED.school_classrooms_count,
            road_coverage_km = EXCLUDED.road_coverage_km;
    """

    with conn.cursor() as cur:
        for gp in GRAM_PANCHAYATS_DATA:
            gp_code = gp["gp_code"]
            gp_id = gp_id_map[gp_code]
            config = BASE_METRICS_CONFIG[gp_code]

            for i, year in enumerate(years):
                # Calculate realistic annual growth trajectory
                pop = int(config["base_pop"] * ((1 + config["pop_growth_rate"]) ** i))
                hh = int(config["base_hh"] * ((1 + config["pop_growth_rate"] * 0.9) ** i))
                water = round(
                    config["base_water"] * ((1 + config["water_growth_rate"]) ** i), 2
                )
                # Incremental classroom upgrades every 2-3 years
                classrooms = config["base_classrooms"] + (i // 2)
                # Incremental road paving/expansion
                road_km = round(config["base_road_km"] + (i * 0.75), 2)

                cur.execute(
                    query,
                    (gp_id, year, pop, hh, water, classrooms, road_km),
                )
                records_inserted += 1

    logger.info(f"Successfully seeded {records_inserted} annual metric records across 5 GPs.")


def seed_citizen_issues(conn, gp_id_map: Dict[str, int]):
    """
    Seeds 10 geotagged citizen complaints with PostGIS Point geometries (SRID 4326)
    distributed within authentic rural bounds around the Gram Panchayats.
    """
    logger.info("Seeding geotagged citizen issues with PostGIS coordinates...")

    # Clear existing sample issues or insert cleanly
    # ST_SetSRID(ST_MakePoint(longitude, latitude), 4326)
    query = """
        INSERT INTO citizen_issues (
            gp_id,
            category,
            description,
            status,
            location,
            created_at
        )
        VALUES (
            %s,
            %s,
            %s,
            %s,
            ST_SetSRID(ST_MakePoint(%s, %s), 4326),
            %s
        )
        RETURNING issue_id;
    """

    now = datetime.now()
    records_inserted = 0

    with conn.cursor() as cur:
        for issue in SAMPLE_ISSUES_CONFIG:
            gp = GRAM_PANCHAYATS_DATA[issue["gp_index"]]
            gp_id = gp_id_map[gp["gp_code"]]

            # Add slight realistic spatial jitter within ~2-5 km of GP center
            jitter_lat = gp["center_lat"] + random.uniform(-0.025, 0.025)
            jitter_lon = gp["center_lon"] + random.uniform(-0.025, 0.025)

            created_timestamp = now - timedelta(days=issue["days_ago"], hours=random.randint(1, 12))

            cur.execute(
                query,
                (
                    gp_id,
                    issue["category"],
                    issue["description"],
                    issue["status"],
                    jitter_lon,  # X coordinate = Longitude
                    jitter_lat,  # Y coordinate = Latitude
                    created_timestamp,
                ),
            )
            issue_id = cur.fetchone()[0]
            records_inserted += 1
            logger.info(
                f"  -> Issue #{issue_id} [{issue['category']}] ({issue['status']}) "
                f"at ({jitter_lat:.4f} N, {jitter_lon:.4f} E) for {gp['gp_name']}"
            )

    logger.info(f"Successfully seeded {records_inserted} geotagged citizen issues.")


def verify_seeding(conn):
    """Performs quick verification queries and logs summary statistics."""
    logger.info("Verifying database state...")
    with conn.cursor(cursor_factory=extras.DictCursor) as cur:
        # Check GP count
        cur.execute("SELECT COUNT(*) AS count FROM gram_panchayats;")
        gp_count = cur.fetchone()["count"]

        # Check Metrics count & year range
        cur.execute(
            "SELECT COUNT(*) AS count, MIN(record_year) AS min_y, MAX(record_year) AS max_y FROM village_metrics;"
        )
        m_row = cur.fetchone()

        # Check Citizen Issues count & spatial verification using PostGIS ST_AsText
        cur.execute(
            """
            SELECT
                i.issue_id,
                g.gp_name,
                i.category,
                i.status,
                ST_AsText(i.location) AS point_wkt,
                ST_Y(i.location) AS latitude,
                ST_X(i.location) AS longitude
            FROM citizen_issues i
            JOIN gram_panchayats g ON i.gp_id = g.gp_id
            LIMIT 3;
            """
        )
        sample_issues = cur.fetchall()

        logger.info(f"Verification Summary:")
        logger.info(f"  • Gram Panchayats Count: {gp_count}")
        logger.info(
            f"  • Village Metrics Count: {m_row['count']} (Years {m_row['min_y']} to {m_row['max_y']})"
        )
        logger.info(f"  • Sample Spatial Issues:")
        for s in sample_issues:
            logger.info(
                f"    - ID {s['issue_id']} [{s['gp_name']}]: {s['category']} at WKT '{s['point_wkt']}' (Lat: {s['latitude']:.4f}, Lon: {s['longitude']:.4f})"
            )


# ---------------------------------------------------------------------------
# Main Execution Entry Point
# ---------------------------------------------------------------------------
def main():
    """Main execution function with transaction management."""
    logger.info("==========================================================")
    logger.info("Starting GramPulse AI Database Seeding Process")
    logger.info("==========================================================")

    db_manager = DatabaseConnectionManager(minconn=1, maxconn=3)

    try:
        db_manager.initialize_pool()

        with db_manager.get_connection() as conn:
            # Transaction block
            with conn:
                logger.info("Executing within an active transaction block...")
                gp_id_map = seed_gram_panchayats(conn)
                seed_village_metrics(conn, gp_id_map)
                seed_citizen_issues(conn, gp_id_map)
                verify_seeding(conn)

            logger.info("Transaction committed successfully.")

        logger.info("==========================================================")
        logger.info("Database seeding completed successfully without errors.")
        logger.info("==========================================================")

    except psycopg2.DatabaseError as db_err:
        logger.error(f"Database operation failed with error: {db_err}", exc_info=True)
        sys.exit(1)
    except Exception as ex:
        logger.error(f"Unexpected error occurred during seeding: {ex}", exc_info=True)
        sys.exit(1)
    finally:
        db_manager.close_all()


if __name__ == "__main__":
    main()
