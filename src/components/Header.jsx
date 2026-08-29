import React, { useState, useRef, useEffect } from 'react';
import PropTypes from 'prop-types';
import {
  Sparkles,
  Calendar,
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
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { useLocation } from '../context/LocationContext';
import { useTheme } from '../context/ThemeContext';
import ReportDownloadButton from './ReportDownloadButton';

export default function Header({ onOpenReportModal }) {
  const { user, logout } = useAuth();
  const { themeConfig, toggleMode, activePalette } = useTheme();
  const {
    locations,
    selectedLocation,
    selectedGpId,
    selectLocation,
    planningHorizon,
    setPlanningHorizon,
    searchResults,
    isSearching,
    handleSearch,
    activeTab,
    setActiveTab,
  } = useLocation();

  const [isSearchOpen, setIsSearchOpen] = useState(false);
  const [localInput, setLocalInput] = useState('');
  const searchContainerRef = useRef(null);

  // Close search dropdown on outside click
  useEffect(() => {
    const handleOutsideClick = (e) => {
      if (searchContainerRef.current && !searchContainerRef.current.contains(e.target)) {
        setIsSearchOpen(false);
      }
    };
    document.addEventListener('mousedown', handleOutsideClick);
    return () => document.removeEventListener('mousedown', handleOutsideClick);
  }, []);

  const getInitials = (name) => {
    if (!name) return 'CI';
    const parts = name.trim().split(' ');
    if (parts.length >= 2) {
      return (parts[0][0] + parts[1][0]).toUpperCase();
    }
    return name.slice(0, 2).toUpperCase();
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
    selectLocation(village);
    setIsSearchOpen(false);
    setLocalInput(village.gp_name);
  };

  // Determine items to display: search results if typing, or top habitations by default
  const displayResults =
    localInput.trim().length > 0
      ? searchResults
      : locations.slice(0, 8);

  return (
    <header className="sticky top-0 z-[1200] overflow-visible bg-slate-950 border-b border-slate-800 text-white shadow-2xl backdrop-blur-xl">
      <div className="flex items-center justify-between w-full px-4 sm:px-6 py-2.5 min-h-[64px] gap-3 lg:gap-4 overflow-visible">
        
        {/* ================================================================= */}
        {/* 1. FAR LEFT: BRAND HEADER & LOGO                                  */}
        {/* ================================================================= */}
        <div className="flex items-center gap-3 flex-shrink-0 justify-start">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-emerald-600 via-emerald-500 to-teal-400 flex items-center justify-center text-white shadow-md shadow-emerald-950/60 ring-2 ring-emerald-400/20 flex-shrink-0">
            <Sparkles className="w-5 h-5" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-base sm:text-lg font-black tracking-tight text-white font-sans">
                GramPulse <span className="text-emerald-400 font-extrabold">AI</span>
              </h1>
              <span className="hidden xl:inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-semibold bg-emerald-500/15 text-emerald-300 border border-emerald-500/30">
                MoPR GIS v1.0
              </span>
            </div>
            <p className="text-[11px] text-slate-400 hidden sm:block truncate max-w-xs">
              Tamil Nadu & National Village Governance
            </p>
          </div>
        </div>

        {/* ================================================================= */}
        {/* 2. CENTER: EXPANDED SEARCH BAR & ACTION BUTTONS                   */}
        {/* ================================================================= */}
        <div className="flex items-center justify-center gap-3 lg:gap-4 flex-1 max-w-4xl mx-2 overflow-visible">
          
          {/* Expanded Wide Search Bar with Live Dynamic Autocomplete Overlay */}
          <div className="relative flex-1 max-w-md w-full overflow-visible" ref={searchContainerRef}>
            <div className="relative flex items-center">
              <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-emerald-400">
                <Search className="w-4 h-4" />
              </div>
              <input
                type="text"
                value={localInput || (selectedLocation ? selectedLocation.gp_name : '')}
                onChange={handleInputChange}
                onFocus={() => {
                  setIsSearchOpen(true);
                  if (!localInput && selectedLocation) {
                    handleSearch('');
                  }
                }}
                placeholder="Search village, city, or Panchayat..."
                className="w-full pl-10 pr-9 py-2 bg-slate-900 border border-slate-700 focus:border-emerald-500 rounded-xl text-slate-100 placeholder-slate-400 focus:outline-none focus:ring-1 focus:ring-emerald-500 transition-all font-sans text-xs sm:text-sm shadow-inner"
              />
              {localInput ? (
                <button
                  type="button"
                  onClick={handleClear}
                  className="absolute inset-y-0 right-0 pr-3 flex items-center text-slate-500 hover:text-slate-300 cursor-pointer"
                >
                  <X className="w-4 h-4" />
                </button>
              ) : isSearching ? (
                <div className="absolute inset-y-0 right-0 pr-3 flex items-center text-emerald-400 pointer-events-none">
                  <Loader2 className="w-4 h-4 animate-spin" />
                </div>
              ) : null}
            </div>

            {/* Absolute Dropdown Results List directly below Search Bar */}
            {isSearchOpen && (
              <div className="absolute left-0 right-0 top-full mt-2 w-full bg-slate-900 border border-slate-700/90 rounded-2xl shadow-2xl z-[1500] p-2 space-y-1.5 backdrop-blur-2xl animate-fadeIn max-h-80 overflow-y-auto custom-scrollbar">
                <div className="flex items-center justify-between px-2 py-1 border-b border-slate-800 text-[10px] font-bold text-slate-400 uppercase tracking-wider">
                  <span className="flex items-center gap-1 text-emerald-400">
                    <Globe className="w-3 h-3" />
                    {localInput.trim().length > 0 ? 'Live Search & Geocoded Matches' : 'Popular Panchayats'}
                  </span>
                  <span>{displayResults.length} Found</span>
                </div>

                {displayResults.length === 0 ? (
                  <div className="py-6 text-center text-xs text-slate-400 space-y-1">
                    <p className="font-semibold text-slate-300">Searching for &ldquo;{localInput}&rdquo;...</p>
                    <p className="text-[11px] text-slate-500">Querying OpenStreetMap Geocoding API</p>
                  </div>
                ) : (
                  displayResults.map((village) => {
                    const isSelected = Number(village.gp_id) === Number(selectedGpId);
                    const isTN = (village.state || '').toLowerCase().includes('tamil');

                    return (
                      <button
                        key={`search-${village.gp_id}-${village.gp_name}`}
                        type="button"
                        onClick={() => handleSelectVillage(village)}
                        className={`w-full flex items-center justify-between p-2.5 rounded-xl text-left transition-all cursor-pointer ${
                          isSelected
                            ? 'bg-emerald-950/60 border border-emerald-500/50 text-white shadow-md'
                            : 'hover:bg-slate-800 text-slate-300 hover:text-white border border-transparent'
                        }`}
                      >
                        <div className="flex items-center gap-2.5 min-w-0">
                          <div
                            className={`w-8 h-8 rounded-lg flex items-center justify-center text-xs font-bold flex-shrink-0 ${
                              isSelected
                                ? 'bg-emerald-500 text-white shadow-sm'
                                : isTN
                                ? 'bg-amber-500/10 text-amber-400 border border-amber-500/30'
                                : 'bg-slate-800 text-slate-400'
                            }`}
                          >
                            <MapPin className="w-4 h-4" />
                          </div>
                          <div className="min-w-0 truncate">
                            <p className="text-xs font-bold text-slate-100 leading-tight truncate">
                              {village.gp_name}
                            </p>
                            <p className="text-[11px] text-slate-400 truncate">
                              {village.district} District, {village.state}
                            </p>
                          </div>
                        </div>

                        <div className="flex flex-col items-end flex-shrink-0 ml-2">
                          <span className="text-[10px] font-mono text-emerald-400 font-semibold px-1.5 py-0.2 rounded bg-emerald-500/10 border border-emerald-500/20">
                            {village.gp_code || 'GP-LIVE'}
                          </span>
                          {village.population && (
                            <span className="text-[9px] text-slate-500 font-mono mt-0.5">
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

          {/* Navigation Page Tabs (Dashboard vs Interactive Map) */}
          <div className="hidden lg:flex items-center gap-1 bg-slate-900 p-1 rounded-xl border border-slate-800 flex-shrink-0">
            <button
              type="button"
              onClick={() => setActiveTab('dashboard')}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                activeTab === 'dashboard'
                  ? 'bg-emerald-600 text-white shadow-md'
                  : 'text-slate-400 hover:text-white hover:bg-slate-800'
              }`}
            >
              <LayoutDashboard className="w-3.5 h-3.5" />
              <span>Dashboard</span>
            </button>
            <button
              type="button"
              onClick={() => setActiveTab('map')}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                activeTab === 'map'
                  ? 'bg-emerald-600 text-white shadow-md'
                  : 'text-slate-400 hover:text-white hover:bg-slate-800'
              }`}
            >
              <Map className="w-3.5 h-3.5" />
              <span>Interactive Map</span>
            </button>
          </div>

          {/* Planning Horizon Selector */}
          <div className="hidden md:flex items-center gap-1.5 bg-slate-900 px-2.5 py-1.5 rounded-xl border border-slate-800 text-xs text-slate-300 flex-shrink-0">
            <Calendar className="w-3.5 h-3.5 text-slate-400" />
            <span className="text-[11px]">Horizon:</span>
            <select
              value={planningHorizon}
              onChange={(e) => setPlanningHorizon(Number(e.target.value))}
              aria-label="Select Planning Horizon"
              className="bg-transparent text-emerald-400 font-bold focus:outline-none cursor-pointer text-xs"
            >
              <option value={3} className="bg-slate-900 text-white">3 Yrs</option>
              <option value={5} className="bg-slate-900 text-white">5 Yrs</option>
              <option value={7} className="bg-slate-900 text-white">7 Yrs</option>
            </select>
          </div>

          {/* Report Citizen Issue Action Button */}
          <button
            onClick={onOpenReportModal}
            className="inline-flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs sm:text-sm font-medium bg-slate-900 hover:bg-slate-800 text-slate-200 border border-slate-800 hover:border-slate-700 transition-colors shadow-sm active:scale-95 cursor-pointer flex-shrink-0"
            title="Submit a new geotagged citizen grievance"
          >
            <PlusCircle className="w-4 h-4 text-emerald-400" />
            <span className="hidden sm:inline">Report Issue</span>
          </button>

          {/* Export GPDP PDF Button */}
          <div className="flex-shrink-0">
            <ReportDownloadButton
              gpId={selectedLocation?.gp_id || selectedGpId}
              gpName={selectedLocation?.gp_name || 'Panchayat'}
              horizonYears={planningHorizon}
            />
          </div>
        </div>

        {/* ================================================================= */}
        {/* 3. FAR RIGHT: USER PROFILE & HIGH-CONTRAST LOGOUT BUTTON          */}
        {/* ================================================================= */}
        <div className="flex items-center gap-2.5 sm:gap-3 pl-2 sm:pl-3 border-l border-slate-800 flex-shrink-0 justify-end">
          {/* Quick Theme Toggle Button */}
          <button
            type="button"
            onClick={toggleMode}
            className="p-2 rounded-xl bg-slate-900 hover:bg-slate-800 text-slate-300 hover:text-white border border-slate-800 hover:border-slate-700 transition-colors shadow-sm cursor-pointer"
            title={themeConfig.mode === 'light' ? 'Switch to Dark Governance Mode' : 'Switch to Light Mode'}
            aria-label="Toggle Dark/Light Mode"
          >
            {themeConfig.mode === 'light' ? (
              <Sun className="w-4 h-4 text-amber-400" />
            ) : (
              <Moon className="w-4 h-4 text-emerald-400" style={{ color: activePalette.primary }} />
            )}
          </button>

          {/* User Profile Avatar & Metadata */}
          <div className="flex items-center gap-2.5">
            {user?.avatar ? (
              <img
                src={user.avatar}
                alt={user.name || 'Citizen'}
                className="w-8 h-8 rounded-xl object-cover ring-2 ring-emerald-500/40 shadow-sm"
              />
            ) : (
              <div
                className="w-8 h-8 rounded-xl bg-gradient-to-tr from-emerald-600 to-teal-500 flex items-center justify-center text-white text-xs font-black shadow-md border border-white/10"
                title={`${user?.name || 'Citizen'} (${user?.email || ''})`}
              >
                {getInitials(user?.name)}
              </div>
            )}
            <div className="hidden xl:flex flex-col text-left">
              <span className="text-xs font-bold text-slate-200 leading-tight truncate max-w-[130px]">
                {user?.name || 'Citizen Resident'}
              </span>
              <span className="text-[10px] text-slate-400 font-mono leading-none truncate max-w-[130px]" title={user?.email}>
                {user?.email || 'citizen@punsari.in'}
              </span>
            </div>
          </div>

          {/* High-Contrast Sign Out Button */}
          <button
            onClick={logout}
            title="Logout from GramPulse AI"
            className="flex items-center gap-2 px-3 py-1.5 bg-red-500/10 hover:bg-red-500/20 text-red-400 hover:text-red-300 border border-red-500/30 hover:border-red-500/50 rounded-lg text-xs font-semibold transition-all cursor-pointer active:scale-95 shadow-sm"
          >
            <LogOut className="w-3.5 h-3.5" />
            <span className="text-xs font-semibold">Sign Out</span>
          </button>
        </div>

      </div>
    </header>
  );
}

Header.propTypes = {
  onOpenReportModal: PropTypes.func.isRequired,
};
