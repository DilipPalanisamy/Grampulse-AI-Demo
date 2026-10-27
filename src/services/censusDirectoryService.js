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
import TIRUPPUR_RECORDS from '../data/tiruppurCensusDirectory.json';
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

// 1. Build synchronous index of Towns across all 38 districts + Coimbatore & Tiruppur PCA records
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

// Add Tiruppur PCA records (rich demographics, ULBs + 297 rural Panchayats)
for (const r of TIRUPPUR_RECORDS) {
  const code = String(r.id);
  seenPrimaryCodes.add(code);
  const rec = { ...r, district: 'Tiruppur' };
  PRIMARY_RECORDS.push(rec);
  CODE_INDEX.set(code, rec);
  CODE_INDEX.set(Number(code), rec);

  const norm = normalize(r.name);
  NAME_INDEX.set(`tiruppur:${norm}`, rec);
  if (!NAME_INDEX.has(norm)) NAME_INDEX.set(norm, rec);

  const rawNorm = normalize(r.raw_name);
  if (rawNorm) {
    NAME_INDEX.set(`tiruppur:${rawNorm}`, rec);
    if (!NAME_INDEX.has(rawNorm)) NAME_INDEX.set(rawNorm, rec);
  }

  const dKey = 'tiruppur';
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
  avinashi: 'avanashi',
  avinashitp: 'avanashi',
  avanashitp: 'avanashi',
  avanashi: 'avinashi',
  tirupur: 'tiruppur',
  udumalaipet: 'udumalaipettai',
  udumalpet: 'udumalaipettai',
  azhakumalai: 'alagumalai',
  kandiyankovil: 'kandiankoil',
  nerupperichal: 'neripperichal',
  velamapalayam: 'velampalayam',
  kundadam: 'kundadam',
  pappankulam: 'papankulam',
  kannadiputhur: 'agraharakannadiputhur',

  // Local Government Directory (LGD) to Census identifiers mapping
  '931808': '644796', // Andipalayam -> Census Town 644796
  '931809': '644787', // Azhakumalai -> Alagumalai Gram Panchayat 644787
  '931810': '644797', // Iduvai -> Census Town 644797
  '931811': '644788', // Kandiyankovil -> Kandiankoil Gram Panchayat 644788
  '931813': '644799', // Muthanampalayam -> Census Town 644799
  '931814': '644798', // Muruganpalayam -> Census Town 644798
  '931815': '804025', // Nallur -> S.Nallur Municipality 804025
  '931817': '644786', // Perumthozhuvu -> North Avanashipalayam Gram Panchayat 644786
  '931820': '804026', // Tiruppur -> Municipal Corporation 804026
  '931821': '644784', // Ugayanur -> Gram Panchayat 644784
  '931822': '644800', // Veerapandi -> Census Town 644800
  '931826': '644800', // Veerapandi -> Census Town 644800
  '931827': '804027', // Samalapuram -> Town Panchayat 804027
  '931830': '644792', // Chettipalayam -> Census Town 644792
  '931833': '644795', // Mannarai -> Census Town 644795
  '931834': '644791', // Neripperichal -> Census Town 644791
  '931835': '804011', // Chinna Muthur -> Muthur Town Panchayat 804011
  '931836': '644793', // Thottipalayam -> Census Town 644793
  '931837': '804024', // Velampalayam -> Municipality 804024
  '931838': '644791', // Nerupperichal -> Neripperichal Census Town 644791
  '931842': '804012', // Kangeyam -> Town Panchayat 804012
  '931844': '644793', // Thottipalayam -> Census Town 644793
  '931846': '804024', // Velamapalayam -> Velampalayam Municipality 804024
  '931849': '804011', // Muthur -> Town Panchayat 804011
  '931853': '804013', // Vellakoil -> Municipality 804013
  '931856': '644618', // Udaiam -> Vadasinnaripalayam Gram Panchayat 644618
  '931858': '804013', // Vellakoil -> Municipality 804013
  '931868': '644862', // Alampalayam -> Gram Panchayat 644862
  '931870': '644682', // Chelampalayam -> Chitravathanpalayam Gram Panchayat 644682
  '931871': '804019', // Chinnakkampalayam -> Town Panchayat 804019
  '931873': '644617', // Kangayampalayam -> Gram Panchayat 644617
  '931874': '804015', // Kannivadi -> Town Panchayat 804015
  '931875': '804017', // Kolathupalayam -> Town Panchayat 804017
  '931876': '931876', // Kundadam -> Kundadam Gram Panchayat 931876
  '931877': '804016', // Mulanur -> Town Panchayat 804016
  '931878': '644641', // Vellavavipudur -> Thurambadi Gram Panchayat 644641
  '931879': '804014', // Rudravathi -> Town Panchayat 804014
  '931902': '804030', // Dhali -> Town Panchayat 804030
  '931907': '804029', // Udumalaipettai -> Municipality 804029
  '931908': '644841', // Andigoundanur 2 -> Andigoundanur Gram Panchayat 644841
  '931913': '644883', // Periakottai -> Census Town 644883
  '931914': '644882', // Samathur -> Census Town / GP 644882
  '931918': '644837', // Agraharakannadiputhur -> Kannadiputhur Gram Panchayat 644837
  '931920': '804031', // Kaniyur -> Town Panchayat 804031
  '931921': '804033', // Komaralingam East -> Komaralingam Town Panchayat 804033
  '931922': '804033', // Komaralingam West -> Komaralingam Town Panchayat 804033
  '931923': '804034', // Sankaramanallur North -> Town Panchayat 804034
  '931924': '804034', // Sankaramanallur South -> Town Panchayat 804034
  '931925': '644837', // Sarkarkannadiputhur -> Kannadiputhur Gram Panchayat 644837
  '931930': '804020', // Kunnathur -> Town Panchayat 804020
  '931932': '644881', // Poolankulam -> Poolankinar CT 644881
  '931933': '804023', // Punjai Uthukuli -> Uthukuli Town Panchayat 804023
  '931934': '644785', // Rackiyapalayam -> Rakkiyapalayam Gram Panchayat 644785
  '931950': '804021', // Avinashi -> Town Panchayat 804021
  '931952': '804020', // Kunnathur -> Town Panchayat 804020
  '931955': '644774', // Palangarai -> Census Town 644774
  '931956': '644773', // Perumanallur -> Census Town 644773
  '931957': '644785', // Rakkiyampalayam -> Rakkiyapalayam Gram Panchayat 644785
  '931959': '644775', // Sembianallur -> Census Town 644775
  '931962': '804022', // Thirumuruganpoondi -> Town Panchayat 804022
  '931963': '804023', // Uthukuli -> Town Panchayat 804023
  '931964': '644776', // Velayudampalayam -> Census Town 644776
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

// Immediately start loading statewide rural villages in the background
ensureVillagesLoaded();

/**
 * Returns list of all 38 official districts in Tamil Nadu
 */
export function getDistricts() {
  return DISTRICTS_DATA;
}

/**
/**
 * Calculates geodesic distance between two coordinate pairs in kilometers (Haversine formula)
 */
export function haversineDistanceKm(lat1, lon1, lat2, lon2) {
  const R = 6371;
  const dLat = ((lat2 - lat1) * Math.PI) / 180;
  const dLon = ((lon2 - lon1) * Math.PI) / 180;
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos((lat1 * Math.PI) / 180) *
      Math.cos((lat2 * Math.PI) / 180) *
      Math.sin(dLon / 2) *
      Math.sin(dLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c;
}

/**
 * Finds the nearest authentic Census settlement by coordinates within a maximum radius.
 */
export function findNearestCensusRecord(lat, lng, districtFilter = null, maxDistKm = 8.0, nameHint = null) {
  if (lat == null || lng == null || isNaN(Number(lat)) || isNaN(Number(lng))) return null;
  const numLat = Number(lat);
  const numLng = Number(lng);
  const dKey = districtFilter ? normalize(districtFilter) : null;
  const isAllDistricts = !dKey || dKey === 'all' || dKey === 'alldistricts' || dKey === 'tamilnadu';

  const pool = (!isAllDistricts && DISTRICT_INDEX.has(dKey))
    ? DISTRICT_INDEX.get(dKey)
    : PRIMARY_RECORDS;

  let best = null;
  let minScore = maxDistKm;

  // Search PRIMARY_RECORDS first (which has rich demographics and coordinates)
  for (const r of pool) {
    if (r.lat == null || r.lng == null) continue;
    const d = haversineDistanceKm(numLat, numLng, Number(r.lat), Number(r.lng));
    if (d <= maxDistKm) {
      let score = d;
      if (nameHint) {
        const hintNorm = normalize(nameHint);
        const rNorm = normalize(r.name);
        if (hintNorm.length >= 3 && (rNorm.includes(hintNorm) || hintNorm.includes(rNorm))) {
          score -= 4.0;
        }
      }
      if (!best || score < minScore) {
        best = r;
        minScore = score;
      }
    }
  }

  // Also check _villagesCache if available
  if (_villagesCache) {
    for (const v of _villagesCache) {
      if (v.lat == null || v.lng == null) continue;
      if (!isAllDistricts && normalize(v.district) !== dKey) continue;
      const d = haversineDistanceKm(numLat, numLng, Number(v.lat), Number(v.lng));
      if (d <= maxDistKm) {
        let score = d;
        if (nameHint) {
          const hintNorm = normalize(nameHint);
          const vNorm = normalize(v.name);
          if (hintNorm.length >= 3 && (vNorm.includes(hintNorm) || hintNorm.includes(vNorm))) {
            score -= 4.0;
          }
        }
        if (!best || score < minScore) {
          best = v;
          minScore = score;
        }
      }
    }
  }

  if (best) {
    const vCode = String(best.code || best.id);
    if (ALIASES[vCode] && CODE_INDEX.has(ALIASES[vCode])) {
      return expandRecord(CODE_INDEX.get(ALIASES[vCode]));
    }
    return expandRecord(best);
  }

  return null;
}

/**
 * Universal Canonical Location Resolver:
 * Consistently resolves a Census record regardless of whether selection originated
 * from Quick Habitations, Search bar autocomplete, or Direct Map clicks/pin drops.
 */
export function resolveCanonicalCensusRecord(input, districtFilter = null) {
  if (!input) return null;

  if (typeof input === 'string' || typeof input === 'number') {
    return findCensusRecord(input, districtFilter);
  }

  const obj = input;
  const dist = obj.district || districtFilter;
  const dKey = dist ? normalize(dist) : null;
  const isAllDistricts = !dKey || dKey === 'all' || dKey === 'alldistricts' || dKey === 'tamilnadu';

  // 1. Direct Census Code lookup (if 6-7 digit official code present)
  const codeVal = obj.census_code || (obj.gp_code ? String(obj.gp_code).replace(/^CENSUS-/i, '') : null);
  if (codeVal && /^\d{6,7}$/.test(String(codeVal))) {
    const match = findCensusRecord(codeVal, dist);
    if (match) return match;
  }

  // Also check obj.gp_id if it's an authentic census code (not synthetic 9000-99999)
  if (obj.gp_id && /^\d{6,7}$/.test(String(obj.gp_id)) && !String(obj.gp_id).startsWith('9000') && Number(obj.gp_id) !== 9999) {
    const match = findCensusRecord(obj.gp_id, dist);
    if (match) return match;
  }

  // 2. Name candidate matching with priority (village > town > hamlet > suburb > municipality > name)
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
    rawAddr.city,
  ].filter(Boolean);

  for (const nameCandidate of nameCandidates) {
    const match = findCensusRecord(nameCandidate, dist);
    if (match) return match;
  }

  // 3. Spatial coordinate proximity lookup (if coordinates available)
  const lat = obj.lat ?? obj.latitude;
  const lng = obj.lng ?? obj.lon ?? obj.longitude;
  if (lat != null && lng != null && !isNaN(Number(lat)) && !isNaN(Number(lng))) {
    const primaryName = nameCandidates[0] || null;
    const match = findNearestCensusRecord(lat, lng, dist, 8.0, primaryName);
    if (match) return match;
  }

  return null;
}

/**
 * Finds an authentic Census record by name or code with optional district filter.
 */
export function findCensusRecord(queryOrCode, districtFilter = null) {
  if (!queryOrCode) return null;

  if (typeof queryOrCode === 'object') {
    return resolveCanonicalCensusRecord(queryOrCode, districtFilter);
  }

  const dKey = districtFilter ? normalize(districtFilter) : null;
  const isAllDistricts = !dKey || dKey === 'all' || dKey === 'alldistricts' || dKey === 'tamilnadu';

  // 1. Direct code lookup
  const cleanStr = String(queryOrCode).trim();
  const numericCode = cleanStr.replace(/^CENSUS-/i, '').trim();

  if (/^\d+$/.test(numericCode)) {
    const targetCode = ALIASES[numericCode] || numericCode;
    if (CODE_INDEX.has(targetCode)) {
      const rec = CODE_INDEX.get(targetCode);
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
      const candidate = NAME_INDEX.get(distScopedKey);
      const candCode = String(candidate.id || candidate.code);
      if (ALIASES[candCode] && CODE_INDEX.has(ALIASES[candCode])) {
        return expandRecord(CODE_INDEX.get(ALIASES[candCode]));
      }
      return expandRecord(candidate);
    }
  }

  if (NAME_INDEX.has(norm)) {
    const candidate = NAME_INDEX.get(norm);
    if (isAllDistricts || normalize(candidate.district) === dKey) {
      const candCode = String(candidate.id || candidate.code);
      if (ALIASES[candCode] && CODE_INDEX.has(ALIASES[candCode])) {
        return expandRecord(CODE_INDEX.get(ALIASES[candCode]));
      }
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

  let bestSubMatch = null;
  for (const r of pool) {
    const rNorm = normalize(r.name);
    const rawNorm = normalize(r.raw_name);
    if (rNorm === norm || rawNorm === norm) {
      return expandRecord(r);
    }
    if (norm.length >= 4 && (rNorm.includes(norm) || norm.includes(rNorm))) {
      if (!bestSubMatch || (r.pop != null && bestSubMatch.pop == null)) {
        bestSubMatch = r;
      }
    }
  }
  if (bestSubMatch) {
    return expandRecord(bestSubMatch);
  }

  // 5. Check villages cache if already loaded
  if (_villagesCache) {
    for (const v of _villagesCache) {
      if (!isAllDistricts && normalize(v.district) !== dKey) continue;
      const vNorm = normalize(v.name);
      if (vNorm === norm || (norm.length >= 4 && vNorm.includes(norm))) {
        const vCode = String(v.code || v.id);
        if (ALIASES[vCode] && CODE_INDEX.has(ALIASES[vCode])) {
          return expandRecord(CODE_INDEX.get(ALIASES[vCode]));
        }
        return expandRecord(v);
      }
    }
  }

  return null;
}

/**
 * Returns key official local bodies across the specified district (or statewide)
 * When a specific district is requested, provides a balanced representation of both
 * key administrative Urban Local Bodies (Municipalities, Town Panchayats) AND prominent
 * rural Gram Panchayats across the taluks of that district.
 */
export function getTopCensusRecords(limit = 25, district = null) {
  const dKey = district ? normalize(district) : null;
  const isAllDistricts = !dKey || dKey === 'all' || dKey === 'alldistricts' || dKey === 'tamilnadu';

  let pool = isAllDistricts
    ? PRIMARY_RECORDS
    : (DISTRICT_INDEX.get(dKey) || PRIMARY_RECORDS.filter((r) => normalize(r.district) === dKey));

  if (!pool || pool.length === 0) {
    pool = PRIMARY_RECORDS;
  }

  // If a specific district is selected (like Tiruppur or Coimbatore), provide a balanced representation
  // ensuring both Urban Local Bodies and rural Gram Panchayats are visible
  if (!isAllDistricts && (dKey === 'tiruppur' || dKey === 'coimbatore')) {
    const towns = pool.filter((r) => r.type && r.type !== 'Gram Panchayat' && r.type !== 'Village')
      .sort((a, b) => ((b.pop || b.hh || 0) - (a.pop || a.hh || 0)));
    const panchayats = pool.filter((r) => r.type === 'Gram Panchayat' || r.type === 'Village')
      .sort((a, b) => ((b.pop || b.hh || 0) - (a.pop || a.hh || 0)));

    const combined = [];
    const maxTowns = Math.min(10, Math.floor(limit / 2));
    combined.push(...towns.slice(0, maxTowns));
    combined.push(...panchayats.slice(0, limit - combined.length));
    return combined.map(expandRecord);
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
        const resolved = (ALIASES[codeStr] && CODE_INDEX.has(ALIASES[codeStr]))
          ? CODE_INDEX.get(ALIASES[codeStr])
          : v;
        results.push(expandRecord(resolved));
        if (results.length >= limit) break;
      }
    }
  }

  // Sort results to prioritize locations with authentic population count
  results.sort((a, b) => {
    const aHasPop = a.population != null ? 1 : 0;
    const bHasPop = b.population != null ? 1 : 0;
    if (aHasPop !== bHasPop) return bHasPop - aHasPop;
    return (b.population || 0) - (a.population || 0);
  });

  return results;
}

export function getAllCensusRecords(district = null) {
  return getTopCensusRecords(100, district);
}

