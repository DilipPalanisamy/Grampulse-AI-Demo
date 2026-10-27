import openpyxl

wb = openpyxl.load_workbook('GramPulse-FuturePredictor/backend/data/raw/DDW_PCA3332_2011_MDDS with UI.xlsx', read_only=True)
sheet = wb.active

subdistts = {}
for i, row in enumerate(sheet.iter_rows(values_only=True)):
    if i == 0: continue
    level = row[6]
    sd = row[2]
    name = row[7]
    if level == 'SUB-DISTRICT':
        subdistts[sd] = {'name': name, 'villages': 0, 'towns': 0}
    elif level == 'VILLAGE' and sd in subdistts:
        subdistts[sd]['villages'] += 1
    elif level == 'TOWN' and sd in subdistts:
        subdistts[sd]['towns'] += 1

print('Subdistricts in Tiruppur PCA:')
for sd, d in subdistts.items():
    print(f"{sd} | {d['name']} | Villages: {d['villages']} | Towns: {d['towns']}")
