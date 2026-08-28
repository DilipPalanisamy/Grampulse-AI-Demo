import React from 'react';
import { AuthProvider, useAuth } from './context/AuthContext';
import { LocationProvider } from './context/LocationContext';
import LoginPage from './components/LoginPage';
import DashboardLayout from './components/DashboardLayout';
import { Loader2, Sparkles } from 'lucide-react';

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

  if (!isAuthenticated) {
    return <LoginPage />;
  }

  return (
    <LocationProvider>
      <DashboardLayout />
    </LocationProvider>
  );
}

export default function App() {
  return (
    <AuthProvider>
      <AppContent />
    </AuthProvider>
  );
}
