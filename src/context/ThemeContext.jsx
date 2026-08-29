import React, { createContext, useContext, useState, useEffect, useCallback, useMemo } from 'react';
import PropTypes from 'prop-types';

const ThemeContext = createContext(null);

export const THEME_PALETTES = {
  emerald: {
    id: 'emerald',
    name: 'Emerald Wave',
    description: 'Rural Governance & Sustainable Green',
    primary: '#10b981', // emerald-500
    primaryHover: '#059669', // emerald-600
    secondary: '#14b8a6', // teal-500
    glow: 'rgba(16, 185, 129, 0.25)',
    accentBg: 'rgba(16, 185, 129, 0.12)',
    badgeBorder: 'rgba(16, 185, 129, 0.35)',
    gradient: 'from-emerald-600 via-emerald-500 to-teal-400',
    swatch: '#10b981',
  },
  indigo: {
    id: 'indigo',
    name: 'Indigo Neon',
    description: 'Deep High-Tech & Neural AI',
    primary: '#6366f1', // indigo-500
    primaryHover: '#4f46e5', // indigo-600
    secondary: '#8b5cf6', // violet-500
    glow: 'rgba(99, 102, 241, 0.25)',
    accentBg: 'rgba(99, 102, 241, 0.12)',
    badgeBorder: 'rgba(99, 102, 241, 0.35)',
    gradient: 'from-indigo-600 via-indigo-500 to-violet-400',
    swatch: '#6366f1',
  },
  cyan: {
    id: 'cyan',
    name: 'Cyan Tech',
    description: 'Clean Futuristic Spatial Telemetry',
    primary: '#06b6d4', // cyan-500
    primaryHover: '#0891b2', // cyan-600
    secondary: '#3b82f6', // blue-500
    glow: 'rgba(6, 182, 212, 0.25)',
    accentBg: 'rgba(6, 182, 212, 0.12)',
    badgeBorder: 'rgba(6, 182, 212, 0.35)',
    gradient: 'from-cyan-600 via-cyan-500 to-blue-400',
    swatch: '#06b6d4',
  },
  violet: {
    id: 'violet',
    name: 'Violet Cyber',
    description: 'Vibrant Cybernetic Intelligence',
    primary: '#8b5cf6', // violet-500
    primaryHover: '#7c3aed', // violet-600
    secondary: '#d946ef', // fuchsia-500
    glow: 'rgba(139, 92, 246, 0.25)',
    accentBg: 'rgba(139, 92, 246, 0.12)',
    badgeBorder: 'rgba(139, 92, 246, 0.35)',
    gradient: 'from-violet-600 via-violet-500 to-fuchsia-400',
    swatch: '#8b5cf6',
  },
  rose: {
    id: 'rose',
    name: 'Rose Glow',
    description: 'High-Impact Dynamic Analytics',
    primary: '#f43f5e', // rose-500
    primaryHover: '#e11d48', // rose-600
    secondary: '#fb7185', // rose-400
    glow: 'rgba(244, 63, 94, 0.25)',
    accentBg: 'rgba(244, 63, 94, 0.12)',
    badgeBorder: 'rgba(244, 63, 94, 0.35)',
    gradient: 'from-rose-600 via-rose-500 to-pink-400',
    swatch: '#f43f5e',
  },
  amber: {
    id: 'amber',
    name: 'Amber Solar',
    description: 'Solar Energy & Warm Governance',
    primary: '#f59e0b', // amber-500
    primaryHover: '#d97706', // amber-600
    secondary: '#ea580c', // orange-600
    glow: 'rgba(245, 158, 11, 0.25)',
    accentBg: 'rgba(245, 158, 11, 0.12)',
    badgeBorder: 'rgba(245, 158, 11, 0.35)',
    gradient: 'from-amber-600 via-amber-500 to-orange-400',
    swatch: '#f59e0b',
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
  canvasSpeed: 1.0, // 0.2 - 2.0
  canvasOpacity: 0.65, // 0.1 - 1.0
  particleCount: 55, // 20 - 100
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

  // Apply CSS Variables to Document Root
  useEffect(() => {
    try {
      localStorage.setItem(THEME_STORAGE_KEY, JSON.stringify(themeConfig));
    } catch (e) {
      console.warn('Could not save theme config:', e);
    }

    const palette = THEME_PALETTES[themeConfig.palette] || THEME_PALETTES.emerald;
    const root = document.documentElement;

    root.style.setProperty('--theme-primary', palette.primary);
    root.style.setProperty('--theme-primary-hover', palette.primaryHover);
    root.style.setProperty('--theme-secondary', palette.secondary);
    root.style.setProperty('--theme-glow', palette.glow);
    root.style.setProperty('--theme-accent-bg', palette.accentBg);
    root.style.setProperty('--theme-badge-border', palette.badgeBorder);

    if (themeConfig.mode === 'light') {
      root.classList.remove('dark');
      root.classList.add('light');
    } else {
      root.classList.remove('light');
      root.classList.add('dark');
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
