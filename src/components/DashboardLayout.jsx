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
import { useTheme } from '../context/ThemeContext';

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
  <div className="w-full h-full min-h-[400px] flex flex-col items-center justify-center p-8 bg-[var(--bg-card)] rounded-3xl border border-[var(--border-subtle)] space-y-3">
    <Loader2 className="w-8 h-8 text-emerald-400 animate-spin" />
    <span className="text-xs text-[var(--text-muted)] font-medium">{label}</span>
  </div>
);

function DashboardLayout() {
  const { user } = useAuth();
  const { activePalette } = useTheme();
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
      <div className="min-h-screen bg-[var(--bg-primary)] text-[var(--text-main)] flex flex-col selection:bg-emerald-500 selection:text-white transition-colors duration-200">
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
    <div className="min-h-screen bg-[var(--bg-primary)] text-[var(--text-main)] flex flex-col selection:bg-emerald-500 selection:text-white transition-colors duration-200">
      {/* ------------------------------------------------------------------- */}
      {/* Navigation Header */}
      {/* ------------------------------------------------------------------- */}
      <Header onOpenReportModal={() => setIsReportModalOpen(true)} />

      {/* ------------------------------------------------------------------- */}
      {/* Main Dashboard Container */}
      {/* ------------------------------------------------------------------- */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-6 space-y-6">
        {/* Citizen Portal Welcome & Contextual Status */}
        <div className="flex flex-wrap items-center justify-between gap-3 px-4 py-2.5 rounded-xl border text-xs bg-emerald-500/10 border-emerald-500/30 text-emerald-600 dark:text-emerald-300 backdrop-blur-md">
          <div className="flex items-center gap-2">
            <UserIcon className="w-4 h-4 text-emerald-500 flex-shrink-0" />
            <span>
              <strong>Citizen Portal:</strong> Welcome, {user?.name || 'Resident'} ({user?.email}) • Active Multi-Location GPDP Planning &amp; Grievance Access
            </span>
          </div>
          <div className="flex items-center gap-2 text-[11px] text-[var(--text-muted)]">
            <span className="inline-block w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
            <span>PostGIS Cluster Active</span>
          </div>
        </div>

        {/* 1. CENTRAL HERO SEARCH CIRCLE */}
        <HeroSearchCircle onNavigateToMap={handleNavigateToMap} />

        {/* 2. Active GP Banner with Rich Dynamic Statistics */}
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 bg-[var(--bg-card)] border border-[var(--border-subtle)] rounded-3xl p-5 sm:p-6 backdrop-blur-xl shadow-xl">
          <div className="flex items-start gap-4">
            <div className="w-12 h-12 rounded-2xl bg-gradient-to-tr from-emerald-600 to-teal-400 border border-emerald-400/40 flex items-center justify-center text-white shadow-lg shadow-emerald-950/40 flex-shrink-0">
              <Building2 className="w-6 h-6" />
            </div>
            <div className="space-y-1">
              <div className="flex flex-wrap items-center gap-2">
                <h2 className="text-lg sm:text-xl font-black text-[var(--text-main)] tracking-tight">
                  {selectedLocation.gp_name} Gram Panchayat
                </h2>
                <span className="text-xs font-mono font-bold px-2 py-0.5 rounded-lg bg-emerald-500/15 text-emerald-600 dark:text-emerald-300 border border-emerald-500/30">
                  {selectedLocation.gp_code || `GP-${selectedLocation.gp_id}`}
                </span>
                <span className="text-xs px-2.5 py-0.5 rounded-full bg-[var(--bg-primary)] text-[var(--text-muted)] border border-[var(--border-subtle)] font-medium">
                  {selectedLocation.district} District, {selectedLocation.state}
                </span>
              </div>
              {selectedLocation.tagline && (
                <p className="text-xs text-emerald-600 dark:text-emerald-300/90 font-medium italic">
                  &ldquo;{selectedLocation.tagline}&rdquo;
                </p>
              )}
              {selectedLocation.description && (
                <p className="text-xs text-[var(--text-muted)] max-w-3xl leading-relaxed">
                  {selectedLocation.description}
                </p>
              )}
            </div>
          </div>

          {/* Quick Metrics Badges & Action Controls */}
          <div className="flex flex-wrap items-center gap-2.5 self-start lg:self-center border-t lg:border-t-0 pt-3 lg:pt-0 border-[var(--border-subtle)]">
            {/* Launch Dedicated Map Page Button */}
            <button
              type="button"
              onClick={handleNavigateToMap}
              className="px-3.5 py-2 rounded-xl bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white text-xs font-bold shadow-md shadow-emerald-950/40 transition-all flex items-center gap-1.5 cursor-pointer active:scale-95"
            >
              <Compass className="w-3.5 h-3.5" />
              <span>Fullscreen Map</span>
            </button>

            {/* Launch AI Assessment Assistant */}
            <button
              type="button"
              onClick={handleOpenChatbot}
              className="px-3.5 py-2 rounded-xl bg-[var(--bg-primary)] hover:bg-[var(--bg-card-hover)] text-emerald-600 dark:text-emerald-300 border border-[var(--border-subtle)] transition-all flex items-center gap-1.5 text-xs font-bold shadow-sm cursor-pointer active:scale-95"
            >
              <Bot className="w-3.5 h-3.5 text-emerald-500" />
              <span>AI Assistant</span>
            </button>

            {/* Refresh Button */}
            <button
              onClick={() => {
                loadAnalytics();
                loadIssues();
              }}
              className="p-2 rounded-xl bg-[var(--bg-primary)] hover:bg-[var(--bg-card-hover)] text-[var(--text-muted)] hover:text-[var(--text-main)] border border-[var(--border-subtle)] transition-all flex items-center gap-1.5 text-xs font-semibold shadow-sm cursor-pointer active:scale-95"
              title="Refresh village analytics and grievances"
            >
              <RefreshCw
                className={`w-3.5 h-3.5 ${
                  loadingAnalytics || loadingIssues ? 'animate-spin text-emerald-500' : ''
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
                <MapPin className="w-4 h-4 text-emerald-500" />
                <h3 className="text-sm font-bold text-[var(--text-main)]">
                  Geospatial Grievance Map (PostGIS)
                </h3>
                <span className="text-xs font-mono text-[var(--text-muted)]">
                  ({issues.length} records)
                </span>
              </div>

              <button
                type="button"
                onClick={handleNavigateToMap}
                className="text-xs text-emerald-600 dark:text-emerald-400 hover:underline font-bold flex items-center gap-1 cursor-pointer"
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
                className="border-[var(--border-subtle)] shadow-2xl h-[480px]"
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
      <footer className="mt-auto border-t border-[var(--border-subtle)] bg-[var(--bg-card)] py-4 text-center text-xs text-[var(--text-muted)]">
        <div className="max-w-7xl mx-auto px-4 flex flex-wrap items-center justify-between gap-2">
          <p>© 2026 GramPulse AI • Ministry of Panchayati Raj Predictive Governance Platform</p>
          <div className="flex items-center gap-4 text-[var(--text-subtle)]">
            <span className="flex items-center gap-1">
              <ShieldCheck className="w-3.5 h-3.5 text-emerald-500" /> PostGIS SRID: 4326
            </span>
            <span className="flex items-center gap-1">
              <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500" /> RAG Scheme Engine Active
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
