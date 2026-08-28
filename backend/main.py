"""
=============================================================================
GramPulse AI - FastAPI Production Backend
=============================================================================
Connects PostgreSQL/PostGIS (Member 4), AI Engine & RAG Matcher (Member 3),
PDF Report Generator (Member 4), and React/Leaflet Frontend (Member 1).
=============================================================================
"""

import os
import sys
import logging
from datetime import datetime
from typing import Optional, List

# Ensure parent directory is in sys.path for importing ai_engine and utils
sys.path.insert(0, os.path.abspath(os.path.join(os.path.dirname(__file__), "..")))

from fastapi import FastAPI, HTTPException, Query, status
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import Response, JSONResponse

from backend.database import (
    fetch_all_panchayats,
    fetch_panchayat_by_id,
    fetch_latest_metrics_for_panchayat,
    fetch_all_citizen_issues,
    insert_citizen_issue_postgis,
    check_db_health,
)
from backend.schemas import (
    CitizenIssueCreate,
    CitizenIssueResponse,
    PanchayatResponse,
    AnalyticsResponse,
    MatchedSchemeResponse,
)
from ai_engine.predictive_model import calculate_infrastructure_deficits
from ai_engine.scheme_matcher import SchemeMatcherEngine
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

# ---------------------------------------------------------------------------
# FastAPI Application Instance & CORS Setup
# ---------------------------------------------------------------------------
app = FastAPI(
    title="GramPulse AI - Rural Governance Analytics API",
    description=(
        "Backend REST and GIS Spatial API empowering rural Gram Panchayats "
        "with demographic forecasting, infrastructure gap analytics, "
        "geotagged citizen issue management, and automated GPDP PDF compilation."
    ),
    version="1.0.0",
    docs_url="/docs",
    redoc_url="/redoc",
)

# CORS middleware supporting local Vite / React frontends and production origins
origins = [
    "http://localhost:5173",
    "http://127.0.0.1:5173",
    "http://localhost:3000",
    "http://127.0.0.1:3000",
    "http://localhost:8000",
    "http://127.0.0.1:8000",
    "*",
]

app.add_middleware(
    CORSMiddleware,
    allow_origins=origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Initialize AI RAG Scheme Matcher Singleton
scheme_matcher = SchemeMatcherEngine()


# ---------------------------------------------------------------------------
# Root & Health Check Endpoints
# ---------------------------------------------------------------------------
@app.get("/", tags=["General"])
async def root():
    """Service metadata and API health status."""
    return {
        "app_name": "GramPulse AI",
        "service": "Rural Governance & GIS Analytics Backend",
        "version": "1.0.0",
        "timestamp": datetime.now().isoformat(),
        "docs": "/docs",
    }


@app.get("/api/v1/health", tags=["General"])
async def health_check():
    """Verifies API status and database connectivity."""
    db_ok = check_db_health()
    return {
        "status": "healthy",
        "database_connected": db_ok,
        "timestamp": datetime.now().isoformat(),
    }


# ---------------------------------------------------------------------------
# Gram Panchayat Master Endpoints
# ---------------------------------------------------------------------------
@app.get(
    "/api/v1/panchayats",
    response_model=List[PanchayatResponse],
    tags=["Gram Panchayats"],
)
async def list_panchayats():
    """Retrieves directory of all registered Gram Panchayats."""
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
    category: Optional[str] = Query(None, description="Filter issues by category (e.g. 'Water Supply')"),
):
    """
    Retrieves geotagged citizen grievances with PostGIS geometry converted
    to separate `lat` and `lng` floats ready for React Leaflet rendering.
    """
    issues = fetch_all_citizen_issues(gp_id=gp_id, category=category)
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
# AI Predictive Governance & RAG Scheme Matching
# ---------------------------------------------------------------------------
@app.get(
    "/api/v1/panchayat/{gp_id}/analytics",
    response_model=AnalyticsResponse,
    tags=["AI Engine & Analytics"],
)
async def get_panchayat_analytics(
    gp_id: int,
    planning_horizon_years: int = Query(5, ge=1, le=15, description="Planning forecast duration in years"),
    growth_rate: float = Query(0.018, ge=0.0, le=0.10, description="Annual compound population growth rate"),
):
    """
    Fetches historical metrics, calculates demographic growth and infrastructure
    deficits (water, classrooms, roads), and matches relevant Central schemes via RAG.
    """
    gp = fetch_panchayat_by_id(gp_id)
    if not gp:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Gram Panchayat with ID {gp_id} not found.",
        )

    metrics = fetch_latest_metrics_for_panchayat(gp_id)
    if not metrics:
        metrics = {
            "population": 5000,
            "daily_water_supply_liters": 220000.0,
            "school_classrooms_count": 25,
            "road_coverage_km": 5.5,
            "current_year": datetime.now().year,
        }

    # 1. Execute AI Demographic & Infrastructure Deficit Model
    current_pop = int(metrics.get("population", 5000))
    predictions = calculate_infrastructure_deficits(
        current_pop=current_pop,
        pop_growth_rate=growth_rate,
        planning_horizon_years=planning_horizon_years,
        current_metrics=metrics,
    )

    # 2. Execute RAG Vector Scheme Matching Engine
    matched_schemes = scheme_matcher.match_schemes_for_deficits(predictions, top_k=4)

    return {
        "gp_id": gp["gp_id"],
        "gp_name": gp["gp_name"],
        "district": gp["district"],
        "state": gp["state"],
        "planning_horizon_years": planning_horizon_years,
        "target_year": predictions["target_year"],
        "predictions": predictions,
        "matched_schemes": matched_schemes,
        "generated_at": datetime.now(),
    }


# ---------------------------------------------------------------------------
# Automated GPDP PDF Report Compilation & Streaming
# ---------------------------------------------------------------------------
@app.get(
    "/api/v1/panchayat/{gp_id}/pdf",
    tags=["PDF Document Engine"],
    responses={
        200: {
            "content": {"application/pdf": {}},
            "description": "Returns compiled binary GPDP PDF document.",
        }
    },
)
async def download_panchayat_gpdp_pdf(
    gp_id: int,
    planning_horizon_years: int = Query(5, ge=1, le=15, description="Planning forecast duration in years"),
    growth_rate: float = Query(0.018, ge=0.0, le=0.10, description="Annual compound population growth rate"),
):
    """
    Computes live AI infrastructure predictions, matches government schemes,
    compiles an official GPDP PDF plan using ReportLab, and streams raw PDF bytes.
    """
    gp = fetch_panchayat_by_id(gp_id)
    if not gp:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Gram Panchayat with ID {gp_id} not found.",
        )

    metrics = fetch_latest_metrics_for_panchayat(gp_id)
    if not metrics:
        metrics = {
            "population": 5000,
            "daily_water_supply_liters": 220000.0,
            "school_classrooms_count": 25,
            "road_coverage_km": 5.5,
            "current_year": datetime.now().year,
        }

    # 1. Run AI Predictive Model
    current_pop = int(metrics.get("population", 5000))
    predictions = calculate_infrastructure_deficits(
        current_pop=current_pop,
        pop_growth_rate=growth_rate,
        planning_horizon_years=planning_horizon_years,
        current_metrics=metrics,
    )

    # 2. Run AI Scheme Matcher
    matched_schemes = scheme_matcher.match_schemes_for_deficits(predictions, top_k=4)

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
