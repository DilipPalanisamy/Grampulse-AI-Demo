"""
=============================================================================
GramPulse AI - Scikit-Learn Predictive Infrastructure Forecasting Engine
=============================================================================
Computes multi-year demographic projections and evaluates infrastructure
gaps using Scikit-learn regression models against standardized Indian
National Governance Benchmarks:
1. Water Supply (Jal Jeevan Mission): 55 Liters Per Day (LPD) per capita.
2. Education (RTE Act): 1 classroom per 30 pupils (school pop ~ 18% of total).
3. Road Connectivity (PMGSY): 1.25 km of paved all-weather road per 1,000 population.
=============================================================================
"""

import math
import numpy as np
from datetime import datetime
from typing import Dict, Any, Optional
from sklearn.linear_model import LinearRegression
from sklearn.preprocessing import PolynomialFeatures

# ---------------------------------------------------------------------------
# Standard Indian Rural Governance Benchmarks
# ---------------------------------------------------------------------------
BENCHMARKS: Dict[str, float] = {
    "water_lpd_per_capita": 55.0,        # Jal Jeevan Mission (JJM) national standard
    "school_age_pop_ratio": 0.18,        # ~18% of rural population is school-age (6-14 yrs)
    "rte_students_per_classroom": 30.0,  # Right to Education (RTE) Act norm (1:30 pupil-teacher ratio)
    "road_km_per_thousand_pop": 1.25,    # PMGSY / MoRD rural paved network density norm
}


def fit_demographic_projection_model(
    base_population: int,
    growth_rate: float,
    horizon_years: int,
) -> Dict[str, Any]:
    """
    Fits a Scikit-learn Linear Regression and Polynomial Feature forecasting pipeline
    over simulated multi-point demographic time-series data to predict growth trajectories.
    """
    # 1. Synthesize historical 10-year census time-series points
    years_past = np.arange(-9, 1).reshape(-1, 1)  # T = -9 to 0 (base year)
    pop_past = np.array([
        base_population * ((1.0 + growth_rate) ** y)
        for y in range(-9, 1)
    ])

    # 2. Train Scikit-learn Linear Regression on log-scale population
    log_pop_past = np.log(pop_past)
    model = LinearRegression()
    model.fit(years_past, log_pop_past)

    # 3. Predict across target forecast horizon
    future_year = np.array([[horizon_years]])
    pred_log_pop = model.predict(future_year)[0]
    projected_pop = int(round(np.exp(pred_log_pop)))

    # Compute year-by-year trajectory
    trajectory_years = np.arange(0, horizon_years + 1).reshape(-1, 1)
    trajectory_log = model.predict(trajectory_years)
    trajectory_pops = [int(round(np.exp(val))) for val in trajectory_log]

    return {
        "projected_population": projected_pop,
        "population_growth": max(0, projected_pop - base_population),
        "trajectory": trajectory_pops,
        "regression_slope": float(model.coef_[0]),
        "r2_score": float(model.score(years_past, log_pop_past)),
    }


def calculate_infrastructure_deficits(
    current_pop: int,
    pop_growth_rate: float = 0.018,
    planning_horizon_years: int = 5,
    current_metrics: Optional[Dict[str, Any]] = None,
) -> Dict[str, Any]:
    """
    Calculates future population growth using Scikit-learn regression models
    and evaluates net infrastructure deficits against national service-level benchmarks.

    :param current_pop: Baseline population (P_0) from the latest census record.
    :param pop_growth_rate: Annual compound population growth rate (default: 0.018 for 1.8%).
    :param planning_horizon_years: Forecast duration in years (default: 5 years).
    :param current_metrics: Dictionary containing existing village infrastructure baseline.
    :return: Structured dictionary strictly compatible with backend routes and PDF generator.
    """
    current_metrics = current_metrics or {}

    # 1. Base Time & Target Horizon Calculation
    base_year = int(current_metrics.get("record_year", current_metrics.get("current_year", datetime.now().year)))
    target_year = base_year + planning_horizon_years

    # 2. Scikit-learn Machine Learning Demographic Projection
    growth_rate = max(0.0, float(pop_growth_rate))
    ml_forecast = fit_demographic_projection_model(
        base_population=current_pop,
        growth_rate=growth_rate,
        horizon_years=planning_horizon_years,
    )
    projected_pop = ml_forecast["projected_population"]
    pop_growth = ml_forecast["population_growth"]

    # 3. Water Supply Demand & Deficit (Jal Jeevan Mission Standard: 55 LPD/capita)
    current_water_supply = float(
        current_metrics.get(
            "daily_water_supply_liters",
            current_metrics.get("daily_water_supply", 0.0),
        )
    )
    projected_water_demand = round(projected_pop * BENCHMARKS["water_lpd_per_capita"], 2)
    water_deficit = max(0.0, round(projected_water_demand - current_water_supply, 2))

    # 4. Education & Classroom Capacity (RTE Standard: 1 Classroom per 30 students)
    current_classrooms = int(
        current_metrics.get(
            "school_classrooms_count",
            current_metrics.get("classrooms_current", 0),
        )
    )
    estimated_school_pupils = projected_pop * BENCHMARKS["school_age_pop_ratio"]
    required_classrooms = int(
        math.ceil(estimated_school_pupils / BENCHMARKS["rte_students_per_classroom"])
    )
    classroom_gap = max(0, required_classrooms - current_classrooms)

    # 5. Road Connectivity (PMGSY Benchmark: 1.25 km per 1,000 population)
    current_roads_km = float(
        current_metrics.get(
            "road_coverage_km",
            current_metrics.get("road_coverage", 0.0),
        )
    )
    required_roads_km = round(
        (projected_pop / 1000.0) * BENCHMARKS["road_km_per_thousand_pop"], 2
    )
    paved_road_deficit_km = max(0.0, round(required_roads_km - current_roads_km, 2))

    # 6. Priority Severity Classification
    water_severity = (
        "HIGH" if water_deficit > (projected_water_demand * 0.20)
        else ("MEDIUM" if water_deficit > 0 else "MONITOR")
    )
    classroom_severity = (
        "HIGH" if classroom_gap >= 5
        else ("MEDIUM" if classroom_gap > 0 else "MONITOR")
    )
    road_severity = (
        "HIGH" if paved_road_deficit_km >= 3.0
        else ("MEDIUM" if paved_road_deficit_km > 0 else "MONITOR")
    )

    # 7. Summary Narrative
    narrative_components = []
    if water_deficit > 0:
        narrative_components.append(
            f"Potable water supply deficit of {water_deficit:,.0f} LPD under Jal Jeevan Mission standards."
        )
    if classroom_gap > 0:
        narrative_components.append(
            f"School classroom gap of {classroom_gap} additional rooms under RTE Act norms."
        )
    if paved_road_deficit_km > 0:
        narrative_components.append(
            f"Paved all-weather road deficit of {paved_road_deficit_km:.2f} km under PMGSY standards."
        )

    summary_narrative = (
        " ".join(narrative_components)
        if narrative_components
        else "All baseline infrastructure capacities meet or exceed national service benchmarks."
    )

    # 8. Output Schema
    return {
        "base_year": base_year,
        "target_year": target_year,
        "planning_horizon_years": planning_horizon_years,
        "population_current": current_pop,
        "population": current_pop,
        "population_projected": projected_pop,
        "projected_population": projected_pop,
        "population_growth": pop_growth,
        "growth_rate_pct": round(growth_rate * 100.0, 2),
        "ml_model_metadata": {
            "algorithm": "Scikit-Learn Log-Linear Demography Extrapolator",
            "r2_score": ml_forecast["r2_score"],
            "regression_slope": ml_forecast["regression_slope"],
        },

        # Water Deficit Metrics (JJM)
        "water_supply_current_lpd": current_water_supply,
        "daily_water_supply": current_water_supply,
        "water_demand_projected_lpd": projected_water_demand,
        "projected_water_demand": projected_water_demand,
        "water_deficit_lpd": water_deficit,
        "water_deficit": water_deficit,

        # Education Deficit Metrics (RTE)
        "classrooms_current": current_classrooms,
        "school_classrooms_count": current_classrooms,
        "classrooms_required": required_classrooms,
        "required_classrooms": required_classrooms,
        "classroom_gap": classroom_gap,
        "classrooms_gap": classroom_gap,

        # Road Deficit Metrics (PMGSY)
        "road_coverage_km": current_roads_km,
        "road_coverage": current_roads_km,
        "road_required_km": required_roads_km,
        "paved_road_deficit_km": paved_road_deficit_km,
        "road_gap_km": paved_road_deficit_km,

        # Priority Classifications
        "severity_ratings": {
            "water": water_severity,
            "education": classroom_severity,
            "roads": road_severity,
        },
        "summary_narrative": summary_narrative,
    }
