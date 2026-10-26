import sys
sys.path.insert(0, r'GramPulse-FuturePredictor\backend')
from census_service import search_census_locations, get_census_baseline
from village_data_service import get_village_government_data

test_queries = [
    ('Chinniyampalayam', 'Coimbatore'),
    ('Karamadai', 'Coimbatore'),
    ('Melur', 'Madurai'),
    ('Avinashi', 'Tiruppur'),
    ('Attur', 'Salem'),
    ('Bhavani', 'Erode'),
    ('Manapparai', 'Tiruchirappalli'),
    ('Kumbakonam', 'Thanjavur'),
    ('Ambasamudram', 'Tirunelveli'),
    ('Coonoor', 'Nilgiris'),
]

print('=== TESTING STATEWIDE SEARCH & DATA LOOKUP ===')
for q, dist in test_queries:
    search_res = search_census_locations(q, district=dist, limit=5)
    baseline = get_census_baseline(q, district_name=dist)
    gov_data = get_village_government_data(q, district_name=dist)
    top = search_res[0] if search_res else {}
    print(f"\n--- Location: {q} ({dist}) ---")
    print(f"Top match: {top.get('name')} ({top.get('level')}, {top.get('district')}) [Census: {top.get('census_code')}]")
    print(f"Baseline: HH={baseline.get('households') if baseline else 'None'}, Elec={baseline.get('electricity_coverage_percent') if baseline else 'None'}%, Water={baseline.get('tap_water_coverage_percent') if baseline else 'None'}%, Latrine={baseline.get('latrine_coverage_percent') if baseline else 'None'}%")
    print(f"Gov Data: matched={gov_data.get('matched_location_name')}, dist={gov_data.get('district')}, inds={gov_data.get('data_summary', {}).get('total_indicators')}")
