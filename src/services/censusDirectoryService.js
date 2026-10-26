/**
 * =============================================================================
 * GramPulse AI - Statewide Tamil Nadu Census Directory Service
 * =============================================================================
 * Indexes authentic government data across all 38 districts of Tamil Nadu.
 * Primary sources:
 * 1. Census of India 2011 Primary Census Abstract (PCA)
 * 2. Census of India 2011 Table HL-11 (1,097 Urban Local Bodies across 38 districts)
 * 3. Ministry of Education UDISE+ School Directory
 * 4. Tamil Nadu Local Government Directory (18,710 Revenue Villages)
 *
 * Guarantees that GitHub Pages displays authentic government records for any
 * selected district and local body even during Render cold-starts or backend timeouts.
 * =============================================================================
 */

import COIMBATORE_RECORDS from '../data/coimbatoreCensusDirectory.json';
import TOWNS_RECORDS from '../data/tamilNaduTownsDirectory.json';
import DISTRICTS_DATA from '../data/tamilNaduDistricts.json';

const CODE_INDEX = new Map();
const NAME_INDEX = new Map();
const DISTRICT_INDEX = new Map();

function normalize(str) {
  return String(str || '')
    .toLowerCase()
    .replace(/\s+/g, '')
    .replace(/[^a-z0-9]/g, '');
}

/**
 * Expands compact record into rich village profile with indicators and census baseline
 */
function expandRecord(r) {
  if (!r) return null;

  const dist = r.district || 'Tamil Nadu';
  const locType = r.type || 'Village';

  const indicators = {
    total_population: {
      indicator: 'total_population',
      value: r.pop ?? null,
      unit: 'persons',
      data_status: r.pop != null ? 'HISTORICAL' : 'UNAVAILABLE',
      source: 'Census of India 2011 Primary Census Abstract',
      reference_year: 2011,
    },
    total_households: {
      indicator: 'total_households',
      value: r.hh ?? null,
      unit: 'households',
      data_status: r.hh != null ? 'HISTORICAL' : 'UNAVAILABLE',
      source: 'Census of India 2011 Table HL-11 / PCA',
      reference_year: 2011,
    },
    male_population: {
      indicator: 'male_population',
      value: r.m ?? null,
      unit: 'persons',
      data_status: r.m != null ? 'HISTORICAL' : 'UNAVAILABLE',
      source: 'Census 2011 PCA',
      reference_year: 2011,
    },
    female_population: {
      indicator: 'female_population',
      value: r.f ?? null,
      unit: 'persons',
      data_status: r.f != null ? 'HISTORICAL' : 'UNAVAILABLE',
      source: 'Census 2011 PCA',
      reference_year: 2011,
    },
    children_0_6: {
      indicator: 'children_0_6',
      value: r.p06 ?? null,
      unit: 'persons',
      data_status: r.p06 != null ? 'HISTORICAL' : 'UNAVAILABLE',
      source: 'Census 2011 PCA',
      reference_year: 2011,
    },
    literate_population: {
      indicator: 'literate_population',
      value: r.lit ?? null,
      unit: 'persons',
      data_status: r.lit != null ? 'HISTORICAL' : 'UNAVAILABLE',
      source: 'Census 2011 PCA',
      reference_year: 2011,
    },
    illiterate_population: {
      indicator: 'illiterate_population',
      value: r.ill ?? null,
      unit: 'persons',
      data_status: r.ill != null ? 'HISTORICAL' : 'UNAVAILABLE',
      source: 'Census 2011 PCA',
      reference_year: 2011,
    },
    total_workers: {
      indicator: 'total_workers',
      value: r.work ?? null,
      unit: 'persons',
      data_status: r.work != null ? 'HISTORICAL' : 'UNAVAILABLE',
      source: 'Census 2011 PCA',
      reference_year: 2011,
    },
    household_electricity_coverage: {
      indicator: 'household_electricity_coverage',
      value: r.elec ?? null,
      unit: 'percent',
      data_status: r.elec != null ? 'HISTORICAL' : 'UNAVAILABLE',
      source: 'Census of India 2011 Table HL-11',
      reference_year: 2011,
    },
    tap_water_coverage_percent: {
      indicator: 'tap_water_coverage_percent',
      value: r.water ?? null,
      unit: 'percent',
      data_status: r.water != null ? 'HISTORICAL' : 'UNAVAILABLE',
      source: 'Census of India 2011 Table HL-11',
      reference_year: 2011,
    },
    latrine_facility_coverage: {
      indicator: 'latrine_facility_coverage',
      value: r.lat_cov ?? null,
      unit: 'percent',
      data_status: r.lat_cov != null ? 'HISTORICAL' : 'UNAVAILABLE',
      source: 'Census of India 2011 Table HL-11',
      reference_year: 2011,
    },
    udise_school_count: {
      indicator: 'udise_school_count',
      value: r.schools ?? null,
      unit: 'schools',
      data_status: r.schools != null ? 'HISTORICAL' : 'UNAVAILABLE',
      source: 'Ministry of Education UDISE+ Directory',
      reference_year: 2024,
    },
    udise_total_classrooms: {
      indicator: 'udise_total_classrooms',
      value: r.classrooms ?? null,
      unit: 'classrooms',
      data_status: r.classrooms != null ? 'HISTORICAL' : 'UNAVAILABLE',
      source: 'Ministry of Education UDISE+ Directory',
      reference_year: 2024,
    },
  };

  return {
    gp_id: r.id,
    gp_code: `CENSUS-${r.id}`,
    gp_name: r.name,
    village_name: r.name,
    native_name: r.native_name || null,
    matched_location_name: r.raw_name || r.name,
    location_type: locType,
    district: dist,
    subdistrict_name: r.taluk || r.mandal || null,
    pincode: r.pincode || null,
    state: 'Tamil Nadu',
    census_code: String(r.id),
    lat: r.lat ?? null,
    lng: r.lng ?? null,
    population: r.pop ?? null,
    total_population: r.pop ?? null,
    male_population: r.m ?? null,
    female_population: r.f ?? null,
    children_0_6: r.p06 ?? null,
    households: r.hh ?? null,
    hl11_households: r.hl_hh ?? r.hh ?? null,
    electricity_coverage: r.elec ?? null,
    tap_water_coverage: r.water ?? null,
    latrine_coverage: r.lat_cov ?? null,
    schools: r.schools ?? null,
    school_classrooms_count: r.classrooms ?? null,
    literate_population: r.lit ?? null,
    illiterate_population: r.ill ?? null,
    total_workers: r.work ?? null,
    road_coverage_km: null,
    isOfficialData: true,
    tagline: `${r.name} (${locType}, ${dist})`,
    description: r.elec != null || r.pop != null
      ? `Authentic government records from Census 2011 Table HL-11/PCA and UDISE+ Directory.`
      : `Official Tamil Nadu administrative village. Indicators handled with strict data authenticity.`,
    indicators,
    census_baseline: {
      location_name: r.name,
      location_type: locType,
      year: 2011,
      population: r.pop ?? null,
      male_population: r.m ?? null,
      female_population: r.f ?? null,
      children_0_6: r.p06 ?? null,
      households: r.hh ?? null,
      hl11_households: r.hl_hh ?? r.hh ?? null,
      literate_population: r.lit ?? null,
      electricity_coverage_percent: r.elec ?? null,
      tap_water_coverage_percent: r.water ?? null,
      latrine_coverage_percent: r.lat_cov ?? null,
      district: dist,
    },
  };
}

// 1. Build synchronous index of Towns across all 38 districts + Coimbatore PCA records
const PRIMARY_RECORDS = [];
const seenPrimaryCodes = new Set();

// Add Coimbatore PCA records first (rich demographics + UDISE+)
for (const r of COIMBATORE_RECORDS) {
  const code = String(r.id);
  seenPrimaryCodes.add(code);
  const rec = { ...r, district: r.district || 'Coimbatore' };
  PRIMARY_RECORDS.push(rec);
  CODE_INDEX.set(code, rec);
  CODE_INDEX.set(Number(code), rec);

  const norm = normalize(r.name);
  NAME_INDEX.set(`coimbatore:${norm}`, rec);
  if (!NAME_INDEX.has(norm)) NAME_INDEX.set(norm, rec);

  const rawNorm = normalize(r.raw_name);
  if (rawNorm && !NAME_INDEX.has(rawNorm)) NAME_INDEX.set(rawNorm, rec);

  const dKey = 'coimbatore';
  if (!DISTRICT_INDEX.has(dKey)) DISTRICT_INDEX.set(dKey, []);
  DISTRICT_INDEX.get(dKey).push(rec);
}

// Add statewide towns from all 38 districts
for (const r of TOWNS_RECORDS) {
  const code = String(r.id);
  if (seenPrimaryCodes.has(code)) continue;
  seenPrimaryCodes.add(code);
  PRIMARY_RECORDS.push(r);
  CODE_INDEX.set(code, r);
  CODE_INDEX.set(Number(code), r);

  const dKey = normalize(r.district || 'Tamil Nadu');
  const norm = normalize(r.name);
  NAME_INDEX.set(`${dKey}:${norm}`, r);
  if (!NAME_INDEX.has(norm)) NAME_INDEX.set(norm, r);

  const rawNorm = normalize(r.raw_name);
  if (rawNorm && !NAME_INDEX.has(rawNorm)) NAME_INDEX.set(rawNorm, r);

  if (!DISTRICT_INDEX.has(dKey)) DISTRICT_INDEX.set(dKey, []);
  DISTRICT_INDEX.get(dKey).push(r);
}

const ALIASES = {
  chinniyampalayam: 'chinnampalayam',
  chinniyampalayamct: 'chinnampalayam',
  karamadaitp: 'karamadai',
  sirumugaitp: 'sirumugai',
  sulurtp: 'sulur',
  annurtp: 'annur',
  madukkaraitp: 'madukkarai',
};

// 2. Dynamic on-demand loader for 18,710 rural villages
let _villagesCache = null;
let _loadingVillagesPromise = null;

export async function ensureVillagesLoaded() {
  if (_villagesCache) return _villagesCache;
  if (_loadingVillagesPromise) return _loadingVillagesPromise;

  _loadingVillagesPromise = import('../data/tamilNaduVillagesIndex.json')
    .then((mod) => {
      const list = mod.default || mod || [];
      _villagesCache = list;
      // Index villages
      for (const v of list) {
        const code = String(v.id || v.code);
        if (!CODE_INDEX.has(code)) {
          CODE_INDEX.set(code, v);
          CODE_INDEX.set(Number(code), v);
        }
        const dKey = normalize(v.district);
        const norm = normalize(v.name);
        if (!NAME_INDEX.has(`${dKey}:${norm}`)) {
          NAME_INDEX.set(`${dKey}:${norm}`, v);
        }
      }
      return _villagesCache;
    })
    .catch((err) => {
      console.warn('Could not load statewide villages index:', err);
      _villagesCache = [];
      return _villagesCache;
    });

  return _loadingVillagesPromise;
}

/**
 * Returns list of all 38 official districts in Tamil Nadu
 */
export function getDistricts() {
  return DISTRICTS_DATA;
}

/**
 * Finds an authentic Census record by name or code with optional district filter.
 */
export function findCensusRecord(queryOrCode, districtFilter = null) {
  if (!queryOrCode) return null;

  const dKey = districtFilter ? normalize(districtFilter) : null;
  const isAllDistricts = !dKey || dKey === 'all' || dKey === 'alldistricts' || dKey === 'tamilnadu';

  // 1. Direct code lookup
  const cleanStr = String(queryOrCode).trim();
  const numericCode = cleanStr.replace(/^CENSUS-/i, '').trim();

  if (/^\d+$/.test(numericCode)) {
    if (CODE_INDEX.has(numericCode)) {
      const rec = CODE_INDEX.get(numericCode);
      if (isAllDistricts || normalize(rec.district) === dKey) {
        return expandRecord(rec);
      }
    }
  }

  // 2. Direct name match with district filter
  const norm = normalize(queryOrCode);
  if (!isAllDistricts) {
    const distScopedKey = `${dKey}:${norm}`;
    if (NAME_INDEX.has(distScopedKey)) {
      return expandRecord(NAME_INDEX.get(distScopedKey));
    }
  }

  if (NAME_INDEX.has(norm)) {
    const candidate = NAME_INDEX.get(norm);
    if (isAllDistricts || normalize(candidate.district) === dKey) {
      return expandRecord(candidate);
    }
  }

  // 3. Alias check
  if (ALIASES[norm]) {
    const aliasNorm = normalize(ALIASES[norm]);
    if (!isAllDistricts && NAME_INDEX.has(`${dKey}:${aliasNorm}`)) {
      return expandRecord(NAME_INDEX.get(`${dKey}:${aliasNorm}`));
    }
    if (NAME_INDEX.has(aliasNorm)) {
      return expandRecord(NAME_INDEX.get(aliasNorm));
    }
  }

  // 4. Substring search in district pool
  const pool = (!isAllDistricts && DISTRICT_INDEX.has(dKey))
    ? DISTRICT_INDEX.get(dKey)
    : PRIMARY_RECORDS;

  for (const r of pool) {
    const rNorm = normalize(r.name);
    const rawNorm = normalize(r.raw_name);
    if (rNorm === norm || rawNorm === norm || (norm.length >= 4 && (rNorm.includes(norm) || norm.includes(rNorm)))) {
      return expandRecord(r);
    }
  }

  // 5. Check villages cache if already loaded
  if (_villagesCache) {
    for (const v of _villagesCache) {
      if (!isAllDistricts && normalize(v.district) !== dKey) continue;
      const vNorm = normalize(v.name);
      if (vNorm === norm || (norm.length >= 4 && vNorm.includes(norm))) {
        return expandRecord(v);
      }
    }
  }

  return null;
}

/**
 * Returns key official local bodies across the specified district (or statewide)
 */
export function getTopCensusRecords(limit = 20, district = null) {
  const dKey = district ? normalize(district) : null;
  const isAllDistricts = !dKey || dKey === 'all' || dKey === 'alldistricts' || dKey === 'tamilnadu';

  let pool = isAllDistricts
    ? PRIMARY_RECORDS
    : (DISTRICT_INDEX.get(dKey) || PRIMARY_RECORDS.filter((r) => normalize(r.district) === dKey));

  if (!pool || pool.length === 0) {
    pool = PRIMARY_RECORDS;
  }

  const sorted = [...pool].sort((a, b) => ((b.pop || b.hh || 0) - (a.pop || a.hh || 0)));
  return sorted.slice(0, limit).map(expandRecord);
}

/**
 * Searches Census directory across all 38 districts with optional district filter
 */
export function searchCensusDirectory(query, districtFilter = null, limit = 15) {
  const cleanQuery = normalize(query);
  const rawQ = String(query || '').trim().toLowerCase();
  if (!cleanQuery && !rawQ) return [];

  const dKey = districtFilter ? normalize(districtFilter) : null;
  const isAllDistricts = !dKey || dKey === 'all' || dKey === 'alldistricts' || dKey === 'tamilnadu';

  // Trigger background lazy loading of villages on search
  ensureVillagesLoaded();

  const results = [];
  const seen = new Set();

  const pool = (!isAllDistricts && DISTRICT_INDEX.has(dKey))
    ? DISTRICT_INDEX.get(dKey)
    : PRIMARY_RECORDS;

  for (const r of pool) {
    if (!isAllDistricts && normalize(r.district) !== dKey) continue;
    const norm = normalize(r.name);
    const normRaw = normalize(r.raw_name);
    const codeStr = String(r.id);

    if (
      (norm.includes(cleanQuery) || normRaw.includes(cleanQuery) || codeStr.includes(cleanQuery)) &&
      !seen.has(r.id)
    ) {
      seen.add(r.id);
      results.push(expandRecord(r));
      if (results.length >= limit) return results;
    }
  }

  // If results not full, search villages cache if loaded
  if (results.length < limit && _villagesCache) {
    for (const v of _villagesCache) {
      if (!isAllDistricts && normalize(v.district) !== dKey) continue;
      const vNorm = normalize(v.name);
      const codeStr = String(v.id || v.code);
      const native = String(v.native_name || '').toLowerCase();

      if (
        (vNorm.includes(cleanQuery) || codeStr.includes(cleanQuery) || native.includes(rawQ)) &&
        !seen.has(v.id || v.code)
      ) {
        seen.add(v.id || v.code);
        results.push(expandRecord(v));
        if (results.length >= limit) break;
      }
    }
  }

  return results;
}

export function getAllCensusRecords(district = null) {
  return getTopCensusRecords(100, district);
}
