import React, {
  useState,
  lazy,
  Suspense,
  useCallback,
} from 'react';

import {
  Compass,
  RefreshCw,
  MapPin,
  ShieldCheck,
  CheckCircle2,
  User as UserIcon,
  Building2,
  ArrowRight,
  Bot,
  Loader2,
  TrendingUp,
  Sparkles,
  Landmark,
} from 'lucide-react';

import { useAuth } from '../context/AuthContext';
import { useLocation } from '../context/LocationContext';
import { useTheme } from '../context/ThemeContext';

import Header from './Header';
import AnalyticsPanel from './AnalyticsPanel';
import SchemeRecommendations from './SchemeRecommendations';
import HeroSearchCircle from './HeroSearchCircle';

/*
 * ============================================================
 * LAZY LOADED COMPONENTS
 * ============================================================
 */

const MapView = lazy(() => import('./MapView'));

const MapPage = lazy(() => import('./MapPage'));

const SuitableGovernmentSchemesAssistant = lazy(
  () => import('./SuitableGovernmentSchemesAssistant/SuitableGovernmentSchemesAssistant')
);

const IssueReportForm = lazy(() => import('./IssueReportForm'));

/*
 * IMPORTANT:
 * FuturePredictionPage is lazy-loaded here.
 *
 * DO NOT import it normally at the top of this file.
 *
 * ❌ import FuturePredictionPage from './FuturePredictionPage';
 *
 * We only use this lazy declaration.
 */
const FuturePredictionPage = lazy(
  () => import('./FuturePredictionPage')
);

/*
 * ============================================================
 * LOADING COMPONENT
 * ============================================================
 */

const ComponentLoader = ({
  label = 'Loading...',
}) => (
  <div className="w-full h-full min-h-[400px] flex flex-col items-center justify-center p-8 bg-[var(--bg-card)] rounded-3xl border border-[var(--border-subtle)] space-y-3">
    <Loader2 className="w-8 h-8 text-emerald-400 animate-spin" />

    <span className="text-xs text-[var(--text-muted)] font-medium">
      {label}
    </span>
  </div>
);

/*
 * ============================================================
 * DASHBOARD LAYOUT
 * ============================================================
 */

function DashboardLayout() {
  const { user } = useAuth();

  const { activePalette } = useTheme();

  const {
    locations,
    selectedLocation,
    selectedGpId,
    mapCenter,
    selectLocation,

    analytics,
    loadingAnalytics,

    issues,
    loadingIssues,

    infrastructure,

    isReportModalOpen,
    setIsReportModalOpen,

    loadAnalytics,
    loadIssues,
    handleIssueCreated,

    activeTab,
    setActiveTab,
  } = useLocation();

  /*
   * ==========================================================
   * CHATBOT STATE
   * ==========================================================
   */

  const [isChatbotOpen, setIsChatbotOpen] = useState(false);

  /*
   * ==========================================================
   * MAP NAVIGATION
   * ==========================================================
   */

  const handleNavigateToMap = useCallback(() => {
    setIsChatbotOpen(false);

    setActiveTab('map');

    if (typeof window !== 'undefined') {
      window.scrollTo({
        top: 0,
        behavior: 'smooth',
      });
    }
  }, [setActiveTab]);

  const [predictionInitialMode, setPredictionInitialMode] = useState('selected');

  /*
   * ==========================================================
   * FUTURE PREDICTION NAVIGATION
   * ==========================================================
   */

  const handleNavigateToPrediction = useCallback((mode = 'selected') => {
    setIsChatbotOpen(false);
    setPredictionInitialMode(mode);
    setActiveTab('prediction');

    if (typeof window !== 'undefined') {
      window.scrollTo({
        top: 0,
        behavior: 'smooth',
      });
    }
  }, [setActiveTab]);

  /*
   * ==========================================================
   * CHATBOT FUNCTIONS
   * ==========================================================
   */

  const handleOpenChatbot = useCallback(() => {
    setIsChatbotOpen(true);
  }, []);

  const handleCloseChatbot = useCallback(() => {
    setIsChatbotOpen(false);
  }, []);

  const handleToggleChatbot = useCallback(() => {
    setIsChatbotOpen((previous) => !previous);
  }, []);

  /*
   * ==========================================================
   * FUTURE PREDICTION PAGE
   * ==========================================================
   */

  if (activeTab === 'prediction') {
    return (
      <div className="min-h-screen bg-[var(--bg-primary)] text-[var(--text-main)] flex flex-col">
        <Header
          onOpenReportModal={() =>
            setIsReportModalOpen(true)
          }
        />

        <Suspense
          fallback={
            <div className="flex-1 flex items-center justify-center p-8">
              <ComponentLoader
                label="Loading Future Prediction..."
              />
            </div>
          }
        >
          <FuturePredictionPage
            selectedLocation={selectedLocation}
            analytics={analytics}
            infrastructure={infrastructure}
            initialMode={predictionInitialMode}
            onBackToDashboard={() =>
              setActiveTab('dashboard')
            }
          />
        </Suspense>
      </div>
    );
  }

  /*
   * ==========================================================
   * FULLSCREEN MAP PAGE
   * ==========================================================
   */

  if (activeTab === 'map') {
    return (
      <div className="min-h-screen bg-[var(--bg-primary)] text-[var(--text-main)] flex flex-col selection:bg-emerald-500 selection:text-white transition-colors duration-200">

        <Header
          onOpenReportModal={() =>
            setIsReportModalOpen(true)
          }
        />

        <Suspense
          fallback={
            <ComponentLoader
              label="Loading High-Resolution Satellite Map..."
            />
          }
        >
          <MapPage
            onBackToDashboard={() =>
              setActiveTab('dashboard')
            }
            onOpenChatbot={handleOpenChatbot}
          />

          <SuitableGovernmentSchemesAssistant
            isOpen={isChatbotOpen}
            onClose={handleCloseChatbot}
            onToggle={handleToggleChatbot}
            onNavigateToPrediction={handleNavigateToPrediction}
          />
        </Suspense>
      </div>
    );
  }

  /*
   * ==========================================================
   * DASHBOARD OVERVIEW
   * ==========================================================
   */

  return (
    <div className="min-h-screen bg-[var(--bg-primary)] text-[var(--text-main)] flex flex-col selection:bg-emerald-500 selection:text-white transition-colors duration-200">

      {/* ======================================================
          HEADER
      ====================================================== */}

      <Header
        onOpenReportModal={() =>
          setIsReportModalOpen(true)
        }
      />

      {/* ======================================================
          MAIN DASHBOARD
      ====================================================== */}

      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-6 space-y-6">

        {/* ====================================================
            CITIZEN PORTAL
        ==================================================== */}

        <div
          className="flex flex-wrap items-center justify-between gap-3 px-4 py-2.5 rounded-xl border text-xs backdrop-blur-md"
          style={{
            backgroundColor:
              `${activePalette.primary}12`,
            borderColor:
              `${activePalette.primary}30`,
            color:
              activePalette.primary,
          }}
        >
          <div className="flex items-center gap-2">

            <UserIcon
              className="w-4 h-4 flex-shrink-0"
              style={{
                color:
                  activePalette.primary,
              }}
            />

            <span>
              <strong>
                Citizen Portal:
              </strong>{' '}

              Welcome,{' '}
              {user?.name || 'Resident'}{' '}

              ({user?.email}) • Active
              Multi-Location GPDP Planning
              &amp; Grievance Access
            </span>
          </div>

          <div className="flex items-center gap-2 text-[11px] text-[var(--text-muted)]">

            <span
              className="inline-block w-1.5 h-1.5 rounded-full animate-pulse"
              style={{
                backgroundColor:
                  activePalette.primary,
              }}
            />

            <span>
              PostGIS Cluster Active
            </span>
          </div>
        </div>

        {/* ====================================================
            HERO SEARCH
        ==================================================== */}

        <HeroSearchCircle
          onNavigateToMap={
            handleNavigateToMap
          }
        />

        {/* ====================================================
            ACTIVE GP BANNER
        ==================================================== */}

        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 bg-[var(--bg-card)] border border-[var(--border-subtle)] rounded-3xl p-5 sm:p-6 backdrop-blur-xl shadow-xl">

          <div className="flex items-start gap-4">

            <div
              className="w-12 h-12 rounded-2xl border border-white/10 flex items-center justify-center text-white shadow-lg flex-shrink-0"
              style={{
                background:
                  `linear-gradient(135deg, ${activePalette.primary}, ${activePalette.secondary})`,
                boxShadow:
                  `0 10px 25px -5px ${activePalette.primary}50`,
              }}
            >
              <Building2 className="w-6 h-6" />
            </div>

            <div className="space-y-1">

              <div className="flex flex-wrap items-center gap-2">

                <h2 className="text-lg sm:text-xl font-black text-[var(--text-main)] tracking-tight">

                  {String(selectedLocation?.gp_name || 'Active Habitation')
                    .toLowerCase()
                    .includes('panchayat') ||
                  String(selectedLocation?.gp_name || '')
                    .toLowerCase()
                    .includes('city') ||
                  String(selectedLocation?.gp_name || '')
                    .toLowerCase()
                    .includes('municipality')
                    ? (selectedLocation?.gp_name || 'Active Habitation')
                    : `${selectedLocation?.gp_name || 'Active Habitation'} Gram Panchayat`}

                </h2>

                <span
                  className="text-xs font-mono font-bold px-2 py-0.5 rounded-lg border"
                  style={{
                    backgroundColor:
                      `${activePalette.primary}15`,
                    color:
                      activePalette.primary,
                    borderColor:
                      `${activePalette.primary}30`,
                  }}
                >
                  {selectedLocation?.gp_code ||
                    `GP-${selectedLocation?.gp_id || 101}`}
                </span>

                <span className="text-xs px-2.5 py-0.5 rounded-full bg-[var(--bg-primary)] text-[var(--text-muted)] border border-[var(--border-subtle)] font-medium">
                  {selectedLocation?.district || 'District'}{' '}
                  District,{' '}
                  {selectedLocation?.state || 'Tamil Nadu'}
                </span>

                {selectedLocation?.isOfficialData && (
                  <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 flex items-center gap-1">
                    <Sparkles className="w-3 h-3 text-emerald-400" />
                    <span>Official Census &amp; MoPR Calibrated</span>
                  </span>
                )}

              </div>

              {selectedLocation?.tagline && (
                <p
                  className="text-xs font-medium italic"
                  style={{
                    color:
                      activePalette.primary,
                  }}
                >
                  &ldquo;
                  {selectedLocation.tagline}
                  &rdquo;
                </p>
              )}

              {selectedLocation?.description && (
                <p className="text-xs text-[var(--text-muted)] max-w-3xl leading-relaxed">
                  {selectedLocation.description}
                </p>
              )}

            </div>
          </div>

          {/* ==================================================
              ACTION BUTTONS
          ================================================== */}

          <div className="flex flex-wrap items-center gap-2.5 self-start lg:self-center border-t lg:border-t-0 pt-3 lg:pt-0 border-[var(--border-subtle)]">

            {/* FULLSCREEN MAP */}

            <button
              type="button"
              onClick={
                handleNavigateToMap
              }
              className="px-3.5 py-2 rounded-xl text-white text-xs font-bold shadow-md transition-all flex items-center gap-1.5 cursor-pointer active:scale-95"
              style={{
                background:
                  `linear-gradient(135deg, ${activePalette.primary}, ${activePalette.secondary})`,
              }}
            >
              <Compass className="w-3.5 h-3.5" />

              <span>
                Fullscreen Map
              </span>
            </button>

            {/* ==================================================
                FUTURE PREDICTION
            ================================================== */}

            <button
              type="button"
              onClick={
                handleNavigateToPrediction
              }
              className="px-3.5 py-2 rounded-xl bg-[var(--bg-primary)] hover:bg-[var(--bg-card-hover)] border border-[var(--border-subtle)] transition-all flex items-center gap-1.5 text-xs font-bold shadow-sm cursor-pointer active:scale-95"
              style={{
                color:
                  activePalette.primary,
              }}
            >
              <TrendingUp
                className="w-3.5 h-3.5"
                style={{
                  color:
                    activePalette.primary,
                }}
              />

              <span>
                Future Prediction
              </span>
            </button>

            {/* GOVERNMENT SCHEMES */}

            <button
              type="button"
              onClick={
                handleOpenChatbot
              }
              className="px-3.5 py-2 rounded-xl bg-[var(--bg-primary)] hover:bg-[var(--bg-card-hover)] border border-[var(--border-subtle)] transition-all flex items-center gap-1.5 text-xs font-bold shadow-sm cursor-pointer active:scale-95"
              style={{
                color:
                  activePalette.primary,
              }}
            >
              <Landmark
                className="w-3.5 h-3.5"
                style={{
                  color:
                    activePalette.primary,
                }}
              />

              <span>
                Government Schemes
              </span>
            </button>

            {/* REFRESH */}

            <button
              type="button"
              onClick={() => {
                loadAnalytics();
                loadIssues();
              }}
              className="p-2 rounded-xl bg-[var(--bg-primary)] hover:bg-[var(--bg-card-hover)] text-[var(--text-muted)] hover:text-[var(--text-main)] border border-[var(--border-subtle)] transition-all flex items-center gap-1.5 text-xs font-semibold shadow-sm cursor-pointer active:scale-95"
              title="Refresh village analytics and grievances"
            >
              <RefreshCw
                className={`w-3.5 h-3.5 ${
                  loadingAnalytics ||
                  loadingIssues
                    ? 'animate-spin'
                    : ''
                }`}
                style={{
                  color:
                    loadingAnalytics ||
                    loadingIssues
                      ? activePalette.primary
                      : undefined,
                }}
              />
            </button>

          </div>
        </div>

        {/* ====================================================
            ANALYTICS
        ==================================================== */}

        <AnalyticsPanel
          analytics={analytics}
          infrastructure={infrastructure}
          loading={loadingAnalytics}
        />

        {/* ====================================================
            MAP + SCHEMES
        ==================================================== */}

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">

          {/* MAP */}

          <div className="lg:col-span-7 space-y-3">

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
                onClick={
                  handleNavigateToMap
                }
                className="text-xs text-emerald-600 dark:text-emerald-400 hover:underline font-bold flex items-center gap-1 cursor-pointer"
              >
                <span>
                  Expand Full Map
                </span>

                <ArrowRight className="w-3 h-3" />
              </button>

            </div>

            <Suspense
              fallback={
                <ComponentLoader
                  label="Rendering PostGIS GIS Map..."
                />
              }
            >
              <MapView
                center={mapCenter}
                zoom={13}
                issues={issues}
                locations={locations}
                infrastructure={infrastructure}
                selectedLocation={selectedLocation}
                selectedGpId={selectedGpId}
                onSelectLocation={(loc) =>
                  selectLocation(
                    loc,
                    false
                  )
                }
                onAnalyzeLocation={(loc) => {

                  selectLocation(
                    loc,
                    false
                  );

                  if (
                    typeof window !==
                    'undefined'
                  ) {
                    window.scrollTo({
                      top: 0,
                      behavior:
                        'smooth',
                    });
                  }

                }}
                className="border-[var(--border-subtle)] shadow-2xl h-[480px]"
              />
            </Suspense>

          </div>

          {/* SCHEMES */}

          <div className="lg:col-span-5">

            <SchemeRecommendations
              schemes={
                analytics?.matched_schemes ||
                []
              }
              loading={
                loadingAnalytics
              }
            />

          </div>

        </div>

      </main>

      {/* ======================================================
          FOOTER
      ====================================================== */}

      <footer className="mt-auto border-t border-[var(--border-subtle)] bg-[var(--bg-card)] py-4 text-center text-xs text-[var(--text-muted)]">

        <div className="max-w-7xl mx-auto px-4 flex flex-wrap items-center justify-between gap-2">

          <p>
            © 2026 GramPulse AI • Ministry of Panchayati Raj Predictive Governance Platform
          </p>

          <div className="flex items-center gap-4 text-[var(--text-subtle)]">

            <span className="flex items-center gap-1">

              <ShieldCheck className="w-3.5 h-3.5 text-emerald-500" />

              PostGIS SRID: 4326

            </span>

            <span className="flex items-center gap-1">

              <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500" />

              RAG Scheme Engine Active

            </span>

          </div>

        </div>

      </footer>

      {/* ======================================================
          MODALS / CHATBOT
      ====================================================== */}

      <Suspense fallback={null}>

        <IssueReportForm
          isOpen={
            isReportModalOpen
          }
          onClose={() =>
            setIsReportModalOpen(
              false
            )
          }
          activeGpId={
            selectedLocation?.gp_id || 101
          }
          defaultCoords={
            mapCenter
          }
          onIssueCreated={
            handleIssueCreated
          }
        />

        <SuitableGovernmentSchemesAssistant
          isOpen={
            isChatbotOpen
          }
          onClose={
            handleCloseChatbot
          }
          onToggle={
            handleToggleChatbot
          }
          onNavigateToPrediction={
            handleNavigateToPrediction
          }
        />

      </Suspense>

    </div>
  );
}

export default React.memo(
  DashboardLayout
);