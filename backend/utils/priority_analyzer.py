"""
=============================================================================
GramPulse AI - Deficit Priority & Severity Analysis Algorithm
=============================================================================
Evaluates multi-sector rural infrastructure shortages against national benchmarks
(Jal Jeevan Mission, RTE Act, IPHS 2022, PMGSY-III, SBM-G) and computes normalized
severity scores and priority tiers:
- Critical Priority (P1 - Red): Deficit exceeds 30% of standard norms
  (e.g., Water Deficit > 20,000 LPD or Hospital Deficit >= 1 PHC).
- High Priority (P2 - Orange): Deficit between 15% - 30% of norms
  (e.g., Classroom Gap >= 3 rooms or Road Deficit > 1.5 km).
- Moderate Priority (P3 - Yellow): Deficit under 15% of norms.
- Adequate (Green): Baseline capacity meets or exceeds national benchmark norms.

Ranks infrastructure shortages strictly by priority (P1 > P2 > P3).
=============================================================================
"""

import math
from typing import Dict, Any, List


def calculate_deficit_priorities(deficit_summary: Dict[str, Any]) -> Dict[str, Any]:
    """
    Computes normalized Deficit Severity Scores (0 - 100) and Priority Tiers (P1, P2, P3)
    across Drinking Water, Healthcare, Education, Road Connectivity, and Sanitation.

    :param deficit_summary: Dictionary containing demographic and infrastructure metrics.
    :return: Formatted dictionary containing ranked sectors, overall priority, and detailed breakdown.
    """
    if not deficit_summary:
        deficit_summary = {}

    pop = int(
        deficit_summary.get(
            "population_projected",
            deficit_summary.get("population_current", deficit_summary.get("population", 5000)),
        )
        or 5000
    )

    # -------------------------------------------------------------------------
    # 1. Drinking Water Supply Deficit Telemetry (JJM 55 LPD Norm)
    # -------------------------------------------------------------------------
    water_demand = float(
        deficit_summary.get("water_demand_projected_lpd", deficit_summary.get("projected_water_demand", pop * 55.0))
        or (pop * 55.0)
    )
    water_supply = float(
        deficit_summary.get("water_supply_current_lpd", deficit_summary.get("daily_water_supply", 0.0)) or 0.0
    )
    water_def = float(
        deficit_summary.get("water_deficit_lpd", deficit_summary.get("water_deficit", max(0.0, water_demand - water_supply))) or 0.0
    )
    water_def_pct = min(100.0, (water_def / max(1.0, water_demand)) * 100.0)

    if water_def > 20000.0 or water_def_pct >= 30.0:
        water_priority = "P1"
        water_label = "CRITICAL INTERVENTION"
        water_score = min(99.0, max(75.0, 75.0 + (water_def_pct * 0.75)))
        water_color = "#EF4444"  # Red
        water_badge_class = "bg-rose-500/15 text-rose-400 border-rose-500/30"
    elif water_def >= 8000.0 or water_def_pct >= 15.0:
        water_priority = "P2"
        water_label = "HIGH PRIORITY"
        water_score = min(74.9, max(50.0, 50.0 + (water_def_pct * 0.8)))
        water_color = "#F97316"  # Orange
        water_badge_class = "bg-amber-500/15 text-amber-400 border-amber-500/30"
    elif water_def > 0.0:
        water_priority = "P3"
        water_label = "MODERATE GAP"
        water_score = min(49.9, max(25.0, 25.0 + (water_def_pct * 0.9)))
        water_color = "#EAB308"  # Yellow
        water_badge_class = "bg-yellow-500/15 text-yellow-400 border-yellow-500/30"
    else:
        water_priority = "P3"
        water_label = "ADEQUATE / PLANNED"
        water_score = 12.0
        water_color = "#10B981"  # Emerald
        water_badge_class = "bg-emerald-500/15 text-emerald-400 border-emerald-500/30"

    # -------------------------------------------------------------------------
    # 2. Healthcare Deficit Telemetry (IPHS 2022 Norm: 1 PHC / 30,000 pop, 1 Sub-Centre / 5,000 pop)
    # -------------------------------------------------------------------------
    req_phcs = max(1, math.ceil(pop / 30000))
    req_subcentres = max(1, math.ceil(pop / 5000))
    available_phcs = int(deficit_summary.get("healthcare_count", deficit_summary.get("phc_count", 1)) or 1)
    available_subcentres = int(deficit_summary.get("sub_centres_count", 1) or 1)

    phc_gap = int(deficit_summary.get("healthcare_deficit", deficit_summary.get("phc_deficit", 0)) or 0)
    if phc_gap == 0 and available_phcs < req_phcs:
        phc_gap = req_phcs - available_phcs

    if phc_gap >= 1 or (pop >= 8000 and available_phcs == 0):
        health_priority = "P1"
        health_label = "CRITICAL INTERVENTION"
        health_score = min(99.0, max(75.0, 85.0 + (phc_gap * 7.0)))
        health_color = "#EF4444"
        health_badge_class = "bg-rose-500/15 text-rose-400 border-rose-500/30"
        health_gap_pct = 100.0 if available_phcs == 0 else min(100.0, (phc_gap / req_phcs) * 100.0)
    elif pop >= 5000 or available_subcentres < req_subcentres:
        health_priority = "P2"
        health_label = "HIGH PRIORITY (UPGRADE)"
        health_score = 65.0
        health_color = "#F97316"
        health_badge_class = "bg-amber-500/15 text-amber-400 border-amber-500/30"
        health_gap_pct = 20.0
    else:
        health_priority = "P3"
        health_label = "SUFFICIENT / ADEQUATE"
        health_score = 15.0
        health_color = "#10B981"
        health_badge_class = "bg-emerald-500/15 text-emerald-400 border-emerald-500/30"
        health_gap_pct = 0.0

    # -------------------------------------------------------------------------
    # 3. Education Classroom Gap (RTE Norm: 1:30 pupil ratio, school-age ~ 18% pop)
    # -------------------------------------------------------------------------
    class_req = int(
        deficit_summary.get("classrooms_required", deficit_summary.get("required_classrooms", math.ceil((pop * 0.18) / 30)))
        or 30
    )
    class_curr = int(
        deficit_summary.get("classrooms_current", deficit_summary.get("school_classrooms_count", 0)) or 0
    )
    class_gap = int(
        deficit_summary.get("classroom_gap", deficit_summary.get("classrooms_gap", max(0, class_req - class_curr))) or 0
    )
    class_gap_pct = min(100.0, (class_gap / max(1, class_req)) * 100.0)

    if class_gap >= 6 or class_gap_pct >= 30.0:
        class_priority = "P1"
        class_label = "CRITICAL INTERVENTION"
        class_score = min(99.0, max(75.0, 75.0 + (class_gap_pct * 0.75)))
        class_color = "#EF4444"
        class_badge_class = "bg-rose-500/15 text-rose-400 border-rose-500/30"
    elif class_gap >= 3 or class_gap_pct >= 15.0:
        class_priority = "P2"
        class_label = "HIGH PRIORITY"
        class_score = min(74.9, max(50.0, 50.0 + (class_gap_pct * 0.8)))
        class_color = "#F97316"
        class_badge_class = "bg-amber-500/15 text-amber-400 border-amber-500/30"
    elif class_gap > 0:
        class_priority = "P3"
        class_label = "MODERATE GAP"
        class_score = min(49.9, max(25.0, 25.0 + (class_gap_pct * 0.8)))
        class_color = "#EAB308"
        class_badge_class = "bg-yellow-500/15 text-yellow-400 border-yellow-500/30"
    else:
        class_priority = "P3"
        class_label = "ADEQUATE"
        class_score = 12.0
        class_color = "#10B981"
        class_badge_class = "bg-emerald-500/15 text-emerald-400 border-emerald-500/30"

    # -------------------------------------------------------------------------
    # 4. Road Connectivity Deficit (PMGSY Norm: 1.25 km / 1,000 population)
    # -------------------------------------------------------------------------
    road_req = float(
        deficit_summary.get("road_required_km", (pop / 1000.0) * 1.25) or 6.25
    )
    road_curr = float(
        deficit_summary.get("road_coverage_km", deficit_summary.get("road_coverage", 0.0)) or 0.0
    )
    road_gap = float(
        deficit_summary.get("paved_road_deficit_km", deficit_summary.get("road_gap_km", max(0.0, road_req - road_curr))) or 0.0
    )
    road_gap_pct = min(100.0, (road_gap / max(0.5, road_req)) * 100.0)

    if road_gap >= 2.5 or road_gap_pct >= 30.0:
        road_priority = "P1"
        road_label = "CRITICAL INTERVENTION"
        road_score = min(99.0, max(75.0, 75.0 + (road_gap_pct * 0.70)))
        road_color = "#EF4444"
        road_badge_class = "bg-rose-500/15 text-rose-400 border-rose-500/30"
    elif road_gap >= 1.5 or road_gap_pct >= 15.0:
        road_priority = "P2"
        road_label = "HIGH PRIORITY"
        road_score = min(74.9, max(50.0, 50.0 + (road_gap_pct * 0.8)))
        road_color = "#F97316"
        road_badge_class = "bg-amber-500/15 text-amber-400 border-amber-500/30"
    elif road_gap > 0.0:
        road_priority = "P3"
        road_label = "MODERATE GAP"
        road_score = min(49.9, max(25.0, 25.0 + (road_gap_pct * 0.8)))
        road_color = "#EAB308"
        road_badge_class = "bg-yellow-500/15 text-yellow-400 border-yellow-500/30"
    else:
        road_priority = "P3"
        road_label = "ADEQUATE"
        road_score = 12.0
        road_color = "#10B981"
        road_badge_class = "bg-emerald-500/15 text-emerald-400 border-emerald-500/30"

    # -------------------------------------------------------------------------
    # 5. Sanitation & Waste Management (SBM-G Phase II Norms)
    # -------------------------------------------------------------------------
    sanitation_def_pct = 20.0 if pop >= 5000 else 10.0
    if pop >= 7500:
        san_priority = "P2"
        san_label = "HIGH PRIORITY (SLWM UPGRADE)"
        san_score = 62.0
        san_color = "#F97316"
        san_badge_class = "bg-amber-500/15 text-amber-400 border-amber-500/30"
    else:
        san_priority = "P3"
        san_label = "MODERATE / SUSTAIN ODF+"
        san_score = 38.0
        san_color = "#EAB308"
        san_badge_class = "bg-yellow-500/15 text-yellow-400 border-yellow-500/30"

    # Sector Priority Map
    sectors = [
        {
            "sector": "Water Supply",
            "trigger_field": "water_deficit_lpd",
            "priority": water_priority,
            "priority_label": water_label,
            "severity_score": round(water_score, 1),
            "deficit_pct": round(water_def_pct, 1),
            "color": water_color,
            "badge_class": water_badge_class,
            "deficit_val": round(water_def, 1),
            "unit": "LPD",
            "benchmark_norm": "JJM 55 LPD/capita",
        },
        {
            "sector": "Healthcare",
            "trigger_field": "healthcare_deficit",
            "priority": health_priority,
            "priority_label": health_label,
            "severity_score": round(health_score, 1),
            "deficit_pct": round(health_gap_pct, 1),
            "color": health_color,
            "badge_class": health_badge_class,
            "deficit_val": phc_gap,
            "unit": "PHC Units",
            "benchmark_norm": "IPHS 1 PHC/30k pop",
        },
        {
            "sector": "Education",
            "trigger_field": "classroom_gap",
            "priority": class_priority,
            "priority_label": class_label,
            "severity_score": round(class_score, 1),
            "deficit_pct": round(class_gap_pct, 1),
            "color": class_color,
            "badge_class": class_badge_class,
            "deficit_val": class_gap,
            "unit": "Classrooms",
            "benchmark_norm": "RTE 1:30 pupil ratio",
        },
        {
            "sector": "Roads & Infrastructure",
            "trigger_field": "paved_road_deficit_km",
            "priority": road_priority,
            "priority_label": road_label,
            "severity_score": round(road_score, 1),
            "deficit_pct": round(road_gap_pct, 1),
            "color": road_color,
            "badge_class": road_badge_class,
            "deficit_val": round(road_gap, 2),
            "unit": "km Paved Road",
            "benchmark_norm": "PMGSY 1.25 km/1k pop",
        },
        {
            "sector": "Sanitation & Waste",
            "trigger_field": "sanitation_deficit",
            "priority": san_priority,
            "priority_label": san_label,
            "severity_score": round(san_score, 1),
            "deficit_pct": round(sanitation_def_pct, 1),
            "color": san_color,
            "badge_class": san_badge_class,
            "deficit_val": pop,
            "unit": "Citizens Covered",
            "benchmark_norm": "SBM-G ODF Plus SLWM",
        },
    ]

    # Rank strictly by priority tier (P1 > P2 > P3), then severity score descending
    priority_order = {"P1": 1, "P2": 2, "P3": 3}
    sectors.sort(key=lambda s: (priority_order.get(s["priority"], 3), -s["severity_score"]))

    # Summary counts
    p1_count = sum(1 for s in sectors if s["priority"] == "P1")
    p2_count = sum(1 for s in sectors if s["priority"] == "P2")
    p3_count = sum(1 for s in sectors if s["priority"] == "P3")

    top_sector = sectors[0] if sectors else None

    return {
        "sectors": sectors,
        "top_priority": top_sector["priority"] if top_sector else "P3",
        "top_sector": top_sector["sector"] if top_sector else "General",
        "top_severity_score": top_sector["severity_score"] if top_sector else 30.0,
        "summary": {
            "p1_critical_count": p1_count,
            "p2_high_count": p2_count,
            "p3_moderate_count": p3_count,
            "total_sectors_evaluated": len(sectors),
        },
        "water": {
            "priority": water_priority,
            "label": water_label,
            "score": round(water_score, 1),
            "deficit_pct": round(water_def_pct, 1),
            "color": water_color,
        },
        "healthcare": {
            "priority": health_priority,
            "label": health_label,
            "score": round(health_score, 1),
            "deficit_pct": round(health_gap_pct, 1),
            "color": health_color,
        },
        "education": {
            "priority": class_priority,
            "label": class_label,
            "score": round(class_score, 1),
            "deficit_pct": round(class_gap_pct, 1),
            "color": class_color,
        },
        "roads": {
            "priority": road_priority,
            "label": road_label,
            "score": round(road_score, 1),
            "deficit_pct": round(road_gap_pct, 1),
            "color": road_color,
        },
        "sanitation": {
            "priority": san_priority,
            "label": san_label,
            "score": round(san_score, 1),
            "deficit_pct": round(sanitation_def_pct, 1),
            "color": san_color,
        },
    }
