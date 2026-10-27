import axios from 'axios';
import { searchSpatialLocation, reverseGeocodeLocation } from './api';
import { searchCensusDirectory, findCensusRecord } from './censusDirectoryService';

// In-memory search cache for instant responses
const SEARCH_RESULTS_CACHE = new Map();
const REVERSE_GEOCODE_CACHE = new Map();

const getBackendBaseUrl = () => {
  const envUrl = import.meta.env?.VITE_API_BASE_URL;
  if (envUrl) {
    return envUrl.replace(/\/api\/v1\/?$/, '');
  }
  return 'http://127.0.0.1:8000';
};

/**
 * Searches real-world Indian villages and towns via the official FastAPI Census directory.
 * Connects directly to GET /village/search?query=<query>.
 */
export const searchRealVillages = async (query = '', districtFilter = '', stateFilter = 'Tamil Nadu') => {
  const cleanQ = (query || '').trim();
  if (!cleanQ || cleanQ.length < 2) {
    return [];
  }

  const cacheKey = `${cleanQ.toLowerCase()}_${String(districtFilter || '').toLowerCase()}_${stateFilter.toLowerCase()}`;
  if (SEARCH_RESULTS_CACHE.has(cacheKey)) {
    return SEARCH_RESULTS_CACHE.get(cacheKey);
  }

  // 1. PRIMARY: Query existing FastAPI Backend Official Census Search Endpoint
  try {
    const backendBase = getBackendBaseUrl();
    const searchUrl = `${backendBase}/village/search?query=${encodeURIComponent(cleanQ)}&limit=15`;
    console.log(`[API REQUEST] GET ${searchUrl}`);
    const params = { query: cleanQ, limit: 15 };
    if (districtFilter && districtFilter !== 'All Districts' && districtFilter !== 'Tamil Nadu') {
      params.district = districtFilter;
    }
    const res = await axios.get(`${backendBase}/village/search`, {
      params,
      timeout: 2000,
    });

    if (res.data && res.data.status && Array.isArray(res.data.results) && res.data.results.length > 0) {
      // Prioritize Town Panchayat and Villages over individual municipal wards
      const sortedItems = [...res.data.results].sort((a, b) => {
        const aIsWard = a.level === 'WARD' || Boolean(a.is_ward);
        const bIsWard = b.level === 'WARD' || Boolean(b.is_ward);
        if (aIsWard !== bIsWard) return aIsWard ? 1 : -1;
        const aExact = String(a.name || '').toLowerCase() === cleanQ.toLowerCase();
        const bExact = String(b.name || '').toLowerCase() === cleanQ.toLowerCase();
        if (aExact !== bExact) return aExact ? -1 : 1;
        return (Number(b.population) || 0) - (Number(a.population) || 0);
      });

      console.log(`[API RESPONSE] 200 OK from ${searchUrl}: ${sortedItems.length} records returned. Top result:`, {
        name: sortedItems[0]?.name,
        level: sortedItems[0]?.level,
        census_code: sortedItems[0]?.census_code,
        population: sortedItems[0]?.population,
      });

      const formatted = sortedItems.map((item, idx) => {
        const censusCode = item.census_code || null;
        const censusRec = findCensusRecord(censusCode || item.name, item.district);
        const gpId = censusCode ? parseInt(censusCode, 10) : (censusRec?.gp_id || 1000 + idx);
        const isWard = item.level === 'WARD' || Boolean(item.is_ward);
        const locType = item.level === 'TOWN' ? 'Town Panchayat' : (isWard ? 'Municipal Ward' : (item.level || censusRec?.location_type || 'Village'));
        const pop = item.population ?? censusRec?.population ?? null;
        const hh = item.households ?? censusRec?.households ?? null;

        return {
          ...censusRec,
          gp_id: gpId,
          gp_code: censusCode ? `CENSUS-${censusCode}` : (censusRec?.gp_code || `GP-${gpId}`),
          gp_name: item.name,
          village_name: item.name,
          raw_name: item.raw_name || item.name,
          location_type: locType,
          level: item.level,
          is_ward: isWard,
          census_code: censusCode || censusRec?.census_code || null,
          subdistrict_code: item.subdistrict_code || censusRec?.subdistrict_code || null,
          district: item.district || censusRec?.district || 'Tamil Nadu',
          state: item.state || 'Tamil Nadu',
          population: pop,
          households: hh,
          reference_year: item.reference_year || 2011,
          source: item.source || 'Census of India 2011 Primary Census Abstract',
          isOfficialCensus: true,
          tagline: `${item.name} (${locType}, ${item.district || 'Tamil Nadu'})`,
          description: `Authentic Census 2011 record: Pop ${pop ? pop.toLocaleString() : 'N/A'}, HH ${hh ? hh.toLocaleString() : 'N/A'}. Ref Year: ${item.reference_year || 2011}.`,
          lat: censusRec?.lat ?? (11.05 + (idx * 0.02)),
          lng: censusRec?.lng ?? (77.05 + (idx * 0.02)),
        };
      });

      SEARCH_RESULTS_CACHE.set(cacheKey, formatted);
      return formatted;
    }
  } catch (backendErr) {
    console.warn(`[API ERROR] FastAPI backend Census search failed for '${cleanQ}':`, backendErr?.message || backendErr);
  }

  // 2. SECONDARY: Client-Side Authentic Census Directory Lookup across all 38 districts
  const censusMatches = searchCensusDirectory(cleanQ, districtFilter, 15);
  if (censusMatches.length > 0) {
    SEARCH_RESULTS_CACHE.set(cacheKey, censusMatches);
    return censusMatches;
  }

  // 3. TERTIARY: Backend Spatial GIS Search Fallback
  try {
    const backendResults = await searchSpatialLocation(cleanQ, stateFilter);
    if (Array.isArray(backendResults) && backendResults.length > 0) {
      const formatted = backendResults.map((item) => ({
        gp_id: item.gp_id,
        gp_code: item.gp_code,
        gp_name: item.gp_name,
        village_name: item.gp_name,
        district: item.district,
        state: item.state,
        lat: item.lat,
        lng: item.lng,
        geojson: item.geojson,
        boundingbox: item.boundingbox,
        isLiveGeocoded: true,
      }));
      SEARCH_RESULTS_CACHE.set(cacheKey, formatted);
      return formatted;
    }
  } catch (backendErr) {
    // Continue to OSM Nominatim
  }

  // 3. TERTIARY: OpenStreetMap Nominatim Live Geocoding Fallback
  try {
    const searchUrl = 'https://nominatim.openstreetmap.org/search';
    const searchQuery = stateFilter ? `${cleanQ}, ${stateFilter}, India` : `${cleanQ}, India`;

    const response = await axios.get(searchUrl, {
      params: {
        q: searchQuery,
        format: 'jsonv2',
        polygon_geojson: 1,
        addressdetails: 1,
        limit: 8,
        countrycodes: 'in',
      },
      headers: {
        'Accept-Language': 'en',
        'User-Agent': 'GramPulse-AI-Platform/2.0 (mopr-portal@grampulse.gov.in)',
      },
      timeout: 7000,
    });

    const liveResults = (response.data || [])
      .filter((item) => item.lat && item.lon)
      .map((item, idx) => {
        const addr = item.address || {};
        const name =
          addr.village ||
          addr.town ||
          addr.hamlet ||
          addr.suburb ||
          addr.city ||
          addr.county ||
          item.name ||
          item.display_name.split(',')[0];

        const district = (
          addr.county ||
          addr.state_district ||
          addr.district ||
          'District'
        ).replace('District', '').trim();

        const state = addr.state || 'India';
        const lat = parseFloat(item.lat);
        const lng = parseFloat(item.lon);
        const osmId = Math.abs(parseInt(item.osm_id || idx + 1000, 10));
        const gpId = 9000 + (osmId % 90000);

        return {
          gp_id: gpId,
          gp_code: `GP-${String(gpId % 1000).padStart(3, '0')}`,
          gp_name: name,
          village_name: name,
          district: district,
          state: state,
          lat: lat,
          lng: lng,
          geojson: item.geojson,
          boundingbox: item.boundingbox,
          tagline: `Real Settlement (${district}, ${state})`,
          description: `Geocoded settlement at ${lat.toFixed(4)}°N, ${lng.toFixed(4)}°E.`,
          isLiveGeocoded: true,
        };
      });

    SEARCH_RESULTS_CACHE.set(cacheKey, liveResults);
    return liveResults;
  } catch (err) {
    console.error('Village search geocoding error:', err);
    return [];
  }
};

/**
 * Reverse geocodes exact coordinates into administrative metadata (village, district, state)
 */
export const reverseGeocodeCoordinates = async (lat, lng) => {
  const cacheKey = `${lat.toFixed(4)}_${lng.toFixed(4)}`;
  if (REVERSE_GEOCODE_CACHE.has(cacheKey)) {
    return REVERSE_GEOCODE_CACHE.get(cacheKey);
  }

  // 1. Try Backend reverse route first
  try {
    const backendResult = await reverseGeocodeLocation(lat, lng);
    if (backendResult && backendResult.gp_name) {
      REVERSE_GEOCODE_CACHE.set(cacheKey, backendResult);
      return backendResult;
    }
  } catch (e) {
    console.warn('Backend reverse geocoding fallback to OSM:', e);
  }

  // 2. Direct Nominatim Reverse Geocoding
  try {
    const url = 'https://nominatim.openstreetmap.org/reverse';
    const response = await axios.get(url, {
      params: {
        lat,
        lon: lng,
        format: 'jsonv2',
        addressdetails: 1,
        polygon_geojson: 1,
      },
      headers: {
        'Accept-Language': 'en',
      },
      timeout: 6000,
    });

    const item = response.data || {};
    const addr = item.address || {};
    const name =
      addr.village ||
      addr.town ||
      addr.hamlet ||
      addr.suburb ||
      addr.city ||
      addr.county ||
      item.name ||
      'Pinned Location';

    const district = (
      addr.county ||
      addr.state_district ||
      addr.district ||
      'District'
    ).replace('District', '').trim();

    const state = addr.state || 'India';
    const osmId = Math.abs(parseInt(item.osm_id || 1000, 10));
    const gpId = 9000 + (osmId % 90000);

    const result = {
      gp_id: gpId,
      gp_code: `GP-PIN-${String(gpId % 1000).padStart(3, '0')}`,
      gp_name: name,
      village_name: name,
      district: district,
      state: state,
      lat: Number(lat),
      lng: Number(lng),
      display_name: item.display_name || `${name}, ${district}, ${state}`,
      geojson: item.geojson || null,
      isLiveGeocoded: true,
      isManualPin: true,
    };

    REVERSE_GEOCODE_CACHE.set(cacheKey, result);
    return result;
  } catch (err) {
    console.error('Direct OSM reverse geocoding error:', err);
    return {
      gp_id: 9999,
      gp_code: 'GP-PIN-MANUAL',
      gp_name: `Point (${lat.toFixed(3)}, ${lng.toFixed(3)})`,
      village_name: `Point (${lat.toFixed(3)}, ${lng.toFixed(3)})`,
      district: 'Local District',
      state: 'India',
      lat: Number(lat),
      lng: Number(lng),
      isLiveGeocoded: true,
      isManualPin: true,
    };
  }
};
