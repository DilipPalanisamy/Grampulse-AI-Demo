"""
=============================================================================
GramPulse AI - Database Helpers & PostGIS Data Access Layer
=============================================================================
Provides clean data access routines for village metrics, historical demographics,
and spatial PostGIS operations for geotagged citizen grievances.
=============================================================================
"""

import os
import logging
from typing import Optional, List, Dict, Any
from contextlib import contextmanager

# Load environment variables from .env file
from dotenv import load_dotenv

load_dotenv()

try:
    import psycopg2
    from psycopg2 import pool, extras
except ImportError:
    raise ImportError(
        "psycopg2 is required. Please install it using: pip install psycopg2-binary"
    )

# ---------------------------------------------------------------------------
# Logging Configuration
# ---------------------------------------------------------------------------
logger = logging.getLogger("GramPulse-DB-Helpers")
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
# Connection Configuration & Pool Manager
# ---------------------------------------------------------------------------
DB_HOST: str = os.getenv("DB_HOST", "localhost")
DB_PORT: int = int(os.getenv("DB_PORT", "5432"))
DB_NAME: str = os.getenv("DB_NAME", os.getenv("POSTGRES_DB", "grampulse_db"))
DB_USER: str = os.getenv("DB_USER", os.getenv("POSTGRES_USER", "postgres"))
DB_PASSWORD: str = os.getenv("DB_PASSWORD", os.getenv("POSTGRES_PASSWORD", "postgres"))
DB_SSLMODE: str = os.getenv("DB_SSLMODE", "prefer")

_connection_pool: Optional[pool.SimpleConnectionPool] = None


def get_connection_pool(minconn: int = 1, maxconn: int = 10) -> pool.SimpleConnectionPool:
    """
    Initializes (if not already initialized) and returns the singleton connection pool.
    """
    global _connection_pool
    if _connection_pool is None or _connection_pool.closed:
        try:
            logger.info(f"Initializing connection pool for '{DB_NAME}' at {DB_HOST}:{DB_PORT}...")
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
            logger.info("Connection pool successfully created.")
        except psycopg2.Error as err:
            logger.error(f"Failed to create connection pool: {err}")
            raise
    return _connection_pool


@contextmanager
def get_db_connection():
    """
    Context manager to acquire and return a connection from the pool.
    Ensures safe release back to the pool upon completion or failure.
    """
    conn_pool = get_connection_pool()
    conn = conn_pool.getconn()
    try:
        yield conn
    finally:
        conn_pool.putconn(conn)


@contextmanager
def get_db_cursor(commit: bool = False):
    """
    Context manager for database cursors using RealDictCursor for dictionary results.
    
    :param commit: If True, commits the transaction on success.
    """
    with get_db_connection() as conn:
        with conn.cursor(cursor_factory=extras.RealDictCursor) as cur:
            try:
                yield cur
                if commit:
                    conn.commit()
            except Exception as e:
                if commit:
                    conn.rollback()
                logger.error(f"Database query error: {e}")
                raise


def close_connection_pool() -> None:
    """Closes all connections in the pool. Call during application shutdown."""
    global _connection_pool
    if _connection_pool and not _connection_pool.closed:
        _connection_pool.closeall()
        logger.info("Database connection pool closed.")
        _connection_pool = None


# ---------------------------------------------------------------------------
# Data Access Functions
# ---------------------------------------------------------------------------

def fetch_historical_metrics(gp_id: int) -> List[Dict[str, Any]]:
    """
    Retrieves historical demographic, utility, and infrastructure metrics
    for a specific Gram Panchayat, sorted chronologically by record year.

    :param gp_id: Unique integer identifier of the Gram Panchayat.
    :return: A list of dictionaries representing the metrics records sorted by year ASC.
    """
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
        ORDER BY record_year ASC;
    """
    try:
        with get_db_cursor(commit=False) as cur:
            cur.execute(query, (gp_id,))
            records = cur.fetchall()
            return [dict(row) for row in records]
    except psycopg2.Error as err:
        logger.error(f"Error fetching historical metrics for gp_id={gp_id}: {err}")
        raise


def insert_citizen_issue(
    gp_id: int,
    category: str,
    description: str,
    lat: float,
    lng: float,
) -> int:
    """
    Inserts a geotagged citizen complaint using PostGIS geometry point (SRID 4326).
    Note: PostGIS ST_MakePoint takes (longitude, latitude) -> (lng, lat).

    :param gp_id: Unique integer identifier of the Gram Panchayat.
    :param category: Issue classification (e.g., 'Water Supply', 'Roads & Infrastructure', etc.).
    :param description: Detailed text description of the grievance.
    :param lat: Latitude coordinate (-90.0 to 90.0).
    :param lng: Longitude coordinate (-180.0 to 180.0).
    :return: The generated primary key issue_id of the newly created record.
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
        with get_db_cursor(commit=True) as cur:
            cur.execute(query, (gp_id, category, description, lng, lat))
            row = cur.fetchone()
            if not row:
                raise RuntimeError("Failed to retrieve generated issue_id after insertion.")
            issue_id: int = row["issue_id"]
            logger.info(
                f"Successfully registered citizen issue #{issue_id} "
                f"for GP {gp_id} in category '{category}' at ({lat}, {lng})."
            )
            return issue_id
    except psycopg2.Error as err:
        logger.error(f"Error inserting citizen issue for gp_id={gp_id}: {err}")
        raise


def fetch_issues_by_category(
    gp_id: int,
    category: Optional[str] = None,
) -> List[Dict[str, Any]]:
    """
    Extracts citizen issues for a given Gram Panchayat, optionally filtered by category.
    Parses the PostGIS geometry point back into separate `lat` and `lng` float fields
    for seamless rendering on frontend GIS maps (e.g. Leaflet.js).

    :param gp_id: Unique integer identifier of the Gram Panchayat.
    :param category: Optional category string filter. If None or empty, returns issues across all categories.
    :return: A list of issue dictionaries containing separate 'lat' and 'lng' float properties.
    """
    if category:
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
            WHERE gp_id = %s AND category = %s
            ORDER BY created_at DESC;
        """
        params = (gp_id, category)
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
                created_at,
                updated_at
            FROM citizen_issues
            WHERE gp_id = %s
            ORDER BY created_at DESC;
        """
        params = (gp_id,)

    try:
        with get_db_cursor(commit=False) as cur:
            cur.execute(query, params)
            records = cur.fetchall()
            results = []
            for row in records:
                issue = dict(row)
                # Ensure lat and lng are explicit floats
                issue["lat"] = float(issue["lat"]) if issue["lat"] is not None else None
                issue["lng"] = float(issue["lng"]) if issue["lng"] is not None else None
                results.append(issue)
            return results
    except psycopg2.Error as err:
        logger.error(
            f"Error fetching issues for gp_id={gp_id} (category={category}): {err}"
        )
        raise
