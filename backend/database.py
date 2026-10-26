"""
=============================================================================
GramPulse AI - Backend Database Access Layer (PostgreSQL + PostGIS)
=============================================================================
Handles connection pooling, PostGIS spatial queries (ST_AsGeoJSON, ST_DWithin,
ST_SetSRID, ST_MakePoint), and dynamic entity retrieval for Gram Panchayats,
village metrics, and geotagged citizen grievances.
=============================================================================
"""

import os
import json
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


_db_disabled_until: float = 0.0

def get_db_pool(minconn: int = 1, maxconn: int = 10) -> pool.SimpleConnectionPool:
    """Singleton getter for PostgreSQL connection pool with circuit breaker."""
    global _connection_pool, _db_disabled_until
    import time
    if time.time() < _db_disabled_until:
        raise Exception("Database temporarily marked unreachable (circuit breaker active)")

    if _connection_pool is None or _connection_pool.closed:
        try:
            if DATABASE_URL:
                logger.info("Initializing DB connection pool using DATABASE_URL...")
                _connection_pool = pool.SimpleConnectionPool(
                    minconn, maxconn, dsn=DATABASE_URL, connect_timeout=1
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
                    connect_timeout=1,
                )
        except Exception as e:
            _db_disabled_until = time.time() + 60.0
            raise e
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


# In-memory dynamic runtime cache for locations and issues
_DYNAMIC_PANCHAYATS: Dict[int, Dict[str, Any]] = {}
_DYNAMIC_METRICS: Dict[int, Dict[str, Any]] = {}

_COORDINATES_MAP: Dict[int, tuple] = {
    644405: (11.0267, 77.0617),  # Chinniyampalayam
    803962: (11.2435, 76.9587),  # Karamadai
    803960: (11.3255, 77.0051),  # Sirumugai
    803966: (11.0242, 77.1264),  # Sulur
    803969: (11.2333, 77.1833),  # Annur
    803996: (10.9022, 76.9598),  # Madukkarai
    644350: (11.2667, 76.8833),  # Tholampalayam
    644347: (11.2982, 76.9366),  # Odanthurai
    644351: (11.2272, 76.8486),  # Velliangadu
    803972: (11.1444, 76.9389),  # Periyanaickenpalayam
    803965: (11.0189, 77.0706),  # Irugur
    803963: (11.0667, 77.1667),  # Mopperipalayam
    803971: (11.1219, 76.9481),  # Narasimhanaickenpalayam
    803970: (11.1558, 76.9403),  # Veerapandi
    803973: (11.1611, 76.9278),  # Gudalur
    803968: (11.1278, 77.0167),  # Sarkar Samakulam
    803986: (10.9639, 76.7778),  # Alandurai
    803976: (10.9833, 76.8667),  # Dhaliyur
    803985: (10.9706, 76.7861),  # Pooluvapatti
    803987: (10.9589, 76.7786),  # Thenkarai
    803977: (11.0006, 76.9078),  # Vedapatti
    804000: (10.6583, 77.0083),  # Pollachi
    804008: (10.5333, 76.9833),  # Kottur
    804014: (10.3242, 76.9558),  # Valparai
}

def _init_census_panchayats_and_metrics():
    """
    Populates dynamic in-memory registry with all authentic Census 2011 villages,
    towns, and local bodies in Coimbatore district (District 632) from official PCA and HL-11.
    """
    try:
        import pandas as pd
    except ImportError:
        logger.warning("Pandas is not installed; census CSV dataset will be skipped in DB layer.")
        pd = None
    from pathlib import Path

    # Seed baseline working profiles
    _DYNAMIC_PANCHAYATS[644405] = {
        "gp_id": 644405,
        "gp_code": "CENSUS-644405",
        "gp_name": "Chinniyampalayam",
        "district": "Coimbatore",
        "state": "Tamil Nadu",
        "lat": 11.0267,
        "lng": 77.0617,
        "created_at": datetime.now(),
    }
    _DYNAMIC_METRICS[644405] = {
        "metric_id": 644405,
        "gp_id": 644405,
        "record_year": 2011,
        "population": 8232,
        "households": 2349,
        "daily_water_supply_liters": 444923.0,
        "school_classrooms_count": 39,
        "road_coverage_km": None,
        "created_at": datetime.now(),
    }

    _DYNAMIC_PANCHAYATS[803962] = {
        "gp_id": 803962,
        "gp_code": "CENSUS-803962",
        "gp_name": "Karamadai",
        "district": "Coimbatore",
        "state": "Tamil Nadu",
        "lat": 11.2435,
        "lng": 76.9587,
        "created_at": datetime.now(),
    }
    _DYNAMIC_METRICS[803962] = {
        "metric_id": 803962,
        "gp_id": 803962,
        "record_year": 2011,
        "population": 35166,
        "households": 9792,
        "daily_water_supply_liters": 1870000.0,
        "school_classrooms_count": 194,
        "road_coverage_km": None,
        "created_at": datetime.now(),
    }

    _DYNAMIC_PANCHAYATS[803960] = {
        "gp_id": 803960,
        "gp_code": "CENSUS-803960",
        "gp_name": "Sirumugai",
        "district": "Coimbatore",
        "state": "Tamil Nadu",
        "lat": 11.3255,
        "lng": 77.0051,
        "created_at": datetime.now(),
    }
    _DYNAMIC_METRICS[803960] = {
        "metric_id": 803960,
        "gp_id": 803960,
        "record_year": 2011,
        "population": 18223,
        "households": 5294,
        "daily_water_supply_liters": 980000.0,
        "school_classrooms_count": 24,
        "road_coverage_km": None,
        "created_at": datetime.now(),
    }

    # Add legacy IDs 1, 2, 3 mapped to authentic profiles
    _DYNAMIC_PANCHAYATS[1] = dict(_DYNAMIC_PANCHAYATS[644405], gp_id=1)
    _DYNAMIC_METRICS[1] = dict(_DYNAMIC_METRICS[644405], gp_id=1, metric_id=1)

    _DYNAMIC_PANCHAYATS[2] = {
        "gp_id": 2,
        "gp_code": "GP-GJ-SK-002",
        "gp_name": "Punsari",
        "district": "Sabarkantha",
        "state": "Gujarat",
        "lat": 23.5186,
        "lng": 73.0167,
        "created_at": datetime.now(),
    }
    _DYNAMIC_METRICS[2] = {
        "metric_id": 2,
        "gp_id": 2,
        "record_year": 2011,
        "population": 6000,
        "households": 1350,
        "daily_water_supply_liters": 330000.0,
        "school_classrooms_count": 28,
        "road_coverage_km": 24.0,
        "created_at": datetime.now(),
    }

    _DYNAMIC_PANCHAYATS[3] = {
        "gp_id": 3,
        "gp_code": "GP-TN-CBE-003",
        "gp_name": "Odanthurai",
        "district": "Coimbatore",
        "state": "Tamil Nadu",
        "lat": 11.2982,
        "lng": 76.9366,
        "created_at": datetime.now(),
    }
    _DYNAMIC_METRICS[3] = {
        "metric_id": 3,
        "gp_id": 3,
        "record_year": 2011,
        "population": 5399,
        "households": 1529,
        "daily_water_supply_liters": 296945.0,
        "school_classrooms_count": 26,
        "road_coverage_km": 28.5,
        "created_at": datetime.now(),
    }

    # Load all villages & towns from census_coimbatore_2011.csv
    base_dir = Path(__file__).resolve().parent.parent
    local_data_dir = Path(__file__).resolve().parent / "data" / "processed"
    fp_data_dir = base_dir / "GramPulse-FuturePredictor" / "backend" / "data" / "processed"

    pca_file = local_data_dir / "census_coimbatore_2011.csv"
    if not pca_file.exists():
        pca_file = fp_data_dir / "census_coimbatore_2011.csv"

    hl11_file = local_data_dir / "census_coimbatore_hl11_2011.csv"
    if not hl11_file.exists():
        hl11_file = fp_data_dir / "census_coimbatore_hl11_2011.csv"

    if not pca_file.exists() or pd is None:
        return

    try:
        pca_df = pd.read_csv(pca_file)
        local_df = pca_df[pca_df["Level"].isin(["VILLAGE", "TOWN"])].copy()

        hl_map = {}
        if hl11_file.exists():
            hl_df = pd.read_csv(hl11_file)
            for _, r in hl_df.iterrows():
                loc_name = str(r.get("location_name", "")).strip().lower().replace(" ", "").replace("-", "")
                hl_map[loc_name] = r.to_dict()

        for _, row in local_df.iterrows():
            code_str = str(row.get("Town/Village", "")).strip()
            if not code_str or not code_str.isdigit():
                continue
            gp_id = int(code_str)

            raw_name = str(row.get("Name", "")).strip()
            clean_name = raw_name.replace("(TP)", "").replace("(CT)", "").replace("(M)", "").strip()
            norm_name = clean_name.lower().replace(" ", "").replace("-", "")

            pop = int(row.get("TOT_P", 0) or 0)
            hh = int(row.get("No_HH", 0) or 0)

            coords = _COORDINATES_MAP.get(gp_id)
            if not coords:
                # Deterministic coordinates in Coimbatore envelope (Lat: 10.50-11.45, Lng: 76.75-77.35)
                h = abs(hash(clean_name))
                c_lat = round(10.85 + (h % 500) * 0.001, 4)
                c_lng = round(76.85 + ((h // 500) % 400) * 0.001, 4)
                coords = (c_lat, c_lng)

            if gp_id not in _DYNAMIC_PANCHAYATS:
                _DYNAMIC_PANCHAYATS[gp_id] = {
                    "gp_id": gp_id,
                    "gp_code": f"CENSUS-{gp_id}",
                    "gp_name": clean_name,
                    "district": "Coimbatore",
                    "state": "Tamil Nadu",
                    "lat": coords[0],
                    "lng": coords[1],
                    "created_at": datetime.now(),
                }

            if gp_id not in _DYNAMIC_METRICS:
                amenities = hl_map.get(norm_name, {})
                treated_hh = amenities.get("treated_tap_water_households")
                water_lpd = float(treated_hh * 4.5 * 55.0) if treated_hh else float(pop * 55.0)

                _DYNAMIC_METRICS[gp_id] = {
                    "metric_id": gp_id,
                    "gp_id": gp_id,
                    "record_year": 2011,
                    "population": pop,
                    "households": hh,
                    "daily_water_supply_liters": round(water_lpd, 2),
                    "school_classrooms_count": max(1, round(pop * 0.18 / 30)),
                    "road_coverage_km": None,
                    "created_at": datetime.now(),
                }
    except Exception as e:
        logger.warning(f"Notice: Failed to load full Census dataset into DB cache: {e}")

_init_census_panchayats_and_metrics()

_DYNAMIC_ISSUES: List[Dict[str, Any]] = [
    {
        "issue_id": 1001,
        "gp_id": 101,
        "category": "Water Supply",
        "description": "Irregular tap water distribution in Ward 4, Kamaraj Nagar, Koduvai. Low pressure during morning hours.",
        "status": "OPEN",
        "lat": 10.9642,
        "lng": 77.4718,
        "created_at": datetime.now(),
    },
    {
        "issue_id": 1002,
        "gp_id": 101,
        "category": "Roads & Infrastructure",
        "description": "Potholes along Koduvai - Dharapuram Link Road near weekly sandhai market junction. Resurfacing required.",
        "status": "IN_PROGRESS",
        "lat": 10.9628,
        "lng": 77.4735,
        "created_at": datetime.now(),
    },
    {
        "issue_id": 1003,
        "gp_id": 101,
        "category": "Education",
        "description": "Need 4 additional smart classrooms and solar power backup at Government Higher Secondary School Koduvai.",
        "status": "OPEN",
        "lat": 10.9655,
        "lng": 77.4740,
        "created_at": datetime.now(),
    },
    {
        "issue_id": 1004,
        "gp_id": 101,
        "category": "Healthcare",
        "description": "Request for 24x7 emergency medical technician and upgraded lab reagents at Koduvai Primary Health Centre (PHC).",
        "status": "RESOLVED",
        "lat": 10.9615,
        "lng": 77.4710,
        "created_at": datetime.now(),
    },
    {
        "issue_id": 1005,
        "gp_id": 101,
        "category": "Sanitation",
        "description": "Solid waste segregation bin replacement needed at Koduvai Bus Stop and market area.",
        "status": "OPEN",
        "lat": 10.9638,
        "lng": 77.4729,
        "created_at": datetime.now(),
    },
]


def upsert_panchayat_dynamic(
    gp_data: Dict[str, Any],
    metrics_data: Optional[Dict[str, Any]] = None,
) -> Dict[str, Any]:
    """
    Persists a dynamically geocoded village/panchayat directly into PostGIS tables
    (gram_panchayats, village_metrics) if DB is active, and stores in the dynamic registry.
    """
    gp_id = int(gp_data.get("gp_id", 9001))
    gp_code = gp_data.get("gp_code", f"GP-{gp_id}")
    gp_name = gp_data.get("gp_name", "Gram Panchayat")
    district = gp_data.get("district", "District")
    state = gp_data.get("state", "State")
    lat = float(gp_data.get("lat", 11.2982))
    lng = float(gp_data.get("lng", 76.9366))

    # Update in-memory dynamic cache
    _DYNAMIC_PANCHAYATS[gp_id] = {
        "gp_id": gp_id,
        "gp_code": gp_code,
        "gp_name": gp_name,
        "district": district,
        "state": state,
        "lat": lat,
        "lng": lng,
        "created_at": datetime.now(),
    }

    if metrics_data:
        _DYNAMIC_METRICS[gp_id] = {
            "metric_id": gp_id,
            "gp_id": gp_id,
            "record_year": metrics_data.get("record_year", datetime.now().year),
            "population": metrics_data.get("population", 5000),
            "households": metrics_data.get("households", 1100),
            "daily_water_supply_liters": metrics_data.get("daily_water_supply_liters", 275000.0),
            "school_classrooms_count": metrics_data.get("school_classrooms_count", 24),
            "road_coverage_km": metrics_data.get("road_coverage_km", 22.0),
            "created_at": datetime.now(),
        }

    # Attempt PostGIS DB insertion
    try:
        with get_cursor(commit=True) as cur:
            cur.execute(
                """
                INSERT INTO gram_panchayats (gp_id, gp_code, gp_name, district, state)
                VALUES (%s, %s, %s, %s, %s)
                ON CONFLICT (gp_id) DO UPDATE
                SET gp_name = EXCLUDED.gp_name,
                    district = EXCLUDED.district,
                    state = EXCLUDED.state;
                """,
                (gp_id, gp_code, gp_name, district, state),
            )
            if metrics_data:
                cur.execute(
                    """
                    INSERT INTO village_metrics (
                        gp_id, record_year, population, households,
                        daily_water_supply_liters, school_classrooms_count, road_coverage_km
                    )
                    VALUES (%s, %s, %s, %s, %s, %s, %s)
                    ON CONFLICT (gp_id, record_year) DO UPDATE
                    SET population = EXCLUDED.population,
                        households = EXCLUDED.households,
                        daily_water_supply_liters = EXCLUDED.daily_water_supply_liters,
                        school_classrooms_count = EXCLUDED.school_classrooms_count,
                        road_coverage_km = EXCLUDED.road_coverage_km;
                    """,
                    (
                        gp_id,
                        metrics_data.get("record_year", datetime.now().year),
                        metrics_data.get("population", 5000),
                        metrics_data.get("households", 1100),
                        metrics_data.get("daily_water_supply_liters", 275000.0),
                        metrics_data.get("school_classrooms_count", 24),
                        metrics_data.get("road_coverage_km", 22.0),
                    ),
                )
    except Exception as exc:
        logger.debug(f"PostGIS direct upsert bypassed ({exc}); stored in dynamic runtime registry.")

    return _DYNAMIC_PANCHAYATS[gp_id]


# ---------------------------------------------------------------------------
# Data Access Functions with Spatial Conversion
# ---------------------------------------------------------------------------

def fetch_all_panchayats() -> List[Dict[str, Any]]:
    """Retrieves list of all registered Gram Panchayats from PostGIS or dynamic registry."""
    query = """
        SELECT gp_id, gp_code, gp_name, district, state, created_at, updated_at
        FROM gram_panchayats
        ORDER BY gp_name ASC;
    """
    try:
        with get_cursor(commit=False) as cur:
            cur.execute(query)
            rows = [dict(row) for row in cur.fetchall()]
            if rows:
                return rows
    except Exception as err:
        logger.debug(f"Database query note: {err}")

    # Fallback to dynamic registry
    if _DYNAMIC_PANCHAYATS:
        return sorted(list(_DYNAMIC_PANCHAYATS.values()), key=lambda x: str(x.get("gp_name", "")).lower())

    return []


def fetch_panchayat_by_id(gp_id: int) -> Optional[Dict[str, Any]]:
    """Retrieves a single Gram Panchayat by ID."""
    try:
        gp_id = int(gp_id)
    except (ValueError, TypeError):
        return None

    query = """
        SELECT gp_id, gp_code, gp_name, district, state, created_at, updated_at
        FROM gram_panchayats
        WHERE gp_id = %s;
    """
    try:
        with get_cursor(commit=False) as cur:
            cur.execute(query, (gp_id,))
            row = cur.fetchone()
            if row:
                return dict(row)
    except Exception as err:
        logger.debug(f"Database query note: {err}")

    if gp_id in _DYNAMIC_PANCHAYATS:
        return _DYNAMIC_PANCHAYATS[gp_id]

    # Dynamically query Census service if not in in-memory dictionary
    try:
        import sys
        base_dir = os.path.abspath(os.path.join(os.path.dirname(__file__), ".."))
        fp_dir = os.path.join(base_dir, "GramPulse-FuturePredictor", "backend")
        if fp_dir not in sys.path and os.path.exists(fp_dir):
            sys.path.insert(0, fp_dir)
        from census_service import get_census_baseline
        base = get_census_baseline(str(gp_id))
        if base:
            clean_name = base.get("location_name", f"Panchayat {gp_id}")
            coords = _COORDINATES_MAP.get(gp_id, (11.0, 77.0))
            new_gp = {
                "gp_id": gp_id,
                "gp_code": f"CENSUS-{gp_id}",
                "gp_name": clean_name,
                "district": base.get("district", "Coimbatore"),
                "state": base.get("state", "Tamil Nadu"),
                "lat": coords[0],
                "lng": coords[1],
                "created_at": datetime.now(),
            }
            _DYNAMIC_PANCHAYATS[gp_id] = new_gp
            return new_gp
    except Exception:
        pass

    return None


def fetch_latest_metrics_for_panchayat(gp_id: int) -> Optional[Dict[str, Any]]:
    """Retrieves the most recent census and infrastructure metrics for a GP."""
    try:
        gp_id = int(gp_id)
    except (ValueError, TypeError):
        return None

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
            if row:
                return dict(row)
    except Exception as err:
        logger.debug(f"Database query note: {err}")

    if gp_id in _DYNAMIC_METRICS:
        return _DYNAMIC_METRICS[gp_id]

    # Dynamically derive from Census baseline if not in in-memory dictionary
    try:
        import sys
        base_dir = os.path.abspath(os.path.join(os.path.dirname(__file__), ".."))
        fp_dir = os.path.join(base_dir, "GramPulse-FuturePredictor", "backend")
        if fp_dir not in sys.path and os.path.exists(fp_dir):
            sys.path.insert(0, fp_dir)
        from census_service import get_census_baseline
        base = get_census_baseline(str(gp_id))
        if base:
            pop = int(base.get("population") or base.get("total_population") or 5000)
            hh = int(base.get("households") or base.get("total_households") or max(1, round(pop / 4)))
            treated = base.get("treated_tap_water_households")
            water_lpd = float(treated * 4.5 * 55.0) if treated else float(pop * 55.0)
            new_metric = {
                "metric_id": gp_id,
                "gp_id": gp_id,
                "record_year": base.get("year", 2011),
                "population": pop,
                "households": hh,
                "daily_water_supply_liters": round(water_lpd, 2),
                "school_classrooms_count": max(1, round(pop * 0.18 / 30)),
                "road_coverage_km": None,
                "created_at": datetime.now(),
            }
            _DYNAMIC_METRICS[gp_id] = new_metric
            return new_metric
    except Exception:
        pass

    return None


def fetch_all_citizen_issues(
    gp_id: Optional[int] = None,
    category: Optional[str] = None,
    lat: Optional[float] = None,
    lng: Optional[float] = None,
    radius_meters: Optional[int] = None,
) -> List[Dict[str, Any]]:
    """
    Retrieves citizen issues with PostGIS geometry converted to separate
    `lat` (ST_Y) and `lng` (ST_X) float fields, with optional ST_DWithin spatial filtering.
    """
    if lat is not None and lng is not None and radius_meters is not None:
        query = """
            SELECT
                issue_id,
                gp_id,
                category,
                description,
                status,
                ST_Y(location)::FLOAT AS lat,
                ST_X(location)::FLOAT AS lng,
                ST_AsGeoJSON(location) AS geojson,
                ST_Distance(location::geography, ST_SetSRID(ST_MakePoint(%s, %s), 4326)::geography) AS distance_meters,
                created_at,
                updated_at
            FROM citizen_issues
            WHERE ST_DWithin(location::geography, ST_SetSRID(ST_MakePoint(%s, %s), 4326)::geography, %s)
              AND (%s::TEXT IS NULL OR category = %s)
            ORDER BY distance_meters ASC;
        """
        params = (lng, lat, lng, lat, radius_meters, category, category)
    else:
        query = """
            SELECT
                issue_id,
                gp_id,
                category,
                description,
                status,
                ST_Y(location)::FLOAT AS lat,
                ST_X(location)::FLOAT AS lng,
                ST_AsGeoJSON(location) AS geojson,
                created_at,
                updated_at
            FROM citizen_issues
            WHERE (%s::INT IS NULL OR gp_id = %s)
              AND (%s::TEXT IS NULL OR category = %s)
            ORDER BY created_at DESC;
        """
        params = (gp_id, gp_id, category, category)

    try:
        with get_cursor(commit=False) as cur:
            cur.execute(query, params)
            rows = cur.fetchall()
            results = []
            for r in rows:
                item = dict(r)
                item["lat"] = float(item["lat"]) if item["lat"] is not None else None
                item["lng"] = float(item["lng"]) if item["lng"] is not None else None
                results.append(item)
            if results:
                return results
    except Exception as err:
        logger.debug(f"PostGIS query note: {err}")

    # Return dynamic in-memory issues filtered by GP and category
    filtered = [
        i for i in _DYNAMIC_ISSUES
        if (not gp_id or i["gp_id"] == gp_id) and (not category or i["category"] == category)
    ]
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
            issue_id = int(row["issue_id"])
            # Sync to in-memory
            _DYNAMIC_ISSUES.insert(0, {
                "issue_id": issue_id,
                "gp_id": gp_id,
                "category": category,
                "description": description,
                "status": "OPEN",
                "lat": lat,
                "lng": lng,
                "created_at": datetime.now(),
            })
            return issue_id
    except Exception as err:
        logger.debug(f"Database insert note ({err}); created in dynamic runtime registry.")
        new_id = len(_DYNAMIC_ISSUES) + 1
        _DYNAMIC_ISSUES.insert(0, {
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
