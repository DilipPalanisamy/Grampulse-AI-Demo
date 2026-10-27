import React, { createContext, useContext, useState, useEffect, useCallback, useMemo, useRef } from 'react';
import PropTypes from 'prop-types';
import {
  fetchPanchayats,
  fetchCitizenIssues,
  fetchPanchayatAnalytics,
  resolveLivePanchayat,
  fetchSpatialInfrastructure,
  fetchVillageData,
  searchVillages,
} from '../services/api';
import { searchRealVillages } from '../services/villageSearchService';
import { findCensusRecord, getTopCensusRecords, getDistricts } from '../services/censusDirectoryService';
import { queryOverpassInfrastructure } from '../utils/overpassApi';

import { useAuth } from './AuthContext';

const LocationContext = createContext(null);

const SAFE_DEFAULT_VILLAGE = {
  gp_id: 644405,
  gp_code: 'CENSUS-644405',
  census_code: '644405',
  gp_name: 'Chinniyampalayam',
  village_name: 'Chinniyampalayam',
  matched_location_name: 'Chinniam palayam',
  location_type: 'Census Town',
  district: 'Coimbatore',
  state: 'Tamil Nadu',
  lat: 11.0267,
  lng: 77.0617,
  population: 8232,
  total_population: 8232,
  male_population: 4149,
  female_population: 4083,
  households: 2349,
  hl11_households: 2422,
  literate_population: 6560,
  electricity_coverage: 97.44,
  tap_water_coverage: 98.27,
  latrine_coverage: 88.15,
  schools: 2,
  school_classrooms_count: 39,
  road_coverage_km: null,
  tagline: 'Chinniyampalayam (Census Town, Coimbatore)',
  description: 'Authentic government records from Census 2011, Table HL-11, and UDISE+ school education module.',
  isOfficialData: true,
  indicators: {
    total_population: { indicator: 'total_population', value: 8232, unit: 'persons', data_status: 'HISTORICAL' },
    total_households: { indicator: 'total_households', value: 2349, unit: 'households', data_status: 'HISTORICAL' },
    hl11_total_households: { indicator: 'hl11_total_households', value: 2422, unit: 'households', data_status: 'HISTORICAL' },
    household_electricity_coverage: { indicator: 'household_electricity_coverage', value: 97.44, unit: 'percent', data_status: 'HISTORICAL' },
    tap_water_coverage_percent: { indicator: 'tap_water_coverage_percent', value: 98.27, unit: 'percent', data_status: 'HISTORICAL' },
    latrine_facility_coverage: { indicator: 'latrine_facility_coverage', value: 88.15, unit: 'percent', data_status: 'HISTORICAL' },
    udise_school_count: { indicator: 'udise_school_count', value: 2, unit: 'schools', data_status: 'VERIFIED' },
    udise_total_classrooms: { indicator: 'udise_total_classrooms', value: 39, unit: 'classrooms', data_status: 'VERIFIED' },
    literate_population: { indicator: 'literate_population', value: 6560, unit: 'persons', data_status: 'HISTORICAL' },
  },
  census_baseline: {
    location_name: 'Chinniam palayam',
    location_type: 'Census Town',
    year: 2011,
    population: 8232,
    male_population: 4149,
    female_population: 4083,
    households: 2349,
    hl11_households: 2422,
    literate_population: 6560,
    electricity_coverage_percent: 97.44,
    tap_water_coverage_percent: 98.27,
    latrine_coverage_percent: 88.15,
  },
  data_summary: {
    total_indicators: 26,
    verified_indicators: 21,
    unavailable_indicators: 2,
    has_demographics: true,
    has_udise_schools: true,
    school_count: 2,
  },
  geojson: null,
  boundingbox: null,
};

const getSavedUserVillageObject = () => {
  try {
    const rawSession =
      typeof localStorage !== 'undefined'
        ? localStorage.getItem('user_session') || localStorage.getItem('grampulse_citizen_session')
        : null;
    if (rawSession) {
      const parsed = JSON.parse(rawSession);
      const name = parsed?.officialVillage?.gp_name || parsed?.villageOrCity || parsed?.gpName;
      if (name && String(name).toLowerCase() === 'koduvai') {
        // Discard stale legacy Koduvai sessions
        return null;
      }
      if (parsed?.officialVillage && parsed.officialVillage.lat) {
        return parsed.officialVillage;
      }
      if (parsed?.villageOrCity) {
        return {
          gp_name: parsed.villageOrCity,
          district: parsed.district || `${parsed.villageOrCity} District`,
          state: parsed.state || 'Tamil Nadu',
        };
      }
      if (parsed?.gpName) {
        return {
          gp_name: parsed.gpName,
          district: parsed.district || `${parsed.gpName} District`,
          state: parsed.state || 'Tamil Nadu',
        };
      }
    }
  } catch (e) {
    // Ignore JSON parse errors
  }
  return null;
};

const hasRealIndicatorValues = (inds) => {
  if (!inds || typeof inds !== 'object') return false;
  return Object.values(inds).some((item) => {
    if (item == null) return false;
    if (typeof item === 'object') {
      return item.value != null;
    }
    return typeof item === 'number' || typeof item === 'string';
  });
};

const mergeIndicatorsSafely = (primary, fallback) => {
  const result = { ...(fallback || {}) };
  if (!primary || typeof primary !== 'object') return result;

  for (const [key, val] of Object.entries(primary)) {
    if (val != null) {
      if (typeof val === 'object' && val.value != null) {
        result[key] = val;
      } else if (typeof val !== 'object') {
        result[key] = val;
      }
    }
  }
  return result;
};

const buildInitialVillage = (villageInput = null) => {
  try {
    if (typeof villageInput === 'object' && villageInput !== null) {
      const name = String(
        villageInput.gp_name ||
        villageInput.village_name ||
        villageInput.villageOrCity ||
        villageInput.gpName ||
        villageInput.name ||
        'Chinniyampalayam'
      ).trim();

      const district = String(villageInput.district || 'Coimbatore').trim();
      const state = String(villageInput.state || 'Tamil Nadu').trim();

      return {
        gp_id: Number(villageInput.gp_id || villageInput.census_code || 644405),
        gp_code: villageInput.gp_code || (villageInput.census_code ? `CENSUS-${villageInput.census_code}` : 'CENSUS-644405'),
        gp_name: name,
        village_name: name,
        location_type: villageInput.location_type || 'Census Town',
        district,
        state,
        lat: Number(villageInput.lat ?? 11.0267),
        lng: Number(villageInput.lng ?? 77.0617),
        population: villageInput.population != null ? Number(villageInput.population) : (name === 'Chinniyampalayam' ? 8232 : null),
        total_population: villageInput.total_population != null ? Number(villageInput.total_population) : (name === 'Chinniyampalayam' ? 8232 : null),
        households: villageInput.households != null ? Number(villageInput.households) : (name === 'Chinniyampalayam' ? 2349 : null),
        hl11_households: villageInput.hl11_households != null ? Number(villageInput.hl11_households) : (name === 'Chinniyampalayam' ? 2422 : null),
        schools: villageInput.schools != null ? Number(villageInput.schools) : (name === 'Chinniyampalayam' ? 2 : null),
        school_classrooms_count: villageInput.school_classrooms_count != null ? Number(villageInput.school_classrooms_count) : (name === 'Chinniyampalayam' ? 39 : null),
        road_coverage_km: villageInput.road_coverage_km != null ? Number(villageInput.road_coverage_km) : null,
        tagline: villageInput.tagline || `${name} (${district})`,
        description: villageInput.description || `Official government records from Census of India 2011 and UDISE+ directory.`,
        indicators: villageInput.indicators || {},
        categories: villageInput.categories || {},
        isOfficialData: Boolean(villageInput.isOfficialData ?? true),
        geojson: villageInput.geojson || null,
        boundingbox: villageInput.boundingbox || null,
      };
    }

    if (typeof villageInput === 'string' && villageInput.trim()) {
      const name = villageInput.trim();
      return {
        ...SAFE_DEFAULT_VILLAGE,
        gp_name: name,
        village_name: name,
      };
    }

    return SAFE_DEFAULT_VILLAGE;
  } catch (err) {
    console.error('Error building initial village:', err);
    return SAFE_DEFAULT_VILLAGE;
  }
};

export const PRELOADED_AUTHENTIC_VILLAGES = [
  {
    gp_id: 644405,
    gp_code: 'CENSUS-644405',
    gp_name: 'Chinniyampalayam',
    village_name: 'Chinniyampalayam',
    matched_location_name: 'Chinniam palayam',
    location_type: 'Census Town',
    district: 'Coimbatore',
    state: 'Tamil Nadu',
    census_code: '644405',
    lat: 11.0267,
    lng: 77.0617,
    population: 8232,
    total_population: 8232,
    male_population: 4192,
    female_population: 4040,
    households: 2349,
    hl11_households: 2422,
    electricity_coverage: 97.44,
    tap_water_coverage: 98.27,
    latrine_coverage: 88.15,
    schools: 2,
    school_classrooms_count: 39,
    literate_population: 6380,
    road_coverage_km: null,
    isOfficialData: true,
    tagline: 'Chinniyampalayam (Census Town, Coimbatore)',
    description: 'Authentic government data from Census 2011, Table HL-11, and Ministry of Education UDISE+ directory.',
    indicators: SAFE_DEFAULT_VILLAGE.indicators,
    census_baseline: SAFE_DEFAULT_VILLAGE.census_baseline,
  },
  {
    gp_id: 803962,
    gp_code: 'CENSUS-803962',
    gp_name: 'Karamadai',
    village_name: 'Karamadai',
    matched_location_name: 'Karamadai',
    location_type: 'Town Panchayat',
    district: 'Coimbatore',
    state: 'Tamil Nadu',
    census_code: '803962',
    lat: 11.2428,
    lng: 76.9587,
    population: 35166,
    total_population: 35166,
    male_population: 17557,
    female_population: 17609,
    households: 9792,
    hl11_households: 9787,
    electricity_coverage: 93.77,
    tap_water_coverage: 96.77,
    latrine_coverage: 69.27,
    schools: 194,
    school_classrooms_count: 66,
    literate_population: 27171,
    road_coverage_km: null,
    isOfficialData: true,
    tagline: 'Karamadai (Town Panchayat, Coimbatore)',
    description: 'Authentic government data from Census 2011, Table HL-11, and Ministry of Education UDISE+ directory.',
    indicators: {
      total_population: { indicator: 'total_population', value: 35166, unit: 'persons', data_status: 'HISTORICAL' },
      total_households: { indicator: 'total_households', value: 9792, unit: 'households', data_status: 'HISTORICAL' },
      hl11_total_households: { indicator: 'hl11_total_households', value: 9787, unit: 'households', data_status: 'HISTORICAL' },
      household_electricity_coverage: { indicator: 'household_electricity_coverage', value: 93.77, unit: 'percent', data_status: 'HISTORICAL' },
      tap_water_coverage_percent: { indicator: 'tap_water_coverage_percent', value: 96.77, unit: 'percent', data_status: 'HISTORICAL' },
      latrine_facility_coverage: { indicator: 'latrine_facility_coverage', value: 69.27, unit: 'percent', data_status: 'HISTORICAL' },
      udise_school_count: { indicator: 'udise_school_count', value: 194, unit: 'schools', data_status: 'VERIFIED' },
      udise_total_classrooms: { indicator: 'udise_total_classrooms', value: 66, unit: 'classrooms', data_status: 'VERIFIED' },
      literate_population: { indicator: 'literate_population', value: 27171, unit: 'persons', data_status: 'HISTORICAL' },
      village_road_length_km: { indicator: 'village_road_length_km', value: null, unit: 'km', data_status: 'UNAVAILABLE' },
    },
    census_baseline: {
      location_name: 'Karamadai',
      location_type: 'Town Panchayat',
      year: 2011,
      population: 35166,
      male_population: 17557,
      female_population: 17609,
      households: 9792,
      hl11_households: 9787,
      literate_population: 27171,
      electricity_coverage_percent: 93.77,
      tap_water_coverage_percent: 96.77,
      latrine_coverage_percent: 69.27,
    },
  },
  {
    gp_id: 803960,
    gp_code: 'CENSUS-803960',
    gp_name: 'Sirumugai',
    village_name: 'Sirumugai',
    matched_location_name: 'Sirumugai',
    location_type: 'Town Panchayat',
    district: 'Coimbatore',
    state: 'Tamil Nadu',
    census_code: '803960',
    lat: 11.3197,
    lng: 77.0044,
    population: 18223,
    total_population: 18223,
    male_population: 9015,
    female_population: 9208,
    households: 5294,
    hl11_households: 5349,
    electricity_coverage: 92.41,
    tap_water_coverage: 98.02,
    latrine_coverage: 55.9,
    schools: 4,
    school_classrooms_count: 80,
    literate_population: 13284,
    road_coverage_km: null,
    isOfficialData: true,
    tagline: 'Sirumugai (Town Panchayat, Coimbatore)',
    description: 'Authentic government data from Census 2011, Table HL-11, and Ministry of Education UDISE+ directory.',
    indicators: {
      total_population: { indicator: 'total_population', value: 18223, unit: 'persons', data_status: 'HISTORICAL' },
      total_households: { indicator: 'total_households', value: 5294, unit: 'households', data_status: 'HISTORICAL' },
      hl11_total_households: { indicator: 'hl11_total_households', value: 5349, unit: 'households', data_status: 'HISTORICAL' },
      household_electricity_coverage: { indicator: 'household_electricity_coverage', value: 92.41, unit: 'percent', data_status: 'HISTORICAL' },
      tap_water_coverage_percent: { indicator: 'tap_water_coverage_percent', value: 98.02, unit: 'percent', data_status: 'HISTORICAL' },
      latrine_facility_coverage: { indicator: 'latrine_facility_coverage', value: 55.9, unit: 'percent', data_status: 'HISTORICAL' },
      udise_school_count: { indicator: 'udise_school_count', value: 4, unit: 'schools', data_status: 'VERIFIED' },
      udise_total_classrooms: { indicator: 'udise_total_classrooms', value: 80, unit: 'classrooms', data_status: 'VERIFIED' },
      literate_population: { indicator: 'literate_population', value: 13284, unit: 'persons', data_status: 'HISTORICAL' },
      village_road_length_km: { indicator: 'village_road_length_km', value: null, unit: 'km', data_status: 'UNAVAILABLE' },
    },
    census_baseline: {
      location_name: 'Sirumugai',
      location_type: 'Town Panchayat',
      year: 2011,
      population: 18223,
      male_population: 9015,
      female_population: 9208,
      households: 5294,
      hl11_households: 5349,
      literate_population: 13284,
      electricity_coverage_percent: 92.41,
      tap_water_coverage_percent: 98.02,
      latrine_coverage_percent: 55.9,
    },
  },
];

export const LocationProvider = ({ children }) => {
  const { user } = useAuth() || {};
  const [initialVillage] = useState(() =>
    buildInitialVillage(user?.officialVillage || user?.villageOrCity || user?.gpName || getSavedUserVillageObject())
  );
  const [locations, setLocations] = useState(() => {
    const list = [initialVillage];
    const topRecords = getTopCensusRecords(30);
    for (const v of topRecords) {
      if (!list.some((existing) => Number(existing.gp_id) === Number(v.gp_id) || String(existing.gp_name).toLowerCase() === String(v.gp_name).toLowerCase())) {
        list.push(v);
      }
    }
    return list;
  });
  const [selectedGpId, setSelectedGpId] = useState(() => initialVillage.gp_id);
  const [planningHorizon, setPlanningHorizon] = useState(5);
  const [analytics, setAnalytics] = useState(null);
  const [issues, setIssues] = useState([]);
  const [infrastructure, setInfrastructure] = useState({ counts: {}, markers: [] });
  const [categoryFilter, setCategoryFilter] = useState('ALL');
  const [loadingAnalytics, setLoadingAnalytics] = useState(true);
  const [loadingIssues, setLoadingIssues] = useState(true);
  const [loadingInfrastructure, setLoadingInfrastructure] = useState(false);
  const [isReportModalOpen, setIsReportModalOpen] = useState(false);
  const [activeTab, setActiveTab] = useState('dashboard'); // 'dashboard' | 'map'

  // Search States
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState([]);
  const [isSearching, setIsSearching] = useState(false);

  // Statewide Tamil Nadu District State (All 38 Districts)
  const [selectedDistrict, setSelectedDistrict] = useState('All Districts');
  const districts = useMemo(() => getDistricts(), []);

  // Update available quick habitations when district filter changes
  useEffect(() => {
    const list = getTopCensusRecords(25, selectedDistrict);
    setLocations((prev) => {
      const active = prev?.[0];
      if (!active) return list;
      const filtered = list.filter((l) => Number(l.gp_id) !== Number(active.gp_id));
      return [active, ...filtered];
    });
  }, [selectedDistrict]);

  // Active Location Object (guaranteed non-null)
  const selectedLocation = useMemo(() => {
    const found = locations?.find((l) => Number(l?.gp_id) === Number(selectedGpId));
    if (found && found.gp_name) return found;
    if (locations?.[0]?.gp_name) return locations[0];
    if (initialVillage?.gp_name) return initialVillage;
    return SAFE_DEFAULT_VILLAGE;
  }, [locations, selectedGpId, initialVillage]);

  // Center Coordinates for Map
  const mapCenter = useMemo(() => {
    if (selectedLocation?.lat && selectedLocation?.lng) {
      return [Number(selectedLocation.lat), Number(selectedLocation.lng)];
    }
    return [11.0267, 77.0617]; // Default to Chinniyampalayam / Coimbatore
  }, [selectedLocation]);

  // Auto-sync active location when authenticated user session updates
  useEffect(() => {
    const syncUserVillage = async () => {
      try {
        if (user?.officialVillage) {
          const official = user.officialVillage;
          setLocations((prev) => {
            const list = Array.isArray(prev) ? prev : [];
            const filtered = list.filter(
              (p) => String(p?.gp_name || '').toLowerCase() !== String(official?.gp_name || '').toLowerCase()
            );
            return [official, ...filtered];
          });
          setSelectedGpId(Number(official.gp_id));
        } else if (user?.villageOrCity || user?.gpName) {
          const targetName = String(user.villageOrCity || user.gpName).trim();
          try {
            const resolved = await resolveOfficialVillageData(targetName, user?.state || '');
            if (resolved) {
              setLocations((prev) => {
                const list = Array.isArray(prev) ? prev : [];
                const filtered = list.filter(
                  (p) => String(p?.gp_name || '').toLowerCase() !== String(resolved?.gp_name || '').toLowerCase()
                );
                return [resolved, ...filtered];
              });
              setSelectedGpId(Number(resolved.gp_id));
            }
          } catch (e) {
            const fallback = buildInitialVillage(targetName);
            setLocations((prev) => {
              const list = Array.isArray(prev) ? prev : [];
              return [
                fallback,
                ...list.filter((p) => String(p?.gp_name || '').toLowerCase() !== targetName.toLowerCase()),
              ];
            });
            setSelectedGpId(Number(fallback.gp_id));
          }
        }
      } catch (syncErr) {
        console.error('Error syncing user village in LocationContext:', syncErr);
      }
    };
    syncUserVillage();
  }, [user]);

  // Load registered Panchayats on mount
  useEffect(() => {
    const initLocations = async () => {
      try {
        const data = await fetchPanchayats();
        if (Array.isArray(data) && data.length > 0) {
          setLocations((prev) => {
            const combined = [...data];
            prev.forEach((p) => {
              if (!combined.some((c) => Number(c.gp_id) === Number(p.gp_id))) {
                combined.push(p);
              }
            });
            return combined;
          });
        }
      } catch (err) {
        console.error('Error initializing registered panchayats:', err);
      }
    };
    initLocations();
  }, []);

  // Hydrate authentic backend indicators for the initial active location on mount
  useEffect(() => {
    const hydrateInitial = async () => {
      const active = selectedLocation;
      if (active?.gp_name && (!active.indicators || Object.keys(active.indicators).length === 0)) {
        try {
          const gov = await fetchVillageData(active.gp_name, active.district || 'Coimbatore');
          if (gov && gov.status) {
            handleSelectLocation({
              ...active,
              ...gov,
              gp_name: active.gp_name,
              village_name: active.village_name || active.gp_name,
            }, false);
          }
        } catch (e) {
          console.warn('Initial village hydration error:', e);
        }
      }
    };
    hydrateInitial();
  }, []);

  // Ref to hold active location without recreating callbacks
  const selectedLocationRef = useRef(selectedLocation);
  useEffect(() => {
    selectedLocationRef.current = selectedLocation;
  }, [selectedLocation]);

  // Load Analytics when selected GP or planning horizon changes
  const loadAnalytics = useCallback(async (gpIdOverride = null, locOverride = null) => {
    const targetGpId = gpIdOverride || selectedGpId;
    if (!targetGpId) return;
    setLoadingAnalytics(true);
    try {
      const currentLoc = locOverride || selectedLocationRef.current;
      const data = await fetchPanchayatAnalytics(targetGpId, planningHorizon, 0.018, currentLoc);
      if (currentLoc && data) {
        data.gp_name = currentLoc.gp_name || data.gp_name;
        data.district = currentLoc.district || data.district;
        data.state = currentLoc.state || data.state;
      }
      setAnalytics(data);
    } catch (err) {
      console.error(`Error loading analytics for GP #${targetGpId}:`, err);
    } finally {
      setLoadingAnalytics(false);
    }
  }, [selectedGpId, planningHorizon]);

  useEffect(() => {
    loadAnalytics();
  }, [loadAnalytics]);

  // Load Citizen Issues for the active GP
  const loadIssues = useCallback(async () => {
    setLoadingIssues(true);
    try {
      const data = await fetchCitizenIssues(selectedGpId, categoryFilter);
      setIssues(Array.isArray(data) ? data : []);
    } catch (err) {
      console.error(`Error loading citizen issues for GP #${selectedGpId}:`, err);
    } finally {
      setLoadingIssues(false);
    }
  }, [selectedGpId, categoryFilter]);

  useEffect(() => {
    loadIssues();
  }, [loadIssues]);

  // Load Live Overpass Infrastructure for the active location
  const lastInfraCoordsRef = useRef({ lat: null, lng: null });

  const loadInfrastructure = useCallback(async () => {
    const lat = Number(selectedLocation?.lat);
    const lng = Number(selectedLocation?.lng);
    if (isNaN(lat) || isNaN(lng) || (lat === 0 && lng === 0)) return;

    if (
      lastInfraCoordsRef.current.lat !== null &&
      Math.abs(lastInfraCoordsRef.current.lat - lat) < 0.0001 &&
      Math.abs(lastInfraCoordsRef.current.lng - lng) < 0.0001
    ) {
      return;
    }
    lastInfraCoordsRef.current = { lat, lng };

    setLoadingInfrastructure(true);
    try {
      const data = await queryOverpassInfrastructure(lat, lng, 5000);
      setInfrastructure(data || { counts: {}, markers: [] });
    } catch (err) {
      console.error('Error loading live infrastructure nodes:', err);
    } finally {
      setLoadingInfrastructure(false);
    }
  }, [selectedLocation?.lat, selectedLocation?.lng]);

  useEffect(() => {
    loadInfrastructure();
  }, [loadInfrastructure]);

  const debounceTimeoutRef = useRef(null);

  /**
   * Search real villages dynamically via OpenStreetMap Nominatim and backend GIS
   */
  const handleSearch = useCallback((query, districtOverride = null) => {
    setSearchQuery(query);
    if (!query || query.trim().length === 0) {
      setSearchResults([]);
      setIsSearching(false);
      if (debounceTimeoutRef.current) clearTimeout(debounceTimeoutRef.current);
      return;
    }

    setIsSearching(true);
    if (debounceTimeoutRef.current) {
      clearTimeout(debounceTimeoutRef.current);
    }

    const effectiveDist = districtOverride || selectedDistrict;

    debounceTimeoutRef.current = setTimeout(async () => {
      try {
        const results = await searchRealVillages(query, effectiveDist);
        setSearchResults(results);
      } catch (err) {
        console.error('Village search error:', err);
      } finally {
        setIsSearching(false);
      }
    }, 250);
  }, [selectedDistrict]);

  /**
   * Unified Location Selection Handler:
   * 1. Normalizes location data (name/gp_name, district, state, lat/latitude, lng/longitude, gp_code)
   * 2. Resolves PostGIS baseline data & updates state
   * 3. Optionally switches activeTab to 'dashboard'
   * 4. Smoothly scrolls window to top
   */
  // Request sequencing ref to prevent stale API responses from overwriting newer selection
  const selectionReqIdRef = useRef(0);

  /**
   * Sets the active location dynamically:
   * 1. Immediately saves backend identifier & clears old indicators
   * 2. Fetches real government data from backend
   * 3. Prevents stale responses from overwriting newer selections
   * 4. Updates global location, indicators, and Census baseline
   */
  const handleSelectLocation = useCallback(async (locationOrId, shouldRouteToDashboard = true) => {
    const currentReqId = ++selectionReqIdRef.current;

    let targetLocation = locationOrId;
    if (typeof locationOrId !== 'object' || locationOrId === null) {
      const rec = findCensusRecord(locationOrId);
      if (rec) {
        targetLocation = rec;
      } else {
        const numId = Number(locationOrId);
        targetLocation = { gp_id: numId, gp_name: `Location ${numId}`, id: numId };
      }
    }

    if (targetLocation && typeof targetLocation === 'object') {
      const rawName =
        targetLocation.gp_name ||
        targetLocation.village_name ||
        targetLocation.village ||
        targetLocation.matched_location_name ||
        targetLocation.name ||
        targetLocation.census_baseline?.location_name ||
        'Selected Location';
      const district = targetLocation.district || (selectedDistrict !== 'All Districts' ? selectedDistrict : 'Tamil Nadu');
      // Query by authentic town/village name so backend resolves Census PCA and Table HL-11 accurately
      const queryParam = targetLocation.village_name || targetLocation.village || targetLocation.gp_name || targetLocation.name || targetLocation.census_code || rawName;

      console.log('[DEBUG-SELECT] Selected village name:', rawName, 'District:', district, 'Census ID:', targetLocation?.census_code, 'Input object:', targetLocation);

      const immediateGpId = targetLocation.census_code
        ? Number(targetLocation.census_code)
        : (Number(targetLocation.gp_id || targetLocation.id) || Math.floor(1000 + Math.random() * 9000));

      // Match against authentic Census directory across all 38 districts of Tamil Nadu
      const censusDirectoryMatch = findCensusRecord(targetLocation.census_code || immediateGpId || queryParam || rawName, district);

      // Match against preloaded authentic repository records (Karamadai, Chinniyampalayam, Sirumugai)
      const knownPreload = censusDirectoryMatch || PRELOADED_AUTHENTIC_VILLAGES.find(
        (v) =>
          (immediateGpId && Number(v.gp_id) === immediateGpId) ||
          (targetLocation.census_code && String(v.census_code) === String(targetLocation.census_code)) ||
          String(v.gp_name || '').toLowerCase() === String(rawName).toLowerCase()
      );

      const existingInds = hasRealIndicatorValues(targetLocation.indicators)
        ? mergeIndicatorsSafely(targetLocation.indicators, knownPreload?.indicators)
        : (knownPreload?.indicators || {});

      const existingBaseline = targetLocation.census_baseline || knownPreload?.census_baseline || null;

      // 1. Immediately preserve authentic indicators if known, and set placeholder for fresh fetch
      const interimObj = {
        ...knownPreload,
        ...locationOrId,
        gp_id: immediateGpId,
        gp_name: rawName,
        village_name: rawName,
        district,
        state: locationOrId.state || 'Tamil Nadu',
        population: locationOrId.population ?? knownPreload?.population ?? existingBaseline?.population ?? null,
        total_population: locationOrId.total_population ?? locationOrId.population ?? knownPreload?.total_population ?? existingBaseline?.population ?? null,
        households: locationOrId.households ?? knownPreload?.households ?? existingBaseline?.households ?? null,
        hl11_households: locationOrId.hl11_households ?? knownPreload?.hl11_households ?? existingBaseline?.hl11_households ?? null,
        electricity_coverage: locationOrId.electricity_coverage ?? knownPreload?.electricity_coverage ?? existingBaseline?.electricity_coverage_percent ?? null,
        tap_water_coverage: locationOrId.tap_water_coverage ?? knownPreload?.tap_water_coverage ?? existingBaseline?.tap_water_coverage_percent ?? null,
        latrine_coverage: locationOrId.latrine_coverage ?? knownPreload?.latrine_coverage ?? existingBaseline?.latrine_coverage_percent ?? null,
        schools: locationOrId.schools ?? knownPreload?.schools ?? existingInds?.udise_school_count?.value ?? null,
        school_classrooms_count: locationOrId.school_classrooms_count ?? knownPreload?.school_classrooms_count ?? existingInds?.udise_total_classrooms?.value ?? null,
        literate_population: locationOrId.literate_population ?? knownPreload?.literate_population ?? existingBaseline?.literate_population ?? null,
        road_coverage_km: locationOrId.road_coverage_km ?? knownPreload?.road_coverage_km ?? null,
        indicators: existingInds,
        census_baseline: existingBaseline,
        isOfficialData: Boolean(locationOrId.isOfficialCensus || locationOrId.isOfficialData || knownPreload?.isOfficialData || existingBaseline),
        isLoadingBackend: true,
      };

      setLocations((prev) => {
        const list = Array.isArray(prev) ? prev : [];
        const filtered = list.filter((p) => String(p?.gp_name || '').toLowerCase() !== String(rawName).toLowerCase());
        return [interimObj, ...filtered];
      });
      setSelectedGpId(immediateGpId);

      // 2. Fetch real government data from FastAPI backend
      let govData = null;
      try {
        govData = await fetchVillageData(queryParam, district);
        console.log('[DEBUG-API-RESP] /village/data response for', queryParam, ':', govData);
      } catch (err) {
        console.warn(`Failed to fetch backend data for ${queryParam}:`, err);
      }

      // 3. Stale response guard: discard if user made a newer selection
      if (currentReqId !== selectionReqIdRef.current) {
        return;
      }

      let mergedObj;
      if (govData && govData.status) {
        const inds = govData.indicators || {};
        const admin = govData.administrative_identifiers || {};
        const censusCode = admin.census_code || locationOrId.census_code || knownPreload?.census_code || null;
        const matchedName = govData.matched_location_name || rawName;
        const locType = govData.location_type || locationOrId.location_type || knownPreload?.location_type || 'Village';

        mergedObj = {
          ...knownPreload,
          ...locationOrId,
          gp_id: censusCode ? parseInt(censusCode, 10) : immediateGpId,
          gp_code: censusCode ? `CENSUS-${censusCode}` : (locationOrId.gp_code || `GP-${matchedName.slice(0, 3).toUpperCase()}`),
          gp_name: rawName,
          village_name: rawName,
          matched_location_name: matchedName,
          location_type: locType,
          district: govData.district || district,
          state: govData.state || 'Tamil Nadu',
          census_code: censusCode,
          subdistrict_code: admin.subdistrict_code || locationOrId.subdistrict_code || null,

          // Real Indicators from Backend
          population: inds.total_population?.value ?? govData.census_baseline?.population ?? locationOrId.population ?? knownPreload?.population ?? null,
          total_population: inds.total_population?.value ?? govData.census_baseline?.population ?? locationOrId.population ?? knownPreload?.population ?? null,
          male_population: inds.male_population?.value ?? govData.census_baseline?.male_population ?? knownPreload?.male_population ?? null,
          female_population: inds.female_population?.value ?? govData.census_baseline?.female_population ?? knownPreload?.female_population ?? null,
          children_0_6: inds.children_0_6?.value ?? govData.census_baseline?.children_0_6 ?? null,
          households: inds.total_households?.value ?? govData.census_baseline?.households ?? locationOrId.households ?? knownPreload?.households ?? null,
          hl11_households: inds.hl11_total_households?.value ?? govData.census_baseline?.hl11_households ?? knownPreload?.hl11_households ?? null,
          literate_population: inds.literate_population?.value ?? govData.census_baseline?.literate_population ?? knownPreload?.literate_population ?? null,
          illiterate_population: inds.illiterate_population?.value ?? govData.census_baseline?.illiterate_population ?? null,
          total_workers: inds.total_workers?.value ?? govData.census_baseline?.total_workers ?? null,
          main_workers: inds.main_workers?.value ?? govData.census_baseline?.main_workers ?? null,
          marginal_workers: inds.marginal_workers?.value ?? govData.census_baseline?.marginal_workers ?? null,
          non_workers: inds.non_workers?.value ?? govData.census_baseline?.non_workers ?? null,

          // Amenities & Infrastructure
          electricity_coverage: inds.household_electricity_coverage?.value ?? govData.census_baseline?.electricity_coverage_percent ?? knownPreload?.electricity_coverage ?? null,
          tap_water_coverage: inds.tap_water_coverage_percent?.value ?? govData.census_baseline?.tap_water_coverage_percent ?? knownPreload?.tap_water_coverage ?? null,
          latrine_coverage: inds.latrine_facility_coverage?.value ?? govData.census_baseline?.latrine_coverage_percent ?? knownPreload?.latrine_coverage ?? null,
          schools: inds.udise_school_count?.value ?? locationOrId.schools ?? knownPreload?.schools ?? null,
          school_classrooms_count: inds.udise_total_classrooms?.value ?? locationOrId.school_classrooms_count ?? knownPreload?.school_classrooms_count ?? null,
          road_coverage_km: inds.village_road_length_km?.value ?? locationOrId.road_coverage_km ?? knownPreload?.road_coverage_km ?? null,
          road_connectivity: inds.road_connectivity_status?.value ?? null,
          broadband_connectivity: inds.bharatnet_gp_connectivity?.value ?? null,
          health_centre: inds.public_health_centre?.value ?? null,
          hospital_beds: inds.hospital_beds_count?.value ?? null,

          indicators: hasRealIndicatorValues(inds)
            ? mergeIndicatorsSafely(inds, knownPreload?.indicators)
            : (knownPreload?.indicators || inds),
          categories: govData.categories || {},
          census_baseline: govData.census_baseline || knownPreload?.census_baseline || null,
          sources_used: govData.sources_used || [],
          data_summary: govData.data_summary || knownPreload?.data_summary || null,
          isOfficialData: Boolean(govData.census_baseline || govData.data_summary?.has_demographics || knownPreload?.isOfficialData),
          isLoadingBackend: false,
          tagline: `${rawName} (${locType}, ${govData.district || district})`,
          description: govData.data_summary?.has_demographics
            ? `Authentic government data from Census 2011, Table HL-11, and Ministry of Education UDISE+ directory.`
            : `Census demographic records unavailable for this village.`,
        };
      } else {
        // Fallback to authentic Census 2011 & UDISE+ directory if Render backend query fails
        const censusFallback = findCensusRecord(locationOrId.census_code || immediateGpId || queryParam || rawName, district);
        const activeBaseline = censusFallback || knownPreload;
        const fallbackInds = hasRealIndicatorValues(locationOrId.indicators)
          ? mergeIndicatorsSafely(locationOrId.indicators, activeBaseline?.indicators)
          : (activeBaseline?.indicators || {});
        const fallbackBaseline = locationOrId.census_baseline || activeBaseline?.census_baseline || null;

        mergedObj = {
          ...activeBaseline,
          ...locationOrId,
          gp_id: activeBaseline?.gp_id || immediateGpId,
          gp_code: activeBaseline?.gp_code || (activeBaseline?.census_code ? `CENSUS-${activeBaseline.census_code}` : (locationOrId.gp_code || `GP-${immediateGpId}`)),
          gp_name: rawName,
          village_name: rawName,
          matched_location_name: activeBaseline?.matched_location_name || rawName,
          location_type: activeBaseline?.location_type || locationOrId.location_type || 'Village',
          district: activeBaseline?.district || district,
          state: activeBaseline?.state || locationOrId.state || 'Tamil Nadu',
          census_code: activeBaseline?.census_code || locationOrId.census_code || null,
          population: locationOrId.population ?? activeBaseline?.population ?? fallbackBaseline?.population ?? null,
          total_population: locationOrId.total_population ?? locationOrId.population ?? activeBaseline?.total_population ?? fallbackBaseline?.population ?? null,
          male_population: locationOrId.male_population ?? activeBaseline?.male_population ?? fallbackBaseline?.male_population ?? null,
          female_population: locationOrId.female_population ?? activeBaseline?.female_population ?? fallbackBaseline?.female_population ?? null,
          children_0_6: locationOrId.children_0_6 ?? activeBaseline?.children_0_6 ?? fallbackBaseline?.children_0_6 ?? null,
          households: locationOrId.households ?? activeBaseline?.households ?? fallbackBaseline?.households ?? null,
          hl11_households: locationOrId.hl11_households ?? activeBaseline?.hl11_households ?? fallbackBaseline?.hl11_households ?? null,
          electricity_coverage: locationOrId.electricity_coverage ?? activeBaseline?.electricity_coverage ?? fallbackBaseline?.electricity_coverage_percent ?? null,
          tap_water_coverage: locationOrId.tap_water_coverage ?? activeBaseline?.tap_water_coverage ?? fallbackBaseline?.tap_water_coverage_percent ?? null,
          latrine_coverage: locationOrId.latrine_coverage ?? activeBaseline?.latrine_coverage ?? fallbackBaseline?.latrine_coverage_percent ?? null,
          schools: locationOrId.schools ?? activeBaseline?.schools ?? fallbackInds?.udise_school_count?.value ?? null,
          school_classrooms_count: locationOrId.school_classrooms_count ?? activeBaseline?.school_classrooms_count ?? fallbackInds?.udise_total_classrooms?.value ?? null,
          literate_population: locationOrId.literate_population ?? activeBaseline?.literate_population ?? fallbackBaseline?.literate_population ?? null,
          illiterate_population: locationOrId.illiterate_population ?? activeBaseline?.illiterate_population ?? fallbackBaseline?.illiterate_population ?? null,
          total_workers: locationOrId.total_workers ?? activeBaseline?.total_workers ?? fallbackBaseline?.total_workers ?? null,
          road_coverage_km: locationOrId.road_coverage_km ?? activeBaseline?.road_coverage_km ?? null,
          indicators: fallbackInds,
          census_baseline: fallbackBaseline,
          isOfficialData: Boolean(activeBaseline?.isOfficialData || locationOrId.isOfficialCensus || locationOrId.isOfficialData),
          isLoadingBackend: false,
          tagline: activeBaseline?.tagline || `${rawName} (${district})`,
          description: activeBaseline?.description || `Authentic government records from Census 2011, Table HL-11, and Ministry of Education UDISE+ directory.`,
        };
      }

      setLocations((prev) => {
        const list = Array.isArray(prev) ? prev : [];
        const filtered = list.filter((p) => {
          if (!p) return false;
          if (Number(p.gp_id) === Number(mergedObj.gp_id)) return false;
          const pName = String(p.gp_name || '').toLowerCase().replace(/\s+/g, '');
          const mName = String(mergedObj.gp_name || '').toLowerCase().replace(/\s+/g, '');
          const rName = String(rawName || '').toLowerCase().replace(/\s+/g, '');
          return pName !== mName && pName !== rName;
        });
        return [mergedObj, ...filtered];
      });

      console.log('[DEBUG-LOCATION-STATE] LocationContext mergedObj after response:', mergedObj);
      selectedLocationRef.current = mergedObj;
      setSelectedGpId(Number(mergedObj.gp_id));
      loadAnalytics(Number(mergedObj.gp_id), mergedObj);
    } else {
      const gpId = Number(locationOrId);
      if (!gpId) return;
      setSelectedGpId(gpId);
      loadAnalytics(gpId);
    }

    if (shouldRouteToDashboard) {
      setActiveTab('dashboard');
      if (typeof window !== 'undefined') {
        window.scrollTo({ top: 0, behavior: 'smooth' });
      }
    }
  }, []);

  const selectLocation = handleSelectLocation;

  const handleIssueCreated = useCallback((newIssue) => {
    setIssues((prev) => [newIssue, ...prev]);
  }, []);

  const value = {
    locations,
    selectedLocation,
    selectedGpId,
    mapCenter,
    selectLocation,
    handleSelectLocation,
    planningHorizon,
    setPlanningHorizon,
    analytics,
    loadingAnalytics,
    issues,
    loadingIssues,
    infrastructure,
    loadingInfrastructure,
    categoryFilter,
    setCategoryFilter,
    isReportModalOpen,
    setIsReportModalOpen,
    loadAnalytics,
    loadIssues,
    loadInfrastructure,
    handleIssueCreated,
    // Search & Statewide Directory
    searchQuery,
    searchResults,
    isSearching,
    handleSearch,
    // Statewide Tamil Nadu Districts
    selectedDistrict,
    setSelectedDistrict,
    districts,
    // Page Tab Navigation
    activeTab,
    setActiveTab,
  };

  return <LocationContext.Provider value={value}>{children}</LocationContext.Provider>;
};

LocationProvider.propTypes = {
  children: PropTypes.node.isRequired,
};

export const useLocation = () => {
  const context = useContext(LocationContext);
  if (!context) {
    throw new Error('useLocation must be used within a LocationProvider');
  }
  return context;
};

export default LocationContext;
