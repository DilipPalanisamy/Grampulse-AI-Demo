# =========================================================
# GramPulse AI - Census Service
# Official Census of India 2011 Integration (Statewide Tamil Nadu)
# Primary Census Abstract (PCA) & Household Amenities (HL-11)
# Supports all 38 Districts, Urban Local Bodies & Rural Villages
# =========================================================

import re
import pandas as pd
from pathlib import Path
from typing import Optional, Dict, Any, List


# =========================================================
# FILE PATHS
# =========================================================

def _resolve_file(rel_name: str) -> Path:
    p1 = BASE_DIR / "data" / "processed" / rel_name
    if p1.exists():
        return p1
    p2 = BASE_DIR.parent.parent / "backend" / "data" / "processed" / rel_name
    if p2.exists():
        return p2
    return p1

BASELINE_FILE = _resolve_file("chinniam_palayam_baseline.csv")
COIMBATORE_PCA_FILE = _resolve_file("census_coimbatore_2011.csv")
COIMBATORE_HL11_FILE = _resolve_file("census_coimbatore_hl11_2011.csv")
STATEWIDE_TOWNS_FILE = _resolve_file("tamil_nadu_towns_hl11.csv")
STATEWIDE_VILLAGES_FILE = _resolve_file("tamil_nadu_villages.csv")

# In-memory caches for fast repeated queries
_PCA_DF: Optional[pd.DataFrame] = None
_HL11_DF: Optional[pd.DataFrame] = None
_STATEWIDE_TOWNS_DF: Optional[pd.DataFrame] = None
_STATEWIDE_VILLAGES_DF: Optional[pd.DataFrame] = None


# =========================================================
# VILLAGE NAME NORMALIZATION
# =========================================================

def normalize_village_name(name: Any) -> str:
    """
    Safely normalizes village/town names for robust matching.
    Removes whitespace, punctuation, and common administrative suffixes.
    """
    if name is None:
        return ""

    s = str(name).strip().lower()

    # Remove parenthetical abbreviations first: (tp), (ct), (m), (rf), (m corp)
    s = re.sub(r"\((tp|ct|m|rf|pts|m\s*corp|m\.corp|cb|og)\)", "", s)

    for ch in [" ", "-", "_", "(", ")", ".", "/", ",", "'", '"']:
        s = s.replace(ch, "")

    # Strip standard verbose suffixes while retaining stem
    for suf in ["townpanchayat", "censustown", "municipality", "municipalcorporation", "panchayat", "village"]:
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
    "madukkarai": ["madukkaraitp"],
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
# DATA LOADERS (LAZY)
# =========================================================

def get_pca_dataframe() -> Optional[pd.DataFrame]:
    """Loads and caches the official Census 2011 Coimbatore PCA dataset."""
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
    """Loads and caches the official Census 2011 Coimbatore HL-11 amenities dataset."""
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


def get_statewide_towns_dataframe() -> Optional[pd.DataFrame]:
    """Loads and caches the official Census 2011 statewide towns (1,097 ULBs across 38 districts)."""
    global _STATEWIDE_TOWNS_DF
    if _STATEWIDE_TOWNS_DF is not None:
        return _STATEWIDE_TOWNS_DF

    if not STATEWIDE_TOWNS_FILE.exists():
        return None

    try:
        df = pd.read_csv(STATEWIDE_TOWNS_FILE)
        df["_norm_name"] = df["name"].apply(normalize_village_name)
        df["_norm_raw"] = df["raw_name"].apply(normalize_village_name)
        df["_norm_dist"] = df["district"].astype(str).str.strip().str.lower()
        _STATEWIDE_TOWNS_DF = df
        return _STATEWIDE_TOWNS_DF
    except Exception as e:
        print(f"Error loading Statewide Towns dataset: {e}")
        return None


def get_statewide_villages_dataframe() -> Optional[pd.DataFrame]:
    """Loads and caches the official Tamil Nadu rural village directory (18,710 villages)."""
    global _STATEWIDE_VILLAGES_DF
    if _STATEWIDE_VILLAGES_DF is not None:
        return _STATEWIDE_VILLAGES_DF

    if not STATEWIDE_VILLAGES_FILE.exists():
        return None

    try:
        df = pd.read_csv(STATEWIDE_VILLAGES_FILE, dtype={"Village Code": str, "Pincode": str})
        df["_norm_name"] = df["Village"].apply(normalize_village_name)
        df["_norm_dist"] = df["District"].astype(str).str.strip().str.lower()
        _STATEWIDE_VILLAGES_DF = df
        return _STATEWIDE_VILLAGES_DF
    except Exception as e:
        print(f"Error loading Statewide Villages dataset: {e}")
        return None


# =========================================================
# GET CENSUS BASELINE (STATEWIDE TAMIL NADU)
# =========================================================

def get_census_baseline(village_name: str, district_name: Optional[str] = None) -> Optional[Dict[str, Any]]:
    """
    Retrieves authentic government baseline data for any Tamil Nadu village or town.
    Supports all 38 districts, Census codes, English names, and Tamil phonetic spellings.
    """
    if not village_name or not str(village_name).strip():
        return None

    requested_norm = normalize_village_name(village_name)
    v_clean = str(village_name).strip()
    is_numeric = v_clean.isdigit()

    dist_norm = str(district_name).strip().lower() if district_name and district_name.strip().lower() not in ["all districts", "tamil nadu", ""] else None

    # -----------------------------------------------------
    # 1. Check Coimbatore PCA if district is Coimbatore or not specified
    # -----------------------------------------------------
    if dist_norm is None or dist_norm == "coimbatore":
        pca_df = get_pca_dataframe()
        if pca_df is not None and not pca_df.empty:
            local_df = pca_df[pca_df["Level"].isin(["VILLAGE", "TOWN"])].copy()
            m = pd.DataFrame()
            if is_numeric:
                m = local_df[local_df["Town/Village"].astype(str) == v_clean]
                if m.empty:
                    m = pca_df[pca_df["Town/Village"].astype(str) == v_clean]
            else:
                m = local_df[local_df["_norm_name"] == requested_norm]
                if m.empty:
                    for alias in VILLAGE_ALIASES.get(requested_norm, []):
                        m = local_df[local_df["_norm_name"] == alias]
                        if not m.empty:
                            break

            if not m.empty:
                row = m.iloc[0]
                return _format_pca_row_to_baseline(row, requested_norm)

    # -----------------------------------------------------
    # 2. Check Statewide Towns (1,097 ULBs across 38 districts with authentic HL-11 metrics)
    # -----------------------------------------------------
    towns_df = get_statewide_towns_dataframe()
    if towns_df is not None and not towns_df.empty:
        t_match = pd.DataFrame()
        scoped_towns = towns_df[towns_df["_norm_dist"] == dist_norm] if dist_norm else towns_df

        if is_numeric:
            t_match = scoped_towns[scoped_towns["census_code"].astype(str) == v_clean]
            if t_match.empty and dist_norm:
                t_match = towns_df[towns_df["census_code"].astype(str) == v_clean]
        else:
            t_match = scoped_towns[scoped_towns["_norm_name"] == requested_norm]
            if t_match.empty:
                t_match = scoped_towns[scoped_towns["_norm_raw"] == requested_norm]
            if t_match.empty:
                for alias in VILLAGE_ALIASES.get(requested_norm, []):
                    t_match = scoped_towns[scoped_towns["_norm_name"] == alias]
                    if not t_match.empty:
                        break
            if t_match.empty and len(requested_norm) >= 4:
                t_match = scoped_towns[scoped_towns["_norm_name"].str.contains(requested_norm, na=False)]

        if not t_match.empty:
            r = t_match.iloc[0]
            hh_val = _safe_int(r.get("households"))
            pop_val = int(hh_val * 3.8) if hh_val else None

            return {
                "location_name": str(r.get("name", "")).strip(),
                "raw_name": str(r.get("raw_name", "")).strip(),
                "location_type": str(r.get("location_type", "Town")),
                "year": 2011,
                "households": hh_val,
                "total_households": hh_val,
                "hl11_households": hh_val,
                "population": pop_val,
                "total_population": pop_val,
                "census_code": str(r.get("census_code", "")).strip() or None,
                "district": str(r.get("district", "Tamil Nadu")),
                "state": "Tamil Nadu",
                "electricity_coverage_percent": _safe_float(r.get("electricity_coverage_percent")),
                "tap_water_coverage_percent": _safe_float(r.get("tap_water_coverage_percent")),
                "latrine_coverage_percent": _safe_float(r.get("latrine_coverage_percent")),
                "lat": _safe_float(r.get("lat")),
                "lng": _safe_float(r.get("lng")),
                "amenities_source": "Census of India 2011 Table HL-11",
                "amenities_reference_year": 2011,
            }

    # -----------------------------------------------------
    # 3. Check Statewide Rural Villages (18,710 villages across 38 districts)
    # -----------------------------------------------------
    vil_df = get_statewide_villages_dataframe()
    if vil_df is not None and not vil_df.empty:
        v_match = pd.DataFrame()
        scoped_vils = vil_df[vil_df["_norm_dist"] == dist_norm] if dist_norm else vil_df

        if is_numeric:
            v_match = scoped_vils[scoped_vils["Village Code"].astype(str) == v_clean]
            if v_match.empty and dist_norm:
                v_match = vil_df[vil_df["Village Code"].astype(str) == v_clean]
        else:
            v_match = scoped_vils[scoped_vils["_norm_name"] == requested_norm]
            if v_match.empty and len(requested_norm) >= 4:
                v_match = scoped_vils[scoped_vils["_norm_name"].str.contains(requested_norm, na=False)]

        if not v_match.empty:
            vr = v_match.iloc[0]
            v_name = str(vr.get("Village", "")).strip()
            v_code = str(vr.get("Village Code", "")).strip()
            v_dist = str(vr.get("District", "Tamil Nadu")).strip()

            return {
                "location_name": v_name,
                "raw_name": v_name,
                "native_name": str(vr.get("Village (Native)", "")).strip() or None,
                "location_type": "Rural Village",
                "year": 2011,
                "households": None,
                "total_households": None,
                "hl11_households": None,
                "population": None,
                "total_population": None,
                "census_code": v_code or None,
                "subdistrict_name": str(vr.get("Mandal", "")).strip() or None,
                "district": v_dist,
                "pincode": str(vr.get("Pincode", "")).strip() or None,
                "state": "Tamil Nadu",
                "electricity_coverage_percent": None,
                "tap_water_coverage_percent": None,
                "latrine_coverage_percent": None,
                "amenities_source": "Local Government Directory / Census 2011",
                "amenities_reference_year": 2011,
            }

    # -----------------------------------------------------
    # 4. Fallback check in single-village baseline file
    # -----------------------------------------------------
    if BASELINE_FILE.exists():
        try:
            base_df = pd.read_csv(BASELINE_FILE)
            base_norm = base_df["location_name"].apply(normalize_village_name)
            loc = base_df[base_norm == requested_norm]
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

    return None


def _format_pca_row_to_baseline(row: pd.Series, requested_norm: str) -> Dict[str, Any]:
    """Helper to convert PCA row to rich baseline format."""
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

def search_census_locations(query: str, district: Optional[str] = None, limit: int = 20) -> List[Dict[str, Any]]:
    """
    Searches official Tamil Nadu Census & LGD locations across all 38 districts.
    Supports English names, Tamil script, Census codes, and district filtering.
    """
    q_clean = str(query or "").strip()
    q_norm = normalize_village_name(query)
    is_numeric = q_clean.isdigit()

    dist_norm = str(district).strip().lower() if district and district.strip().lower() not in ["all districts", "tamil nadu", ""] else None

    results: List[Dict[str, Any]] = []
    seen_codes = set()

    # 1. Search Statewide Towns (1,097 ULBs across 38 districts)
    towns_df = get_statewide_towns_dataframe()
    if towns_df is not None and not towns_df.empty:
        scoped_towns = towns_df[towns_df["_norm_dist"] == dist_norm] if dist_norm else towns_df
        if is_numeric:
            t_matches = scoped_towns[scoped_towns["census_code"].astype(str).str.contains(q_clean, na=False)]
        elif q_clean:
            search_norms = [q_norm] + VILLAGE_ALIASES.get(q_norm, [])
            cond = scoped_towns["_norm_name"].str.contains(q_norm, na=False) | scoped_towns["name"].str.contains(q_clean, case=False, na=False)
            for sn in search_norms:
                if sn:
                    cond = cond | scoped_towns["_norm_name"].str.contains(sn, na=False)
            t_matches = scoped_towns[cond]
        else:
            t_matches = scoped_towns.head(limit)

        for _, r in t_matches.head(limit).iterrows():
            code = str(r.get("census_code", "")).strip()
            if code and code not in seen_codes:
                seen_codes.add(code)
                hh_val = _safe_int(r.get("households"))
                results.append({
                    "name": str(r.get("name", "")).strip(),
                    "raw_name": str(r.get("raw_name", "")).strip(),
                    "level": str(r.get("location_type", "Town")),
                    "is_ward": False,
                    "census_code": code or None,
                    "district": str(r.get("district", "Tamil Nadu")),
                    "state": "Tamil Nadu",
                    "population": int(hh_val * 3.8) if hh_val else None,
                    "households": hh_val,
                    "electricity_coverage": _safe_float(r.get("electricity_coverage_percent")),
                    "tap_water_coverage": _safe_float(r.get("tap_water_coverage_percent")),
                    "latrine_coverage": _safe_float(r.get("latrine_coverage_percent")),
                    "reference_year": 2011,
                    "source": "Census of India 2011 Table HL-11",
                })

    # 2. Search Coimbatore PCA if within scope
    if len(results) < limit and (dist_norm is None or dist_norm == "coimbatore"):
        pca_df = get_pca_dataframe()
        if pca_df is not None and not pca_df.empty:
            local_df = pca_df[pca_df["Level"].isin(["VILLAGE", "TOWN"])].copy()
            if is_numeric:
                p_matches = local_df[local_df["Town/Village"].astype(str).str.contains(q_clean, na=False)]
            elif q_clean:
                p_matches = local_df[local_df["Name"].str.contains(q_clean, case=False, na=False) | local_df["_norm_name"].str.contains(q_norm, na=False)]
            else:
                p_matches = local_df.head(limit)

            for _, r in p_matches.head(limit - len(results)).iterrows():
                code = str(r.get("Town/Village", "")).strip()
                if code and code not in seen_codes:
                    seen_codes.add(code)
                    results.append(_format_census_search_item(r))

    # 3. Search Statewide Rural Villages (18,710 villages)
    if len(results) < limit:
        vil_df = get_statewide_villages_dataframe()
        if vil_df is not None and not vil_df.empty:
            scoped_vils = vil_df[vil_df["_norm_dist"] == dist_norm] if dist_norm else vil_df
            if is_numeric:
                v_matches = scoped_vils[scoped_vils["Village Code"].astype(str).str.contains(q_clean, na=False)]
            elif q_clean:
                # Support both English name and Tamil native script
                cond = scoped_vils["Village"].str.contains(q_clean, case=False, na=False) | scoped_vils["_norm_name"].str.contains(q_norm, na=False)
                if any(ord(c) > 127 for c in q_clean):
                    cond = cond | scoped_vils["Village (Native)"].astype(str).str.contains(q_clean, na=False)
                v_matches = scoped_vils[cond]
            else:
                v_matches = scoped_vils.head(limit - len(results))

            for _, vr in v_matches.head(limit - len(results)).iterrows():
                v_code = str(vr.get("Village Code", "")).strip()
                if v_code and v_code not in seen_codes:
                    seen_codes.add(v_code)
                    results.append({
                        "name": str(vr.get("Village", "")).strip(),
                        "raw_name": str(vr.get("Village", "")).strip(),
                        "native_name": str(vr.get("Village (Native)", "")).strip() or None,
                        "level": "Village",
                        "is_ward": False,
                        "census_code": v_code or None,
                        "subdistrict_name": str(vr.get("Mandal", "")).strip() or None,
                        "district": str(vr.get("District", "Tamil Nadu")),
                        "pincode": str(vr.get("Pincode", "")).strip() or None,
                        "state": "Tamil Nadu",
                        "population": None,
                        "households": None,
                        "reference_year": 2011,
                        "source": "Tamil Nadu Local Government Directory",
                    })

    return results[:limit]


def _format_census_search_item(row: pd.Series) -> Dict[str, Any]:
    name_clean = str(row.get("Name", "")).replace("(TP)", "").replace("(CT)", "").replace("(M)", "").strip()
    lvl = str(row.get("Level", "")).upper()
    return {
        "name": name_clean,
        "raw_name": str(row.get("Name", "")).strip(),
        "level": "Town Panchayat" if lvl == "TOWN" else ("Rural Village" if lvl == "VILLAGE" else lvl),
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
