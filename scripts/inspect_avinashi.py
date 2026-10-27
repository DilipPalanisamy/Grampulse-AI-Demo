import pandas as pd
import sys
sys.stdout.reconfigure(encoding='utf-8')

df = pd.read_csv('backend/data/processed/tamil_nadu_villages.csv')
av = df[df['Mandal'].astype(str).str.lower().str.contains('avinashi|avanashi', na=False)]
print(f"Total entries in Avinashi Mandal: {len(av)}")
for idx, r in av.iterrows():
    print(f"{r['Village Code']} | {r['Village']} | {r['Village (Native)']} | {r['Pincode']}")
