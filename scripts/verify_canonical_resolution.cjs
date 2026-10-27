const fs = require('fs');

const coimbatore = JSON.parse(fs.readFileSync('./src/data/coimbatoreCensusDirectory.json', 'utf8'));
const tiruppur = JSON.parse(fs.readFileSync('./src/data/tiruppurCensusDirectory.json', 'utf8'));
const towns = JSON.parse(fs.readFileSync('./src/data/tamilNaduTownsDirectory.json', 'utf8'));
const villages = JSON.parse(fs.readFileSync('./src/data/tamilNaduVillagesIndex.json', 'utf8'));

// Build unified lookup pools exactly matching censusDirectoryService.js
const ALL_PRIMARY = [...coimbatore, ...tiruppur, ...towns];
const CODE_INDEX = new Map();
const NAME_INDEX = new Map();
const DISTRICT_INDEX = new Map();

function normalize(str) {
  return String(str || '')
    .toLowerCase()
    .replace(/\s+/g, '')
    .replace(/[^a-z0-9]/g, '');
}

for (const r of ALL_PRIMARY) {
  const code = String(r.id);
  CODE_INDEX.set(code, r);
  CODE_INDEX.set(Number(code), r);
  const dKey = normalize(r.district || 'Tamil Nadu');
  NAME_INDEX.set(dKey + ':' + normalize(r.name), r);
  if (r.raw_name) NAME_INDEX.set(dKey + ':' + normalize(r.raw_name), r);
  if (!DISTRICT_INDEX.has(dKey)) DISTRICT_INDEX.set(dKey, []);
  DISTRICT_INDEX.get(dKey).push(r);
}

for (const v of villages) {
  const code = String(v.id || v.code);
  if (!CODE_INDEX.has(code)) {
    CODE_INDEX.set(code, v);
    CODE_INDEX.set(Number(code), v);
  }
  const dKey = normalize(v.district);
  const norm = normalize(v.name);
  if (!NAME_INDEX.has(dKey + ':' + norm)) {
    NAME_INDEX.set(dKey + ':' + norm, v);
  }
}

function haversineKm(lat1, lon1, lat2, lon2) {
  const R = 6371;
  const dLat = (lat2 - lat1) * Math.PI / 180;
  const dLon = (lon2 - lon1) * Math.PI / 180;
  const a = Math.sin(dLat/2) * Math.sin(dLat/2) +
            Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) *
            Math.sin(dLon/2) * Math.sin(dLon/2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
  return R * c;
}

function resolveCanonical(input, districtFilter = null) {
  if (!input) return null;
  const obj = typeof input === 'object' ? input : { name: input };
  const dist = obj.district || districtFilter;
  const dKey = dist ? normalize(dist) : null;
  const isAllDistricts = !dKey || dKey === 'all' || dKey === 'alldistricts' || dKey === 'tamilnadu';

  // 1. Census code
  const codeCandidates = [obj.census_code, obj.id, obj.gp_id].filter(c => c && /^\d{6,7}$/.test(String(c)) && !String(c).startsWith('9000') && Number(c) !== 9999);
  for (const c of codeCandidates) {
    const s = String(c);
    if (CODE_INDEX.has(s)) {
      const rec = CODE_INDEX.get(s);
      if (isAllDistricts || normalize(rec.district) === dKey) return rec;
    }
  }

  // 2. Name candidates
  const rawAddr = obj.rawAddress || obj.address || {};
  const nameCandidates = [
    obj.village_name,
    obj.village,
    obj.gp_name,
    obj.matched_location_name,
    obj.name,
    rawAddr.village,
    rawAddr.town,
    rawAddr.hamlet,
    rawAddr.suburb,
    rawAddr.municipality,
    rawAddr.city
  ].filter(Boolean);

  for (const n of nameCandidates) {
    const norm = normalize(n);
    if (!isAllDistricts && NAME_INDEX.has(dKey + ':' + norm)) {
      return NAME_INDEX.get(dKey + ':' + norm);
    }
    if (NAME_INDEX.has(norm)) {
      const cand = NAME_INDEX.get(norm);
      if (isAllDistricts || normalize(cand.district) === dKey) return cand;
    }
  }

  // 3. Substring match
  const pool = (!isAllDistricts && DISTRICT_INDEX.has(dKey))
    ? DISTRICT_INDEX.get(dKey)
    : ALL_PRIMARY;

  for (const n of nameCandidates) {
    const norm = normalize(n);
    if (norm.length >= 4) {
      for (const r of pool) {
        const rNorm = normalize(r.name);
        if (rNorm === norm || rNorm.includes(norm) || norm.includes(rNorm)) {
          return r;
        }
      }
    }
  }

  // 4. Spatial proximity
  const lat = obj.lat ?? obj.latitude;
  const lng = obj.lng ?? obj.longitude;
  if (lat != null && lng != null && !isNaN(lat) && !isNaN(lng)) {
    let best = null;
    let minScore = 8.0;

    for (const r of pool) {
      if (r.lat == null || r.lng == null) continue;
      const d = haversineKm(lat, lng, Number(r.lat), Number(r.lng));
      if (d <= minScore) {
        let score = d;
        const rNorm = normalize(r.name);
        for (const n of nameCandidates) {
          if (rNorm.includes(normalize(n)) || normalize(n).includes(rNorm)) {
            score -= 4.0;
            break;
          }
        }
        if (score < minScore) {
          best = r;
          minScore = score;
        }
      }
    }
    if (best) return best;
  }

  return null;
}

// Search simulation
function searchDirectory(query, districtFilter) {
  const clean = normalize(query);
  const dKey = districtFilter ? normalize(districtFilter) : null;
  const pool = DISTRICT_INDEX.get(dKey) || ALL_PRIMARY;
  const results = [];
  for (const r of pool) {
    if (dKey && normalize(r.district) !== dKey) continue;
    if (normalize(r.name).includes(clean) || String(r.id).includes(clean)) {
      results.push(r);
    }
  }
  results.sort((a, b) => ((b.pop || b.population || 0) - (a.pop || a.population || 0)));
  return results;
}

const testLocations = [
  {
    name: 'Chinniyampalayam',
    district: 'Coimbatore',
    coords: { lat: 11.0267, lng: 77.0617 },
    rawAddress: { suburb: 'Chinniyampalayam', road: 'Avinashi Road', county: 'Coimbatore South' }
  },
  {
    name: 'Karamadai',
    district: 'Coimbatore',
    coords: { lat: 11.2428, lng: 76.9587 },
    rawAddress: { town: 'Karamadai', road: 'Mettupalayam Road', county: 'Mettupalayam' }
  },
  {
    name: 'Sulur',
    district: 'Coimbatore',
    coords: { lat: 11.0244, lng: 77.1264 },
    rawAddress: { town: 'Sulur', county: 'Sulur' }
  },
  {
    name: 'Avinashi',
    district: 'Tiruppur',
    coords: { lat: 11.0574, lng: 77.2681 },
    rawAddress: { town: 'Avinashi', county: 'Avinashi' }
  },
  {
    name: 'Kuppandampalayam',
    district: 'Tiruppur',
    coords: { lat: 11.1932, lng: 77.2694 },
    rawAddress: { village: 'Kuppandampalayam', county: 'Avinashi' }
  },
  {
    name: 'Sevur',
    district: 'Tiruppur',
    coords: { lat: 11.1932, lng: 77.2694 },
    rawAddress: { village: 'Sevur', county: 'Avinashi' }
  },
  {
    name: 'Kundadam',
    district: 'Tiruppur',
    coords: { lat: 10.8506, lng: 77.4462 },
    rawAddress: { village: 'Kundadam', county: 'Dharapuram' }
  },
  {
    name: 'Pongalur',
    district: 'Tiruppur',
    coords: { lat: 10.9994, lng: 77.2789 },
    rawAddress: { village: 'Pongalur', county: 'Palladam' }
  },
  {
    name: 'Alanganallur',
    district: 'Madurai',
    coords: { lat: 10.0463, lng: 78.0939 },
    rawAddress: { town: 'Alanganallur', county: 'Vadipatti' }
  },
  {
    name: 'Omalur',
    district: 'Salem',
    coords: { lat: 11.7417, lng: 78.0417 },
    rawAddress: { town: 'Omalur', county: 'Omalur' }
  },
  {
    name: 'Thiruvaiyaru',
    district: 'Thanjavur',
    coords: { lat: 10.8833, lng: 79.1000 },
    rawAddress: { town: 'Thiruvaiyaru', county: 'Thiruvaiyaru' }
  }
];

console.log('========================================================================================');
console.log('TESTING THREE SELECTION PATHS: A) QUICK HABITATION | B) SEARCH | C) DIRECT MAP CLICK');
console.log('========================================================================================\n');

let allPassed = true;

for (const t of testLocations) {
  // Path A: Quick Habitation
  const quickRec = resolveCanonical({ name: t.name, district: t.district }, t.district);

  // Path B: Search
  const searchResults = searchDirectory(t.name, t.district);
  const searchRec = searchResults.length > 0 ? searchResults[0] : null;

  // Path C: Map Click with landmark/road and rawAddress
  const mapClickInput = {
    gp_id: 9999,
    gp_code: 'GP-PIN-MANUAL',
    gp_name: t.rawAddress.road || t.name,
    district: t.district,
    lat: t.coords.lat,
    lng: t.coords.lng,
    rawAddress: t.rawAddress,
    isManualPin: true
  };
  const mapRec = resolveCanonical(mapClickInput, t.district);

  const qCode = quickRec?.census_code || quickRec?.id;
  const sCode = searchRec?.census_code || searchRec?.id;
  const mCode = mapRec?.census_code || mapRec?.id;

  const qPop = quickRec?.pop || quickRec?.population;
  const sPop = searchRec?.pop || searchRec?.population;
  const mPop = mapRec?.pop || mapRec?.population;

  const qHh = quickRec?.hh || quickRec?.households;
  const sHh = searchRec?.hh || searchRec?.households;
  const mHh = mapRec?.hh || mapRec?.households;

  const qSchools = quickRec?.schools || quickRec?.sch;
  const sSchools = searchRec?.schools || searchRec?.sch;
  const mSchools = mapRec?.schools || mapRec?.sch;

  console.log(`>>> Location: ${t.name} (${t.district})`);
  console.log(`  Path A (Quick):  Code=${qCode}, Pop=${qPop}, HH=${qHh}, Schools=${qSchools || 'N/A'}`);
  console.log(`  Path B (Search): Code=${sCode}, Pop=${sPop}, HH=${sHh}, Schools=${sSchools || 'N/A'}`);
  console.log(`  Path C (Map):    Code=${mCode}, Pop=${mPop}, HH=${mHh}, Schools=${mSchools || 'N/A'}`);

  const codeMatch = qCode && String(qCode) === String(sCode) && String(sCode) === String(mCode);
  const popMatch = qPop != null && qPop === sPop && sPop === mPop;
  const hhMatch = qHh != null && qHh === sHh && sHh === mHh;

  if (codeMatch && popMatch && hhMatch) {
    console.log(`  RESULT: PASS (All 3 paths resolve to exact same authentic Census record)\n`);
  } else {
    console.log(`  RESULT: FAIL (Inconsistency detected!)\n`);
    allPassed = false;
  }
}

if (allPassed) {
  console.log('========================================================================================');
  console.log('SUCCESS: ALL 8 REQUIRED LOCATIONS RESOLVE IDENTICALLY ACROSS ALL 3 SELECTION MODES!');
  console.log('========================================================================================');
} else {
  console.error('FAILURES DETECTED IN LOCATION RESOLUTION!');
  process.exit(1);
}
