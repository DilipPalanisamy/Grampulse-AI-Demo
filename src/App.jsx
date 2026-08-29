import React from 'react';
import { AuthProvider, useAuth } from './context/AuthContext';
import { LocationProvider } from './context/LocationContext';
import { ThemeProvider } from './context/ThemeContext';
import LoginPage from './components/LoginPage';
import DashboardLayout from './components/DashboardLayout';
import LiveBackgroundCanvas from './components/LiveBackgroundCanvas';
import ThemeCustomizer from './components/ThemeCustomizer';
import { Loader2, Sparkles, AlertTriangle, RefreshCw } from 'lucide-react';

class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error) {
    return { hasError: true, error };
  }

  componentDidCatch(error, errorInfo) {
    console.error('GramPulse Application Error:', error, errorInfo);
  }

  handleReload = () => {
    localStorage.removeItem('grampulse_citizen_session');
    window.location.reload();
  };

  render() {
    if (this.state.hasError) {
      return (
        <div className="min-h-screen bg-slate-950 flex flex-col items-center justify-center p-6 text-slate-100 text-center">
          <div className="max-w-md w-full bg-slate-900 border border-slate-800 rounded-3xl p-8 shadow-2xl space-y-4">
            <div className="w-14 h-14 mx-auto rounded-2xl bg-rose-500/15 border border-rose-500/30 flex items-center justify-center text-rose-400">
              <AlertTriangle className="w-7 h-7" />
            </div>
            <h2 className="text-lg font-black text-white">Something went wrong</h2>
            <p className="text-xs text-slate-400 leading-relaxed">
              GramPulse encountered an unexpected runtime error while loading assets.
            </p>
            <div className="pt-2">
              <button
                type="button"
                onClick={this.handleReload}
                className="w-full py-2.5 px-4 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold transition-all shadow-md active:scale-95 flex items-center justify-center gap-2 cursor-pointer"
              >
                <RefreshCw className="w-4 h-4" />
                <span>Reload Application</span>
              </button>
            </div>
          </div>
        </div>
      );
    }
    return this.props.children;
  }
}

function AppContent() {
  const { isAuthenticated, loading } = useAuth();

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-950 flex flex-col items-center justify-center text-slate-100 space-y-4">
        <div className="w-12 h-12 rounded-2xl bg-gradient-to-tr from-emerald-600 to-teal-400 flex items-center justify-center text-white shadow-xl shadow-emerald-950/60 animate-bounce">
          <Sparkles className="w-6 h-6" />
        </div>
        <div className="flex items-center gap-2 text-sm text-slate-400">
          <Loader2 className="w-4 h-4 text-emerald-400 animate-spin" />
          <span>Initializing GramPulse AI Governance Platform...</span>
        </div>
      </div>
    );
  }

  return (
    <>
      {/* Interactive Global Animated Background Canvas (z-0) */}
      <LiveBackgroundCanvas />

      {/* Main Route Content */}
      <div className="relative z-10">
        {!isAuthenticated ? (
          <LoginPage />
        ) : (
          <LocationProvider>
            <DashboardLayout />
          </LocationProvider>
        )}
      </div>

      {/* Slide-out Theme Customizer Drawer & Floating Launcher */}
      <ThemeCustomizer />
    </>
  );
}

export default function App() {
  return (
    <ErrorBoundary>
      <ThemeProvider>
        <AuthProvider>
          <AppContent />
        </AuthProvider>
      </ThemeProvider>
    </ErrorBoundary>
  );
}
