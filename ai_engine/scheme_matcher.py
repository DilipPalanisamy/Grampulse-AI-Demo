"""
=============================================================================
GramPulse AI - RAG Vector Scheme Matcher Engine
=============================================================================
Matches village infrastructure deficits and demographic profiles to Centrally
Sponsored Schemes (CSS) using native token/vector representations, cosine
similarity, eligibility threshold gating, and dynamic budget calculations.

Zero External Dependencies (Standard Library: math, re, collections, typing).
=============================================================================
"""

import math
import re
from collections import Counter
from typing import Dict, List, Any, Optional

# ---------------------------------------------------------------------------
# Stopwords for Native Vectorization
# ---------------------------------------------------------------------------
STOPWORDS = {
    "a", "about", "above", "after", "again", "against", "all", "am", "an", "and",
    "any", "are", "as", "at", "be", "because", "been", "before", "being", "below",
    "between", "both", "but", "by", "could", "did", "do", "does", "doing", "down",
    "during", "each", "few", "for", "from", "further", "had", "has", "have",
    "having", "he", "her", "here", "hers", "herself", "him", "himself", "his",
    "how", "i", "if", "in", "into", "is", "it", "its", "itself", "just", "me",
    "more", "most", "my", "myself", "no", "nor", "not", "of", "off", "on", "once",
    "only", "or", "other", "ought", "our", "ours", "ourselves", "out", "over",
    "own", "same", "she", "should", "so", "some", "such", "than", "that", "the",
    "their", "theirs", "them", "themselves", "then", "there", "these", "they",
    "this", "those", "through", "to", "too", "under", "until", "up", "very",
    "was", "we", "were", "what", "when", "where", "which", "while", "who", "whom",
    "why", "with", "would", "you", "your", "yours", "yourself", "yourselves",
}

# ---------------------------------------------------------------------------
# Centrally Sponsored Schemes (CSS) Knowledge Base
# ---------------------------------------------------------------------------
GOVERNMENT_SCHEMES_KNOWLEDGE_BASE: List[Dict[str, Any]] = [
    {
        "scheme_id": "CSS-JJM-001",
        "scheme_name": "Jal Jeevan Mission (JJM)",
        "ministry": "Ministry of Jal Shakti",
        "category": "Water Supply",
        "keywords": [
            "drinking water",
            "tap water connection",
            "har ghar jal",
            "potable water deficit",
            "piped water distribution network",
            "borewell",
            "overhead storage reservoir tank",
            "water filtration treatment plant",
            "daily water supply liters lpd",
        ],
        "description": (
            "Flagship national program to provide Functional Household Tap Connections (FHTC) "
            "with minimum 55 LPD potable water supply, community water purification plants, "
            "piped distribution networks, and overhead storage tanks in rural habitations."
        ),
        "primary_trigger_field": "water_deficit_lpd",
        "min_deficit_threshold": 1.0,
        "base_budget_lakhs": 10.0,
        "deficit_multiplier": 0.00075,  # ₹ 0.00075 Lakhs per Liter of daily deficit
        "per_capita_multiplier": 0.0020, # ₹ 0.0020 Lakhs per capita
    },
    {
        "scheme_id": "CSS-PMGSY-002",
        "scheme_name": "Pradhan Mantri Gram Sadak Yojana (PMGSY)",
        "ministry": "Ministry of Rural Development",
        "category": "Roads & Infrastructure",
        "keywords": [
            "road connectivity",
            "paved road deficit",
            "all weather blacktopped road",
            "culvert bridge construction",
            "rural transport access",
            "asphalt paving",
            "unconnected habitations connectivity",
            "road coverage km",
        ],
        "description": (
            "Centrally sponsored scheme to provide all-weather, black-topped paved road connectivity "
            "to unconnected rural habitations, including bridge culverts, drainage channels, and core network paving."
        ),
        "primary_trigger_field": "paved_road_deficit_km",
        "min_deficit_threshold": 0.1,
        "base_budget_lakhs": 20.0,
        "deficit_multiplier": 32.5,     # ₹ 32.5 Lakhs per km of paved road construction
        "per_capita_multiplier": 0.0,
    },
    {
        "scheme_id": "CSS-PMSHRI-003",
        "scheme_name": "PM SHRI Schools Scheme",
        "ministry": "Ministry of Education",
        "category": "Education",
        "keywords": [
            "school classroom deficit gap",
            "smart digital classrooms",
            "education infrastructure",
            "right to education rte compliance",
            "elementary school expansion",
            "secondary education",
            "stem science laboratories",
            "digital library",
            "school building construction repair",
        ],
        "description": (
            "National scheme for the comprehensive qualitative improvement of schools, construction "
            "of additional smart digital classrooms, RTE compliance, STEM laboratories, libraries, "
            "and inclusive educational infrastructure in rural Gram Panchayats."
        ),
        "primary_trigger_field": "classroom_gap",
        "min_deficit_threshold": 1.0,
        "base_budget_lakhs": 8.0,
        "deficit_multiplier": 5.25,     # ₹ 5.25 Lakhs per classroom constructed/upgraded
        "per_capita_multiplier": 0.0015,
    },
    {
        "scheme_id": "CSS-SBMG-004",
        "scheme_name": "Swachh Bharat Mission - Gramin (SBM-G)",
        "ministry": "Ministry of Jal Shakti (DDWS)",
        "category": "Sanitation",
        "keywords": [
            "sanitation",
            "solid waste management",
            "liquid waste management",
            "community sanitary complex",
            "greywater management",
            "plastic waste management unit",
            "odf plus village",
            "soak pits drainage",
            "gobardhan biogas",
        ],
        "description": (
            "Mission to sustain Open Defecation Free (ODF) status and manage solid and liquid waste (SLWM), "
            "including community toilet complexes, household soak pits, plastic waste management, and bio-gas plants."
        ),
        "primary_trigger_field": "population_projected",
        "min_deficit_threshold": 0.0,
        "base_budget_lakhs": 6.0,
        "deficit_multiplier": 0.0,
        "per_capita_multiplier": 0.0028, # ₹ 0.0028 Lakhs per capita
    },
]


# ---------------------------------------------------------------------------
# Native Scheme Matcher Engine
# ---------------------------------------------------------------------------
class SchemeMatcherEngine:
    """
    RAG vector similarity matching engine for Government Welfare Schemes.
    Uses character-frequency and word n-gram term frequency vectors with
    cosine similarity and deficit eligibility rules.
    """

    def __init__(self, schemes_kb: Optional[List[Dict[str, Any]]] = None):
        self.schemes = schemes_kb or GOVERNMENT_SCHEMES_KNOWLEDGE_BASE
        self._indexed_schemes: List[Dict[str, Any]] = []
        self._build_index()

    def generate_text_vector(self, text: str) -> Dict[str, float]:
        """
        Tokenizes text and generates a normalized term-frequency vector with sublinear scaling.

        :param text: Raw input query or document string.
        :return: Sparse vector represented as a dictionary of {term: weight}.
        """
        if not text:
            return {}

        # 1. Clean & tokenize words (alphanumeric sequences)
        tokens = re.findall(r"\b[a-zA-Z0-9_]{2,}\b", text.lower())
        meaningful_tokens = [t for t in tokens if t not in STOPWORDS]

        # 2. Extract unigrams and adjacent bigrams
        all_terms = list(meaningful_tokens)
        for i in range(len(meaningful_tokens) - 1):
            bigram = f"{meaningful_tokens[i]}_{meaningful_tokens[i+1]}"
            all_terms.append(bigram)

        # 3. Add character trigrams for robust typo & root-word matching
        clean_compact = re.sub(r"[^a-z0-9]", " ", text.lower())
        for word in clean_compact.split():
            if len(word) >= 3 and word not in STOPWORDS:
                for j in range(len(word) - 2):
                    all_terms.append(f"chr_{word[j:j+3]}")

        # 4. Compute term frequency with sublinear scaling: 1 + ln(count)
        counts = Counter(all_terms)
        vec: Dict[str, float] = {}
        for term, count in counts.items():
            vec[term] = 1.0 + math.log(count)

        # 5. L2-Normalize the vector
        norm = math.sqrt(sum(w * w for w in vec.values()))
        if norm > 0.0:
            for term in vec:
                vec[term] /= norm

        return vec

    def cosine_similarity(
        self, vec_a: Dict[str, float], vec_b: Dict[str, float]
    ) -> float:
        """
        Computes the cosine similarity between two normalized sparse vectors.

        :param vec_a: First sparse vector {term: weight}.
        :param vec_b: Second sparse vector {term: weight}.
        :return: Cosine similarity score between 0.0 and 1.0.
        """
        if not vec_a or not vec_b:
            return 0.0

        # Dot product over intersecting terms
        intersection = set(vec_a.keys()) & set(vec_b.keys())
        dot_product = sum(vec_a[t] * vec_b[t] for t in intersection)

        # Since inputs are already L2-normalized, cosine similarity equals the dot product
        return max(0.0, min(1.0, float(dot_product)))

    def _build_index(self) -> None:
        """Pre-computes and indexes text vectors for all schemes in the knowledge base."""
        self._indexed_schemes = []
        for scheme in self.schemes:
            keywords_text = " ".join(scheme.get("keywords", []))
            doc_text = (
                f"{scheme['scheme_name']} {scheme['category']} "
                f"{scheme['description']} {keywords_text}"
            )
            vector = self.generate_text_vector(doc_text)
            self._indexed_schemes.append({
                "meta": scheme,
                "vector": vector,
            })

    def match_schemes_for_deficits(
        self, deficit_summary: Dict[str, Any], top_k: int = 4
    ) -> List[Dict[str, Any]]:
        """
        Matches non-zero infrastructure deficits against Centrally Sponsored Schemes.

        :param deficit_summary: Output dictionary from calculate_infrastructure_deficits().
        :param top_k: Maximum number of schemes to return.
        :return: Sorted list of matched scheme dictionaries with budget estimates and match scores.
        """
        if not deficit_summary:
            return []

        # 1. Extract Deficit Signals
        water_def = float(
            deficit_summary.get(
                "water_deficit_lpd", deficit_summary.get("water_deficit", 0.0)
            )
        )
        classroom_gap = int(
            deficit_summary.get(
                "classroom_gap", deficit_summary.get("classrooms_gap", 0)
            )
        )
        road_def = float(
            deficit_summary.get(
                "paved_road_deficit_km",
                deficit_summary.get("road_gap_km", 0.0),
            )
        )
        pop_proj = int(
            deficit_summary.get(
                "population_projected",
                deficit_summary.get("projected_population", 5000),
            )
        )

        # 2. Dynamically construct search query text from non-zero deficits
        query_parts = []
        if "summary_narrative" in deficit_summary and deficit_summary["summary_narrative"]:
            query_parts.append(str(deficit_summary["summary_narrative"]))

        if water_def > 0:
            query_parts.append(
                f"potable drinking water deficit {water_def:.0f} liters per day tap water connection "
                f"piped distribution network Jal Jeevan Mission JJM overhead tank"
            )
        if classroom_gap > 0:
            query_parts.append(
                f"school classroom gap {classroom_gap} additional classrooms right to education "
                f"RTE compliance PM SHRI educational infrastructure smart classrooms"
            )
        if road_def > 0:
            query_parts.append(
                f"paved road connectivity deficit {road_def:.2f} km all-weather blacktopped road "
                f"PMGSY asphalt paving rural transport"
            )

        # Baseline rural sanitation & demographic context
        query_parts.append(
            f"rural development Gram Panchayat population {pop_proj} sanitation "
            f"solid liquid waste management Swachh Bharat Mission SBM-G"
        )

        query_text = " ".join(query_parts)
        query_vec = self.generate_text_vector(query_text)

        results = []

        # 3. Evaluate each scheme
        for indexed in self._indexed_schemes:
            scheme = indexed["meta"]
            scheme_vec = indexed["vector"]

            # Compute semantic vector similarity
            base_sim = self.cosine_similarity(query_vec, scheme_vec)

            # Check eligibility trigger and apply heuristic boost
            trig_field = scheme.get("primary_trigger_field")
            min_thresh = scheme.get("min_deficit_threshold", 0.0)

            is_eligible = True
            boost_factor = 1.0

            if trig_field == "water_deficit_lpd":
                if water_def > min_thresh:
                    boost_factor += 0.50 + min(0.35, (water_def / 80000.0) * 0.20)
                else:
                    is_eligible = False

            elif trig_field == "classroom_gap":
                if classroom_gap >= min_thresh:
                    boost_factor += 0.45 + min(0.30, (classroom_gap / 10.0) * 0.20)
                else:
                    is_eligible = False

            elif trig_field == "paved_road_deficit_km":
                if road_def > min_thresh:
                    boost_factor += 0.45 + min(0.30, (road_def / 4.0) * 0.20)
                else:
                    is_eligible = False

            elif trig_field == "population_projected":
                # Sanitation/universal rural schemes are always baseline eligible
                boost_factor += 0.20

            # Discard non-eligible schemes that require an active deficit
            if not is_eligible:
                continue

            # Composite match score calculation (0.00 - 1.00)
            composite_score = min(0.98, max(0.40, base_sim * boost_factor * 2.2))

            # 4. Calculate dynamic estimated budget allocation in Lakhs INR
            base_budget = scheme.get("base_budget_lakhs", 10.0)
            deficit_mult = scheme.get("deficit_multiplier", 0.0)
            per_capita_mult = scheme.get("per_capita_multiplier", 0.0)

            active_deficit_val = 0.0
            if trig_field == "water_deficit_lpd":
                active_deficit_val = water_def
            elif trig_field == "classroom_gap":
                active_deficit_val = float(classroom_gap)
            elif trig_field == "paved_road_deficit_km":
                active_deficit_val = road_def

            calculated_budget = (
                base_budget
                + (active_deficit_val * deficit_mult)
                + (pop_proj * per_capita_mult)
            )
            budget_lakhs = round(calculated_budget, 2)

            results.append({
                "scheme_id": scheme["scheme_id"],
                "scheme_name": scheme["scheme_name"],
                "ministry": scheme.get("ministry", "Government of India"),
                "category": scheme["category"],
                "match_score": round(composite_score, 4),
                "match_score_percent": round(composite_score * 100.0, 1),
                "score": round(composite_score * 100.0, 1),  # Compatibility alias
                "estimated_budget_lakhs": budget_lakhs,
                "estimated_budget": f"Rs. {budget_lakhs:,.2f} Lakhs",
                "budget": f"Rs. {budget_lakhs:,.2f} Lakhs",  # Compatibility alias
                "description": scheme["description"],
            })

        # 5. Rank schemes by match score descending
        results.sort(key=lambda s: s["match_score"], reverse=True)

        return results[:top_k]

    def match_schemes(
        self, predictions: Dict[str, Any], top_k: int = 4
    ) -> List[Dict[str, Any]]:
        """Compatibility alias for match_schemes_for_deficits."""
        return self.match_schemes_for_deficits(predictions, top_k=top_k)
