"""
=============================================================================
GramPulse AI - Pydantic Data Models & Schemas
=============================================================================
Defines request/response schemas for citizen grievances, geospatial mapping,
demographic forecasting, RAG welfare scheme matching, and AI Chatbot.
=============================================================================
"""

from datetime import datetime
from typing import Optional, List, Dict, Any
from pydantic import BaseModel, Field


# ---------------------------------------------------------------------------
# Citizen Grievance Schemas
# ---------------------------------------------------------------------------
class CitizenIssueCreate(BaseModel):
    """Payload schema for submitting a new geotagged citizen grievance."""
    gp_id: int = Field(default=1, description="Gram Panchayat ID")
    category: str = Field(
        ...,
        description="Grievance classification (e.g., 'Water Supply', 'Roads & Infrastructure', 'Education', 'Sanitation')",
        examples=["Water Supply"],
    )
    description: str = Field(
        ...,
        min_length=5,
        description="Detailed grievance description",
        examples=["Primary borewell motor failure in North Hamlet."],
    )
    lat: float = Field(
        ...,
        ge=-90.0,
        le=90.0,
        description="Latitude coordinate in decimal degrees",
        examples=[11.2982],
    )
    lng: float = Field(
        ...,
        ge=-180.0,
        le=180.0,
        description="Longitude coordinate in decimal degrees",
        examples=[76.9366],
    )


class CitizenIssueResponse(BaseModel):
    """Response schema for citizen grievances rendered on the GIS map."""
    issue_id: int = Field(..., description="Unique issue identifier")
    gp_id: int = Field(..., description="Associated Gram Panchayat ID")
    category: str = Field(..., description="Issue classification")
    description: str = Field(..., description="Grievance description")
    lat: float = Field(..., description="Latitude coordinate (ST_Y)")
    lng: float = Field(..., description="Longitude coordinate (ST_X)")
    status: str = Field(default="OPEN", description="Grievance lifecycle state (OPEN, IN_PROGRESS, RESOLVED)")
    created_at: Optional[datetime] = Field(default_factory=datetime.now, description="Submission timestamp")

    class Config:
        from_attributes = True


# ---------------------------------------------------------------------------
# Gram Panchayat & Spatial Search Schemas
# ---------------------------------------------------------------------------
class PanchayatResponse(BaseModel):
    """Response schema for administrative Gram Panchayat directory."""
    gp_id: int
    gp_code: str
    gp_name: str
    district: str
    state: str
    lat: Optional[float] = None
    lng: Optional[float] = None
    population: Optional[int] = None
    households: Optional[int] = None
    daily_water_supply_liters: Optional[float] = None
    school_classrooms_count: Optional[int] = None
    road_coverage_km: Optional[float] = None
    created_at: Optional[datetime] = None


class SpatialSearchResponse(BaseModel):
    """Response schema for live OpenStreetMap Nominatim geocoding."""
    gp_id: int
    gp_code: str
    gp_name: str
    district: str
    state: str
    lat: float
    lng: float
    type: Optional[str] = "village"
    display_name: Optional[str] = ""
    geojson: Optional[Dict[str, Any]] = None
    boundingbox: Optional[List[str]] = None
    is_live_osm: bool = True


# ---------------------------------------------------------------------------
# Analytics & RAG Scheme Matcher Schemas
# ---------------------------------------------------------------------------
class MatchedSchemeResponse(BaseModel):
    """Schema for government scheme matched via AI RAG vector similarity."""
    scheme_id: str
    scheme_name: str
    ministry: Optional[str] = "Government of India"
    category: str
    match_score: Optional[float] = Field(default=0.85, description="Similarity score between 0.00 and 1.00")
    match_score_percent: Optional[float] = Field(default=85.0, description="Match percentage score e.g. 98.0%")
    priority_tier: Optional[str] = Field(default="P3", description="P1 Critical, P2 High, P3 Planned")
    priority_label: Optional[str] = Field(default="PLANNED UPGRADE", description="Priority level label")
    priority_color: Optional[str] = Field(default="#10B981", description="Hex color code")
    priority_badge_class: Optional[str] = None
    severity_score: Optional[float] = None
    deficit_pct: Optional[float] = None
    estimated_budget_lakhs: Optional[float] = None
    estimated_budget: str = Field(..., description="Formatted budget allocation in INR Lakhs")
    budget: Optional[str] = None
    budget_formula_breakdown: Optional[str] = None
    description: str
    eligibility_criteria: Optional[str] = None
    benchmark_norm: Optional[str] = None
    official_portal_url: Optional[str] = None


class AnalyticsResponse(BaseModel):
    """Comprehensive analytics response containing forecasts, deficits, and matched schemes."""
    gp_id: int
    gp_name: str
    district: str
    state: str
    planning_horizon_years: int
    target_year: int
    baseline_metrics: Optional[Dict[str, Any]] = None
    priority_analysis: Optional[Dict[str, Any]] = None
    predictions: Dict[str, Any] = Field(
        ...,
        description="Forecasted demographics, baseline metrics, and calculated deficits",
    )
    matched_schemes: List[MatchedSchemeResponse] = Field(
        ...,
        description="Prioritized Centrally Sponsored Schemes matched to deficits",
    )
    generated_at: datetime = Field(default_factory=datetime.now)


# ---------------------------------------------------------------------------
# AI Chatbot Schemas
# ---------------------------------------------------------------------------
class ChatRequest(BaseModel):
    """Payload schema for sending a message to the AI Village Assistant."""
    message: str = Field(..., min_length=1, description="Citizen / Sarpanch query")
    location: Optional[Dict[str, Any]] = Field(default_factory=dict, description="Active village metadata")
    chat_history: Optional[List[Dict[str, str]]] = Field(default_factory=list, description="Recent message history")


class ChatResponse(BaseModel):
    """Response schema from the AI Village Assistant."""
    reply: str
    provider: str = "grampulse-governance-engine"
    model: str = "rule-rag-v1"
    timestamp: datetime = Field(default_factory=datetime.now)
