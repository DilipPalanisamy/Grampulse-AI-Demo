import React, { createContext, useContext, useState, useEffect, useCallback, useMemo, useRef } from 'react';
import PropTypes from 'prop-types';
import {
  fetchPanchayats,
  fetchCitizenIssues,
  fetchPanchayatAnalytics,
} from '../services/api';
import {
  TAMIL_NADU_VILLAGES_DATABASE,
  searchRealVillages,
} from '../services/villageSearchService';

const LocationContext = createContext(null);

export const LocationProvider = ({ children }) => {
  const [locations, setLocations] = useState(TAMIL_NADU_VILLAGES_DATABASE);
  // Default to Odanthurai, Coimbatore, Tamil Nadu
  const [selectedGpId, setSelectedGpId] = useState(4);
  const [planningHorizon, setPlanningHorizon] = useState(5);
  const [analytics, setAnalytics] = useState(null);
  const [issues, setIssues] = useState([]);
  const [categoryFilter, setCategoryFilter] = useState('ALL');
  const [loadingAnalytics, setLoadingAnalytics] = useState(true);
  const [loadingIssues, setLoadingIssues] = useState(true);
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
      TAMIL_NADU_VILLAGES_DATABASE.find((l) => Number(l.gp_id) === Number(selectedGpId)) ||
      locations[0] ||
      TAMIL_NADU_VILLAGES_DATABASE[0]
    );
  }, [locations, selectedGpId]);

  // Center Coordinates for Map
  const mapCenter = useMemo(() => {
    if (selectedLocation?.lat && selectedLocation?.lng) {
      return [Number(selectedLocation.lat), Number(selectedLocation.lng)];
    }
    return [11.2982, 76.9366]; // Default to Odanthurai, Tamil Nadu
  }, [selectedLocation]);

  // Load Analytics when selected GP or planning horizon changes
  const loadAnalytics = useCallback(async () => {
    if (!selectedGpId) return;
    setLoadingAnalytics(true);
    try {
      const data = await fetchPanchayatAnalytics(selectedGpId, planningHorizon);
      // Ensure the returned analytics object carries the active location's real demographic data if custom
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

  const debounceTimeoutRef = useRef(null);

  /**
   * Search real villages by name, district, or keywords (with 250ms debounce & memory cache)
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
   * Switches active location by ID or location object
   */
  const selectLocation = useCallback((locationOrId) => {
    if (typeof locationOrId === 'object') {
      const locObj = locationOrId;
      // If it's a freshly searched/geocoded location, append to list if not present
      setLocations((prev) => {
        if (!prev.some((p) => Number(p.gp_id) === Number(locObj.gp_id))) {
          return [locObj, ...prev];
        }
        return prev;
      });
      setSelectedGpId(Number(locObj.gp_id));
    } else {
      const gpId = Number(locationOrId);
      if (!gpId) return;
      setSelectedGpId(gpId);
    }
  }, []);

  const handleIssueCreated = useCallback((newIssue) => {
    setIssues((prev) => [newIssue, ...prev]);
  }, []);

  const value = {
    locations,
    selectedLocation,
    selectedGpId,
    mapCenter,
    selectLocation,
    planningHorizon,
    setPlanningHorizon,
    analytics,
    loadingAnalytics,
    issues,
    loadingIssues,
    categoryFilter,
    setCategoryFilter,
    isReportModalOpen,
    setIsReportModalOpen,
    loadAnalytics,
    loadIssues,
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
