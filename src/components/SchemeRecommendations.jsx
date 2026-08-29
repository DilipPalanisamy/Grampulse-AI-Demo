import React from 'react';
import PropTypes from 'prop-types';
import {
  Award,
  Sparkles,
  Building2,
  ExternalLink,
  IndianRupee,
  ShieldCheck,
  CheckCircle2,
  FileText,
  Info,
} from 'lucide-react';
import { useTheme } from '../context/ThemeContext';

const SchemeRecommendations = ({ schemes = [], loading = false }) => {
  const { activePalette } = useTheme();

  if (loading) {
    return (
      <div className="bg-slate-900/85 backdrop-blur-md rounded-2xl border border-slate-800 p-6 space-y-4 animate-pulse">
        <div className="h-6 w-48 bg-slate-800 rounded" />
        <div className="space-y-3">
          {[1, 2, 3].map((i) => (
            <div key={i} className="h-28 bg-slate-850 rounded-xl border border-slate-800 p-4" />
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="bg-slate-900/85 backdrop-blur-md rounded-2xl border border-slate-800 p-6 shadow-2xl space-y-5">
      {/* Header */}
      <div className="flex items-center justify-between border-b border-slate-800 pb-4">
        <div className="flex items-center gap-2.5">
          <div
            className="w-9 h-9 rounded-xl flex items-center justify-center text-white shadow-md flex-shrink-0"
            style={{ backgroundColor: `${activePalette.primary}25`, color: activePalette.primary }}
          >
            <Sparkles className="w-5 h-5" />
          </div>
          <div>
            <h2 className="text-base font-bold text-white flex items-center gap-2">
              Verified Government Schemes
              <span
                className="text-[10px] font-bold px-2 py-0.5 rounded-full border uppercase tracking-wider"
                style={{
                  backgroundColor: `${activePalette.primary}15`,
                  color: activePalette.primary,
                  borderColor: `${activePalette.primary}30`,
                }}
              >
                MoPR RAG Engine
              </span>
            </h2>
            <p className="text-xs text-slate-400">
              Centrally Sponsored Schemes (CSS) correlated with local infrastructure deficits
            </p>
          </div>
        </div>
        <span className="text-xs font-mono text-slate-400 font-semibold">
          {schemes.length} Matched
        </span>
      </div>

      {/* Scheme Cards List */}
      <div className="space-y-3.5">
        {schemes.length === 0 ? (
          <div className="text-center py-10 text-slate-400 text-xs bg-slate-950/40 rounded-xl border border-slate-800 p-4">
            <Info className="w-6 h-6 mx-auto mb-2 text-slate-500" />
            <p className="font-semibold text-slate-300">No active deficits detected for this habitation.</p>
            <p className="text-[11px] text-slate-500 mt-1">
              Select or drop a pin on a village with infrastructure gaps to compute scheme allocations.
            </p>
          </div>
        ) : (
          schemes.map((scheme, idx) => {
            const scorePercent = Number(
              scheme.match_score_percent ||
              (scheme.match_score ? scheme.match_score * 100 : 85)
            ).toFixed(1);

            return (
              <div
                key={scheme.scheme_id || `scheme-${idx}`}
                className="group relative overflow-hidden bg-slate-950/70 rounded-xl border border-slate-800 hover:border-slate-700 p-4.5 space-y-3 transition-all duration-200 shadow-sm hover:shadow-md"
              >
                {/* Top: Header Info & Badges */}
                <div className="flex items-start justify-between gap-3">
                  <div className="flex items-start gap-3">
                    <span className="w-6 h-6 rounded-lg bg-slate-850 text-slate-300 font-mono text-xs font-bold flex items-center justify-center shrink-0 mt-0.5 border border-slate-700">
                      {idx + 1}
                    </span>
                    <div className="space-y-0.5">
                      <div className="flex flex-wrap items-center gap-2">
                        <h3 className="text-sm font-bold text-white group-hover:text-emerald-300 transition-colors">
                          {scheme.scheme_name}
                        </h3>
                        <span className="text-[10px] font-semibold px-2 py-0.5 rounded-md bg-slate-850 text-slate-300 border border-slate-700">
                          {scheme.category}
                        </span>
                      </div>
                      <p className="text-[11px] text-slate-400 flex items-center gap-1 font-medium">
                        <Building2 className="w-3 h-3 text-slate-500" />
                        <span>{scheme.ministry || 'Government of India'}</span>
                      </p>
                    </div>
                  </div>

                  {/* Match Score Badge */}
                  <div
                    className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full border text-xs font-bold font-mono flex-shrink-0"
                    style={{
                      backgroundColor: `${activePalette.primary}15`,
                      color: activePalette.primary,
                      borderColor: `${activePalette.primary}30`,
                    }}
                  >
                    <Award className="w-3.5 h-3.5" />
                    <span>{scorePercent}% Match</span>
                  </div>
                </div>

                {/* Scheme Objective Description */}
                <p className="text-xs text-slate-300 leading-relaxed">
                  {scheme.description}
                </p>

                {/* Eligibility & Budget Info Box */}
                <div className="grid grid-cols-1 sm:grid-cols-12 gap-2 bg-slate-900/90 p-2.5 rounded-xl border border-slate-800/80 text-[11px]">
                  {/* Left: Eligibility Criteria */}
                  <div className="sm:col-span-8 space-y-0.5">
                    <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 flex items-center gap-1">
                      <ShieldCheck className="w-3 h-3 text-emerald-400" />
                      Eligibility Trigger:
                    </span>
                    <p className="text-slate-300 text-[11px] leading-snug">
                      {scheme.eligibility_criteria || 'Quantified infrastructure deficit in rural habitation.'}
                    </p>
                  </div>

                  {/* Right: Estimated Budget */}
                  <div className="sm:col-span-4 flex flex-col justify-center sm:items-end border-t sm:border-t-0 sm:border-l border-slate-800 pt-1.5 sm:pt-0 sm:pl-2.5">
                    <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">
                      Estimated Allocation
                    </span>
                    <span
                      className="text-xs font-mono font-black"
                      style={{ color: activePalette.primary }}
                    >
                      {scheme.estimated_budget || scheme.budget || '₹ 15.00 Lakhs'}
                    </span>
                  </div>
                </div>

                {/* Bottom Action: Official Portal Link */}
                {scheme.official_portal_url && (
                  <div className="flex items-center justify-between pt-1 border-t border-slate-850">
                    <span className="text-[10px] text-slate-500">
                      Official Government of India Guidelines
                    </span>
                    <a
                      href={scheme.official_portal_url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center gap-1 text-[11px] font-bold text-slate-300 hover:text-white transition-colors cursor-pointer group-hover:underline"
                      style={{ color: activePalette.primary }}
                    >
                      <span>Official Portal Guidelines</span>
                      <ExternalLink className="w-3 h-3" />
                    </a>
                  </div>
                )}
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
      estimated_budget: PropTypes.string,
      description: PropTypes.string,
      eligibility_criteria: PropTypes.string,
      official_portal_url: PropTypes.string,
    })
  ),
  loading: PropTypes.bool,
};

export default React.memo(SchemeRecommendations);
