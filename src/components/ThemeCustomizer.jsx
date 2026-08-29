import React from 'react';
import {
  Palette,
  X,
  Sparkles,
  Waves,
  Radio,
  Grid,
  EyeOff,
  Sun,
  Moon,
  RotateCcw,
  Sliders,
  Check,
  Zap,
} from 'lucide-react';
import { useTheme } from '../context/ThemeContext';

export default function ThemeCustomizer() {
  const {
    themeConfig,
    activePalette,
    palettes,
    canvasModes,
    isCustomizerOpen,
    setIsCustomizerOpen,
    toggleCustomizer,
    setPalette,
    setMode,
    setCanvasEffect,
    setCanvasSpeed,
    setCanvasOpacity,
    resetTheme,
  } = useTheme();

  const getCanvasIcon = (modeId) => {
    switch (modeId) {
      case 'particles':
        return <Sparkles className="w-4 h-4" />;
      case 'waves':
        return <Waves className="w-4 h-4" />;
      case 'orbs':
        return <Radio className="w-4 h-4" />;
      case 'grid':
        return <Grid className="w-4 h-4" />;
      case 'none':
      default:
        return <EyeOff className="w-4 h-4" />;
    }
  };

  return (
    <>
      {/* Floating Theme Launcher Button (Bottom-Left) */}
      <button
        type="button"
        onClick={toggleCustomizer}
        className="fixed bottom-6 left-6 z-[1100] group flex items-center gap-2 px-3.5 py-3 rounded-full bg-slate-900/95 hover:bg-slate-850 text-white border border-slate-700/80 shadow-2xl shadow-black/80 backdrop-blur-xl transition-all duration-300 hover:scale-105 active:scale-95 cursor-pointer"
        title="Customize Theme & Live Background"
        aria-label="Open Theme Customizer"
      >
        <div
          className="w-4 h-4 rounded-full shadow-sm"
          style={{ backgroundColor: activePalette.primary }}
        />
        <Palette className="w-4 h-4 text-slate-300 group-hover:rotate-45 transition-transform duration-300" />
        <span className="hidden sm:inline text-xs font-bold text-slate-200">Theme</span>
      </button>

      {/* Slide-out Theme Drawer Overlay */}
      {isCustomizerOpen && (
        <div className="fixed inset-0 z-[1300] bg-black/60 backdrop-blur-sm flex justify-end animate-fadeIn">
          {/* Backdrop click to close */}
          <div
            className="flex-1"
            onClick={() => setIsCustomizerOpen(false)}
            aria-hidden="true"
          />

          {/* Drawer Container */}
          <div className="w-full max-w-sm sm:max-w-md h-full bg-slate-900/98 border-l border-slate-800 shadow-2xl flex flex-col overflow-hidden animate-slideLeft">
            
            {/* Drawer Header */}
            <div className="p-5 border-b border-slate-800 flex items-center justify-between bg-slate-950/60">
              <div className="flex items-center gap-2.5">
                <div
                  className="w-9 h-9 rounded-xl flex items-center justify-center text-white shadow-lg"
                  style={{ backgroundColor: activePalette.primary }}
                >
                  <Palette className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-sm font-black text-white">Visual Theme & Canvas</h3>
                  <p className="text-[11px] text-slate-400">Custom aesthetics & interactive animation</p>
                </div>
              </div>

              <div className="flex items-center gap-1">
                <button
                  type="button"
                  onClick={resetTheme}
                  className="p-2 rounded-xl text-slate-400 hover:text-slate-200 hover:bg-slate-800 transition-colors cursor-pointer"
                  title="Reset to Default Theme"
                >
                  <RotateCcw className="w-4 h-4" />
                </button>
                <button
                  type="button"
                  onClick={() => setIsCustomizerOpen(false)}
                  className="p-2 rounded-xl text-slate-400 hover:text-rose-400 hover:bg-slate-800 transition-colors cursor-pointer"
                  title="Close Drawer"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
            </div>

            {/* Drawer Body Scroll Area */}
            <div className="flex-1 overflow-y-auto p-5 space-y-6 custom-scrollbar">
              
              {/* 1. Theme Palettes */}
              <div className="space-y-2.5">
                <div className="flex items-center justify-between">
                  <label className="text-xs font-bold text-slate-200 uppercase tracking-wider">
                    Accent Color Palette
                  </label>
                  <span className="text-[11px] font-semibold text-emerald-400" style={{ color: activePalette.primary }}>
                    {activePalette.name}
                  </span>
                </div>

                <div className="grid grid-cols-2 gap-2">
                  {Object.values(palettes).map((p) => {
                    const isSelected = themeConfig.palette === p.id;
                    return (
                      <button
                        key={p.id}
                        type="button"
                        onClick={() => setPalette(p.id)}
                        className={`p-3 rounded-2xl border text-left transition-all flex items-center justify-between cursor-pointer ${
                          isSelected
                            ? 'bg-slate-950 border-emerald-500 shadow-md shadow-black/60 scale-[1.02]'
                            : 'bg-slate-950/60 border-slate-800 hover:border-slate-700 hover:bg-slate-850'
                        }`}
                        style={{
                          borderColor: isSelected ? p.primary : undefined,
                        }}
                      >
                        <div className="flex items-center gap-2.5 min-w-0">
                          <div
                            className="w-5 h-5 rounded-full flex-shrink-0 shadow-sm flex items-center justify-center text-white"
                            style={{ backgroundColor: p.swatch }}
                          >
                            {isSelected && <Check className="w-3 h-3 stroke-[3]" />}
                          </div>
                          <div className="truncate">
                            <p className="text-xs font-bold text-slate-100 truncate">{p.name}</p>
                            <p className="text-[10px] text-slate-500 truncate">{p.id}</p>
                          </div>
                        </div>
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* 2. Theme Mode (Dark / Light) */}
              <div className="space-y-2.5">
                <label className="text-xs font-bold text-slate-200 uppercase tracking-wider">
                  Interface Display Mode
                </label>
                <div className="grid grid-cols-2 gap-2 bg-slate-950 p-1.5 rounded-2xl border border-slate-800">
                  <button
                    type="button"
                    onClick={() => setMode('dark')}
                    className={`flex items-center justify-center gap-2 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                      themeConfig.mode === 'dark'
                        ? 'bg-slate-800 text-white shadow-sm'
                        : 'text-slate-400 hover:text-white'
                    }`}
                  >
                    <Moon className="w-4 h-4 text-emerald-400" style={{ color: activePalette.primary }} />
                    <span>Dark Mode</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => setMode('light')}
                    className={`flex items-center justify-center gap-2 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                      themeConfig.mode === 'light'
                        ? 'bg-slate-800 text-white shadow-sm'
                        : 'text-slate-400 hover:text-white'
                    }`}
                  >
                    <Sun className="w-4 h-4 text-amber-400" />
                    <span>Light Mode</span>
                  </button>
                </div>
              </div>

              {/* 3. Live Animated Background Canvas Effects */}
              <div className="space-y-2.5">
                <div className="flex items-center justify-between">
                  <label className="text-xs font-bold text-slate-200 uppercase tracking-wider">
                    Live Background Canvas
                  </label>
                  <span className="text-[11px] font-mono text-slate-400">Interactive</span>
                </div>

                <div className="grid grid-cols-1 gap-1.5">
                  {Object.values(canvasModes).map((mode) => {
                    const isSelected = themeConfig.canvasEffect === mode.id;
                    return (
                      <button
                        key={mode.id}
                        type="button"
                        onClick={() => setCanvasEffect(mode.id)}
                        className={`w-full p-2.5 rounded-xl border text-left transition-all flex items-center justify-between cursor-pointer ${
                          isSelected
                            ? 'bg-slate-950 border-emerald-500 text-white shadow-md'
                            : 'bg-slate-950/60 border-slate-800 text-slate-300 hover:bg-slate-850 hover:text-white'
                        }`}
                        style={{
                          borderColor: isSelected ? activePalette.primary : undefined,
                        }}
                      >
                        <div className="flex items-center gap-2.5">
                          <div
                            className={`p-1.5 rounded-lg ${
                              isSelected
                                ? 'text-white'
                                : 'text-slate-400 bg-slate-900'
                            }`}
                            style={{
                              backgroundColor: isSelected ? `${activePalette.primary}30` : undefined,
                              color: isSelected ? activePalette.primary : undefined,
                            }}
                          >
                            {getCanvasIcon(mode.id)}
                          </div>
                          <span className="text-xs font-bold">{mode.name}</span>
                        </div>

                        {isSelected && (
                          <span
                            className="w-2 h-2 rounded-full shadow-sm animate-pulse"
                            style={{ backgroundColor: activePalette.primary }}
                          />
                        )}
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* 4. Canvas Animation Controls (Speed & Opacity) */}
              {themeConfig.canvasEffect !== 'none' && (
                <div className="space-y-4 p-4 rounded-2xl bg-slate-950/80 border border-slate-800/80 space-y-3.5">
                  <div className="flex items-center gap-2 text-xs font-bold text-slate-300">
                    <Sliders className="w-3.5 h-3.5 text-emerald-400" style={{ color: activePalette.primary }} />
                    <span>Canvas Dynamics</span>
                  </div>

                  {/* Speed Slider */}
                  <div className="space-y-1.5">
                    <div className="flex items-center justify-between text-[11px]">
                      <span className="text-slate-400">Animation Speed</span>
                      <span className="font-mono text-slate-200">{themeConfig.canvasSpeed}x</span>
                    </div>
                    <input
                      type="range"
                      min="0.2"
                      max="2.2"
                      step="0.1"
                      value={themeConfig.canvasSpeed}
                      onChange={(e) => setCanvasSpeed(e.target.value)}
                      className="w-full h-1.5 bg-slate-800 rounded-lg appearance-none cursor-pointer accent-emerald-500"
                      style={{ accentColor: activePalette.primary }}
                    />
                  </div>

                  {/* Opacity Slider */}
                  <div className="space-y-1.5">
                    <div className="flex items-center justify-between text-[11px]">
                      <span className="text-slate-400">Canvas Opacity</span>
                      <span className="font-mono text-slate-200">{Math.round(themeConfig.canvasOpacity * 100)}%</span>
                    </div>
                    <input
                      type="range"
                      min="0.1"
                      max="1.0"
                      step="0.05"
                      value={themeConfig.canvasOpacity}
                      onChange={(e) => setCanvasOpacity(e.target.value)}
                      className="w-full h-1.5 bg-slate-800 rounded-lg appearance-none cursor-pointer accent-emerald-500"
                      style={{ accentColor: activePalette.primary }}
                    />
                  </div>
                </div>
              )}

            </div>

            {/* Drawer Footer */}
            <div className="p-4 border-t border-slate-800 bg-slate-950/80 flex items-center justify-between text-[11px] text-slate-400">
              <div className="flex items-center gap-1.5">
                <Zap className="w-3.5 h-3.5 text-emerald-400" style={{ color: activePalette.primary }} />
                <span>Auto-saved to Browser Storage</span>
              </div>
              <button
                type="button"
                onClick={() => setIsCustomizerOpen(false)}
                className="px-3 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-white font-bold text-xs transition-colors cursor-pointer"
              >
                Apply
              </button>
            </div>

          </div>
        </div>
      )}
    </>
  );
}
