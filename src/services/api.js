import axios from 'axios';

// Base URL configured for FastAPI backend (aligned with 127.0.0.1)
const API_BASE_URL = import.meta.env?.VITE_API_BASE_URL || 'http://127.0.0.1:8000/api/v1';

export const apiClient = axios.create({
  baseURL: API_BASE_URL,
  timeout: 15000,
  headers: {
    'Content-Type': 'application/json',
  },
});

/**
 * Fetches all registered Gram Panchayats master list.
 */
export const fetchPanchayats = async () => {
  try {
    const response = await apiClient.get('/panchayats');
    return response.data;
  } catch (error) {
    console.error('Error fetching Gram Panchayats:', error);
    // Fallback default list if backend is momentarily unreachable
    return [
      { gp_id: 1, gp_code: 'GP-MH-AHM-001', gp_name: 'Hiware Bazar', district: 'Ahmednagar', state: 'Maharashtra' },
      { gp_id: 2, gp_code: 'GP-GJ-SAB-002', gp_name: 'Punsari', district: 'Sabarkantha', state: 'Gujarat' },
      { gp_id: 3, gp_code: 'GP-ML-EKH-003', gp_name: 'Mawlynnong', district: 'East Khasi Hills', state: 'Meghalaya' },
      { gp_id: 4, gp_code: 'GP-TN-CBE-004', gp_name: 'Odanthurai', district: 'Coimbatore', state: 'Tamil Nadu' },
      { gp_id: 5, gp_code: 'GP-RJ-RAJ-005', gp_name: 'Piplantri', district: 'Rajsamand', state: 'Rajasthan' },
    ];
  }
};

/**
 * Fetches geotagged citizen grievances with PostGIS lat/lng for map display.
 */
export const fetchCitizenIssues = async (gpId = null, category = null) => {
  try {
    const params = {};
    if (gpId) params.gp_id = gpId;
    if (category && category !== 'ALL') params.category = category;

    const response = await apiClient.get('/issues', { params });
    return response.data;
  } catch (error) {
    console.error('Error fetching citizen issues:', error);
    return [];
  }
};

/**
 * Submits a new citizen grievance with GPS coordinates.
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
 * Fetches demographic forecasts, infrastructure deficits, and AI-matched schemes.
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
 * Downloads official GPDP PDF plan report generated via ReportLab.
 * Triggers native browser file download blob stream.
 */
export const downloadGPDPReport = async (gpId, gpName = 'Panchayat', horizonYears = 5) => {
  try {
    const response = await apiClient.get(`/panchayat/${gpId}/pdf`, {
      params: { planning_horizon_years: horizonYears },
      responseType: 'blob',
    });

    // Create a temporary anchor element to trigger the download
    const blob = new Blob([response.data], { type: 'application/pdf' });
    const downloadUrl = window.URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = downloadUrl;
    
    // Format sanitized filename
    const targetYear = new Date().getFullYear() + Number(horizonYears);
    const sanitizedGp = gpName.replace(/\s+/g, '_');
    link.setAttribute('download', `GPDP_Plan_${sanitizedGp}_${targetYear}.pdf`);
    
    document.body.appendChild(link);
    link.click();
    
    // Clean up memory
    link.remove();
    window.URL.revokeObjectURL(downloadUrl);
    return true;
  } catch (error) {
    console.error(`Error downloading GPDP report for GP #${gpId}:`, error);
    throw error;
  }
};
