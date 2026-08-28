"""
=============================================================================
GramPulse AI - Pydantic Data Models & Schemas
=============================================================================
Defines request/response schemas for citizen grievances, geospatial mapping,
demographic forecasting, and RAG welfare scheme matching.
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
        examples=[23.4988],
    )
    lng: float = Field(
        ...,
        ge=-180.0,
        le=180.0,
        description="Longitude coordinate in decimal degrees",
        examples=[73.1812],
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
# Gram Panchayat Master Schemas
# ---------------------------------------------------------------------------
class PanchayatResponse(BaseModel):
    """Response schema for administrative Gram Panchayat directory."""
    gp_id: int
    gp_code: str
    gp_name: str
    district: str
    state: str
    created_at: Optional[datetime] = None


# ---------------------------------------------------------------------------
# Analytics & RAG Scheme Matcher Schemas
# ---------------------------------------------------------------------------
class MatchedSchemeResponse(BaseModel):
    """Schema for government scheme matched via AI RAG vector similarity."""
    scheme_id: str
    scheme_name: str
    ministry: Optional[str] = "Government of India"
    category: str
    match_score: float = Field(..., description="Similarity score between 0.00 and 1.00")
    match_score_percent: float = Field(..., description="Match percentage score e.g. 98.0%")
    estimated_budget: str = Field(..., description="Formatted budget allocation in INR Lakhs")
    description: str


class AnalyticsResponse(BaseModel):
    """Comprehensive analytics response containing forecasts, deficits, and matched schemes."""
    gp_id: int
    gp_name: str
    district: str
    state: str
    planning_horizon_years: int
    target_year: int
    predictions: Dict[str, Any] = Field(
        ...,
        description="Forecasted demographics, baseline metrics, and calculated deficits",
    )
    matched_schemes: List[MatchedSchemeResponse] = Field(
        ...,
        description="Prioritized Centrally Sponsored Schemes matched to deficits",
    )
    generated_at: datetime = Field(default_factory=datetime.now)
