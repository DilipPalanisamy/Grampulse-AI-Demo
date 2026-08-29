import React from 'react';
import PropTypes from 'prop-types';
import {
  Users,
  Droplets,
  GraduationCap,
  Route,
  TrendingUp,
  AlertTriangle,
  CheckCircle2,
  Activity,
  HeartPulse,
  Trash2,
  Layers,
  MapPin,
  Sparkles,
} from 'lucide-react';
import { useTheme } from '../context/ThemeContext';

const getSeverityBadge = (severity = 'MONITOR') => {
  const norm = (severity || 'MONITOR').toUpperCase();
  switch (norm) {
    case 'HIGH':
      return {
        label: 'High Deficit',
        badgeClass: 'bg-rose-500/15 text-rose-400 border border-rose-500/30',
        icon: <AlertTriangle className="w-3.5 h-3.5 mr-1 text-rose-400 animate-pulse" />,
      };
    case 'MEDIUM':
      return {
        label: 'Moderate Gap',
        badgeClass: 'bg-amber-500/15 text-amber-400 border border-amber-500/30',
        icon: <AlertTriangle className="w-3.5 h-3.5 mr-1 text-amber-400" />,
      };
    default:
      return {
        label: 'Adequate',
        badgeClass: 'bg-emerald-500/15 text-emerald-400 border border-emerald-500/30',
        icon: <CheckCircle2 className="w-3.5 h-3.5 mr-1 text-emerald-400" />,
      };
  }
};

const AnalyticsPanel = ({ analytics, infrastructure = { counts: {}, markers: [] }, loading = false }) => {
  const { activePalette } = useTheme();

  if (loading) {
    return (
      <div className="space-y-4 animate-pulse">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {[1, 2, 3, 4].map((i) => (
            <div
              key={i}
              className="h-44 bg-slate-900/80 rounded-2xl border border-slate-800 p-5 flex flex-col justify-between"
            >
              <div className="flex items-center justify-between">
                <div className="w-10 h-10 rounded-xl bg-slate-800" />
                <div className="w-20 h-5 rounded-full bg-slate-800" />
              </div>
              <div className="space-y-2">
                <div className="w-16 h-3 bg-slate-800 rounded" />
                <div className="w-28 h-6 bg-slate-800 rounded" />
              </div>
              <div className="w-full h-2 bg-slate-800 rounded-full" />
            </div>
          ))}
        </div>
      </div>
    );
  }

  const p = analytics?.predictions || {};
  const targetYear = analytics?.target_year || p?.target_year || 2029;
  const severity = p?.severity_ratings || {};

  const popCurrent = Number(p?.population_current || 5800);
  const popProjected = Number(p?.population_projected || 6341);
  const popGrowth = Number(p?.population_growth || popProjected - popCurrent);

  const waterDemand = Number(p?.water_demand_projected_lpd || 348755);
  const waterSupply = Number(p?.water_supply_current_lpd || 275000);
  const waterDeficit = Number(p?.water_deficit_lpd || 73755);
  const waterCoveragePct = Math.min(100, Math.round((waterSupply / (waterDemand || 1)) * 100));

  const classRequired = Number(p?.classrooms_required || 39);
  const classCurrent = Number(p?.classrooms_current || 28);
  const classGap = Number(p?.classroom_gap || 11);
  const classCoveragePct = Math.min(100, Math.round((classCurrent / (classRequired || 1)) * 100));

  const roadRequired = Number(p?.road_required_km || 7.93);
  const roadCurrent = Number(p?.road_coverage_km || 6.20);
  const roadDeficit = Number(p?.paved_road_deficit_km || p?.road_gap_km || 1.73);
  const roadCoveragePct = Math.min(100, Math.round((roadCurrent / (roadRequired || 1)) * 100));

  const waterBadge = getSeverityBadge(severity?.water || (waterDeficit > 0 ? 'HIGH' : 'MONITOR'));
  const classBadge = getSeverityBadge(severity?.education || (classGap > 0 ? 'HIGH' : 'MONITOR'));
  const roadBadge = getSeverityBadge(severity?.roads || (roadDeficit > 0 ? 'MEDIUM' : 'MONITOR'));

  // Live Overpass Infrastructure Node Counts
  const counts = infrastructure?.counts || {};
  const waterNodesCount = counts.water_points || 0;
  const schoolNodesCount = counts.schools || 0;
  const healthNodesCount = counts.healthcare || 0;
  const sanitationNodesCount = counts.sanitation_nodes || 0;
  const roadNetworkKm = counts.estimated_road_network_km || roadCurrent.toFixed(1);

  return (
    <div className="space-y-4">
      {/* 1. Overview Metric Cards Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        
        {/* Card 1: Population Projection */}
        <div className="relative overflow-hidden bg-slate-900/85 backdrop-blur-md rounded-2xl border border-slate-800 p-5 shadow-xl hover:border-slate-700 transition-all group">
          <div className="flex items-center justify-between mb-3">
            <div className="w-11 h-11 rounded-xl bg-blue-500/10 border border-blue-500/20 flex items-center justify-center text-blue-400 group-hover:scale-110 transition-transform">
              <Users className="w-5 h-5" />
            </div>
            <span className="inline-flex items-center text-xs font-semibold px-2.5 py-1 rounded-full bg-blue-500/15 text-blue-300 border border-blue-500/30">
              <TrendingUp className="w-3.5 h-3.5 mr-1 text-blue-400" />
              Target {targetYear}
            </span>
          </div>
          <div className="mb-2">
            <p className="text-xs uppercase tracking-wider font-semibold text-slate-400">
              Projected Population
            </p>
            <div className="flex items-baseline gap-2 mt-1">
              <span className="text-2xl font-extrabold text-white font-mono">
                {popProjected.toLocaleString()}
              </span>
              <span className="text-xs font-medium text-emerald-400">
                +{popGrowth.toLocaleString()} ({p?.growth_rate_pct || 1.8}%)
              </span>
            </div>
          </div>
          <p className="text-[11px] text-slate-400 flex items-center gap-1.5 mt-3 pt-2 border-t border-slate-800/80">
            <span className="w-1.5 h-1.5 rounded-full bg-blue-400" />
            Base: {popCurrent.toLocaleString()} citizens ({p?.base_year || 2024})
          </p>
        </div>

        {/* Card 2: Potable Water Supply Deficit */}
        <div className="relative overflow-hidden bg-slate-900/85 backdrop-blur-md rounded-2xl border border-slate-800 p-5 shadow-xl hover:border-slate-700 transition-all group">
          <div className="flex items-center justify-between mb-3">
            <div className="w-11 h-11 rounded-xl bg-sky-500/10 border border-sky-500/20 flex items-center justify-center text-sky-400 group-hover:scale-110 transition-transform">
              <Droplets className="w-5 h-5" />
            </div>
            <span className={`inline-flex items-center text-xs font-semibold px-2.5 py-1 rounded-full ${waterBadge.badgeClass}`}>
              {waterBadge.icon}
              {waterBadge.label}
            </span>
          </div>
          <div className="mb-2">
            <p className="text-xs uppercase tracking-wider font-semibold text-slate-400">
              Daily Water Deficit (JJM)
            </p>
            <div className="flex items-baseline gap-2 mt-1">
              <span className="text-2xl font-extrabold text-rose-400 font-mono">
                {waterDeficit > 0 ? `-${waterDeficit.toLocaleString()}` : '0'}{' '}
                <span className="text-xs text-slate-400 font-normal">LPD</span>
              </span>
            </div>
          </div>
          <div className="mt-3 pt-2 border-t border-slate-800/80">
            <div className="flex justify-between text-[11px] text-slate-400 mb-1">
              <span>Supply: {waterSupply.toLocaleString()} L</span>
              <span className="font-mono">{waterCoveragePct}%</span>
            </div>
            <div className="w-full bg-slate-800 h-1.5 rounded-full overflow-hidden">
              <div
                className="bg-sky-500 h-full rounded-full transition-all duration-500"
                style={{ width: `${waterCoveragePct}%` }}
              />
            </div>
          </div>
        </div>

        {/* Card 3: School Classroom Gap */}
        <div className="relative overflow-hidden bg-slate-900/85 backdrop-blur-md rounded-2xl border border-slate-800 p-5 shadow-xl hover:border-slate-700 transition-all group">
          <div className="flex items-center justify-between mb-3">
            <div className="w-11 h-11 rounded-xl bg-purple-500/10 border border-purple-500/20 flex items-center justify-center text-purple-400 group-hover:scale-110 transition-transform">
              <GraduationCap className="w-5 h-5" />
            </div>
            <span className={`inline-flex items-center text-xs font-semibold px-2.5 py-1 rounded-full ${classBadge.badgeClass}`}>
              {classBadge.icon}
              {classBadge.label}
            </span>
          </div>
          <div className="mb-2">
            <p className="text-xs uppercase tracking-wider font-semibold text-slate-400">
              Classroom Gap (RTE Norms)
            </p>
            <div className="flex items-baseline gap-2 mt-1">
              <span className="text-2xl font-extrabold text-amber-400 font-mono">
                {classGap > 0 ? `-${classGap}` : '0'}{' '}
                <span className="text-xs text-slate-400 font-normal">Rooms</span>
              </span>
            </div>
          </div>
          <div className="mt-3 pt-2 border-t border-slate-800/80">
            <div className="flex justify-between text-[11px] text-slate-400 mb-1">
              <span>Functional: {classCurrent} / {classRequired}</span>
              <span className="font-mono">{classCoveragePct}%</span>
            </div>
            <div className="w-full bg-slate-800 h-1.5 rounded-full overflow-hidden">
              <div
                className="bg-purple-500 h-full rounded-full transition-all duration-500"
                style={{ width: `${classCoveragePct}%` }}
              />
            </div>
          </div>
        </div>

        {/* Card 4: Paved Road Deficit */}
        <div className="relative overflow-hidden bg-slate-900/85 backdrop-blur-md rounded-2xl border border-slate-800 p-5 shadow-xl hover:border-slate-700 transition-all group">
          <div className="flex items-center justify-between mb-3">
            <div className="w-11 h-11 rounded-xl bg-orange-500/10 border border-orange-500/20 flex items-center justify-center text-orange-400 group-hover:scale-110 transition-transform">
              <Route className="w-5 h-5" />
            </div>
            <span className={`inline-flex items-center text-xs font-semibold px-2.5 py-1 rounded-full ${roadBadge.badgeClass}`}>
              {roadBadge.icon}
              {roadBadge.label}
            </span>
          </div>
          <div className="mb-2">
            <p className="text-xs uppercase tracking-wider font-semibold text-slate-400">
              Paved Road Deficit (PMGSY)
            </p>
            <div className="flex items-baseline gap-2 mt-1">
              <span className="text-2xl font-extrabold text-orange-400 font-mono">
                {roadDeficit > 0 ? `-${roadDeficit.toFixed(2)}` : '0.00'}{' '}
                <span className="text-xs text-slate-400 font-normal">KM</span>
              </span>
            </div>
          </div>
          <div className="mt-3 pt-2 border-t border-slate-800/80">
            <div className="flex justify-between text-[11px] text-slate-400 mb-1">
              <span>Existing: {roadCurrent.toFixed(1)} / {roadRequired.toFixed(1)} km</span>
              <span className="font-mono">{roadCoveragePct}%</span>
            </div>
            <div className="w-full bg-slate-800 h-1.5 rounded-full overflow-hidden">
              <div
                className="bg-orange-500 h-full rounded-full transition-all duration-500"
                style={{ width: `${roadCoveragePct}%` }}
              />
            </div>
          </div>
        </div>
      </div>

      {/* 2. Live Infrastructure Census Telemetry Dataset Table */}
      <div className="bg-slate-900/85 backdrop-blur-md rounded-2xl border border-slate-800 p-5 shadow-xl space-y-3">
        <div className="flex items-center justify-between border-b border-slate-800 pb-3">
          <div className="flex items-center gap-2">
            <Layers className="w-4 h-4 text-emerald-400" />
            <h3 className="text-sm font-bold text-white">
              Live Infrastructure Telemetry Dataset (Overpass / OpenStreetMap)
            </h3>
          </div>
          <span className="text-[11px] font-mono text-emerald-400 font-semibold bg-emerald-500/10 px-2 py-0.5 rounded border border-emerald-500/20">
            Real-time Spatial Sync
          </span>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs">
          <div className="p-3 bg-slate-950/70 rounded-xl border border-slate-800 flex items-center justify-between">
            <div className="space-y-0.5">
              <span className="text-[10px] text-slate-400 uppercase font-semibold">Water Points</span>
              <p className="text-sm font-bold text-white font-mono">{waterNodesCount} Nodes</p>
            </div>
            <Droplets className="w-4 h-4 text-blue-400" />
          </div>

          <div className="p-3 bg-slate-950/70 rounded-xl border border-slate-800 flex items-center justify-between">
            <div className="space-y-0.5">
              <span className="text-[10px] text-slate-400 uppercase font-semibold">School Facilities</span>
              <p className="text-sm font-bold text-white font-mono">{schoolNodesCount || classCurrent} Units</p>
            </div>
            <GraduationCap className="w-4 h-4 text-purple-400" />
          </div>

          <div className="p-3 bg-slate-950/70 rounded-xl border border-slate-800 flex items-center justify-between">
            <div className="space-y-0.5">
              <span className="text-[10px] text-slate-400 uppercase font-semibold">Healthcare (PHCs)</span>
              <p className="text-sm font-bold text-white font-mono">{healthNodesCount || 1} Centre</p>
            </div>
            <HeartPulse className="w-4 h-4 text-rose-400" />
          </div>

          <div className="p-3 bg-slate-950/70 rounded-xl border border-slate-800 flex items-center justify-between">
            <div className="space-y-0.5">
              <span className="text-[10px] text-slate-400 uppercase font-semibold">Road Network</span>
              <p className="text-sm font-bold text-white font-mono">{roadNetworkKm} km</p>
            </div>
            <Route className="w-4 h-4 text-orange-400" />
          </div>
        </div>
      </div>

      {/* 3. AI Contextual Governance Assessment Narrative */}
      {p?.summary_narrative && (
        <div className="bg-slate-900/85 backdrop-blur-md rounded-xl p-3.5 border border-slate-800 flex items-start gap-3 shadow-md">
          <Activity className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
          <p className="text-xs text-slate-300 leading-relaxed">
            <strong className="text-emerald-400 font-semibold">MoPR AI Governance Assessment: </strong>
            {p.summary_narrative}
          </p>
        </div>
      )}
    </div>
  );
};

AnalyticsPanel.propTypes = {
  analytics: PropTypes.shape({
    gp_id: PropTypes.number,
    gp_name: PropTypes.string,
    target_year: PropTypes.number,
    planning_horizon_years: PropTypes.number,
    predictions: PropTypes.object,
    matched_schemes: PropTypes.array,
  }),
  infrastructure: PropTypes.shape({
    counts: PropTypes.object,
    markers: PropTypes.array,
  }),
  loading: PropTypes.bool,
};

export default React.memo(AnalyticsPanel);
