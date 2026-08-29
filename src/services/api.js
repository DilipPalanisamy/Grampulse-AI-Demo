import axios from 'axios';

// Base URL configured for FastAPI backend (aligned with 127.0.0.1)
const API_BASE_URL = import.meta.env?.VITE_API_BASE_URL || 'http://127.0.0.1:8000/api/v1';

export const apiClient = axios.create({
  baseURL: API_BASE_URL,
  timeout: 20000,
  headers: {
    'Content-Type': 'application/json',
  },
});

/**
 * Live OpenStreetMap Nominatim Geocoding Spatial Search
 */
export const searchSpatialLocation = async (query, state = null) => {
  try {
    const params = { q: query };
    if (state) params.state = state;
    const response = await apiClient.get('/spatial/search', { params });
    return response.data;
  } catch (error) {
    console.error('Error in spatial search:', error);
    return [];
  }
};

/**
 * Live OpenStreetMap Reverse Geocoding for Map Pin Drops
 */
export const reverseGeocodeLocation = async (lat, lng) => {
  try {
    const response = await apiClient.get('/spatial/reverse', {
      params: { lat, lng },
    });
    return response.data;
  } catch (error) {
    console.error('Error in reverse geocoding via backend:', error);
    return null;
  }
};

/**
 * Live Overpass API Infrastructure Fetching
 */
export const fetchSpatialInfrastructure = async (lat, lng, radius = 3500) => {
  try {
    const response = await apiClient.get('/spatial/infrastructure', {
      params: { lat, lng, radius },
    });
    return response.data;
  } catch (error) {
    console.error('Error fetching spatial infrastructure:', error);
    return { counts: {}, markers: [] };
  }
};

/**
 * Resolves or dynamically registers a live village in PostGIS
 */
export const resolveLivePanchayat = async (locationData) => {
  try {
    const response = await apiClient.post('/panchayat/live', locationData);
    return response.data;
  } catch (error) {
    console.error('Error resolving live panchayat:', error);
    return locationData;
  }
};

/**
 * Fetches all registered Gram Panchayats master list.
 */
export const fetchPanchayats = async () => {
  try {
    const response = await apiClient.get('/panchayats');
    return response.data;
  } catch (error) {
    console.error('Error fetching Gram Panchayats:', error);
    return [];
  }
};

/**
 * Fetches geotagged citizen grievances with PostGIS lat/lng and optional radius filtering.
 */
export const fetchCitizenIssues = async (gpId = null, category = null, lat = null, lng = null, radius = null) => {
  try {
    const params = {};
    if (gpId) params.gp_id = gpId;
    if (category && category !== 'ALL') params.category = category;
    if (lat && lng && radius) {
      params.lat = lat;
      params.lng = lng;
      params.radius = radius;
    }

    const response = await apiClient.get('/issues', { params });
    return response.data;
  } catch (error) {
    console.error('Error fetching citizen issues:', error);
    return [];
  }
};

/**
 * Submits a new citizen grievance with GPS coordinates to PostGIS.
 */
export const submitCitizenIssue = async (issueData) => {
  try {
    const response = await apiClient.post('/issues', issueData);
    return response.data;
  } catch (error) {
    console.error('Error submitting citizen issue:', error);
    throw error;
  }
};

/**
 * Fetches Scikit-learn demographic forecasts, infrastructure deficits, and ChromaDB RAG-matched schemes.
 */
export const fetchPanchayatAnalytics = async (gpId, horizonYears = 5, growthRate = 0.018) => {
  try {
    const response = await apiClient.get(`/panchayat/${gpId}/analytics`, {
      params: {
        planning_horizon_years: horizonYears,
        growth_rate: growthRate,
      },
    });
    return response.data;
  } catch (error) {
    console.error(`Error fetching analytics for GP #${gpId}:`, error);
    throw error;
  }
};

/**
 * Sends a message to the AI Village Assistant LLM endpoint.
 */
export const sendChatMessage = async (message, location = {}, chatHistory = []) => {
  try {
    const response = await apiClient.post('/chat', {
      message,
      location,
      chat_history: chatHistory,
    });
    return response.data;
  } catch (error) {
    console.error('Error sending chat message:', error);
    return {
      reply: `I am monitoring ${location.gp_name || 'your Gram Panchayat'}. The server is processing your query against live national governance standards.`,
      provider: 'fallback',
      model: 'rule-engine',
    };
  }
};

/**
 * Downloads official GPDP PDF plan report generated via ReportLab.
 * Triggers native browser file download blob stream.
 */
export const downloadGPDPReport = async (gpId, gpName = 'Panchayat', horizonYears = 5) => {
  try {
    const response = await apiClient.get(`/panchayat/${gpId}/pdf`, {
      params: { planning_horizon_years: horizonYears },
      responseType: 'blob',
    });

    const blob = new Blob([response.data], { type: 'application/pdf' });
    const downloadUrl = window.URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = downloadUrl;
    
    const targetYear = new Date().getFullYear() + Number(horizonYears);
    const sanitizedGp = (gpName || 'Panchayat').replace(/\s+/g, '_');
    link.setAttribute('download', `GPDP_Plan_${sanitizedGp}_${targetYear}.pdf`);
    
    document.body.appendChild(link);
    link.click();
    
    link.remove();
    window.URL.revokeObjectURL(downloadUrl);
    return true;
  } catch (error) {
    console.error(`Error downloading GPDP report for GP #${gpId}:`, error);
    throw error;
  }
};
