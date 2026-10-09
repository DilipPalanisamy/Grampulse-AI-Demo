import React, {
  useState,
  useEffect,
  useMemo,
  useCallback,
} from 'react';

import {
  ArrowLeft,
  TrendingUp,
  Users,
  Droplets,
  GraduationCap,
  HeartPulse,
  Route,
  Wifi,
  Briefcase,
  School,
  Building2,
  Loader2,
  AlertTriangle,
  CheckCircle2,
  Database,
  MapPin,
  Sliders,
  Sparkles,
  RotateCcw,
  Edit3,
  RefreshCw,
  Zap,
  Calendar,
  Award,
  Info,
  Check,
  FileText,
  ChevronRight,
  Shield,
  Filter,
  Download,
} from 'lucide-react';

import {
  generateFuturePrediction,
  buildPredictionPayload,
} from '../services/futurePredictorApi';

import { generatePredictionPdf } from '../utils/predictionPdfGenerator';

/*
============================================================
FORMATTING HELPERS
============================================================
*/

function formatNumber(value) {
  if (value === null || value === undefined || Number.isNaN(Number(value))) {
    return '0';
  }
  return Number(value).toLocaleString();
}

function formatPercent(value) {
  if (value === null || value === undefined || Number.isNaN(Number(value))) {
    return '0%';
  }
  return `${Number(value).toFixed(1)}%`;
}

/*
============================================================
PRESET TEMPLATES FOR MANUAL VILLAGE PREDICTION
============================================================
*/

const MANUAL_PRESETS = [
  {
    id: 'agrarian',
    label: '🌾 Rural Agrarian Village',
    desc: 'Farming-based GP with moderate population and growing water needs',
    data: {
      village_name: 'Adarsh Agrarian Gram',
      district: 'Coimbatore',
      state: 'Tamil Nadu',
      current_year: 2026,
      population: 4800,
      households: 1200,
      birth_rate: 17.8,
      death_rate: 6.9,
      migration_rate: 0.5,
      schools: 2,
      school_students: 760,
      classrooms: 14,
      colleges: 0,
      hospitals: 1,
      road_length_km: 22.0,
      road_built_year: 2017,
      last_repair_year: 2022,
      road_condition: 'Average',
      water_coverage: 68.0,
      electricity_coverage: 96.0,
      internet_coverage: 48.0,
      employment_rate: 64.0,
    },
  },
  {
    id: 'periurban',
    label: '🏙️ Peri-Urban Emerging Town',
    desc: 'Fast-expanding peri-urban cluster with high migration and connectivity',
    data: {
      village_name: 'Navodaya Peri-Urban GP',
      district: 'Coimbatore',
      state: 'Tamil Nadu',
      current_year: 2026,
      population: 14200,
      households: 3550,
      birth_rate: 19.2,
      death_rate: 5.9,
      migration_rate: 4.8,
      schools: 4,
      school_students: 2350,
      classrooms: 36,
      colleges: 1,
      hospitals: 2,
      road_length_km: 45.0,
      road_built_year: 2019,
      last_repair_year: 2024,
      road_condition: 'Good',
      water_coverage: 84.0,
      electricity_coverage: 99.0,
      internet_coverage: 78.0,
      employment_rate: 72.0,
    },
  },
  {
    id: 'tribal',
    label: '🏔️ Hilly / Tribal Gram Panchayat',
    desc: 'Remote forest or hilly terrain requiring specialized road & water focus',
    data: {
      village_name: 'Malaiyur Tribal GP',
      district: 'Nilgiris',
      state: 'Tamil Nadu',
      current_year: 2026,
      population: 2900,
      households: 725,
      birth_rate: 21.0,
      death_rate: 7.8,
      migration_rate: -0.8,
      schools: 1,
      school_students: 450,
      classrooms: 8,
      colleges: 0,
      hospitals: 1,
      road_length_km: 14.5,
      road_built_year: 2015,
      last_repair_year: 2020,
      road_condition: 'Poor',
      water_coverage: 54.0,
      electricity_coverage: 91.0,
      internet_coverage: 36.0,
      employment_rate: 58.0,
    },
  },
];

/*
============================================================
KPI STAT CARD
============================================================
*/

function KpiCard({ icon: Icon, label, value, subtext, trend, color = 'emerald' }) {
  const colorMap = {
    emerald: 'text-emerald-400 bg-emerald-500/10 border-emerald-500/20',
    cyan: 'text-cyan-400 bg-cyan-500/10 border-cyan-500/20',
    amber: 'text-amber-400 bg-amber-500/10 border-amber-500/20',
    indigo: 'text-indigo-400 bg-indigo-500/10 border-indigo-500/20',
    blue: 'text-blue-400 bg-blue-500/10 border-blue-500/20',
  };

  const styleClass = colorMap[color] || colorMap.emerald;

  return (
    <div className="relative overflow-hidden rounded-2xl border border-[var(--border-subtle)] bg-[var(--bg-card)] p-5 shadow-lg transition-all duration-300 hover:scale-[1.01] hover:border-[var(--border-strong)]">
      <div className="flex items-start justify-between gap-3">
        <div className="space-y-1">
          <p className="text-[11px] font-bold uppercase tracking-wider text-[var(--text-muted)]">
            {label}
          </p>
          <p className="text-2xl sm:text-3xl font-black text-[var(--text-main)] tracking-tight">
            {value}
          </p>
        </div>
        <div className={`w-11 h-11 rounded-2xl flex items-center justify-center border shadow-inner ${styleClass}`}>
          <Icon className="w-5 h-5" />
        </div>
      </div>
      {(subtext || trend) && (
        <div className="mt-3 flex items-center justify-between gap-2 border-t border-[var(--border-subtle)] pt-2.5 text-xs text-[var(--text-muted)]">
          <span className="truncate">{subtext}</span>
          {trend && (
            <span className="font-bold text-emerald-400 shrink-0 bg-emerald-500/10 px-2 py-0.5 rounded-full border border-emerald-500/20">
              {trend}
            </span>
          )}
        </div>
      )}
    </div>
  );
}

/*
============================================================
AI SECTOR INTERVENTION & PRIORITY DECISION ENGINE
============================================================
Evaluates population demand vs. available supply across all
sectors (water, electricity, roads, schools, jobs, internet, health)
and decides whether the need is High, Moderate, or Low.
*/

function evaluateSectorInterventions(yearData) {
  const pop = Number(yearData.population) || 5800;
  const hh = Number(yearData.households) || Math.round(pop / 4);

  const water = yearData.water || {};
  const education = yearData.education || {};
  const healthcare = yearData.healthcare || {};
  const road = yearData.road || {};
  const coverage = yearData.service_coverage || {};
  const realEdu = yearData.real_udise_education || {};
  const futureNeed = realEdu.future_need || {};

  const waterCov = Number(water.coverage_percent ?? coverage.water ?? 70);
  const elecCov = Number(coverage.electricity ?? 95);
  const netCov = Number(coverage.internet ?? 50);
  const empRate = Number(coverage.employment ?? 65);

  const items = [];

  // 1. Electricity Grid
  const unpoweredHh = Math.round((hh * Math.max(0, 100 - elecCov)) / 100);
  if (elecCov < 80) {
    items.push({
      id: 'electricity',
      sector: 'Electricity Grid',
      icon: Zap,
      priority: 'High',
      needLabel: 'High Priority (Critical Shortfall)',
      coverage: elecCov,
      gap: 100 - elecCov,
      demandLabel: `${formatNumber(hh)} Households`,
      deficitLabel: `${formatNumber(unpoweredHh)} Unpowered Homes`,
      status: 'Critical Power Grid Deficit',
      reason: `Grid coverage is only ${formatPercent(elecCov)} (${formatPercent(100 - elecCov)} gap). ${formatNumber(unpoweredHh)} households lack electrical connection for domestic lighting, fans, and agricultural pump sets.`,
      recommendation: 'Immediate GPDP priority: Sanction 11kV rural feeder line expansion and install 250kVA distribution transformers under RDSS / PM-Surya Ghar solar rooftop scheme.',
      color: 'rose',
    });
  } else if (elecCov < 92) {
    items.push({
      id: 'electricity',
      sector: 'Electricity Grid',
      icon: Zap,
      priority: 'Medium',
      needLabel: 'Moderate Priority (Feeder Expansion)',
      coverage: elecCov,
      gap: 100 - elecCov,
      demandLabel: `${formatNumber(hh)} Households`,
      deficitLabel: `${formatNumber(unpoweredHh)} Homes to Connect`,
      status: 'Moderate Feeder Shortage',
      reason: `Grid coverage is ${formatPercent(elecCov)}. Minor low-voltage drops reported during agricultural peak pumping hours.`,
      recommendation: 'Moderate priority: Upgrade sub-station distribution lines and promote PM-KUSUM solar agricultural pump sets.',
      color: 'amber',
    });
  } else {
    items.push({
      id: 'electricity',
      sector: 'Electricity Grid',
      icon: Zap,
      priority: 'Low',
      needLabel: 'Low Priority (Adequate)',
      coverage: elecCov,
      gap: 100 - elecCov,
      demandLabel: `${formatNumber(hh)} Households`,
      deficitLabel: 'Grid Saturation Met',
      status: 'Adequate Grid Saturation',
      reason: `Grid coverage is ${formatPercent(elecCov)}. Electrical supply reliably meets population residential and commercial demand.`,
      recommendation: 'Low priority: Focus on routine pole maintenance, LED street lighting, and smart prepaid digital meters.',
      color: 'emerald',
    });
  }

  // 2. Tap Water Supply
  const waterDemand = Number(water.daily_demand_liters || Math.round(pop * 55));
  const uncoveredPop = Number(water.uncovered_population || Math.round((pop * Math.max(0, 100 - waterCov)) / 100));
  if (waterCov < 70) {
    items.push({
      id: 'water',
      sector: 'Tap Water Supply',
      icon: Droplets,
      priority: 'High',
      needLabel: 'High Priority (Critical Shortfall)',
      coverage: waterCov,
      gap: 100 - waterCov,
      demandLabel: `${formatNumber(waterDemand)} L / day`,
      deficitLabel: `${formatNumber(uncoveredPop)} Residents Uncovered`,
      status: 'Critical Potable Water Deficit',
      reason: `Tap water coverage is only ${formatPercent(waterCov)} (${formatPercent(100 - waterCov)} gap). ${formatNumber(uncoveredPop)} residents lack treated piped household water supply, risking health hazards and ground-water depletion.`,
      recommendation: 'High priority: Execute Jal Jeevan Mission functional household tap connections (FHTC), water purification units, and an additional 1,00,000L overhead water tank.',
      color: 'rose',
    });
  } else if (waterCov < 85) {
    items.push({
      id: 'water',
      sector: 'Tap Water Supply',
      icon: Droplets,
      priority: 'Medium',
      needLabel: 'Moderate Priority (JJM Saturation)',
      coverage: waterCov,
      gap: 100 - waterCov,
      demandLabel: `${formatNumber(waterDemand)} L / day`,
      deficitLabel: `${formatNumber(uncoveredPop)} Residents to Connect`,
      status: 'Moderate JJM Saturation Gap',
      reason: `Tap water coverage at ${formatPercent(waterCov)} with ${formatPercent(100 - waterCov)} gap towards 100% saturation.`,
      recommendation: 'Moderate priority: Extend distribution feeder pipelines to newly built peripheral habitations.',
      color: 'amber',
    });
  } else {
    items.push({
      id: 'water',
      sector: 'Tap Water Supply',
      icon: Droplets,
      priority: 'Low',
      needLabel: 'Low Priority (Adequate)',
      coverage: waterCov,
      gap: 100 - waterCov,
      demandLabel: `${formatNumber(waterDemand)} L / day`,
      deficitLabel: 'Adequate Potable Supply',
      status: 'Optimal Water Coverage',
      reason: `Coverage is ${formatPercent(waterCov)}. Safe drinking water is reliably available across all wards.`,
      recommendation: 'Low priority: Water quality testing with Field Test Kits (FTKs) and rainwater harvesting recharge pits.',
      color: 'emerald',
    });
  }

  // 3. Road Infrastructure & Risk
  const roadRisk = road.risk || 'Low';
  const repairYrs = road.years_since_repair || 3;
  const roadKm = road.current_road_km || 25;
  if (['High', 'Very High', 'Critical'].includes(roadRisk) || repairYrs >= 4) {
    items.push({
      id: 'road',
      sector: 'Road Infrastructure',
      icon: Route,
      priority: 'High',
      needLabel: 'High Priority (Critical Repair)',
      coverage: Math.max(10, 100 - (repairYrs * 15)),
      gap: Math.min(90, repairYrs * 15),
      demandLabel: `${roadKm} km Road Network`,
      deficitLabel: `${repairYrs} Yrs Unmaintained (${roadRisk})`,
      status: 'Critical Road Degradation',
      reason: `Road network is in ${roadRisk} condition (${repairYrs} years without major repair). Deteriorated pavement restricts emergency ambulance and agricultural transport.`,
      recommendation: 'High priority: Immediate PMGSY all-weather bitumen / concrete reconstruction, culvert repairs, and storm-water roadside pucca drain construction.',
      color: 'rose',
    });
  } else if (roadRisk === 'Medium' || repairYrs >= 2) {
    items.push({
      id: 'road',
      sector: 'Road Infrastructure',
      icon: Route,
      priority: 'Medium',
      needLabel: 'Moderate Priority (Maintenance)',
      coverage: 75,
      gap: 25,
      demandLabel: `${roadKm} km Road Network`,
      deficitLabel: `${repairYrs} Yrs Since Repair`,
      status: 'Preventative Resurfacing Needed',
      reason: `Moderate surface wear observed across main connecting corridors.`,
      recommendation: 'Moderate priority: Pothole patching and shoulder leveling before the monsoon season.',
      color: 'amber',
    });
  } else {
    items.push({
      id: 'road',
      sector: 'Road Infrastructure',
      icon: Route,
      priority: 'Low',
      needLabel: 'Low Priority (Adequate)',
      coverage: 95,
      gap: 5,
      demandLabel: `${roadKm} km Network`,
      deficitLabel: 'All-Weather Passable',
      status: 'Good Condition Network',
      reason: 'Roads are well-maintained and support regular passenger and freight movement.',
      recommendation: 'Low priority: Regular clearance of roadside vegetation and road signage renewal.',
      color: 'emerald',
    });
  }

  // 4. Education Capacity & Classrooms
  const students = Number(education.school_students || Math.round(pop * 0.16));
  const classNeeded = Number(futureNeed.required_classrooms || futureNeed.additional_classrooms_needed || (education.school_capacity_gap > 0 ? Math.ceil(education.school_capacity_gap / 30) : 0));
  const reqSchools = Number(education.required_schools || Math.max(1, Math.round(pop / 2000)));
  if (classNeeded > 5 || education.school_capacity_gap > 0) {
    items.push({
      id: 'education',
      sector: 'Education Capacity',
      icon: School,
      priority: 'High',
      needLabel: 'High Priority (Severe Shortage)',
      coverage: Math.max(20, Math.min(85, Math.round(100 - (classNeeded * 2)))),
      gap: Math.min(80, classNeeded * 2),
      demandLabel: `${formatNumber(students)} Students`,
      deficitLabel: `${formatNumber(classNeeded)} Classrooms Needed`,
      status: 'Severe Classroom Shortage',
      reason: `${formatNumber(students)} students require ${formatNumber(classNeeded)} additional classrooms and ${formatNumber(reqSchools)} schools. Extreme pupil-to-classroom crowding detected under UDISE+ norms.`,
      recommendation: 'High priority: Construct additional smart classrooms under Samagra Shiksha and recruit primary subject teachers.',
      color: 'rose',
    });
  } else if (classNeeded > 0) {
    items.push({
      id: 'education',
      sector: 'Education Capacity',
      icon: School,
      priority: 'Medium',
      needLabel: 'Moderate Priority (Addition)',
      coverage: 80,
      gap: 20,
      demandLabel: `${formatNumber(students)} Students`,
      deficitLabel: `${formatNumber(classNeeded)} Classrooms Needed`,
      status: 'Moderate Classroom Addition',
      reason: 'Classroom capacity is near peak utilization as cohort enrollment expands.',
      recommendation: 'Moderate priority: Sanction 2–4 additional classrooms and upgrade library learning materials.',
      color: 'amber',
    });
  } else {
    items.push({
      id: 'education',
      sector: 'Education Capacity',
      icon: School,
      priority: 'Low',
      needLabel: 'Low Priority (Adequate)',
      coverage: 95,
      gap: 5,
      demandLabel: `${formatNumber(students)} Students`,
      deficitLabel: 'Adequate Classroom Seating',
      status: 'Sufficient School Infrastructure',
      reason: 'Existing schools and classrooms comfortably accommodate enrolled student population.',
      recommendation: 'Low priority: Digital tablet labs and sports ground development.',
      color: 'emerald',
    });
  }

  // 5. Rural Employment & Livelihood
  const unempGap = 100 - empRate;
  if (empRate < 50) {
    items.push({
      id: 'employment',
      sector: 'Rural Employment & Livelihoods',
      icon: Briefcase,
      priority: 'High',
      needLabel: 'High Priority (Severe Job Deficit)',
      coverage: empRate,
      gap: unempGap,
      demandLabel: `${formatPercent(empRate)} Employed`,
      deficitLabel: `${formatPercent(unempGap)} Livelihood Shortfall`,
      status: 'Critical Unemployment Deficit',
      reason: `Employment rate is critically low at ${formatPercent(empRate)} (${formatPercent(unempGap)} workforce shortfall), causing economic distress and outward distress migration.`,
      recommendation: 'High priority: Guarantee 100–150 days of MGNREGA rural wage work, build village storage warehouses, and support SHG agro-processing clusters.',
      color: 'rose',
    });
  } else if (empRate < 70) {
    items.push({
      id: 'employment',
      sector: 'Rural Employment & Livelihoods',
      icon: Briefcase,
      priority: 'Medium',
      needLabel: 'Moderate Priority (Livelihood)',
      coverage: empRate,
      gap: unempGap,
      demandLabel: `${formatPercent(empRate)} Employed`,
      deficitLabel: `${formatPercent(unempGap)} Livelihood Gap`,
      status: 'Moderate Employment Need',
      reason: `Working-age employment is at ${formatPercent(empRate)}. Need supplementary non-farm livelihood opportunities.`,
      recommendation: 'Moderate priority: Skill development training and PM Formalisation of Micro Food Processing Enterprises (PMFME).',
      color: 'amber',
    });
  } else {
    items.push({
      id: 'employment',
      sector: 'Rural Employment & Livelihoods',
      icon: Briefcase,
      priority: 'Low',
      needLabel: 'Low Priority (Adequate)',
      coverage: empRate,
      gap: unempGap,
      demandLabel: `${formatPercent(empRate)} Employed`,
      deficitLabel: 'Healthy Workforce',
      status: 'Stable Employment Saturation',
      reason: 'Workforce participation and agrarian economic activities are robust.',
      recommendation: 'Low priority: Promote farmer-producer organizations (FPOs) and digital market linkages.',
      color: 'emerald',
    });
  }

  // 6. Digital Connectivity & Broadband
  const netGap = 100 - netCov;
  const offlinePop = Math.round((pop * netGap) / 100);
  if (netCov < 50) {
    items.push({
      id: 'internet',
      sector: 'Digital Connectivity & Broadband',
      icon: Wifi,
      priority: 'High',
      needLabel: 'High Priority (Severe Divide)',
      coverage: netCov,
      gap: netGap,
      demandLabel: `${formatPercent(netCov)} Connected`,
      deficitLabel: `${formatNumber(offlinePop)} Residents Offline`,
      status: 'Severe Digital Divide',
      reason: `Internet coverage is only ${formatPercent(netCov)} (${formatNumber(offlinePop)} residents offline). Limits direct benefit transfers (DBT), e-panchayat services, and digital education.`,
      recommendation: 'High priority: Fast-track BharatNet optical fiber last-mile WiFi rollout and establish a 24x7 Common Services Center (CSC).',
      color: 'rose',
    });
  } else if (netCov < 75) {
    items.push({
      id: 'internet',
      sector: 'Digital Connectivity & Broadband',
      icon: Wifi,
      priority: 'Medium',
      needLabel: 'Moderate Priority (Expansion)',
      coverage: netCov,
      gap: netGap,
      demandLabel: `${formatPercent(netCov)} Connected`,
      deficitLabel: `${formatNumber(offlinePop)} Offline`,
      status: 'Moderate Digital Gap',
      reason: `Internet penetration is ${formatPercent(netCov)}. 4G mobile signal fluctuates in outer habitations.`,
      recommendation: 'Moderate priority: Erect 4G/5G mobile tower repeater and provide high-speed broadband to Panchayat office.',
      color: 'amber',
    });
  } else {
    items.push({
      id: 'internet',
      sector: 'Digital Connectivity & Broadband',
      icon: Wifi,
      priority: 'Low',
      needLabel: 'Low Priority (Adequate)',
      coverage: netCov,
      gap: netGap,
      demandLabel: `${formatPercent(netCov)} Connected`,
      deficitLabel: 'High Connectivity',
      status: 'Sufficient Broadband Access',
      reason: 'High-speed internet access is widely available across the Gram Panchayat.',
      recommendation: 'Low priority: Digital literacy campaigns and cyber-safety awareness workshops.',
      color: 'emerald',
    });
  }

  // 7. Healthcare & PHCs
  const hospGap = Number(healthcare.hospital_gap || 0);
  const currentHosp = Number(healthcare.current_hospitals || 1);
  const reqHosp = Number(healthcare.required_hospitals || Math.max(1, Math.round(pop / 5000)));
  if (hospGap > 0) {
    items.push({
      id: 'healthcare',
      sector: 'Healthcare & Primary Health',
      icon: HeartPulse,
      priority: 'High',
      needLabel: 'High Priority (PHC Deficit)',
      coverage: Math.max(20, Math.round((currentHosp / reqHosp) * 100)),
      gap: Math.max(10, 100 - Math.round((currentHosp / reqHosp) * 100)),
      demandLabel: `${formatNumber(reqHosp)} Required PHCs`,
      deficitLabel: `${hospGap} Facility Deficit`,
      status: 'Primary Health Center Deficit',
      reason: `Deficit of ${hospGap} primary health center(s) for ${formatNumber(pop)} residents. Residents travel excessive distances for emergency treatment.`,
      recommendation: 'High priority: Sanction 1 new 24/7 Primary Health Center (PHC) with 4 inpatient beds and emergency ambulance service.',
      color: 'rose',
    });
  } else {
    items.push({
      id: 'healthcare',
      sector: 'Healthcare & Primary Health',
      icon: HeartPulse,
      priority: 'Low',
      needLabel: 'Low Priority (Adequate)',
      coverage: 100,
      gap: 0,
      demandLabel: `${currentHosp} Available Facilities`,
      deficitLabel: 'Capacity Adequate',
      status: 'Adequate Healthcare Coverage',
      reason: `${currentHosp} healthcare facility/facilities comfortably cover ${formatNumber(pop)} residents with adequate capacity headroom.`,
      recommendation: 'Low priority: Maintain regular supply of essential maternal & child medicines and conduct monthly mobile health camps.',
      color: 'emerald',
    });
  }

  const priorityOrder = { High: 1, Medium: 2, Low: 3 };
  items.sort((a, b) => priorityOrder[a.priority] - priorityOrder[b.priority]);
  return items;
}

/*
============================================================
YEAR INTERVENTIONS & UTILITY SATURATION COMPONENT
============================================================
*/

function YearInterventionsView({ yearData }) {
  const [filterPriority, setFilterPriority] = useState('all');

  const interventions = useMemo(() => {
    return evaluateSectorInterventions(yearData);
  }, [yearData]);

  const highCount = interventions.filter((i) => i.priority === 'High').length;
  const medCount = interventions.filter((i) => i.priority === 'Medium').length;
  const lowCount = interventions.filter((i) => i.priority === 'Low').length;

  const filteredInterventions = useMemo(() => {
    if (filterPriority === 'all') return interventions;
    return interventions.filter((i) => i.priority === filterPriority);
  }, [interventions, filterPriority]);

  const waterIntervention = interventions.find((i) => i.id === 'water');
  const elecIntervention = interventions.find((i) => i.id === 'electricity');
  const netIntervention = interventions.find((i) => i.id === 'internet');
  const empIntervention = interventions.find((i) => i.id === 'employment');

  return (
    <div className="space-y-5 px-6 pb-6">
      {/* 1. PROJECTED UTILITY COVERAGE WITH AI NEED DECISIONS */}
      <div className="p-5 rounded-2xl bg-[var(--bg-primary)] border border-[var(--border-subtle)] space-y-4">
        <div className="flex flex-wrap items-center justify-between gap-2 border-b border-[var(--border-subtle)] pb-3">
          <div className="flex items-center gap-2">
            <Zap className="w-4 h-4 text-emerald-400" />
            <h4 className="text-xs font-black uppercase tracking-wider text-[var(--text-main)]">
              Projected Public Utility Coverage Saturation ({yearData.year})
            </h4>
          </div>
          <span className="text-[10px] font-bold text-emerald-400 bg-emerald-500/10 px-2.5 py-0.5 rounded-full border border-emerald-500/20">
            AI Automated Need Assessment
          </span>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {/* TAP WATER */}
          <div className="p-3.5 rounded-xl bg-[var(--bg-card)] border border-[var(--border-subtle)] space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-[var(--text-muted)] flex items-center gap-1.5">
                <Droplets className="w-3.5 h-3.5 text-blue-400" />
                Tap Water
              </span>
              <span className="text-xs font-black text-blue-400">
                {formatPercent(yearData.service_coverage?.water ?? yearData.water?.coverage_percent)}
              </span>
            </div>
            <div className="w-full bg-[var(--bg-primary)] h-2 rounded-full overflow-hidden border border-[var(--border-subtle)]">
              <div
                className={`h-full rounded-full transition-all duration-500 ${
                  waterIntervention?.priority === 'High'
                    ? 'bg-rose-500'
                    : waterIntervention?.priority === 'Medium'
                    ? 'bg-amber-500'
                    : 'bg-blue-500'
                }`}
                style={{ width: `${Math.min(100, Number(yearData.service_coverage?.water ?? yearData.water?.coverage_percent) || 70)}%` }}
              />
            </div>
            <div className="flex items-center justify-between pt-1">
              <span
                className={`text-[9.5px] font-bold px-2 py-0.5 rounded-full ${
                  waterIntervention?.priority === 'High'
                    ? 'bg-rose-500/15 text-rose-300 border border-rose-500/30'
                    : waterIntervention?.priority === 'Medium'
                    ? 'bg-amber-500/15 text-amber-300 border border-amber-500/30'
                    : 'bg-emerald-500/15 text-emerald-300 border border-emerald-500/30'
                }`}
              >
                {waterIntervention?.priority === 'High'
                  ? '🔴 High Priority'
                  : waterIntervention?.priority === 'Medium'
                  ? '🟡 Moderate Need'
                  : '🟢 Low / Adequate'}
              </span>
              <span className="text-[10px] text-[var(--text-muted)] truncate max-w-[120px]">
                {waterIntervention?.deficitLabel || 'Demand: 55L/day'}
              </span>
            </div>
          </div>

          {/* ELECTRICITY GRID */}
          <div className="p-3.5 rounded-xl bg-[var(--bg-card)] border border-[var(--border-subtle)] space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-[var(--text-muted)] flex items-center gap-1.5">
                <Zap className="w-3.5 h-3.5 text-amber-400" />
                Electricity Grid
              </span>
              <span className="text-xs font-black text-amber-400">
                {formatPercent(yearData.service_coverage?.electricity)}
              </span>
            </div>
            <div className="w-full bg-[var(--bg-primary)] h-2 rounded-full overflow-hidden border border-[var(--border-subtle)]">
              <div
                className={`h-full rounded-full transition-all duration-500 ${
                  elecIntervention?.priority === 'High'
                    ? 'bg-rose-500'
                    : elecIntervention?.priority === 'Medium'
                    ? 'bg-amber-500'
                    : 'bg-emerald-500'
                }`}
                style={{ width: `${Math.min(100, Number(yearData.service_coverage?.electricity) || 95)}%` }}
              />
            </div>
            <div className="flex items-center justify-between pt-1">
              <span
                className={`text-[9.5px] font-bold px-2 py-0.5 rounded-full ${
                  elecIntervention?.priority === 'High'
                    ? 'bg-rose-500/15 text-rose-300 border border-rose-500/30'
                    : elecIntervention?.priority === 'Medium'
                    ? 'bg-amber-500/15 text-amber-300 border border-amber-500/30'
                    : 'bg-emerald-500/15 text-emerald-300 border border-emerald-500/30'
                }`}
              >
                {elecIntervention?.priority === 'High'
                  ? '🔴 High Priority'
                  : elecIntervention?.priority === 'Medium'
                  ? '🟡 Moderate Need'
                  : '🟢 Low / Adequate'}
              </span>
              <span className="text-[10px] text-[var(--text-muted)] truncate max-w-[120px]">
                {elecIntervention?.deficitLabel || 'Grid Supply'}
              </span>
            </div>
          </div>

          {/* BROADBAND INTERNET */}
          <div className="p-3.5 rounded-xl bg-[var(--bg-card)] border border-[var(--border-subtle)] space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-[var(--text-muted)] flex items-center gap-1.5">
                <Wifi className="w-3.5 h-3.5 text-purple-400" />
                Broadband Internet
              </span>
              <span className="text-xs font-black text-purple-400">
                {formatPercent(yearData.service_coverage?.internet)}
              </span>
            </div>
            <div className="w-full bg-[var(--bg-primary)] h-2 rounded-full overflow-hidden border border-[var(--border-subtle)]">
              <div
                className={`h-full rounded-full transition-all duration-500 ${
                  netIntervention?.priority === 'High'
                    ? 'bg-rose-500'
                    : netIntervention?.priority === 'Medium'
                    ? 'bg-amber-500'
                    : 'bg-purple-500'
                }`}
                style={{ width: `${Math.min(100, Number(yearData.service_coverage?.internet) || 50)}%` }}
              />
            </div>
            <div className="flex items-center justify-between pt-1">
              <span
                className={`text-[9.5px] font-bold px-2 py-0.5 rounded-full ${
                  netIntervention?.priority === 'High'
                    ? 'bg-rose-500/15 text-rose-300 border border-rose-500/30'
                    : netIntervention?.priority === 'Medium'
                    ? 'bg-amber-500/15 text-amber-300 border border-amber-500/30'
                    : 'bg-emerald-500/15 text-emerald-300 border border-emerald-500/30'
                }`}
              >
                {netIntervention?.priority === 'High'
                  ? '🔴 High Priority'
                  : netIntervention?.priority === 'Medium'
                  ? '🟡 Moderate Need'
                  : '🟢 Low / Adequate'}
              </span>
              <span className="text-[10px] text-[var(--text-muted)] truncate max-w-[120px]">
                {netIntervention?.deficitLabel || 'Digital Access'}
              </span>
            </div>
          </div>

          {/* EMPLOYMENT RATE */}
          <div className="p-3.5 rounded-xl bg-[var(--bg-card)] border border-[var(--border-subtle)] space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-[var(--text-muted)] flex items-center gap-1.5">
                <Briefcase className="w-3.5 h-3.5 text-emerald-400" />
                Employment Rate
              </span>
              <span className="text-xs font-black text-emerald-400">
                {formatPercent(yearData.service_coverage?.employment)}
              </span>
            </div>
            <div className="w-full bg-[var(--bg-primary)] h-2 rounded-full overflow-hidden border border-[var(--border-subtle)]">
              <div
                className={`h-full rounded-full transition-all duration-500 ${
                  empIntervention?.priority === 'High'
                    ? 'bg-rose-500'
                    : empIntervention?.priority === 'Medium'
                    ? 'bg-amber-500'
                    : 'bg-emerald-500'
                }`}
                style={{ width: `${Math.min(100, Number(yearData.service_coverage?.employment) || 65)}%` }}
              />
            </div>
            <div className="flex items-center justify-between pt-1">
              <span
                className={`text-[9.5px] font-bold px-2 py-0.5 rounded-full ${
                  empIntervention?.priority === 'High'
                    ? 'bg-rose-500/15 text-rose-300 border border-rose-500/30'
                    : empIntervention?.priority === 'Medium'
                    ? 'bg-amber-500/15 text-amber-300 border border-amber-500/30'
                    : 'bg-emerald-500/15 text-emerald-300 border border-emerald-500/30'
                }`}
              >
                {empIntervention?.priority === 'High'
                  ? '🔴 High Priority'
                  : empIntervention?.priority === 'Medium'
                  ? '🟡 Moderate Need'
                  : '🟢 Low / Adequate'}
              </span>
              <span className="text-[10px] text-[var(--text-muted)] truncate max-w-[120px]">
                {empIntervention?.deficitLabel || 'Livelihood Base'}
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* 2. AI PREDICTED PRIORITY INTERVENTIONS (DECISION MATRIX) */}
      <div className="rounded-2xl border border-[var(--border-subtle)] bg-[var(--bg-primary)] p-5 space-y-4">
        <div className="flex flex-wrap items-center justify-between gap-3 border-b border-[var(--border-subtle)] pb-3">
          <div>
            <div className="flex items-center gap-2">
              <Shield className="w-4 h-4 text-amber-400" />
              <h4 className="text-sm font-black text-[var(--text-main)]">
                AI Priority Interventions & Resource Allocation ({yearData.year})
              </h4>
            </div>
            <p className="text-[11px] text-[var(--text-muted)] mt-0.5">
              The AI evaluated population demand vs. available capacity and decided priority levels (High vs. Moderate vs. Low):
            </p>
          </div>

          {/* Filter Pills */}
          <div className="flex flex-wrap items-center gap-1.5 bg-[var(--bg-card)] p-1 rounded-xl border border-[var(--border-subtle)]">
            <button
              type="button"
              onClick={() => setFilterPriority('all')}
              className={`px-2.5 py-1 rounded-lg text-[11px] font-bold transition-all cursor-pointer ${
                filterPriority === 'all'
                  ? 'bg-emerald-500 text-white shadow-sm'
                  : 'text-[var(--text-muted)] hover:text-white'
              }`}
            >
              All ({interventions.length})
            </button>
            <button
              type="button"
              onClick={() => setFilterPriority('High')}
              className={`px-2.5 py-1 rounded-lg text-[11px] font-bold transition-all cursor-pointer ${
                filterPriority === 'High'
                  ? 'bg-rose-500 text-white shadow-sm'
                  : 'text-rose-400/80 hover:text-rose-300'
              }`}
            >
              🔴 High ({highCount})
            </button>
            <button
              type="button"
              onClick={() => setFilterPriority('Medium')}
              className={`px-2.5 py-1 rounded-lg text-[11px] font-bold transition-all cursor-pointer ${
                filterPriority === 'Medium'
                  ? 'bg-amber-500 text-white shadow-sm'
                  : 'text-amber-400/80 hover:text-amber-300'
              }`}
            >
              🟡 Moderate ({medCount})
            </button>
            <button
              type="button"
              onClick={() => setFilterPriority('Low')}
              className={`px-2.5 py-1 rounded-lg text-[11px] font-bold transition-all cursor-pointer ${
                filterPriority === 'Low'
                  ? 'bg-emerald-600 text-white shadow-sm'
                  : 'text-emerald-400/80 hover:text-emerald-300'
              }`}
            >
              🟢 Adequate ({lowCount})
            </button>
          </div>
        </div>

        {/* Interventions Cards Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3.5">
          {filteredInterventions.map((item) => {
            const Icon = item.icon;
            const isHigh = item.priority === 'High';
            const isMed = item.priority === 'Medium';

            const cardBorder = isHigh
              ? 'border-rose-500/30 hover:border-rose-400/50 bg-gradient-to-br from-rose-950/20 via-[var(--bg-card)] to-transparent'
              : isMed
              ? 'border-amber-500/30 hover:border-amber-400/50 bg-gradient-to-br from-amber-950/20 via-[var(--bg-card)] to-transparent'
              : 'border-emerald-500/20 hover:border-emerald-500/40 bg-[var(--bg-card)]';

            const badgeColor = isHigh
              ? 'bg-rose-500/20 text-rose-300 border-rose-500/40'
              : isMed
              ? 'bg-amber-500/20 text-amber-300 border-amber-500/40'
              : 'bg-emerald-500/20 text-emerald-300 border-emerald-500/40';

            return (
              <div
                key={item.id}
                className={`p-4 rounded-2xl border ${cardBorder} transition-all duration-200 space-y-2.5`}
              >
                <div className="flex items-start justify-between gap-3">
                  <div className="flex items-center gap-2.5">
                    <div
                      className={`w-8 h-8 rounded-xl flex items-center justify-center border ${
                        isHigh
                          ? 'bg-rose-500/20 border-rose-500/40 text-rose-400'
                          : isMed
                          ? 'bg-amber-500/20 border-amber-500/40 text-amber-400'
                          : 'bg-emerald-500/20 border-emerald-500/40 text-emerald-400'
                      }`}
                    >
                      <Icon className="w-4 h-4" />
                    </div>
                    <div>
                      <h5 className="text-xs font-black text-[var(--text-main)]">{item.sector}</h5>
                      <span className="text-[10px] text-[var(--text-muted)]">{item.status}</span>
                    </div>
                  </div>

                  <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-black uppercase tracking-wider border shadow-sm ${badgeColor}`}>
                    {isHigh ? '🔴 High Priority' : isMed ? '🟡 Moderate Need' : '🟢 Low / Adequate'}
                  </span>
                </div>

                {/* Key Metrics Chips */}
                <div className="flex flex-wrap items-center gap-2 text-[10px]">
                  <span className="px-2 py-0.5 rounded-md bg-[var(--bg-primary)] border border-[var(--border-subtle)] font-medium text-[var(--text-muted)]">
                    Demand: <strong className="text-[var(--text-main)] font-bold">{item.demandLabel}</strong>
                  </span>
                  <span
                    className={`px-2 py-0.5 rounded-md border font-bold ${
                      isHigh
                        ? 'bg-rose-500/10 text-rose-300 border-rose-500/20'
                        : isMed
                        ? 'bg-amber-500/10 text-amber-300 border-amber-500/20'
                        : 'bg-emerald-500/10 text-emerald-300 border-emerald-500/20'
                    }`}
                  >
                    Gap: {item.deficitLabel}
                  </span>
                </div>

                {/* Reasoning & Recommendation */}
                <p className="text-[11px] text-[var(--text-muted)] leading-relaxed">
                  {item.reason}
                </p>

                <div className="pt-2 border-t border-[var(--border-subtle)] text-[10.5px] text-[var(--text-main)] flex items-start gap-1.5">
                  <span className="font-bold text-emerald-400 shrink-0">GPDP Action:</span>
                  <span className="text-[var(--text-muted)]">{item.recommendation}</span>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}

/*
============================================================
PREDICTION REPORT VIEW (SUPERB & ATTRACTIVE 5-YEAR DISPLAY)
============================================================
*/

function PredictionReportView({
  predictionData,
  modeTitle,
  modeSubtitle,
  isManual = false,
  onModifyManual,
  onRefresh,
}) {
  const [selectedYearTab, setSelectedYearTab] = useState('all');
  const [downloadingYear, setDownloadingYear] = useState(null);

  const summary = predictionData?.predictions?.summary || {};
  const years = predictionData?.predictions?.years || [];
  const currentUdise = predictionData?.current_udise || {};
  const infrastructureData = currentUdise?.infrastructure || {};

  const filteredYears = useMemo(() => {
    if (selectedYearTab === 'all') {
      return years;
    }
    return years.filter((y) => String(y.year) === String(selectedYearTab));
  }, [years, selectedYearTab]);

  // Overall final development score
  const finalYearData = years[years.length - 1] || {};
  const finalDevScore = finalYearData?.development?.development_score ?? 85.0;

  const handleDownloadPdf = useCallback(
    async (yearToDownload = 'all') => {
      try {
        setDownloadingYear(yearToDownload);
        await new Promise((resolve) => setTimeout(resolve, 150));
        generatePredictionPdf({
          predictionData,
          targetYear: yearToDownload,
          villageName: predictionData?.village,
          district: predictionData?.district,
          state: predictionData?.state,
        });
      } catch (err) {
        console.error('Error downloading prediction PDF:', err);
      } finally {
        setDownloadingYear(null);
      }
    },
    [predictionData]
  );

  return (
    <div className="space-y-8 animate-fadeIn">
      {/* ====================================================
          REPORT HERO BANNER
      ==================================================== */}
      <div className="relative overflow-hidden rounded-3xl border border-emerald-500/30 bg-gradient-to-br from-emerald-950/40 via-[var(--bg-card)] to-teal-950/30 p-6 sm:p-8 shadow-2xl backdrop-blur-xl">
        <div className="absolute top-0 right-0 -mr-16 -mt-16 w-64 h-64 rounded-full bg-emerald-500/10 blur-3xl pointer-events-none" />

        <div className="relative flex flex-wrap items-center justify-between gap-6">
          <div className="space-y-2 max-w-2xl">
            <div className="flex flex-wrap items-center gap-2">
              <span className="px-3 py-1 rounded-full text-[11px] font-black uppercase tracking-wider bg-emerald-500/20 text-emerald-300 border border-emerald-500/40 flex items-center gap-1.5 shadow-sm">
                <Sparkles className="w-3.5 h-3.5" />
                {isManual ? 'Custom Simulation Forecast' : 'Live GIS & UDISE+ Telemetry'}
              </span>
              <span className="px-3 py-1 rounded-full text-[11px] font-bold bg-[var(--bg-primary)] text-[var(--text-muted)] border border-[var(--border-subtle)] flex items-center gap-1.5">
                <Calendar className="w-3.5 h-3.5 text-emerald-400" />
                Horizon: 2027 – 2031 (5 Years)
              </span>
            </div>

            <h2 className="text-2xl sm:text-4xl font-black text-[var(--text-main)] tracking-tight">
              {predictionData?.village || 'Gram Panchayat Forecast'}
            </h2>
            <p className="text-sm text-[var(--text-muted)] font-medium leading-relaxed">
              {modeSubtitle ||
                'Year-by-year demographic cohort projection, infrastructure deficit forecasting, and service saturation model.'}
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-3">
            {/* COLORFUL PDF DOWNLOADER BUTTON */}
            <button
              type="button"
              onClick={() => handleDownloadPdf('all')}
              disabled={downloadingYear !== null}
              className="px-4 py-2.5 rounded-xl bg-gradient-to-r from-rose-600 via-pink-600 to-amber-500 hover:from-rose-500 hover:to-amber-400 text-white text-xs sm:text-sm font-black flex items-center gap-2 shadow-xl shadow-rose-950/60 ring-2 ring-rose-400/40 transition-all hover:scale-105 active:scale-95 cursor-pointer disabled:opacity-60 disabled:cursor-wait"
              title="Directly download official 5-year future prediction PDF report alone"
            >
              {downloadingYear === 'all' ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin text-white" />
                  <span>Downloading 5-Year PDF...</span>
                </>
              ) : (
                <>
                  <Download className="w-4 h-4 text-white" />
                  <span>Download 5-Year Prediction PDF</span>
                </>
              )}
            </button>

            {isManual && onModifyManual && (
              <button
                type="button"
                onClick={onModifyManual}
                className="px-4 py-2.5 rounded-xl bg-[var(--bg-primary)] hover:bg-[var(--bg-card-hover)] border border-teal-500/40 hover:border-teal-400 text-teal-300 text-xs sm:text-sm font-bold flex items-center gap-2 shadow-md transition-all active:scale-95 cursor-pointer"
              >
                <Edit3 className="w-4 h-4" />
                <span>Modify Input Fields</span>
              </button>
            )}

            {onRefresh && (
              <button
                type="button"
                onClick={onRefresh}
                className="px-4 py-2.5 rounded-xl bg-gradient-to-r from-emerald-600 to-teal-500 hover:from-emerald-500 hover:to-teal-400 text-white text-xs sm:text-sm font-bold flex items-center gap-2 shadow-lg shadow-emerald-950/50 transition-all active:scale-95 cursor-pointer"
              >
                <RefreshCw className="w-4 h-4" />
                <span>Recalculate</span>
              </button>
            )}
          </div>
        </div>

        {/* ====================================================
            EXECUTIVE KPI ROW
        ==================================================== */}
        <div className="mt-8 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <KpiCard
            icon={Users}
            label="Population Trajectory"
            value={formatNumber(summary.final_population || finalYearData.population)}
            subtext={`Base (${summary.base_year || 2026}): ${formatNumber(summary.base_population)}`}
            trend={`+${formatPercent(summary.population_change_percent)} net`}
            color="emerald"
          />

          <KpiCard
            icon={TrendingUp}
            label="Projected GDI Index"
            value={formatPercent(finalDevScore)}
            subtext="Gram Development Index"
            trend={finalDevScore >= 80 ? '🌟 High Growth' : '📈 Advancing'}
            color="cyan"
          />

          <KpiCard
            icon={Droplets}
            label="Daily Water Demand"
            value={`${formatNumber(finalYearData?.water?.daily_demand_liters || 0)} L`}
            subtext={`Year 5 Coverage: ${formatPercent(finalYearData?.water?.coverage_percent)}`}
            trend="Target JJM Saturation"
            color="blue"
          />

          <KpiCard
            icon={GraduationCap}
            label="Required Schools"
            value={formatNumber(finalYearData?.education?.required_schools || 1)}
            subtext={`Students: ${formatNumber(finalYearData?.education?.school_students || 0)}`}
            trend="UDISE+ Standard"
            color="amber"
          />
        </div>
      </div>

      {/* ====================================================
          YEAR SELECTOR TAB BAR
      ==================================================== */}
      <div className="flex flex-wrap items-center justify-between gap-4 border-b border-[var(--border-subtle)] pb-4">
        <div>
          <h3 className="text-lg font-black text-[var(--text-main)] flex items-center gap-2">
            <Calendar className="w-5 h-5 text-emerald-400" />
            <span>Forecast Timeline Horizon</span>
          </h3>
          <p className="text-xs text-[var(--text-muted)]">
            Explore overall 5-year progression or inspect any specific target year:
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2.5">
          <div className="flex flex-wrap items-center gap-2 bg-[var(--bg-primary)] p-1.5 rounded-2xl border border-[var(--border-subtle)]">
            <button
              type="button"
              onClick={() => setSelectedYearTab('all')}
              className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                selectedYearTab === 'all'
                  ? 'bg-gradient-to-r from-emerald-600 to-teal-500 text-white shadow-md'
                  : 'text-[var(--text-muted)] hover:text-[var(--text-main)]'
              }`}
            >
              📊 All 5 Years
            </button>
            {years.map((y) => (
              <button
                key={y.year}
                type="button"
                onClick={() => setSelectedYearTab(String(y.year))}
                className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                  String(selectedYearTab) === String(y.year)
                    ? 'bg-gradient-to-r from-emerald-600 to-teal-500 text-white shadow-md'
                    : 'text-[var(--text-muted)] hover:text-[var(--text-main)]'
                }`}
              >
                {y.year} (Yr {y.year_number})
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* ====================================================
          YEAR-BY-YEAR DETAILED CARDS
      ==================================================== */}
      <div className="space-y-6">
        {filteredYears.map((yearData) => {
          const water = yearData.water || {};
          const education = yearData.education || {};
          const healthcare = yearData.healthcare || {};
          const road = yearData.road || {};
          const dev = yearData.development || {};
          const coverage = yearData.service_coverage || {};
          const realEdu = yearData.real_udise_education || {};
          const futureNeed = realEdu.future_need || {};

          return (
            <div
              key={yearData.year}
              className="rounded-3xl border border-[var(--border-subtle)] bg-[var(--bg-card)] overflow-hidden shadow-xl transition-all duration-300 hover:border-emerald-500/30"
            >
              {/* Year Card Header */}
              <div className="p-6 bg-gradient-to-r from-emerald-950/20 via-[var(--bg-card-hover)] to-transparent border-b border-[var(--border-subtle)] flex flex-wrap items-center justify-between gap-4">
                <div className="flex items-center gap-4">
                  <div className="w-12 h-12 rounded-2xl bg-gradient-to-tr from-emerald-600 to-teal-400 flex flex-col items-center justify-center text-white font-black shadow-lg shadow-emerald-950/40">
                    <span className="text-[10px] tracking-wider uppercase font-bold text-emerald-100">
                      Year
                    </span>
                    <span className="text-base leading-none">{yearData.year_number}</span>
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <h3 className="text-2xl font-black text-[var(--text-main)]">{yearData.year}</h3>
                      <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                        {dev.development_level || 'Advancing'} Level
                      </span>
                    </div>
                    <p className="text-xs text-[var(--text-muted)] mt-0.5">
                      Target population: <strong className="text-emerald-300 font-bold">{formatNumber(yearData.population)}</strong> residents ({formatNumber(yearData.households)} households)
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-3 sm:gap-5 text-right">
                  <div>
                    <p className="text-[11px] text-[var(--text-muted)] uppercase tracking-wider font-semibold">
                      Composite GDI Score
                    </p>
                    <p className="text-2xl font-black text-emerald-400">
                      {formatPercent(dev.development_score)}
                    </p>
                  </div>

                  {/* Individual Year Colorful PDF Downloader */}
                  <button
                    type="button"
                    onClick={() => handleDownloadPdf(yearData.year)}
                    disabled={downloadingYear !== null}
                    className="px-3 py-2 rounded-xl bg-gradient-to-r from-rose-600/20 via-pink-600/20 to-rose-600/30 hover:from-rose-600 hover:to-pink-600 text-rose-300 hover:text-white border border-rose-500/40 hover:border-rose-400 text-xs font-bold flex items-center gap-1.5 shadow-sm transition-all hover:scale-105 active:scale-95 cursor-pointer disabled:opacity-50"
                    title={`Download colorful official PDF report for Year ${yearData.year}`}
                  >
                    {downloadingYear === yearData.year ? (
                      <Loader2 className="w-3.5 h-3.5 animate-spin" />
                    ) : (
                      <Download className="w-3.5 h-3.5" />
                    )}
                    <span>Download {yearData.year} PDF</span>
                  </button>
                </div>
              </div>

              {/* Card Body - Grid of 4 Core Pillars */}
              <div className="p-6 grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-5">
                {/* 1. WATER SUPPLY */}
                <div className="p-4 rounded-2xl bg-[var(--bg-primary)] border border-[var(--border-subtle)] flex flex-col justify-between space-y-3">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2 text-blue-400 font-bold text-xs uppercase tracking-wider">
                      <Droplets className="w-4 h-4" />
                      <span>Water Security</span>
                    </div>
                    <span className="text-xs font-bold text-blue-300">
                      {formatPercent(water.coverage_percent)}
                    </span>
                  </div>

                  <div className="space-y-1.5">
                    <div className="w-full bg-[var(--bg-card)] h-2 rounded-full overflow-hidden border border-[var(--border-subtle)]">
                      <div
                        className="h-full bg-gradient-to-r from-blue-500 to-cyan-400 rounded-full transition-all duration-500"
                        style={{ width: `${Math.min(100, Number(water.coverage_percent) || 0)}%` }}
                      />
                    </div>
                    <div className="flex justify-between text-[11px] text-[var(--text-muted)]">
                      <span>Demand: {formatNumber(water.daily_demand_liters || 0)} L</span>
                      <span>Gap: {formatPercent(water.coverage_gap_percent || 0)}</span>
                    </div>
                  </div>

                  <div className="text-[11px] text-[var(--text-muted)] pt-2 border-t border-[var(--border-subtle)]">
                    Covered Population: <strong className="text-[var(--text-main)]">{formatNumber(water.covered_population)}</strong>
                  </div>
                </div>

                {/* 2. EDUCATION & UDISE+ */}
                <div className="p-4 rounded-2xl bg-[var(--bg-primary)] border border-[var(--border-subtle)] flex flex-col justify-between space-y-3">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2 text-emerald-400 font-bold text-xs uppercase tracking-wider">
                      <School className="w-4 h-4" />
                      <span>Education Capacity</span>
                    </div>
                    <span className="text-xs font-bold text-emerald-300">
                      {formatNumber(education.school_students)} Students
                    </span>
                  </div>

                  <div className="space-y-1.5">
                    <div className="flex justify-between text-[11px] text-[var(--text-muted)]">
                      <span>Required Schools:</span>
                      <strong className="text-[var(--text-main)]">{formatNumber(education.required_schools)}</strong>
                    </div>
                    <div className="flex justify-between text-[11px] text-[var(--text-muted)]">
                      <span>Classrooms Needed:</span>
                      <strong className="text-emerald-400">{formatNumber(futureNeed.required_classrooms || futureNeed.additional_classrooms_needed || 4)}</strong>
                    </div>
                  </div>

                  <div className="text-[11px] text-[var(--text-muted)] pt-2 border-t border-[var(--border-subtle)]">
                    Higher Ed Students: <strong className="text-[var(--text-main)]">{formatNumber(education.college_students || 0)}</strong>
                  </div>
                </div>

                {/* 3. HEALTHCARE */}
                <div className="p-4 rounded-2xl bg-[var(--bg-primary)] border border-[var(--border-subtle)] flex flex-col justify-between space-y-3">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2 text-rose-400 font-bold text-xs uppercase tracking-wider">
                      <HeartPulse className="w-4 h-4" />
                      <span>Healthcare & PHC</span>
                    </div>
                    <span className="text-xs font-bold text-rose-300">
                      {healthcare.hospital_gap > 0 ? `Gap: -${healthcare.hospital_gap}` : 'Adequate'}
                    </span>
                  </div>

                  <div className="space-y-1.5">
                    <div className="flex justify-between text-[11px] text-[var(--text-muted)]">
                      <span>Required Facilities:</span>
                      <strong className="text-[var(--text-main)]">{formatNumber(healthcare.required_hospitals)}</strong>
                    </div>
                    <div className="flex justify-between text-[11px] text-[var(--text-muted)]">
                      <span>Current Hospital Network:</span>
                      <strong className="text-[var(--text-main)]">{formatNumber(healthcare.current_hospitals)}</strong>
                    </div>
                  </div>

                  <div className="text-[11px] text-[var(--text-muted)] pt-2 border-t border-[var(--border-subtle)]">
                    Cap Headroom: <strong className="text-[var(--text-main)]">{formatNumber(healthcare.current_capacity || 20000)}</strong>
                  </div>
                </div>

                {/* 4. ROADS & CONNECTIVITY */}
                <div className="p-4 rounded-2xl bg-[var(--bg-primary)] border border-[var(--border-subtle)] flex flex-col justify-between space-y-3">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2 text-amber-400 font-bold text-xs uppercase tracking-wider">
                      <Route className="w-4 h-4" />
                      <span>Road Network</span>
                    </div>
                    <span
                      className={`text-xs font-bold px-2 py-0.5 rounded-full ${
                        road.risk === 'High'
                          ? 'bg-red-500/20 text-red-300'
                          : road.risk === 'Medium'
                          ? 'bg-amber-500/20 text-amber-300'
                          : 'bg-emerald-500/20 text-emerald-300'
                      }`}
                    >
                      {road.risk || 'Low'} Risk
                    </span>
                  </div>

                  <div className="space-y-1.5">
                    <div className="flex justify-between text-[11px] text-[var(--text-muted)]">
                      <span>Current Network:</span>
                      <strong className="text-[var(--text-main)]">{road.current_road_km || 25} km</strong>
                    </div>
                    <div className="flex justify-between text-[11px] text-[var(--text-muted)]">
                      <span>Years Since Repair:</span>
                      <strong className="text-[var(--text-main)]">{road.years_since_repair || 4} yrs</strong>
                    </div>
                  </div>

                  <div className="text-[11px] text-[var(--text-muted)] pt-2 border-t border-[var(--border-subtle)]">
                    Maintenance Urgency: <strong className="text-amber-400">{road.risk_score || 2}/5</strong>
                  </div>
                </div>
              </div>

              {/* Service Coverage Progress & AI Priority Interventions */}
              <YearInterventionsView yearData={yearData} />
            </div>
          );
        })}
      </div>

      {/* ====================================================
          5-YEAR COMPARISON MATRIX TABLE
      ==================================================== */}
      <div className="rounded-3xl border border-[var(--border-subtle)] bg-[var(--bg-card)] p-6 shadow-xl overflow-hidden">
        <div className="flex flex-wrap items-center justify-between gap-4 mb-5">
          <div>
            <h3 className="text-lg font-black text-[var(--text-main)] flex items-center gap-2">
              <TrendingUp className="w-5 h-5 text-emerald-400" />
              <span>5-Year Year-over-Year Comparative Matrix</span>
            </h3>
            <p className="text-xs text-[var(--text-muted)]">
              Complete trajectory from base year {summary.base_year || 2026} to 2031
            </p>
          </div>
          {/* BOTTOM COLORFUL PDF DOWNLOADER BUTTON */}
          <button
            type="button"
            onClick={() => handleDownloadPdf('all')}
            disabled={downloadingYear !== null}
            className="px-4 py-2 rounded-xl bg-gradient-to-r from-rose-600 via-pink-600 to-amber-500 hover:from-rose-500 hover:to-amber-400 text-white text-xs font-black flex items-center gap-2 shadow-xl shadow-rose-950/60 ring-2 ring-rose-400/40 transition-all hover:scale-105 active:scale-95 cursor-pointer disabled:opacity-60 disabled:cursor-wait"
            title="Directly download official 5-year future prediction PDF report alone"
          >
            {downloadingYear === 'all' ? (
              <>
                <Loader2 className="w-3.5 h-3.5 animate-spin text-white" />
                <span>Downloading 5-Year PDF...</span>
              </>
            ) : (
              <>
                <Download className="w-3.5 h-3.5 text-white" />
                <span>Download 5-Year Prediction PDF</span>
              </>
            )}
          </button>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead>
              <tr className="border-b border-[var(--border-subtle)] text-[var(--text-muted)] uppercase tracking-wider">
                <th className="py-3 px-3">Forecast Year</th>
                <th className="py-3 px-3">Population</th>
                <th className="py-3 px-3">Households</th>
                <th className="py-3 px-3">Water Demand</th>
                <th className="py-3 px-3">Schools Req.</th>
                <th className="py-3 px-3">GDI Score</th>
                <th className="py-3 px-3">Broadband %</th>
                <th className="py-3 px-3">Employment %</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[var(--border-subtle)] text-[var(--text-main)]">
              {years.map((y) => (
                <tr key={y.year} className="hover:bg-[var(--bg-card-hover)] transition-colors">
                  <td className="py-3.5 px-3 font-bold text-emerald-400">
                    {y.year} (Yr {y.year_number})
                  </td>
                  <td className="py-3.5 px-3 font-semibold">{formatNumber(y.population)}</td>
                  <td className="py-3.5 px-3">{formatNumber(y.households)}</td>
                  <td className="py-3.5 px-3 font-mono">{formatNumber(y.water?.daily_demand_liters || 0)} L</td>
                  <td className="py-3.5 px-3 font-bold text-amber-300">
                    {formatNumber(y.education?.required_schools || 1)}
                  </td>
                  <td className="py-3.5 px-3 font-bold text-emerald-300">
                    {formatPercent(y.development?.development_score)}
                  </td>
                  <td className="py-3.5 px-3">{formatPercent(y.service_coverage?.internet)}</td>
                  <td className="py-3.5 px-3">{formatPercent(y.service_coverage?.employment)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* ====================================================
          UDISE+ & METHODOLOGY FOOTER WITH BOTTOM DOWNLOADER
      ==================================================== */}
      <div className="rounded-2xl border border-emerald-500/20 bg-emerald-950/20 p-5 flex flex-wrap items-center justify-between gap-4 text-xs">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-xl bg-emerald-500/20 flex items-center justify-center text-emerald-400 shrink-0">
            <Database className="w-4 h-4" />
          </div>
          <div>
            <p className="font-bold text-emerald-300">
              GramPulse Demographic Cohort & UDISE+ Projection Model
            </p>
            <p className="text-[var(--text-muted)]">
              Calculated using Ministry of Panchayati Raj GPDP guidelines, national vital rates, and real school records.
            </p>
          </div>
        </div>

        <span className="px-3 py-1 rounded-full bg-emerald-500/10 text-emerald-400 font-mono font-bold border border-emerald-500/30">
          Status: Verified & Active
        </span>
      </div>
    </div>
  );
}

/*
============================================================
MAIN FUTURE PREDICTION PAGE (DUAL-SLIDE ARCHITECTURE)
============================================================
*/

function FuturePredictionPage({
  selectedLocation,
  analytics,
  infrastructure,
  initialMode = 'selected',
  onBackToDashboard,
}) {
  // Dual Slide Switcher: 'selected' | 'manual'
  const [activeSlide, setActiveSlide] = useState(initialMode || 'selected');

  /*
  ----------------------------------------------------------
  SLIDE 1 STATE: PREDICT FOR SELECTED VILLAGE
  ----------------------------------------------------------
  */
  const [selectedLoading, setSelectedLoading] = useState(true);
  const [selectedError, setSelectedError] = useState('');
  const [selectedPrediction, setSelectedPrediction] = useState(null);

  const fetchSelectedVillagePrediction = useCallback(async () => {
    try {
      setSelectedLoading(true);
      setSelectedError('');

      const payload = buildPredictionPayload({
        selectedLocation,
        analytics,
        infrastructure,
      });

      console.log('Fetching prediction for map selected village:', payload);
      const result = await generateFuturePrediction(payload);
      setSelectedPrediction(result);
    } catch (err) {
      console.error('Error predicting for selected village:', err);
      setSelectedError(err.message || 'Unable to generate prediction for selected village.');
    } finally {
      setSelectedLoading(false);
    }
  }, [selectedLocation, analytics, infrastructure]);

  useEffect(() => {
    fetchSelectedVillagePrediction();
  }, [fetchSelectedVillagePrediction]);

  /*
  ----------------------------------------------------------
  SLIDE 2 STATE: PREDICT FOR VILLAGE MANUALLY
  ----------------------------------------------------------
  */
  const [manualForm, setManualForm] = useState(() => ({
    village_name: selectedLocation?.gp_name || 'Adarsh Model Gram Panchayat',
    district: selectedLocation?.district || 'Coimbatore',
    state: selectedLocation?.state || 'Tamil Nadu',
    current_year: 2026,
    population: Number(selectedLocation?.population) || 6800,
    households: Math.round((Number(selectedLocation?.population) || 6800) / 4),
    birth_rate: 17.5,
    death_rate: 6.8,
    migration_rate: 1.2,
    schools: 2,
    school_students: 1050,
    classrooms: 16,
    colleges: 0,
    hospitals: 1,
    road_length_km: 26.5,
    road_built_year: 2017,
    last_repair_year: 2022,
    road_condition: 'Average',
    water_coverage: 74.0,
    electricity_coverage: 97.0,
    internet_coverage: 56.0,
    employment_rate: 66.0,
  }));

  // Auto-sync manual form defaults when selected village changes
  useEffect(() => {
    if (selectedLocation?.gp_name) {
      const pop = Number(selectedLocation.population) || 5800;
      setManualForm((prev) => ({
        ...prev,
        village_name: selectedLocation.gp_name,
        district: selectedLocation.district || 'District',
        state: selectedLocation.state || 'Tamil Nadu',
        population: pop,
        households: Number(selectedLocation.households) || Math.round(pop / 4),
        schools: Number(selectedLocation.schools) || 2,
        school_students: Math.round(pop * 0.16),
        classrooms: Number(selectedLocation.school_classrooms_count) || 16,
        road_length_km: Number(selectedLocation.road_coverage_km) || 25.0,
      }));
    }
  }, [selectedLocation]);

  const [manualView, setManualView] = useState('form'); // 'form' | 'result'
  const [manualLoading, setManualLoading] = useState(false);
  const [manualError, setManualError] = useState('');
  const [manualPrediction, setManualPrediction] = useState(null);

  // Quick preset apply
  const applyPreset = (preset) => {
    setManualForm((prev) => ({
      ...prev,
      ...preset.data,
    }));
  };

  // Pre-fill with current selected map village
  const prefillFromMapVillage = () => {
    const pop = Number(selectedLocation?.population) || 5800;
    setManualForm({
      village_name: selectedLocation?.gp_name || 'Selected Map Village',
      district: selectedLocation?.district || 'Coimbatore',
      state: selectedLocation?.state || 'Tamil Nadu',
      current_year: 2026,
      population: pop,
      households: Math.round(pop / 4),
      birth_rate: 18.0,
      death_rate: 7.0,
      migration_rate: 1.0,
      schools: Number(selectedLocation?.schools) || 2,
      school_students: Math.round(pop * 0.16),
      classrooms: 18,
      colleges: 0,
      hospitals: 1,
      road_length_km: 25.0,
      road_built_year: 2018,
      last_repair_year: 2023,
      road_condition: 'Average',
      water_coverage: 70.0,
      electricity_coverage: 95.0,
      internet_coverage: 50.0,
      employment_rate: 65.0,
    });
  };

  // Handle manual input change
  const handleInputChange = (field, value) => {
    setManualForm((prev) => {
      const updated = { ...prev, [field]: value };
      if (field === 'population' && Number(value) > 0) {
        updated.households = Math.round(Number(value) / 4);
        updated.school_students = Math.round(Number(value) * 0.16);
      }
      return updated;
    });
  };

  // Execute manual prediction
  const handleRunManualPrediction = async (e) => {
    if (e) e.preventDefault();
    try {
      setManualLoading(true);
      setManualError('');

      const payload = {
        village_name: manualForm.village_name || 'Manual Village',
        current_year: Number(manualForm.current_year) || 2026,
        population: Number(manualForm.population) || 5800,
        birth_rate: Number(manualForm.birth_rate) || 18.0,
        death_rate: Number(manualForm.death_rate) || 7.0,
        migration_rate: Number(manualForm.migration_rate) || 1.0,
        households: Number(manualForm.households) || Math.round(Number(manualForm.population) / 4),
        schools: Number(manualForm.schools) || 2,
        colleges: Number(manualForm.colleges) || 0,
        school_students: Number(manualForm.school_students) || Math.round(Number(manualForm.population) * 0.16),
        hospitals: Number(manualForm.hospitals) || 1,
        road_length_km: Number(manualForm.road_length_km) || 25.0,
        road_built_year: Number(manualForm.road_built_year) || 2016,
        last_repair_year: Number(manualForm.last_repair_year) || 2021,
        road_condition: manualForm.road_condition || 'Average',
        water_coverage: Number(manualForm.water_coverage) || 70.0,
        electricity_coverage: Number(manualForm.electricity_coverage) || 95.0,
        internet_coverage: Number(manualForm.internet_coverage) || 50.0,
        employment_rate: Number(manualForm.employment_rate) || 65.0,
      };

      console.log('Sending manual prediction payload:', payload);
      const result = await generateFuturePrediction(payload);
      setManualPrediction(result);
      setManualView('result');
    } catch (err) {
      console.error('Error running manual prediction:', err);
      setManualError(err.message || 'Failed to calculate manual prediction.');
    } finally {
      setManualLoading(false);
    }
  };

  // Calculated net growth for manual form indicator
  const netGrowthPercent = useMemo(() => {
    const b = Number(manualForm.birth_rate) || 0;
    const d = Number(manualForm.death_rate) || 0;
    const m = Number(manualForm.migration_rate) || 0;
    return ((b - d + m) / 10).toFixed(2);
  }, [manualForm.birth_rate, manualForm.death_rate, manualForm.migration_rate]);

  return (
    <div className="min-h-screen bg-[var(--bg-primary)] text-[var(--text-main)] p-4 sm:p-6 lg:p-8 selection:bg-emerald-500 selection:text-white">
      <div className="max-w-7xl mx-auto space-y-8">
        {/* ==================================================
            NAVIGATION & BREADCRUMBS
        ================================================== */}
        <div className="flex flex-wrap items-center justify-between gap-4">
          <button
            type="button"
            onClick={onBackToDashboard}
            className="flex items-center gap-2 text-xs sm:text-sm font-bold text-emerald-400 hover:text-emerald-300 transition-colors bg-[var(--bg-card)] px-4 py-2 rounded-xl border border-[var(--border-subtle)] hover:border-emerald-500/40 shadow-sm cursor-pointer active:scale-95"
          >
            <ArrowLeft className="w-4 h-4" />
            <span>Back to Dashboard</span>
          </button>

          <div className="flex items-center gap-2 text-xs text-[var(--text-muted)]">
            <span className="font-semibold text-emerald-400">GramPulse AI</span>
            <ChevronRight className="w-3.5 h-3.5" />
            <span>5-Year Development Predictor</span>
          </div>
        </div>

        {/* ==================================================
            DUAL-SLIDE SELECTOR HEADER (HERO SEGMENTED CARDS)
        ================================================== */}
        <div className="space-y-4">
          <div>
            <span className="text-[11px] font-black uppercase tracking-widest text-emerald-400">
              Dual Prediction Modes
            </span>
            <h1 className="text-3xl sm:text-4xl font-black text-[var(--text-main)] tracking-tight">
              Future Village Development Predictor
            </h1>
            <p className="text-sm text-[var(--text-muted)] mt-1">
              Choose between real GIS map telemetry or interactive custom simulation:
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-2">
            {/* Slide 1 Trigger: Predict for Selected Village */}
            <button
              type="button"
              onClick={() => setActiveSlide('selected')}
              className={`text-left p-5 rounded-3xl border transition-all duration-300 relative overflow-hidden group cursor-pointer ${
                activeSlide === 'selected'
                  ? 'bg-gradient-to-br from-emerald-950/60 via-[var(--bg-card)] to-emerald-950/30 border-emerald-400 ring-2 ring-emerald-500/30 shadow-2xl shadow-emerald-950/50'
                  : 'bg-[var(--bg-card)] hover:bg-[var(--bg-card-hover)] border-[var(--border-subtle)] hover:border-emerald-500/30 opacity-75 hover:opacity-100'
              }`}
            >
              <div className="flex items-start gap-4">
                <div
                  className={`w-12 h-12 rounded-2xl flex items-center justify-center shrink-0 border transition-all ${
                    activeSlide === 'selected'
                      ? 'bg-emerald-500 text-white border-emerald-400 shadow-lg shadow-emerald-950/50 scale-105'
                      : 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20 group-hover:scale-105'
                  }`}
                >
                  <MapPin className="w-6 h-6" />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between gap-2">
                    <span className="text-[10px] font-black uppercase tracking-wider text-emerald-400">
                      Slide 1 • GIS Telemetry
                    </span>
                    {activeSlide === 'selected' && (
                      <span className="flex items-center gap-1 text-[10px] font-bold text-emerald-300 bg-emerald-500/20 px-2 py-0.5 rounded-full border border-emerald-500/40 animate-pulse">
                        <Check className="w-3 h-3" /> Active Slide
                      </span>
                    )}
                  </div>
                  <h3 className="text-lg font-black text-[var(--text-main)] mt-0.5 group-hover:text-emerald-300 transition-colors">
                    Predict for Selected Village
                  </h3>
                  <p className="text-xs text-[var(--text-muted)] mt-1 line-clamp-2">
                    Forecast for active village: <strong>{selectedLocation?.gp_name || 'Selected Village'}</strong> ({selectedLocation?.district || 'District'}, {selectedLocation?.state || 'India'}) using official Census &amp; UDISE+ benchmarks.
                  </p>
                </div>
              </div>
            </button>

            {/* Slide 2 Trigger: Predict for Village Manually */}
            <button
              type="button"
              onClick={() => setActiveSlide('manual')}
              className={`text-left p-5 rounded-3xl border transition-all duration-300 relative overflow-hidden group cursor-pointer ${
                activeSlide === 'manual'
                  ? 'bg-gradient-to-br from-teal-950/60 via-[var(--bg-card)] to-cyan-950/30 border-teal-400 ring-2 ring-teal-500/30 shadow-2xl shadow-teal-950/50'
                  : 'bg-[var(--bg-card)] hover:bg-[var(--bg-card-hover)] border-[var(--border-subtle)] hover:border-teal-500/30 opacity-75 hover:opacity-100'
              }`}
            >
              <div className="flex items-start gap-4">
                <div
                  className={`w-12 h-12 rounded-2xl flex items-center justify-center shrink-0 border transition-all ${
                    activeSlide === 'manual'
                      ? 'bg-teal-500 text-white border-teal-400 shadow-lg shadow-teal-950/50 scale-105'
                      : 'bg-teal-500/10 text-teal-400 border-teal-500/20 group-hover:scale-105'
                  }`}
                >
                  <Sliders className="w-6 h-6" />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between gap-2">
                    <span className="text-[10px] font-black uppercase tracking-wider text-teal-400">
                      Slide 2 • Custom Fields
                    </span>
                    {activeSlide === 'manual' && (
                      <span className="flex items-center gap-1 text-[10px] font-bold text-teal-300 bg-teal-500/20 px-2 py-0.5 rounded-full border border-teal-500/40 animate-pulse">
                        <Check className="w-3 h-3" /> Active Slide
                      </span>
                    )}
                  </div>
                  <h3 className="text-lg font-black text-[var(--text-main)] mt-0.5 group-hover:text-teal-300 transition-colors">
                    Predict for Village Manually
                  </h3>
                  <p className="text-xs text-[var(--text-muted)] mt-1 line-clamp-2">
                    Enter custom parameters (population, birth/death rates, schools, roads, utilities) and predict 5 next years.
                  </p>
                </div>
              </div>
            </button>
          </div>
        </div>

        {/* ==================================================
            SLIDE 1: PREDICT FOR SELECTED VILLAGE
        ================================================== */}
        {activeSlide === 'selected' && (
          <div className="space-y-6">
            {/* Live Village Badge Header */}
            <div className="flex flex-wrap items-center justify-between gap-3 px-5 py-3 rounded-2xl bg-[var(--bg-card)] border border-[var(--border-subtle)]">
              <div className="flex items-center gap-3">
                <div className="w-2.5 h-2.5 rounded-full bg-emerald-400 animate-ping" />
                <span className="text-xs text-[var(--text-muted)]">
                  Active Habitation:
                </span>
                <span className="text-sm font-black text-emerald-300">
                  {selectedLocation?.gp_name || 'Selected Village'} {selectedLocation?.gp_code ? `(${selectedLocation.gp_code})` : ''}
                </span>
                <span className="text-xs text-[var(--text-muted)]">
                  • {selectedLocation?.district || 'District'}, {selectedLocation?.state || 'India'}
                </span>
              </div>
              <div className="flex items-center gap-2">
                <span className="text-xs text-[var(--text-muted)]">
                  Official Pop: <strong>{formatNumber(selectedLocation?.population || 5800)}</strong>
                </span>
                <span className="px-2.5 py-0.5 rounded-full bg-emerald-500/10 text-emerald-400 text-[10px] font-bold border border-emerald-500/20">
                  {selectedLocation?.isOfficialData ? 'Official Census & MoPR Verified' : 'UDISE+ Synced'}
                </span>
              </div>
            </div>

            {/* Loading State */}
            {selectedLoading && (
              <div className="min-h-[420px] rounded-3xl border border-[var(--border-subtle)] bg-[var(--bg-card)] flex flex-col items-center justify-center p-8 space-y-4">
                <div className="relative">
                  <Loader2 className="w-12 h-12 text-emerald-400 animate-spin" />
                  <div className="absolute inset-0 rounded-full blur-xl bg-emerald-500/30" />
                </div>
                <div className="text-center space-y-1">
                  <h3 className="text-lg font-black text-[var(--text-main)]">
                    Calculating 5-Year Forecast for {selectedLocation?.gp_name || 'Selected Village'}
                  </h3>
                  <p className="text-xs text-[var(--text-muted)] max-w-md mx-auto">
                    Synthesizing real UDISE+ school infrastructure, cohort population changes, and water-health deficit curves...
                  </p>
                </div>
              </div>
            )}

            {/* Error State */}
            {!selectedLoading && selectedError && (
              <div className="rounded-3xl border border-red-500/30 bg-red-500/5 p-8 text-center space-y-4">
                <AlertTriangle className="w-10 h-10 text-red-400 mx-auto" />
                <div>
                  <h3 className="text-lg font-black text-red-300">Unable to load prediction</h3>
                  <p className="text-xs text-[var(--text-muted)] mt-1">{selectedError}</p>
                </div>
                <button
                  type="button"
                  onClick={fetchSelectedVillagePrediction}
                  className="px-5 py-2.5 rounded-xl bg-red-500/20 hover:bg-red-500/30 text-red-300 font-bold text-xs transition-colors"
                >
                  Retry Prediction
                </button>
              </div>
            )}

            {/* Report Display */}
            {!selectedLoading && !selectedError && selectedPrediction && (
              <PredictionReportView
                predictionData={selectedPrediction}
                modeTitle="Live Map Village Forecast"
                modeSubtitle={`Official 5-year projection model for ${selectedLocation?.gp_name || 'Selected Village'} GP using live GIS telemetry & verified UDISE+ records.`}
                isManual={false}
                onRefresh={fetchSelectedVillagePrediction}
              />
            )}
          </div>
        )}

        {/* ==================================================
            SLIDE 2: PREDICT FOR VILLAGE MANUALLY
        ================================================== */}
        {activeSlide === 'manual' && (
          <div className="space-y-6">
            {/* VIEW 1: MANUAL FIELDS ENTRY FORM */}
            {manualView === 'form' && (
              <form onSubmit={handleRunManualPrediction} className="space-y-6">
                {/* Presets Bar */}
                <div className="p-4 rounded-3xl bg-[var(--bg-card)] border border-teal-500/20 space-y-3">
                  <div className="flex items-center justify-between gap-2">
                    <span className="text-xs font-black uppercase tracking-wider text-teal-600 dark:text-teal-400 flex items-center gap-1.5">
                      <Zap className="w-3.5 h-3.5" />
                      Quick Scenario Templates
                    </span>
                    <button
                      type="button"
                      onClick={prefillFromMapVillage}
                      className="px-3 py-1 rounded-xl bg-emerald-500/15 hover:bg-emerald-500/25 border border-emerald-500/30 text-emerald-700 dark:text-emerald-300 text-xs font-bold transition-all cursor-pointer"
                    >
                      📍 Pre-fill from Selected Map Village
                    </button>
                  </div>
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5">
                    {MANUAL_PRESETS.map((preset) => (
                      <button
                        key={preset.id}
                        type="button"
                        onClick={() => applyPreset(preset)}
                        className="p-3 rounded-2xl bg-[var(--bg-primary)] hover:bg-[var(--bg-card-hover)] border border-[var(--border-subtle)] hover:border-teal-400/40 text-left transition-all group cursor-pointer shadow-xs"
                      >
                        <p className="text-xs font-bold text-[var(--text-main)] group-hover:text-teal-600 dark:group-hover:text-teal-300 transition-colors">
                          {preset.label}
                        </p>
                        <p className="text-[10px] text-[var(--text-muted)] mt-0.5 line-clamp-1">
                          {preset.desc}
                        </p>
                      </button>
                    ))}
                  </div>
                </div>

                {/* Grid of Input Cards */}
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                  {/* Card 1: Village Identity & Base Info */}
                  <div className="p-6 rounded-3xl bg-[var(--bg-card)] border border-[var(--border-subtle)] space-y-4">
                    <div className="flex items-center gap-2 text-teal-400 font-bold text-xs uppercase tracking-wider border-b border-[var(--border-subtle)] pb-3">
                      <Building2 className="w-4 h-4" />
                      <span>Village Identity & Horizon</span>
                    </div>

                    <div className="space-y-3.5">
                      <div>
                        <label className="block text-xs font-bold text-[var(--text-muted)] mb-1">
                          Village / Gram Panchayat Name *
                        </label>
                        <input
                          type="text"
                          required
                          value={manualForm.village_name}
                          onChange={(e) => handleInputChange('village_name', e.target.value)}
                          placeholder="e.g. Adarsh Gram Panchayat"
                          className="w-full px-4 py-2.5 rounded-xl bg-[var(--bg-primary)] border border-[var(--border-subtle)] focus:border-teal-400 focus:outline-none text-sm font-semibold text-[var(--text-main)]"
                        />
                      </div>

                      <div className="grid grid-cols-2 gap-3">
                        <div>
                          <label className="block text-xs font-bold text-[var(--text-muted)] mb-1">
                            District
                          </label>
                          <input
                            type="text"
                            value={manualForm.district}
                            onChange={(e) => handleInputChange('district', e.target.value)}
                            placeholder="e.g. Coimbatore"
                            className="w-full px-4 py-2.5 rounded-xl bg-[var(--bg-primary)] border border-[var(--border-subtle)] focus:border-teal-400 focus:outline-none text-sm font-semibold text-[var(--text-main)]"
                          />
                        </div>
                        <div>
                          <label className="block text-xs font-bold text-[var(--text-muted)] mb-1">
                            State
                          </label>
                          <input
                            type="text"
                            value={manualForm.state}
                            onChange={(e) => handleInputChange('state', e.target.value)}
                            placeholder="e.g. Tamil Nadu"
                            className="w-full px-4 py-2.5 rounded-xl bg-[var(--bg-primary)] border border-[var(--border-subtle)] focus:border-teal-400 focus:outline-none text-sm font-semibold text-[var(--text-main)]"
                          />
                        </div>
                      </div>

                      <div className="grid grid-cols-2 gap-3">
                        <div>
                          <label className="block text-xs font-bold text-[var(--text-muted)] mb-1">
                            Base Year
                          </label>
                          <input
                            type="number"
                            min="2020"
                            max="2035"
                            value={manualForm.current_year}
                            onChange={(e) => handleInputChange('current_year', Number(e.target.value))}
                            className="w-full px-4 py-2.5 rounded-xl bg-[var(--bg-primary)] border border-[var(--border-subtle)] focus:border-teal-400 focus:outline-none text-sm font-semibold text-[var(--text-main)]"
                          />
                        </div>
                        <div>
                          <label className="block text-xs font-bold text-[var(--text-muted)] mb-1">
                            Forecast Target
                          </label>
                          <div className="px-4 py-2.5 rounded-xl bg-teal-500/10 border border-teal-500/20 text-teal-300 text-sm font-bold">
                            5 Next Years (2027–2031)
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Card 2: Demographics & Population Dynamics */}
                  <div className="p-6 rounded-3xl bg-[var(--bg-card)] border border-[var(--border-subtle)] space-y-4">
                    <div className="flex items-center justify-between border-b border-[var(--border-subtle)] pb-3">
                      <div className="flex items-center gap-2 text-teal-400 font-bold text-xs uppercase tracking-wider">
                        <Users className="w-4 h-4" />
                        <span>Demographics & Population Rates</span>
                      </div>
                      <span className="text-[10px] font-bold text-teal-300 bg-teal-500/15 px-2 py-0.5 rounded-full border border-teal-500/30">
                        Net Growth: {netGrowthPercent}% / yr
                      </span>
                    </div>

                    <div className="space-y-3.5">
                      <div className="grid grid-cols-2 gap-3">
                        <div>
                          <label className="block text-xs font-bold text-[var(--text-muted)] mb-1">
                            Base Population *
                          </label>
                          <input
                            type="number"
                            required
                            min="100"
                            value={manualForm.population}
                            onChange={(e) => handleInputChange('population', Number(e.target.value))}
                            className="w-full px-4 py-2.5 rounded-xl bg-[var(--bg-primary)] border border-[var(--border-subtle)] focus:border-teal-400 focus:outline-none text-sm font-semibold text-[var(--text-main)] font-mono"
                          />
                        </div>
                        <div>
                          <label className="block text-xs font-bold text-[var(--text-muted)] mb-1">
                            Households
                          </label>
                          <input
                            type="number"
                            min="10"
                            value={manualForm.households}
                            onChange={(e) => handleInputChange('households', Number(e.target.value))}
                            className="w-full px-4 py-2.5 rounded-xl bg-[var(--bg-primary)] border border-[var(--border-subtle)] focus:border-teal-400 focus:outline-none text-sm font-semibold text-[var(--text-main)] font-mono"
                          />
                        </div>
                      </div>

                      <div className="grid grid-cols-3 gap-3">
                        <div>
                          <label className="block text-xs font-bold text-[var(--text-muted)] mb-1" title="Births per 1,000 people annually">
                            Birth Rate (‰)
                          </label>
                          <input
                            type="number"
                            step="0.1"
                            value={manualForm.birth_rate}
                            onChange={(e) => handleInputChange('birth_rate', Number(e.target.value))}
                            className="w-full px-3 py-2.5 rounded-xl bg-[var(--bg-primary)] border border-[var(--border-subtle)] focus:border-teal-400 focus:outline-none text-xs font-semibold text-[var(--text-main)]"
                          />
                        </div>
                        <div>
                          <label className="block text-xs font-bold text-[var(--text-muted)] mb-1" title="Deaths per 1,000 people annually">
                            Death Rate (‰)
                          </label>
                          <input
                            type="number"
                            step="0.1"
                            value={manualForm.death_rate}
                            onChange={(e) => handleInputChange('death_rate', Number(e.target.value))}
                            className="w-full px-3 py-2.5 rounded-xl bg-[var(--bg-primary)] border border-[var(--border-subtle)] focus:border-teal-400 focus:outline-none text-xs font-semibold text-[var(--text-main)]"
                          />
                        </div>
                        <div>
                          <label className="block text-xs font-bold text-[var(--text-muted)] mb-1" title="Net inward/outward migration per 1,000">
                            Migration (‰)
                          </label>
                          <input
                            type="number"
                            step="0.1"
                            value={manualForm.migration_rate}
                            onChange={(e) => handleInputChange('migration_rate', Number(e.target.value))}
                            className="w-full px-3 py-2.5 rounded-xl bg-[var(--bg-primary)] border border-[var(--border-subtle)] focus:border-teal-400 focus:outline-none text-xs font-semibold text-[var(--text-main)]"
                          />
                        </div>
                      </div>
                      <p className="text-[10px] text-[var(--text-muted)]">
                        Demographic rate formula: <code>(Birth Rate - Death Rate + Migration Rate) / 10</code>
                      </p>
                    </div>
                  </div>

                  {/* Card 3: Education & Public Healthcare */}
                  <div className="p-6 rounded-3xl bg-[var(--bg-card)] border border-[var(--border-subtle)] space-y-4">
                    <div className="flex items-center gap-2 text-teal-400 font-bold text-xs uppercase tracking-wider border-b border-[var(--border-subtle)] pb-3">
                      <School className="w-4 h-4" />
                      <span>Education & Healthcare Facilities</span>
                    </div>

                    <div className="space-y-3.5">
                      <div className="grid grid-cols-2 gap-3">
                        <div>
                          <label className="block text-xs font-bold text-[var(--text-muted)] mb-1">
                            Existing Schools
                          </label>
                          <input
                            type="number"
                            min="0"
                            value={manualForm.schools}
                            onChange={(e) => handleInputChange('schools', Number(e.target.value))}
                            className="w-full px-4 py-2.5 rounded-xl bg-[var(--bg-primary)] border border-[var(--border-subtle)] focus:border-teal-400 focus:outline-none text-sm font-semibold text-[var(--text-main)]"
                          />
                        </div>
                        <div>
                          <label className="block text-xs font-bold text-[var(--text-muted)] mb-1">
                            Available Classrooms
                          </label>
                          <input
                            type="number"
                            min="0"
                            value={manualForm.classrooms}
                            onChange={(e) => handleInputChange('classrooms', Number(e.target.value))}
                            className="w-full px-4 py-2.5 rounded-xl bg-[var(--bg-primary)] border border-[var(--border-subtle)] focus:border-teal-400 focus:outline-none text-sm font-semibold text-[var(--text-main)]"
                          />
                        </div>
                      </div>

                      <div className="grid grid-cols-3 gap-3">
                        <div>
                          <label className="block text-xs font-bold text-[var(--text-muted)] mb-1">
                            School Students
                          </label>
                          <input
                            type="number"
                            min="0"
                            value={manualForm.school_students}
                            onChange={(e) => handleInputChange('school_students', Number(e.target.value))}
                            className="w-full px-3 py-2.5 rounded-xl bg-[var(--bg-primary)] border border-[var(--border-subtle)] focus:border-teal-400 focus:outline-none text-xs font-semibold text-[var(--text-main)]"
                          />
                        </div>
                        <div>
                          <label className="block text-xs font-bold text-[var(--text-muted)] mb-1">
                            Colleges
                          </label>
                          <input
                            type="number"
                            min="0"
                            value={manualForm.colleges}
                            onChange={(e) => handleInputChange('colleges', Number(e.target.value))}
                            className="w-full px-3 py-2.5 rounded-xl bg-[var(--bg-primary)] border border-[var(--border-subtle)] focus:border-teal-400 focus:outline-none text-xs font-semibold text-[var(--text-main)]"
                          />
                        </div>
                        <div>
                          <label className="block text-xs font-bold text-[var(--text-muted)] mb-1">
                            Hospitals / PHCs
                          </label>
                          <input
                            type="number"
                            min="0"
                            value={manualForm.hospitals}
                            onChange={(e) => handleInputChange('hospitals', Number(e.target.value))}
                            className="w-full px-3 py-2.5 rounded-xl bg-[var(--bg-primary)] border border-[var(--border-subtle)] focus:border-teal-400 focus:outline-none text-xs font-semibold text-[var(--text-main)]"
                          />
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Card 4: Road Connectivity & Infrastructure */}
                  <div className="p-6 rounded-3xl bg-[var(--bg-card)] border border-[var(--border-subtle)] space-y-4">
                    <div className="flex items-center gap-2 text-teal-400 font-bold text-xs uppercase tracking-wider border-b border-[var(--border-subtle)] pb-3">
                      <Route className="w-4 h-4" />
                      <span>Road Connectivity Network</span>
                    </div>

                    <div className="space-y-3.5">
                      <div className="grid grid-cols-2 gap-3">
                        <div>
                          <label className="block text-xs font-bold text-[var(--text-muted)] mb-1">
                            Road Network (km)
                          </label>
                          <input
                            type="number"
                            step="0.5"
                            min="1"
                            value={manualForm.road_length_km}
                            onChange={(e) => handleInputChange('road_length_km', Number(e.target.value))}
                            className="w-full px-4 py-2.5 rounded-xl bg-[var(--bg-primary)] border border-[var(--border-subtle)] focus:border-teal-400 focus:outline-none text-sm font-semibold text-[var(--text-main)] font-mono"
                          />
                        </div>
                        <div>
                          <label className="block text-xs font-bold text-[var(--text-muted)] mb-1">
                            Road Condition
                          </label>
                          <select
                            value={manualForm.road_condition}
                            onChange={(e) => handleInputChange('road_condition', e.target.value)}
                            className="w-full px-4 py-2.5 rounded-xl bg-[var(--bg-primary)] border border-[var(--border-subtle)] focus:border-teal-400 focus:outline-none text-sm font-semibold text-[var(--text-main)]"
                          >
                            <option value="Good">Good (Paved / All-Weather)</option>
                            <option value="Average">Average (Semi-Paved)</option>
                            <option value="Poor">Poor (Potholes / Unpaved)</option>
                          </select>
                        </div>
                      </div>

                      <div className="grid grid-cols-2 gap-3">
                        <div>
                          <label className="block text-xs font-bold text-[var(--text-muted)] mb-1">
                            Year Road Built
                          </label>
                          <input
                            type="number"
                            min="1980"
                            max="2026"
                            value={manualForm.road_built_year}
                            onChange={(e) => handleInputChange('road_built_year', Number(e.target.value))}
                            className="w-full px-4 py-2.5 rounded-xl bg-[var(--bg-primary)] border border-[var(--border-subtle)] focus:border-teal-400 focus:outline-none text-sm font-semibold text-[var(--text-main)]"
                          />
                        </div>
                        <div>
                          <label className="block text-xs font-bold text-[var(--text-muted)] mb-1">
                            Last Major Repair Year
                          </label>
                          <input
                            type="number"
                            min="1980"
                            max="2026"
                            value={manualForm.last_repair_year}
                            onChange={(e) => handleInputChange('last_repair_year', Number(e.target.value))}
                            className="w-full px-4 py-2.5 rounded-xl bg-[var(--bg-primary)] border border-[var(--border-subtle)] focus:border-teal-400 focus:outline-none text-sm font-semibold text-[var(--text-main)]"
                          />
                        </div>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Card 5: Utilities & Coverage Sliders */}
                <div className="p-6 rounded-3xl bg-[var(--bg-card)] border border-[var(--border-subtle)] space-y-5">
                  <div className="flex items-center justify-between border-b border-[var(--border-subtle)] pb-3">
                    <div className="flex items-center gap-2 text-teal-400 font-bold text-xs uppercase tracking-wider">
                      <Zap className="w-4 h-4" />
                      <span>Utilities & Socio-Economic Coverage (%)</span>
                    </div>
                    <span className="text-xs text-[var(--text-muted)]">
                      Current Saturation Level (0–100%)
                    </span>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
                    {/* Water */}
                    <div className="space-y-2">
                      <div className="flex justify-between text-xs">
                        <span className="font-bold text-[var(--text-muted)] flex items-center gap-1.5">
                          <Droplets className="w-3.5 h-3.5 text-blue-400" />
                          Tap Water Supply
                        </span>
                        <span className="font-bold text-blue-400">{manualForm.water_coverage}%</span>
                      </div>
                      <input
                        type="range"
                        min="0"
                        max="100"
                        value={manualForm.water_coverage}
                        onChange={(e) => handleInputChange('water_coverage', Number(e.target.value))}
                        className="w-full accent-blue-500 cursor-pointer"
                      />
                    </div>

                    {/* Electricity */}
                    <div className="space-y-2">
                      <div className="flex justify-between text-xs">
                        <span className="font-bold text-[var(--text-muted)] flex items-center gap-1.5">
                          <Zap className="w-3.5 h-3.5 text-amber-400" />
                          Electricity Grid
                        </span>
                        <span className="font-bold text-amber-400">{manualForm.electricity_coverage}%</span>
                      </div>
                      <input
                        type="range"
                        min="0"
                        max="100"
                        value={manualForm.electricity_coverage}
                        onChange={(e) => handleInputChange('electricity_coverage', Number(e.target.value))}
                        className="w-full accent-amber-500 cursor-pointer"
                      />
                    </div>

                    {/* Internet */}
                    <div className="space-y-2">
                      <div className="flex justify-between text-xs">
                        <span className="font-bold text-[var(--text-muted)] flex items-center gap-1.5">
                          <Wifi className="w-3.5 h-3.5 text-purple-400" />
                          Broadband Internet
                        </span>
                        <span className="font-bold text-purple-400">{manualForm.internet_coverage}%</span>
                      </div>
                      <input
                        type="range"
                        min="0"
                        max="100"
                        value={manualForm.internet_coverage}
                        onChange={(e) => handleInputChange('internet_coverage', Number(e.target.value))}
                        className="w-full accent-purple-500 cursor-pointer"
                      />
                    </div>

                    {/* Employment */}
                    <div className="space-y-2">
                      <div className="flex justify-between text-xs">
                        <span className="font-bold text-[var(--text-muted)] flex items-center gap-1.5">
                          <Briefcase className="w-3.5 h-3.5 text-emerald-400" />
                          Employment Rate
                        </span>
                        <span className="font-bold text-emerald-400">{manualForm.employment_rate}%</span>
                      </div>
                      <input
                        type="range"
                        min="0"
                        max="100"
                        value={manualForm.employment_rate}
                        onChange={(e) => handleInputChange('employment_rate', Number(e.target.value))}
                        className="w-full accent-emerald-500 cursor-pointer"
                      />
                    </div>
                  </div>
                </div>

                {/* Big Predict Button */}
                <div className="pt-2">
                  <button
                    type="submit"
                    disabled={manualLoading}
                    className="w-full py-5 rounded-3xl bg-gradient-to-r from-teal-500 via-emerald-500 to-teal-400 hover:from-teal-400 hover:to-emerald-400 text-white font-black text-lg sm:text-xl shadow-2xl shadow-teal-950/80 ring-4 ring-teal-500/20 transition-all duration-300 hover:scale-[1.01] active:scale-[0.99] flex items-center justify-center gap-3 cursor-pointer disabled:opacity-50"
                  >
                    {manualLoading ? (
                      <>
                        <Loader2 className="w-6 h-6 animate-spin" />
                        <span>Calculating 5-Year Projections...</span>
                      </>
                    ) : (
                      <>
                        <Sparkles className="w-6 h-6 animate-pulse" />
                        <span>Predict 5 Next Years (2027 – 2031)</span>
                      </>
                    )}
                  </button>
                  <p className="text-center text-xs text-[var(--text-muted)] mt-2.5">
                    Click to simulate demographic growth, water consumption, UDISE+ school requirements, and road deterioration.
                  </p>
                </div>
              </form>
            )}

            {/* VIEW 2: MANUAL PREDICTION RESULT */}
            {manualView === 'result' && manualPrediction && (
              <div className="space-y-6">
                <PredictionReportView
                  predictionData={manualPrediction}
                  modeTitle="Custom Village Simulation"
                  modeSubtitle={`5-Year prediction generated for ${manualForm.village_name} based on custom demographic & infrastructure parameters.`}
                  isManual={true}
                  onModifyManual={() => setManualView('form')}
                  onRefresh={handleRunManualPrediction}
                />
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}

export default React.memo(FuturePredictionPage);