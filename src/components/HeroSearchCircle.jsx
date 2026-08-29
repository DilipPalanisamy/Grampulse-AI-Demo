import React, { useState, useRef, useEffect } from 'react';
import PropTypes from 'prop-types';
import {
  Search,
  Compass,
  ArrowRight,
  Sparkles,
  MapPin,
  Globe,
  Loader2,
  X,
  Building2,
  Layers,
} from 'lucide-react';
import { useLocation } from '../context/LocationContext';
import { useTheme } from '../context/ThemeContext';

function HeroSearchCircle({ onNavigateToMap }) {
  const { activePalette } = useTheme();
  const {
    locations,
    selectedLocation,
    selectedGpId,
    selectLocation,
    searchQuery,
    searchResults,
    isSearching,
    handleSearch,
  } = useLocation();

  const [inputVal, setInputVal] = useState('');
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const dropdownRef = useRef(null);

  useEffect(() => {
    const handleOutsideClick = (e) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target)) {
        setIsDropdownOpen(false);
      }
    };
    document.addEventListener('mousedown', handleOutsideClick);
    return () => document.removeEventListener('mousedown', handleOutsideClick);
  }, []);

  const handleInputChange = (e) => {
    const val = e.target.value;
    setInputVal(val);
    handleSearch(val);
    setIsDropdownOpen(true);
  };

  const handleSelectVillage = (village) => {
    selectLocation(village);
    setInputVal(village.gp_name);
    setIsDropdownOpen(false);
    if (onNavigateToMap) {
      onNavigateToMap();
    }
  };

  const quickPanchayats = [
    { name: 'Odanthurai (TN)', id: 4 },
    { name: 'Keeladi (TN)', id: 7 },
    { name: 'Thiruvaiyaru (TN)', id: 8 },
    { name: 'Punsari (GJ)', id: 2 },
    { name: 'Hiware Bazar (MH)', id: 1 },
    { name: 'Kuthambakkam (TN)', id: 6 },
  ];

  const displayResults =
    inputVal.trim().length > 0
      ? searchResults
      : locations.slice(0, 6);

  return (
    <div className="relative w-full flex flex-col items-center justify-center py-6 sm:py-10">
      {/* Central Search Circle Hub Container */}
      <div className="relative group">
        {/* Ambient Gradient Glow Rings */}
        <div
          className="absolute -inset-4 rounded-full blur-2xl group-hover:blur-3xl transition-all duration-500 animate-pulse pointer-events-none"
          style={{
            background: `radial-gradient(circle, ${activePalette.primary}40, ${activePalette.secondary}25, transparent)`,
          }}
        />
        <div
          className="absolute -inset-1 rounded-full blur-sm group-hover:blur-md transition-all duration-300 pointer-events-none"
          style={{
            background: `linear-gradient(135deg, ${activePalette.primary}50, ${activePalette.secondary}40)`,
          }}
        />

        {/* Search Circle Core Frame */}
        <div
          ref={dropdownRef}
          className="relative w-72 h-72 sm:w-80 sm:h-80 md:w-96 md:h-96 rounded-full border-4 bg-[var(--bg-card-glass)] shadow-2xl backdrop-blur-2xl flex flex-col items-center justify-center p-6 text-center z-20"
          style={{
            borderColor: `${activePalette.primary}50`,
            boxShadow: `0 20px 40px -10px ${activePalette.primary}40`,
          }}
        >
          {/* Top Emblem & Badge */}
          <div className="flex flex-col items-center space-y-1 mb-2">
            <div
              className="w-11 h-11 rounded-2xl border flex items-center justify-center text-white shadow-lg ring-2"
              style={{
                background: `linear-gradient(135deg, ${activePalette.primary}, ${activePalette.secondary})`,
                borderColor: `${activePalette.primary}60`,
                boxShadow: `0 10px 20px -5px ${activePalette.primary}60`,
                ringColor: `${activePalette.primary}30`,
              }}
            >
              <Compass className="w-6 h-6 animate-spin-slow" />
            </div>
            <span className="text-[10px] font-bold tracking-widest uppercase" style={{ color: activePalette.primary }}>
              GIS Spatial Hub
            </span>
          </div>

          {/* Heading */}
          <h3 className="text-base sm:text-lg font-black text-[var(--text-main)] tracking-tight leading-snug">
            Explore Any Village in India
          </h3>
          <p className="text-[11px] text-[var(--text-muted)] max-w-[210px] leading-tight mb-3">
            Real census demographics, satellite imagery &amp; AI GPDP deficit planning
          </p>

          {/* Search Input Box */}
          <div className="w-full max-w-[250px] sm:max-w-[280px] relative mb-3">
            <div className="relative flex items-center">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none" style={{ color: activePalette.primary }}>
                <Search className="w-4 h-4" />
              </div>
              <input
                type="text"
                value={inputVal}
                onChange={handleInputChange}
                onFocus={() => setIsDropdownOpen(true)}
                placeholder="Search Village or City..."
                className="w-full pl-9 pr-8 py-2 bg-[var(--bg-primary)] border border-[var(--border-strong)] rounded-full text-xs text-[var(--text-main)] placeholder:text-[var(--text-muted)] focus:outline-none focus:ring-2 transition-all font-sans shadow-inner text-center"
                style={{
                  borderColor: inputVal ? activePalette.primary : undefined,
                }}
              />
              {inputVal ? (
                <button
                  type="button"
                  onClick={() => {
                    setInputVal('');
                    handleSearch('');
                  }}
                  className="absolute inset-y-0 right-0 pr-2.5 flex items-center text-[var(--text-muted)] hover:text-[var(--text-main)] cursor-pointer"
                >
                  <X className="w-3.5 h-3.5" />
                </button>
              ) : isSearching ? (
                <div className="absolute inset-y-0 right-0 pr-2.5 flex items-center pointer-events-none" style={{ color: activePalette.primary }}>
                  <Loader2 className="w-3.5 h-3.5 animate-spin" />
                </div>
              ) : null}
            </div>

            {/* Dropdown Results Overlay */}
            {isDropdownOpen && (
              <div className="absolute left-1/2 -translate-x-1/2 top-full mt-2 w-72 sm:w-80 bg-[var(--bg-card)] border border-[var(--border-strong)] rounded-2xl shadow-2xl z-50 p-2 space-y-1 backdrop-blur-2xl max-h-56 overflow-y-auto custom-scrollbar text-left">
                <div className="flex items-center justify-between px-2 py-1 border-b border-[var(--border-subtle)] text-[10px] font-bold text-[var(--text-muted)] uppercase tracking-wider">
                  <span className="flex items-center gap-1" style={{ color: activePalette.primary }}>
                    <Globe className="w-3 h-3" />
                    {inputVal ? 'Live Matches' : 'Verified Panchayats'}
                  </span>
                  <span>{displayResults.length} Found</span>
                </div>

                {displayResults.length === 0 ? (
                  <div className="py-4 text-center text-xs text-[var(--text-muted)]">
                    Searching for &ldquo;{inputVal}&rdquo;...
                  </div>
                ) : (
                  displayResults.map((village) => (
                    <button
                      key={`hero-${village.gp_id}-${village.gp_name}`}
                      type="button"
                      onClick={() => handleSelectVillage(village)}
                      className="w-full flex items-center justify-between p-2 rounded-xl hover:bg-[var(--bg-card-hover)] text-[var(--text-muted)] hover:text-[var(--text-main)] transition-all cursor-pointer text-left"
                    >
                      <div className="flex items-center gap-2 truncate">
                        <MapPin className="w-3.5 h-3.5 flex-shrink-0" style={{ color: activePalette.primary }} />
                        <div className="truncate">
                          <p className="text-xs font-bold text-[var(--text-main)] leading-tight truncate">
                            {village.gp_name}
                          </p>
                          <p className="text-[10px] text-[var(--text-muted)] truncate">
                            {village.district}, {village.state}
                          </p>
                        </div>
                      </div>
                      <span
                        className="text-[9px] font-mono font-semibold px-1.5 py-0.5 rounded border flex-shrink-0"
                        style={{
                          color: activePalette.primary,
                          backgroundColor: `${activePalette.primary}15`,
                          borderColor: `${activePalette.primary}30`,
                        }}
                      >
                        {village.gp_code || 'GP-LIVE'}
                      </span>
                    </button>
                  ))
                )}
              </div>
            )}
          </div>

          {/* Action Button: Explore Interactive GIS Map */}
          <button
            type="button"
            onClick={onNavigateToMap}
            className="inline-flex items-center gap-2 px-4 py-2 rounded-full text-white text-xs font-bold shadow-lg transition-all active:scale-95 cursor-pointer"
            style={{
              background: `linear-gradient(135deg, ${activePalette.primary}, ${activePalette.secondary})`,
              boxShadow: `0 10px 20px -5px ${activePalette.primary}60`,
            }}
          >
            <span>Launch Satellite Map</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>

      {/* Quick-Pick Popular Panchayats Bar */}
      <div className="mt-5 flex flex-wrap items-center justify-center gap-2 max-w-xl px-4">
        <span className="text-[11px] font-bold text-[var(--text-muted)] flex items-center gap-1 mr-1">
          <Sparkles className="w-3 h-3" style={{ color: activePalette.primary }} /> Quick Habitations:
        </span>
        {quickPanchayats.map((p) => {
          const isSelected = Number(selectedGpId) === Number(p.id);
          return (
            <button
              key={`quick-${p.id}`}
              type="button"
              onClick={() => {
                const target = locations.find((l) => Number(l.gp_id) === Number(p.id));
                if (target) {
                  selectLocation(target);
                }
              }}
              className={`px-3 py-1 rounded-full text-xs font-bold transition-all cursor-pointer ${
                isSelected
                  ? 'text-white shadow-md scale-105'
                  : 'bg-[var(--bg-card)] hover:bg-[var(--bg-card-hover)] text-[var(--text-muted)] hover:text-[var(--text-main)] border border-[var(--border-subtle)]'
              }`}
              style={{
                backgroundColor: isSelected ? activePalette.primary : undefined,
              }}
            >
              {p.name}
            </button>
          );
        })}
      </div>
    </div>
  );
}

HeroSearchCircle.propTypes = {
  onNavigateToMap: PropTypes.func.isRequired,
};

export default React.memo(HeroSearchCircle);
