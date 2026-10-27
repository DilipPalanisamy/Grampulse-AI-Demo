import sys, os
sys.path.insert(0, os.path.abspath('GramPulse-FuturePredictor/backend'))
from census_service import get_census_baseline, search_census_locations

test_queries = [
  ('Avinashi', 'Tiruppur'),
  ('931950', 'Tiruppur'),
  ('804021', 'Tiruppur'),
  ('Alathur', 'Tiruppur'),
  ('Karavalur', 'Tiruppur'),
  ('Palangarai', 'Tiruppur'),
  ('Perumanallur', 'Tiruppur'),
  ('Pongalur', 'Tiruppur'),
  ('Kangeyam', 'Tiruppur'),
  ('Dharapuram', 'Tiruppur'),
  ('Udumalaipettai', 'Tiruppur'),
  ('Madathukulam', 'Tiruppur'),
  ('Kaniyur', 'Tiruppur')
]

print("=== TESTING BACKEND CENSUS BASELINE ===")
for q, dist in test_queries:
    b = get_census_baseline(q, dist)
    if b:
        print(f"SUCCESS: '{q}' -> {b['location_name']} ({b['location_type']}, {b['district']}) | Census: {b['census_code']} | Pop: {b['population']} | HH: {b['households']} | Elec: {b['electricity_coverage_percent']} | Water: {b['tap_water_coverage_percent']}")
    else:
        print(f"FAILED: '{q}' not found")

print("\n=== TESTING BACKEND SEARCH 'Avinashi' IN TIRUPPUR ===")
res = search_census_locations('Avinashi', 'Tiruppur', limit=5)
for r in res:
    print(f"{r['census_code']} | {r['name']} ({r['level']}) | Pop: {r['population']} | HH: {r['households']}")

print("\n=== TESTING BACKEND SEARCH 'Alathur' IN TIRUPPUR ===")
res2 = search_census_locations('Alathur', 'Tiruppur', limit=5)
for r in res2:
    print(f"{r['census_code']} | {r['name']} ({r['level']}) | Pop: {r['population']} | HH: {r['households']}")
