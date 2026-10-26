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
import { resolveOfficialVillageData } from '../services/officialVillageDataService';
import { queryOverpassInfrastructure } from '../utils/overpassApi';

import { useAuth } from './AuthContext';

const LocationContext = createContext(null);

const SAFE_DEFAULT_VILLAGE = {
  gp_id: 644405,
  gp_code: 'CENSUS-644405',
  gp_name: 'Chinniyampalayam',
  village_name: 'Chinniyampalayam',
  location_type: 'Census Town',
  district: 'Coimbatore',
  state: 'Tamil Nadu',
  lat: 11.0267,
  lng: 77.0617,
  population: 8232,
  total_population: 8232,
  households: 2349,
  hl11_households: 2422,
  schools: 2,
  school_classrooms_count: 39,
  road_coverage_km: null,
  tagline: 'Chinniyampalayam (Census Town, Coimbatore)',
  description: 'Authentic government records from Census 2011, Table HL-11, and UDISE+ school education module.',
  isOfficialData: true,
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

export const LocationProvider = ({ children }) => {
  const { user } = useAuth() || {};
  const [initialVillage] = useState(() =>
    buildInitialVillage(user?.officialVillage || user?.villageOrCity || user?.gpName || getSavedUserVillageObject())
  );
  const [locations, setLocations] = useState(() => [initialVillage]);
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
            handleSelectLocation(gov, false);
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
  const loadAnalytics = useCallback(async () => {
    if (!selectedGpId) return;
    setLoadingAnalytics(true);
    try {
      const currentLoc = selectedLocationRef.current;
      const data = await fetchPanchayatAnalytics(selectedGpId, planningHorizon, 0.018, currentLoc);
      if (currentLoc && data) {
        data.gp_name = currentLoc.gp_name || data.gp_name;
        data.district = currentLoc.district || data.district;
        data.state = currentLoc.state || data.state;
      }
      setAnalytics(data);
    } catch (err) {
      console.error(`Error loading analytics for GP #${selectedGpId}:`, err);
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
  const handleSearch = useCallback((query) => {
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

    debounceTimeoutRef.current = setTimeout(async () => {
      try {
        const results = await searchRealVillages(query);
        setSearchResults(results);
      } catch (err) {
        console.error('Village search error:', err);
      } finally {
        setIsSearching(false);
      }
    }, 250);
  }, []);

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

    if (typeof locationOrId === 'object' && locationOrId !== null) {
      const rawName = locationOrId.gp_name || locationOrId.village_name || locationOrId.name || 'Selected Location';
      const district = locationOrId.district || 'Coimbatore';
      const queryParam = locationOrId.census_code || rawName;

      // 1. Immediately clear old village indicators and set placeholder so old village data never lingers
      const immediateGpId = locationOrId.census_code ? Number(locationOrId.census_code) : (locationOrId.gp_id || Math.floor(1000 + Math.random() * 9000));
      const interimObj = {
        ...locationOrId,
        gp_id: immediateGpId,
        gp_name: rawName,
        village_name: rawName,
        district,
        state: locationOrId.state || 'Tamil Nadu',
        population: locationOrId.population ?? null,
        total_population: locationOrId.total_population ?? locationOrId.population ?? null,
        households: locationOrId.households ?? null,
        schools: locationOrId.schools ?? null,
        school_classrooms_count: locationOrId.school_classrooms_count ?? null,
        road_coverage_km: locationOrId.road_coverage_km ?? null,
        indicators: {},
        isOfficialData: Boolean(locationOrId.isOfficialCensus || locationOrId.isOfficialData),
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
        const censusCode = admin.census_code || locationOrId.census_code || null;
        const matchedName = govData.matched_location_name || rawName;
        const locType = govData.location_type || locationOrId.location_type || 'Village';

        mergedObj = {
          ...locationOrId,
          gp_id: censusCode ? parseInt(censusCode, 10) : immediateGpId,
          gp_code: censusCode ? `CENSUS-${censusCode}` : (locationOrId.gp_code || `GP-${matchedName.slice(0, 3).toUpperCase()}`),
          gp_name: matchedName,
          village_name: matchedName,
          location_type: locType,
          district: govData.district || district,
          state: govData.state || 'Tamil Nadu',
          census_code: censusCode,
          subdistrict_code: admin.subdistrict_code || locationOrId.subdistrict_code || null,

          // Real Indicators from Backend
          population: inds.total_population?.value ?? locationOrId.population ?? null,
          total_population: inds.total_population?.value ?? locationOrId.population ?? null,
          male_population: inds.male_population?.value ?? null,
          female_population: inds.female_population?.value ?? null,
          children_0_6: inds.children_0_6?.value ?? null,
          households: inds.total_households?.value ?? locationOrId.households ?? null,
          hl11_households: inds.hl11_total_households?.value ?? null,
          literate_population: inds.literate_population?.value ?? null,
          illiterate_population: inds.illiterate_population?.value ?? null,
          total_workers: inds.total_workers?.value ?? null,
          main_workers: inds.main_workers?.value ?? null,
          marginal_workers: inds.marginal_workers?.value ?? null,
          non_workers: inds.non_workers?.value ?? null,

          // Amenities & Infrastructure
          electricity_coverage: inds.household_electricity_coverage?.value ?? null,
          tap_water_coverage: inds.tap_water_coverage_percent?.value ?? null,
          latrine_coverage: inds.latrine_facility_coverage?.value ?? null,
          schools: inds.udise_school_count?.value ?? null,
          school_classrooms_count: inds.udise_total_classrooms?.value ?? null,
          road_coverage_km: inds.village_road_length_km?.value ?? null,
          road_connectivity: inds.road_connectivity_status?.value ?? null,
          broadband_connectivity: inds.bharatnet_gp_connectivity?.value ?? null,
          health_centre: inds.public_health_centre?.value ?? null,
          hospital_beds: inds.hospital_beds_count?.value ?? null,

          indicators: inds,
          categories: govData.categories || {},
          census_baseline: govData.census_baseline || null,
          sources_used: govData.sources_used || [],
          data_summary: govData.data_summary || null,
          isOfficialData: Boolean(govData.census_baseline || govData.data_summary?.has_demographics),
          isLoadingBackend: false,
          tagline: `${matchedName} (${locType}, ${govData.district || district})`,
          description: govData.data_summary?.has_demographics
            ? `Authentic government data from Census 2011, Table HL-11, and Ministry of Education UDISE+ directory.`
            : `Census demographic records unavailable for this village.`,
        };
      } else {
        // Unknown or unmatched location: clean null indicators, no fake numbers
        mergedObj = {
          ...locationOrId,
          gp_id: immediateGpId,
          gp_name: rawName,
          village_name: rawName,
          location_type: locationOrId.location_type || 'Unmatched Location',
          district: district,
          state: locationOrId.state || 'Tamil Nadu',
          population: null,
          total_population: null,
          households: null,
          hl11_households: null,
          schools: null,
          school_classrooms_count: null,
          road_coverage_km: null,
          indicators: {},
          isOfficialData: false,
          isLoadingBackend: false,
          tagline: `${rawName} (Unverified Record)`,
          description: `Official village-level Census and UDISE+ data unavailable for this query.`,
        };
      }

      setLocations((prev) => {
        const list = Array.isArray(prev) ? prev : [];
        const filtered = list.filter((p) => String(p?.gp_name || '').toLowerCase() !== String(mergedObj.gp_name || '').toLowerCase());
        return [mergedObj, ...filtered];
      });

      setSelectedGpId(Number(mergedObj.gp_id));
    } else {
      const gpId = Number(locationOrId);
      if (!gpId) return;
      setSelectedGpId(gpId);
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
    // Search
    searchQuery,
    searchResults,
    isSearching,
    handleSearch,
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
