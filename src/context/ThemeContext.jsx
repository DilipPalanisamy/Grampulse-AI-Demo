import React, { createContext, useContext, useState, useEffect, useCallback, useMemo } from 'react';
import PropTypes from 'prop-types';

const ThemeContext = createContext(null);

export const THEME_PALETTES = {
  emerald: {
    id: 'emerald',
    name: 'Emerald & Teal (Official)',
    description: 'National Rural Governance & Sustainable Green',
    primary: '#10B981', // emerald-500
    primaryHover: '#059669', // emerald-600
    secondary: '#14B8A6', // teal-500
    glow: 'rgba(16, 185, 129, 0.20)',
    accentBg: 'rgba(16, 185, 129, 0.10)',
    badgeBorder: 'rgba(16, 185, 129, 0.30)',
    gradient: 'from-emerald-600 via-emerald-500 to-teal-400',
    swatch: '#10B981',
  },
  blue: {
    id: 'blue',
    name: 'Governance Blue',
    description: 'Central Ministry & Policy Administrative',
    primary: '#2563EB', // blue-600
    primaryHover: '#1D4ED8', // blue-700
    secondary: '#0284C7', // sky-600
    glow: 'rgba(37, 99, 235, 0.20)',
    accentBg: 'rgba(37, 99, 235, 0.10)',
    badgeBorder: 'rgba(37, 99, 235, 0.30)',
    gradient: 'from-blue-600 via-blue-500 to-sky-400',
    swatch: '#2563EB',
  },
  cyan: {
    id: 'cyan',
    name: 'Cyan Telemetry',
    description: 'Geospatial Satellite & Hydrological GIS',
    primary: '#06B6D4', // cyan-500
    primaryHover: '#0891B2', // cyan-600
    secondary: '#0EA5E9', // sky-500
    glow: 'rgba(6, 182, 212, 0.20)',
    accentBg: 'rgba(6, 182, 212, 0.10)',
    badgeBorder: 'rgba(6, 182, 212, 0.30)',
    gradient: 'from-cyan-600 via-cyan-500 to-sky-400',
    swatch: '#06B6D4',
  },
  indigo: {
    id: 'indigo',
    name: 'Indigo Analytics',
    description: 'Demographic Machine Learning & Forecasting',
    primary: '#6366F1', // indigo-500
    primaryHover: '#4F46E5', // indigo-600
    secondary: '#8B5CF6', // violet-500
    glow: 'rgba(99, 102, 241, 0.20)',
    accentBg: 'rgba(99, 102, 241, 0.10)',
    badgeBorder: 'rgba(99, 102, 241, 0.30)',
    gradient: 'from-indigo-600 via-indigo-500 to-violet-400',
    swatch: '#6366F1',
  },
  amber: {
    id: 'amber',
    name: 'Amber Solar',
    description: 'Solar Infrastructure & PM-KUSUM Energy',
    primary: '#F59E0B', // amber-500
    primaryHover: '#D97706', // amber-600
    secondary: '#EA580C', // orange-600
    glow: 'rgba(245, 158, 11, 0.20)',
    accentBg: 'rgba(245, 158, 11, 0.10)',
    badgeBorder: 'rgba(245, 158, 11, 0.30)',
    gradient: 'from-amber-600 via-amber-500 to-orange-400',
    swatch: '#F59E0B',
  },
};

export const CANVAS_MODES = {
  particles: { id: 'particles', name: 'Constellation Particles', icon: 'Sparkles' },
  waves: { id: 'waves', name: 'Fluid Waves', icon: 'Waves' },
  orbs: { id: 'orbs', name: 'Glowing Orbs', icon: 'Radio' },
  grid: { id: 'grid', name: 'Cyber Grid', icon: 'Grid' },
  none: { id: 'none', name: 'Disabled', icon: 'EyeOff' },
};

const THEME_STORAGE_KEY = 'grampulse_theme_config';

const DEFAULT_THEME_CONFIG = {
  palette: 'emerald',
  mode: 'dark', // 'dark' | 'light'
  canvasEffect: 'particles', // 'particles' | 'waves' | 'orbs' | 'grid' | 'none'
  canvasSpeed: 0.85,
  canvasOpacity: 0.50,
  particleCount: 50,
};

export const ThemeProvider = ({ children }) => {
  const [themeConfig, setThemeConfig] = useState(() => {
    try {
      const saved = localStorage.getItem(THEME_STORAGE_KEY);
      if (saved) {
        return { ...DEFAULT_THEME_CONFIG, ...JSON.parse(saved) };
      }
    } catch (e) {
      console.warn('Failed to load theme configuration from localStorage:', e);
    }
    return DEFAULT_THEME_CONFIG;
  });

  const [isCustomizerOpen, setIsCustomizerOpen] = useState(false);

  // Apply Professional CSS Variables & Data Attributes to Document Root
  useEffect(() => {
    try {
      localStorage.setItem(THEME_STORAGE_KEY, JSON.stringify(themeConfig));
    } catch (e) {
      console.warn('Could not save theme config:', e);
    }

    const palette = THEME_PALETTES[themeConfig.palette] || THEME_PALETTES.emerald;
    const root = document.documentElement;

    root.setAttribute('data-theme', themeConfig.mode);

    root.style.setProperty('--theme-primary', palette.primary);
    root.style.setProperty('--theme-primary-hover', palette.primaryHover);
    root.style.setProperty('--theme-secondary', palette.secondary);
    root.style.setProperty('--theme-glow', palette.glow);
    root.style.setProperty('--theme-accent-bg', palette.accentBg);
    root.style.setProperty('--theme-badge-border', palette.badgeBorder);

    if (themeConfig.mode === 'light') {
      root.classList.remove('dark');
      root.classList.add('light');
      root.style.setProperty('--bg-primary', '#F8FAFC');
      root.style.setProperty('--bg-card', '#FFFFFF');
      root.style.setProperty('--bg-card-glass', 'rgba(255, 255, 255, 0.90)');
      root.style.setProperty('--text-main', '#0F172A');
      root.style.setProperty('--text-muted', '#475569');
      root.style.setProperty('--border-subtle', '#E2E8F0');
      root.style.setProperty('--border-strong', '#CBD5E1');
    } else {
      root.classList.remove('light');
      root.classList.add('dark');
      root.style.setProperty('--bg-primary', '#0B0F19');
      root.style.setProperty('--bg-card', '#111827');
      root.style.setProperty('--bg-card-glass', 'rgba(17, 24, 39, 0.85)');
      root.style.setProperty('--text-main', '#F9FAFB');
      root.style.setProperty('--text-muted', '#9CA3AF');
      root.style.setProperty('--border-subtle', '#1F2937');
      root.style.setProperty('--border-strong', '#374151');
    }
  }, [themeConfig]);

  const activePalette = useMemo(() => {
    return THEME_PALETTES[themeConfig.palette] || THEME_PALETTES.emerald;
  }, [themeConfig.palette]);

  const setPalette = useCallback((paletteId) => {
    if (THEME_PALETTES[paletteId]) {
      setThemeConfig((prev) => ({ ...prev, palette: paletteId }));
    }
  }, []);

  const setMode = useCallback((mode) => {
    setThemeConfig((prev) => ({ ...prev, mode: mode === 'light' ? 'light' : 'dark' }));
  }, []);

  const toggleMode = useCallback(() => {
    setThemeConfig((prev) => ({ ...prev, mode: prev.mode === 'light' ? 'dark' : 'light' }));
  }, []);

  const setCanvasEffect = useCallback((effectId) => {
    if (CANVAS_MODES[effectId]) {
      setThemeConfig((prev) => ({ ...prev, canvasEffect: effectId }));
    }
  }, []);

  const setCanvasSpeed = useCallback((speed) => {
    setThemeConfig((prev) => ({ ...prev, canvasSpeed: Math.max(0.2, Math.min(2.5, Number(speed))) }));
  }, []);

  const setCanvasOpacity = useCallback((opacity) => {
    setThemeConfig((prev) => ({ ...prev, canvasOpacity: Math.max(0.05, Math.min(1.0, Number(opacity))) }));
  }, []);

  const setParticleCount = useCallback((count) => {
    setThemeConfig((prev) => ({ ...prev, particleCount: Math.max(15, Math.min(120, Number(count))) }));
  }, []);

  const resetTheme = useCallback(() => {
    setThemeConfig(DEFAULT_THEME_CONFIG);
  }, []);

  const toggleCustomizer = useCallback(() => {
    setIsCustomizerOpen((prev) => !prev);
  }, []);

  const value = {
    themeConfig,
    activePalette,
    palettes: THEME_PALETTES,
    canvasModes: CANVAS_MODES,
    isCustomizerOpen,
    setIsCustomizerOpen,
    toggleCustomizer,
    setPalette,
    setMode,
    toggleMode,
    setCanvasEffect,
    setCanvasSpeed,
    setCanvasOpacity,
    setParticleCount,
    resetTheme,
  };

  return <ThemeContext.Provider value={value}>{children}</ThemeContext.Provider>;
};

ThemeProvider.propTypes = {
  children: PropTypes.node.isRequired,
};

export const useTheme = () => {
  const context = useContext(ThemeContext);
  if (!context) {
    throw new Error('useTheme must be used within a ThemeProvider');
  }
  return context;
};

export default ThemeContext;
