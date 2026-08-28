"""
=============================================================================
GramPulse AI - Backend Database Access Layer (PostgreSQL + PostGIS)
=============================================================================
Handles connection pooling, PostGIS spatial queries, and entity retrieval for
Gram Panchayats, village metrics, and geotagged citizen grievances.
=============================================================================
"""

import os
import logging
from datetime import datetime
from typing import Optional, List, Dict, Any
from contextlib import contextmanager
from dotenv import load_dotenv

load_dotenv()

try:
    import psycopg2
    from psycopg2 import pool, extras
except ImportError:
    raise ImportError(
        "psycopg2 is required. Please install it using: pip install psycopg2-binary"
    )

logger = logging.getLogger("GramPulse-Backend-DB")
if not logger.handlers:
    handler = logging.StreamHandler()
    formatter = logging.Formatter(
        "%(asctime)s [%(levelname)s] %(name)s: %(message)s",
        datefmt="%Y-%m-%d %H:%M:%S",
    )
    handler.setFormatter(formatter)
    logger.addHandler(handler)
    logger.setLevel(logging.INFO)

# ---------------------------------------------------------------------------
# Database Configuration & Pool Manager
# ---------------------------------------------------------------------------
DB_HOST: str = os.getenv("DB_HOST", "localhost")
DB_PORT: int = int(os.getenv("DB_PORT", "5432"))
DB_NAME: str = os.getenv("DB_NAME", os.getenv("POSTGRES_DB", "grampulse_db"))
DB_USER: str = os.getenv("DB_USER", os.getenv("POSTGRES_USER", "postgres"))
DB_PASSWORD: str = os.getenv("DB_PASSWORD", os.getenv("POSTGRES_PASSWORD", "postgres"))
DB_SSLMODE: str = os.getenv("DB_SSLMODE", "prefer")
DATABASE_URL: Optional[str] = os.getenv("DATABASE_URL")

_connection_pool: Optional[pool.SimpleConnectionPool] = None


def get_db_pool(minconn: int = 1, maxconn: int = 10) -> pool.SimpleConnectionPool:
    """Singleton getter for PostgreSQL connection pool."""
    global _connection_pool
    if _connection_pool is None or _connection_pool.closed:
        try:
            if DATABASE_URL:
                logger.info("Initializing DB connection pool using DATABASE_URL...")
                _connection_pool = pool.SimpleConnectionPool(
                    minconn, maxconn, dsn=DATABASE_URL
                )
            else:
                logger.info(
                    f"Initializing DB connection pool for '{DB_NAME}' at {DB_HOST}:{DB_PORT}..."
                )
                _connection_pool = pool.SimpleConnectionPool(
                    minconn,
                    maxconn,
                    host=DB_HOST,
                    port=DB_PORT,
                    dbname=DB_NAME,
                    user=DB_USER,
                    password=DB_PASSWORD,
                    sslmode=DB_SSLMODE,
                )
            logger.info("PostgreSQL/PostGIS connection pool initialized.")
        except psycopg2.Error as err:
            logger.warning(
                f"Could not connect to PostgreSQL ({err}). Fallback mock data active if needed."
            )
            raise
    return _connection_pool


@contextmanager
def get_db_connection():
    """Acquires and returns a pooled database connection."""
    conn_pool = get_db_pool()
    conn = conn_pool.getconn()
    try:
        yield conn
    finally:
        conn_pool.putconn(conn)


@contextmanager
def get_cursor(commit: bool = False):
    """Context manager yielding a RealDictCursor."""
    with get_db_connection() as conn:
        with conn.cursor(cursor_factory=extras.RealDictCursor) as cur:
            try:
                yield cur
                if commit:
                    conn.commit()
            except Exception as e:
                if commit:
                    conn.rollback()
                logger.error(f"Database query execution error: {e}")
                raise


def check_db_health() -> bool:
    """Checks if the PostgreSQL connection is active."""
    try:
        with get_cursor() as cur:
            cur.execute("SELECT 1 AS health;")
            return cur.fetchone()["health"] == 1
    except Exception:
        return False


# ---------------------------------------------------------------------------
# Fallback Mock Data (For local dev without active DB instance)
# ---------------------------------------------------------------------------
MOCK_PANCHAYATS: List[Dict[str, Any]] = [
    # --- Tamil Nadu Model Gram Panchayats ---
    {
        "gp_id": 4,
        "gp_code": "GP-TN-CBE-004",
        "gp_name": "Odanthurai",
        "district": "Coimbatore",
        "state": "Tamil Nadu",
        "center_lat": 11.2982,
        "center_lng": 76.9366,
    },
    {
        "gp_id": 6,
        "gp_code": "GP-TN-TRV-006",
        "gp_name": "Kuthambakkam",
        "district": "Tiruvallur",
        "state": "Tamil Nadu",
        "center_lat": 13.0645,
        "center_lng": 80.0076,
    },
    {
        "gp_id": 7,
        "gp_code": "GP-TN-SVG-007",
        "gp_name": "Keeladi",
        "district": "Sivagangai",
        "state": "Tamil Nadu",
        "center_lat": 9.8647,
        "center_lng": 78.1884,
    },
    {
        "gp_id": 8,
        "gp_code": "GP-TN-THJ-008",
        "gp_name": "Thiruvaiyaru",
        "district": "Thanjavur",
        "state": "Tamil Nadu",
        "center_lat": 10.8794,
        "center_lng": 79.1039,
    },
    {
        "gp_id": 9,
        "gp_code": "GP-TN-KNC-009",
        "gp_name": "Uthiramerur",
        "district": "Kanchipuram",
        "state": "Tamil Nadu",
        "center_lat": 12.6321,
        "center_lng": 79.7610,
    },
    {
        "gp_id": 10,
        "gp_code": "GP-TN-TNL-010",
        "gp_name": "Papanasam",
        "district": "Tirunelveli",
        "state": "Tamil Nadu",
        "center_lat": 8.7088,
        "center_lng": 77.3712,
    },
    {
        "gp_id": 11,
        "gp_code": "GP-TN-ERD-011",
        "gp_name": "Punjaipuliampatti",
        "district": "Erode",
        "state": "Tamil Nadu",
        "center_lat": 11.3540,
        "center_lng": 77.1720,
    },
    {
        "gp_id": 12,
        "gp_code": "GP-TN-NIL-012",
        "gp_name": "Hubbathalai",
        "district": "The Nilgiris",
        "state": "Tamil Nadu",
        "center_lat": 11.3530,
        "center_lng": 76.7959,
    },
    {
        "gp_id": 13,
        "gp_code": "GP-TN-SVG-013",
        "gp_name": "Kanadukathan",
        "district": "Sivagangai",
        "state": "Tamil Nadu",
        "center_lat": 10.1770,
        "center_lng": 78.7844,
    },
    # --- National Model Panchayats ---
    {
        "gp_id": 2,
        "gp_code": "GP-GJ-SAB-002",
        "gp_name": "Punsari",
        "district": "Sabarkantha",
        "state": "Gujarat",
        "center_lat": 23.4988,
        "center_lng": 73.1812,
    },
    {
        "gp_id": 1,
        "gp_code": "GP-MH-AHM-001",
        "gp_name": "Hiware Bazar",
        "district": "Ahmednagar",
        "state": "Maharashtra",
        "center_lat": 19.0435,
        "center_lng": 74.9252,
    },
    {
        "gp_id": 5,
        "gp_code": "GP-RJ-RAJ-005",
        "gp_name": "Piplantri",
        "district": "Rajsamand",
        "state": "Rajasthan",
        "center_lat": 25.0483,
        "center_lng": 73.8644,
    },
    {
        "gp_id": 3,
        "gp_code": "GP-ML-EKH-003",
        "gp_name": "Mawlynnong",
        "district": "East Khasi Hills",
        "state": "Meghalaya",
        "center_lat": 25.2016,
        "center_lng": 91.9056,
    },
]

MOCK_METRICS: Dict[int, Dict[str, Any]] = {
    1: {
        "gp_id": 1,
        "record_year": 2024,
        "population": 1365,
        "households": 250,
        "daily_water_supply_liters": 85000.0,
        "school_classrooms_count": 14,
        "road_coverage_km": 18.5,
    },
    2: {
        "gp_id": 2,
        "record_year": 2024,
        "population": 6450,
        "households": 1220,
        "daily_water_supply_liters": 290000.0,
        "school_classrooms_count": 30,
        "road_coverage_km": 29.5,
    },
    3: {
        "gp_id": 3,
        "record_year": 2024,
        "population": 535,
        "households": 102,
        "daily_water_supply_liters": 35000.0,
        "school_classrooms_count": 9,
        "road_coverage_km": 11.5,
    },
    4: {
        "gp_id": 4,
        "record_year": 2024,
        "population": 6820,
        "households": 1530,
        "daily_water_supply_liters": 430000.0,
        "school_classrooms_count": 34,
        "road_coverage_km": 34.8,
    },
    5: {
        "gp_id": 5,
        "record_year": 2024,
        "population": 4610,
        "households": 870,
        "daily_water_supply_liters": 210000.0,
        "school_classrooms_count": 22,
        "road_coverage_km": 23.5,
    },
    6: {
        "gp_id": 6,
        "record_year": 2024,
        "population": 5420,
        "households": 1180,
        "daily_water_supply_liters": 310000.0,
        "school_classrooms_count": 26,
        "road_coverage_km": 24.2,
    },
    7: {
        "gp_id": 7,
        "record_year": 2024,
        "population": 4150,
        "households": 920,
        "daily_water_supply_liters": 245000.0,
        "school_classrooms_count": 18,
        "road_coverage_km": 19.5,
    },
    8: {
        "gp_id": 8,
        "record_year": 2024,
        "population": 7290,
        "households": 1640,
        "daily_water_supply_liters": 490000.0,
        "school_classrooms_count": 36,
        "road_coverage_km": 38.0,
    },
    9: {
        "gp_id": 9,
        "record_year": 2024,
        "population": 8410,
        "households": 1890,
        "daily_water_supply_liters": 520000.0,
        "school_classrooms_count": 42,
        "road_coverage_km": 41.5,
    },
    10: {
        "gp_id": 10,
        "record_year": 2024,
        "population": 4890,
        "households": 1060,
        "daily_water_supply_liters": 360000.0,
        "school_classrooms_count": 24,
        "road_coverage_km": 22.0,
    },
    11: {
        "gp_id": 11,
        "record_year": 2024,
        "population": 6150,
        "households": 1390,
        "daily_water_supply_liters": 380000.0,
        "school_classrooms_count": 28,
        "road_coverage_km": 31.5,
    },
    12: {
        "gp_id": 12,
        "record_year": 2024,
        "population": 3840,
        "households": 880,
        "daily_water_supply_liters": 220000.0,
        "school_classrooms_count": 16,
        "road_coverage_km": 17.5,
    },
    13: {
        "gp_id": 13,
        "record_year": 2024,
        "population": 4520,
        "households": 990,
        "daily_water_supply_liters": 270000.0,
        "school_classrooms_count": 20,
        "road_coverage_km": 26.0,
    },
}

MOCK_ISSUES: List[Dict[str, Any]] = [
    # GP 2: Punsari, Gujarat (lat: 23.4988, lng: 73.1812)
    {
        "issue_id": 1,
        "gp_id": 2,
        "category": "Water Supply",
        "description": "Primary community borewell motor damaged near North Hamlet; drinking water unavailable for 3 days.",
        "status": "OPEN",
        "lat": 23.4988,
        "lng": 73.1812,
        "created_at": datetime.now(),
    },
    {
        "issue_id": 2,
        "gp_id": 2,
        "category": "Roads & Infrastructure",
        "description": "Culvert bridge on main connecting link road damaged due to heavy monsoon runoff.",
        "status": "IN_PROGRESS",
        "lat": 23.5020,
        "lng": 73.1780,
        "created_at": datetime.now(),
    },
    {
        "issue_id": 3,
        "gp_id": 2,
        "category": "Education",
        "description": "Primary school roof tile leakage in classroom #3 requiring immediate repair before monsoon.",
        "status": "RESOLVED",
        "lat": 23.4960,
        "lng": 73.1850,
        "created_at": datetime.now(),
    },
    {
        "issue_id": 4,
        "gp_id": 2,
        "category": "Sanitation",
        "description": "Solid waste collection vehicle route skipped Ward 3 for the past two consecutive weeks.",
        "status": "OPEN",
        "lat": 23.5010,
        "lng": 73.1830,
        "created_at": datetime.now(),
    },
    # GP 1: Hiware Bazar, Maharashtra (lat: 19.0435, lng: 74.9252)
    {
        "issue_id": 5,
        "gp_id": 1,
        "category": "Water Supply",
        "description": "Pipeline leakage detected near village overhead storage tank causing water loss.",
        "status": "OPEN",
        "lat": 19.0435,
        "lng": 74.9252,
        "created_at": datetime.now(),
    },
    {
        "issue_id": 6,
        "gp_id": 1,
        "category": "Roads & Infrastructure",
        "description": "Potholes along the check-dam access road slowing down agricultural transport tractors.",
        "status": "IN_PROGRESS",
        "lat": 19.0460,
        "lng": 74.9280,
        "created_at": datetime.now(),
    },
    {
        "issue_id": 7,
        "gp_id": 1,
        "category": "Sanitation",
        "description": "Compost pit drainage channel blocked by silt after recent unseasonal rain.",
        "status": "RESOLVED",
        "lat": 19.0410,
        "lng": 74.9220,
        "created_at": datetime.now(),
    },
    # GP 3: Mawlynnong, Meghalaya (lat: 25.2016, lng: 91.9056)
    {
        "issue_id": 8,
        "gp_id": 3,
        "category": "Sanitation",
        "description": "Bamboo eco-dustbins along tourist pathway #2 need replacement after storm.",
        "status": "OPEN",
        "lat": 25.2016,
        "lng": 91.9056,
        "created_at": datetime.now(),
    },
    {
        "issue_id": 9,
        "gp_id": 3,
        "category": "Roads & Infrastructure",
        "description": "Cobblestone pathway near living root bridge trail eroded near stream crossing.",
        "status": "IN_PROGRESS",
        "lat": 25.2035,
        "lng": 91.9080,
        "created_at": datetime.now(),
    },
    # GP 4: Odanthurai, Tamil Nadu (lat: 11.2982, lng: 76.9366)
    {
        "issue_id": 10,
        "gp_id": 4,
        "category": "Water Supply",
        "description": "Solar powered pump inverter tripping during morning high-demand hours in South Ward.",
        "status": "OPEN",
        "lat": 11.2982,
        "lng": 76.9366,
        "created_at": datetime.now(),
    },
    {
        "issue_id": 11,
        "gp_id": 4,
        "category": "Education",
        "description": "Panchayat Union Middle School smart classroom power backup battery requires maintenance.",
        "status": "OPEN",
        "lat": 11.3005,
        "lng": 76.9390,
        "created_at": datetime.now(),
    },
    # GP 5: Piplantri, Rajasthan (lat: 25.0483, lng: 73.8644)
    {
        "issue_id": 12,
        "gp_id": 5,
        "category": "Water Supply",
        "description": "Drip irrigation pipe line damaged in northern community tree plantation grove.",
        "status": "OPEN",
        "lat": 25.0483,
        "lng": 73.8644,
        "created_at": datetime.now(),
    },
    {
        "issue_id": 13,
        "gp_id": 5,
        "category": "Roads & Infrastructure",
        "description": "Marble slurry accumulation on link road to Rajsamand highway blocking drainage.",
        "status": "IN_PROGRESS",
        "lat": 25.0510,
        "lng": 73.8670,
        "created_at": datetime.now(),
    },
    # GP 6: Kuthambakkam, Tamil Nadu (lat: 13.0645, lng: 80.0076)
    {
        "issue_id": 14,
        "gp_id": 6,
        "category": "Water Supply",
        "description": "Community solar RO plant membrane filtration unit needs scheduled servicing for Ward 2.",
        "status": "OPEN",
        "lat": 13.0645,
        "lng": 80.0076,
        "created_at": datetime.now(),
    },
    {
        "issue_id": 15,
        "gp_id": 6,
        "category": "Roads & Infrastructure",
        "description": "Eco-stabilized paver block lane connecting weavers cooperative requires realignment.",
        "status": "IN_PROGRESS",
        "lat": 13.0665,
        "lng": 80.0095,
        "created_at": datetime.now(),
    },
    # GP 7: Keeladi, Tamil Nadu (lat: 9.8647, lng: 78.1884)
    {
        "issue_id": 16,
        "gp_id": 7,
        "category": "Sanitation",
        "description": "Heritage Museum tourist parking zone requires additional bio-digester toilet maintenance.",
        "status": "OPEN",
        "lat": 9.8647,
        "lng": 78.1884,
        "created_at": datetime.now(),
    },
    {
        "issue_id": 17,
        "gp_id": 7,
        "category": "Water Supply",
        "description": "Vaigai river feeder channel sub-canal sluice gate jammed with debris near South Hamlet.",
        "status": "IN_PROGRESS",
        "lat": 9.8670,
        "lng": 78.1910,
        "created_at": datetime.now(),
    },
    # GP 8: Thiruvaiyaru, Tamil Nadu (lat: 10.8794, lng: 79.1039)
    {
        "issue_id": 18,
        "gp_id": 8,
        "category": "Roads & Infrastructure",
        "description": "Cauvery river bund connecting road damaged near Samadhi Ghat during recent seasonal discharge.",
        "status": "OPEN",
        "lat": 10.8794,
        "lng": 79.1039,
        "created_at": datetime.now(),
    },
    {
        "issue_id": 19,
        "gp_id": 8,
        "category": "Education",
        "description": "Government Higher Secondary School laboratory roof tiling maintenance before Northeast Monsoon.",
        "status": "RESOLVED",
        "lat": 10.8815,
        "lng": 79.1065,
        "created_at": datetime.now(),
    },
    # GP 9: Uthiramerur, Tamil Nadu (lat: 12.6321, lng: 79.7610)
    {
        "issue_id": 20,
        "gp_id": 9,
        "category": "Water Supply",
        "description": "Ancient irrigation eri tank feeder channel requires desilting before monsoon filling.",
        "status": "OPEN",
        "lat": 12.6321,
        "lng": 79.7610,
        "created_at": datetime.now(),
    },
    {
        "issue_id": 21,
        "gp_id": 9,
        "category": "Education",
        "description": "Panchayat Union Primary School digital smart-board wiring requires repair in Block B.",
        "status": "OPEN",
        "lat": 12.6345,
        "lng": 79.7635,
        "created_at": datetime.now(),
    },
    # GP 10: Papanasam, Tamil Nadu (lat: 8.7088, lng: 77.3712)
    {
        "issue_id": 22,
        "gp_id": 10,
        "category": "Water Supply",
        "description": "Thamirabarani river pump station intake well screen clogged by natural riverbed silt.",
        "status": "OPEN",
        "lat": 8.7088,
        "lng": 77.3712,
        "created_at": datetime.now(),
    },
    {
        "issue_id": 23,
        "gp_id": 10,
        "category": "Roads & Infrastructure",
        "description": "Western Ghats forest fringe check-post access culvert requires stone embankment reinforcement.",
        "status": "IN_PROGRESS",
        "lat": 8.7110,
        "lng": 77.3735,
        "created_at": datetime.now(),
    },
    # GP 11: Punjaipuliampatti, Tamil Nadu (lat: 11.3540, lng: 77.1720)
    {
        "issue_id": 24,
        "gp_id": 11,
        "category": "Sanitation",
        "description": "Weekly cattle and agricultural produce market waste processing plant motor under repair.",
        "status": "OPEN",
        "lat": 11.3540,
        "lng": 77.1720,
        "created_at": datetime.now(),
    },
    {
        "issue_id": 25,
        "gp_id": 11,
        "category": "Roads & Infrastructure",
        "description": "Bhavanisagar canal link road shoulder erosion after heavy irrigation release.",
        "status": "OPEN",
        "lat": 11.3565,
        "lng": 77.1745,
        "created_at": datetime.now(),
    },
    # GP 12: Hubbathalai, The Nilgiris, Tamil Nadu (lat: 11.3530, lng: 76.7959)
    {
        "issue_id": 26,
        "gp_id": 12,
        "category": "Roads & Infrastructure",
        "description": "Hill road hairpin bend #4 retaining wall damaged by mountain landslide runoff.",
        "status": "IN_PROGRESS",
        "lat": 11.3530,
        "lng": 76.7959,
        "created_at": datetime.now(),
    },
    {
        "issue_id": 27,
        "gp_id": 12,
        "category": "Water Supply",
        "description": "High-altitude natural mountain spring catchment pipe disconnected near tea estate slope.",
        "status": "OPEN",
        "lat": 11.3555,
        "lng": 76.7980,
        "created_at": datetime.now(),
    },
    # GP 13: Kanadukathan, Tamil Nadu (lat: 10.1770, lng: 78.7844)
    {
        "issue_id": 28,
        "gp_id": 13,
        "category": "Water Supply",
        "description": "Heritage Oorani percolation tank stone masonry inlet damaged near Palace Street.",
        "status": "OPEN",
        "lat": 10.1770,
        "lng": 78.7844,
        "created_at": datetime.now(),
    },
    {
        "issue_id": 29,
        "gp_id": 13,
        "category": "Sanitation",
        "description": "Heritage zone organic waste compost unit requires shredder machine maintenance.",
        "status": "RESOLVED",
        "lat": 10.1795,
        "lng": 78.7870,
        "created_at": datetime.now(),
    },
]


# ---------------------------------------------------------------------------
# Data Access Functions with Spatial Conversion
# ---------------------------------------------------------------------------

def fetch_all_panchayats() -> List[Dict[str, Any]]:
    """Retrieves list of all registered Gram Panchayats."""
    query = """
        SELECT gp_id, gp_code, gp_name, district, state, created_at, updated_at
        FROM gram_panchayats
        ORDER BY gp_name ASC;
    """
    try:
        with get_cursor(commit=False) as cur:
            cur.execute(query)
            return [dict(row) for row in cur.fetchall()]
    except Exception as err:
        logger.warning(f"Database query failed ({err}); using mock panchayats.")
        return MOCK_PANCHAYATS


def fetch_panchayat_by_id(gp_id: int) -> Optional[Dict[str, Any]]:
    """Retrieves a single Gram Panchayat by ID."""
    query = """
        SELECT gp_id, gp_code, gp_name, district, state, created_at, updated_at
        FROM gram_panchayats
        WHERE gp_id = %s;
    """
    try:
        with get_cursor(commit=False) as cur:
            cur.execute(query, (gp_id,))
            row = cur.fetchone()
            return dict(row) if row else None
    except Exception as err:
        logger.warning(f"Database query failed ({err}); using mock panchayat.")
        for gp in MOCK_PANCHAYATS:
            if gp["gp_id"] == gp_id:
                return gp
        return MOCK_PANCHAYATS[0] if MOCK_PANCHAYATS else None


def fetch_latest_metrics_for_panchayat(gp_id: int) -> Optional[Dict[str, Any]]:
    """Retrieves the most recent census and infrastructure metrics for a GP."""
    query = """
        SELECT
            metric_id,
            gp_id,
            record_year,
            population,
            households,
            daily_water_supply_liters,
            school_classrooms_count,
            road_coverage_km,
            created_at
        FROM village_metrics
        WHERE gp_id = %s
        ORDER BY record_year DESC
        LIMIT 1;
    """
    try:
        with get_cursor(commit=False) as cur:
            cur.execute(query, (gp_id,))
            row = cur.fetchone()
            return dict(row) if row else None
    except Exception as err:
        logger.warning(f"Database query failed ({err}); using mock metrics.")
        return MOCK_METRICS.get(gp_id, MOCK_METRICS.get(2))


def fetch_all_citizen_issues(
    gp_id: Optional[int] = None,
    category: Optional[str] = None,
) -> List[Dict[str, Any]]:
    """
    Retrieves citizen issues with PostGIS geometry converted to separate
    `lat` (ST_Y) and `lng` (ST_X) float fields for map visualization.
    """
    query = """
        SELECT
            issue_id,
            gp_id,
            category,
            description,
            status,
            ST_Y(location)::FLOAT AS lat,
            ST_X(location)::FLOAT AS lng,
            created_at,
            updated_at
        FROM citizen_issues
        WHERE (%s::INT IS NULL OR gp_id = %s)
          AND (%s::TEXT IS NULL OR category = %s)
        ORDER BY created_at DESC;
    """
    try:
        with get_cursor(commit=False) as cur:
            cur.execute(query, (gp_id, gp_id, category, category))
            rows = cur.fetchall()
            results = []
            for r in rows:
                item = dict(r)
                item["lat"] = float(item["lat"]) if item["lat"] is not None else None
                item["lng"] = float(item["lng"]) if item["lng"] is not None else None
                results.append(item)
            return results
    except Exception as err:
        logger.warning(f"Database query failed ({err}); using mock citizen issues.")
        filtered = [i for i in MOCK_ISSUES if (not gp_id or i["gp_id"] == gp_id) and (not category or i["category"] == category)]
        return filtered


def insert_citizen_issue_postgis(
    gp_id: int,
    category: str,
    description: str,
    lat: float,
    lng: float,
) -> int:
    """
    Inserts a citizen complaint using PostGIS ST_SetSRID(ST_MakePoint(lng, lat), 4326).
    Note: PostGIS ST_MakePoint takes (longitude, latitude) -> (lng, lat).
    """
    query = """
        INSERT INTO citizen_issues (
            gp_id,
            category,
            description,
            status,
            location
        )
        VALUES (
            %s,
            %s,
            %s,
            'OPEN',
            ST_SetSRID(ST_MakePoint(%s, %s), 4326)
        )
        RETURNING issue_id;
    """
    try:
        with get_cursor(commit=True) as cur:
            cur.execute(query, (gp_id, category, description, lng, lat))
            row = cur.fetchone()
            return int(row["issue_id"])
    except Exception as err:
        logger.warning(f"Database insert failed ({err}); creating in-memory issue.")
        new_id = len(MOCK_ISSUES) + 1
        MOCK_ISSUES.insert(0, {
            "issue_id": new_id,
            "gp_id": gp_id,
            "category": category,
            "description": description,
            "status": "OPEN",
            "lat": lat,
            "lng": lng,
            "created_at": datetime.now(),
        })
        return new_id
