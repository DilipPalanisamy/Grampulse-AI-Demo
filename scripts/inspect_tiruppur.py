import pandas as pd
import json

df = pd.read_csv('backend/data/processed/tamil_nadu_towns_hl11.csv')
t = df[df['district'].str.lower().str.contains('tiruppur', na=False)]
print(f"Total towns/ULBs in Tiruppur: {len(t)}")
for idx, r in t.iterrows():
    print(f"{r['census_code']} | {r['name']} | {r['raw_name']} | {r['location_type']} | HH: {r['households']}")

with open('src/data/tamilNaduTownsDirectory.json', 'r', encoding='utf-8') as f:
    towns_json = json.load(f)
t_json = [x for x in towns_json if 'tiruppur' in str(x.get('district', '')).lower()]
print(f"\nTotal Tiruppur entries in tamilNaduTownsDirectory.json: {len(t_json)}")
for x in t_json[:15]:
    print(f"{x.get('id')} | {x.get('name')} | {x.get('type')} | HH: {x.get('hh')}")
