import React, { useState, useEffect, useMemo, useCallback } from 'react';
import PropTypes from 'prop-types';
import { MapContainer, TileLayer, Marker, Popup, GeoJSON, useMap, useMapEvents } from 'react-leaflet';
import MarkerClusterGroup from 'react-leaflet-cluster';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import {
  Compass,
  Users,
  Droplets,
  GraduationCap,
  Route,
  ArrowRight,
  Sparkles,
  MapPin,
  Layers,
  Globe,
  Sun,
  Moon,
  Mountain,
  HeartPulse,
  Trash2,
  Crosshair,
  Search,
  CheckCircle2,
  Loader2,
  Activity,
  Plus,
  Minus,
} from 'lucide-react';
import { useLocation } from '../context/LocationContext';
import { reverseGeocodeCoordinates } from '../services/villageSearchService';

// =============================================================================
// Fix Leaflet's default marker asset paths in React / Bundlers
// =============================================================================
delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-icon-2x.png',
  iconUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-icon.png',
  shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-shadow.png',
});

// =============================================================================
// Map Tile Layer Providers (Satellite, Streets, Dark GIS, Terrain)
// =============================================================================
export const MAP_PROVIDERS = {
  satellite: {
    name: 'Satellite',
    icon: Globe,
    url: 'https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}',
    attribution: 'Tiles &copy; Esri, Maxar, Earthstar Geographics, USDA, USGS, AeroGRID, IGN',
    maxNativeZoom: 17,
    maxZoom: 20,
    hasOverlayLabels: true,
    overlayUrl: 'https://server.arcgisonline.com/ArcGIS/rest/services/Reference/World_Boundaries_and_Places/MapServer/tile/{z}/{y}/{x}',
  },
  streets: {
    name: 'Streets',
    icon: Sun,
    url: 'https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png',
    attribution: '&copy; OpenStreetMap contributors',
    maxNativeZoom: 19,
    maxZoom: 20,
    hasOverlayLabels: false,
  },
  dark: {
    name: 'Dark GIS',
    icon: Moon,
    url: 'https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png',
    attribution: '&copy; OpenStreetMap contributors &copy; CARTO',
    maxNativeZoom: 19,
    maxZoom: 20,
    hasOverlayLabels: false,
  },
  terrain: {
    name: 'Terrain',
    icon: Mountain,
    url: 'https://{s}.tile.opentopomap.org/{z}/{x}/{y}.png',
    attribution: 'Map data: &copy; OpenStreetMap contributors, SRTM | Map style: &copy; OpenTopoMap (CC-BY-SA)',
    maxNativeZoom: 16,
    maxZoom: 20,
    hasOverlayLabels: false,
  },
};

// =============================================================================
// Category Color Themes & Icons
// =============================================================================
export const CATEGORY_THEMES = {
  water: {
    name: 'Water Supply',
    primaryColor: '#2563eb', // Blue-600
    badgeBg: 'bg-blue-100 text-blue-800 border-blue-200',
    dotColor: 'bg-blue-500',
    iconSvg: `<path d="M12 2.69l5.66 5.66a8 8 0 1 1-11.31 0z" fill="currentColor"/>`,
  },
  road: {
    name: 'Roads & Infrastructure',
    primaryColor: '#ea580c', // Orange-600
    badgeBg: 'bg-orange-100 text-orange-800 border-orange-200',
    dotColor: 'bg-orange-500',
    iconSvg: `<path d="M4 19h16v2H4zm2-14h12l1 12H5zm5 2h2v3h-2zm0 5h2v3h-2z" fill="currentColor"/>`,
  },
  education: {
    name: 'Education',
    primaryColor: '#9333ea', // Purple-600
    badgeBg: 'bg-purple-100 text-purple-800 border-purple-200',
    dotColor: 'bg-purple-500',
    iconSvg: `<path d="M12 3L1 9l11 6 9-4.91V17h2V9z M5 13.18v4L12 21l7-3.82v-4L12 17z" fill="currentColor"/>`,
  },
  sanitation: {
    name: 'Sanitation',
    primaryColor: '#dc2626', // Red-600
    badgeBg: 'bg-red-100 text-red-800 border-red-200',
    dotColor: 'bg-red-500',
    iconSvg: `<path d="M19 4h-3.5l-1-1h-5l-1 1H5v2h14M6 19a2 2 0 0 0 2 2h8a2 2 0 0 0 2-2V7H6v12z" fill="currentColor"/>`,
  },
  healthcare: {
    name: 'Healthcare',
    primaryColor: '#10b981', // Emerald-500
    badgeBg: 'bg-emerald-100 text-emerald-800 border-emerald-200',
    dotColor: 'bg-emerald-500',
    iconSvg: `<path d="M19 10.5h-4.5V6a1.5 1.5 0 0 0-3 0v4.5H7a1.5 1.5 0 0 0 0 3h4.5V18a1.5 1.5 0 0 0 3 0v-4.5H19a1.5 1.5 0 0 0 0-3z" fill="currentColor"/>`,
  },
  default: {
    name: 'General / Other',
    primaryColor: '#4b5563', // Gray-600
    badgeBg: 'bg-gray-100 text-gray-800 border-gray-200',
    dotColor: 'bg-gray-500',
    iconSvg: `<path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm1 15h-2v-6h2v6zm0-8h-2V7h2v2z" fill="currentColor"/>`,
  },
};

export const getCategoryTheme = (category = '') => {
  const catLower = (category || '').toLowerCase();
  if (catLower.includes('water')) return CATEGORY_THEMES.water;
  if (catLower.includes('road') || catLower.includes('infra')) return CATEGORY_THEMES.road;
  if (catLower.includes('educat') || catLower.includes('school')) return CATEGORY_THEMES.education;
  if (catLower.includes('sanit') || catLower.includes('waste') || catLower.includes('clean'))
    return CATEGORY_THEMES.sanitation;
  if (catLower.includes('health') || catLower.includes('clinic') || catLower.includes('hospital'))
    return CATEGORY_THEMES.healthcare;
  return CATEGORY_THEMES.default;
};

export const getStatusBadge = (status = 'OPEN') => {
  const normalized = (status || 'OPEN').toUpperCase();
  switch (normalized) {
    case 'RESOLVED':
      return {
        label: 'Resolved',
        classes: 'bg-emerald-100 text-emerald-800 border-emerald-300',
        dot: 'bg-emerald-500',
      };
    case 'IN_PROGRESS':
      return {
        label: 'In Progress',
        classes: 'bg-amber-100 text-amber-800 border-amber-300',
        dot: 'bg-amber-500 animate-pulse',
      };
    case 'REJECTED':
      return {
        label: 'Rejected',
        classes: 'bg-rose-100 text-rose-800 border-rose-300',
        dot: 'bg-rose-500',
      };
    case 'OPEN':
    default:
      return {
        label: 'Open',
        classes: 'bg-red-100 text-red-800 border-red-300',
        dot: 'bg-red-500 animate-ping',
      };
  }
};

/**
 * Custom DivIcon for Village Center Hubs
 */
export const buildVillageHubIcon = (villageName = 'Habitation', state = 'Tamil Nadu', isSelected = false) => {
  const safeName = String(villageName || 'Habitation');
  const safeState = String(state || 'Tamil Nadu');
  const isTN = safeState.toLowerCase().includes('tamil');
  const pulseClass = isSelected ? 'ring-4 ring-emerald-400/80 scale-110 shadow-emerald-500/50' : '';
  const bgColor = isSelected ? 'bg-emerald-600' : 'bg-slate-900';
  const borderColor = isSelected ? 'border-emerald-300' : isTN ? 'border-emerald-500/70' : 'border-slate-600';

  const html = `
    <div class="relative flex flex-col items-center group cursor-pointer transition-transform duration-200 hover:scale-115">
      <div class="flex items-center gap-1.5 px-2.5 py-1 rounded-full ${bgColor} ${borderColor} border-2 text-white text-[11px] font-black shadow-2xl backdrop-blur-md ${pulseClass}">
        <span class="w-2 h-2 rounded-full ${isSelected ? 'bg-emerald-300 animate-ping' : isTN ? 'bg-amber-400' : 'bg-emerald-400'}"></span>
        <span class="tracking-tight whitespace-nowrap">${safeName}</span>
      </div>
      <div class="w-2.5 h-2.5 ${isSelected ? 'bg-emerald-500' : isTN ? 'bg-amber-500' : 'bg-slate-700'} rotate-45 -mt-1 shadow-md"></div>
    </div>
  `;

  return L.divIcon({
    html,
    className: 'custom-village-hub-pin',
    iconSize: [120, 36],
    iconAnchor: [60, 34],
    popupAnchor: [0, -32],
  });
};

/**
 * Custom DivIcon for Manually Dropped Map Pin
 */
export const buildDroppedPinIcon = (locationName = 'Pinned Location', isSelected = true) => {
  const safeName = String(locationName || 'Pinned Location');
  const html = `
    <div class="relative flex flex-col items-center group cursor-pointer animate-bounce">
      <div class="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-rose-600 border-2 border-white text-white text-xs font-black shadow-2xl backdrop-blur-md ring-4 ring-rose-500/50">
        <span class="w-2 h-2 rounded-full bg-white animate-ping"></span>
        <span class="tracking-tight whitespace-nowrap">${safeName}</span>
      </div>
      <div class="w-3 h-3 bg-rose-600 rotate-45 -mt-1.5 border-r-2 border-b-2 border-white shadow-md"></div>
      <div class="w-6 h-2 bg-black/40 rounded-full blur-xs mt-0.5"></div>
    </div>
  `;

  return L.divIcon({
    html,
    className: 'custom-dropped-pin',
    iconSize: [140, 48],
    iconAnchor: [70, 44],
    popupAnchor: [0, -42],
  });
};

/**
 * Custom SVG DivIcon for Live Infrastructure Nodes (Overpass API)
 */
export const buildInfrastructureIcon = (type) => {
  const theme = getCategoryTheme(type);
  const html = `
    <div class="relative flex items-center justify-center filter drop-shadow-md">
      <div class="w-6 h-6 rounded-full border border-white/80 shadow-md flex items-center justify-center text-white" style="background-color: ${theme.primaryColor};">
        <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5">
          ${theme.iconSvg}
        </svg>
      </div>
    </div>
  `;

  return L.divIcon({
    html,
    className: 'custom-infra-pin',
    iconSize: [24, 24],
    iconAnchor: [12, 12],
    popupAnchor: [0, -12],
  });
};

/**
 * Custom SVG DivIcon for Geotagged Grievance Pins
 */
export const buildCategoryIcon = (category) => {
  const theme = getCategoryTheme(category);
  const svgHtml = `
    <div class="relative flex items-center justify-center filter drop-shadow-md transition-transform duration-200 hover:scale-110">
      <svg width="30" height="38" viewBox="0 0 34 42" fill="none" xmlns="http://www.w3.org/2000/svg">
        <path d="M17 0C7.61 0 0 7.61 0 17C0 29.75 17 42 17 42C17 42 34 29.75 34 17C34 7.61 26.39 0 17 0Z" fill="${theme.primaryColor}"/>
        <circle cx="17" cy="17" r="13" fill="#ffffff"/>
        <g transform="translate(7.5, 7.5) scale(0.8)" fill="${theme.primaryColor}">
          ${theme.iconSvg}
        </g>
      </svg>
    </div>
  `;

  return L.divIcon({
    html: svgHtml,
    className: 'custom-map-pin',
    iconSize: [30, 38],
    iconAnchor: [15, 38],
    popupAnchor: [0, -34],
  });
};

const createCustomClusterIcon = (cluster) => {
  const count = cluster.getChildCount();
  let sizeClass = 'w-9 h-9 text-xs';
  let badgeColor = 'bg-emerald-600/95 border-emerald-400';

  if (count > 25) {
    sizeClass = 'w-12 h-12 text-sm';
    badgeColor = 'bg-rose-600/95 border-rose-400';
  } else if (count > 10) {
    sizeClass = 'w-10 h-10 text-xs';
    badgeColor = 'bg-amber-600/95 border-amber-400';
  }

  return L.divIcon({
    html: `
      <div class="flex items-center justify-center ${sizeClass} ${badgeColor} text-white font-bold rounded-full border-2 shadow-xl backdrop-blur-sm transition-transform duration-200 hover:scale-110 cursor-pointer">
        <span>${count}</span>
      </div>
    `,
    className: 'custom-cluster-marker',
    iconSize: L.point(44, 44, true),
  });
};

// =============================================================================
// MapViewController - Handles Dynamic Smooth Flying & Container Invalidation
// =============================================================================
const MapViewController = ({ center, zoom }) => {
  const map = useMap();

  useEffect(() => {
    if (!map) return;
    const timer = setTimeout(() => {
      map.invalidateSize();
    }, 200);

    const handleResize = () => map.invalidateSize();
    window.addEventListener('resize', handleResize);

    return () => {
      clearTimeout(timer);
      window.removeEventListener('resize', handleResize);
    };
  }, [map]);

  // Smooth FlyTo Pan & Zoom Animation when Center Coordinates change
  useEffect(() => {
    if (center && center.length === 2 && !isNaN(center[0]) && !isNaN(center[1])) {
      map.flyTo(center, zoom, {
        animate: true,
        duration: 1.2,
      });
    }
  }, [center, zoom, map]);

  return null;
};

// =============================================================================
// MapEventsHandler - Handles Manual Pin Drop Click Listener & Cursor Mode
// =============================================================================
const MapEventsHandler = ({ isPinningMode, onMapClick }) => {
  const map = useMap();

  useEffect(() => {
    const container = map.getContainer();
    if (isPinningMode) {
      container.classList.add('cursor-crosshair');
    } else {
      container.classList.remove('cursor-crosshair');
    }
    return () => {
      container.classList.remove('cursor-crosshair');
    };
  }, [isPinningMode, map]);

  useMapEvents({
    click: (e) => {
      if (onMapClick) {
        onMapClick(e.latlng);
      }
    },
  });

  return null;
};

// =============================================================================
// MapZoomNavigationControl - Sleek Floating Zoom (+ / -) & Recenter Dock
// =============================================================================
const MapZoomNavigationControl = ({ safeCenter, defaultZoom = 14, isMapPage = false, gpName = 'Village' }) => {
  const map = useMap();

  return (
    <div
      className={`absolute ${
        isMapPage ? 'bottom-20' : 'bottom-4'
      } right-4 sm:right-6 z-[1000] pointer-events-auto flex flex-col items-center gap-1.5 bg-[var(--bg-card-glass)] backdrop-blur-xl p-1.5 rounded-2xl border border-[var(--border-strong)] shadow-2xl transition-all`}
    >
      <button
        type="button"
        onClick={() => map.zoomIn()}
        className="w-8 h-8 rounded-xl bg-[var(--bg-primary)] hover:bg-[var(--bg-card-hover)] text-[var(--text-main)] hover:text-emerald-500 border border-[var(--border-subtle)] flex items-center justify-center transition-all cursor-pointer active:scale-95 shadow-sm"
        title="Zoom In (+)"
        aria-label="Zoom In"
      >
        <Plus className="w-4 h-4" />
      </button>

      <button
        type="button"
        onClick={() => map.zoomOut()}
        className="w-8 h-8 rounded-xl bg-[var(--bg-primary)] hover:bg-[var(--bg-card-hover)] text-[var(--text-main)] hover:text-emerald-500 border border-[var(--border-subtle)] flex items-center justify-center transition-all cursor-pointer active:scale-95 shadow-sm"
        title="Zoom Out (-)"
        aria-label="Zoom Out"
      >
        <Minus className="w-4 h-4" />
      </button>

      <div className="w-4 h-px bg-[var(--border-subtle)] my-0.5" />

      <button
        type="button"
        onClick={() => {
          if (safeCenter && safeCenter.length === 2) {
            map.flyTo(safeCenter, defaultZoom, { animate: true, duration: 1 });
          }
        }}
        className="w-8 h-8 rounded-xl bg-[var(--bg-primary)] hover:bg-[var(--bg-card-hover)] text-[var(--text-muted)] hover:text-emerald-500 border border-[var(--border-subtle)] flex items-center justify-center transition-all cursor-pointer active:scale-95 shadow-sm"
        title={`Recenter map on ${gpName}`}
        aria-label={`Recenter map on ${gpName}`}
      >
        <Compass className="w-4 h-4" />
      </button>
    </div>
  );
};

// =============================================================================
// Main MapView Component with Dual Location Selection Modes
// =============================================================================
const MapView = ({
  center = [11.2982, 76.9366],
  zoom = 13,
  issues = [],
  locations = [],
  infrastructure = { counts: {}, markers: [] },
  selectedLocation = null,
  selectedGpId = 4,
  onSelectLocation,
  onAnalyzeLocation,
  className = '',
  isMapPage = false,
  hideHabitationChips = false,
}) => {
  const { selectLocation, setActiveTab } = useLocation();
  const [mapStyle, setMapStyle] = useState('satellite');
  const [showInfra, setShowInfra] = useState(true);

  // Dual Location Selection Mode: 'search' (Automated) vs 'pin' (Manual Pin Drop)
  const [selectionMode, setSelectionMode] = useState('search'); // 'search' | 'pin'
  const [manualPinnedLocation, setManualPinnedLocation] = useState(null);
  const [isGeocodingPin, setIsGeocodingPin] = useState(false);

  const validIssues = useMemo(() => {
    if (!Array.isArray(issues)) return [];
    return issues.filter(
      (issue) =>
        issue &&
        issue.lat !== null &&
        issue.lat !== undefined &&
        issue.lng !== null &&
        issue.lng !== undefined &&
        !isNaN(Number(issue.lat)) &&
        !isNaN(Number(issue.lng)) &&
        Math.abs(Number(issue.lat)) <= 90 &&
        Math.abs(Number(issue.lng)) <= 180
    );
  }, [issues]);

  const safeCenter = useMemo(() => {
    if (Array.isArray(center) && center.length >= 2) {
      const lat = Number(center[0]);
      const lng = Number(center[1]);
      if (!isNaN(lat) && !isNaN(lng) && lat >= -90 && lat <= 90 && lng >= -180 && lng <= 180) {
        return [lat, lng];
      }
    }
    return [10.9634, 77.4727];
  }, [center]);

  const activeProvider = MAP_PROVIDERS[mapStyle] || MAP_PROVIDERS.satellite;
  const activeGeoJson = selectedLocation?.geojson || null;

  const validPolygonGeoJson = useMemo(() => {
    if (!activeGeoJson || typeof activeGeoJson !== 'object') return null;
    try {
      const type = activeGeoJson.type;
      if (type === 'Polygon' || type === 'MultiPolygon') return activeGeoJson;
      if (
        type === 'Feature' &&
        (activeGeoJson.geometry?.type === 'Polygon' || activeGeoJson.geometry?.type === 'MultiPolygon')
      ) {
        return activeGeoJson;
      }
      if (type === 'FeatureCollection' && Array.isArray(activeGeoJson.features) && activeGeoJson.features.length > 0) {
        const hasPolygons = activeGeoJson.features.some(
          (f) => f?.geometry?.type === 'Polygon' || f?.geometry?.type === 'MultiPolygon'
        );
        if (hasPolygons) return activeGeoJson;
      }
    } catch (e) {
      console.warn('GeoJSON parse skipped:', e);
    }
    return null;
  }, [activeGeoJson]);

  /**
   * Universal handler to analyze selected location and switch to Dashboard view
   * Executes ONLY when the explicit "Analyze This Location" / "Analyze The Village" button is clicked.
   */
  const handleAnalyzeLocation = useCallback(
    (loc) => {
      if (!loc) return;
      const locationPayload = {
        gp_id: loc.gp_id || Math.floor(1000 + Math.random() * 9000),
        gp_name: loc.gp_name || loc.name || 'Habitation',
        district: loc.district || 'District',
        state: loc.state || 'Tamil Nadu',
        lat: Number(loc.lat || 10.9634),
        lng: Number(loc.lng || 77.4727),
        population: loc.population || 5000,
        daily_water_supply_liters: loc.daily_water_supply_liters || 275000,
        school_classrooms_count: loc.school_classrooms_count || 24,
        road_coverage_km: loc.road_coverage_km || 18.5,
        gp_code: loc.gp_code || `GP-${loc.gp_id || 'PIN'}`,
      };

      if (onAnalyzeLocation) {
        onAnalyzeLocation(locationPayload);
      } else {
        if (onSelectLocation) {
          onSelectLocation(locationPayload);
        } else if (selectLocation) {
          selectLocation(locationPayload, false);
        }

        if (setActiveTab) {
          setActiveTab('dashboard');
        }

        if (typeof window !== 'undefined') {
          window.scrollTo({ top: 0, behavior: 'smooth' });
        }
      }
    },
    [onAnalyzeLocation, onSelectLocation, selectLocation, setActiveTab]
  );

  /**
   * Handles Manual Pin Drop anywhere on the Map (Stays on map view)
   */
  const handleMapClick = useCallback(
    async (latlng) => {
      if (!latlng || isNaN(Number(latlng.lat)) || isNaN(Number(latlng.lng))) return;
      const lat = Number(latlng.lat);
      const lng = Number(latlng.lng);

      // Set immediate placeholder marker
      const tempLoc = {
        gp_id: 9999,
        gp_code: 'GP-PIN-MANUAL',
        gp_name: `Loc (${lat.toFixed(3)}, ${lng.toFixed(3)})`,
        district: 'Locating...',
        state: 'India',
        lat,
        lng,
        isManualPin: true,
      };
      setManualPinnedLocation(tempLoc);
      setIsGeocodingPin(true);

      try {
        // Perform Reverse Geocoding via Nominatim / Backend API
        const geocoded = await reverseGeocodeCoordinates(lat, lng);
        const resolved = { ...tempLoc, ...geocoded };
        setManualPinnedLocation(resolved);

        // Update active location metadata without routing to dashboard
        if (onSelectLocation) {
          onSelectLocation(resolved);
        } else if (selectLocation) {
          selectLocation(resolved, false);
        }
      } catch (err) {
        console.error('Error reverse geocoding manual pin:', err);
      } finally {
        setIsGeocodingPin(false);
      }
    },
    [onSelectLocation, selectLocation]
  );

  return (
    <div
      className={`relative w-full h-[540px] rounded-2xl overflow-hidden shadow-2xl border border-[var(--border-subtle)] bg-[var(--bg-primary)] transition-all ${className}`}
    >
      {/* =================================================================== */}
      {/* DUAL LOCATION SELECTION MODE BAR (TOP-LEFT OVERLAY)                */}
      {/* =================================================================== */}
      <div className={`absolute ${isMapPage ? 'top-[76px]' : 'top-4'} left-4 z-[1000] flex flex-col gap-2 max-w-sm`}>
        {/* Mode Toggle Controls */}
        <div className="bg-[var(--bg-card-glass)] backdrop-blur-md p-1.5 rounded-2xl shadow-2xl border border-[var(--border-strong)] flex items-center gap-1">
          <button
            type="button"
            onClick={() => {
              setSelectionMode('search');
            }}
            className={`px-3 py-1.5 rounded-xl flex items-center gap-2 text-xs font-bold transition-all cursor-pointer ${
              selectionMode === 'search'
                ? 'bg-emerald-600 text-white shadow-md shadow-emerald-950'
                : 'text-[var(--text-muted)] hover:text-[var(--text-main)] hover:bg-[var(--bg-card-hover)]'
            }`}
          >
            <Search className="w-3.5 h-3.5" />
            <span>Search Bar Mode</span>
          </button>

          <button
            type="button"
            onClick={() => {
              setSelectionMode('pin');
            }}
            className={`px-3 py-1.5 rounded-xl flex items-center gap-2 text-xs font-bold transition-all cursor-pointer ${
              selectionMode === 'pin'
                ? 'bg-rose-600 text-white shadow-md shadow-rose-950 animate-pulse'
                : 'text-[var(--text-muted)] hover:text-[var(--text-main)] hover:bg-[var(--bg-card-hover)]'
            }`}
          >
            <Crosshair className="w-3.5 h-3.5" />
            <span>Pin Location Manually</span>
          </button>
        </div>

        {/* Dynamic Instructional Banner for Manual Pin Drop */}
        {selectionMode === 'pin' && (
          <div className="bg-rose-500/15 text-rose-600 dark:text-rose-200 border border-rose-500/40 px-3 py-2 rounded-xl text-[11px] font-semibold backdrop-blur-md shadow-lg flex items-center gap-2 animate-fadeIn">
            <span className="w-2 h-2 rounded-full bg-rose-500 animate-ping flex-shrink-0" />
            <span>Click anywhere on the map to drop a pin &amp; dynamically analyze telemetry.</span>
          </div>
        )}
      </div>

      {/* =================================================================== */}
      {/* TOP-RIGHT MAP STYLES & CATEGORY LEGEND OVERLAY                     */}
      {/* =================================================================== */}
      <div className="absolute top-4 right-4 z-[1000] flex flex-col items-end gap-2">
        {/* Layer Switcher */}
        <div className="bg-[var(--bg-card-glass)] backdrop-blur-md p-1 rounded-xl shadow-xl border border-[var(--border-strong)] flex items-center gap-1 text-[11px] font-bold">
          <button
            type="button"
            onClick={() => setMapStyle('satellite')}
            className={`px-2.5 py-1 rounded-lg flex items-center gap-1.5 transition-all cursor-pointer ${
              mapStyle === 'satellite'
                ? 'bg-emerald-600 text-white shadow-md'
                : 'text-[var(--text-muted)] hover:text-[var(--text-main)] hover:bg-[var(--bg-card-hover)]'
            }`}
          >
            <Globe className="w-3.5 h-3.5" />
            <span>Satellite</span>
          </button>
          <button
            type="button"
            onClick={() => setMapStyle('streets')}
            className={`px-2.5 py-1 rounded-lg flex items-center gap-1.5 transition-all cursor-pointer ${
              mapStyle === 'streets'
                ? 'bg-emerald-600 text-white shadow-md'
                : 'text-[var(--text-muted)] hover:text-[var(--text-main)] hover:bg-[var(--bg-card-hover)]'
            }`}
          >
            <Sun className="w-3.5 h-3.5" />
            <span>Streets</span>
          </button>
          <button
            type="button"
            onClick={() => setMapStyle('dark')}
            className={`px-2.5 py-1 rounded-lg flex items-center gap-1.5 transition-all cursor-pointer ${
              mapStyle === 'dark'
                ? 'bg-emerald-600 text-white shadow-md'
                : 'text-[var(--text-muted)] hover:text-[var(--text-main)] hover:bg-[var(--bg-card-hover)]'
            }`}
          >
            <Moon className="w-3.5 h-3.5" />
            <span>Dark GIS</span>
          </button>
          <button
            type="button"
            onClick={() => setMapStyle('terrain')}
            className={`px-2.5 py-1 rounded-lg flex items-center gap-1.5 transition-all cursor-pointer ${
              mapStyle === 'terrain'
                ? 'bg-emerald-600 text-white shadow-md'
                : 'text-[var(--text-muted)] hover:text-[var(--text-main)] hover:bg-[var(--bg-card-hover)]'
            }`}
          >
            <Mountain className="w-3.5 h-3.5" />
            <span>Terrain</span>
          </button>
        </div>

        {/* Infrastructure & Grievance Legend */}
        <div className="bg-[var(--bg-card-glass)] backdrop-blur-md px-3.5 py-1.5 rounded-xl shadow-lg border border-[var(--border-strong)] text-[11px] font-medium text-[var(--text-main)] flex flex-wrap items-center gap-3 select-none">
          <span className="font-bold text-emerald-500 mr-0.5 flex items-center gap-1">
            <Sparkles className="w-3 h-3 text-emerald-500" />
            GIS Layers:
          </span>
          <div className="flex items-center gap-1">
            <span className="w-2 h-2 rounded-full bg-blue-500 inline-block shadow-sm"></span>
            <span>Water</span>
          </div>
          <div className="flex items-center gap-1">
            <span className="w-2 h-2 rounded-full bg-purple-500 inline-block shadow-sm"></span>
            <span>Schools</span>
          </div>
          <div className="flex items-center gap-1">
            <span className="w-2 h-2 rounded-full bg-orange-500 inline-block shadow-sm"></span>
            <span>Roads</span>
          </div>
          <div className="flex items-center gap-1">
            <span className="w-2 h-2 rounded-full bg-red-500 inline-block shadow-sm"></span>
            <span>Sanitation</span>
          </div>
        </div>
      </div>

      {/* Quick Village Navigator Chips Bottom-Left Overlay */}
      {!hideHabitationChips && !isMapPage && (
        <div className="absolute bottom-4 left-4 z-[1000] max-w-[88%] sm:max-w-[80%] flex items-center gap-1.5 overflow-x-auto bg-[var(--bg-card-glass)] backdrop-blur-md p-1.5 rounded-2xl border border-[var(--border-strong)] shadow-2xl custom-scrollbar">
          <span className="text-[10px] font-bold text-emerald-500 px-2 flex items-center gap-1 uppercase tracking-wider flex-shrink-0">
            <Compass className="w-3.5 h-3.5" />
            Active Habitations:
          </span>
          {Array.isArray(locations) &&
            locations
              .filter((l) => l && l.gp_name)
              .slice(0, 8)
              .map((loc, idx) => {
                const isSelected = Number(loc.gp_id) === Number(selectedGpId);
                return (
                  <button
                    key={`chip-${loc.gp_id || idx}-${loc.gp_name || 'loc'}`}
                    type="button"
                    onClick={() => handleAnalyzeLocation(loc)}
                    className={`px-2.5 py-1 rounded-xl text-xs font-semibold whitespace-nowrap transition-all flex items-center gap-1 flex-shrink-0 cursor-pointer ${
                      isSelected
                        ? 'bg-emerald-600 text-white shadow-md shadow-emerald-950 scale-105'
                        : 'bg-[var(--bg-primary)] text-[var(--text-muted)] hover:text-[var(--text-main)] hover:bg-[var(--bg-card-hover)] border border-[var(--border-subtle)]'
                    }`}
                  >
                    <span>{loc.gp_name}</span>
                    <span className="text-[10px] opacity-75">
                      ({loc.district || String(loc.state || '').slice(0, 2) || 'GP'})
                    </span>
                  </button>
                );
              })}
        </div>
      )}

      {/* =================================================================== */}
      {/* MAIN LEAFLET MAP CONTAINER                                         */}
      {/* =================================================================== */}
      <MapContainer
        key={`leaflet-map-${safeCenter[0].toFixed(2)}-${safeCenter[1].toFixed(2)}`}
        preferCanvas={true}
        center={safeCenter}
        zoom={zoom}
        maxZoom={20}
        minZoom={4}
        zoomControl={false}
        scrollWheelZoom={true}
        className="w-full h-full z-0"
      >
        <MapViewController center={safeCenter} zoom={zoom} />
        <MapEventsHandler
          isPinningMode={selectionMode === 'pin'}
          onMapClick={handleMapClick}
        />
        <MapZoomNavigationControl
          safeCenter={safeCenter}
          defaultZoom={zoom}
          isMapPage={isMapPage}
          gpName={selectedLocation?.gp_name || 'Village'}
        />

        {/* Dynamic TileLayer with maxNativeZoom preventing "Map data not available" */}
        <TileLayer
          key={`tile-layer-${mapStyle}`}
          attribution={activeProvider.attribution}
          url={activeProvider.url}
          maxNativeZoom={activeProvider.maxNativeZoom || 17}
          maxZoom={activeProvider.maxZoom || 20}
        />

        {/* Overlay Labels for Satellite */}
        {activeProvider.hasOverlayLabels && (
          <TileLayer
            key="esri-satellite-labels"
            url={activeProvider.overlayUrl}
            maxNativeZoom={activeProvider.maxNativeZoom || 17}
            maxZoom={activeProvider.maxZoom || 20}
            zIndex={10}
          />
        )}

        {/* Real OpenStreetMap Boundary Polygon GeoJSON Layer */}
        {validPolygonGeoJson && (
          <GeoJSON
            key={`geojson-${selectedGpId || 101}-${JSON.stringify(validPolygonGeoJson).length}`}
            data={validPolygonGeoJson}
            style={{
              color: '#10b981',
              weight: 3,
              opacity: 0.8,
              fillColor: '#10b981',
              fillOpacity: 0.15,
              dashArray: '4, 4',
            }}
          />
        )}

        {/* 1. Manually Dropped Map Pin Marker */}
        {manualPinnedLocation &&
          !isNaN(Number(manualPinnedLocation.lat)) &&
          !isNaN(Number(manualPinnedLocation.lng)) && (
            <Marker
              position={[Number(manualPinnedLocation.lat), Number(manualPinnedLocation.lng)]}
              icon={buildDroppedPinIcon(manualPinnedLocation.gp_name || 'Pinned Location', true)}
            >
              <Popup className="grampulse-popup" autoPan={true}>
                <div className="p-2 min-w-[260px] max-w-[300px] font-sans text-slate-800 space-y-2">
                  <div className="flex items-start justify-between gap-2 pb-1.5 border-b border-slate-200">
                    <div>
                      <span className="text-[9px] font-bold uppercase tracking-wider text-rose-600 bg-rose-50 px-1.5 py-0.5 rounded border border-rose-200">
                        Manual Pin Drop
                      </span>
                      <h4 className="text-sm font-black text-slate-900 mt-1 leading-tight">
                        {manualPinnedLocation.gp_name}
                      </h4>
                      <p className="text-[11px] text-slate-500">
                        {manualPinnedLocation.district} District, {manualPinnedLocation.state}
                      </p>
                    </div>
                  </div>

                  <div className="bg-slate-50 p-2 rounded-xl border border-slate-200 text-[11px] space-y-1">
                    <div className="flex items-center justify-between text-slate-700">
                      <span className="text-slate-500">GPS Coordinates:</span>
                      <span className="font-mono font-bold">
                        {Number(manualPinnedLocation.lat).toFixed(4)}°N, {Number(manualPinnedLocation.lng).toFixed(4)}°E
                      </span>
                    </div>
                    {isGeocodingPin && (
                      <div className="flex items-center gap-1 text-emerald-600 font-semibold pt-1">
                        <Loader2 className="w-3 h-3 animate-spin" />
                        <span>Resolving OpenStreetMap Telemetry...</span>
                      </div>
                    )}
                  </div>

                  <button
                    type="button"
                    onClick={() => handleAnalyzeLocation(manualPinnedLocation)}
                    className="w-full py-2.5 px-3 rounded-xl bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white text-xs font-bold shadow-md transition-all flex items-center justify-center gap-1.5 active:scale-95 cursor-pointer"
                  >
                    <Activity className="w-4 h-4" />
                    <span>Analyze The Village</span>
                  </button>
                </div>
              </Popup>
            </Marker>
          )}

        {/* 2. Registered Village Hub Markers */}
        {Array.isArray(locations) &&
          locations.map((loc, idx) => {
            if (!loc) return null;
            const lat = Number(loc.lat);
            const lng = Number(loc.lng);
            if (isNaN(lat) || isNaN(lng) || lat === 0 || lng === 0) return null;
            const isSelected = Number(loc.gp_id) === Number(selectedGpId);
            const icon = buildVillageHubIcon(loc.gp_name || 'Habitation', loc.state || 'Tamil Nadu', isSelected);

            return (
              <Marker
                key={`village-hub-${loc.gp_id || idx}-${lat.toFixed(4)}-${lng.toFixed(4)}`}
                position={[lat, lng]}
                icon={icon}
                eventHandlers={{
                  click: () => {
                    if (onSelectLocation) onSelectLocation(loc);
                  },
                }}
              >
                <Popup className="grampulse-popup">
                  <div className="p-1.5 min-w-[270px] max-w-[310px] font-sans text-slate-800">
                    <div className="flex items-start justify-between gap-2 pb-2 mb-2 border-b border-slate-200">
                      <div>
                        <h4 className="text-sm font-black text-slate-900 leading-tight">
                          {loc.gp_name || 'Habitation'} Gram Panchayat
                        </h4>
                        <p className="text-[11px] text-slate-500 font-medium">
                          {loc.district || 'District'} District, {loc.state || 'Tamil Nadu'}
                        </p>
                      </div>
                      <span className="text-[10px] font-mono font-bold px-1.5 py-0.5 rounded bg-emerald-50 text-emerald-700 border border-emerald-200">
                        {loc.gp_code || 'GP-LIVE'}
                      </span>
                    </div>

                    {loc.isOfficialData && (
                      <div className="text-[10px] text-emerald-800 bg-emerald-50 px-2 py-1 rounded-lg border border-emerald-200 mb-2 flex items-center gap-1 font-semibold">
                        <Sparkles className="w-3 h-3 text-emerald-600 shrink-0" />
                        <span>Official Census &amp; MoPR LGD Baseline</span>
                      </div>
                    )}

                    <div className="grid grid-cols-2 gap-1.5 text-[11px] bg-slate-50 p-2 rounded-xl border border-slate-200 mb-3">
                      <div className="flex items-center gap-1.5 text-slate-700">
                        <Users className="w-3.5 h-3.5 text-blue-600" />
                        <span>
                          Pop: <strong>{loc.population ? Number(loc.population).toLocaleString() : '5,000+'}</strong>
                        </span>
                      </div>
                      <div className="flex items-center gap-1.5 text-slate-700">
                        <Droplets className="w-3.5 h-3.5 text-cyan-600" />
                        <span>
                          Water:{' '}
                          <strong>
                            {loc.daily_water_supply_liters
                              ? `${Math.round(loc.daily_water_supply_liters / 1000)}k L`
                              : 'JJM 55 LPD'}
                          </strong>
                        </span>
                      </div>
                      <div className="flex items-center gap-1.5 text-slate-700">
                        <GraduationCap className="w-3.5 h-3.5 text-purple-600" />
                        <span>
                          Schools: <strong>{loc.school_classrooms_count || 18} rms</strong>
                        </span>
                      </div>
                      <div className="flex items-center gap-1.5 text-slate-700">
                        <Route className="w-3.5 h-3.5 text-orange-600" />
                        <span>
                          Roads: <strong>{loc.road_coverage_km || 22} km</strong>
                        </span>
                      </div>
                    </div>

                    <button
                      type="button"
                      onClick={() => handleAnalyzeLocation(loc)}
                      className="w-full py-2.5 px-3 rounded-xl bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white text-xs font-bold shadow-md transition-all flex items-center justify-center gap-1.5 active:scale-95 cursor-pointer"
                    >
                      <Activity className="w-4 h-4" />
                      <span>Analyze The Village</span>
                      <ArrowRight className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </Popup>
              </Marker>
            );
          })}

        {/* 3. Live Overpass Infrastructure Node Markers */}
        {showInfra &&
          Array.isArray(infrastructure?.markers) &&
          infrastructure.markers
            .filter((m) => m && !isNaN(Number(m.lat)) && !isNaN(Number(m.lng)))
            .map((infra) => (
              <Marker
                key={`infra-${infra.type}-${infra.id}-${infra.lat}-${infra.lng}`}
                position={[Number(infra.lat), Number(infra.lng)]}
                icon={buildInfrastructureIcon(infra.type)}
              >
                <Popup className="grampulse-popup">
                  <div className="p-1 font-sans text-slate-800">
                    <div className="flex items-center gap-1.5 pb-1 border-b border-slate-100">
                      <span className="text-[10px] font-bold uppercase tracking-wider text-emerald-600">
                        Live Overpass OSM Node
                      </span>
                    </div>
                    <p className="text-xs font-bold text-slate-900 mt-1">{infra.name}</p>
                    <p className="text-[11px] text-slate-500 capitalize">{infra.subtype || infra.type} facility</p>
                  </div>
                </Popup>
              </Marker>
            ))}

        {/* 4. Marker Clustering Layer for Geotagged Grievances */}
        {validIssues.length > 0 && (
          <MarkerClusterGroup
            chunkedLoading
            maxClusterRadius={50}
            spiderfyOnMaxZoom={true}
            showCoverageOnHover={false}
            iconCreateFunction={createCustomClusterIcon}
          >
            {validIssues.map((issue) => {
              const theme = getCategoryTheme(issue.category);
              const statusBadge = getStatusBadge(issue.status);
              const lat = Number(issue.lat);
              const lng = Number(issue.lng);

              return (
                <Marker
                  key={issue.issue_id ? `issue-${issue.issue_id}` : `issue-${lat}-${lng}`}
                  position={[lat, lng]}
                  icon={buildCategoryIcon(issue.category)}
                >
                  <Popup className="grampulse-popup">
                    <div className="p-1 min-w-[240px] max-w-[280px] font-sans text-slate-800">
                      <div className="flex items-center justify-between gap-2 pb-2 mb-2 border-b border-slate-100">
                        <span
                          className={`inline-flex items-center px-2 py-0.5 rounded-md text-xs font-semibold border ${theme.badgeBg}`}
                        >
                          {issue.category || 'General'}
                        </span>
                        <span
                          className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[11px] font-medium border ${statusBadge.classes}`}
                        >
                          <span className={`w-1.5 h-1.5 rounded-full ${statusBadge.dot}`} />
                          {statusBadge.label}
                        </span>
                      </div>

                      <p className="text-xs leading-relaxed text-slate-700 font-normal mb-3">
                        {issue.description || 'No description provided.'}
                      </p>

                      <div className="pt-2 border-t border-slate-100 flex items-center justify-between text-[11px] text-slate-400">
                        <span>
                          Grievance ID: <strong className="text-slate-600">#{issue.issue_id || 'N/A'}</strong>
                        </span>
                        <span className="font-mono">
                          {lat.toFixed(4)}°, {lng.toFixed(4)}°
                        </span>
                      </div>
                    </div>
                  </Popup>
                </Marker>
              );
            })}
          </MarkerClusterGroup>
        )}
      </MapContainer>
    </div>
  );
};

MapView.propTypes = {
  center: PropTypes.arrayOf(PropTypes.number),
  zoom: PropTypes.number,
  issues: PropTypes.arrayOf(PropTypes.object),
  locations: PropTypes.arrayOf(PropTypes.object),
  infrastructure: PropTypes.shape({
    counts: PropTypes.object,
    markers: PropTypes.array,
  }),
  selectedLocation: PropTypes.object,
  selectedGpId: PropTypes.number,
  onSelectLocation: PropTypes.func,
  onAnalyzeLocation: PropTypes.func,
  className: PropTypes.string,
  isMapPage: PropTypes.bool,
  hideHabitationChips: PropTypes.bool,
};

class MapErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false };
  }
  static getDerivedStateFromError() {
    return { hasError: true };
  }
  componentDidCatch(err) {
    console.warn('Leaflet Map internal render error caught:', err);
  }
  render() {
    if (this.state.hasError) {
      return (
        <div className="w-full h-full min-h-[440px] flex flex-col items-center justify-center bg-slate-950 p-6 text-center text-slate-200 space-y-3 rounded-2xl border border-slate-800">
          <div className="w-12 h-12 rounded-xl bg-amber-500/15 border border-amber-500/30 flex items-center justify-center text-amber-400">
            <Compass className="w-6 h-6 animate-spin" />
          </div>
          <h4 className="text-sm font-bold text-white">Geospatial Satellite Map Initializing</h4>
          <p className="text-xs text-slate-400 max-w-sm">
            Recalibrating high-resolution satellite tiles and telemetry layers.
          </p>
          <button
            type="button"
            onClick={() => this.setState({ hasError: false })}
            className="px-4 py-2 bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold rounded-xl transition-all shadow-md cursor-pointer"
          >
            Reload Satellite Canvas
          </button>
        </div>
      );
    }
    return this.props.children;
  }
}

const SafeMapView = (props) => (
  <MapErrorBoundary>
    <MapView {...props} />
  </MapErrorBoundary>
);

export default React.memo(SafeMapView);
