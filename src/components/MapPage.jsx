import React, { useState } from 'react';
import PropTypes from 'prop-types';
import {
  ArrowLeft,
  Compass,
  MapPin,
  Building2,
  Users,
  Droplets,
  GraduationCap,
  Route,
  Sparkles,
  Calendar,
  PlusCircle,
  ShieldCheck,
  ChevronDown,
  ChevronUp,
  Layers,
  Bot,
} from 'lucide-react';
import { useLocation } from '../context/LocationContext';
import MapView from './MapView';
import ReportDownloadButton from './ReportDownloadButton';
import IssueReportForm from './IssueReportForm';

export default function MapPage({ onBackToDashboard, onOpenChatbot }) {
  const {
    locations,
    selectedLocation,
    selectedGpId,
    mapCenter,
    selectLocation,
    planningHorizon,
    setPlanningHorizon,
    analytics,
    issues,
    categoryFilter,
    setCategoryFilter,
    isReportModalOpen,
    setIsReportModalOpen,
    handleIssueCreated,
  } = useLocation();

  const [isDrawerOpen, setIsDrawerOpen] = useState(true);

  const predictions = analytics?.predictions || {};
  const severity = predictions?.severity_ratings || {};

  return (
    <div className="relative w-full h-[calc(100vh-64px)] bg-slate-950 overflow-hidden flex flex-col selection:bg-emerald-500 selection:text-white">
      {/* Floating Top Control Overlay Bar */}
      <div className="absolute top-4 left-4 right-4 z-[1000] pointer-events-none flex flex-wrap items-center justify-between gap-3">
        {/* Left Action: Back Button & Village Title Card */}
        <div className="pointer-events-auto flex items-center gap-2.5 bg-slate-900/95 backdrop-blur-xl p-2 sm:p-2.5 rounded-2xl border border-slate-700/80 shadow-2xl">
          <button
            type="button"
            onClick={onBackToDashboard}
            className="p-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white transition-all flex items-center gap-1.5 text-xs font-bold shadow-sm cursor-pointer active:scale-95"
            title="Return to Dashboard Overview"
          >
            <ArrowLeft className="w-4 h-4 text-emerald-400" />
            <span className="hidden sm:inline">Dashboard</span>
          </button>

          <div className="h-6 w-px bg-slate-800 hidden sm:block" />

          {/* Active Village Info */}
          <div className="flex items-center gap-2 pr-1">
            <div className="w-8 h-8 rounded-xl bg-emerald-500/15 border border-emerald-500/30 flex items-center justify-center text-emerald-400">
              <Building2 className="w-4 h-4" />
            </div>
            <div>
              <div className="flex items-center gap-1.5">
                <h2 className="text-xs sm:text-sm font-black text-white leading-tight truncate max-w-[140px] sm:max-w-[200px]">
                  {selectedLocation.gp_name}
                </h2>
                <span className="text-[10px] font-mono text-emerald-400 font-bold px-1.5 py-0.2 rounded bg-emerald-500/10 border border-emerald-500/20">
                  {selectedLocation.gp_code || `GP-${selectedLocation.gp_id}`}
                </span>
              </div>
              <p className="text-[10px] text-slate-400 truncate max-w-[180px]">
                {selectedLocation.district} District, {selectedLocation.state}
              </p>
            </div>
          </div>
        </div>

        {/* Right Actions: Horizon, Report Grievance, Export GPDP PDF */}
        <div className="pointer-events-auto flex items-center gap-2 bg-slate-900/95 backdrop-blur-xl p-2 rounded-2xl border border-slate-700/80 shadow-2xl">
          {/* Planning Horizon */}
          <div className="hidden md:flex items-center gap-1 bg-slate-800 px-2.5 py-1.5 rounded-xl border border-slate-700 text-xs text-slate-300">
            <Calendar className="w-3.5 h-3.5 text-slate-400" />
            <span className="text-[11px]">Horizon:</span>
            <select
              value={planningHorizon}
              onChange={(e) => setPlanningHorizon(Number(e.target.value))}
              aria-label="Select Planning Horizon"
              className="bg-transparent text-emerald-400 font-bold focus:outline-none cursor-pointer text-xs"
            >
              <option value={3} className="bg-slate-900 text-white">3 Yrs</option>
              <option value={5} className="bg-slate-900 text-white">5 Yrs</option>
              <option value={7} className="bg-slate-900 text-white">7 Yrs</option>
            </select>
          </div>

          {/* Submit Citizen Grievance */}
          <button
            type="button"
            onClick={() => setIsReportModalOpen(true)}
            className="inline-flex items-center gap-1 px-3 py-1.5 rounded-xl text-xs font-semibold bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 transition-colors shadow-sm cursor-pointer active:scale-95"
            title="Lodge new geotagged grievance"
          >
            <PlusCircle className="w-3.5 h-3.5 text-emerald-400" />
            <span className="hidden sm:inline">Report</span>
          </button>

          {/* Export GPDP PDF Report */}
          <ReportDownloadButton
            gpId={selectedLocation?.gp_id || selectedGpId}
            gpName={selectedLocation?.gp_name || 'Panchayat'}
            horizonYears={planningHorizon}
          />
        </div>
      </div>

      {/* Main Fullscreen GIS Map Area */}
      <div className="flex-1 w-full h-full relative">
        <MapView
          center={mapCenter}
          zoom={14}
          issues={issues}
          locations={locations}
          selectedGpId={selectedGpId}
          onSelectLocation={(loc) => selectLocation(loc)}
          className="w-full h-full rounded-none border-none"
        />
      </div>

      {/* Floating Bottom-Left Summary Drawer */}
      <div className="absolute bottom-6 left-4 z-[1000] max-w-sm w-[90%] sm:w-auto bg-slate-900/95 backdrop-blur-2xl p-3.5 rounded-3xl border border-slate-700/80 shadow-2xl space-y-2.5 transition-all">
        <div className="flex items-center justify-between gap-2 border-b border-slate-800 pb-2">
          <div className="flex items-center gap-2">
            <Sparkles className="w-4 h-4 text-emerald-400" />
            <span className="text-xs font-black text-white tracking-tight">
              {selectedLocation.gp_name} Live Intelligence
            </span>
          </div>
          <button
            type="button"
            onClick={() => setIsDrawerOpen(!isDrawerOpen)}
            className="text-slate-400 hover:text-white p-1 rounded-lg hover:bg-slate-800 cursor-pointer"
          >
            {isDrawerOpen ? <ChevronDown className="w-3.5 h-3.5" /> : <ChevronUp className="w-3.5 h-3.5" />}
          </button>
        </div>

        {isDrawerOpen && (
          <div className="space-y-2.5 animate-fadeIn">
            {/* Quick 4-Grid Census Indicators */}
            <div className="grid grid-cols-2 gap-1.5 text-[11px] bg-slate-950/80 p-2 rounded-2xl border border-slate-800">
              <div className="flex items-center gap-1.5 text-slate-300">
                <Users className="w-3.5 h-3.5 text-blue-400" />
                <span>Pop: <strong>{Number(selectedLocation.population || 5000).toLocaleString()}</strong></span>
              </div>
              <div className="flex items-center gap-1.5 text-slate-300">
                <Droplets className="w-3.5 h-3.5 text-cyan-400" />
                <span>Water: <strong>{Math.round((selectedLocation.daily_water_supply_liters || 300000) / 1000)}k LPD</strong></span>
              </div>
              <div className="flex items-center gap-1.5 text-slate-300">
                <GraduationCap className="w-3.5 h-3.5 text-purple-400" />
                <span>Classrooms: <strong>{selectedLocation.school_classrooms_count || 20}</strong></span>
              </div>
              <div className="flex items-center gap-1.5 text-slate-300">
                <Route className="w-3.5 h-3.5 text-orange-400" />
                <span>Roads: <strong>{selectedLocation.road_coverage_km || 25} km</strong></span>
              </div>
            </div>

            {/* Grievance Category Filter Pills */}
            <div className="space-y-1">
              <div className="flex items-center justify-between text-[10px] font-bold text-slate-400">
                <span>Filter Grievance Map:</span>
                <span className="text-emerald-400 font-mono">({issues.length} records)</span>
              </div>
              <div className="flex flex-wrap gap-1">
                {['ALL', 'Water Supply', 'Roads & Infrastructure', 'Education', 'Sanitation'].map((cat) => (
                  <button
                    key={cat}
                    type="button"
                    onClick={() => setCategoryFilter(cat)}
                    className={`px-2 py-0.5 rounded-lg text-[10px] font-semibold transition-all cursor-pointer ${
                      categoryFilter === cat
                        ? 'bg-emerald-600 text-white shadow-sm'
                        : 'bg-slate-950 text-slate-400 hover:text-white border border-slate-800'
                    }`}
                  >
                    {cat === 'ALL' ? 'All' : cat.split(' ')[0]}
                  </button>
                ))}
              </div>
            </div>

            {/* AI Assistant Quick Trigger Button */}
            <button
              type="button"
              onClick={onOpenChatbot}
              className="w-full py-2 px-3 rounded-xl bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white text-xs font-bold shadow-lg shadow-emerald-950/60 transition-all flex items-center justify-center gap-2 cursor-pointer active:scale-95"
            >
              <Bot className="w-4 h-4" />
              <span>Launch Village Assessment Assistant</span>
            </button>
          </div>
        )}
      </div>

      {/* Citizen Grievance Reporting Modal */}
      <IssueReportForm
        isOpen={isReportModalOpen}
        onClose={() => setIsReportModalOpen(false)}
        activeGpId={selectedLocation.gp_id}
        defaultCoords={mapCenter}
        onIssueCreated={handleIssueCreated}
      />
    </div>
  );
}

MapPage.propTypes = {
  onBackToDashboard: PropTypes.func.isRequired,
  onOpenChatbot: PropTypes.func,
};
