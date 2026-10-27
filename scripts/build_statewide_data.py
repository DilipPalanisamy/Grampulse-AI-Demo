"""
=============================================================================
GramPulse AI - Statewide Tamil Nadu Data Processing Engine
=============================================================================
Processes:
1. DDW-HH3711-3300.xls (Official Census 2011 Table HL-11) for all 38 districts
2. tamil_nadu_villages.csv (18,710 villages with Tamil script and LGD codes)
3. Merges authentic Coimbatore PCA & UDISE+ directory data
Outputs:
- src/data/tamilNaduDistricts.json (38 districts with HQ and coordinates)
- src/data/tamilNaduTownsDirectory.json (1,097 ULBs with HL-11 amenities)
- src/data/tamilNaduVillagesIndex.json (Fast client-side search index)
- backend/data/processed/tamil_nadu_towns_hl11.csv
=============================================================================
"""

import os
import sys
import csv
import json
import re
import xlrd
import pandas as pd

ROOT_DIR = os.path.abspath(os.path.join(os.path.dirname(__file__), ".."))
HL11_SRC = os.path.join(ROOT_DIR, "GramPulse-FuturePredictor", "backend", "data", "raw", "DDW-HH3711-3300.xls")
VILLAGES_SRC = os.path.join(ROOT_DIR, "backend", "data", "raw", "tamil_nadu_villages.csv")
COORDS_SRC = os.path.join(ROOT_DIR, "backend", "data", "raw", "coords_master.json")
COIMBATORE_DIR_PATH = os.path.join(ROOT_DIR, "src", "data", "coimbatoreCensusDirectory.json")

# Output paths
OUT_DISTRICTS_JSON = os.path.join(ROOT_DIR, "src", "data", "tamilNaduDistricts.json")
OUT_TOWNS_JSON = os.path.join(ROOT_DIR, "src", "data", "tamilNaduTownsDirectory.json")
OUT_VILLAGES_JSON = os.path.join(ROOT_DIR, "src", "data", "tamilNaduVillagesIndex.json")
OUT_BACKEND_TOWNS_CSV = os.path.join(ROOT_DIR, "backend", "data", "processed", "tamil_nadu_towns_hl11.csv")
OUT_FP_TOWNS_CSV = os.path.join(ROOT_DIR, "GramPulse-FuturePredictor", "backend", "data", "processed", "tamil_nadu_towns_hl11.csv")

DISTRICT_CENTROIDS = {
    "Ariyalur": [11.1401, 79.0786],
    "Chengalpattu": [12.6819, 79.9888],
    "Chennai": [13.0827, 80.2707],
    "Coimbatore": [11.0168, 76.9558],
    "Cuddalore": [11.7480, 79.7714],
    "Dharmapuri": [12.1211, 78.1582],
    "Dindigul": [10.3673, 77.9803],
    "Erode": [11.3410, 77.7172],
    "Kallakurichi": [11.7383, 78.9639],
    "Kancheepuram": [12.8342, 79.7036],
    "Kanniyakumari": [8.0883, 77.5385],
    "Karur": [10.9601, 78.0766],
    "Krishnagiri": [12.5186, 78.2137],
    "Madurai": [9.9252, 78.1198],
    "Mayiladuthurai": [11.1075, 79.6524],
    "Nagapattinam": [10.7672, 79.8449],
    "Namakkal": [11.2189, 78.1674],
    "Nilgiris": [11.4102, 76.6950],
    "The Nilgiris": [11.4102, 76.6950],
    "Perambalur": [11.2342, 78.8820],
    "Pudukkottai": [10.3797, 78.8208],
    "Ramanathapuram": [9.3639, 78.8395],
    "Ranipet": [12.9229, 79.3326],
    "Salem": [11.6643, 78.1460],
    "Sivaganga": [9.8433, 78.4809],
    "Tenkasi": [8.9594, 77.3161],
    "Thanjavur": [10.7870, 79.1378],
    "Theni": [10.0104, 77.4768],
    "Thiruvallur": [13.1432, 79.9074],
    "Thiruvarur": [10.7725, 79.6365],
    "Thoothukkudi": [8.7642, 78.1348],
    "Tiruchirappalli": [10.7905, 78.7047],
    "Tirunelveli": [8.7139, 77.7567],
    "Tirupathur": [12.4925, 78.5678],
    "Tiruppur": [11.1085, 77.3411],
    "Tiruvannamalai": [12.2253, 79.0747],
    "Vellore": [12.9165, 79.1325],
    "Viluppuram": [11.9401, 79.4861],
    "Virudhunagar": [9.5680, 77.9624]
}

bifurcated_taluks = {
    '05703': 'Chengalpattu', '05704': 'Chengalpattu', '05705': 'Chengalpattu',
    '05706': 'Chengalpattu', '05709': 'Chengalpattu', '05710': 'Chengalpattu', '05711': 'Chengalpattu',
    '05714': 'Ranipet', '05715': 'Ranipet', '05716': 'Ranipet',
    '05718': 'Tirupathur', '05719': 'Tirupathur', '05720': 'Tirupathur',
    '05732': 'Kallakurichi', '05733': 'Kallakurichi', '05734': 'Kallakurichi', '05735': 'Kallakurichi',
    '05795': 'Mayiladuthurai', '05796': 'Mayiladuthurai', '05797': 'Mayiladuthurai', '05798': 'Mayiladuthurai',
    '05870': 'Tenkasi', '05871': 'Tenkasi', '05872': 'Tenkasi', '05873': 'Tenkasi', '05874': 'Tenkasi', '05875': 'Tenkasi',
}

base_dist_map = {
    '602': 'Thiruvallur', '603': 'Chennai', '604': 'Kancheepuram', '605': 'Vellore',
    '606': 'Tiruvannamalai', '607': 'Viluppuram', '608': 'Salem', '609': 'Namakkal',
    '610': 'Erode', '611': 'Nilgiris', '612': 'Dindigul', '613': 'Karur',
    '614': 'Tiruchirappalli', '615': 'Perambalur', '616': 'Ariyalur', '617': 'Cuddalore',
    '618': 'Nagapattinam', '619': 'Thiruvarur', '620': 'Thanjavur', '621': 'Pudukkottai',
    '622': 'Sivaganga', '623': 'Madurai', '624': 'Theni', '625': 'Virudhunagar',
    '626': 'Ramanathapuram', '627': 'Thoothukkudi', '628': 'Tirunelveli', '629': 'Kanniyakumari',
    '630': 'Dharmapuri', '631': 'Krishnagiri', '632': 'Coimbatore', '633': 'Tiruppur'
}

def clean_location_type(raw_name):
    if '(M Corp)' in raw_name or '(M.Corp)' in raw_name:
        return 'Municipal Corporation'
    if '(M)' in raw_name:
        return 'Municipality'
    if '(TP)' in raw_name:
        return 'Town Panchayat'
    if '(CT)' in raw_name:
        return 'Census Town'
    if '(CB)' in raw_name:
        return 'Cantonment Board'
    if '(OG)' in raw_name:
        return 'Out Growth'
    return 'Town'

def clean_town_name(raw_name):
    s = re.sub(r'\(.*?\)', '', raw_name).strip()
    return s

def main():
    print("Processing HL-11 Towns from", HL11_SRC)
    wb = xlrd.open_workbook(HL11_SRC, on_demand=True)
    sheet = wb.sheet_by_index(0)

    # Load existing Coimbatore and Tiruppur data to preserve exact PCA and coordinates
    coimbatore_cache = {}
    if os.path.exists(COIMBATORE_DIR_PATH):
        with open(COIMBATORE_DIR_PATH, 'r', encoding='utf-8') as f:
            c_data = json.load(f)
            for item in c_data:
                coimbatore_cache[str(item.get('id'))] = item

    tiruppur_cache = {}
    TIRUPPUR_DIR_PATH = os.path.join(ROOT_DIR, "src", "data", "tiruppurCensusDirectory.json")
    if os.path.exists(TIRUPPUR_DIR_PATH):
        with open(TIRUPPUR_DIR_PATH, 'r', encoding='utf-8') as f:
            t_data = json.load(f)
            for item in t_data:
                tiruppur_cache[str(item.get('id'))] = item

    # Load coordinates map
    coords_map = {}
    if os.path.exists(COORDS_SRC):
        with open(COORDS_SRC, 'r', encoding='utf-8') as f:
            coords_map = json.load(f)

    town_records = {}
    for r in range(6, sheet.nrows):
        row = sheet.row_values(r)
        d_code = str(row[2]).strip()
        t_code = str(row[3]).strip()
        town_code = str(row[4]).strip()
        raw_name = str(row[5]).strip()
        source = str(row[7]).strip()
        avail = str(row[8]).strip()

        if town_code in ('000000', '', '0'):
            continue

        dist_name = bifurcated_taluks.get(t_code, base_dist_map.get(d_code, 'Tamil Nadu'))
        if dist_name == 'The Nilgiris':
            dist_name = 'Nilgiris'

        if town_code not in town_records:
            town_records[town_code] = {
                'town_code': town_code,
                'district_code': d_code,
                'tehsil_code': t_code,
                'district': dist_name,
                'raw_name': raw_name,
                'name': clean_town_name(raw_name),
                'type': clean_location_type(raw_name),
                'households': None,
                'elec_hh': 0.0,
                'lat_hh': 0.0,
                'water_treated_hh': 0.0,
            }

        rec = town_records[town_code]
        if source == 'All Sources' and avail == 'Total number of households':
            rec['households'] = float(row[9])
            rec['elec_hh'] = float(row[10]) + float(row[11])
            rec['lat_hh'] = float(row[10]) + float(row[12])
        elif source == 'Tap water from treated source' and avail == 'Total number of households':
            rec['water_treated_hh'] = float(row[9])

    print(f"Parsed {len(town_records)} official towns across Tamil Nadu from Table HL-11.")

    towns_list = []
    dist_counts = {}
    
    # Track index per district for clean spread of coordinates
    dist_town_idx = {}

    for code, t in town_records.items():
        hh = t['households']
        elec_pct = round((t['elec_hh'] / hh) * 100, 2) if hh and hh > 0 else None
        lat_pct = round((t['lat_hh'] / hh) * 100, 2) if hh and hh > 0 else None
        water_pct = round((t['water_treated_hh'] / hh) * 100, 2) if hh and hh > 0 else None

        district = t['district']
        dist_counts[district] = dist_counts.get(district, 0) + 1
        
        c_item = coimbatore_cache.get(code) or tiruppur_cache.get(code)
        
        # Standardize town name if in Tiruppur cache (e.g. Avanashi -> Avinashi)
        town_name = t['name']
        if code == '804021' or town_name.lower().startswith('avanashi'):
            town_name = 'Avinashi'
        elif c_item and c_item.get('name'):
            town_name = c_item.get('name')

        # Coordinates resolution
        lat, lng = None, None
        if c_item and c_item.get('lat') and c_item.get('lng'):
            lat = c_item.get('lat')
            lng = c_item.get('lng')
        elif code in coords_map:
            lat = coords_map[code][0]
            lng = coords_map[code][1]
        else:
            base_coords = DISTRICT_CENTROIDS.get(district, [11.0, 78.5])
            dist_town_idx[district] = dist_town_idx.get(district, 0) + 1
            idx = dist_town_idx[district]
            # Gentle spatial jitter within district boundary for distinct map markers
            angle = (idx * 137.5) * (3.14159 / 180.0)
            radius = 0.04 + (idx * 0.003)
            lat = round(base_coords[0] + (radius * 0.7 * (1 if idx % 2 == 0 else -1)), 4)
            lng = round(base_coords[1] + (radius * (1 if idx % 3 == 0 else -1)), 4)

        pop = c_item.get('pop') if c_item else (int(hh * 3.8) if hh else None)

        record = {
            'id': int(code) if code.isdigit() else code,
            'census_code': str(code),
            'name': town_name,
            'raw_name': t['raw_name'],
            'type': t['type'],
            'district': district,
            'state': 'Tamil Nadu',
            'pop': pop,
            'm': c_item.get('m') if c_item else None,
            'f': c_item.get('f') if c_item else None,
            'p06': c_item.get('p06') if c_item else None,
            'hh': int(hh) if hh is not None else None,
            'hl_hh': int(hh) if hh is not None else None,
            'lit': c_item.get('lit') if c_item else None,
            'ill': c_item.get('ill') if c_item else None,
            'work': c_item.get('work') if c_item else None,
            'elec': elec_pct,
            'water': water_pct,
            'lat_cov': lat_pct,
            'schools': c_item.get('schools') if c_item else None,
            'classrooms': c_item.get('classrooms') if c_item else None,
            'lat': lat,
            'lng': lng
        }
        towns_list.append(record)

    # Sort towns by population / households
    towns_list.sort(key=lambda x: (x.get('hh') or 0), reverse=True)

    with open(OUT_TOWNS_JSON, 'w', encoding='utf-8') as f:
        json.dump(towns_list, f, indent=2, ensure_ascii=False)
    print(f"Saved {len(towns_list)} towns to {OUT_TOWNS_JSON}")

    # Build CSV for backend
    csv_rows = []
    for t in towns_list:
        csv_rows.append({
            'census_code': t['census_code'],
            'name': t['name'],
            'raw_name': t['raw_name'],
            'location_type': t['type'],
            'district': t['district'],
            'state': 'Tamil Nadu',
            'households': t['hh'],
            'electricity_coverage_percent': t['elec'],
            'tap_water_coverage_percent': t['water'],
            'latrine_coverage_percent': t['lat_cov'],
            'lat': t['lat'],
            'lng': t['lng']
        })

    df_towns = pd.DataFrame(csv_rows)
    os.makedirs(os.path.dirname(OUT_BACKEND_TOWNS_CSV), exist_ok=True)
    df_towns.to_csv(OUT_BACKEND_TOWNS_CSV, index=False)
    print(f"Saved towns CSV to {OUT_BACKEND_TOWNS_CSV}")
    
    os.makedirs(os.path.dirname(OUT_FP_TOWNS_CSV), exist_ok=True)
    df_towns.to_csv(OUT_FP_TOWNS_CSV, index=False)
    print(f"Saved towns CSV to {OUT_FP_TOWNS_CSV}")

    # Process all 38 districts
    all_districts = sorted(list(set(list(base_dist_map.values()) + list(bifurcated_taluks.values()))))
    districts_data = []
    for d in all_districts:
        d_clean = 'Nilgiris' if d == 'The Nilgiris' else d
        c = DISTRICT_CENTROIDS.get(d_clean, [11.0, 78.5])
        towns_in_d = [t for t in towns_list if t['district'].lower() == d_clean.lower()]
        districts_data.append({
            'name': d_clean,
            'state': 'Tamil Nadu',
            'lat': c[0],
            'lng': c[1],
            'town_count': len(towns_in_d),
            'major_towns': [t['name'] for t in towns_in_d[:5]]
        })

    with open(OUT_DISTRICTS_JSON, 'w', encoding='utf-8') as f:
        json.dump(districts_data, f, indent=2, ensure_ascii=False)
    print(f"Saved {len(districts_data)} districts to {OUT_DISTRICTS_JSON}")

    # Process villages index from tamil_nadu_villages.csv
    print("Processing villages from", VILLAGES_SRC)
    villages_list = []
    if os.path.exists(VILLAGES_SRC):
        with open(VILLAGES_SRC, 'r', encoding='utf-8', errors='ignore') as f:
            reader = csv.DictReader(f)
            for row in reader:
                v_name = row.get('Village', '').strip()
                v_native = row.get('Village (Native)', '').strip()
                v_code = row.get('Village Code', '').strip()
                mandal = row.get('Mandal', '').strip()
                dist = row.get('District', '').strip()
                if dist == 'The Nilgiris':
                    dist = 'Nilgiris'
                pincode = row.get('Pincode', '').strip()

                if not v_name or not v_code:
                    continue

                c_item = coimbatore_cache.get(v_code) or tiruppur_cache.get(v_code)
                if not c_item and (v_code == '931950' or v_name.lower() == 'avinashi'):
                    c_item = tiruppur_cache.get('804021')

                pop = c_item.get('pop') if c_item else None
                hh = c_item.get('hh') if c_item else None

                # Coordinates lookup
                coords = coords_map.get(v_code)
                lat = coords[0] if coords else (c_item.get('lat') if c_item else None)
                lng = coords[1] if coords else (c_item.get('lng') if c_item else None)

                # Determine accurate location type
                loc_type = c_item.get('type') if c_item else 'Village'

                villages_list.append({
                    'id': int(v_code) if v_code.isdigit() else v_code,
                    'code': v_code,
                    'name': v_name,
                    'native_name': v_native if v_native else None,
                    'taluk': mandal,
                    'district': dist,
                    'pincode': pincode if pincode else None,
                    'type': loc_type,
                    'pop': pop,
                    'hh': hh,
                    'lat': lat,
                    'lng': lng
                })

    print(f"Parsed {len(villages_list)} official villages from statewide directory.")
    with open(OUT_VILLAGES_JSON, 'w', encoding='utf-8') as f:
        json.dump(villages_list, f, ensure_ascii=False)
    print(f"Saved {len(villages_list)} villages index to {OUT_VILLAGES_JSON}")

if __name__ == '__main__':
    main()
