import React, { useState, useRef, useEffect, useCallback, useMemo } from 'react';
import PropTypes from 'prop-types';
import {
  Sparkles,
  PlusCircle,
  LogOut,
  MapPin,
  Search,
  Building2,
  Loader2,
  X,
  Globe,
  LayoutDashboard,
  Map,
  Sun,
  Moon,
  Palette,
  CheckCircle2,
  AlertCircle,
  Compass,
  TrendingUp,
  Mail,
  ShieldCheck,
  Download,
  FileText,
  Calendar,
  ChevronDown,
  Check,
  Clock,
  Trash2,
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { useLocation } from '../context/LocationContext';
import { useTheme } from '../context/ThemeContext';
import { downloadGPDPReport } from '../services/api';
import { getAllDistrictLocations } from '../services/censusDirectoryService';

/**
 * Highlights substring matches within a text string.
 */
function HighlightMatch({ text = '', query = '' }) {
  if (!query || !query.trim() || !text) {
    return <span>{text}</span>;
  }
  const regex = new RegExp(`(${query.replace(/[-[\]{}()*+?.,\\^$|#\s]/g, '\\$&')})`, 'gi');
  const parts = String(text).split(regex);

  return (
    <span>
      {parts.map((part, i) =>
        regex.test(part) ? (
          <span
            key={i}
            className="text-emerald-400 font-extrabold bg-emerald-500/20 px-0.5 rounded shadow-sm"
          >
            {part}
          </span>
        ) : (
          <span key={i}>{part}</span>
        )
      )}
    </span>
  );
}

HighlightMatch.propTypes = {
  text: PropTypes.string,
  query: PropTypes.string,
};


const HORIZON_OPTIONS = [
  {
    years: 3,
    title: '3 Years of Prediction',
    badge: '3-Year Short-Term',
    range: '2027 – 2029',
    description: 'Immediate infrastructure deficit remediation & rapid saturation targets',
  },
  {
    years: 5,
    title: '5 Years of Prediction',
    badge: '5-Year GPDP Standard',
    range: '2027 – 2031',
    description: 'Official 5-Year Gram Panchayat Development Plan statutory baseline model',
  },
  {
    years: 7,
    title: '7 Years of Prediction',
    badge: '7-Year Long-Term',
    range: '2027 – 2033',
    description: 'Extended demographic growth trajectory & master infrastructure planning',
  },
];

export default function Header({ onOpenReportModal }) {
  const { user, logout } = useAuth();
  const { themeConfig, toggleMode, activePalette, toggleCustomizer } = useTheme();
  const {
    locations,
    selectedLocation,
    selectedGpId,
    selectLocation,
    searchResults,
    isSearching,
    handleSearch,
    activeTab,
    setActiveTab,
    analytics,
    infrastructure,
    selectedDistrict,
    setSelectedDistrict,
    districts,
    planningHorizon,
    setPlanningHorizon,
  } = useLocation();

  const [isSearchOpen, setIsSearchOpen] = useState(false);
  const [localInput, setLocalInput] = useState('');

  const [recentSearches, setRecentSearches] = useState(() => {
    try {
      return JSON.parse(localStorage.getItem('grampulse_recent_searches') || '[]');
    } catch (e) {
      return [];
    }
  });

  const clearRecentHistory = (e) => {
    e.stopPropagation();
    try {
      localStorage.removeItem('grampulse_recent_searches');
    } catch (err) {}
    setRecentSearches([]);
  };

  useEffect(() => {
    setLocalInput('');
    setIsSearchOpen(false);
  }, [selectedDistrict]);
  const searchContainerRef = useRef(null);
  const searchInputRef = useRef(null);

  const [isProfileOpen, setIsProfileOpen] = useState(false);
  const profileMenuRef = useRef(null);
  const [isDownloadingPdf, setIsDownloadingPdf] = useState(false);

  const [isHorizonOpen, setIsHorizonOpen] = useState(false);
  const horizonDropdownRef = useRef(null);

  // Close horizon dropdown when clicking outside or pressing Escape
  useEffect(() => {
    const handleClickOutside = (e) => {
      if (
        horizonDropdownRef.current &&
        !horizonDropdownRef.current.contains(e.target)
      ) {
        setIsHorizonOpen(false);
      }
    };
    const handleKeyDown = (e) => {
      if (e.key === 'Escape') {
        setIsHorizonOpen(false);
      }
    };
    if (isHorizonOpen) {
      document.addEventListener('mousedown', handleClickOutside);
      document.addEventListener('keydown', handleKeyDown);
    }
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
      document.removeEventListener('keydown', handleKeyDown);
    };
  }, [isHorizonOpen]);

  const handleSelectHorizon = (years) => {
    if (setPlanningHorizon) {
      setPlanningHorizon(years);
    }
    setIsHorizonOpen(false);
  };

  const handleDownloadPdf = async () => {
    if (!selectedLocation) return;
    setIsDownloadingPdf(true);
    try {
      await downloadGPDPReport(
        selectedLocation.gp_id,
        selectedLocation.gp_name,
        planningHorizon || 5,
        selectedLocation,
        analytics
      );
    } catch (e) {
      console.error('Error generating GPDP PDF:', e);
    } finally {
      setIsDownloadingPdf(false);
    }
  };

  // Global Ctrl+K / Cmd+K keyboard shortcut to focus search
  useEffect(() => {
    const handleGlobalKeyDown = (e) => {
      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'k') {
        e.preventDefault();
        searchInputRef.current?.focus();
        setIsSearchOpen(true);
      }
    };
    window.addEventListener('keydown', handleGlobalKeyDown);
    return () => window.removeEventListener('keydown', handleGlobalKeyDown);
  }, []);

  // Close search & profile dropdown on outside click
  useEffect(() => {
    const handleOutsideClick = (e) => {
      if (searchContainerRef.current && !searchContainerRef.current.contains(e.target)) {
        setIsSearchOpen(false);
      }
      if (profileMenuRef.current && !profileMenuRef.current.contains(e.target)) {
        setIsProfileOpen(false);
      }
    };
    document.addEventListener('mousedown', handleOutsideClick);
    return () => document.removeEventListener('mousedown', handleOutsideClick);
  }, []);

  const getInitials = (name) => {
    if (!name || typeof name !== 'string') return 'GP';
    const parts = name.trim().split(/\s+/).filter(Boolean);
    if (parts.length >= 2 && parts[0]?.[0] && parts[1]?.[0]) {
      return (parts[0][0] + parts[1][0]).toUpperCase();
    }
    return (name.trim().slice(0, 2) || 'GP').toUpperCase();
  };

  const handleInputChange = (e) => {
    const val = e.target.value;
    setLocalInput(val);
    handleSearch(val);
    setIsSearchOpen(true);
  };

  const handleClear = () => {
    setLocalInput('');
    handleSearch('');
    setIsSearchOpen(false);
  };

  const handleSelectVillage = (village) => {
    if (!village) return;
    selectLocation(village, true);
    setIsSearchOpen(false);
    setLocalInput(village.gp_name || village.name || '');

    try {
      const existing = JSON.parse(localStorage.getItem('grampulse_recent_searches') || '[]');
      const filtered = existing.filter((item) => Number(item.gp_id || item.id) !== Number(village.gp_id || village.id));
      const updated = [{
        gp_id: village.gp_id || village.id,
        gp_name: village.gp_name || village.name,
        census_code: village.census_code,
        district: village.district || selectedDistrict,
        location_type: village.location_type || 'Location'
      }, ...filtered].slice(0, 6);
      localStorage.setItem('grampulse_recent_searches', JSON.stringify(updated));
      setRecentSearches(updated);
    } catch (e) {}
  };

  const handleKeyDown = (e) => {
    if (e.key === 'Enter') {
      const results = localInput.trim().length > 0 ? searchResults : locations;
      if (Array.isArray(results) && results.length > 0) {
        handleSelectVillage(results[0]);
      }
    } else if (e.key === 'Escape') {
      setIsSearchOpen(false);
    }
  };

  const displayResults = useMemo(() => {
    if (localInput.trim().length > 0) {
      return Array.isArray(searchResults) ? searchResults : [];
    }
    if (Array.isArray(locations) && locations.length > 0) {
      return locations;
    }
    return getAllDistrictLocations(selectedDistrict);
  }, [localInput, searchResults, locations, selectedDistrict]);

  return (
    <header className="sticky top-0 z-[1200] overflow-visible bg-[var(--bg-card-glass)] border-b border-[var(--border-subtle)] text-[var(--text-main)] shadow-xl backdrop-blur-2xl transition-colors duration-200">
      <div className="flex items-center justify-between w-full px-3 sm:px-6 py-2.5 min-h-[70px] gap-2 sm:gap-4 overflow-visible">
        
        {/* ================================================================= */}
        {/* 1. FAR LEFT: BRANDING & PLATFORM LOGO                             */}
        {/* ================================================================= */}
        <div
          onClick={() => {
            if (setActiveTab) setActiveTab('dashboard');
            window.scrollTo({ top: 0, behavior: 'smooth' });
          }}
          className="flex items-center gap-2.5 sm:gap-3 flex-shrink-0 justify-start cursor-pointer group"
          role="button"
          tabIndex={0}
          onKeyDown={(e) => {
            if (e.key === 'Enter' || e.key === ' ') {
              if (setActiveTab) setActiveTab('dashboard');
              window.scrollTo({ top: 0, behavior: 'smooth' });
            }
          }}
        >
          <div
            className="w-10 h-10 rounded-2xl flex items-center justify-center text-white shadow-lg shadow-emerald-950/40 ring-2 ring-emerald-400/30 flex-shrink-0 group-hover:scale-105 transition-transform"
            style={{ backgroundColor: `${activePalette.primary}25`, color: activePalette.primary }}
          >
            <Sparkles className="w-5 h-5" />
          </div>
          <div className="hidden sm:block">
            <div className="flex items-center gap-1.5">
              <h1 className="text-base sm:text-lg font-black tracking-tight text-[var(--text-main)] font-sans group-hover:text-emerald-500 transition-colors">
                GramPulse <span style={{ color: activePalette.primary }} className="font-extrabold">AI</span>
              </h1>
              <span
                className="inline-flex items-center px-2 py-0.5 rounded-full text-[9px] font-bold uppercase tracking-wider border"
                style={{
                  backgroundColor: `${activePalette.primary}15`,
                  color: activePalette.primary,
                  borderColor: `${activePalette.primary}30`,
                }}
              >
                MoPR RAG Engine
              </span>
            </div>
            <p className="text-[10.5px] text-[var(--text-muted)] font-medium truncate max-w-[220px]">
              Predictive Rural Governance &amp; GIS
            </p>
          </div>
        </div>

        {/* ================================================================= */}
        {/* 2. CENTER: SLEEK, ATTRACTIVE COMPACT SEARCH BAR                   */}
        {/* ================================================================= */}
        <div className="flex-1 max-w-md lg:max-w-xl mx-2 sm:mx-3 relative overflow-visible flex items-center gap-1.5" ref={searchContainerRef}>
          <select
            aria-label="Header District Selector"
            value={selectedDistrict}
            onChange={(e) => {
              const newD = e.target.value;
              setSelectedDistrict(newD);
              if (localInput) {
                handleSearch(localInput, newD);
              }
            }}
            className="hidden md:block text-[11px] font-bold px-2 py-2 rounded-xl bg-[var(--bg-primary)] border border-[var(--border-subtle)] text-[var(--text-main)] cursor-pointer focus:outline-none focus:ring-1 shrink-0"
            style={{ borderColor: `${activePalette.primary}40` }}
          >
            <option value="All Districts">All 38 Districts</option>
            {Array.isArray(districts) &&
              districts.map((d) => (
                <option key={`hdr-dist-${d.name}`} value={d.name}>
                  {d.name}
                </option>
              ))}
          </select>

          <div className="relative flex-1 flex items-center group">
            <div
              className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none transition-colors duration-200 group-focus-within:text-emerald-500"
              style={{ color: activePalette.primary }}
            >
              <Search className="w-4 h-4 transition-transform duration-200 group-focus-within:scale-110" />
            </div>

            <input
              ref={searchInputRef}
              type="text"
              value={localInput}
              onChange={handleInputChange}
              onKeyDown={handleKeyDown}
              onFocus={() => setIsSearchOpen(true)}
              placeholder={selectedDistrict === 'All Districts' ? 'Search village or town in Tamil Nadu...' : `Search in ${selectedDistrict}...`}
              className="w-full pl-9 sm:pl-10 pr-14 sm:pr-16 py-2 sm:py-2.5 text-xs sm:text-sm font-medium rounded-2xl bg-[var(--bg-primary)]/85 hover:bg-[var(--bg-primary)] focus:bg-[var(--bg-card)] border border-[var(--border-subtle)] hover:border-emerald-500/40 focus:border-emerald-500 text-[var(--text-main)] placeholder:text-[var(--text-muted)] focus:outline-none focus:ring-2 focus:ring-emerald-500/20 shadow-xs hover:shadow-sm focus:shadow-md focus:shadow-emerald-500/10 backdrop-blur-md transition-all duration-200 font-sans"
            />

            {/* Clear Button, Spinner, or Keyboard Hint Badge */}
            <div className="absolute inset-y-0 right-0 pr-3 flex items-center gap-1.5">
              {localInput ? (
                <button
                  type="button"
                  onClick={handleClear}
                  className="p-1 rounded-md text-[var(--text-muted)] hover:text-[var(--text-main)] hover:bg-[var(--bg-card-hover)] cursor-pointer transition-colors"
                  title="Clear query"
                >
                  <X className="w-3.5 h-3.5" />
                </button>
              ) : isSearching ? (
                <div className="flex items-center text-emerald-500">
                  <Loader2 className="w-3.5 h-3.5 animate-spin" />
                </div>
              ) : (
                <kbd className="hidden sm:inline-flex items-center px-2 py-0.5 text-[10px] font-mono font-bold text-emerald-600 dark:text-emerald-400 bg-emerald-500/15 border border-emerald-500/30 hover:border-emerald-500/60 hover:bg-emerald-500/25 rounded-md shadow-xs pointer-events-none select-none transition-all">
                  Ctrl K
                </kbd>
              )}
            </div>
          </div>

          {/* Autocomplete Dropdown with Highlighted Text Matches */}
          {isSearchOpen && (
            <div className="absolute left-0 right-0 top-full mt-2 w-full bg-[var(--bg-card)] border border-[var(--border-strong)] rounded-2xl shadow-2xl z-[1500] p-2 space-y-1 backdrop-blur-2xl animate-fadeIn max-h-84 overflow-y-auto custom-scrollbar">
              <div className="flex items-center justify-between px-3 py-1.5 border-b border-[var(--border-subtle)] text-[10px] font-bold text-[var(--text-muted)] uppercase tracking-wider">
                <span className="flex items-center gap-1.5" style={{ color: activePalette.primary }}>
                  <Globe className="w-3.5 h-3.5" />
                  {localInput.trim().length > 0 ? `Matching Places in ${selectedDistrict}` : `Verified Places in ${selectedDistrict}`}
                </span>
                <span className="font-mono text-[10px] font-semibold text-emerald-400">{displayResults.length} Available</span>
              </div>

              {displayResults.length === 0 ? (
                <div className="py-7 text-center text-xs text-[var(--text-muted)] space-y-1">
                  <p className="font-semibold text-[var(--text-main)]">No habitations found for &ldquo;{localInput}&rdquo;</p>
                  <p className="text-[11px] text-[var(--text-subtle)]">Querying official Census directory...</p>
                </div>
              ) : (
                displayResults.map((village, idx) => {
                  const isSelected = Number(village.gp_id) === Number(selectedGpId);

                  return (
                    <button
                      key={`search-item-${village.gp_id || idx}-${village.gp_name}`}
                      type="button"
                      onClick={() => handleSelectVillage(village)}
                      className={`w-full flex items-center justify-between p-3 rounded-xl text-left transition-all cursor-pointer ${
                        isSelected
                          ? 'border text-[var(--text-main)] shadow-sm'
                          : 'hover:bg-[var(--bg-card-hover)] text-[var(--text-muted)] hover:text-[var(--text-main)] border border-transparent'
                      }`}
                      style={{
                        backgroundColor: isSelected ? `${activePalette.primary}15` : undefined,
                        borderColor: isSelected ? `${activePalette.primary}40` : undefined,
                      }}
                    >
                      <div className="flex items-center gap-3 min-w-0">
                        <div
                          className="w-8 h-8 rounded-lg flex items-center justify-center text-xs font-bold flex-shrink-0"
                          style={{
                            backgroundColor: isSelected ? activePalette.primary : 'var(--bg-primary)',
                            color: isSelected ? '#fff' : activePalette.primary,
                            border: isSelected ? 'none' : '1px solid var(--border-subtle)',
                          }}
                        >
                          <MapPin className="w-4 h-4" />
                        </div>
                        <div className="min-w-0 truncate">
                          <p className="text-xs sm:text-sm font-bold text-[var(--text-main)] leading-tight truncate">
                            <HighlightMatch text={village.gp_name || village.name} query={localInput} />
                            {village.native_name && (
                              <span className="text-[11px] font-normal text-emerald-500 ml-1.5 font-sans">
                                ({village.native_name})
                              </span>
                            )}
                          </p>
                          <p className="text-[11px] text-[var(--text-muted)] truncate">
                            <HighlightMatch
                              text={`${village.location_type || village.level || 'Location'} • ${village.district || 'Tamil Nadu'}`}
                              query={localInput}
                            />
                          </p>
                        </div>
                      </div>

                      <div className="flex flex-col items-end flex-shrink-0 ml-2">
                        <span
                          className="text-[10px] font-mono font-semibold px-2 py-0.5 rounded border"
                          style={{
                            color: activePalette.primary,
                            backgroundColor: `${activePalette.primary}15`,
                            borderColor: `${activePalette.primary}30`,
                          }}
                        >
                          {village.gp_code || `GP-${village.gp_id || 9001}`}
                        </span>
                        {village.population && (
                          <span className="text-[9.5px] text-[var(--text-subtle)] font-mono mt-0.5">
                            Pop: {Number(village.population).toLocaleString()}
                          </span>
                        )}
                      </div>
                    </button>
                  );
                })
              )}

              {/* Distinct Recently Viewed Section */}
              {recentSearches.length > 0 && (
                <div className="mt-2 pt-2 border-t border-[var(--border-subtle)] space-y-1">
                  <div className="flex items-center justify-between px-3 py-1 text-[10px] font-bold text-[var(--text-muted)] uppercase tracking-wider">
                    <span className="flex items-center gap-1.5">
                      <Clock className="w-3 h-3 text-slate-400" />
                      <span>Recently Viewed</span>
                    </span>
                    <button
                      type="button"
                      onClick={clearRecentHistory}
                      className="text-[10px] text-rose-400 hover:text-rose-300 flex items-center gap-1 cursor-pointer font-medium"
                      title="Clear Recent History"
                    >
                      <Trash2 className="w-2.5 h-2.5" />
                      <span>Clear History</span>
                    </button>
                  </div>
                  {recentSearches.map((rec) => (
                    <button
                      key={`hdr-recent-${rec.gp_id}-${rec.gp_name}`}
                      type="button"
                      onClick={() => handleSelectVillage(rec)}
                      className="w-full flex items-center justify-between px-3 py-1.5 rounded-lg hover:bg-[var(--bg-card-hover)] text-xs text-[var(--text-muted)] hover:text-[var(--text-main)] transition-colors cursor-pointer text-left"
                    >
                      <span className="truncate font-medium">{rec.gp_name} ({rec.district})</span>
                      <span className="text-[9px] font-mono text-slate-400">{rec.location_type || 'Viewed'}</span>
                    </button>
                  ))}
                </div>
              )}
            </div>
          )}
        </div>

        {/* ================================================================= */}
        {/* 3. FAR RIGHT: ACTION BUTTONS (DOWNLOAD PDF, TABS, THEME, PROFILE) */}
        {/* ================================================================= */}
        <div className="flex items-center gap-2 sm:gap-3 flex-shrink-0 justify-end">
          
          {/* Navigation Page Tabs (Dashboard vs Interactive Map) */}
          <div className="hidden xl:flex items-center gap-1 bg-[var(--bg-primary)] p-1 rounded-xl border border-[var(--border-subtle)] flex-shrink-0">
            <button
              type="button"
              onClick={() => setActiveTab('dashboard')}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                activeTab === 'dashboard'
                  ? 'text-white shadow-md'
                  : 'text-[var(--text-muted)] hover:text-[var(--text-main)] hover:bg-[var(--bg-card-hover)]'
              }`}
              style={{
                backgroundColor: activeTab === 'dashboard' ? activePalette.primary : undefined,
              }}
            >
              <LayoutDashboard className="w-3.5 h-3.5" />
              <span>Dashboard</span>
            </button>
            <button
              type="button"
              onClick={() => setActiveTab('map')}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                activeTab === 'map'
                  ? 'text-white shadow-md'
                  : 'text-[var(--text-muted)] hover:text-[var(--text-main)] hover:bg-[var(--bg-card-hover)]'
              }`}
              style={{
                backgroundColor: activeTab === 'map' ? activePalette.primary : undefined,
              }}
            >
              <Map className="w-3.5 h-3.5" />
              <span>Map</span>
            </button>
            <button
              type="button"
              onClick={() => setActiveTab('prediction')}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                activeTab === 'prediction'
                  ? 'text-white shadow-md'
                  : 'text-[var(--text-muted)] hover:text-[var(--text-main)] hover:bg-[var(--bg-card-hover)]'
              }`}
              style={{
                backgroundColor: activeTab === 'prediction' ? activePalette.primary : undefined,
              }}
            >
              <TrendingUp className="w-3.5 h-3.5" />
              <span>Future Prediction</span>
            </button>
          </div>

          {/* Prediction Horizons Dropdown, Report Grievance & GPDP PDF Action */}
          <div className="flex items-center gap-1.5 flex-shrink-0">
            {onOpenReportModal && (
              <button
                type="button"
                onClick={onOpenReportModal}
                className="hidden lg:inline-flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-bold text-white bg-emerald-600 hover:bg-emerald-500 shadow-sm transition-all active:scale-95 cursor-pointer"
                title="Lodge a geotagged citizen grievance"
              >
                <PlusCircle className="w-3.5 h-3.5" />
                <span>Report Grievance</span>
              </button>
            )}
            {/* HORIZONS DROPDOWN (3, 5, AND 7 YEARS OF PREDICTION) */}
            <div className="relative" ref={horizonDropdownRef}>
              <button
                type="button"
                onClick={() => setIsHorizonOpen((prev) => !prev)}
                className={`inline-flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-bold transition-all active:scale-95 cursor-pointer shadow-sm border ${
                  isHorizonOpen
                    ? 'bg-emerald-500/20 text-emerald-300 border-emerald-500/50 ring-2 ring-emerald-500/30'
                    : 'bg-[var(--bg-primary)] hover:bg-[var(--bg-card-hover)] text-[var(--text-main)] border-[var(--border-subtle)] hover:border-emerald-500/40'
                }`}
                title="Select Planning & Prediction Horizon (3, 5, or 7 Years)"
                aria-expanded={isHorizonOpen}
              >
                <Calendar className="w-3.5 h-3.5 text-emerald-400" />
                <span className="hidden sm:inline">Horizons</span>
                <span className="px-1.5 py-0.5 rounded-md text-[10px] font-extrabold bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 font-mono">
                  {planningHorizon || 5}Y
                </span>
                <ChevronDown
                  className={`w-3 h-3 text-[var(--text-muted)] transition-transform duration-200 ${
                    isHorizonOpen ? 'rotate-180 text-emerald-400' : ''
                  }`}
                />
              </button>

              {/* Horizons Dropdown Menu */}
              {isHorizonOpen && (
                <div className="absolute right-0 top-full mt-2 w-72 sm:w-80 rounded-2xl bg-[var(--bg-card)] border border-[var(--border-subtle)] shadow-2xl p-3 z-[1300] backdrop-blur-xl animate-in fade-in zoom-in-95 duration-150 space-y-2">
                  <div className="flex items-center justify-between pb-2 border-b border-[var(--border-subtle)] px-1">
                    <div className="flex items-center gap-1.5">
                      <TrendingUp className="w-4 h-4 text-emerald-400" />
                      <span className="text-xs font-black uppercase tracking-wider text-[var(--text-main)]">
                        Prediction Horizons
                      </span>
                    </div>
                    <span className="text-[10px] font-bold text-emerald-400 bg-emerald-500/10 px-2 py-0.5 rounded-full border border-emerald-500/20 font-mono">
                      Active: {planningHorizon || 5}Y
                    </span>
                  </div>

                  <p className="text-[11px] text-[var(--text-muted)] px-1 leading-relaxed">
                    Select a multi-year horizon to simulate infrastructure deficits, population cohorts, and service demands.
                  </p>

                  <div className="space-y-1.5 pt-1">
                    {HORIZON_OPTIONS.map((opt) => {
                      const isSelected = (planningHorizon || 5) === opt.years;
                      return (
                        <button
                          key={opt.years}
                          type="button"
                          onClick={() => handleSelectHorizon(opt.years)}
                          className={`w-full text-left p-2.5 rounded-xl border transition-all cursor-pointer flex items-start gap-2.5 group relative ${
                            isSelected
                              ? 'bg-gradient-to-r from-emerald-500/20 via-teal-500/15 to-transparent border-emerald-500/50 shadow-md ring-1 ring-emerald-500/30'
                              : 'bg-[var(--bg-primary)] hover:bg-[var(--bg-card-hover)] border-[var(--border-subtle)] hover:border-emerald-500/30'
                          }`}
                        >
                          <div
                            className={`w-5 h-5 rounded-lg flex items-center justify-center shrink-0 mt-0.5 transition-all ${
                              isSelected
                                ? 'bg-gradient-to-tr from-emerald-600 to-teal-500 text-white shadow-sm ring-2 ring-emerald-400/40'
                                : 'bg-[var(--bg-card)] border border-[var(--border-subtle)] group-hover:border-emerald-500/40 text-transparent'
                            }`}
                          >
                            <Check className="w-3.5 h-3.5 stroke-[3]" />
                          </div>

                          <div className="flex-1 min-w-0">
                            <div className="flex items-center justify-between gap-1.5">
                              <span
                                className={`text-xs font-black tracking-tight ${
                                  isSelected ? 'text-emerald-400' : 'text-[var(--text-main)] group-hover:text-emerald-400'
                                }`}
                              >
                                {opt.title}
                              </span>
                              <span
                                className={`text-[10px] font-mono font-bold px-1.5 py-0.5 rounded ${
                                  isSelected
                                    ? 'bg-emerald-500/25 text-emerald-300 border border-emerald-500/40'
                                    : 'bg-[var(--bg-card)] text-[var(--text-muted)] border border-[var(--border-subtle)]'
                                }`}
                              >
                                {opt.range}
                              </span>
                            </div>

                            <div className="flex items-center gap-1.5 mt-0.5">
                              <span className="text-[10px] font-bold text-emerald-400/80">
                                {opt.badge}
                              </span>
                            </div>

                            <p className="text-[10px] text-[var(--text-muted)] mt-1 line-clamp-2 leading-relaxed">
                              {opt.description}
                            </p>
                          </div>
                        </button>
                      );
                    })}
                  </div>

                  <div className="pt-2 border-t border-[var(--border-subtle)] px-1 flex items-center justify-between text-[10px] text-[var(--text-muted)]">
                    <span>Applies across App &amp; GPDP PDF</span>
                    <span className="text-emerald-400 font-bold">
                      Click to load &rarr;
                    </span>
                  </div>
                </div>
              )}
            </div>

            <button
              type="button"
              onClick={handleDownloadPdf}
              disabled={isDownloadingPdf}
              className="inline-flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-bold bg-[var(--bg-primary)] hover:bg-[var(--bg-card-hover)] text-[var(--text-main)] border border-[var(--border-subtle)] hover:border-emerald-500/40 shadow-sm transition-all active:scale-95 cursor-pointer disabled:opacity-50"
              title="Download Official GPDP Plan PDF Report"
            >
              {isDownloadingPdf ? (
                <>
                  <Loader2 className="w-3.5 h-3.5 animate-spin text-emerald-500" />
                  <span className="hidden sm:inline">Generating...</span>
                </>
              ) : (
                <>
                  <FileText className="w-3.5 h-3.5 text-emerald-500" />
                  <span className="hidden sm:inline">GPDP Plan</span>
                  <Download className="w-3 h-3 text-[var(--text-muted)]" />
                </>
              )}
            </button>
          </div>

          {/* Visual Theme Toggle & Customizer Control in Top Navigation */}
          <div className="flex items-center gap-1.5 flex-shrink-0">
            {/* Primary Dark/Light Mode Toggle with Label */}
            <button
              type="button"
              onClick={toggleMode}
              className="inline-flex items-center gap-2 px-3 py-2 rounded-xl text-xs font-bold bg-[var(--bg-primary)] hover:bg-[var(--bg-card-hover)] text-[var(--text-main)] border border-[var(--border-subtle)] hover:border-emerald-500/40 transition-all shadow-sm active:scale-95 cursor-pointer"
              title={themeConfig.mode === 'light' ? 'Switch to Dark Mode' : 'Switch to Light Mode'}
              aria-label="Toggle Dark/Light Mode"
            >
              {themeConfig.mode === 'light' ? (
                <>
                  <Sun className="w-4 h-4 text-amber-500" />
                  <span className="font-semibold text-xs hidden sm:inline">Light Mode</span>
                </>
              ) : (
                <>
                  <Moon className="w-4 h-4 text-emerald-400" style={{ color: activePalette.primary }} />
                  <span className="font-semibold text-xs hidden sm:inline">Dark Mode</span>
                </>
              )}
            </button>

            {/* Visual Palette Customizer Trigger */}
            <button
              type="button"
              onClick={toggleCustomizer}
              className="p-2 rounded-xl bg-[var(--bg-primary)] hover:bg-[var(--bg-card-hover)] text-[var(--text-main)] border border-[var(--border-subtle)] hover:border-emerald-500/40 transition-all shadow-sm cursor-pointer active:scale-95"
              title="Open Visual Theme & Palette Customizer"
              aria-label="Open Theme Customizer"
            >
              <Palette className="w-4 h-4 text-emerald-500" style={{ color: activePalette.primary }} />
            </button>
          </div>

          {/* User Profile Avatar (DI Logo) & Sign Out */}
          <div className="relative flex items-center gap-2 pl-2 border-l border-[var(--border-subtle)]" ref={profileMenuRef}>
            <button
              type="button"
              onClick={() => setIsProfileOpen((prev) => !prev)}
              className="w-8 h-8 rounded-xl bg-gradient-to-tr from-emerald-600 to-teal-500 hover:from-emerald-500 hover:to-teal-400 flex items-center justify-center text-white text-xs font-black shadow-md border border-white/20 transition-all hover:scale-105 active:scale-95 cursor-pointer ring-2 ring-transparent hover:ring-emerald-400/40"
              title={`${user?.name || 'Citizen'} • Click to view Citizen Portal & Profile`}
              aria-label="User Profile and Citizen Portal"
            >
              {getInitials(user?.name)}
            </button>

            <button
              onClick={logout}
              title="Logout from GramPulse AI"
              className="p-2 bg-red-500/10 hover:bg-red-500/20 text-red-400 hover:text-red-300 border border-red-500/30 rounded-xl transition-all cursor-pointer active:scale-95"
            >
              <LogOut className="w-3.5 h-3.5" />
            </button>

            {/* NEAT CITIZEN PROFILE & PORTAL DROPDOWN (Clicking DI Logo) */}
            {isProfileOpen && (
              <div className="absolute right-0 top-full mt-2.5 w-80 sm:w-96 rounded-2xl bg-[var(--bg-card)] border border-[var(--border-subtle)] shadow-2xl p-4 sm:p-5 z-50 backdrop-blur-xl animate-in fade-in zoom-in-95 duration-150 space-y-3.5">
                {/* 1. User Identity Header (Name + Gmail) */}
                <div className="flex items-center gap-3.5 pb-3 border-b border-[var(--border-subtle)]">
                  <div className="w-11 h-11 rounded-2xl bg-gradient-to-tr from-emerald-600 to-teal-500 flex items-center justify-center text-white text-sm font-black shadow-lg shadow-emerald-950/40 ring-2 ring-emerald-400/30 shrink-0">
                    {getInitials(user?.name)}
                  </div>
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-2">
                      <h4 className="text-sm font-black text-[var(--text-main)] truncate capitalize">
                        {user?.name || 'Citizen User'}
                      </h4>
                      <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-500/15 text-emerald-400 border border-emerald-500/30">
                        Citizen
                      </span>
                    </div>
                    <p className="text-xs text-[var(--text-muted)] truncate flex items-center gap-1.5 mt-0.5">
                      <Mail className="w-3.5 h-3.5 shrink-0 text-emerald-400" />
                      <span className="truncate">{user?.email || 'No email registered'}</span>
                    </p>
                  </div>
                </div>

                {/* 2. Citizen Portal Info Box (Moved cleanly from below search bar) */}
                <div
                  className="p-3.5 rounded-xl border text-xs space-y-2"
                  style={{
                    backgroundColor: `${activePalette.primary}12`,
                    borderColor: `${activePalette.primary}30`,
                  }}
                >
                  <div className="flex items-center justify-between gap-2">
                    <div className="flex items-center gap-1.5 font-bold" style={{ color: activePalette.primary }}>
                      <ShieldCheck className="w-4 h-4 shrink-0" />
                      <span>Citizen Portal Access</span>
                    </div>
                    <span className="flex items-center gap-1.5 text-[10px] font-mono text-[var(--text-muted)]">
                      <span
                        className="w-2 h-2 rounded-full animate-pulse shrink-0"
                        style={{ backgroundColor: activePalette.primary }}
                      />
                      PostGIS Cluster Active
                    </span>
                  </div>

                  <p className="text-[11px] text-[var(--text-muted)] leading-relaxed">
                    Active Multi-Location GPDP Planning, Census Cohorts &amp; Grievance Access.
                  </p>
                </div>

                {/* Preserved Citizen Grievance Action */}
                {onOpenReportModal && (
                  <button
                    type="button"
                    onClick={() => {
                      setIsProfileOpen(false);
                      onOpenReportModal();
                    }}
                    className="w-full px-3 py-2 rounded-xl bg-emerald-500/10 hover:bg-emerald-500/20 text-emerald-400 hover:text-emerald-300 border border-emerald-500/30 text-xs font-bold flex items-center justify-center gap-2 transition-all cursor-pointer active:scale-95"
                  >
                    <PlusCircle className="w-3.5 h-3.5" />
                    <span>Lodge / Report Citizen Grievance</span>
                  </button>
                )}

                {/* 3. Action Footer (Sign Out) */}
                <div className="pt-1 flex items-center justify-between gap-3 border-t border-[var(--border-subtle)]">
                  <span className="text-[10px] text-[var(--text-muted)] font-mono">
                    GramPulse AI Governance
                  </span>
                  <button
                    type="button"
                    onClick={() => {
                      setIsProfileOpen(false);
                      logout();
                    }}
                    className="px-3 py-1.5 rounded-xl bg-red-500/10 hover:bg-red-500/20 text-red-400 hover:text-red-300 border border-red-500/30 text-xs font-bold flex items-center gap-1.5 transition-all cursor-pointer active:scale-95"
                  >
                    <LogOut className="w-3.5 h-3.5" />
                    <span>Sign Out</span>
                  </button>
                </div>
              </div>
            )}
          </div>

        </div>

      </div>
    </header>
  );
}

Header.propTypes = {
  onOpenReportModal: PropTypes.func,
};
