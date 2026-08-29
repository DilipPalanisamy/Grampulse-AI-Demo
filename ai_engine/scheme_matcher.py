"""
=============================================================================
GramPulse AI - ChromaDB & Vector RAG Scheme Matcher Engine
=============================================================================
Retrieves and ranks Centrally Sponsored Schemes (CSS) and State Welfare
Programs using dynamic vector embeddings (ChromaDB / Vector RAG Engine),
semantic cosine similarity, deficit eligibility gating, and dynamic budget formulas.
=============================================================================
"""

from typing import Dict, List, Any, Optional
from backend.services.scheme_rag_engine import (
    SchemeRAGEngine,
    OFFICIAL_GOVERNMENT_SCHEMES,
    scheme_rag_engine,
)

GOVERNMENT_SCHEMES_KNOWLEDGE_BASE = OFFICIAL_GOVERNMENT_SCHEMES


class SchemeMatcherEngine(SchemeRAGEngine):
    """
    Backwards-compatible Scheme Matcher Engine inheriting from SchemeRAGEngine.
    Provides vector similarity retrieval against verified official Indian government schemes.
    """

    def __init__(self, schemes_kb: Optional[List[Dict[str, Any]]] = None):
        super().__init__(schemes_kb=schemes_kb or OFFICIAL_GOVERNMENT_SCHEMES)


# Default singleton instance
scheme_matcher = SchemeMatcherEngine()
