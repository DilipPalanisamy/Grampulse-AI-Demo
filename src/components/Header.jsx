import React, { useState, useRef, useEffect, useCallback } from 'react';
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
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { useLocation } from '../context/LocationContext';
import { useTheme } from '../context/ThemeContext';

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
  } = useLocation();

  const [isSearchOpen, setIsSearchOpen] = useState(false);
  const [localInput, setLocalInput] = useState('');
  const searchContainerRef = useRef(null);
  const searchInputRef = useRef(null);

  const [isProfileOpen, setIsProfileOpen] = useState(false);
  const profileMenuRef = useRef(null);

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
    selectLocation(village, false);
    setIsSearchOpen(false);
    setLocalInput(village.gp_name || '');
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

  const displayResults =
    localInput.trim().length > 0
      ? (Array.isArray(searchResults) ? searchResults : [])
      : (Array.isArray(locations) ? locations.slice(0, 8) : []);

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
        <div className="flex-1 max-w-md lg:max-w-lg mx-2 sm:mx-3 relative overflow-visible" ref={searchContainerRef}>
          <div className="relative flex items-center group">
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
              placeholder="Search village, town, or Panchayat..."
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
                <kbd className="hidden sm:inline-flex items-center px-1.5 py-0.5 text-[10px] font-mono font-semibold text-[var(--text-muted)] bg-[var(--bg-card)] border border-[var(--border-subtle)] rounded-md shadow-xs pointer-events-none select-none">
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
                  {localInput.trim().length > 0 ? 'Live Geocoded Matches (Nominatim GIS)' : 'Registered Habitations'}
                </span>
                <span>{displayResults.length} Results</span>
              </div>

              {displayResults.length === 0 ? (
                <div className="py-7 text-center text-xs text-[var(--text-muted)] space-y-1">
                  <p className="font-semibold text-[var(--text-main)]">No habitations found for &ldquo;{localInput}&rdquo;</p>
                  <p className="text-[11px] text-[var(--text-subtle)]">Querying OpenStreetMap live geocoding directory...</p>
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
                            <HighlightMatch text={village.gp_name} query={localInput} />
                          </p>
                          <p className="text-[11px] text-[var(--text-muted)] truncate">
                            <HighlightMatch
                              text={`${village.district || 'District'} District, ${village.state || 'India'}`}
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
