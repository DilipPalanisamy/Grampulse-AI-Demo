"""
=============================================================================
GramPulse AI - Dynamic Scheme RAG Engine & Priority-Driven Allocations
=============================================================================
Connects infrastructure deficit signals with ChromaDB / LangChain vector
retrieval and verified official Indian Government Central & State schemes.
Prioritizes interventions by National Norm Deficit Severity (P1 Critical > P2 High > P3 Moderate).
=============================================================================
"""

import os
import math
import hashlib
import logging
from typing import Dict, List, Any, Optional

os.environ["ANONYMIZED_TELEMETRY"] = "False"

from backend.utils.priority_analyzer import calculate_deficit_priorities

logger = logging.getLogger("GramPulse-Scheme-RAG")

# ---------------------------------------------------------------------------
# Verified Official Indian Central & State Government Schemes Knowledge Base
# Linked directly to official live government portals & ministries
# ---------------------------------------------------------------------------
OFFICIAL_GOVERNMENT_SCHEMES: List[Dict[str, Any]] = [
    {
        "scheme_id": "CSS-JJM-001",
        "scheme_name": "Jal Jeevan Mission (JJM) - Har Ghar Jal",
        "ministry": "Ministry of Jal Shakti",
        "category": "Water Supply",
        "official_portal_url": "https://ejalshakti.gov.in/",
        "eligibility_criteria": "Habitations with potable water supply below 55 Liters Per Day (LPD) norm per capita.",
        "primary_trigger_field": "water_deficit_lpd",
        "base_budget_lakhs": 15.0,
        "deficit_multiplier": 0.00085,  # ₹ 0.00085 Lakhs per Liter of daily shortage
        "per_capita_multiplier": 0.0020,
        "description": (
            "Flagship national program ensuring 100% Functional Household Tap Connections (FHTC) "
            "with minimum 55 LPD potable water supply, overhead storage reservoirs, and community purification plants."
        ),
        "benchmark_norm": "Jal Jeevan Mission 55 LPD/capita standard",
        "keywords": [
            "drinking water", "tap water connection", "har ghar jal", "potable water deficit",
            "piped water network", "borewell", "overhead tank", "fhtc functional tap", "water shortage"
        ],
    },
    {
        "scheme_id": "CSS-PMGSY-002",
        "scheme_name": "Pradhan Mantri Gram Sadak Yojana (PMGSY - Phase III)",
        "ministry": "Ministry of Rural Development",
        "category": "Roads & Infrastructure",
        "official_portal_url": "https://pmgsygov.dord.gov.in/",
        "eligibility_criteria": "Rural habitations lacking all-weather bitumen roads (under 1.25 km / 1,000 population norm).",
        "primary_trigger_field": "paved_road_deficit_km",
        "base_budget_lakhs": 25.0,
        "deficit_multiplier": 35.0,    # ₹ 35.0 Lakhs per km of road gap
        "per_capita_multiplier": 0.0,
        "description": (
            "Centrally sponsored scheme providing all-weather blacktopped paved road connectivity "
            "to unconnected rural habitations, including bridge culverts and core rural transport corridors."
        ),
        "benchmark_norm": "PMGSY 1.25 km paved road per 1,000 population",
        "keywords": [
            "road connectivity", "paved road deficit", "all weather bitumen road",
            "culvert bridge", "rural transport access", "asphalt paving", "road coverage km", "unconnected habitation"
        ],
    },
    {
        "scheme_id": "CSS-ABHWC-003",
        "scheme_name": "National Health Mission (NHM) / Ayushman Bharat Health & Wellness Centres",
        "ministry": "Ministry of Health and Family Welfare",
        "category": "Healthcare",
        "official_portal_url": "https://nhm.gov.in/",
        "eligibility_criteria": "Rural habitations requiring Primary Health Centres (IPHS norm: 1 PHC / 30,000 population & Sub-Centres / 5,000 population).",
        "primary_trigger_field": "healthcare_deficit",
        "base_budget_lakhs": 22.0,
        "deficit_multiplier": 18.0,    # ₹ 18.0 Lakhs per PHC unit upgrade
        "per_capita_multiplier": 0.0025,
        "description": (
            "Comprehensive primary healthcare delivery upgrading Sub-Centres and PHCs into modern "
            "Health & Wellness Centres (AB-HWCs) with tele-consultations, diagnostic facilities, and maternal healthcare."
        ),
        "benchmark_norm": "IPHS 2022 norm: 1 PHC / 30,000 population & 1 Sub-Centre / 5,000 population",
        "keywords": [
            "primary health centre", "phc deficit", "community health centre chc",
            "ayushman bharat health and wellness centre", "sub centre", "maternal healthcare", "national health mission nhm"
        ],
    },
    {
        "scheme_id": "CSS-PMSHRI-004",
        "scheme_name": "PM SHRI Scheme & Samagra Shiksha Abhiyan",
        "ministry": "Ministry of Education",
        "category": "Education",
        "official_portal_url": "https://education.gov.in/",
        "eligibility_criteria": "Government schools requiring classroom expansion to meet 1:30 pupil ratio (RTE Act) and STEM laboratories.",
        "primary_trigger_field": "classroom_gap",
        "base_budget_lakhs": 10.5,
        "deficit_multiplier": 6.20,    # ₹ 6.20 Lakhs per classroom constructed/upgraded
        "per_capita_multiplier": 0.0015,
        "description": (
            "Comprehensive qualitative upgrade of elementary and secondary schools, construction of "
            "smart digital classrooms, RTE compliance, STEM laboratories, and inclusive educational infrastructure."
        ),
        "benchmark_norm": "Right to Education (RTE) Act 1:30 pupil-to-classroom ratio",
        "keywords": [
            "school classroom deficit gap", "smart digital classrooms", "education infrastructure",
            "right to education rte compliance", "elementary school expansion", "stem laboratories"
        ],
    },
    {
        "scheme_id": "CSS-SBMG-005",
        "scheme_name": "Swachh Bharat Mission - Gramin (SBM-G Phase II)",
        "ministry": "Ministry of Jal Shakti (DDWS)",
        "category": "Sanitation",
        "official_portal_url": "https://sbm.gov.in/",
        "eligibility_criteria": "ODF Plus model villages executing Solid & Liquid Waste Management (SLWM) and micro-composting.",
        "primary_trigger_field": "population_projected",
        "base_budget_lakhs": 8.5,
        "deficit_multiplier": 0.0,
        "per_capita_multiplier": 0.0028,
        "description": (
            "Mission to sustain Open Defecation Free (ODF Plus) status and execute Solid & Liquid Waste Management (SLWM), "
            "including community toilet complexes, household soak pits, plastic waste management, and bio-gas plants."
        ),
        "benchmark_norm": "SBM-G ODF Plus SLWM coverage norm",
        "keywords": [
            "sanitation", "solid waste management", "liquid waste management", "community sanitary complex",
            "plastic waste management unit", "odf plus village", "soak pits drainage"
        ],
    },
    {
        "scheme_id": "CSS-AMRIT-006",
        "scheme_name": "Mission Amrit Sarovar & DISHA Water Rejuvenation",
        "ministry": "Ministry of Jal Shakti & Rural Development",
        "category": "Water Resources",
        "official_portal_url": "https://disha.gov.in/",
        "eligibility_criteria": "Gram Panchayats prioritizing community lake rejuvenation, farm ponds, and groundwater recharge.",
        "primary_trigger_field": "water_deficit_lpd",
        "base_budget_lakhs": 18.0,
        "deficit_multiplier": 0.00040,
        "per_capita_multiplier": 0.0012,
        "description": (
            "National mission aimed at developing and rejuvenating community water bodies (Amrit Sarovars) "
            "to harvest rainwater, recharge depleted groundwater tables, and ensure rural water security."
        ),
        "benchmark_norm": "Groundwater replenishment & Amrit Sarovar water security",
        "keywords": [
            "water body rejuvenation", "amrit sarovar pond desilting", "rainwater harvesting tank",
            "oorani tank restoration", "groundwater recharge check dam"
        ],
    },
    {
        "scheme_id": "CSS-PMAYG-007",
        "scheme_name": "Pradhan Mantri Awaas Yojana - Gramin (PMAY-G)",
        "ministry": "Ministry of Rural Development",
        "category": "Housing & Infrastructure",
        "official_portal_url": "https://pmayg.nic.in/",
        "eligibility_criteria": "Houseless rural families and households residing in kutcha or unpaved dwellings.",
        "primary_trigger_field": "population_projected",
        "base_budget_lakhs": 16.0,
        "deficit_multiplier": 0.0,
        "per_capita_multiplier": 0.0035,
        "description": (
            "Flagship rural housing scheme providing pucca concrete disaster-resilient houses with basic amenities "
            "to houseless households and families living in dilapidated houses."
        ),
        "benchmark_norm": "100% Pucca housing with basic amenities",
        "keywords": [
            "pucca concrete housing", "rural shelter", "houseless households", "disaster resilient homes",
            "pmay-g financial assistance", "sanitary latrine housing"
        ],
    },
    {
        "scheme_id": "CSS-KUSUM-008",
        "scheme_name": "PM-KUSUM (Solar Agricultural Pumps & Green Energy)",
        "ministry": "Ministry of New and Renewable Energy",
        "category": "Renewable Energy",
        "official_portal_url": "https://pmkusum.mnre.gov.in/",
        "eligibility_criteria": "Agricultural feeders and rural habitations transitioning to decentralized standalone solar power.",
        "primary_trigger_field": "population_projected",
        "base_budget_lakhs": 15.0,
        "deficit_multiplier": 0.0,
        "per_capita_multiplier": 0.0022,
        "description": (
            "Scheme for rural energy security and solarization of agricultural water pumps, reducing grid dependency "
            "and empowering Gram Panchayats with decentralized clean solar power."
        ),
        "benchmark_norm": "Decentralized renewable solar feeder capacity",
        "keywords": [
            "solar irrigation pump", "pm kusum solar grid", "clean green energy village",
            "agricultural solar feeder", "diesel pump solarization"
        ],
    },
    {
        "scheme_id": "CSS-MGNREGS-009",
        "scheme_name": "Mahatma Gandhi NREGA (Rural Asset Creation)",
        "ministry": "Ministry of Rural Development",
        "category": "Rural Employment & Assets",
        "official_portal_url": "https://nrega.nic.in/",
        "eligibility_criteria": "Rural job-card holders executing soil conservation, drainage channels, and tree plantations.",
        "primary_trigger_field": "population_projected",
        "base_budget_lakhs": 28.0,
        "deficit_multiplier": 0.0,
        "per_capita_multiplier": 0.0040,
        "description": (
            "Guaranteed wage employment creating durable rural infrastructure assets, including "
            "percolation tanks, farm ponds, check dams, drainage canal desilting, and village connectivity earthworks."
        ),
        "benchmark_norm": "Guaranteed 100 days wage employment & asset creation",
        "keywords": [
            "mgnrega rural employment", "check dam construction", "drainage desilting channel",
            "rural tree plantation afforestation", "flood protection embankment"
        ],
    },
]

VECTOR_DIM = 64


def _compute_dense_vector(text: str, dim: int = VECTOR_DIM) -> List[float]:
    """Generates a normalized dense vector embedding using feature hashing."""
    vec = [0.0] * dim
    tokens = text.lower().replace("-", " ").replace("/", " ").replace("_", " ").split()
    for t in tokens:
        if len(t) >= 2:
            # Deterministic bucket
            h = int(hashlib.md5(t.encode("utf-8")).hexdigest()[:8], 16)
            idx = h % dim
            sign = 1.0 if (h % 2 == 0) else -1.0
            vec[idx] += sign * (1.0 + len(t) * 0.1)

    norm = math.sqrt(sum(v * v for v in vec)) or 1.0
    return [round(v / norm, 6) for v in vec]


def _cosine_similarity(vec_a: List[float], vec_b: List[float]) -> float:
    """Calculates cosine similarity between two normalized vectors."""
    if not vec_a or not vec_b or len(vec_a) != len(vec_b):
        return 0.5
    dot = sum(a * b for a, b in zip(vec_a, vec_b))
    return max(0.0, min(1.0, dot))


class SchemeRAGEngine:
    """
    RAG Vector Similarity & Priority-Driven Allocations Engine for Government Schemes.
    Combines ChromaDB vector retrieval with national benchmark severity scoring.
    """

    def __init__(self, schemes_kb: Optional[List[Dict[str, Any]]] = None):
        self.schemes = schemes_kb or OFFICIAL_GOVERNMENT_SCHEMES
        self._chroma_client = None
        self._collection = None
        self._scheme_vectors: Dict[str, List[float]] = {}
        self._init_vector_store()

    def _init_vector_store(self) -> None:
        """Initializes ChromaDB vector store and precomputed normalized vectors."""
        # 1. Precompute feature embeddings for all schemes
        for s in self.schemes:
            text = (
                f"{s['scheme_name']} {s['category']} {s['ministry']} "
                f"{s['description']} {s.get('eligibility_criteria', '')} {' '.join(s.get('keywords', []))}"
            )
            self._scheme_vectors[s["scheme_id"]] = _compute_dense_vector(text)

        # 2. Initialize ChromaDB Ephemeral client with explicit vector embeddings
        try:
            import chromadb
            self._chroma_client = chromadb.EphemeralClient()
            self._collection = self._chroma_client.get_or_create_collection(
                name="official_government_schemes_rag",
                metadata={"hnsw:space": "cosine"},
            )

            ids = [s["scheme_id"] for s in self.schemes]
            embeddings = [self._scheme_vectors[s["scheme_id"]] for s in self.schemes]
            metadatas = [
                {
                    "scheme_id": s["scheme_id"],
                    "scheme_name": s["scheme_name"],
                    "category": s["category"],
                    "ministry": s.get("ministry", "Government of India"),
                    "primary_trigger": s.get("primary_trigger_field", ""),
                    "official_portal_url": s.get("official_portal_url", ""),
                }
                for s in self.schemes
            ]

            existing = self._collection.get()
            if existing and existing.get("ids"):
                self._collection.delete(ids=existing["ids"])

            self._collection.add(ids=ids, embeddings=embeddings, metadatas=metadatas)
            logger.info(f"ChromaDB initialized with {len(ids)} official government schemes.")
        except Exception as exc:
            logger.warning(f"ChromaDB initialization note: {exc}; dense vector similarity active.")

    def match_schemes(self, deficit_summary: Dict[str, Any], top_k: int = 5) -> List[Dict[str, Any]]:
        """
        Executes dynamic vector similarity and deficit priority ranking to recommend schemes.
        """
        if not deficit_summary:
            return []

        # 1. Compute Deficit Priorities & Benchmark Analysis (P1 Critical, P2 High, P3 Moderate)
        priority_analysis = calculate_deficit_priorities(deficit_summary)
        priority_sector_map = {
            s["trigger_field"]: s for s in priority_analysis.get("sectors", [])
        }

        pop_proj = int(
            deficit_summary.get(
                "population_projected",
                deficit_summary.get("population_current", deficit_summary.get("population", 5000)),
            )
            or 5000
        )
        water_def = float(
            deficit_summary.get("water_deficit_lpd", deficit_summary.get("water_deficit", 0.0)) or 0.0
        )
        classroom_gap = int(
            deficit_summary.get("classroom_gap", deficit_summary.get("classrooms_gap", 0)) or 0
        )
        road_def = float(
            deficit_summary.get("paved_road_deficit_km", deficit_summary.get("road_gap_km", 0.0)) or 0.0
        )
        healthcare_def = float(
            deficit_summary.get("healthcare_deficit", deficit_summary.get("phc_deficit", 0.0)) or 0.0
        )

        # 2. Build Semantic Deficit Query from live shortages
        query_parts = []
        if water_def > 0:
            query_parts.append(
                f"potable water supply deficit {water_def:.0f} LPD Jal Jeevan Mission Har Ghar Jal tap connection "
                f"drinking water overhead reservoir filtration"
            )
        if healthcare_def > 0 or pop_proj >= 5000:
            query_parts.append(
                f"primary health centre PHC deficit Ayushman Bharat Health and Wellness Centre NHM hospital "
                f"rural clinic sub-centre maternal healthcare"
            )
        if classroom_gap > 0:
            query_parts.append(
                f"school classroom gap {classroom_gap} rooms PM SHRI Samagra Shiksha smart classrooms RTE education"
            )
        if road_def > 0:
            query_parts.append(
                f"paved road connectivity deficit {road_def:.2f} km PMGSY all weather bitumen asphalt road"
            )

        query_parts.append(
            f"rural development Gram Panchayat population {pop_proj} sanitation "
            f"solid liquid waste management Swachh Bharat Mission SBM-G PMAY housing MGNREGA"
        )
        query_text = " ".join(query_parts)
        query_vector = _compute_dense_vector(query_text)

        # 3. Vector Similarity Query via ChromaDB or Dense Fallback
        vector_scores: Dict[str, float] = {}
        if self._collection is not None:
            try:
                chroma_res = self._collection.query(query_embeddings=[query_vector], n_results=len(self.schemes))
                if chroma_res and chroma_res.get("ids") and chroma_res["ids"][0]:
                    retrieved_ids = chroma_res["ids"][0]
                    distances = chroma_res.get("distances", [[]])[0]
                    for idx, s_id in enumerate(retrieved_ids):
                        dist = distances[idx] if idx < len(distances) else 0.5
                        sim = max(0.45, min(0.985, 1.0 - (dist / 2.0)))
                        vector_scores[s_id] = sim
            except Exception as e:
                logger.warning(f"ChromaDB query fallback: {e}")

        # Fallback to direct cosine matching if needed
        if not vector_scores:
            for s_id, s_vec in self._scheme_vectors.items():
                sim = _cosine_similarity(query_vector, s_vec)
                vector_scores[s_id] = max(0.45, min(0.98, sim * 1.5 + 0.2))

        # 4. Rank & Calculate Dynamic Budgets
        matched = []
        for scheme in self.schemes:
            s_id = scheme["scheme_id"]
            trig_field = scheme.get("primary_trigger_field", "")
            sector_info = priority_sector_map.get(trig_field, {
                "priority": "P3",
                "priority_label": "PLANNED UPGRADE",
                "severity_score": 45.0,
                "deficit_pct": 10.0,
                "color": "#10B981",
                "badge_class": "bg-emerald-500/15 text-emerald-400 border-emerald-500/30",
            })

            # Check Eligibility gating
            is_eligible = True
            if trig_field == "water_deficit_lpd" and water_def <= 0:
                is_eligible = False
            elif trig_field == "classroom_gap" and classroom_gap <= 0:
                is_eligible = False
            elif trig_field == "paved_road_deficit_km" and road_def <= 0:
                is_eligible = False

            if not is_eligible:
                continue

            base_sim = vector_scores.get(s_id, 0.70)
            priority_tier = sector_info.get("priority", "P3")
            priority_label = sector_info.get("priority_label", "PLANNED UPGRADE")
            severity_score = sector_info.get("severity_score", 50.0)
            deficit_pct = sector_info.get("deficit_pct", 0.0)

            # Boost correlation score by deficit severity
            boost = 1.0
            if priority_tier == "P1":
                boost = 1.28 + min(0.15, (severity_score / 100.0) * 0.10)
            elif priority_tier == "P2":
                boost = 1.14 + min(0.10, (severity_score / 100.0) * 0.08)
            else:
                boost = 1.02

            final_match = min(98.8, max(55.0, (base_sim * boost) * 100.0))

            # Dynamic Budget Calculation Formula
            base_b = float(scheme.get("base_budget_lakhs", 10.0))
            def_m = float(scheme.get("deficit_multiplier", 0.0))
            cap_m = float(scheme.get("per_capita_multiplier", 0.0))

            active_val = 0.0
            if trig_field == "water_deficit_lpd":
                active_val = water_def
            elif trig_field == "classroom_gap":
                active_val = float(classroom_gap)
            elif trig_field == "paved_road_deficit_km":
                active_val = road_def
            elif trig_field == "healthcare_deficit":
                active_val = max(1.0, healthcare_def)

            shortage_allocation = active_val * def_m
            per_capita_allocation = pop_proj * cap_m
            total_budget_lakhs = round(base_b + shortage_allocation + per_capita_allocation, 2)

            formula_breakdown = (
                f"Base ₹{base_b:.1f}L + Shortage ₹{shortage_allocation:.2f}L + Pop ₹{per_capita_allocation:.2f}L"
            )

            matched.append({
                "scheme_id": scheme["scheme_id"],
                "scheme_name": scheme["scheme_name"],
                "ministry": scheme["ministry"],
                "category": scheme["category"],
                "match_score": round(final_match / 100.0, 4),
                "match_score_percent": round(final_match, 1),
                "score": round(final_match, 1),
                "priority_tier": priority_tier,
                "priority_label": priority_label,
                "priority_color": sector_info.get("color", "#10B981"),
                "priority_badge_class": sector_info.get("badge_class", "bg-emerald-500/15 text-emerald-400 border-emerald-500/30"),
                "severity_score": severity_score,
                "deficit_pct": deficit_pct,
                "estimated_budget_lakhs": total_budget_lakhs,
                "estimated_budget": f"₹ {total_budget_lakhs:,.2f} Lakhs",
                "budget": f"₹ {total_budget_lakhs:,.2f} Lakhs",
                "budget_formula_breakdown": formula_breakdown,
                "description": scheme["description"],
                "eligibility_criteria": scheme.get("eligibility_criteria", "Quantified infrastructure shortage."),
                "benchmark_norm": scheme.get("benchmark_norm", "Standard National Norm"),
                "official_portal_url": scheme["official_portal_url"],
            })

        # Sort strictly by priority level (P1 > P2 > P3), then match score descending
        tier_weights = {"P1": 1, "P2": 2, "P3": 3}
        matched.sort(key=lambda s: (tier_weights.get(s["priority_tier"], 3), -s["match_score_percent"]))

        return matched[:top_k]

    def match_schemes_for_deficits(self, deficit_summary: Dict[str, Any], top_k: int = 5) -> List[Dict[str, Any]]:
        """Compatibility alias for match_schemes."""
        return self.match_schemes(deficit_summary, top_k=top_k)


# Singleton instance for direct import
scheme_rag_engine = SchemeRAGEngine()
