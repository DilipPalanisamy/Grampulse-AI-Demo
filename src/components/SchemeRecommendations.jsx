import React from 'react';
import PropTypes from 'prop-types';
import { Award, Sparkles, Building2, ExternalLink, IndianRupee, Layers } from 'lucide-react';

const SchemeRecommendations = ({ schemes = [], loading = false }) => {
  if (loading) {
    return (
      <div className="bg-slate-900/80 backdrop-blur-md rounded-2xl border border-slate-800 p-6 space-y-4 animate-pulse">
        <div className="h-6 w-48 bg-slate-800 rounded" />
        <div className="space-y-3">
          {[1, 2, 3].map((i) => (
            <div key={i} className="h-24 bg-slate-850 rounded-xl border border-slate-800 p-4" />
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="bg-slate-900/80 backdrop-blur-md rounded-2xl border border-slate-800/80 p-6 shadow-xl space-y-5">
      {/* Header */}
      <div className="flex items-center justify-between border-b border-slate-800 pb-4">
        <div className="flex items-center gap-2.5">
          <div className="w-9 h-9 rounded-xl bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center text-emerald-400">
            <Sparkles className="w-5 h-5" />
          </div>
          <div>
            <h2 className="text-base font-bold text-white flex items-center gap-2">
              AI-Matched Welfare Schemes
              <span className="text-xs font-semibold px-2 py-0.5 rounded-full bg-emerald-500/15 text-emerald-300 border border-emerald-500/30">
                RAG Engine
              </span>
            </h2>
            <p className="text-xs text-slate-400">
              Correlated Centrally Sponsored Schemes (CSS) matched to active infrastructure gaps
            </p>
          </div>
        </div>
        <span className="text-xs font-mono text-slate-400">
          {schemes.length} Schemes Matched
        </span>
      </div>

      {/* Scheme Cards List */}
      <div className="space-y-3.5">
        {schemes.length === 0 ? (
          <div className="text-center py-8 text-slate-400 text-xs">
            No specific schemes matched for current criteria.
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
                className="group relative overflow-hidden bg-slate-950/60 rounded-xl border border-slate-800/80 p-4 hover:border-emerald-500/40 hover:bg-slate-950/90 transition-all duration-200"
              >
                <div className="flex items-start justify-between gap-4">
                  {/* Left: Rank badge & Scheme metadata */}
                  <div className="flex items-start gap-3">
                    <span className="w-6 h-6 rounded-lg bg-slate-800/90 text-slate-300 font-mono text-xs font-bold flex items-center justify-center shrink-0 mt-0.5 border border-slate-700">
                      {idx + 1}
                    </span>
                    <div className="space-y-1">
                      <div className="flex flex-wrap items-center gap-2">
                        <h3 className="text-sm font-bold text-white group-hover:text-emerald-300 transition-colors">
                          {scheme.scheme_name}
                        </h3>
                        <span className="text-[11px] font-medium px-2 py-0.5 rounded-md bg-slate-800 text-slate-300 border border-slate-700/60">
                          {scheme.category}
                        </span>
                      </div>
                      <p className="text-[11px] text-slate-400 flex items-center gap-1">
                        <Building2 className="w-3 h-3 text-slate-500" />
                        {scheme.ministry || 'Government of India'}
                      </p>
                      <p className="text-xs text-slate-300 leading-relaxed pt-1 line-clamp-2">
                        {scheme.description}
                      </p>
                    </div>
                  </div>

                  {/* Right: Match Score & Estimated Budget */}
                  <div className="text-right shrink-0 space-y-1.5">
                    {/* Match Score Badge */}
                    <div className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-emerald-500/15 text-emerald-300 border border-emerald-500/30 text-xs font-bold font-mono">
                      <Award className="w-3.5 h-3.5 text-emerald-400" />
                      {scorePercent}%
                    </div>

                    {/* Estimated Budget Allocation */}
                    <div className="text-right">
                      <span className="text-[10px] uppercase font-semibold text-slate-400 block">
                        Estimated Budget
                      </span>
                      <span className="text-xs font-bold text-white font-mono flex items-center justify-end text-emerald-400">
                        {scheme.estimated_budget}
                      </span>
                    </div>
                  </div>
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
      estimated_budget: PropTypes.string,
      description: PropTypes.string,
    })
  ),
  loading: PropTypes.bool,
};

export default React.memo(SchemeRecommendations);
