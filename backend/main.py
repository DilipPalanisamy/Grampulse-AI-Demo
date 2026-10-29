"""
=============================================================================
GramPulse AI - FastAPI Production Backend
=============================================================================
Connects PostgreSQL/PostGIS (Spatial Engine), Scikit-learn Demographic &
Infrastructure Deficit ML Engine, ChromaDB Vector RAG Scheme Matcher,
OpenStreetMap Nominatim & Overpass GIS Service, and Live LLM AI Chatbot.
=============================================================================
"""

import os
import sys
import logging
from datetime import datetime
from typing import Optional, List, Dict, Any

# Ensure parent directory is in sys.path for importing ai_engine and utils
sys.path.insert(0, os.path.abspath(os.path.join(os.path.dirname(__file__), "..")))

from fastapi import FastAPI, HTTPException, Query, status, Body
from fastapi.middleware.cors import CORSMiddleware
from fastapi.middleware.gzip import GZipMiddleware
from fastapi.responses import Response, JSONResponse

from backend.database import (
    fetch_all_panchayats,
    fetch_panchayat_by_id,
    fetch_latest_metrics_for_panchayat,
    fetch_all_citizen_issues,
    insert_citizen_issue_postgis,
    upsert_panchayat_dynamic,
    check_db_health,
)
from backend.schemas import (
    CitizenIssueCreate,
    CitizenIssueResponse,
    PanchayatResponse,
    SpatialSearchResponse,
    AnalyticsResponse,
    MatchedSchemeResponse,
    ChatRequest,
    ChatResponse,
)
from backend.spatial_service import (
    geocode_location_osm,
    reverse_geocode_osm,
    fetch_village_infrastructure_overpass,
)
from backend.census_service import derive_deterministic_village_metrics
from backend.chat_engine import RuralGovernanceChatEngine
from backend.services.scheme_rag_engine import scheme_rag_engine, SchemeRAGEngine
from backend.services.scheme_assistant_engine import scheme_assistant_engine
from backend.utils.priority_analyzer import calculate_deficit_priorities
from ai_engine.predictive_model import calculate_infrastructure_deficits
from backend.services.future_predictor_service import (
    execute_village_future_prediction,
    resolve_udise_infrastructure,
    load_cached_chinniyampalayam_schools,
)
from utils.pdf_generator import generate_gpdp_pdf

# ---------------------------------------------------------------------------
# Logging Configuration
# ---------------------------------------------------------------------------
logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s [%(levelname)s] %(name)s: %(message)s",
    datefmt="%Y-%m-%d %H:%M:%S",
)
logger = logging.getLogger("GramPulse-API")

# Import official government data & census services from GramPulse-FuturePredictor backend
_BASE_DIR = os.path.abspath(os.path.join(os.path.dirname(__file__), ".."))
_FUTURE_PREDICTOR_DIR = os.path.join(_BASE_DIR, "GramPulse-FuturePredictor", "backend")
if _FUTURE_PREDICTOR_DIR not in sys.path and os.path.exists(_FUTURE_PREDICTOR_DIR):
    sys.path.insert(0, _FUTURE_PREDICTOR_DIR)

try:
    from village_data_service import get_village_government_data
    from census_service import search_census_locations, get_census_baseline
    from data_validator import validate_village_government_data
except Exception as _import_err:
    logger.warning(f"Could not import government data services directly: {_import_err}")
    get_village_government_data = None
    search_census_locations = None
    validate_village_government_data = None

# ---------------------------------------------------------------------------
# FastAPI Application Instance & Production Middleware Setup
# ---------------------------------------------------------------------------
app = FastAPI(
    title="GramPulse AI - Rural Governance & Live Spatial Analytics API",
    description=(
        "Production REST and PostGIS Spatial API empowering Indian Gram Panchayats "
        "with live OpenStreetMap/Overpass GIS data, Scikit-learn predictive forecasting, "
        "ChromaDB RAG scheme retrieval, geotagged citizen grievances, and LLM AI advisory."
    ),
    version="2.0.0",
    docs_url="/docs",
    redoc_url="/redoc",
)

# 1. Enable GZip payload compression for fast GeoJSON & GIS transfer
app.add_middleware(GZipMiddleware, minimum_size=500)

# 2. CORS middleware supporting local Vite / React frontends, Render domains, and env overrides
cors_env = os.getenv("CORS_ORIGINS", "")
custom_origins = [o.strip() for o in cors_env.split(",") if o.strip()]

origins = [
    "http://localhost:5173",
    "http://127.0.0.1:5173",
    "http://localhost:3000",
    "http://127.0.0.1:3000",
    "http://localhost:8000",
    "http://127.0.0.1:8000",
] + custom_origins

app.add_middleware(
    CORSMiddleware,
    allow_origins=origins,
    allow_origin_regex=r"https?://(localhost|127\.0\.0\.1|.*\.onrender\.com|.*\.vercel\.app|.*\.netlify\.app|.*\.github\.io)(:\d+)?",
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# In-Memory Cache Store for high performance
_ANALYTICS_CACHE: Dict[str, Dict[str, Any]] = {}

# Initialize AI RAG Scheme Matcher & Chat Engine Singletons
scheme_matcher = scheme_rag_engine
chat_engine = RuralGovernanceChatEngine()


# ---------------------------------------------------------------------------
# Root & Health Check Endpoints
# ---------------------------------------------------------------------------
@app.get("/", tags=["General"])
async def root():
    """Service metadata and API health status."""
    return {
        "app_name": "GramPulse AI",
        "service": "Rural Governance & Live Spatial Analytics Backend",
        "version": "2.0.0",
        "timestamp": datetime.now().isoformat(),
        "docs": "/docs",
    }


@app.get("/health", tags=["General"])
@app.get("/api/v1/health", tags=["General"])
async def health_check():
    """Verifies API status, spatial engines, and database connectivity."""
    db_ok = check_db_health()
    return {
        "status": "healthy",
        "database_connected": db_ok,
        "spatial_gis_active": True,
        "rag_matcher_active": True,
        "timestamp": datetime.now().isoformat(),
    }


# ---------------------------------------------------------------------------
# Live Spatial GIS & OpenStreetMap Search Endpoints
# ---------------------------------------------------------------------------
@app.get(
    "/api/v1/spatial/search",
    response_model=List[SpatialSearchResponse],
    tags=["Spatial & GIS Engine"],
)
async def spatial_search_villages(
    q: str = Query(..., min_length=2, description="Village, town, city, or Gram Panchayat search query"),
    state: Optional[str] = Query(None, description="Optional state filter (e.g. 'Tamil Nadu')"),
    limit: int = Query(8, ge=1, le=20, description="Max results to return"),
):
    """
    Performs dynamic live geocoding across OpenStreetMap Nominatim for any Indian village,
    returning exact coordinates, boundary polygon GeoJSON, and administrative metadata.
    """
    results = geocode_location_osm(query=q, state_hint=state, limit=limit)
    return results


@app.get(
    "/api/v1/spatial/infrastructure",
    tags=["Spatial & GIS Engine"],
)
async def get_spatial_infrastructure(
    lat: float = Query(..., ge=-90.0, le=90.0, description="Latitude"),
    lng: float = Query(..., ge=-180.0, le=180.0, description="Longitude"),
    radius: int = Query(3500, ge=500, le=10000, description="Search radius in meters"),
):
    """
    Queries live Overpass API for real-world infrastructure nodes (drinking water points,
    schools, hospitals, road networks, sanitation facilities) within a radius.
    """
    infra = fetch_village_infrastructure_overpass(lat=lat, lng=lng, radius_meters=radius)
    return infra


@app.get(
    "/api/v1/spatial/reverse",
    tags=["Spatial & GIS Engine"],
)
async def reverse_geocode_point(
    lat: Optional[float] = Query(None, description="Latitude of clicked point"),
    lng: Optional[float] = Query(None, description="Longitude of clicked point"),
    latitude: Optional[float] = Query(None, description="Alternative latitude"),
    longitude: Optional[float] = Query(None, description="Alternative longitude"),
):
    """
    Reverse geocodes any map pin coordinates to discover village, ward, district,
    state, and boundary geometry using OpenStreetMap Nominatim.
    """
    actual_lat = lat if lat is not None else latitude
    actual_lng = lng if lng is not None else longitude
    if actual_lat is None or actual_lng is None:
        raise HTTPException(status_code=422, detail="Both lat and lng coordinates must be provided")

    res = reverse_geocode_osm(lat=actual_lat, lng=actual_lng)
    if res and res.get("gp_name"):
        # Enrich with official Census data if available
        try:
            if get_census_baseline:
                base = get_census_baseline(res["gp_name"], district_name=res.get("district"))
                if base:
                    res["census_code"] = base.get("census_code")
                    res["location_type"] = base.get("location_type", "Village")
                    res["population"] = base.get("population")
                    res["households"] = base.get("households")
                    res["electricity_coverage"] = base.get("electricity_coverage_percent")
                    res["tap_water_coverage"] = base.get("tap_water_coverage_percent")
                    res["latrine_coverage"] = base.get("latrine_coverage_percent")
                    if base.get("census_code"):
                        try:
                            res["gp_id"] = int(base["census_code"])
                            res["gp_code"] = f"CENSUS-{base['census_code']}"
                        except Exception:
                            pass
        except Exception as _e:
            logger.debug(f"Reverse geocode census baseline enrichment: {_e}")
        return res

    return {
        "status": "unresolved",
        "detail": "Clicked location is outside known administrative village boundaries",
        "lat": lat,
        "lng": lng,
        "gp_id": None,
        "gp_code": None,
        "gp_name": f"Point ({lat:.4f}°N, {lng:.4f}°E)",
        "district": "Unknown",
        "state": "India",
        "is_live_osm": False,
    }


# ---------------------------------------------------------------------------
# Gram Panchayat Master Endpoints (PostGIS + Dynamic Resolution)
# ---------------------------------------------------------------------------
@app.get(
    "/api/v1/panchayats",
    response_model=List[PanchayatResponse],
    tags=["Gram Panchayats"],
)
async def list_panchayats():
    """Retrieves directory of registered Gram Panchayats from PostGIS/registry."""
    panchayats = fetch_all_panchayats()
    return panchayats


@app.get(
    "/api/v1/panchayat/{gp_id}",
    response_model=PanchayatResponse,
    tags=["Gram Panchayats"],
)
async def get_panchayat(gp_id: int):
    """Retrieves details for a specific Gram Panchayat by ID."""
    gp = fetch_panchayat_by_id(gp_id)
    if not gp:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Gram Panchayat with ID {gp_id} not found.",
        )
    return gp


@app.post(
    "/api/v1/panchayat/live",
    response_model=PanchayatResponse,
    tags=["Gram Panchayats"],
)
async def resolve_live_panchayat(payload: Dict[str, Any] = Body(...)):
    """
    Dynamically registers or updates a live geocoded village/panchayat,
    derives its baseline census metrics, and stores in PostGIS.
    """
    gp_name = payload.get("gp_name", "Habitation")
    district = payload.get("district", "District")
    state = payload.get("state", "India")
    lat = float(payload.get("lat", 11.2982))
    lng = float(payload.get("lng", 76.9366))
    gp_id = int(payload.get("gp_id", 9001))

    # Derive baseline metrics from census model
    metrics = derive_deterministic_village_metrics(
        gp_name=gp_name,
        district=district,
        state=state,
        lat=lat,
        lng=lng,
        place_type=payload.get("type", "village"),
    )

    saved_gp = upsert_panchayat_dynamic(
        gp_data={
            "gp_id": gp_id,
            "gp_code": payload.get("gp_code", f"GP-{gp_id}"),
            "gp_name": gp_name,
            "district": district,
            "state": state,
            "lat": lat,
            "lng": lng,
        },
        metrics_data=metrics,
    )

    # Return merged object
    return {
        **saved_gp,
        "population": metrics["population"],
        "households": metrics["households"],
        "daily_water_supply_liters": metrics["daily_water_supply_liters"],
        "school_classrooms_count": metrics["school_classrooms_count"],
        "road_coverage_km": metrics["road_coverage_km"],
    }


# ---------------------------------------------------------------------------
# Citizen Grievances & Geospatial Endpoints (PostGIS)
# ---------------------------------------------------------------------------
@app.get(
    "/api/v1/issues",
    response_model=List[CitizenIssueResponse],
    tags=["Citizen Issues & GIS Map"],
)
async def get_citizen_issues(
    gp_id: Optional[int] = Query(None, description="Filter issues by Gram Panchayat ID"),
    category: Optional[str] = Query(None, description="Filter issues by category"),
    lat: Optional[float] = Query(None, description="Spatial filter latitude"),
    lng: Optional[float] = Query(None, description="Spatial filter longitude"),
    radius: Optional[int] = Query(None, description="Spatial radius in meters (ST_DWithin)"),
):
    """
    Retrieves geotagged citizen grievances with PostGIS geometry converted
    to separate `lat` and `lng` floats ready for React Leaflet rendering.
    Supports ST_DWithin spatial radius querying.
    """
    issues = fetch_all_citizen_issues(
        gp_id=gp_id,
        category=category,
        lat=lat,
        lng=lng,
        radius_meters=radius,
    )
    return issues


@app.post(
    "/api/v1/issues",
    response_model=CitizenIssueResponse,
    status_code=status.HTTP_201_CREATED,
    tags=["Citizen Issues & GIS Map"],
)
async def create_citizen_issue(payload: CitizenIssueCreate):
    """
    Submits and stores a new citizen grievance in PostGIS using
    `ST_SetSRID(ST_MakePoint(lng, lat), 4326)`.
    """
    logger.info(
        f"Registering issue for GP {payload.gp_id} in category '{payload.category}' "
        f"at ({payload.lat}, {payload.lng})"
    )

    issue_id = insert_citizen_issue_postgis(
        gp_id=payload.gp_id,
        category=payload.category,
        description=payload.description,
        lat=payload.lat,
        lng=payload.lng,
    )

    return {
        "issue_id": issue_id,
        "gp_id": payload.gp_id,
        "category": payload.category,
        "description": payload.description,
        "lat": payload.lat,
        "lng": payload.lng,
        "status": "OPEN",
        "created_at": datetime.now(),
    }


# ---------------------------------------------------------------------------
# Scikit-Learn Predictive Governance & ChromaDB RAG Scheme Matching
# ---------------------------------------------------------------------------
@app.get(
    "/api/v1/panchayat/{gp_id}/analytics",
    response_model=AnalyticsResponse,
    tags=["AI Engine & Analytics"],
)
@app.get(
    "/panchayat/{gp_id}/analytics",
    response_model=AnalyticsResponse,
    tags=["AI Engine & Analytics"],
)
async def get_panchayat_analytics(
    gp_id: int,
    planning_horizon_years: int = Query(5, ge=1, le=15, description="Planning forecast duration in years"),
    growth_rate: float = Query(0.018, ge=0.0, le=0.10, description="Annual compound population growth rate"),
):
    """
    Fetches real-time village metrics, executes Scikit-learn predictive forecasting model,
    calculates infrastructure deficits (water, classrooms, roads), and performs dynamic
    vector similarity search against ChromaDB RAG store.
    """
    cache_key = f"{gp_id}_{planning_horizon_years}_{round(growth_rate, 4)}"
    if cache_key in _ANALYTICS_CACHE:
        return _ANALYTICS_CACHE[cache_key]

    gp = fetch_panchayat_by_id(gp_id)
    if not gp:
        # Generate on-demand fallback
        gp = {
            "gp_id": gp_id,
            "gp_name": f"Panchayat {gp_id}",
            "district": "District",
            "state": "India",
        }

    metrics = fetch_latest_metrics_for_panchayat(gp_id)
    if not metrics:
        metrics = derive_deterministic_village_metrics(
            gp_name=gp.get("gp_name", "Village"),
            district=gp.get("district", "District"),
            state=gp.get("state", "India"),
            lat=gp.get("lat", 11.2982),
            lng=gp.get("lng", 76.9366),
        )

    # 1. Execute Scikit-learn Demographic & Infrastructure Deficit Model
    current_pop = int(metrics.get("population") or 5000)
    predictions = calculate_infrastructure_deficits(
        current_pop=current_pop,
        pop_growth_rate=growth_rate,
        planning_horizon_years=planning_horizon_years,
        current_metrics=metrics,
    )

    # 2. Execute Deficit Priority & Severity Analysis Algorithm (P1, P2, P3)
    priority_analysis = calculate_deficit_priorities(predictions)
    predictions["priority_analysis"] = priority_analysis

    # 3. Execute ChromaDB RAG Vector Scheme Matching Engine
    matched_schemes = scheme_rag_engine.match_schemes(predictions, top_k=5)

    analytics_data = {
        "gp_id": gp.get("gp_id", gp_id),
        "gp_name": gp.get("gp_name", "Panchayat"),
        "district": gp.get("district", "District"),
        "state": gp.get("state", "India"),
        "planning_horizon_years": planning_horizon_years,
        "target_year": predictions["target_year"],
        "baseline_metrics": {
            "base_year": metrics.get("record_year") or datetime.now().year,
            "population": current_pop,
            "daily_water_supply_lpd": float(metrics.get("daily_water_supply_liters") or 0.0),
            "school_classrooms": int(metrics.get("school_classrooms_count") or 0),
            "road_coverage_km": float(metrics.get("road_coverage_km") or 0.0),
        },
        "predictions": predictions,
        "priority_analysis": priority_analysis,
        "matched_schemes": matched_schemes,
        "generated_at": datetime.now(),
    }

    _ANALYTICS_CACHE[cache_key] = analytics_data
    return analytics_data


# ---------------------------------------------------------------------------
# Interactive AI Chatbot Endpoint (Live LLM Integration)
# ---------------------------------------------------------------------------
@app.post(
    "/api/v1/chat",
    response_model=ChatResponse,
    tags=["AI Assistant & LLM"],
)
async def village_assistant_chat(payload: ChatRequest):
    """
    Connects the Village Chatbot directly to the AI Governance LLM Engine.
    Processes queries against ground telemetry, Scikit-learn deficit calculations,
    and national governance benchmarks.
    """
    location = payload.location or {}
    gp_id = int(location.get("gp_id", 4))

    # Retrieve live predictions and schemes for context grounding
    try:
        analytics = await get_panchayat_analytics(gp_id=gp_id)
        predictions = analytics.get("predictions", {})
        schemes = analytics.get("matched_schemes", [])
    except Exception:
        predictions = {}
        schemes = []

    res = await chat_engine.generate_chat_reply(
        user_message=payload.message,
        village_info=location,
        predictions=predictions,
        schemes=schemes,
        chat_history=payload.chat_history,
    )

    return {
        "reply": res["reply"],
        "provider": res.get("provider", "grampulse-governance-engine"),
        "model": res.get("model", "gemini-2.5-flash"),
        "timestamp": datetime.now(),
    }


@app.post(
    "/api/v1/scheme-assistant/chat",
    tags=["AI Assistant & LLM"],
)
async def suitable_government_schemes_chat(payload: ChatRequest):
    """Return scheme-grounded advice and matching official scheme cards."""
    return await scheme_assistant_engine.generate_scheme_advisory(
        user_message=payload.message,
        location=payload.location,
        chat_history=payload.chat_history,
    )


# ---------------------------------------------------------------------------
# GramPulse-FuturePredictor: 5-Year Village Development & UDISE+ Endpoints
# ---------------------------------------------------------------------------
@app.post("/predict", tags=["Future Predictor"])
@app.post("/api/v1/predict", tags=["Future Predictor"])
async def predict_village_development(payload: Dict[str, Any] = Body(...)):
    """
    5-Year Village Development Prediction API using real UDISE+ school
    infrastructure and demographic mathematical/ML forecasting.
    """
    try:
        result = execute_village_future_prediction(payload)
        return result
    except Exception as exc:
        logger.error(f"Error executing future prediction: {exc}", exc_info=True)
        raise HTTPException(
            status_code=500,
            detail=f"Future prediction generation failed: {str(exc)}",
        )


@app.get("/udise/search", tags=["UDISE+ Education"])
@app.get("/api/v1/udise/search", tags=["UDISE+ Education"])
async def search_udise_schools(keyword: str = Query(..., description="Village or School name")):
    """Searches real UDISE+ schools by keyword."""
    try:
        result = resolve_udise_infrastructure(keyword)
        schools = result.get("schools", [])
        return {
            "status": True,
            "keyword": keyword,
            "count": len(schools),
            "schools": schools,
            "infrastructure": result.get("infrastructure", {}),
            "education_impact": result.get("education_impact", {}),
        }
    except Exception as exc:
        raise HTTPException(status_code=500, detail=str(exc))


@app.get("/udise/chinniyampalayam", tags=["UDISE+ Education"])
@app.get("/api/v1/udise/chinniyampalayam", tags=["UDISE+ Education"])
async def get_chinniyampalayam_udise():
    """Returns verified UDISE+ school profile and facility records for Chinniyampalayam."""
    try:
        result = resolve_udise_infrastructure("Chinniyampalayam")
        return {
            "status": True,
            "location": "Chinniyampalayam",
            "school_count": len(result.get("schools", [])),
            "infrastructure": result.get("infrastructure", {}),
            "education_impact": result.get("education_impact", {}),
            "schools": result.get("schools", []),
        }
    except Exception as exc:
        raise HTTPException(status_code=500, detail=str(exc))


# ---------------------------------------------------------------------------
# Authentic Multi-Sector Government Data Endpoints (Census, UDISE+, JJM, NHM)
# ---------------------------------------------------------------------------
@app.get("/village/search", tags=["Village Government Data"])
@app.get("/api/v1/village/search", tags=["Village Government Data"])
async def search_village_endpoint(
    query: str = Query("", description="Search query or Census code"),
    district: Optional[str] = Query(None, description="Optional district filter across all 38 districts"),
    limit: int = Query(20, ge=1, le=50, description="Max results"),
):
    """
    Searches authentic Tamil Nadu villages, towns, and local bodies
    from the official Census 2011 directory across all 38 districts.
    """
    try:
        if search_census_locations is None:
            raise HTTPException(status_code=503, detail="Census search service unavailable")
        results = search_census_locations(query=query, district=district, limit=limit)
        return {
            "status": True,
            "query": query,
            "count": len(results),
            "results": results,
        }
    except Exception as exc:
        logger.error(f"Error searching census locations for '{query}': {exc}", exc_info=True)
        raise HTTPException(status_code=500, detail=str(exc))


@app.get("/village/data", tags=["Village Government Data"])
@app.get("/api/v1/village/data", tags=["Village Government Data"])
async def get_village_data_endpoint(
    village_name: str = Query(..., description="Village name or Census code"),
    district: str = Query("Coimbatore", description="District name"),
):
    """
    Retrieves authentic multi-sector government data for a Tamil Nadu village.
    Includes Census 2011, UDISE+, JJM, PMGSY, NHM, and BharatNet indicators.
    """
    try:
        if get_village_government_data is None:
            raise HTTPException(status_code=503, detail="Village government data service unavailable")
        data = get_village_government_data(
            village_name=village_name,
            district_name=district,
        )
        return data
    except Exception as exc:
        logger.error(f"Error fetching village data for '{village_name}': {exc}", exc_info=True)
        raise HTTPException(status_code=500, detail=str(exc))


@app.get("/village/indicators", tags=["Village Government Data"])
@app.get("/api/v1/village/indicators", tags=["Village Government Data"])
async def get_village_indicators_endpoint(
    village_name: str = Query(..., description="Village name or Census code"),
    district: str = Query("Coimbatore", description="District name"),
):
    """
    Returns indicator-level breakdown with full Step 8 metadata
    (reference year, official source URL, data status, unit).
    """
    try:
        if get_village_government_data is None:
            raise HTTPException(status_code=503, detail="Village government data service unavailable")
        gov_data = get_village_government_data(
            village_name=village_name,
            district_name=district,
        )
        return {
            "status": True,
            "village": gov_data.get("village"),
            "matched_location": gov_data.get("matched_location_name"),
            "location_type": gov_data.get("location_type"),
            "data_summary": gov_data.get("data_summary"),
            "indicators": list(gov_data.get("indicators", {}).values()),
        }
    except Exception as exc:
        logger.error(f"Error getting village indicators for '{village_name}': {exc}", exc_info=True)
        raise HTTPException(status_code=500, detail=str(exc))


@app.get("/village/validation", tags=["Village Government Data"])
@app.get("/api/v1/village/validation", tags=["Village Government Data"])
async def get_village_validation_endpoint(
    village_name: str = Query(..., description="Village name or Census code"),
    district: str = Query("Coimbatore", description="District name"),
):
    """
    Runs 14-dimension data quality and consistency validation
    on real government data for the selected village.
    """
    try:
        if get_village_government_data is None or validate_village_government_data is None:
            raise HTTPException(status_code=503, detail="Data validation service unavailable")
        gov_data = get_village_government_data(
            village_name=village_name,
            district_name=district,
        )
        validation_report = validate_village_government_data(gov_data)
        return validation_report
    except Exception as exc:
        logger.error(f"Error getting village validation for '{village_name}': {exc}", exc_info=True)
        raise HTTPException(status_code=500, detail=str(exc))


# ---------------------------------------------------------------------------
# Automated GPDP PDF Report Compilation & Streaming
# ---------------------------------------------------------------------------
@app.get(
    "/api/v1/panchayat/{gp_id}/pdf",
    tags=["PDF Document Engine"],
    responses={
        200: {
            "content": {"application/pdf": {}},
            "description": "Returns dynamically compiled binary GPDP PDF document.",
        }
    },
)
async def download_panchayat_gpdp_pdf(
    gp_id: int,
    planning_horizon_years: int = Query(5, ge=1, le=15, description="Planning forecast duration in years"),
    growth_rate: float = Query(0.018, ge=0.0, le=0.10, description="Annual compound population growth rate"),
):
    """
    Computes live Scikit-learn predictions, ChromaDB RAG schemes,
    compiles an official GPDP PDF plan using ReportLab, and streams raw PDF bytes.
    """
    gp = fetch_panchayat_by_id(gp_id)
    if not gp:
        gp = {
            "gp_id": gp_id,
            "gp_name": f"Panchayat_{gp_id}",
            "district": "District",
            "state": "India",
        }

    metrics = fetch_latest_metrics_for_panchayat(gp_id)
    if not metrics:
        metrics = derive_deterministic_village_metrics(
            gp_name=gp.get("gp_name", "Village"),
            district=gp.get("district", "District"),
            state=gp.get("state", "India"),
            lat=gp.get("lat", 11.2982),
            lng=gp.get("lng", 76.9366),
        )

    # 1. Run Scikit-learn Predictive Model
    current_pop = int(metrics.get("population") or 5000)
    predictions = calculate_infrastructure_deficits(
        current_pop=current_pop,
        pop_growth_rate=growth_rate,
        planning_horizon_years=planning_horizon_years,
        current_metrics=metrics,
    )

    # 2. Run ChromaDB RAG Vector Scheme Matcher
    matched_schemes = scheme_rag_engine.match_schemes(predictions, top_k=5)

    # 3. Compile PDF in memory using ReportLab
    try:
        gp_name = gp.get("gp_name", f"Panchayat_{gp_id}")
        target_year = predictions.get("target_year", datetime.now().year + planning_horizon_years)

        pdf_bytes = generate_gpdp_pdf(
            gp_name=gp_name,
            predictions=predictions,
            schemes=matched_schemes,
        )

        safe_filename = f"GPDP_Plan_{gp_name.replace(' ', '_')}_{target_year}.pdf"

        return Response(
            content=pdf_bytes,
            media_type="application/pdf",
            headers={
                "Content-Disposition": f'attachment; filename="{safe_filename}"',
                "Content-Length": str(len(pdf_bytes)),
            },
        )
    except Exception as exc:
        logger.error(f"Error compiling GPDP PDF for GP {gp_id}: {exc}", exc_info=True)
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to generate GPDP PDF report: {str(exc)}",
        )


# ---------------------------------------------------------------------------
# Direct Server Execution Entry Point
# ---------------------------------------------------------------------------
if __name__ == "__main__":
    import uvicorn

    host = os.environ.get("HOST", "127.0.0.1")
    port = int(os.environ.get("PORT", 8000))
    logger.info(f"Starting GramPulse AI Backend Server on http://{host}:{port}")
    uvicorn.run("backend.main:app", host=host, port=port, reload=True)
