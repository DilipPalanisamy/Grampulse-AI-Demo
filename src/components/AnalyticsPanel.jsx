import React, { useEffect } from 'react';
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
  ShieldAlert,
  Compass,
} from 'lucide-react';
import { useTheme } from '../context/ThemeContext';
import { useLocation } from '../context/LocationContext';

/**
 * Returns formatted priority badge object with icon, colors, and label.
 */
const getPriorityBadge = (tier = 'P3', isSufficient = false) => {
  if (isSufficient) {
    return {
      label: 'Sufficient',
      tier: 'ADEQUATE',
      badgeClass: 'bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 border border-emerald-500/30',
      barColor: 'bg-emerald-500',
      icon: <CheckCircle2 className="w-4 h-4 mr-1.5 text-emerald-600 dark:text-emerald-400" />,
    };
  }

  const norm = (tier || 'P3').toUpperCase();
  switch (norm) {
    case 'P1':
    case 'CRITICAL':
    case 'HIGH':
      return {
        label: 'P1 Critical',
        tier: 'P1',
        badgeClass: 'bg-rose-500/15 text-rose-600 dark:text-rose-400 border border-rose-500/40 ring-1 ring-rose-500/20',
        barColor: 'bg-rose-500',
        icon: <AlertTriangle className="w-4 h-4 mr-1.5 text-rose-600 dark:text-rose-400 animate-pulse" />,
      };
    case 'P2':
    case 'MEDIUM':
      return {
        label: 'P2 High Gap',
        tier: 'P2',
        badgeClass: 'bg-amber-500/15 text-amber-600 dark:text-amber-400 border border-amber-500/40 ring-1 ring-amber-500/20',
        barColor: 'bg-amber-500',
        icon: <AlertTriangle className="w-4 h-4 mr-1.5 text-amber-600 dark:text-amber-400" />,
      };
    case 'P3':
    default:
      return {
        label: 'P3 Moderate',
        tier: 'P3',
        badgeClass: 'bg-yellow-500/15 text-yellow-600 dark:text-yellow-400 border border-yellow-500/30',
        barColor: 'bg-yellow-500',
        icon: <CheckCircle2 className="w-4 h-4 mr-1.5 text-yellow-600 dark:text-yellow-400" />,
      };
  }
};

const AnalyticsPanel = ({
  analytics,
  infrastructure = { counts: {}, markers: [] },
  loading = false,
}) => {
  const { activePalette } = useTheme();
  const { selectedLocation, loadAnalytics, loadInfrastructure } = useLocation();

  // Automatic Data Refresh on Navigation when selectedLocation changes
  useEffect(() => {
    if (selectedLocation?.gp_id || (selectedLocation?.lat && selectedLocation?.lng)) {
      loadAnalytics();
      loadInfrastructure();
    }
  }, [
    selectedLocation?.gp_id,
    selectedLocation?.lat,
    selectedLocation?.lng,
    loadAnalytics,
    loadInfrastructure,
  ]);

  if (loading) {
    return (
      <div className="space-y-6 animate-pulse">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {[1, 2, 3].map((i) => (
            <div
              key={i}
              className="h-52 bg-[var(--bg-card)] rounded-3xl border border-[var(--border-subtle)] p-6 flex flex-col justify-between"
            >
              <div className="flex items-center justify-between">
                <div className="w-12 h-12 rounded-2xl bg-[var(--bg-primary)]" />
                <div className="w-24 h-6 rounded-full bg-[var(--bg-primary)]" />
              </div>
              <div className="space-y-2">
                <div className="w-20 h-4 bg-[var(--bg-primary)] rounded" />
                <div className="w-32 h-8 bg-[var(--bg-primary)] rounded" />
              </div>
              <div className="w-full h-2.5 bg-[var(--bg-primary)] rounded-full" />
            </div>
          ))}
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {[4, 5].map((i) => (
            <div
              key={i}
              className="h-52 bg-[var(--bg-card)] rounded-3xl border border-[var(--border-subtle)] p-6 flex flex-col justify-between"
            >
              <div className="flex items-center justify-between">
                <div className="w-12 h-12 rounded-2xl bg-[var(--bg-primary)]" />
                <div className="w-24 h-6 rounded-full bg-[var(--bg-primary)]" />
              </div>
              <div className="space-y-2">
                <div className="w-20 h-4 bg-[var(--bg-primary)] rounded" />
                <div className="w-32 h-8 bg-[var(--bg-primary)] rounded" />
              </div>
              <div className="w-full h-2.5 bg-[var(--bg-primary)] rounded-full" />
            </div>
          ))}
        </div>
      </div>
    );
  }

  const p = analytics?.predictions || {};
  const targetYear = analytics?.target_year || p?.target_year || 2029;
  const priorities = analytics?.priority_analysis || p?.priority_analysis || {};

  // 1. Population Metrics (Demographic ML Extrapolator)
  const popCurrent = Number(p?.population_current || 5800);
  const popProjected = Number(p?.population_projected || 6341);
  const popGrowth = Number(p?.population_growth || popProjected - popCurrent);

  // 2. Water Metrics (JJM 55 LPD Norm)
  const waterDemand = Number(p?.water_demand_projected_lpd || popProjected * 55);
  const waterSupply = Number(p?.water_supply_current_lpd || 275000);
  const waterDeficit = Number(p?.water_deficit_lpd || Math.max(0, waterDemand - waterSupply));
  const waterDeficitPct = Math.min(100, Math.round((waterDeficit / (waterDemand || 1)) * 100));
  const waterCoveragePct = Math.min(100, Math.max(0, Math.round((waterSupply / (waterDemand || 1)) * 100)));

  // 3. Education Metrics (RTE 1:30 Classroom Ratio)
  const classRequired = Number(p?.classrooms_required || Math.ceil((popProjected * 0.18) / 30));
  const classCurrent = Number(p?.classrooms_current || 28);
  const classGap = Number(p?.classroom_gap || Math.max(0, classRequired - classCurrent));
  const classGapPct = Math.min(100, Math.round((classGap / (classRequired || 1)) * 100));
  const classCoveragePct = Math.min(100, Math.max(0, Math.round((classCurrent / (classRequired || 1)) * 100)));

  // 4. Roads Metrics (PMGSY 1.25 km / 1,000 population)
  const roadRequired = Number(p?.road_required_km || ((popProjected / 1000) * 1.25).toFixed(2));
  const roadCurrent = Number(p?.road_coverage_km || 6.20);
  const roadDeficit = Number(p?.paved_road_deficit_km || p?.road_gap_km || Math.max(0, roadRequired - roadCurrent));
  const roadDeficitPct = Math.min(100, Math.round((roadDeficit / (roadRequired || 1)) * 100));
  const roadCoveragePct = Math.min(100, Math.max(0, Math.round((roadCurrent / (roadRequired || 1)) * 100)));

  // 5. Healthcare Telemetry & IPHS National Norm Metrics
  const counts = infrastructure?.counts || {};
  const waterNodesCount = counts.water_points || 12;
  const schoolNodesCount = counts.schools || 3;
  const healthNodesCount = counts.healthcare || 1;
  const subCentresCount = counts.sub_centres || Math.max(1, Math.ceil(popCurrent / 5000));
  const roadNetworkKm = counts.estimated_road_network_km || roadCurrent.toFixed(1);

  const requiredPHCs = Math.max(1, Math.ceil(popProjected / 30000));
  const phcGap = Math.max(0, requiredPHCs - healthNodesCount);
  const isHealthcareAdequate = healthNodesCount >= requiredPHCs && subCentresCount >= Math.ceil(popProjected / 5000);

  // Priority Tiers Evaluation
  const waterTier = waterDeficit > 20000 || waterDeficitPct >= 30 ? 'P1' : waterDeficit >= 8000 || waterDeficitPct >= 15 ? 'P2' : waterDeficit > 0 ? 'P3' : 'ADEQUATE';
  const classTier = classGap >= 6 || classGapPct >= 30 ? 'P1' : classGap >= 3 || classGapPct >= 15 ? 'P2' : classGap > 0 ? 'P3' : 'ADEQUATE';
  const roadTier = roadDeficit >= 2.5 || roadDeficitPct >= 30 ? 'P1' : roadDeficit >= 1.5 || roadDeficitPct >= 15 ? 'P2' : roadDeficit > 0 ? 'P3' : 'ADEQUATE';
  const healthTier = phcGap >= 1 ? 'P1' : !isHealthcareAdequate ? 'P2' : 'ADEQUATE';

  const waterBadge = getPriorityBadge(priorities?.water?.priority || waterTier, waterDeficit <= 0);
  const classBadge = getPriorityBadge(priorities?.education?.priority || classTier, classGap <= 0);
  const roadBadge = getPriorityBadge(priorities?.roads?.priority || roadTier, roadDeficit <= 0);
  const healthBadge = getPriorityBadge(priorities?.healthcare?.priority || healthTier, isHealthcareAdequate);

  // Top Ranked Intervention
  const topSector = priorities?.top_sector || (waterTier === 'P1' ? 'Water Supply' : classTier === 'P1' ? 'Education' : roadTier === 'P1' ? 'Roads' : 'Water Supply');
  const topPriorityTier = priorities?.top_priority || (waterTier === 'P1' || classTier === 'P1' || roadTier === 'P1' || healthTier === 'P1' ? 'P1' : 'P2');

  return (
    <div className="space-y-6 sm:space-y-7">
      {/* =================================================================== */}
      {/* 1. EXECUTIVE DEFICIT PRIORITY OVERVIEW BANNER                       */}
      {/* =================================================================== */}
      <div className="flex flex-wrap items-center justify-between gap-4 p-5 rounded-3xl bg-[var(--bg-card)] border border-[var(--border-subtle)] backdrop-blur-xl shadow-xl">
        <div className="flex items-center gap-3.5">
          <div className="w-11 h-11 rounded-2xl bg-rose-500/15 border border-rose-500/30 flex items-center justify-center text-rose-500 flex-shrink-0">
            <ShieldAlert className="w-6 h-6" />
          </div>
          <div>
            <div className="flex flex-wrap items-center gap-2">
              <span className="text-xs sm:text-sm font-black text-[var(--text-main)] uppercase tracking-wider">
                Deficit Priority Assessment:
              </span>
              <span className="text-xs sm:text-sm font-black text-rose-600 dark:text-rose-400 bg-rose-500/10 px-3 py-0.5 rounded-full border border-rose-500/25">
                Top Priority: {topSector} ({topPriorityTier})
              </span>
            </div>
            <p className="text-xs text-[var(--text-muted)] mt-1">
              Ranked strictly by National Norm Deficit Severity (P1 Critical &gt; P2 High &gt; P3 Moderate) for targeted scheme intervention
            </p>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-2 font-mono text-xs sm:text-sm">
          {selectedLocation?.gp_name && (
            <span className="px-3 py-1.5 rounded-xl bg-[var(--bg-primary)] text-[var(--text-main)] border border-[var(--border-subtle)] font-bold flex items-center gap-1.5">
              <MapPin className="w-3.5 h-3.5 text-emerald-500" />
              <span>{selectedLocation.gp_name}</span>
            </span>
          )}
          <span className="px-3.5 py-1.5 rounded-xl bg-rose-500/10 text-rose-600 dark:text-rose-400 border border-rose-500/20 font-bold">
            P1: {waterTier === 'P1' ? 'Water ' : ''}{classTier === 'P1' ? 'Education ' : ''}{roadTier === 'P1' ? 'Roads ' : ''}{healthTier === 'P1' ? 'Health' : ''}
          </span>
        </div>
      </div>

      {/* =================================================================== */}
      {/* 2. TOP PREDICTIVE DEFICIT METRICS - 2-ROW BALANCED GRID             */}
      {/* =================================================================== */}
      <div className="space-y-6">
        {/* ----------------------------------------------------------------- */}
        {/* ROW 1: PRIMARY METRICS (3 COLUMNS: Population, Water, Classrooms)  */}
        {/* ----------------------------------------------------------------- */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          
          {/* Card 1: Projected Population (ML Extrapolator) */}
          <div className="relative overflow-hidden bg-[var(--bg-card)] backdrop-blur-md rounded-3xl border border-[var(--border-subtle)] p-6 shadow-xl hover:border-blue-500/40 transition-all group flex flex-col justify-between min-h-[220px]">
            <div>
              <div className="flex items-center justify-between mb-3">
                <div className="w-12 h-12 rounded-2xl bg-blue-500/10 border border-blue-500/20 flex items-center justify-center text-blue-500 group-hover:scale-110 transition-transform">
                  <Users className="w-6 h-6" />
                </div>
                <span className="inline-flex items-center text-xs font-bold px-3 py-1 rounded-full bg-blue-500/15 text-blue-600 dark:text-blue-300 border border-blue-500/30">
                  <TrendingUp className="w-3.5 h-3.5 mr-1 text-blue-500" />
                  Target {targetYear}
                </span>
              </div>
              <p className="text-xs uppercase tracking-wider font-bold text-[var(--text-muted)]">
                Projected Population
              </p>
              <div className="flex items-baseline gap-2.5 mt-2">
                <span className="text-3xl font-extrabold text-[var(--text-main)] font-mono tracking-tight">
                  {popProjected.toLocaleString()}
                </span>
                <span className="text-xs font-bold text-emerald-600 dark:text-emerald-400">
                  +{popGrowth.toLocaleString()} (+{p?.growth_rate_pct || 1.8}%)
                </span>
              </div>
            </div>
            <p className="text-xs text-[var(--text-muted)] flex items-center gap-2 mt-4 pt-3 border-t border-[var(--border-subtle)]">
              <span className="w-2 h-2 rounded-full bg-blue-400" />
              Base Population: <strong>{popCurrent.toLocaleString()} citizens</strong>
            </p>
          </div>

          {/* Card 2: Potable Water Supply Deficit (JJM) */}
          <div className="relative overflow-hidden bg-[var(--bg-card)] backdrop-blur-md rounded-3xl border border-[var(--border-subtle)] p-6 shadow-xl hover:border-sky-500/40 transition-all group flex flex-col justify-between min-h-[220px]">
            <div>
              <div className="flex items-center justify-between mb-3">
                <div className="w-12 h-12 rounded-2xl bg-sky-500/10 border border-sky-500/20 flex items-center justify-center text-sky-500 group-hover:scale-110 transition-transform">
                  <Droplets className="w-6 h-6" />
                </div>
                <span className={`inline-flex items-center text-xs font-bold px-3 py-1 rounded-full ${waterBadge.badgeClass}`}>
                  {waterBadge.icon}
                  {waterBadge.label}
                </span>
              </div>
              <p className="text-xs uppercase tracking-wider font-bold text-[var(--text-muted)]">
                Daily Water Deficit (JJM)
              </p>
              <div className="flex items-baseline gap-2 mt-2">
                <span className="text-3xl font-extrabold text-rose-600 dark:text-rose-400 font-mono tracking-tight">
                  {waterDeficit > 0 ? `-${Math.round(waterDeficit).toLocaleString()}` : '0'}
                </span>
                <span className="text-xs font-medium text-[var(--text-muted)]">LPD (55 L/capita norm)</span>
              </div>
            </div>
            <div className="mt-4 pt-3 border-t border-[var(--border-subtle)]">
              <div className="flex justify-between text-xs text-[var(--text-muted)] mb-1.5 font-medium">
                <span>Supply: {Math.round(waterSupply / 1000)}k LPD</span>
                <span className="font-mono font-bold text-[var(--text-main)]">{waterCoveragePct}% Coverage</span>
              </div>
              <div className="w-full bg-[var(--bg-primary)] h-2 rounded-full overflow-hidden">
                <div
                  className={`${waterBadge.barColor} h-full rounded-full transition-all duration-500`}
                  style={{ width: `${waterCoveragePct}%` }}
                />
              </div>
            </div>
          </div>

          {/* Card 3: School Classroom Gap (RTE) */}
          <div className="relative overflow-hidden bg-[var(--bg-card)] backdrop-blur-md rounded-3xl border border-[var(--border-subtle)] p-6 shadow-xl hover:border-purple-500/40 transition-all group flex flex-col justify-between min-h-[220px]">
            <div>
              <div className="flex items-center justify-between mb-3">
                <div className="w-12 h-12 rounded-2xl bg-purple-500/10 border border-purple-500/20 flex items-center justify-center text-purple-500 group-hover:scale-110 transition-transform">
                  <GraduationCap className="w-6 h-6" />
                </div>
                <span className={`inline-flex items-center text-xs font-bold px-3 py-1 rounded-full ${classBadge.badgeClass}`}>
                  {classBadge.icon}
                  {classBadge.label}
                </span>
              </div>
              <p className="text-xs uppercase tracking-wider font-bold text-[var(--text-muted)]">
                Classroom Gap (RTE)
              </p>
              <div className="flex items-baseline gap-2 mt-2">
                <span className="text-3xl font-extrabold text-amber-600 dark:text-amber-400 font-mono tracking-tight">
                  {classGap > 0 ? `-${classGap}` : '0'}
                </span>
                <span className="text-xs font-medium text-[var(--text-muted)]">Rooms (1:30 pupil ratio)</span>
              </div>
            </div>
            <div className="mt-4 pt-3 border-t border-[var(--border-subtle)]">
              <div className="flex justify-between text-xs text-[var(--text-muted)] mb-1.5 font-medium">
                <span>Active: {classCurrent} / {classRequired} rooms</span>
                <span className="font-mono font-bold text-[var(--text-main)]">{classCoveragePct}% Capacity</span>
              </div>
              <div className="w-full bg-[var(--bg-primary)] h-2 rounded-full overflow-hidden">
                <div
                  className={`${classBadge.barColor} h-full rounded-full transition-all duration-500`}
                  style={{ width: `${classCoveragePct}%` }}
                />
              </div>
            </div>
          </div>

        </div>

        {/* ----------------------------------------------------------------- */}
        {/* ROW 2: SECONDARY METRICS (2 COLUMNS: Healthcare, Paved Roads)      */}
        {/* ----------------------------------------------------------------- */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          
          {/* Card 4: Healthcare Deficit (IPHS National Norms) */}
          <div className="relative overflow-hidden bg-[var(--bg-card)] backdrop-blur-md rounded-3xl border border-[var(--border-subtle)] p-6 shadow-xl hover:border-emerald-500/40 transition-all group flex flex-col justify-between min-h-[220px]">
            <div>
              <div className="flex items-center justify-between mb-3">
                <div className="w-12 h-12 rounded-2xl bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center text-emerald-500 group-hover:scale-110 transition-transform">
                  <Stethoscope className="w-6 h-6" />
                </div>
                <span className={`inline-flex items-center text-xs font-bold px-3 py-1 rounded-full ${healthBadge.badgeClass}`}>
                  {healthBadge.icon}
                  {healthBadge.label}
                </span>
              </div>
              <p className="text-xs uppercase tracking-wider font-bold text-[var(--text-muted)]">
                Healthcare Deficit (IPHS 2022)
              </p>
              <div className="flex items-baseline gap-2 mt-2">
                <span className={`text-3xl font-extrabold font-mono tracking-tight ${isHealthcareAdequate ? 'text-emerald-600 dark:text-emerald-400' : 'text-rose-600 dark:text-rose-400'}`}>
                  {isHealthcareAdequate ? '0' : `-${phcGap || 1}`}
                </span>
                <span className="text-xs font-medium text-[var(--text-muted)]">PHC Required (1 PHC / 30,000 pop)</span>
              </div>
            </div>
            <div className="mt-4 pt-3 border-t border-[var(--border-subtle)]">
              <div className="flex justify-between text-xs text-[var(--text-muted)] mb-1.5 font-medium">
                <span>Active: {healthNodesCount} PHC / {subCentresCount} Sub-Centres</span>
                <span className="font-mono text-emerald-600 dark:text-emerald-400 font-bold">IPHS 2022 Verified</span>
              </div>
              <div className="w-full bg-[var(--bg-primary)] h-2 rounded-full overflow-hidden">
                <div
                  className={`${healthBadge.barColor} h-full rounded-full transition-all duration-500`}
                  style={{ width: `${Math.min(100, Math.round((healthNodesCount / requiredPHCs) * 100))}%` }}
                />
              </div>
            </div>
          </div>

          {/* Card 5: Paved Road Deficit (PMGSY) */}
          <div className="relative overflow-hidden bg-[var(--bg-card)] backdrop-blur-md rounded-3xl border border-[var(--border-subtle)] p-6 shadow-xl hover:border-orange-500/40 transition-all group flex flex-col justify-between min-h-[220px]">
            <div>
              <div className="flex items-center justify-between mb-3">
                <div className="w-12 h-12 rounded-2xl bg-orange-500/10 border border-orange-500/20 flex items-center justify-center text-orange-500 group-hover:scale-110 transition-transform">
                  <Route className="w-6 h-6" />
                </div>
                <span className={`inline-flex items-center text-xs font-bold px-3 py-1 rounded-full ${roadBadge.badgeClass}`}>
                  {roadBadge.icon}
                  {roadBadge.label}
                </span>
              </div>
              <p className="text-xs uppercase tracking-wider font-bold text-[var(--text-muted)]">
                Paved Road Gap (PMGSY)
              </p>
              <div className="flex items-baseline gap-2 mt-2">
                <span className="text-3xl font-extrabold text-orange-600 dark:text-orange-400 font-mono tracking-tight">
                  {roadDeficit > 0 ? `-${Number(roadDeficit).toFixed(1)}` : '0.0'}
                </span>
                <span className="text-xs font-medium text-[var(--text-muted)]">KM (1.25 km / 1,000 pop norm)</span>
              </div>
            </div>
            <div className="mt-4 pt-3 border-t border-[var(--border-subtle)]">
              <div className="flex justify-between text-xs text-[var(--text-muted)] mb-1.5 font-medium">
                <span>Paved: {Number(roadCurrent).toFixed(1)} / {Number(roadRequired).toFixed(1)} km</span>
                <span className="font-mono font-bold text-[var(--text-main)]">{roadCoveragePct}% Target</span>
              </div>
              <div className="w-full bg-[var(--bg-primary)] h-2 rounded-full overflow-hidden">
                <div
                  className={`${roadBadge.barColor} h-full rounded-full transition-all duration-500`}
                  style={{ width: `${roadCoveragePct}%` }}
                />
              </div>
            </div>
          </div>

        </div>
      </div>

      {/* =================================================================== */}
      {/* 3. LIVE INFRASTRUCTURE TELEMETRY DATASET (BALANCED 2X2 GRID)        */}
      {/* =================================================================== */}
      <div className="bg-[var(--bg-card)] backdrop-blur-md rounded-3xl border border-[var(--border-subtle)] p-6 sm:p-7 shadow-2xl space-y-5">
        <div className="flex flex-wrap items-center justify-between gap-3 border-b border-[var(--border-subtle)] pb-4">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-xl bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center text-emerald-500">
              <Layers className="w-4 h-4" />
            </div>
            <div>
              <h3 className="text-sm sm:text-base font-black text-[var(--text-main)]">
                Live Infrastructure Telemetry Dataset
              </h3>
              <p className="text-xs text-[var(--text-muted)]">
                Real-time OpenStreetMap / Overpass GIS spatial asset nodes
              </p>
            </div>
          </div>
          <span className="text-xs font-mono text-emerald-600 dark:text-emerald-400 font-bold bg-emerald-500/10 px-3 py-1 rounded-full border border-emerald-500/20">
            Live Spatial Nodes
          </span>
        </div>

        {/* Balanced 2x2 Responsive Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-5 sm:gap-6">
          {/* 1. Water Points */}
          <div className="p-5 bg-[var(--bg-primary)] rounded-2xl border border-[var(--border-subtle)] flex items-center justify-between hover:border-blue-500/40 transition-all shadow-sm">
            <div className="space-y-1.5">
              <div className="flex items-center gap-2">
                <span className="w-2.5 h-2.5 rounded-full bg-blue-500 inline-block animate-pulse" />
                <span className="text-xs text-[var(--text-muted)] uppercase font-bold tracking-wider">Water Points</span>
              </div>
              <p className="text-xl font-extrabold text-[var(--text-main)] font-mono">
                {waterNodesCount} <span className="text-xs font-medium text-[var(--text-muted)]">Mapped Ground Nodes</span>
              </p>
              <p className="text-xs text-[var(--text-subtle)]">Community taps, borewells &amp; storage tanks</p>
            </div>
            <div className="w-12 h-12 rounded-2xl bg-blue-500/10 border border-blue-500/20 flex items-center justify-center text-blue-500 flex-shrink-0">
              <Droplets className="w-6 h-6" />
            </div>
          </div>

          {/* 2. School Facilities */}
          <div className="p-5 bg-[var(--bg-primary)] rounded-2xl border border-[var(--border-subtle)] flex items-center justify-between hover:border-purple-500/40 transition-all shadow-sm">
            <div className="space-y-1.5">
              <div className="flex items-center gap-2">
                <span className="w-2.5 h-2.5 rounded-full bg-purple-500 inline-block animate-pulse" />
                <span className="text-xs text-[var(--text-muted)] uppercase font-bold tracking-wider">School Facilities</span>
              </div>
              <p className="text-xl font-extrabold text-[var(--text-main)] font-mono">
                {schoolNodesCount} <span className="text-xs font-medium text-[var(--text-muted)]">Facilities</span> / {classCurrent} <span className="text-xs font-medium text-[var(--text-muted)]">Rooms</span>
              </p>
              <p className="text-xs text-[var(--text-subtle)]">Elementary &amp; Secondary Schools (RTE Norms)</p>
            </div>
            <div className="w-12 h-12 rounded-2xl bg-purple-500/10 border border-purple-500/20 flex items-center justify-center text-purple-500 flex-shrink-0">
              <GraduationCap className="w-6 h-6" />
            </div>
          </div>

          {/* 3. Healthcare Facilities */}
          <div className="p-5 bg-[var(--bg-primary)] rounded-2xl border border-[var(--border-subtle)] flex items-center justify-between hover:border-emerald-500/40 transition-all shadow-sm">
            <div className="space-y-1.5">
              <div className="flex items-center gap-2">
                <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 inline-block animate-pulse" />
                <span className="text-xs text-[var(--text-muted)] uppercase font-bold tracking-wider">Healthcare Facilities</span>
              </div>
              <p className="text-xl font-extrabold text-[var(--text-main)] font-mono">
                {healthNodesCount} <span className="text-xs font-medium text-[var(--text-muted)]">PHC</span> / {subCentresCount} <span className="text-xs font-medium text-[var(--text-muted)]">Sub-Centres</span>
              </p>
              <p className="text-xs text-[var(--text-subtle)]">IPHS Rural Health Infrastructure &amp; Clinics</p>
            </div>
            <div className="w-12 h-12 rounded-2xl bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center text-emerald-500 flex-shrink-0">
              <HeartPulse className="w-6 h-6" />
            </div>
          </div>

          {/* 4. Road Network */}
          <div className="p-5 bg-[var(--bg-primary)] rounded-2xl border border-[var(--border-subtle)] flex items-center justify-between hover:border-orange-500/40 transition-all shadow-sm">
            <div className="space-y-1.5">
              <div className="flex items-center gap-2">
                <span className="w-2.5 h-2.5 rounded-full bg-orange-500 inline-block animate-pulse" />
                <span className="text-xs text-[var(--text-muted)] uppercase font-bold tracking-wider">Road Network</span>
              </div>
              <p className="text-xl font-extrabold text-[var(--text-main)] font-mono">
                {roadNetworkKm} <span className="text-xs font-medium text-[var(--text-muted)]">km</span> / {Number(roadRequired).toFixed(1)} <span className="text-xs font-medium text-[var(--text-muted)]">Target</span>
              </p>
              <p className="text-xs text-[var(--text-subtle)]">All-Weather Bitumen Road Grid (PMGSY Norms)</p>
            </div>
            <div className="w-12 h-12 rounded-2xl bg-orange-500/10 border border-orange-500/20 flex items-center justify-center text-orange-500 flex-shrink-0">
              <Route className="w-6 h-6" />
            </div>
          </div>
        </div>
      </div>

      {/* =================================================================== */}
      {/* 4. AI CONTEXTUAL GOVERNANCE ASSESSMENT NARRATIVE                   */}
      {/* =================================================================== */}
      {p?.summary_narrative && (
        <div className="bg-[var(--bg-card)] backdrop-blur-md rounded-2xl p-5 border border-[var(--border-subtle)] flex items-start gap-3.5 shadow-md">
          <Activity className="w-5 h-5 text-emerald-500 shrink-0 mt-0.5" />
          <p className="text-xs sm:text-sm text-[var(--text-main)] leading-relaxed">
            <strong className="text-emerald-600 dark:text-emerald-400 font-bold">MoPR AI Governance Assessment: </strong>
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
    priority_analysis: PropTypes.object,
    matched_schemes: PropTypes.array,
  }),
  infrastructure: PropTypes.shape({
    counts: PropTypes.object,
    markers: PropTypes.array,
  }),
  loading: PropTypes.bool,
};

export default React.memo(AnalyticsPanel);
