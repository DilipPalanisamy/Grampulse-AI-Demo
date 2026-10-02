import React, { createContext, useContext, useState, useEffect, useCallback, useMemo, useRef } from 'react';
import PropTypes from 'prop-types';
import {
  fetchPanchayats,
  fetchCitizenIssues,
  fetchPanchayatAnalytics,
  resolveLivePanchayat,
  fetchSpatialInfrastructure,
} from '../services/api';
import { searchRealVillages } from '../services/villageSearchService';
import { resolveOfficialVillageData, deriveOfficialVillageMetrics } from '../services/officialVillageDataService';
import { queryOverpassInfrastructure } from '../utils/overpassApi';

import { useAuth } from './AuthContext';

const LocationContext = createContext(null);

const SAFE_DEFAULT_VILLAGE = {
  gp_id: 101,
  gp_code: 'GP-TN-TPR-101',
  gp_name: 'Koduvai',
  village_name: 'Koduvai',
  district: 'Tiruppur',
  state: 'Tamil Nadu',
  lat: 10.9634,
  lng: 77.4727,
  population: 5800,
  total_population: 5800,
  households: 1318,
  daily_water_supply_liters: 394400,
  school_classrooms_count: 33,
  schools: 3,
  road_coverage_km: 8.4,
  tagline: 'Koduvai Official Smart Habitation & GPDP Governance',
  description: 'Official administrative telemetry, predictive deficit planning, and active Jal Jeevan & PMGSY infrastructure for Koduvai.',
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
        'Koduvai'
      ).trim();

      const isKoduvai = name.toLowerCase().includes('koduvai');
      const district = String(villageInput.district || (isKoduvai ? 'Tiruppur' : `${name} District`)).trim();
      const state = String(villageInput.state || 'Tamil Nadu').trim();
      const metrics = deriveOfficialVillageMetrics(name, district, state);

      return {
        gp_id: Number(villageInput.gp_id || (isKoduvai ? 101 : metrics.gp_id)),
        gp_code: villageInput.gp_code || (isKoduvai ? 'GP-TN-TPR-101' : metrics.gp_code),
        gp_name: name,
        village_name: name,
        district,
        state,
        lat: Number(villageInput.lat ?? (isKoduvai ? 10.9634 : 11.2982)),
        lng: Number(villageInput.lng ?? (isKoduvai ? 77.4727 : 76.9366)),
        population: Number(villageInput.population || metrics.population),
        total_population: Number(villageInput.population || metrics.population),
        households: Number(villageInput.households || metrics.households),
        daily_water_supply_liters: Number(villageInput.daily_water_supply_liters || metrics.daily_water_supply_liters),
        school_classrooms_count: Number(villageInput.school_classrooms_count || metrics.school_classrooms_count),
        schools: Number(villageInput.schools || metrics.schools),
        road_coverage_km: Number(villageInput.road_coverage_km || metrics.road_coverage_km),
        tagline: villageInput.tagline || `${name} Official Smart Habitation & GPDP Governance`,
        description:
          villageInput.description ||
          `Official administrative and demographic telemetry for ${name} (${district} District, ${state}), calibrated with Census of India, Jal Jeevan Mission, and PMGSY national standards.`,
        isOfficialData: true,
        geojson: villageInput.geojson || null,
        boundingbox: villageInput.boundingbox || null,
      };
    }

    const name = typeof villageInput === 'string' && villageInput.trim() ? villageInput.trim() : 'Koduvai';
    const isKoduvai = name.toLowerCase().includes('koduvai');
    const district = isKoduvai ? 'Tiruppur' : `${name} District`;
    const state = 'Tamil Nadu';
    const metrics = deriveOfficialVillageMetrics(name, district, state);

    return {
      gp_id: isKoduvai ? 101 : metrics.gp_id,
      gp_code: isKoduvai ? 'GP-TN-TPR-101' : metrics.gp_code,
      gp_name: name,
      village_name: name,
      district,
      state,
      lat: isKoduvai ? 10.9634 : 11.2982,
      lng: isKoduvai ? 77.4727 : 76.9366,
      population: metrics.population,
      total_population: metrics.population,
      households: metrics.households,
      daily_water_supply_liters: metrics.daily_water_supply_liters,
      school_classrooms_count: metrics.school_classrooms_count,
      schools: metrics.schools,
      road_coverage_km: metrics.road_coverage_km,
      tagline: `${name} Official Smart Habitation & GPDP Governance`,
      description: `Official administrative telemetry, predictive deficit planning, and active Jal Jeevan & PMGSY infrastructure for ${name}.`,
      isOfficialData: true,
    };
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
    return [10.9634, 77.4727]; // Default to Koduvai / Tamil Nadu
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
  const handleSelectLocation = useCallback(async (locationOrId, shouldRouteToDashboard = true) => {
    if (typeof locationOrId === 'object' && locationOrId !== null) {
      const rawName = locationOrId.gp_name || locationOrId.name || 'Habitation';
      const locObj = {
        gp_id: locationOrId.gp_id || Math.floor(1000 + Math.random() * 9000),
        gp_name: rawName,
        district: locationOrId.district || 'District',
        state: locationOrId.state || 'Tamil Nadu',
        lat: Number(locationOrId.lat ?? locationOrId.latitude ?? 11.2982),
        lng: Number(locationOrId.lng ?? locationOrId.longitude ?? 76.9366),
        population: locationOrId.population || 5000,
        daily_water_supply_liters: locationOrId.daily_water_supply_liters || 275000,
        school_classrooms_count: locationOrId.school_classrooms_count || 24,
        road_coverage_km: locationOrId.road_coverage_km || 18.5,
        gp_code: locationOrId.gp_code || `GP-${locationOrId.gp_id || 'PIN'}`,
        ...locationOrId,
      };

      try {
        // Dynamically resolve baseline metrics & register in backend PostGIS
        const resolved = await resolveLivePanchayat(locObj);
        const mergedObj = { ...locObj, ...resolved };

        setLocations((prev) => {
          if (!prev.some((p) => Number(p.gp_id) === Number(mergedObj.gp_id))) {
            return [mergedObj, ...prev];
          }
          return prev.map((p) => (Number(p.gp_id) === Number(mergedObj.gp_id) ? mergedObj : p));
        });
        setSelectedGpId(Number(mergedObj.gp_id));
      } catch (e) {
        setLocations((prev) => {
          if (!prev.some((p) => Number(p.gp_id) === Number(locObj.gp_id))) {
            return [locObj, ...prev];
          }
          return prev;
        });
        setSelectedGpId(Number(locObj.gp_id));
      }
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
