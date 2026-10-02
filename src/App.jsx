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
    this.state = { hasError: false, error: null, showDetails: false };
  }

  static getDerivedStateFromError(error) {
    return { hasError: true, error };
  }

  componentDidCatch(error, errorInfo) {
    console.error('GramPulse Application Runtime Caught:', error, errorInfo);
  }

  handleSoftRetry = () => {
    this.setState({ hasError: false, error: null });
  };

  handleResetSessionAndReload = () => {
    try {
      localStorage.removeItem('user_session');
      localStorage.removeItem('grampulse_citizen_session');
      localStorage.removeItem('grampulse_auth_token');
    } catch (e) {
      console.warn('Error clearing localStorage session:', e);
    }
    window.location.reload();
  };

  render() {
    if (this.state.hasError) {
      const errorMessage = this.state.error?.message || String(this.state.error || 'Unknown runtime error');
      return (
        <div className="min-h-screen bg-slate-950 flex flex-col items-center justify-center p-6 text-slate-100 text-center font-sans">
          <div className="max-w-lg w-full bg-slate-900 border border-slate-800 rounded-3xl p-8 shadow-2xl space-y-5 text-left">
            <div className="flex items-center gap-3.5">
              <div className="w-12 h-12 rounded-2xl bg-rose-500/15 border border-rose-500/30 flex items-center justify-center text-rose-400 shrink-0">
                <AlertTriangle className="w-6 h-6" />
              </div>
              <div>
                <h2 className="text-lg font-black text-white">Something went wrong</h2>
                <p className="text-xs text-slate-400">
                  GramPulse encountered an unexpected runtime error.
                </p>
              </div>
            </div>

            <div className="p-3.5 rounded-2xl bg-rose-950/30 border border-rose-500/20 text-xs text-rose-300 font-mono break-words leading-relaxed">
              {errorMessage}
            </div>

            <div className="flex flex-col sm:flex-row items-center gap-2.5 pt-1">
              <button
                type="button"
                onClick={this.handleResetSessionAndReload}
                className="w-full sm:flex-1 py-3 px-4 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold transition-all shadow-md active:scale-95 flex items-center justify-center gap-2 cursor-pointer"
              >
                <RefreshCw className="w-4 h-4" />
                <span>Reset Session &amp; Reload</span>
              </button>

              <button
                type="button"
                onClick={this.handleSoftRetry}
                className="w-full sm:w-auto py-3 px-4 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-bold transition-all border border-slate-700 active:scale-95 flex items-center justify-center gap-2 cursor-pointer"
              >
                <span>Retry</span>
              </button>
            </div>

            {this.state.error?.stack && (
              <div className="pt-2 border-t border-slate-800">
                <button
                  type="button"
                  onClick={() => this.setState((prev) => ({ showDetails: !prev.showDetails }))}
                  className="text-[11px] text-slate-500 hover:text-slate-300 transition-colors cursor-pointer"
                >
                  {this.state.showDetails ? 'Hide technical trace' : 'Show technical trace'}
                </button>
                {this.state.showDetails && (
                  <pre className="mt-2 p-3 bg-slate-950 rounded-xl border border-slate-800 text-[10px] text-slate-400 overflow-x-auto max-h-40 leading-relaxed font-mono">
                    {this.state.error.stack}
                  </pre>
                )}
              </div>
            )}
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
