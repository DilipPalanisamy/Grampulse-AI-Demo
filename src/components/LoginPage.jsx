import React, { useState } from 'react';
import {
  Sparkles,
  User,
  Lock,
  ArrowRight,
  Loader2,
  AlertCircle,
  Eye,
  EyeOff,
  CheckCircle2,
  ShieldCheck,
} from 'lucide-react';
import { useGoogleLogin } from '@react-oauth/google';
import { useAuth, DEMO_CITIZEN } from '../context/AuthContext';

export default function LoginPage() {
  const {
    loginWithCredentials,
    loginWithGoogleAccessToken,
    quickDemoLogin,
    authError,
    setAuthError,
  } = useAuth();

  const [identifier, setIdentifier] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isGoogleLoading, setIsGoogleLoading] = useState(false);

  // Google OAuth 2.0 Popup Trigger
  const triggerGoogleLogin = useGoogleLogin({
    onSuccess: async (tokenResponse) => {
      setIsGoogleLoading(true);
      try {
        await loginWithGoogleAccessToken(tokenResponse);
      } finally {
        setIsGoogleLoading(false);
      }
    },
    onError: (errorResponse) => {
      console.error('Google OAuth Login Failed:', errorResponse);
      setAuthError('Google sign-in was cancelled or encountered an error.');
      setIsGoogleLoading(false);
    },
  });

  const handleCredentialsSubmit = async (e) => {
    e.preventDefault();
    if (!identifier.trim() || !password.trim()) {
      setAuthError('Please enter your Username or Gmail ID and Password.');
      return;
    }

    setIsSubmitting(true);
    try {
      await loginWithCredentials(identifier, password);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleQuickFill = async () => {
    setIdentifier(DEMO_CITIZEN.identifier);
    setPassword(DEMO_CITIZEN.password);
    setIsSubmitting(true);
    try {
      await quickDemoLogin();
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col justify-center items-center px-4 py-8 relative overflow-hidden selection:bg-emerald-500 selection:text-white">
      {/* Dynamic Background Glows & Grid Pattern */}
      <div className="absolute inset-0 bg-[linear-gradient(to_right,#1e293b12_1px,transparent_1px),linear-gradient(to_bottom,#1e293b12_1px,transparent_1px)] bg-[size:28px_28px] pointer-events-none" />
      <div className="absolute top-1/4 -left-20 w-96 h-96 bg-emerald-500/10 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute bottom-1/4 -right-20 w-96 h-96 bg-teal-500/10 rounded-full blur-3xl pointer-events-none" />

      <div className="w-full max-w-md relative z-10 space-y-6">
        {/* Brand Header */}
        <div className="text-center space-y-2.5">
          <div className="inline-flex items-center justify-center w-14 h-14 rounded-2xl bg-gradient-to-tr from-emerald-600 via-emerald-500 to-teal-400 text-white shadow-xl shadow-emerald-950/60 ring-4 ring-emerald-500/20">
            <Sparkles className="w-7 h-7" />
          </div>
          <div className="space-y-1">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full text-xs font-semibold bg-emerald-500/10 text-emerald-300 border border-emerald-500/30">
              <span className="w-2 h-2 rounded-full bg-emerald-400 animate-ping" />
              Citizen Governance Portal
            </div>
            <h1 className="text-2xl sm:text-3xl font-black tracking-tight text-white font-sans">
              GramPulse <span className="text-emerald-400">AI</span>
            </h1>
            <p className="text-xs sm:text-sm text-slate-400 max-w-sm mx-auto">
              Predictive GPDP Planning, Geospatial Grievance Redressal & Scheme Benefits
            </p>
          </div>
        </div>

        {/* Login Form Container */}
        <div className="bg-slate-900/90 backdrop-blur-xl border border-slate-800 rounded-3xl p-6 sm:p-8 shadow-2xl shadow-black/80 space-y-5">
          {/* Quick Demo Helper Card */}
          <div className="bg-slate-950/70 p-3 rounded-2xl border border-slate-800 flex items-center justify-between gap-3">
            <div className="flex items-center gap-2">
              <span className="p-1 rounded-lg bg-emerald-500/10 text-emerald-400">
                <CheckCircle2 className="w-3.5 h-3.5" />
              </span>
              <div className="text-left">
                <p className="text-[11px] font-bold text-slate-200">1-Click Demo Citizen</p>
                <p className="text-[10px] text-slate-400 font-mono">citizen@punsari.in / citizen123</p>
              </div>
            </div>
            <button
              type="button"
              onClick={handleQuickFill}
              disabled={isSubmitting || isGoogleLoading}
              className="px-3 py-1.5 rounded-xl bg-emerald-600/20 hover:bg-emerald-600/30 text-emerald-300 border border-emerald-500/30 text-xs font-semibold transition-all active:scale-95 disabled:opacity-50"
            >
              Auto-Fill & Sign In
            </button>
          </div>

          {/* Form */}
          <form onSubmit={handleCredentialsSubmit} className="space-y-4">
            {authError && (
              <div className="flex items-center gap-2 p-3 rounded-xl bg-rose-500/10 border border-rose-500/30 text-rose-300 text-xs animate-shake">
                <AlertCircle className="w-4 h-4 flex-shrink-0 text-rose-400" />
                <span>{authError}</span>
              </div>
            )}

            {/* Username or Gmail ID */}
            <div className="space-y-1.5">
              <label className="text-xs font-medium text-slate-300">Username or Gmail ID</label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-500">
                  <User className="w-4 h-4" />
                </div>
                <input
                  type="text"
                  required
                  value={identifier}
                  onChange={(e) => setIdentifier(e.target.value)}
                  placeholder="e.g. rahul.sharma@gmail.com or citizen_punsari"
                  className="w-full pl-10 pr-4 py-2.5 bg-slate-950 border border-slate-800 rounded-xl text-xs sm:text-sm text-slate-100 placeholder:text-slate-600 focus:outline-none focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500 transition-all font-mono"
                />
              </div>
            </div>

            {/* Password */}
            <div className="space-y-1.5">
              <div className="flex items-center justify-between">
                <label className="text-xs font-medium text-slate-300">Password</label>
                <span className="text-[11px] text-slate-500">Secure entry</span>
              </div>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-500">
                  <Lock className="w-4 h-4" />
                </div>
                <input
                  type={showPassword ? 'text' : 'password'}
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  className="w-full pl-10 pr-10 py-2.5 bg-slate-950 border border-slate-800 rounded-xl text-xs sm:text-sm text-slate-100 placeholder:text-slate-600 focus:outline-none focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500 transition-all font-mono"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute inset-y-0 right-0 pr-3.5 flex items-center text-slate-500 hover:text-slate-300"
                >
                  {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>

            {/* Primary Sign In Button */}
            <button
              type="submit"
              disabled={isSubmitting || isGoogleLoading}
              className="w-full flex items-center justify-center gap-2 py-3 px-4 rounded-xl text-sm font-bold text-white bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 shadow-xl shadow-emerald-950/60 disabled:opacity-50 disabled:cursor-not-allowed transition-all active:scale-[0.99]"
            >
              {isSubmitting ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  <span>Signing In...</span>
                </>
              ) : (
                <>
                  <span>Sign In</span>
                  <ArrowRight className="w-4 h-4" />
                </>
              )}
            </button>
          </form>

          {/* OR Separator */}
          <div className="relative flex items-center justify-center my-4">
            <div className="border-t border-slate-800 w-full" />
            <span className="bg-slate-900 px-3 text-[11px] font-bold text-slate-500 uppercase tracking-wider relative z-10">
              OR
            </span>
            <div className="border-t border-slate-800 w-full" />
          </div>

          {/* Continue with Google Button */}
          <button
            type="button"
            onClick={() => {
              setAuthError(null);
              triggerGoogleLogin();
            }}
            disabled={isGoogleLoading || isSubmitting}
            className="w-full flex items-center justify-center gap-3 py-2.5 px-4 rounded-xl bg-slate-950 hover:bg-slate-850 text-slate-100 border border-slate-700/80 hover:border-slate-600 font-semibold text-xs sm:text-sm shadow-md transition-all active:scale-[0.99] disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer"
          >
            {isGoogleLoading ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin text-emerald-400" />
                <span>Authorizing with Google...</span>
              </>
            ) : (
              <>
                {/* Official Google 4-Color SVG Icon */}
                <svg className="w-4 h-4 flex-shrink-0" viewBox="0 0 24 24">
                  <path
                    fill="#4285F4"
                    d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                  />
                  <path
                    fill="#34A853"
                    d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                  />
                  <path
                    fill="#FBBC05"
                    d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z"
                  />
                  <path
                    fill="#EA4335"
                    d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z"
                  />
                </svg>
                <span>Continue with Google</span>
              </>
            )}
          </button>
        </div>

        {/* Security & Permanent Session Notice */}
        <div className="flex items-center justify-center gap-1.5 text-[11px] text-slate-500">
          <ShieldCheck className="w-3.5 h-3.5 text-emerald-400" />
          <span>Persistent session active • Stay signed in automatically</span>
        </div>
      </div>
    </div>
  );
}
