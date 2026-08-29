import React, { useState, lazy, Suspense, useCallback } from 'react';
import {
  Compass,
  RefreshCw,
  MapPin,
  ShieldCheck,
  CheckCircle2,
  User as UserIcon,
  Sparkles,
  Building2,
  Droplets,
  Users,
  Route,
  GraduationCap,
  ArrowRight,
  Bot,
  Loader2,
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { useLocation } from '../context/LocationContext';

import Header from './Header';
import AnalyticsPanel from './AnalyticsPanel';
import SchemeRecommendations from './SchemeRecommendations';
import HeroSearchCircle from './HeroSearchCircle';

// Lazy-loaded heavy components for instant initial page loads
const MapView = lazy(() => import('./MapView'));
const MapPage = lazy(() => import('./MapPage'));
const VillageChatbot = lazy(() => import('./VillageChatbot'));
const IssueReportForm = lazy(() => import('./IssueReportForm'));

// Loading Fallback Spinner
const ComponentLoader = ({ label = 'Loading geospatial layers...' }) => (
  <div className="w-full h-full min-h-[400px] flex flex-col items-center justify-center p-8 bg-slate-900/60 rounded-3xl border border-slate-800 space-y-3">
    <Loader2 className="w-8 h-8 text-emerald-400 animate-spin" />
    <span className="text-xs text-slate-400 font-medium">{label}</span>
  </div>
);

function DashboardLayout() {
  const { user } = useAuth();
  const {
    locations,
    selectedLocation,
    selectedGpId,
    mapCenter,
    selectLocation,
    planningHorizon,
    setPlanningHorizon,
    analytics,
    loadingAnalytics,
    issues,
    loadingIssues,
    infrastructure,
    categoryFilter,
    setCategoryFilter,
    isReportModalOpen,
    setIsReportModalOpen,
    loadAnalytics,
    loadIssues,
    handleIssueCreated,
    activeTab,
    setActiveTab,
  } = useLocation();

  const [isChatbotOpen, setIsChatbotOpen] = useState(false);

  const handleNavigateToMap = useCallback(() => {
    setActiveTab('map');
  }, [setActiveTab]);

  const handleOpenChatbot = useCallback(() => {
    setIsChatbotOpen(true);
  }, []);

  const handleCloseChatbot = useCallback(() => {
    setIsChatbotOpen(false);
  }, []);

  const handleToggleChatbot = useCallback(() => {
    setIsChatbotOpen((prev) => !prev);
  }, []);

  // If user selected Dedicated Fullscreen Map View
  if (activeTab === 'map') {
    return (
      <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col selection:bg-emerald-500 selection:text-white">
        <Header onOpenReportModal={() => setIsReportModalOpen(true)} />
        <Suspense fallback={<ComponentLoader label="Loading High-Resolution Satellite Map..." />}>
          <MapPage
            onBackToDashboard={() => setActiveTab('dashboard')}
            onOpenChatbot={handleOpenChatbot}
          />
          {/* Floating Village AI Assistant */}
          <VillageChatbot
            isOpen={isChatbotOpen}
            onClose={handleCloseChatbot}
            onToggle={handleToggleChatbot}
          />
        </Suspense>
      </div>
    );
  }

  // Dashboard Overview Mode
  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col selection:bg-emerald-500 selection:text-white">
      {/* ------------------------------------------------------------------- */}
      {/* Navigation Header */}
      {/* ------------------------------------------------------------------- */}
      <Header onOpenReportModal={() => setIsReportModalOpen(true)} />

      {/* ------------------------------------------------------------------- */}
      {/* Main Dashboard Container */}
      {/* ------------------------------------------------------------------- */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-6 space-y-6">
        {/* Citizen Portal Welcome & Contextual Status */}
        <div className="flex flex-wrap items-center justify-between gap-3 px-4 py-2.5 rounded-xl border text-xs bg-emerald-950/20 border-emerald-500/30 text-emerald-300 backdrop-blur-md">
          <div className="flex items-center gap-2">
            <UserIcon className="w-4 h-4 text-emerald-400 flex-shrink-0" />
            <span>
              <strong>Citizen Portal:</strong> Welcome, {user?.name || 'Resident'} ({user?.email}) • Active Multi-Location GPDP Planning & Grievance Access
            </span>
          </div>
          <div className="flex items-center gap-2 text-[11px] text-slate-400">
            <span className="inline-block w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
            <span>PostGIS Cluster Active</span>
          </div>
        </div>

        {/* 1. CENTRAL HERO SEARCH CIRCLE */}
        <HeroSearchCircle onNavigateToMap={handleNavigateToMap} />

        {/* 2. Active GP Banner with Rich Dynamic Statistics */}
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 bg-gradient-to-r from-emerald-950/50 via-slate-900/70 to-slate-900/50 border border-emerald-500/30 rounded-3xl p-5 sm:p-6 backdrop-blur-xl shadow-2xl">
          <div className="flex items-start gap-4">
            <div className="w-12 h-12 rounded-2xl bg-gradient-to-tr from-emerald-600 to-teal-400 border border-emerald-400/40 flex items-center justify-center text-white shadow-lg shadow-emerald-950/60 flex-shrink-0">
              <Building2 className="w-6 h-6" />
            </div>
            <div className="space-y-1">
              <div className="flex flex-wrap items-center gap-2">
                <h2 className="text-lg sm:text-xl font-black text-white tracking-tight">
                  {selectedLocation.gp_name} Gram Panchayat
                </h2>
                <span className="text-xs font-mono font-bold px-2 py-0.5 rounded-lg bg-emerald-500/15 text-emerald-300 border border-emerald-500/30">
                  {selectedLocation.gp_code || `GP-${selectedLocation.gp_id}`}
                </span>
                <span className="text-xs px-2.5 py-0.5 rounded-full bg-slate-800 text-slate-300 border border-slate-700 font-medium">
                  {selectedLocation.district} District, {selectedLocation.state}
                </span>
              </div>
              {selectedLocation.tagline && (
                <p className="text-xs text-emerald-300/90 font-medium italic">
                  &ldquo;{selectedLocation.tagline}&rdquo;
                </p>
              )}
              {selectedLocation.description && (
                <p className="text-xs text-slate-400 max-w-3xl leading-relaxed">
                  {selectedLocation.description}
                </p>
              )}
            </div>
          </div>

          {/* Quick Metrics Badges & Action Controls */}
          <div className="flex flex-wrap items-center gap-2.5 self-start lg:self-center border-t lg:border-t-0 pt-3 lg:pt-0 border-slate-800">
            {/* Launch Dedicated Map Page Button */}
            <button
              type="button"
              onClick={handleNavigateToMap}
              className="px-3.5 py-2 rounded-xl bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white text-xs font-bold shadow-md shadow-emerald-950/60 transition-all flex items-center gap-1.5 cursor-pointer active:scale-95"
            >
              <Compass className="w-3.5 h-3.5" />
              <span>Fullscreen Map</span>
            </button>

            {/* Launch AI Assessment Assistant */}
            <button
              type="button"
              onClick={handleOpenChatbot}
              className="px-3.5 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-emerald-300 hover:text-white border border-slate-700 transition-all flex items-center gap-1.5 text-xs font-bold shadow-sm cursor-pointer active:scale-95"
            >
              <Bot className="w-3.5 h-3.5 text-emerald-400" />
              <span>AI Assistant</span>
            </button>

            {/* Refresh Button */}
            <button
              onClick={() => {
                loadAnalytics();
                loadIssues();
              }}
              className="p-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white border border-slate-700 transition-all flex items-center gap-1.5 text-xs font-semibold shadow-sm cursor-pointer active:scale-95"
              title="Refresh village analytics and grievances"
            >
              <RefreshCw
                className={`w-3.5 h-3.5 ${
                  loadingAnalytics || loadingIssues ? 'animate-spin text-emerald-400' : ''
                }`}
              />
            </button>
          </div>
        </div>

        {/* 3. Analytics & Predictive Deficit Metric Cards */}
        <AnalyticsPanel
          analytics={analytics}
          infrastructure={infrastructure}
          loading={loadingAnalytics}
        />

        {/* 4. Interactive Map Preview & AI Scheme Recommendations Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          {/* Left Column (7 cols): Map Preview */}
          <div className="lg:col-span-7 space-y-3">
            {/* Map Header & Action */}
            <div className="flex flex-wrap items-center justify-between gap-2 px-1">
              <div className="flex items-center gap-2">
                <MapPin className="w-4 h-4 text-emerald-400" />
                <h3 className="text-sm font-bold text-white">
                  Geospatial Grievance Map (PostGIS)
                </h3>
                <span className="text-xs font-mono text-slate-400">
                  ({issues.length} records)
                </span>
              </div>

              <button
                type="button"
                onClick={handleNavigateToMap}
                className="text-xs text-emerald-400 hover:text-emerald-300 font-bold flex items-center gap-1 hover:underline cursor-pointer"
              >
                <span>Expand Full Map</span>
                <ArrowRight className="w-3 h-3" />
              </button>
            </div>

            {/* Interactive Leaflet MapView (Lazy Loaded) */}
            <Suspense fallback={<ComponentLoader label="Rendering PostGIS GIS Map..." />}>
              <MapView
                center={mapCenter}
                zoom={13}
                issues={issues}
                locations={locations}
                infrastructure={infrastructure}
                selectedLocation={selectedLocation}
                selectedGpId={selectedGpId}
                onSelectLocation={(loc) => selectLocation(loc)}
                className="border-slate-800/80 shadow-2xl h-[480px]"
              />
            </Suspense>
          </div>

          {/* Right Column (5 cols): AI-Matched Schemes (RAG) */}
          <div className="lg:col-span-5">
            <SchemeRecommendations
              schemes={analytics?.matched_schemes || []}
              loading={loadingAnalytics}
            />
          </div>
        </div>
      </main>

      {/* ------------------------------------------------------------------- */}
      {/* Footer */}
      {/* ------------------------------------------------------------------- */}
      <footer className="mt-auto border-t border-slate-800/80 bg-slate-900/40 py-4 text-center text-xs text-slate-500">
        <div className="max-w-7xl mx-auto px-4 flex flex-wrap items-center justify-between gap-2">
          <p>© 2026 GramPulse AI • Ministry of Panchayati Raj Predictive Governance Platform</p>
          <div className="flex items-center gap-4 text-slate-400">
            <span className="flex items-center gap-1">
              <ShieldCheck className="w-3.5 h-3.5 text-emerald-400" /> PostGIS SRID: 4326
            </span>
            <span className="flex items-center gap-1">
              <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" /> RAG Scheme Engine Active
            </span>
          </div>
        </div>
      </footer>

      {/* ------------------------------------------------------------------- */}
      {/* Citizen Grievance Reporting Modal (Lazy Loaded) */}
      {/* ------------------------------------------------------------------- */}
      <Suspense fallback={null}>
        <IssueReportForm
          isOpen={isReportModalOpen}
          onClose={() => setIsReportModalOpen(false)}
          activeGpId={selectedLocation.gp_id}
          defaultCoords={mapCenter}
          onIssueCreated={handleIssueCreated}
        />

        {/* Floating Interactive Village Assessment AI Chatbot (Lazy Loaded) */}
        <VillageChatbot
          isOpen={isChatbotOpen}
          onClose={handleCloseChatbot}
          onToggle={handleToggleChatbot}
        />
      </Suspense>
    </div>
  );
}

export default React.memo(DashboardLayout);
