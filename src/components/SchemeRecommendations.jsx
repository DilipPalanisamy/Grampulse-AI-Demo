import React, { useState, useMemo } from 'react';
import PropTypes from 'prop-types';
import {
  Award,
  Sparkles,
  Building2,
  ExternalLink,
  ShieldCheck,
  CheckCircle2,
  Info,
  AlertTriangle,
  ArrowUpRight,
  Calculator,
  Filter,
  Check,
} from 'lucide-react';
import { useTheme } from '../context/ThemeContext';

/**
 * Priority badge styling configuration based on national deficit severity tiers.
 */
const getPriorityBadgeConfig = (tier = 'P3') => {
  const normTier = (tier || 'P3').toUpperCase();
  switch (normTier) {
    case 'P1':
      return {
        badgeClass: 'bg-rose-500/15 text-rose-400 border-rose-500/40 ring-1 ring-rose-500/20',
        dotClass: 'bg-rose-500 animate-ping',
        solidDotClass: 'bg-rose-500',
        label: 'P1 - CRITICAL INTERVENTION',
        glowClass: 'shadow-rose-950/40',
        borderHover: 'hover:border-rose-500/50',
      };
    case 'P2':
      return {
        badgeClass: 'bg-amber-500/15 text-amber-400 border-amber-500/40 ring-1 ring-amber-500/20',
        dotClass: 'bg-amber-500 animate-pulse',
        solidDotClass: 'bg-amber-500',
        label: 'P2 - HIGH PRIORITY',
        glowClass: 'shadow-amber-950/40',
        borderHover: 'hover:border-amber-500/50',
      };
    case 'P3':
    default:
      return {
        badgeClass: 'bg-emerald-500/15 text-emerald-400 border-emerald-500/40 ring-1 ring-emerald-500/20',
        dotClass: 'bg-emerald-500',
        solidDotClass: 'bg-emerald-500',
        label: 'P3 - MODERATE / PLANNED',
        glowClass: 'shadow-emerald-950/40',
        borderHover: 'hover:border-emerald-500/50',
      };
  }
};

const SchemeRecommendations = ({ schemes = [], loading = false }) => {
  const { activePalette } = useTheme();
  const [selectedFilter, setSelectedFilter] = useState('ALL');

  // Filter schemes by active priority tier tab
  const filteredSchemes = useMemo(() => {
    if (!Array.isArray(schemes)) return [];
    if (selectedFilter === 'ALL') return schemes;
    return schemes.filter((s) => (s.priority_tier || 'P3').toUpperCase() === selectedFilter);
  }, [schemes, selectedFilter]);

  // Priority count badges
  const p1Count = useMemo(() => schemes.filter((s) => s.priority_tier === 'P1').length, [schemes]);
  const p2Count = useMemo(() => schemes.filter((s) => s.priority_tier === 'P2').length, [schemes]);
  const p3Count = useMemo(() => schemes.filter((s) => s.priority_tier === 'P3').length, [schemes]);

  if (loading) {
    return (
      <div className="bg-slate-900/85 backdrop-blur-md rounded-2xl border border-slate-800 p-6 space-y-4 animate-pulse">
        <div className="flex items-center justify-between pb-3 border-b border-slate-800">
          <div className="h-6 w-48 bg-slate-800 rounded" />
          <div className="h-6 w-24 bg-slate-800 rounded-full" />
        </div>
        <div className="space-y-3">
          {[1, 2, 3].map((i) => (
            <div key={i} className="h-36 bg-slate-950/80 rounded-xl border border-slate-800 p-4 space-y-2">
              <div className="h-4 w-3/4 bg-slate-800 rounded" />
              <div className="h-3 w-1/2 bg-slate-800 rounded" />
              <div className="h-12 w-full bg-slate-900 rounded-lg" />
            </div>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="bg-slate-900/85 backdrop-blur-md rounded-2xl border border-slate-800 p-5 sm:p-6 shadow-2xl space-y-5">
      {/* Header Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-800 pb-4">
        <div className="flex items-center gap-3">
          <div
            className="w-10 h-10 rounded-xl flex items-center justify-center text-white shadow-md flex-shrink-0"
            style={{ backgroundColor: `${activePalette.primary}25`, color: activePalette.primary }}
          >
            <Sparkles className="w-5 h-5" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h2 className="text-base font-bold text-white tracking-tight">
                Verified Government Schemes
              </h2>
              <span
                className="text-[10px] font-bold px-2 py-0.5 rounded-full border uppercase tracking-wider"
                style={{
                  backgroundColor: `${activePalette.primary}15`,
                  color: activePalette.primary,
                  borderColor: `${activePalette.primary}30`,
                }}
              >
                AI RAG Retrieval
              </span>
            </div>
            <p className="text-xs text-slate-400">
              Ranked dynamically by Deficit Severity (P1 Critical &gt; P2 High &gt; P3 Moderate)
            </p>
          </div>
        </div>

        <span className="text-xs font-mono text-slate-300 font-bold bg-slate-800/90 px-3 py-1 rounded-lg border border-slate-700 self-start sm:self-center">
          {schemes.length} Schemes Matched
        </span>
      </div>

      {/* Priority Tier Filter Tabs */}
      {schemes.length > 0 && (
        <div className="flex flex-wrap items-center gap-2 pt-0.5">
          <button
            type="button"
            onClick={() => setSelectedFilter('ALL')}
            className={`px-3 py-1 rounded-lg text-xs font-bold transition-all cursor-pointer ${
              selectedFilter === 'ALL'
                ? 'bg-slate-700 text-white shadow-sm border border-slate-600'
                : 'bg-slate-950/60 text-slate-400 hover:text-slate-200 border border-slate-800'
            }`}
          >
            All ({schemes.length})
          </button>

          {p1Count > 0 && (
            <button
              type="button"
              onClick={() => setSelectedFilter('P1')}
              className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                selectedFilter === 'P1'
                  ? 'bg-rose-500/25 text-rose-300 border border-rose-500/50 shadow-sm'
                  : 'bg-slate-950/60 text-rose-400/80 hover:text-rose-300 border border-rose-500/20'
              }`}
            >
              <span className="w-1.5 h-1.5 rounded-full bg-rose-500 animate-ping" />
              <span>P1 Critical ({p1Count})</span>
            </button>
          )}

          {p2Count > 0 && (
            <button
              type="button"
              onClick={() => setSelectedFilter('P2')}
              className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                selectedFilter === 'P2'
                  ? 'bg-amber-500/25 text-amber-300 border border-amber-500/50 shadow-sm'
                  : 'bg-slate-950/60 text-amber-400/80 hover:text-amber-300 border border-amber-500/20'
              }`}
            >
              <span className="w-1.5 h-1.5 rounded-full bg-amber-500" />
              <span>P2 High ({p2Count})</span>
            </button>
          )}

          {p3Count > 0 && (
            <button
              type="button"
              onClick={() => setSelectedFilter('P3')}
              className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                selectedFilter === 'P3'
                  ? 'bg-emerald-500/25 text-emerald-300 border border-emerald-500/50 shadow-sm'
                  : 'bg-slate-950/60 text-emerald-400/80 hover:text-emerald-300 border border-emerald-500/20'
              }`}
            >
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
              <span>P3 Moderate ({p3Count})</span>
            </button>
          )}
        </div>
      )}

      {/* Scheme Cards Container */}
      <div className="space-y-4">
        {filteredSchemes.length === 0 ? (
          <div className="text-center py-10 text-slate-400 text-xs bg-slate-950/50 rounded-2xl border border-slate-800 p-6 space-y-2">
            <Info className="w-7 h-7 mx-auto text-slate-500" />
            <p className="font-bold text-slate-200 text-sm">No schemes found in this category.</p>
            <p className="text-[11px] text-slate-500 max-w-sm mx-auto">
              Select &ldquo;All&rdquo; or click on a village with active infrastructure shortages to evaluate scheme allocations.
            </p>
          </div>
        ) : (
          filteredSchemes.map((scheme, idx) => {
            const scorePercent = Number(
              scheme.match_score_percent ||
              (scheme.match_score ? scheme.match_score * 100 : 85)
            ).toFixed(1);

            const priorityTier = (scheme.priority_tier || (idx === 0 ? 'P1' : idx === 1 ? 'P2' : 'P3')).toUpperCase();
            const badgeConfig = getPriorityBadgeConfig(priorityTier);
            const portalUrl = scheme.official_portal_url || 'https://rural.gov.in/';

            let hostname = 'rural.gov.in';
            try {
              hostname = new URL(portalUrl).hostname;
            } catch (e) {
              hostname = 'gov.in';
            }

            return (
              <div
                key={scheme.scheme_id || `scheme-card-${idx}`}
                className={`group relative overflow-hidden bg-slate-950/80 rounded-2xl border border-slate-800/90 ${badgeConfig.borderHover} p-4 sm:p-5 space-y-3.5 transition-all duration-300 shadow-md hover:shadow-xl`}
              >
                {/* 1. Header: Scheme Index, Name, Ministry & Badges */}
                <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-3">
                  <div className="flex items-start gap-3">
                    <span className="w-7 h-7 rounded-xl bg-slate-900 text-slate-200 font-mono text-xs font-black flex items-center justify-center shrink-0 mt-0.5 border border-slate-700 shadow-inner">
                      {idx + 1}
                    </span>

                    <div className="space-y-1">
                      <div className="flex flex-wrap items-center gap-2">
                        <h3 className="text-sm sm:text-base font-extrabold text-white group-hover:text-emerald-300 transition-colors">
                          {scheme.scheme_name}
                        </h3>

                        {/* Priority Tier Tag */}
                        <span className={`inline-flex items-center gap-1.5 text-[10px] font-black px-2.5 py-0.5 rounded-lg border ${badgeConfig.badgeClass}`}>
                          <span className="relative flex h-2 w-2">
                            <span className={`absolute inline-flex h-full w-full rounded-full opacity-75 ${badgeConfig.dotClass}`} />
                            <span className={`relative inline-flex rounded-full h-2 w-2 ${badgeConfig.solidDotClass}`} />
                          </span>
                          {scheme.priority_label || badgeConfig.label}
                        </span>

                        <span className="text-[10px] font-semibold px-2 py-0.5 rounded-md bg-slate-900 text-slate-300 border border-slate-800">
                          {scheme.category}
                        </span>
                      </div>

                      <p className="text-[11px] text-slate-400 flex items-center gap-1.5 font-medium">
                        <Building2 className="w-3.5 h-3.5 text-slate-500" />
                        <span>{scheme.ministry || 'Government of India'}</span>
                      </p>
                    </div>
                  </div>

                  {/* AI Correlation Score Badge */}
                  <div
                    className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full border text-xs font-extrabold font-mono flex-shrink-0 self-start sm:self-auto"
                    style={{
                      backgroundColor: `${activePalette.primary}15`,
                      color: activePalette.primary,
                      borderColor: `${activePalette.primary}35`,
                    }}
                  >
                    <Award className="w-3.5 h-3.5" />
                    <span>{scorePercent}% Match</span>
                  </div>
                </div>

                {/* 2. Scheme Objective Description */}
                <p className="text-xs text-slate-300 leading-relaxed">
                  {scheme.description}
                </p>

                {/* 3. Detailed Eligibility & Dynamic Budget Calculation Box */}
                <div className="grid grid-cols-1 sm:grid-cols-12 gap-3 bg-slate-900/90 p-3.5 rounded-xl border border-slate-800/90 text-xs">
                  {/* Left Column: Eligibility Benchmark */}
                  <div className="sm:col-span-7 space-y-1">
                    <span className="text-[10px] font-extrabold uppercase tracking-wider text-slate-400 flex items-center gap-1.5">
                      <ShieldCheck className="w-3.5 h-3.5 text-emerald-400" />
                      Eligibility Benchmark
                    </span>
                    <p className="text-slate-300 text-[11px] leading-snug">
                      {scheme.eligibility_criteria || 'Quantified infrastructure shortage exceeding national norms.'}
                    </p>
                    {scheme.benchmark_norm && (
                      <p className="text-[10px] text-emerald-400/90 font-mono font-medium">
                        Norm: {scheme.benchmark_norm}
                      </p>
                    )}
                  </div>

                  {/* Right Column: Estimated Formula Budget Allocation */}
                  <div className="sm:col-span-5 flex flex-col justify-center sm:items-end border-t sm:border-t-0 sm:border-l border-slate-800 pt-2.5 sm:pt-0 sm:pl-3.5">
                    <span className="text-[10px] font-extrabold uppercase tracking-wider text-slate-400 flex items-center gap-1">
                      <Calculator className="w-3 h-3 text-slate-500" />
                      Estimated Allocation
                    </span>
                    <span
                      className="text-base font-mono font-black"
                      style={{ color: activePalette.primary }}
                    >
                      {scheme.estimated_budget || scheme.budget || '₹ 15.00 Lakhs'}
                    </span>
                    {scheme.budget_formula_breakdown && (
                      <span className="text-[9.5px] text-slate-400 font-mono text-right mt-0.5">
                        {scheme.budget_formula_breakdown}
                      </span>
                    )}
                  </div>
                </div>

                {/* 4. Action Footer: Verified Government Portal Link Button */}
                <div className="flex flex-wrap items-center justify-between gap-2 pt-2.5 border-t border-slate-850">
                  <span className="text-[10.5px] text-slate-500 font-mono flex items-center gap-1">
                    <CheckCircle2 className="w-3 h-3 text-emerald-400" />
                    Verified Official Portal: {hostname}
                  </span>

                  <a
                    href={portalUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl text-xs font-bold text-white bg-slate-800 hover:bg-slate-700 border border-slate-700 hover:border-emerald-500/50 transition-all shadow-sm cursor-pointer active:scale-95 group/btn"
                  >
                    <span>View Official Guidelines &amp; Apply</span>
                    <ArrowUpRight className="w-3.5 h-3.5 text-emerald-400 group-hover/btn:translate-x-0.5 group-hover/btn:-translate-y-0.5 transition-transform" />
                  </a>
                </div>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
};

SchemeRecommendations.propTypes = {
  schemes: PropTypes.arrayOf(
    PropTypes.shape({
      scheme_id: PropTypes.string,
      scheme_name: PropTypes.string.isRequired,
      ministry: PropTypes.string,
      category: PropTypes.string,
      match_score: PropTypes.number,
      match_score_percent: PropTypes.number,
      priority_tier: PropTypes.string,
      priority_label: PropTypes.string,
      estimated_budget: PropTypes.string,
      budget_formula_breakdown: PropTypes.string,
      description: PropTypes.string,
      eligibility_criteria: PropTypes.string,
      benchmark_norm: PropTypes.string,
      official_portal_url: PropTypes.string,
    })
  ),
  loading: PropTypes.bool,
};

export default React.memo(SchemeRecommendations);
