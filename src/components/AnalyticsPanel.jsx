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
  Building2,
  Stethoscope,
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
        label: 'Sufficient',
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
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
          {[1, 2, 3, 4, 5].map((i) => (
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

  // 1. Population Metrics
  const popCurrent = Number(p?.population_current || 5800);
  const popProjected = Number(p?.population_projected || 6341);
  const popGrowth = Number(p?.population_growth || popProjected - popCurrent);

  // 2. Water Metrics (JJM 55 LPD Norm)
  const waterDemand = Number(p?.water_demand_projected_lpd || popProjected * 55);
  const waterSupply = Number(p?.water_supply_current_lpd || 275000);
  const waterDeficit = Number(p?.water_deficit_lpd || Math.max(0, waterDemand - waterSupply));
  const waterCoveragePct = Math.min(100, Math.round((waterSupply / (waterDemand || 1)) * 100));

  // 3. Education Metrics (RTE 1:30 Classroom Ratio)
  const classRequired = Number(p?.classrooms_required || Math.ceil((popProjected * 0.18) / 30));
  const classCurrent = Number(p?.classrooms_current || 28);
  const classGap = Number(p?.classroom_gap || Math.max(0, classRequired - classCurrent));
  const classCoveragePct = Math.min(100, Math.round((classCurrent / (classRequired || 1)) * 100));

  // 4. Roads Metrics (PMGSY 1.25 km / 1,000 population)
  const roadRequired = Number(p?.road_required_km || ((popProjected / 1000) * 1.25).toFixed(2));
  const roadCurrent = Number(p?.road_coverage_km || 6.20);
  const roadDeficit = Number(p?.paved_road_deficit_km || p?.road_gap_km || Math.max(0, roadRequired - roadCurrent));
  const roadCoveragePct = Math.min(100, Math.round((roadCurrent / (roadRequired || 1)) * 100));

  // 5. Healthcare Telemetry & IPHS National Norm Metrics
  // IPHS Norm: 1 Primary Health Centre (PHC) per 30,000 population; 1 Health Sub-Centre per 5,000 population
  const counts = infrastructure?.counts || {};
  const waterNodesCount = counts.water_points || 12;
  const schoolNodesCount = counts.schools || 3;
  const healthNodesCount = counts.healthcare || 1;
  const subCentresCount = counts.sub_centres || Math.max(1, Math.ceil(popCurrent / 5000));
  const roadNetworkKm = counts.estimated_road_network_km || roadCurrent.toFixed(1);

  const requiredPHCs = Math.max(1, Math.ceil(popProjected / 30000));
  const requiredSubCentres = Math.max(1, Math.ceil(popProjected / 5000));
  const phcGap = Math.max(0, requiredPHCs - healthNodesCount);
  const subCentreGap = Math.max(0, requiredSubCentres - subCentresCount);
  const isHealthcareAdequate = healthNodesCount >= requiredPHCs && subCentresCount >= requiredSubCentres;

  // Severity Badges
  const waterBadge = getSeverityBadge(severity?.water || (waterDeficit > 0 ? 'HIGH' : 'MONITOR'));
  const classBadge = getSeverityBadge(severity?.education || (classGap > 0 ? 'HIGH' : 'MONITOR'));
  const roadBadge = getSeverityBadge(severity?.roads || (roadDeficit > 0 ? 'MEDIUM' : 'MONITOR'));
  const healthBadge = getSeverityBadge(isHealthcareAdequate ? 'MONITOR' : phcGap > 0 ? 'HIGH' : 'MEDIUM');

  return (
    <div className="space-y-5">
      {/* =================================================================== */}
      {/* 1. TOP PREDICTIVE DEFICIT METRICS ROW (5-CARD RESPONSIVE GRID)      */}
      {/* =================================================================== */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
        
        {/* Card 1: Projected Population (ML) */}
        <div className="relative overflow-hidden bg-slate-900/85 backdrop-blur-md rounded-2xl border border-slate-800 p-4.5 shadow-xl hover:border-slate-700 transition-all group flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between mb-2.5">
              <div className="w-10 h-10 rounded-xl bg-blue-500/10 border border-blue-500/20 flex items-center justify-center text-blue-400 group-hover:scale-110 transition-transform">
                <Users className="w-5 h-5" />
              </div>
              <span className="inline-flex items-center text-[11px] font-semibold px-2.5 py-0.5 rounded-full bg-blue-500/15 text-blue-300 border border-blue-500/30">
                <TrendingUp className="w-3 h-3 mr-1 text-blue-400" />
                Target {targetYear}
              </span>
            </div>
            <p className="text-[11px] uppercase tracking-wider font-semibold text-slate-400">
              Projected Population
            </p>
            <div className="flex items-baseline gap-2 mt-1">
              <span className="text-2xl font-extrabold text-white font-mono">
                {popProjected.toLocaleString()}
              </span>
              <span className="text-[11px] font-semibold text-emerald-400">
                +{popGrowth.toLocaleString()} ({p?.growth_rate_pct || 1.8}%)
              </span>
            </div>
          </div>
          <p className="text-[11px] text-slate-400 flex items-center gap-1.5 mt-3 pt-2 border-t border-slate-800/80">
            <span className="w-1.5 h-1.5 rounded-full bg-blue-400" />
            Base: {popCurrent.toLocaleString()} citizens
          </p>
        </div>

        {/* Card 2: Potable Water Supply Deficit (JJM) */}
        <div className="relative overflow-hidden bg-slate-900/85 backdrop-blur-md rounded-2xl border border-slate-800 p-4.5 shadow-xl hover:border-slate-700 transition-all group flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between mb-2.5">
              <div className="w-10 h-10 rounded-xl bg-sky-500/10 border border-sky-500/20 flex items-center justify-center text-sky-400 group-hover:scale-110 transition-transform">
                <Droplets className="w-5 h-5" />
              </div>
              <span className={`inline-flex items-center text-[11px] font-semibold px-2 py-0.5 rounded-full ${waterBadge.badgeClass}`}>
                {waterBadge.icon}
                {waterBadge.label}
              </span>
            </div>
            <p className="text-[11px] uppercase tracking-wider font-semibold text-slate-400">
              Daily Water Deficit (JJM)
            </p>
            <div className="flex items-baseline gap-1.5 mt-1">
              <span className="text-2xl font-extrabold text-rose-400 font-mono">
                {waterDeficit > 0 ? `-${Math.round(waterDeficit).toLocaleString()}` : '0'}
              </span>
              <span className="text-[11px] text-slate-400">LPD (55 L/capita)</span>
            </div>
          </div>
          <div className="mt-3 pt-2 border-t border-slate-800/80">
            <div className="flex justify-between text-[10px] text-slate-400 mb-1">
              <span>Supply: {Math.round(waterSupply / 1000)}k L</span>
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

        {/* Card 3: School Classroom Gap (RTE) */}
        <div className="relative overflow-hidden bg-slate-900/85 backdrop-blur-md rounded-2xl border border-slate-800 p-4.5 shadow-xl hover:border-slate-700 transition-all group flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between mb-2.5">
              <div className="w-10 h-10 rounded-xl bg-purple-500/10 border border-purple-500/20 flex items-center justify-center text-purple-400 group-hover:scale-110 transition-transform">
                <GraduationCap className="w-5 h-5" />
              </div>
              <span className={`inline-flex items-center text-[11px] font-semibold px-2 py-0.5 rounded-full ${classBadge.badgeClass}`}>
                {classBadge.icon}
                {classBadge.label}
              </span>
            </div>
            <p className="text-[11px] uppercase tracking-wider font-semibold text-slate-400">
              Classroom Gap (RTE)
            </p>
            <div className="flex items-baseline gap-1.5 mt-1">
              <span className="text-2xl font-extrabold text-amber-400 font-mono">
                {classGap > 0 ? `-${classGap}` : '0'}
              </span>
              <span className="text-[11px] text-slate-400">Rooms (1:30 ratio)</span>
            </div>
          </div>
          <div className="mt-3 pt-2 border-t border-slate-800/80">
            <div className="flex justify-between text-[10px] text-slate-400 mb-1">
              <span>Units: {classCurrent} / {classRequired}</span>
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

        {/* Card 4: Healthcare Deficit (IPHS National Norms) */}
        <div className="relative overflow-hidden bg-slate-900/85 backdrop-blur-md rounded-2xl border border-slate-800 p-4.5 shadow-xl hover:border-slate-700 transition-all group flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between mb-2.5">
              <div className="w-10 h-10 rounded-xl bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center text-emerald-400 group-hover:scale-110 transition-transform">
                <Stethoscope className="w-5 h-5" />
              </div>
              <span className={`inline-flex items-center text-[11px] font-semibold px-2 py-0.5 rounded-full ${healthBadge.badgeClass}`}>
                {healthBadge.icon}
                {healthBadge.label}
              </span>
            </div>
            <p className="text-[11px] uppercase tracking-wider font-semibold text-slate-400">
              Healthcare Deficit (IPHS)
            </p>
            <div className="flex items-baseline gap-1.5 mt-1">
              <span className={`text-2xl font-extrabold font-mono ${isHealthcareAdequate ? 'text-emerald-400' : 'text-rose-400'}`}>
                {isHealthcareAdequate ? '0' : `-${phcGap || 1}`}
              </span>
              <span className="text-[11px] text-slate-400">PHC Gap (1/30k)</span>
            </div>
          </div>
          <div className="mt-3 pt-2 border-t border-slate-800/80">
            <div className="flex justify-between text-[10px] text-slate-400 mb-1">
              <span>Active: {healthNodesCount} PHC / {subCentresCount} Sub</span>
              <span className="font-mono text-emerald-400">IPHS</span>
            </div>
            <div className="w-full bg-slate-800 h-1.5 rounded-full overflow-hidden">
              <div
                className="bg-emerald-500 h-full rounded-full transition-all duration-500"
                style={{ width: `${Math.min(100, Math.round((healthNodesCount / requiredPHCs) * 100))}%` }}
              />
            </div>
          </div>
        </div>

        {/* Card 5: Paved Road Deficit (PMGSY) */}
        <div className="relative overflow-hidden bg-slate-900/85 backdrop-blur-md rounded-2xl border border-slate-800 p-4.5 shadow-xl hover:border-slate-700 transition-all group flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between mb-2.5">
              <div className="w-10 h-10 rounded-xl bg-orange-500/10 border border-orange-500/20 flex items-center justify-center text-orange-400 group-hover:scale-110 transition-transform">
                <Route className="w-5 h-5" />
              </div>
              <span className={`inline-flex items-center text-[11px] font-semibold px-2 py-0.5 rounded-full ${roadBadge.badgeClass}`}>
                {roadBadge.icon}
                {roadBadge.label}
              </span>
            </div>
            <p className="text-[11px] uppercase tracking-wider font-semibold text-slate-400">
              Paved Road Gap (PMGSY)
            </p>
            <div className="flex items-baseline gap-1.5 mt-1">
              <span className="text-2xl font-extrabold text-orange-400 font-mono">
                {roadDeficit > 0 ? `-${Number(roadDeficit).toFixed(1)}` : '0.0'}
              </span>
              <span className="text-[11px] text-slate-400">KM (1.25 km/1k)</span>
            </div>
          </div>
          <div className="mt-3 pt-2 border-t border-slate-800/80">
            <div className="flex justify-between text-[10px] text-slate-400 mb-1">
              <span>Paved: {Number(roadCurrent).toFixed(1)} / {Number(roadRequired).toFixed(1)} km</span>
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

      {/* =================================================================== */}
      {/* 2. LIVE INFRASTRUCTURE TELEMETRY DATASET BAR (4 REAL-TIME CARDS)   */}
      {/* =================================================================== */}
      <div className="bg-slate-900/85 backdrop-blur-md rounded-2xl border border-slate-800 p-5 shadow-2xl space-y-3.5">
        <div className="flex items-center justify-between border-b border-slate-800 pb-3">
          <div className="flex items-center gap-2">
            <Layers className="w-4 h-4 text-emerald-400" />
            <h3 className="text-sm font-bold text-white">
              Live Infrastructure Telemetry Dataset (Overpass / OpenStreetMap)
            </h3>
          </div>
          <span className="text-[11px] font-mono text-emerald-400 font-bold bg-emerald-500/10 px-2.5 py-0.5 rounded-full border border-emerald-500/20">
            Live Spatial Census
          </span>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3.5">
          {/* 1. Water Points */}
          <div className="p-3.5 bg-slate-950/70 rounded-xl border border-slate-800/90 flex items-center justify-between hover:border-blue-500/40 transition-all">
            <div className="space-y-1">
              <div className="flex items-center gap-1.5">
                <span className="w-2 h-2 rounded-full bg-blue-500 inline-block animate-pulse" />
                <span className="text-[11px] text-slate-400 uppercase font-bold">Water Points</span>
              </div>
              <p className="text-base font-extrabold text-white font-mono">
                {waterNodesCount} <span className="text-xs font-normal text-slate-400">Mapped Nodes</span>
              </p>
              <p className="text-[10px] text-slate-500">Taps, Wells &amp; Storage Tanks</p>
            </div>
            <div className="w-10 h-10 rounded-xl bg-blue-500/10 border border-blue-500/20 flex items-center justify-center text-blue-400">
              <Droplets className="w-5 h-5" />
            </div>
          </div>

          {/* 2. School Facilities */}
          <div className="p-3.5 bg-slate-950/70 rounded-xl border border-slate-800/90 flex items-center justify-between hover:border-purple-500/40 transition-all">
            <div className="space-y-1">
              <div className="flex items-center gap-1.5">
                <span className="w-2 h-2 rounded-full bg-purple-500 inline-block animate-pulse" />
                <span className="text-[11px] text-slate-400 uppercase font-bold">School Facilities</span>
              </div>
              <p className="text-base font-extrabold text-white font-mono">
                {schoolNodesCount} <span className="text-xs font-normal text-slate-400">Units</span> / {classCurrent} <span className="text-xs font-normal text-slate-400">Rooms</span>
              </p>
              <p className="text-[10px] text-slate-500">Elementary &amp; Secondary Schools</p>
            </div>
            <div className="w-10 h-10 rounded-xl bg-purple-500/10 border border-purple-500/20 flex items-center justify-center text-purple-400">
              <GraduationCap className="w-5 h-5" />
            </div>
          </div>

          {/* 3. Healthcare Facilities */}
          <div className="p-3.5 bg-slate-950/70 rounded-xl border border-slate-800/90 flex items-center justify-between hover:border-emerald-500/40 transition-all">
            <div className="space-y-1">
              <div className="flex items-center gap-1.5">
                <span className="w-2 h-2 rounded-full bg-emerald-500 inline-block animate-pulse" />
                <span className="text-[11px] text-slate-400 uppercase font-bold">Healthcare (PHCs/CHCs)</span>
              </div>
              <p className="text-base font-extrabold text-white font-mono">
                {healthNodesCount} <span className="text-xs font-normal text-slate-400">PHC</span> / {subCentresCount} <span className="text-xs font-normal text-slate-400">Sub-Centres</span>
              </p>
              <p className="text-[10px] text-slate-500">IPHS Rural Health Infrastructure</p>
            </div>
            <div className="w-10 h-10 rounded-xl bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center text-emerald-400">
              <HeartPulse className="w-5 h-5" />
            </div>
          </div>

          {/* 4. Road Network */}
          <div className="p-3.5 bg-slate-950/70 rounded-xl border border-slate-800/90 flex items-center justify-between hover:border-orange-500/40 transition-all">
            <div className="space-y-1">
              <div className="flex items-center gap-1.5">
                <span className="w-2 h-2 rounded-full bg-orange-500 inline-block animate-pulse" />
                <span className="text-[11px] text-slate-400 uppercase font-bold">Road Network</span>
              </div>
              <p className="text-base font-extrabold text-white font-mono">
                {roadNetworkKm} <span className="text-xs font-normal text-slate-400">km</span> / {Number(roadRequired).toFixed(1)} <span className="text-xs font-normal text-slate-400">Target</span>
              </p>
              <p className="text-[10px] text-slate-500">All-Weather Bitumen Road Grid</p>
            </div>
            <div className="w-10 h-10 rounded-xl bg-orange-500/10 border border-orange-500/20 flex items-center justify-center text-orange-400">
              <Route className="w-5 h-5" />
            </div>
          </div>
        </div>
      </div>

      {/* =================================================================== */}
      {/* 3. AI CONTEXTUAL GOVERNANCE ASSESSMENT NARRATIVE                   */}
      {/* =================================================================== */}
      {p?.summary_narrative && (
        <div className="bg-slate-900/85 backdrop-blur-md rounded-xl p-4 border border-slate-800 flex items-start gap-3 shadow-md">
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
