/**
 * =============================================================================
 * GramPulse AI - Census Directory Service (Client-Side Resilient Government Data)
 * =============================================================================
 * Indexes all official Census 2011 and UDISE+ records for local bodies in
 * Coimbatore district. Guarantees that GitHub Pages displays authentic
 * government data even during Render cold-starts or backend timeouts.
 * =============================================================================
 */

import COMPACT_RECORDS from '../data/coimbatoreCensusDirectory.json';

const NAME_INDEX = new Map();
const CODE_INDEX = new Map();

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

  const indicators = {
    total_population: {
      indicator: 'total_population',
      value: r.pop,
      unit: 'persons',
      data_status: 'HISTORICAL',
      source: 'Census of India 2011 Primary Census Abstract',
      reference_year: 2011,
    },
    total_households: {
      indicator: 'total_households',
      value: r.hh,
      unit: 'households',
      data_status: 'HISTORICAL',
      source: 'Census of India 2011 Primary Census Abstract',
      reference_year: 2011,
    },
    male_population: {
      indicator: 'male_population',
      value: r.m,
      unit: 'persons',
      data_status: 'HISTORICAL',
      source: 'Census 2011 PCA',
      reference_year: 2011,
    },
    female_population: {
      indicator: 'female_population',
      value: r.f,
      unit: 'persons',
      data_status: 'HISTORICAL',
      source: 'Census 2011 PCA',
      reference_year: 2011,
    },
    children_0_6: {
      indicator: 'children_0_6',
      value: r.p06,
      unit: 'persons',
      data_status: 'HISTORICAL',
      source: 'Census 2011 PCA',
      reference_year: 2011,
    },
    literate_population: {
      indicator: 'literate_population',
      value: r.lit,
      unit: 'persons',
      data_status: 'HISTORICAL',
      source: 'Census 2011 PCA',
      reference_year: 2011,
    },
    illiterate_population: {
      indicator: 'illiterate_population',
      value: r.ill,
      unit: 'persons',
      data_status: 'HISTORICAL',
      source: 'Census 2011 PCA',
      reference_year: 2011,
    },
    total_workers: {
      indicator: 'total_workers',
      value: r.work,
      unit: 'persons',
      data_status: 'HISTORICAL',
      source: 'Census 2011 PCA',
      reference_year: 2011,
    },
    household_electricity_coverage: {
      indicator: 'household_electricity_coverage',
      value: r.elec,
      unit: 'percent',
      data_status: r.elec != null ? 'HISTORICAL' : 'UNAVAILABLE',
      source: 'Census of India 2011 Table HL-11',
      reference_year: 2011,
    },
    tap_water_coverage_percent: {
      indicator: 'tap_water_coverage_percent',
      value: r.water,
      unit: 'percent',
      data_status: r.water != null ? 'HISTORICAL' : 'UNAVAILABLE',
      source: 'Census of India 2011 Table HL-11',
      reference_year: 2011,
    },
    latrine_facility_coverage: {
      indicator: 'latrine_facility_coverage',
      value: r.lat_cov,
      unit: 'percent',
      data_status: r.lat_cov != null ? 'HISTORICAL' : 'UNAVAILABLE',
      source: 'Census of India 2011 Table HL-11',
      reference_year: 2011,
    },
    udise_school_count: {
      indicator: 'udise_school_count',
      value: r.schools,
      unit: 'schools',
      data_status: [644405, 803962, 803960].includes(r.id) ? 'VERIFIED' : 'HISTORICAL',
      source: 'Ministry of Education UDISE+ Directory',
      reference_year: 2024,
    },
    udise_total_classrooms: {
      indicator: 'udise_total_classrooms',
      value: r.classrooms,
      unit: 'classrooms',
      data_status: [644405, 803962, 803960].includes(r.id) ? 'VERIFIED' : 'HISTORICAL',
      source: 'Ministry of Education UDISE+ Directory',
      reference_year: 2024,
    },
  };

  return {
    gp_id: r.id,
    gp_code: `CENSUS-${r.id}`,
    gp_name: r.name,
    village_name: r.name,
    matched_location_name: r.raw_name || r.name,
    location_type: r.type,
    district: 'Coimbatore',
    state: 'Tamil Nadu',
    census_code: String(r.id),
    lat: r.lat,
    lng: r.lng,
    population: r.pop,
    total_population: r.pop,
    male_population: r.m,
    female_population: r.f,
    children_0_6: r.p06,
    households: r.hh,
    hl11_households: r.hl_hh,
    electricity_coverage: r.elec,
    tap_water_coverage: r.water,
    latrine_coverage: r.lat_cov,
    schools: r.schools,
    school_classrooms_count: r.classrooms,
    literate_population: r.lit,
    illiterate_population: r.ill,
    total_workers: r.work,
    road_coverage_km: null,
    isOfficialData: true,
    tagline: `${r.name} (${r.type}, Coimbatore)`,
    description: `Authentic government records from Census 2011, Table HL-11, and Ministry of Education UDISE+ directory.`,
    indicators,
    census_baseline: {
      location_name: r.name,
      location_type: r.type,
      year: 2011,
      population: r.pop,
      male_population: r.m,
      female_population: r.f,
      children_0_6: r.p06,
      households: r.hh,
      hl11_households: r.hl_hh,
      literate_population: r.lit,
      electricity_coverage_percent: r.elec,
      tap_water_coverage_percent: r.water,
      latrine_coverage_percent: r.lat_cov,
    },
  };
}

// Build indexes
for (const r of COMPACT_RECORDS) {
  CODE_INDEX.set(String(r.id), r);
  CODE_INDEX.set(Number(r.id), r);

  const normName = normalize(r.name);
  NAME_INDEX.set(normName, r);

  const normRaw = normalize(r.raw_name);
  if (normRaw && !NAME_INDEX.has(normRaw)) {
    NAME_INDEX.set(normRaw, r);
  }
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

/**
 * Finds an authentic Census record by name or code.
 */
export function findCensusRecord(queryOrCode) {
  if (!queryOrCode) return null;

  // 1. Direct code lookup
  if (typeof queryOrCode === 'number' || /^\d+$/.test(String(queryOrCode).trim())) {
    const code = String(queryOrCode).trim();
    if (CODE_INDEX.has(code)) {
      return expandRecord(CODE_INDEX.get(code));
    }
  }

  // 2. Direct name match
  const norm = normalize(queryOrCode);
  if (NAME_INDEX.has(norm)) {
    return expandRecord(NAME_INDEX.get(norm));
  }

  // 3. Alias check
  if (ALIASES[norm]) {
    const aliasNorm = normalize(ALIASES[norm]);
    if (NAME_INDEX.has(aliasNorm)) {
      return expandRecord(NAME_INDEX.get(aliasNorm));
    }
  }

  // 4. Substring / Prefix match
  for (const [key, r] of NAME_INDEX.entries()) {
    if (key.length >= 4 && (norm.startsWith(key) || key.startsWith(norm) || norm.includes(key))) {
      return expandRecord(r);
    }
  }

  return null;
}

/**
 * Searches Census directory for autocompletion / search queries
 */
export function searchCensusDirectory(query, limit = 15) {
  const cleanQuery = normalize(query);
  if (!cleanQuery) return [];

  const results = [];
  const seen = new Set();

  for (const r of COMPACT_RECORDS) {
    const norm = normalize(r.name);
    if (norm.includes(cleanQuery) && !seen.has(r.id)) {
      seen.add(r.id);
      results.push({
        gp_id: r.id,
        gp_code: `CENSUS-${r.id}`,
        gp_name: r.name,
        village_name: r.name,
        district: 'Coimbatore',
        state: 'Tamil Nadu',
        location_type: r.type,
        census_code: String(r.id),
        population: r.pop,
        households: r.hh,
        lat: r.lat,
        lng: r.lng,
        isOfficialData: true,
        tagline: `${r.name} (${r.type}, Coimbatore)`,
      });
      if (results.length >= limit) break;
    }
  }

  return results;
}
