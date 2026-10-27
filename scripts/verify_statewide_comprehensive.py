import requests
import json

BASE_URL = "http://127.0.0.1:8000"

def test_location(query, dist=None, expected_type=None):
    params = {"query": query}
    if dist:
        params["district"] = dist
    resp = requests.get(f"{BASE_URL}/census/baseline", params=params)
    if resp.status_code != 200:
        print(f"[-] {query} ({dist}) -> HTTP {resp.status_code}: {resp.text}")
        return None
    data = resp.json()
    b = data.get("baseline", {})
    source = b.get("data_source", "")
    pop = b.get("population")
    hh = b.get("households")
    elec = b.get("electricity_coverage_percent")
    water = b.get("tap_water_coverage_percent")
    latrine = b.get("latrine_coverage_percent")
    name = b.get("location_name")
    code = b.get("census_code")
    lvl = b.get("location_type")
    
    print(f"[+] {name} [{lvl}] (Code: {code}, Dist: {dist or 'auto'}): Pop={pop}, HH={hh}, Elec={elec}, Water={water}, Latrine={latrine} | Source: {source[:40]}")
    return b

print("=== 1. TIRUPPUR: AVINASHI TALUK ===")
test_location("Avinashi", "Tiruppur")
test_location("Alathur", "Tiruppur")
test_location("Karavalur", "Tiruppur")
test_location("Palangarai", "Tiruppur")
test_location("Perumanallur", "Tiruppur")
test_location("Pongalur", "Tiruppur")
test_location("Kanur", "Tiruppur")
test_location("Ramanathapuram", "Tiruppur")
test_location("Sevur", "Tiruppur")
test_location("Thathanur", "Tiruppur")
test_location("Thekkalur", "Tiruppur")
test_location("Kuppandampalayam", "Tiruppur")

print("\n=== 2. TIRUPPUR: OTHER TALUKS & URBAN BODIES ===")
test_location("Dharapuram", "Tiruppur")
test_location("Kangeyam", "Tiruppur")
test_location("Palladam", "Tiruppur")
test_location("Udumalaipettai", "Tiruppur")
test_location("Madathukulam", "Tiruppur")
test_location("Kaniyur", "Tiruppur")
test_location("Komaralingam", "Tiruppur")
test_location("Muthur", "Tiruppur")
test_location("Vellakoil", "Tiruppur")
test_location("Tiruppur", "Tiruppur")

print("\n=== 3. COIMBATORE LOCATIONS ===")
test_location("Chinniyampalayam", "Coimbatore")
test_location("Karamadai", "Coimbatore")
test_location("Sirumugai", "Coimbatore")
test_location("Sulur", "Coimbatore")
test_location("Annur", "Coimbatore")
test_location("Madukkarai", "Coimbatore")
test_location("Odanthurai", "Coimbatore")
test_location("Tholampalayam", "Coimbatore")

print("\n=== 4. OTHER TN DISTRICTS ===")
test_location("Chennai")
test_location("Madurai")
test_location("Salem")
test_location("Erode")
test_location("Tiruchirappalli")
