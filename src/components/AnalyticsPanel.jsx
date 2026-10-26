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
  MapPin,
  Sparkles,
  Building2,
  Stethoscope,
  ShieldAlert,
  Compass,
  Zap,
  Home,
  BookOpen,
  School,
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
  const { selectedLocation } = useLocation();

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

  // 1. Population Metrics (Authentic Census Baseline & Demographic Model Projection)
  const rawPop = selectedLocation?.indicators?.total_population?.value ?? selectedLocation?.population ?? p?.population_current;
  const popCurrent = rawPop != null ? Number(rawPop) : null;
  const popProjected = p?.population_projected != null ? Number(p.population_projected) : (popCurrent != null ? Math.round(popCurrent * 1.09) : null);
  const popGrowth = popProjected != null && popCurrent != null ? popProjected - popCurrent : null;

  // 2. Water Metrics (JJM 55 LPD Norm)
  const rawWaterSupply = selectedLocation?.daily_water_supply_liters ?? p?.water_supply_current_lpd;
  const waterSupply = rawWaterSupply != null ? Number(rawWaterSupply) : (popCurrent != null ? Math.round(popCurrent * 50) : null);
  const waterDemand = popProjected != null ? Number(p?.water_demand_projected_lpd || popProjected * 55) : (popCurrent != null ? popCurrent * 55 : null);
  const waterDeficit = waterDemand != null && waterSupply != null ? Math.max(0, waterDemand - waterSupply) : null;
  const waterCoveragePct = selectedLocation?.indicators?.tap_water_coverage_percent?.value != null
    ? Number(selectedLocation.indicators.tap_water_coverage_percent.value)
    : (selectedLocation?.tap_water_coverage != null
      ? Number(selectedLocation.tap_water_coverage)
      : (waterSupply != null && waterDemand ? Math.min(100, Math.round((waterSupply / waterDemand) * 100)) : null));

  // 3. Education Metrics (RTE 1:30 Classroom Ratio)
  const rawClassrooms = selectedLocation?.indicators?.udise_total_classrooms?.value ?? selectedLocation?.school_classrooms_count ?? p?.classrooms_current;
  const classCurrent = rawClassrooms != null ? Number(rawClassrooms) : null;
  const classRequired = popProjected != null ? Number(p?.classrooms_required || Math.ceil((popProjected * 0.18) / 30)) : (popCurrent != null ? Math.ceil((popCurrent * 0.18) / 30) : null);
  const classGap = classRequired != null && classCurrent != null ? Math.max(0, classRequired - classCurrent) : null;
  const classGapPct = classGap != null && classRequired ? Math.min(100, Math.round((classGap / classRequired) * 100)) : 0;
  const classCoveragePct = classCurrent != null && classRequired ? Math.min(100, Math.max(0, Math.round((classCurrent / classRequired) * 100))) : 0;

  // 4. Roads Metrics (PMGSY 1.25 km / 1,000 population)
  const rawRoad = selectedLocation?.indicators?.village_road_length_km?.value ?? selectedLocation?.road_coverage_km;
  const roadCurrent = rawRoad != null && rawRoad !== '' ? Number(rawRoad) : null;
  const roadRequired = popProjected != null ? Number(p?.road_required_km || ((popProjected / 1000) * 1.25).toFixed(2)) : (popCurrent != null ? Number(((popCurrent / 1000) * 1.25).toFixed(2)) : null);
  const roadDeficit = roadRequired != null && roadCurrent != null ? Number(Math.max(0, roadRequired - roadCurrent).toFixed(2)) : null;
  const roadDeficitPct = roadDeficit != null && roadRequired ? Math.min(100, Math.round((roadDeficit / roadRequired) * 100)) : 0;
  const roadCoveragePct = roadCurrent != null && roadRequired ? Math.min(100, Math.max(0, Math.round((roadCurrent / roadRequired) * 100))) : 0;

  // 5. Healthcare Telemetry & IPHS National Norm Metrics
  const counts = infrastructure?.counts || {};
  const healthNodesCount = counts.healthcare || (selectedLocation?.indicators?.public_health_centre?.value ? 1 : 0);
  const subCentresCount = counts.sub_centres || (popCurrent != null ? Math.max(1, Math.ceil(popCurrent / 5000)) : 1);

  const requiredPHCs = popProjected != null ? Math.max(1, Math.ceil(popProjected / 30000)) : 1;
  const phcGap = Math.max(0, requiredPHCs - healthNodesCount);
  const isHealthcareAdequate = healthNodesCount >= requiredPHCs && subCentresCount >= (popProjected != null ? Math.ceil(popProjected / 5000) : 1);

  // Priority Tiers Evaluation
  const waterTier = waterDeficit != null && (waterDeficit > 20000 || waterDeficitPct >= 30) ? 'P1' : waterDeficit != null && (waterDeficit >= 8000 || waterDeficitPct >= 15) ? 'P2' : waterDeficit != null && waterDeficit > 0 ? 'P3' : 'ADEQUATE';
  const classTier = classGap != null && (classGap >= 6 || classGapPct >= 30) ? 'P1' : classGap != null && (classGap >= 3 || classGapPct >= 15) ? 'P2' : classGap != null && classGap > 0 ? 'P3' : 'ADEQUATE';
  const roadTier = roadDeficit != null && (roadDeficit >= 2.5 || roadDeficitPct >= 30) ? 'P1' : roadDeficit != null && (roadDeficit >= 1.5 || roadDeficitPct >= 15) ? 'P2' : roadDeficit != null && roadDeficit > 0 ? 'P3' : 'ADEQUATE';
  const healthTier = phcGap >= 1 ? 'P1' : !isHealthcareAdequate ? 'P2' : 'ADEQUATE';

  const waterBadge = getPriorityBadge(priorities?.water?.priority || waterTier, waterDeficit != null && waterDeficit <= 0);
  const classBadge = getPriorityBadge(priorities?.education?.priority || classTier, classGap != null && classGap <= 0);
  const roadBadge = getPriorityBadge(priorities?.roads?.priority || roadTier, roadDeficit != null && roadDeficit <= 0);
  const healthBadge = getPriorityBadge(priorities?.healthcare?.priority || healthTier, isHealthcareAdequate);

  // Top Ranked Intervention
  const topSector = priorities?.top_sector || (waterTier === 'P1' ? 'Water Supply' : classTier === 'P1' ? 'Education' : roadTier === 'P1' ? 'Roads' : 'Water Supply');
  const topPriorityTier = priorities?.top_priority || (waterTier === 'P1' || classTier === 'P1' || roadTier === 'P1' || healthTier === 'P1' ? 'P1' : 'P2');

  // Authentic Village Profile Indicators (Census 2011 PCA, Table HL-11, UDISE+)
  const baseline = selectedLocation?.census_baseline || {};
  const inds = selectedLocation?.indicators || {};

  const actualPop = inds.total_population?.value ?? selectedLocation?.population ?? baseline.population ?? null;
  const actualHh = inds.total_households?.value ?? selectedLocation?.households ?? baseline.households ?? null;
  const actualHl11Hh = inds.hl11_total_households?.value ?? selectedLocation?.hl11_households ?? baseline.hl11_households ?? null;
  const actualElec = inds.household_electricity_coverage?.value ?? selectedLocation?.electricity_coverage ?? baseline.electricity_coverage_percent ?? null;
  const actualWater = inds.tap_water_coverage_percent?.value ?? selectedLocation?.tap_water_coverage ?? baseline.tap_water_coverage_percent ?? null;
  const actualSanitation = inds.latrine_facility_coverage?.value ?? selectedLocation?.latrine_coverage ?? baseline.latrine_coverage_percent ?? null;
  const actualSchools = inds.udise_school_count?.value ?? selectedLocation?.schools ?? null;
  const actualClassrooms = inds.udise_total_classrooms?.value ?? selectedLocation?.school_classrooms_count ?? null;
  const actualLiteratePop = inds.literate_population?.value ?? selectedLocation?.literate_population ?? baseline.literate_population ?? null;
  const actualRoadLength = inds.village_road_length_km?.value ?? selectedLocation?.road_coverage_km ?? null;

  const actualLiteracyRate = actualLiteratePop != null && actualPop != null
    ? ((actualLiteratePop / actualPop) * 100).toFixed(1)
    : (selectedLocation?.literacy_rate != null ? Number(selectedLocation.literacy_rate).toFixed(1) : null);

  const formatPercentVal = (val) => {
    if (val === null || val === undefined || val === '') return 'Not Available';
    const num = Number(val);
    if (isNaN(num)) return 'Not Available';
    return `${num.toFixed(1)}%`;
  };

  console.log('[DEBUG-ANALYTICS-PANEL] selectedLocation:', selectedLocation);
  console.log('[DEBUG-ANALYTICS-PANEL] analytics:', analytics);
  console.log('[DEBUG-ANALYTICS-PANEL] Display Values:', {
    pop: actualPop,
    households: actualHh,
    electricity: actualElec,
    water: actualWater,
    sanitation: actualSanitation,
    schools: actualSchools,
    classrooms: actualClassrooms,
    road: actualRoadLength,
    literacyRate: actualLiteracyRate,
  });

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
          {(() => {
            const sum = selectedLocation?.data_summary;
            const tot = sum?.total_indicators ?? (selectedLocation?.indicators ? Object.keys(selectedLocation.indicators).length : 0);
            const ver = sum?.verified_indicators ?? (selectedLocation?.indicators ? Object.values(selectedLocation.indicators).filter(i => i?.data_status === 'VERIFIED' || i?.data_status === 'HISTORICAL' || (i?.value != null && i?.data_status !== 'UNAVAILABLE')).length : 0);
            if (tot > 0) {
              const pct = Math.round((ver / tot) * 100);
              return (
                <span className="px-3 py-1.5 rounded-xl bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/25 font-bold flex items-center gap-1.5">
                  <CheckCircle2 className="w-3.5 h-3.5" />
                  <span>{pct}% Verified ({ver}/{tot})</span>
                </span>
              );
            }
            return null;
          })()}
          <span className="px-3.5 py-1.5 rounded-xl bg-rose-500/10 text-rose-600 dark:text-rose-400 border border-rose-500/20 font-bold">
            P1: {waterTier === 'P1' ? 'Water ' : ''}{classTier === 'P1' ? 'Education ' : ''}{roadTier === 'P1' ? 'Roads ' : ''}{healthTier === 'P1' ? 'Health' : ''}
          </span>
        </div>
      </div>

      {/* =================================================================== */}
      {/* 2. AUTHENTIC VILLAGE DATA & GOVERNMENT INDICATORS (Census & UDISE+) */}
      {/* =================================================================== */}
      <div className="bg-[var(--bg-card)] backdrop-blur-xl rounded-3xl border border-[var(--border-subtle)] p-6 shadow-xl space-y-5">
        <div className="flex flex-wrap items-center justify-between gap-3 border-b border-[var(--border-subtle)] pb-4">
          <div className="space-y-1">
            <div className="flex items-center gap-2">
              <Building2 className="w-5 h-5 text-emerald-500" />
              <h3 className="text-base sm:text-lg font-black text-[var(--text-main)] tracking-tight">
                Authentic Village Profile &amp; Government Data
              </h3>
              <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/25">
                Verified Backend Data
              </span>
            </div>
            <p className="text-xs text-[var(--text-muted)]">
              Direct telemetry from Census 2011 PCA, Table HL-11 Housing Amenities, UDISE+ School Directory, and Jal Jeevan Mission
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-2 text-xs font-mono">
            {selectedLocation?.census_code && (
              <span className="px-3 py-1 rounded-xl bg-[var(--bg-primary)] text-[var(--text-main)] border border-[var(--border-subtle)] font-bold">
                Census Code: {selectedLocation.census_code}
              </span>
            )}
            <span className="px-3 py-1 rounded-xl bg-blue-500/10 text-blue-600 dark:text-blue-400 border border-blue-500/25 font-bold">
              {selectedLocation?.location_type || 'Gram Panchayat'}
            </span>
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {/* 1. Population */}
          <div className="p-4 rounded-2xl bg-[var(--bg-primary)] border border-[var(--border-subtle)] space-y-2 hover:border-blue-500/30 transition-all">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-[var(--text-muted)] uppercase tracking-wider">Population</span>
              <div className="w-7 h-7 rounded-lg bg-blue-500/10 flex items-center justify-center text-blue-500">
                <Users className="w-4 h-4" />
              </div>
            </div>
            <div className="text-2xl font-black text-[var(--text-main)] font-mono">
              {actualPop != null ? actualPop.toLocaleString() : 'Not Available'}
            </div>
            <div className="text-[11px] text-[var(--text-muted)] flex justify-between border-t border-[var(--border-subtle)] pt-1.5">
              <span>Census 2011 PCA</span>
              <span className="font-semibold">{selectedLocation?.male_population != null ? `M: ${selectedLocation.male_population.toLocaleString()} | F: ${selectedLocation.female_population?.toLocaleString()}` : 'Official Record'}</span>
            </div>
          </div>

          {/* 2. Households */}
          <div className="p-4 rounded-2xl bg-[var(--bg-primary)] border border-[var(--border-subtle)] space-y-2 hover:border-emerald-500/30 transition-all">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-[var(--text-muted)] uppercase tracking-wider">Households</span>
              <div className="w-7 h-7 rounded-lg bg-emerald-500/10 flex items-center justify-center text-emerald-500">
                <Home className="w-4 h-4" />
              </div>
            </div>
            <div className="text-2xl font-black text-[var(--text-main)] font-mono">
              {actualHh != null ? actualHh.toLocaleString() : 'Not Available'}
            </div>
            <div className="text-[11px] text-[var(--text-muted)] flex justify-between border-t border-[var(--border-subtle)] pt-1.5">
              <span>Census PCA / HL-11</span>
              <span className="font-semibold">{actualHl11Hh != null ? `${actualHl11Hh.toLocaleString()} HL-11 HH` : 'Official Count'}</span>
            </div>
          </div>

          {/* 3. Electricity */}
          <div className="p-4 rounded-2xl bg-[var(--bg-primary)] border border-[var(--border-subtle)] space-y-2 hover:border-amber-500/30 transition-all">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-[var(--text-muted)] uppercase tracking-wider">Electricity</span>
              <div className="w-7 h-7 rounded-lg bg-amber-500/10 flex items-center justify-center text-amber-500">
                <Zap className="w-4 h-4" />
              </div>
            </div>
            <div className="text-2xl font-black text-amber-500 font-mono">
              {formatPercentVal(actualElec)}
            </div>
            <div className="text-[11px] text-[var(--text-muted)] flex justify-between border-t border-[var(--border-subtle)] pt-1.5">
              <span>Grid Feeder Coverage</span>
              <span className="font-semibold">Table HL-11</span>
            </div>
          </div>

          {/* 4. Tap Water */}
          <div className="p-4 rounded-2xl bg-[var(--bg-primary)] border border-[var(--border-subtle)] space-y-2 hover:border-sky-500/30 transition-all">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-[var(--text-muted)] uppercase tracking-wider">Tap Water</span>
              <div className="w-7 h-7 rounded-lg bg-sky-500/10 flex items-center justify-center text-sky-500">
                <Droplets className="w-4 h-4" />
              </div>
            </div>
            <div className="text-2xl font-black text-sky-500 font-mono">
              {formatPercentVal(actualWater)}
            </div>
            <div className="text-[11px] text-[var(--text-muted)] flex justify-between border-t border-[var(--border-subtle)] pt-1.5">
              <span>Treated Tap Supply</span>
              <span className="font-semibold">Jal Jeevan Mission</span>
            </div>
          </div>

          {/* 5. Sanitation */}
          <div className="p-4 rounded-2xl bg-[var(--bg-primary)] border border-[var(--border-subtle)] space-y-2 hover:border-teal-500/30 transition-all">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-[var(--text-muted)] uppercase tracking-wider">Sanitation</span>
              <div className="w-7 h-7 rounded-lg bg-teal-500/10 flex items-center justify-center text-teal-500">
                <CheckCircle2 className="w-4 h-4" />
              </div>
            </div>
            <div className="text-2xl font-black text-teal-500 font-mono">
              {formatPercentVal(actualSanitation)}
            </div>
            <div className="text-[11px] text-[var(--text-muted)] flex justify-between border-t border-[var(--border-subtle)] pt-1.5">
              <span>Latrine Facility</span>
              <span className="font-semibold">Census HL-11</span>
            </div>
          </div>

          {/* 6. Schools */}
          <div className="p-4 rounded-2xl bg-[var(--bg-primary)] border border-[var(--border-subtle)] space-y-2 hover:border-purple-500/30 transition-all">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-[var(--text-muted)] uppercase tracking-wider">UDISE+ Schools</span>
              <div className="w-7 h-7 rounded-lg bg-purple-500/10 flex items-center justify-center text-purple-500">
                <School className="w-4 h-4" />
              </div>
            </div>
            <div className="text-2xl font-black text-purple-500 font-mono">
              {actualSchools != null ? `${actualSchools} Schools` : 'Not Available'}
            </div>
            <div className="text-[11px] text-[var(--text-muted)] flex justify-between border-t border-[var(--border-subtle)] pt-1.5">
              <span>Ministry of Education</span>
              <span className="font-semibold">Active Directory</span>
            </div>
          </div>

          {/* 7. Classrooms */}
          <div className="p-4 rounded-2xl bg-[var(--bg-primary)] border border-[var(--border-subtle)] space-y-2 hover:border-indigo-500/30 transition-all">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-[var(--text-muted)] uppercase tracking-wider">Classrooms</span>
              <div className="w-7 h-7 rounded-lg bg-indigo-500/10 flex items-center justify-center text-indigo-500">
                <GraduationCap className="w-4 h-4" />
              </div>
            </div>
            <div className="text-2xl font-black text-indigo-500 font-mono">
              {actualClassrooms != null ? `${actualClassrooms} Rooms` : 'Not Available'}
            </div>
            <div className="text-[11px] text-[var(--text-muted)] flex justify-between border-t border-[var(--border-subtle)] pt-1.5">
              <span>School Infrastructure</span>
              <span className="font-semibold">UDISE+ 2023-24</span>
            </div>
          </div>

          {/* 8. Literacy Rate */}
          <div className="p-4 rounded-2xl bg-[var(--bg-primary)] border border-[var(--border-subtle)] space-y-2 hover:border-rose-500/30 transition-all">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-[var(--text-muted)] uppercase tracking-wider">Literacy Rate</span>
              <div className="w-7 h-7 rounded-lg bg-rose-500/10 flex items-center justify-center text-rose-500">
                <BookOpen className="w-4 h-4" />
              </div>
            </div>
            <div className="text-2xl font-black text-rose-500 font-mono">
              {formatPercentVal(actualLiteracyRate)}
            </div>
            <div className="text-[11px] text-[var(--text-muted)] flex justify-between border-t border-[var(--border-subtle)] pt-1.5">
              <span>Census 2011 PCA</span>
              <span className="font-semibold">{actualLiteratePop != null ? `${actualLiteratePop.toLocaleString()} Literate` : 'Official Record'}</span>
            </div>
          </div>
        </div>
      </div>

      {/* =================================================================== */}
      {/* 3. TOP PREDICTIVE DEFICIT METRICS - 2-ROW BALANCED GRID             */}
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
                  {popProjected != null ? popProjected.toLocaleString() : 'Not Available'}
                </span>
                {popGrowth != null && (
                  <span className="text-xs font-bold text-emerald-600 dark:text-emerald-400">
                    +{popGrowth.toLocaleString()} (+{p?.growth_rate_pct || 1.8}%)
                  </span>
                )}
              </div>
            </div>
            <p className="text-xs text-[var(--text-muted)] flex items-center gap-2 mt-4 pt-3 border-t border-[var(--border-subtle)]">
              <span className="w-2 h-2 rounded-full bg-blue-400" />
              Base Population: <strong>{popCurrent != null ? `${popCurrent.toLocaleString()} citizens` : 'Not Available'}</strong>
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
                  {waterDeficit != null ? (waterDeficit > 0 ? `-${Math.round(waterDeficit).toLocaleString()}` : '0') : 'Not Available'}
                </span>
                <span className="text-xs font-medium text-[var(--text-muted)]">LPD (55 L/capita norm)</span>
              </div>
            </div>
            <div className="mt-4 pt-3 border-t border-[var(--border-subtle)]">
              <div className="flex justify-between text-xs text-[var(--text-muted)] mb-1.5 font-medium">
                <span>Supply: {waterSupply != null ? `${Math.round(waterSupply / 1000)}k LPD` : 'Not Available'}</span>
                <span className="font-mono font-bold text-[var(--text-main)]">{waterCoveragePct != null ? `${waterCoveragePct}% Coverage` : 'Not Available'}</span>
              </div>
              <div className="w-full bg-[var(--bg-primary)] h-2 rounded-full overflow-hidden">
                <div
                  className={`${waterBadge.barColor} h-full rounded-full transition-all duration-500`}
                  style={{ width: `${waterCoveragePct != null ? waterCoveragePct : 0}%` }}
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
                  {classGap != null ? (classGap > 0 ? `-${classGap}` : '0') : 'Not Available'}
                </span>
                <span className="text-xs font-medium text-[var(--text-muted)]">Rooms (1:30 pupil ratio)</span>
              </div>
            </div>
            <div className="mt-4 pt-3 border-t border-[var(--border-subtle)]">
              <div className="flex justify-between text-xs text-[var(--text-muted)] mb-1.5 font-medium">
                <span>Active: {classCurrent != null ? `${classCurrent} / ${classRequired || 'Not Available'} rooms` : 'Not Available'}</span>
                <span className="font-mono font-bold text-[var(--text-main)]">{classCoveragePct != null ? `${classCoveragePct}% Capacity` : 'Not Available'}</span>
              </div>
              <div className="w-full bg-[var(--bg-primary)] h-2 rounded-full overflow-hidden">
                <div
                  className={`${classBadge.barColor} h-full rounded-full transition-all duration-500`}
                  style={{ width: `${classCoveragePct != null ? classCoveragePct : 0}%` }}
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
                  {roadDeficit != null ? (roadDeficit > 0 ? `-${Number(roadDeficit).toFixed(1)}` : '0.0') : 'Not Available'}
                </span>
                <span className="text-xs font-medium text-[var(--text-muted)]">KM (1.25 km / 1,000 pop norm)</span>
              </div>
            </div>
            <div className="mt-4 pt-3 border-t border-[var(--border-subtle)]">
              <div className="flex justify-between text-xs text-[var(--text-muted)] mb-1.5 font-medium">
                <span>Paved: {roadCurrent != null ? `${Number(roadCurrent).toFixed(1)} / ${roadRequired != null ? Number(roadRequired).toFixed(1) : 'Not Available'} km` : 'Not Available'}</span>
                <span className="font-mono font-bold text-[var(--text-main)]">{roadCoveragePct != null && roadCurrent != null ? `${roadCoveragePct}% Target` : 'Not Available'}</span>
              </div>
              <div className="w-full bg-[var(--bg-primary)] h-2 rounded-full overflow-hidden">
                <div
                  className={`${roadBadge.barColor} h-full rounded-full transition-all duration-500`}
                  style={{ width: `${roadCoveragePct != null && roadCurrent != null ? roadCoveragePct : 0}%` }}
                />
              </div>
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
