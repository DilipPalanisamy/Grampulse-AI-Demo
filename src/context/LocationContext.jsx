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
import { queryOverpassInfrastructure } from '../utils/overpassApi';

const LocationContext = createContext(null);

const DEFAULT_INITIAL_VILLAGE = {
  gp_id: 4,
  gp_code: 'GP-TN-CBE-004',
  gp_name: 'Odanthurai',
  district: 'Coimbatore',
  state: 'Tamil Nadu',
  lat: 11.2982,
  lng: 76.9366,
  population: 6820,
  households: 1530,
  daily_water_supply_liters: 430000.0,
  school_classrooms_count: 34,
  road_coverage_km: 34.8,
  tagline: 'Self-Powered Green Energy & Windmill Grid Pioneer',
};

export const LocationProvider = ({ children }) => {
  const [locations, setLocations] = useState([DEFAULT_INITIAL_VILLAGE]);
  const [selectedGpId, setSelectedGpId] = useState(4);
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

  // Active Location Object
  const selectedLocation = useMemo(() => {
    return (
      locations.find((l) => Number(l.gp_id) === Number(selectedGpId)) ||
      locations[0] ||
      DEFAULT_INITIAL_VILLAGE
    );
  }, [locations, selectedGpId]);

  // Center Coordinates for Map
  const mapCenter = useMemo(() => {
    if (selectedLocation?.lat && selectedLocation?.lng) {
      return [Number(selectedLocation.lat), Number(selectedLocation.lng)];
    }
    return [11.2982, 76.9366]; // Default to Odanthurai, Tamil Nadu
  }, [selectedLocation]);

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

  // Load Analytics when selected GP or planning horizon changes
  const loadAnalytics = useCallback(async () => {
    if (!selectedGpId) return;
    setLoadingAnalytics(true);
    try {
      const data = await fetchPanchayatAnalytics(selectedGpId, planningHorizon);
      if (selectedLocation) {
        data.gp_name = selectedLocation.gp_name;
        data.district = selectedLocation.district;
        data.state = selectedLocation.state;
      }
      setAnalytics(data);
    } catch (err) {
      console.error(`Error loading analytics for GP #${selectedGpId}:`, err);
    } finally {
      setLoadingAnalytics(false);
    }
  }, [selectedGpId, planningHorizon, selectedLocation]);

  useEffect(() => {
    loadAnalytics();
  }, [loadAnalytics]);

  // Load Citizen Issues for the active GP
  const loadIssues = useCallback(async () => {
    setLoadingIssues(true);
    try {
      const data = await fetchCitizenIssues(selectedGpId, categoryFilter);
      setIssues(data);
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
  const loadInfrastructure = useCallback(async () => {
    if (!selectedLocation?.lat || !selectedLocation?.lng) return;
    setLoadingInfrastructure(true);
    try {
      const data = await queryOverpassInfrastructure(
        Number(selectedLocation.lat),
        Number(selectedLocation.lng),
        5000
      );
      setInfrastructure(data);
    } catch (err) {
      console.error('Error loading live infrastructure nodes:', err);
    } finally {
      setLoadingInfrastructure(false);
    }
  }, [selectedLocation]);

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
