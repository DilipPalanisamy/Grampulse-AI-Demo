# =========================================================
# GramPulse AI - Census Service
# Official Census of India 2011 Integration
# Primary Census Abstract (PCA) & Household Amenities (HL-11)
# =========================================================

import pandas as pd
from pathlib import Path
from typing import Optional, Dict, Any, List


# =========================================================
# FILE PATHS
# =========================================================

BASE_DIR = Path(__file__).resolve().parent

BASELINE_FILE = (
    BASE_DIR
    / "data"
    / "processed"
    / "chinniam_palayam_baseline.csv"
)

COIMBATORE_PCA_FILE = (
    BASE_DIR
    / "data"
    / "processed"
    / "census_coimbatore_2011.csv"
)

COIMBATORE_HL11_FILE = (
    BASE_DIR
    / "data"
    / "processed"
    / "census_coimbatore_hl11_2011.csv"
)

# In-memory cache for fast repeated queries
_PCA_DF: Optional[pd.DataFrame] = None
_HL11_DF: Optional[pd.DataFrame] = None


# =========================================================
# DATA LOADERS (LAZY)
# =========================================================

def get_pca_dataframe() -> Optional[pd.DataFrame]:
    """Loads and caches the official Census 2011 PCA dataset."""
    global _PCA_DF
    if _PCA_DF is not None:
        return _PCA_DF

    if not COIMBATORE_PCA_FILE.exists():
        return None

    try:
        df = pd.read_csv(COIMBATORE_PCA_FILE)
        df["_norm_name"] = df["Name"].apply(normalize_village_name)
        _PCA_DF = df
        return _PCA_DF
    except Exception as e:
        print(f"Error loading Census PCA dataset: {e}")
        return None


def get_hl11_dataframe() -> Optional[pd.DataFrame]:
    """Loads and caches the official Census 2011 HL-11 amenities dataset."""
    global _HL11_DF
    if _HL11_DF is not None:
        return _HL11_DF

    if not COIMBATORE_HL11_FILE.exists():
        return None

    try:
        df = pd.read_csv(COIMBATORE_HL11_FILE)
        df["_norm_name"] = df["location_name"].apply(normalize_village_name)
        _HL11_DF = df
        return _HL11_DF
    except Exception as e:
        print(f"Error loading Census HL-11 dataset: {e}")
        return None


# =========================================================
# VILLAGE NAME NORMALIZATION
# =========================================================

def normalize_village_name(name: Any) -> str:
    """
    Safely normalizes village/town names for robust matching.
    Removes whitespace, punctuation, and common administrative suffixes.
    """
    import re
    if name is None:
        return ""

    s = str(name).strip().lower()

    # Remove parenthetical abbreviations first: (tp), (ct), (m), (rf)
    s = re.sub(r"\((tp|ct|m|rf|pts)\)", "", s)

    for ch in [" ", "-", "_", "(", ")", ".", "/", ","]:
        s = s.replace(ch, "")

    # Strip standard verbose suffixes while retaining stem
    for suf in ["townpanchayat", "censustown", "municipality", "panchayat", "village"]:
        if s.endswith(suf) and len(s) > len(suf) + 2:
            s = s[:-len(suf)]

    return s


# Known Tamil Nadu phonetic aliases and spelling variants
VILLAGE_ALIASES: Dict[str, List[str]] = {
    "chinniampalayam": ["chinniyampalayam", "chinniampalayamct", "chinniapalayam"],
    "chinniyampalayam": ["chinniampalayam", "chinniampalayamct", "chinniapalayam"],
    "sirumugai": ["sirumugaipudur", "sirumugaitp"],
    "karamadai": ["karamadaitp"],
    "sulur": ["sulurtp"],
    "annur": ["annurtp"],
    "periyanaickenpalayam": ["perianaickenpalayam", "periyanaicken-palayam"],
    "veerapandi": ["veerapanditp"],
    "gudalur": ["gudalurtp"],
    "irugur": ["irugurtp"],
    "kalampalayam": ["kalampalayamct"],
}


def _safe_int(val: Any) -> Optional[int]:
    """Safely converts value to int, keeping null/NaN as None without zero-filling."""
    if val is None or pd.isna(val):
        return None
    try:
        return int(float(val))
    except (ValueError, TypeError):
        return None


def _safe_float(val: Any) -> Optional[float]:
    """Safely converts value to float, keeping null/NaN as None without zero-filling."""
    if val is None or pd.isna(val):
        return None
    try:
        return round(float(val), 2)
    except (ValueError, TypeError):
        return None


# =========================================================
# GET CENSUS BASELINE (BACKWARD COMPATIBLE & EXPANDED)
# =========================================================

def get_census_baseline(village_name: str) -> Optional[Dict[str, Any]]:
    """
    Retrieves the authentic Census 2011 baseline data for any Tamil Nadu village or town.
    First checks original baseline file, then the comprehensive Census 2011 PCA dataset.
    Maintains exact schema compatibility for existing prediction pipelines.
    """
    if not village_name or not str(village_name).strip():
        return None

    requested_norm = normalize_village_name(village_name)

    # -----------------------------------------------------
    # 1. Comprehensive check in Census 2011 Coimbatore PCA
    # -----------------------------------------------------
    pca_df = get_pca_dataframe()
    match = None

    if pca_df is not None and not pca_df.empty:
        # Filter to local administrative levels (VILLAGE or TOWN preferred)
        local_df = pca_df[pca_df["Level"].isin(["VILLAGE", "TOWN"])].copy()

        # Check numeric census code first if input is digits
        v_clean = str(village_name).strip()
        if v_clean.isdigit():
            m = local_df[local_df["Town/Village"].astype(str) == v_clean]
            if m.empty:
                m = pca_df[pca_df["Town/Village"].astype(str) == v_clean]
        else:
            m = local_df[local_df["_norm_name"] == requested_norm]

            # Check known aliases
            if m.empty:
                aliases = VILLAGE_ALIASES.get(requested_norm, [])
                for alias in aliases:
                    m = local_df[local_df["_norm_name"] == alias]
                    if not m.empty:
                        break

            # Reverse alias check
            if m.empty:
                for k, v_list in VILLAGE_ALIASES.items():
                    if requested_norm in v_list:
                        m = local_df[local_df["_norm_name"] == k]
                        if not m.empty:
                            break

            # Substring search if exact match not found
            if m.empty and len(requested_norm) >= 4:
                m = local_df[local_df["_norm_name"].str.contains(requested_norm, na=False)]

            # If still empty, check SUB-DISTRICT or DISTRICT level (with clear label)
            if m.empty:
                m = pca_df[pca_df["_norm_name"] == requested_norm]

        if not m.empty:
            match = m

    # -----------------------------------------------------
    # 2. Fallback check in single-village baseline file
    # -----------------------------------------------------
    if match is None or match.empty:
        if BASELINE_FILE.exists():
            try:
                base_df = pd.read_csv(BASELINE_FILE)
                base_norm = base_df["location_name"].apply(normalize_village_name)
                loc = base_df[base_norm == requested_norm]

                # Alias check for Chinniyampalayam
                if loc.empty and requested_norm in ["chinniyampalayam", "chinniampalayam"]:
                    loc = base_df[base_norm == "chinniampalayam"]

                if not loc.empty:
                    row_dict = loc.iloc[0].to_dict()
                    amenities = get_location_amenities(requested_norm)
                    if amenities:
                        row_dict.update(amenities)
                    return row_dict
            except Exception as e:
                print(f"Notice: BASELINE_FILE fallback encountered {e}")

        print(f"Census data not found for: {village_name}")
        return None

    # Take best matching row
    row = match.iloc[0]

    # Map Level to descriptive location_type
    level_val = str(row.get("Level", "")).upper()
    if level_val == "VILLAGE":
        loc_type = "Rural Village"
    elif level_val == "TOWN":
        name_str = str(row.get("Name", ""))
        if "(CT)" in name_str:
            loc_type = "Census Town"
        elif "(TP)" in name_str:
            loc_type = "Town Panchayat"
        elif "(M)" in name_str:
            loc_type = "Municipality"
        else:
            loc_type = "Urban Town"
    elif level_val == "SUB-DISTRICT":
        loc_type = "Sub-District (Taluk)"
    elif level_val == "DISTRICT":
        loc_type = "District"
    else:
        loc_type = level_val.title()

    clean_name = str(row.get("Name", "")).replace("(TP)", "").replace("(CT)", "").replace("(M)", "").strip()

    baseline_result: Dict[str, Any] = {
        "location_name": clean_name or str(row.get("Name", "")).strip(),
        "location_type": loc_type,
        "year": 2011,
        "households": _safe_int(row.get("No_HH")),
        "total_households": _safe_int(row.get("No_HH")),
        "population": _safe_int(row.get("TOT_P")),
        "total_population": _safe_int(row.get("TOT_P")),
        "male_population": _safe_int(row.get("TOT_M")),
        "female_population": _safe_int(row.get("TOT_F")),
        "children_0_6": _safe_int(row.get("P_06")),
        "literate_population": _safe_int(row.get("P_LIT")),
        "illiterate_population": _safe_int(row.get("P_ILL")),
        "total_workers": _safe_int(row.get("TOT_WORK_P")),
        # Additional authentic Census 2011 attributes
        "census_code": str(row.get("Town/Village", "")).strip() or None,
        "subdistrict_code": str(row.get("Subdistt", "")).strip() or None,
        "district": "Coimbatore",
        "state": "Tamil Nadu",
        "sc_population": _safe_int(row.get("P_SC")),
        "st_population": _safe_int(row.get("P_ST")),
        "main_workers": _safe_int(row.get("MAINWORK_P")),
        "marginal_workers": _safe_int(row.get("MARGWORK_P")),
        "non_workers": _safe_int(row.get("NON_WORK_P")),
        "cultivators": _safe_int(row.get("MAIN_CL_P")),
        "agricultural_labourers": _safe_int(row.get("MAIN_AL_P")),
        "household_industry_workers": _safe_int(row.get("MAIN_HH_P")),
        "other_workers": _safe_int(row.get("MAIN_OT_P")),
    }

    # Attach amenities from Census HL-11 if available
    amenities = get_location_amenities(requested_norm)
    if not amenities and clean_name:
        amenities = get_location_amenities(normalize_village_name(clean_name))
    if not amenities:
        amenities = get_location_amenities(normalize_village_name(str(row.get("Name", ""))))
    if amenities:
        baseline_result.update(amenities)

    return baseline_result


# =========================================================
# HOUSEHOLD AMENITIES LOOKUP (HL-11)
# =========================================================

def get_location_amenities(norm_name: str) -> Optional[Dict[str, Any]]:
    """
    Fetches real Census 2011 HL-11 amenities (water, electricity, latrine).
    """
    hl_df = get_hl11_dataframe()
    if hl_df is None or hl_df.empty:
        return None

    match = hl_df[hl_df["_norm_name"] == norm_name]

    if match.empty:
        aliases = VILLAGE_ALIASES.get(norm_name, [])
        for alias in aliases:
            match = hl_df[hl_df["_norm_name"] == alias]
            if not match.empty:
                break

    if match.empty and len(norm_name) >= 4:
        match = hl_df[hl_df["_norm_name"].str.contains(norm_name, na=False)]

    if match.empty:
        return None

    r = match.iloc[0]
    return {
        "hl11_households": _safe_int(r.get("households")),
        "electricity_coverage_percent": _safe_float(r.get("electricity_coverage_percent")),
        "latrine_coverage_percent": _safe_float(r.get("latrine_coverage_percent")),
        "tap_water_coverage_percent": _safe_float(r.get("tap_water_coverage_percent")),
        "treated_tap_water_households": _safe_int(r.get("treated_tap_water_households")),
        "untreated_tap_water_households": _safe_int(r.get("untreated_tap_water_households")),
        "amenities_source": "Census of India 2011 HL-11",
        "amenities_reference_year": 2011,
    }


# =========================================================
# SEARCH CENSUS LOCATIONS (AUTOCOMPLETE / BROWSE)
# =========================================================

def search_census_locations(query: str, limit: int = 20) -> List[Dict[str, Any]]:
    """
    Searches the official Census 2011 dataset for villages, towns, and local bodies.
    """
    pca_df = get_pca_dataframe()
    if pca_df is None or pca_df.empty:
        return []

    q_clean = str(query or "").strip()
    q_norm = normalize_village_name(query)
    if not q_norm and not q_clean:
        # Return top towns and villages
        sample = pca_df[pca_df["Level"].isin(["VILLAGE", "TOWN"])].head(limit)
        results = []
        for _, row in sample.iterrows():
            results.append(_format_census_search_item(row))
        return results

    if q_clean.isdigit():
        matches = pca_df[pca_df["Town/Village"].astype(str) == q_clean]
    else:
        search_terms = [q_norm] + VILLAGE_ALIASES.get(q_norm, [])
        for k, v_list in VILLAGE_ALIASES.items():
            if q_norm in v_list and k not in search_terms:
                search_terms.append(k)

        cond = pca_df["Name"].str.contains(q_clean, case=False, na=False)
        for term in search_terms:
            if term:
                cond = cond | pca_df["_norm_name"].str.contains(term, na=False)
        matches = pca_df[cond]

    # Prioritize exact TOWN and VILLAGE matches over wards and subdistricts
    matches = matches.copy()
    
    def _calc_priority(r):
        lvl = str(r.get("Level", "")).upper()
        norm = str(r.get("_norm_name", ""))
        is_exact = norm == q_norm or any(norm == term for term in search_terms)
        is_prefix = norm.startswith(q_norm)
        
        # Exact town or village name match is absolute highest priority (0)
        if is_exact and lvl in ["TOWN", "VILLAGE"]:
            return 0
        # Prefix match on town or village (1)
        if is_prefix and lvl in ["TOWN", "VILLAGE"]:
            return 1
        # Other town or village matches (2)
        if lvl in ["TOWN", "VILLAGE"]:
            return 2
        # District / Sub-district level (3)
        if lvl in ["SUB-DISTRICT", "DISTRICT"]:
            return 3
        # Wards (e.g. WARD NO.-0001) always lowest priority (4)
        return 4

    matches["_priority"] = matches.apply(_calc_priority, axis=1)
    matches = matches.sort_values(by=["_priority", "TOT_P"], ascending=[True, False])

    results = []
    for _, row in matches.head(limit).iterrows():
        results.append(_format_census_search_item(row))

    return results


def _format_census_search_item(row: pd.Series) -> Dict[str, Any]:
    name_clean = str(row.get("Name", "")).replace("(TP)", "").replace("(CT)", "").replace("(M)", "").strip()
    lvl = str(row.get("Level", "")).upper()
    return {
        "name": name_clean,
        "raw_name": str(row.get("Name", "")).strip(),
        "level": lvl,
        "is_ward": lvl == "WARD",
        "census_code": str(row.get("Town/Village", "")).strip() or None,
        "subdistrict_code": str(row.get("Subdistt", "")).strip() or None,
        "district": "Coimbatore",
        "state": "Tamil Nadu",
        "population": _safe_int(row.get("TOT_P")),
        "households": _safe_int(row.get("No_HH")),
        "reference_year": 2011,
        "source": "Census of India 2011 Primary Census Abstract",
    }
