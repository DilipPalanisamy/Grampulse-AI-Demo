"""
Builds src/data/tiruppurCensusDirectory.json
Merges:
1. backend/data/processed/census_tiruppur_2011.csv (Census 2011 PCA for District 633)
2. backend/data/processed/tamil_nadu_towns_hl11.csv (Table HL-11 household amenities for Tiruppur towns)
3. backend/data/raw/coords_master.json (Spatial coordinates)
"""

import csv
import json
import os
import re

ROOT_DIR = os.path.abspath(os.path.join(os.path.dirname(__file__), ".."))
PCA_FILE = os.path.join(ROOT_DIR, "backend", "data", "processed", "census_tiruppur_2011.csv")
HL11_FILE = os.path.join(ROOT_DIR, "backend", "data", "processed", "tamil_nadu_towns_hl11.csv")
COORDS_FILE = os.path.join(ROOT_DIR, "backend", "data", "raw", "coords_master.json")
OUT_JSON = os.path.join(ROOT_DIR, "src", "data", "tiruppurCensusDirectory.json")

TALUK_MAP = {
    '05901': 'Kangeyam',
    '05902': 'Dharapuram',
    '05903': 'Avinashi',
    '05904': 'Tiruppur',
    '05905': 'Palladam',
    '05906': 'Udumalaipettai',
    '05907': 'Madathukulam'
}

TALUK_CENTROIDS = {
    'Kangeyam': [11.0064, 77.5611],
    'Dharapuram': [10.7297, 77.5255],
    'Avinashi': [11.1932, 77.2694],
    'Tiruppur': [11.1085, 77.3411],
    'Palladam': [10.9994, 77.2789],
    'Udumalaipettai': [10.5824, 77.2476],
    'Madathukulam': [10.5606, 77.3787]
}

def clean_name(raw: str) -> str:
    s = re.sub(r"\s*\((tp|ct|m|rf|pts|m\s*corp|m\.corp|cb|og)\)", "", raw, flags=re.IGNORECASE)
    return s.strip()

def determine_type(raw_name: str, level: str) -> str:
    raw_lower = raw_name.lower()
    if 'm.corp' in raw_lower or 'm corp' in raw_lower or 'municipal corporation' in raw_lower:
        return 'Municipal Corporation'
    if '(m)' in raw_lower or 'municipality' in raw_lower:
        return 'Municipality'
    if '(tp)' in raw_lower or 'town panchayat' in raw_lower:
        return 'Town Panchayat'
    if '(ct)' in raw_lower or 'census town' in raw_lower:
        return 'Census Town'
    if level == 'TOWN':
        return 'Town Panchayat'
    return 'Gram Panchayat'

def main():
    # Load HL-11 Tiruppur amenities
    hl11_map = {}
    if os.path.exists(HL11_FILE):
        with open(HL11_FILE, 'r', encoding='utf-8') as f:
            reader = csv.DictReader(f)
            for r in reader:
                if 'tiruppur' in str(r.get('district', '')).lower():
                    code = str(r.get('census_code', '')).strip()
                    hl11_map[code] = {
                        'hl_hh': int(float(r['households'])) if r.get('households') else None,
                        'elec': round(float(r['electricity_coverage_percent']), 2) if r.get('electricity_coverage_percent') else None,
                        'water': round(float(r['tap_water_coverage_percent']), 2) if r.get('tap_water_coverage_percent') else None,
                        'lat_cov': round(float(r['latrine_coverage_percent']), 2) if r.get('latrine_coverage_percent') else None,
                        'lat': round(float(r['lat']), 4) if r.get('lat') else None,
                        'lng': round(float(r['lng']), 4) if r.get('lng') else None
                    }

    # Load coordinates
    coords_map = {}
    if os.path.exists(COORDS_FILE):
        with open(COORDS_FILE, 'r', encoding='utf-8') as f:
            coords_map = json.load(f)

    records = []
    seen_codes = set()

    with open(PCA_FILE, 'r', encoding='utf-8') as f:
        reader = csv.DictReader(f)
        for r in reader:
            level = str(r.get('Level', '')).strip().upper()
            if level not in ['VILLAGE', 'TOWN']:
                continue

            code_str = str(r.get('Town/Village', '')).strip()
            if not code_str or code_str in seen_codes:
                continue
            seen_codes.add(code_str)

            code = int(code_str)
            raw_name = str(r.get('Name', '')).strip()
            name = clean_name(raw_name)

            # Standardize Avanashi -> Avinashi
            if code == 804021 or raw_name.lower().startswith('avanashi'):
                name = 'Avinashi'

            loc_type = determine_type(raw_name, level)
            subdistt_code = str(r.get('Subdistt', '')).strip()
            taluk_name = TALUK_MAP.get(subdistt_code, 'Tiruppur')

            def get_int(key):
                val = r.get(key)
                if val is None or val == '':
                    return None
                try:
                    return int(float(val))
                except:
                    return None

            pop = get_int('TOT_P')
            m = get_int('TOT_M')
            f = get_int('TOT_F')
            p06 = get_int('P_06')
            hh = get_int('No_HH')
            lit = get_int('P_LIT')
            ill = get_int('P_ILL')
            work = get_int('TOT_WORK_P')

            # Coordinates
            coords = coords_map.get(code_str)
            taluk_c = TALUK_CENTROIDS.get(taluk_name, [11.1085, 77.3411])
            lat = coords[0] if coords else taluk_c[0]
            lng = coords[1] if coords else taluk_c[1]

            # Amenities from HL-11
            hl = hl11_map.get(code_str, {})
            hl_hh = hl.get('hl_hh')
            elec = hl.get('elec')
            water = hl.get('water')
            lat_cov = hl.get('lat_cov')
            if hl.get('lat'):
                lat = hl['lat']
            if hl.get('lng'):
                lng = hl['lng']

            # Schools estimation based on population
            schools_count = max(1, round(pop / 850)) if pop and pop > 0 else 0
            classrooms_count = schools_count * 6 if schools_count > 0 else 0

            records.append({
                'id': code,
                'name': name,
                'raw_name': raw_name,
                'type': loc_type,
                'district': 'Tiruppur',
                'taluk': taluk_name,
                'pop': pop,
                'm': m,
                'f': f,
                'p06': p06,
                'hh': hh,
                'hl_hh': hl_hh,
                'lit': lit,
                'ill': ill,
                'work': work,
                'elec': elec,
                'water': water,
                'lat_cov': lat_cov,
                'schools': schools_count,
                'classrooms': classrooms_count,
                'lat': lat,
                'lng': lng
            })

    print(f"Generated {len(records)} authentic Tiruppur Census records.")
    with open(OUT_JSON, 'w', encoding='utf-8') as f:
        json.dump(records, f, indent=2, ensure_ascii=False)
    print(f"Saved {OUT_JSON} ({os.path.getsize(OUT_JSON)} bytes)")

if __name__ == '__main__':
    main()
