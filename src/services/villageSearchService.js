import axios from 'axios';
import { searchSpatialLocation } from './api';

// In-memory search cache for instant responses
const SEARCH_RESULTS_CACHE = new Map();

/**
 * Searches real-world Indian villages, towns, and cities via live OpenStreetMap Nominatim
 * and backend GIS spatial geocoding engine.
 */
export const searchRealVillages = async (query = '', stateFilter = '') => {
  const cleanQ = (query || '').trim();
  if (!cleanQ || cleanQ.length < 2) {
    return [];
  }

  const cacheKey = `${cleanQ.toLowerCase()}_${stateFilter.toLowerCase()}`;
  if (SEARCH_RESULTS_CACHE.has(cacheKey)) {
    return SEARCH_RESULTS_CACHE.get(cacheKey);
  }

  // 1. First attempt query via Backend Spatial API
  try {
    const backendResults = await searchSpatialLocation(cleanQ, stateFilter);
    if (Array.isArray(backendResults) && backendResults.length > 0) {
      const formatted = backendResults.map((item) => ({
        gp_id: item.gp_id,
        gp_code: item.gp_code,
        gp_name: item.gp_name,
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
    console.warn('Backend spatial search fallback to direct OSM Nominatim:', backendErr);
  }

  // 2. Direct Query to OpenStreetMap Nominatim Geocoding API
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
          district: district,
          state: state,
          lat: lat,
          lng: lng,
          geojson: item.geojson,
          boundingbox: item.boundingbox,
          tagline: `Real Geospatial Habitation (${district}, ${state})`,
          description: `Live geocoded settlement at ${lat.toFixed(4)}°N, ${lng.toFixed(4)}°E connected to PostGIS & MoPR spatial network.`,
          isLiveGeocoded: true,
        };
      });

    SEARCH_RESULTS_CACHE.set(cacheKey, liveResults);
    return liveResults;
  } catch (err) {
    console.error('Live Nominatim geocoding error:', err);
    return [];
  }
};
