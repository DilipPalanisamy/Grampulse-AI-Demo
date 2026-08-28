"""
=============================================================================
GramPulse AI - AI Engine & Predictive Governance Package
=============================================================================
Provides demographic forecasting, national benchmark deficit projections,
and RAG vector-based welfare scheme recommendation matching.
=============================================================================
"""

from .predictive_model import (
    calculate_infrastructure_deficits,
    BENCHMARKS,
)
from .scheme_matcher import (
    SchemeMatcherEngine,
    GOVERNMENT_SCHEMES_KNOWLEDGE_BASE,
)

__all__ = [
    "calculate_infrastructure_deficits",
    "BENCHMARKS",
    "SchemeMatcherEngine",
    "GOVERNMENT_SCHEMES_KNOWLEDGE_BASE",
]
