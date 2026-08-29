import React, { useState } from 'react';
import {
  Sparkles,
  User,
  Lock,
  Mail,
  ArrowRight,
  Loader2,
  AlertCircle,
  Eye,
  EyeOff,
  CheckCircle2,
  ShieldCheck,
  X,
  MapPin,
  KeyRound,
} from 'lucide-react';
import { useGoogleLogin } from '@react-oauth/google';
import { useAuth } from '../context/AuthContext';
import { useTheme } from '../context/ThemeContext';

export default function LoginPage() {
  const {
    loginWithCredentials,
    loginWithGoogleAccessToken,
    authError,
    setAuthError,
  } = useAuth();
  const { activePalette } = useTheme();

  // Tab State: 'signin' | 'signup'
  const [activeTab, setActiveTab] = useState('signin');

  // Sign In Form States
  const [identifier, setIdentifier] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [rememberMe, setRememberMe] = useState(true);

  // Sign Up Form States
  const [signUpName, setSignUpName] = useState('');
  const [signUpIdentifier, setSignUpIdentifier] = useState('');
  const [villageOrCity, setVillageOrCity] = useState('');
  const [signUpPassword, setSignUpPassword] = useState('');
  const [showSignUpPassword, setShowSignUpPassword] = useState(false);

  // Loading States
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isGoogleLoading, setIsGoogleLoading] = useState(false);
  const [isForgotPasswordOpen, setIsForgotPasswordOpen] = useState(false);
  const [forgotEmail, setForgotEmail] = useState('');
  const [forgotSuccess, setForgotSuccess] = useState(false);

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

  const handleSignInSubmit = async (e) => {
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

  const handleSignUpSubmit = async (e) => {
    e.preventDefault();
    if (!signUpName.trim() || !signUpIdentifier.trim() || !villageOrCity.trim() || !signUpPassword.trim()) {
      setAuthError('Please fill out all registration fields.');
      return;
    }

    setIsSubmitting(true);
    try {
      await loginWithCredentials(signUpIdentifier, signUpPassword, {
        name: signUpName.trim(),
        village: villageOrCity.trim(),
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleForgotPasswordSubmit = (e) => {
    e.preventDefault();
    if (forgotEmail.trim()) {
      setForgotSuccess(true);
      setTimeout(() => {
        setIsForgotPasswordOpen(false);
        setForgotSuccess(false);
        setForgotEmail('');
      }, 2500);
    }
  };

  return (
    <div className="min-h-screen flex flex-col justify-center items-center px-4 py-10 relative selection:bg-emerald-500 selection:text-white font-sans">
      
      <div className="w-full max-w-md relative z-10 space-y-5">
        
        {/* Brand Header */}
        <div className="text-center space-y-2.5">
          <div
            className="inline-flex items-center justify-center w-14 h-14 rounded-2xl text-white shadow-2xl ring-4 ring-white/10 transform hover:scale-105 transition-transform duration-300"
            style={{
              background: `linear-gradient(135deg, ${activePalette.primary}, ${activePalette.secondary})`,
              boxShadow: `0 20px 35px -10px ${activePalette.primary}50`,
            }}
          >
            <Sparkles className="w-7 h-7" />
          </div>
          
          <div className="space-y-1">
            <h1 className="text-2xl sm:text-3xl font-black tracking-tight font-sans text-[var(--text-main)]">
              GramPulse <span style={{ color: activePalette.primary }}>AI</span>
            </h1>
            
            <p className="text-xs font-semibold tracking-wider uppercase text-[var(--text-muted)]">
              Citizen Governance Portal
            </p>
          </div>
        </div>

        {/* =================================================================== */}
        {/* Modern Glassmorphic Auth Card                                       */}
        {/* =================================================================== */}
        <div className="bg-[var(--bg-card-glass)] backdrop-blur-xl border border-[var(--border-subtle)] rounded-3xl p-6 sm:p-8 shadow-2xl space-y-5">
          
          {/* Sign In vs Sign Up Tab Switcher */}
          <div className="grid grid-cols-2 gap-1 bg-[var(--bg-primary)] p-1 rounded-xl border border-[var(--border-subtle)]">
            <button
              type="button"
              onClick={() => {
                setActiveTab('signin');
                setAuthError(null);
              }}
              className={`py-2 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                activeTab === 'signin'
                  ? 'shadow-md font-extrabold'
                  : 'text-[var(--text-muted)] hover:text-[var(--text-main)]'
              }`}
              style={{
                backgroundColor: activeTab === 'signin' ? `${activePalette.primary}20` : undefined,
                color: activeTab === 'signin' ? activePalette.primary : undefined,
                border: activeTab === 'signin' ? `1px solid ${activePalette.primary}40` : undefined,
              }}
            >
              Sign In
            </button>
            <button
              type="button"
              onClick={() => {
                setActiveTab('signup');
                setAuthError(null);
              }}
              className={`py-2 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                activeTab === 'signup'
                  ? 'shadow-md font-extrabold'
                  : 'text-[var(--text-muted)] hover:text-[var(--text-main)]'
              }`}
              style={{
                backgroundColor: activeTab === 'signup' ? `${activePalette.primary}20` : undefined,
                color: activeTab === 'signup' ? activePalette.primary : undefined,
                border: activeTab === 'signup' ? `1px solid ${activePalette.primary}40` : undefined,
              }}
            >
              Sign Up
            </button>
          </div>

          {/* Inline Error Alert */}
          {authError && (
            <div className="p-3 bg-rose-500/15 border border-rose-500/40 rounded-xl text-xs text-rose-400 flex items-start gap-2.5 animate-fadeIn">
              <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
              <span className="leading-snug">{authError}</span>
            </div>
          )}

          {/* ================================================================= */}
          {/* TAB 1: SIGN IN FORM                                               */}
          {/* ================================================================= */}
          {activeTab === 'signin' && (
            <form onSubmit={handleSignInSubmit} className="space-y-4">
              
              {/* Identifier Input */}
              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-[var(--text-muted)] flex items-center justify-between">
                  <span>Username or Gmail ID</span>
                  <span className="text-[10px] text-[var(--text-muted)]">e.g. resident@gmail.com</span>
                </label>
                <div className="relative flex items-center">
                  <div className="absolute left-3.5 text-slate-400 pointer-events-none">
                    <User className="w-4 h-4" />
                  </div>
                  <input
                    type="text"
                    required
                    value={identifier}
                    onChange={(e) => setIdentifier(e.target.value)}
                    placeholder="Enter citizen username or email"
                    className="w-full pl-10 pr-4 py-2.5 bg-[var(--bg-primary)] border border-[var(--border-subtle)] focus:border-emerald-500 rounded-xl text-xs text-[var(--text-main)] placeholder:text-slate-500 focus:outline-none focus:ring-2 focus:ring-emerald-500/30 transition-all font-sans"
                  />
                </div>
              </div>

              {/* Password Input */}
              <div className="space-y-1.5">
                <div className="flex items-center justify-between">
                  <label className="text-xs font-semibold text-[var(--text-muted)]">Password</label>
                  <button
                    type="button"
                    onClick={() => setIsForgotPasswordOpen(true)}
                    className="text-[11px] font-semibold text-emerald-500 hover:text-emerald-400 transition-colors cursor-pointer"
                  >
                    Forgot Password?
                  </button>
                </div>
                <div className="relative flex items-center">
                  <div className="absolute left-3.5 text-slate-400 pointer-events-none">
                    <Lock className="w-4 h-4" />
                  </div>
                  <input
                    type={showPassword ? 'text' : 'password'}
                    required
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="••••••••••••"
                    className="w-full pl-10 pr-10 py-2.5 bg-[var(--bg-primary)] border border-[var(--border-subtle)] focus:border-emerald-500 rounded-xl text-xs text-[var(--text-main)] placeholder:text-slate-500 focus:outline-none focus:ring-2 focus:ring-emerald-500/30 transition-all font-sans"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 text-slate-400 hover:text-[var(--text-main)] p-1 rounded-md transition-colors cursor-pointer"
                    title={showPassword ? 'Hide password' : 'Show password'}
                  >
                    {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
              </div>

              {/* Remember Me Checkbox */}
              <div className="flex items-center justify-between text-xs text-[var(--text-muted)]">
                <label className="flex items-center gap-2 cursor-pointer select-none">
                  <input
                    type="checkbox"
                    checked={rememberMe}
                    onChange={(e) => setRememberMe(e.target.checked)}
                    className="w-4 h-4 rounded bg-[var(--bg-primary)] border-[var(--border-subtle)] text-emerald-500 focus:ring-emerald-400 cursor-pointer"
                  />
                  <span>Remember my session</span>
                </label>
              </div>

              {/* Submit Button */}
              <button
                type="submit"
                disabled={isSubmitting || isGoogleLoading}
                className="w-full py-3 px-4 rounded-xl text-xs font-bold text-slate-950 transition-all duration-200 flex items-center justify-center gap-2 shadow-lg shadow-emerald-950/40 hover:shadow-emerald-900/50 active:scale-98 cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
                style={{
                  background: `linear-gradient(135deg, ${activePalette.primary}, ${activePalette.secondary})`,
                }}
              >
                {isSubmitting ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin text-slate-950" />
                    <span>Verifying Citizen Credentials...</span>
                  </>
                ) : (
                  <>
                    <span>Sign In to Governance Portal</span>
                    <ArrowRight className="w-4 h-4" />
                  </>
                )}
              </button>
            </form>
          )}

          {/* ================================================================= */}
          {/* TAB 2: SIGN UP FORM                                               */}
          {/* ================================================================= */}
          {activeTab === 'signup' && (
            <form onSubmit={handleSignUpSubmit} className="space-y-3.5">
              
              <div className="space-y-1">
                <label className="text-xs font-semibold text-[var(--text-muted)]">Full Name</label>
                <div className="relative flex items-center">
                  <div className="absolute left-3.5 text-slate-400 pointer-events-none">
                    <User className="w-4 h-4" />
                  </div>
                  <input
                    type="text"
                    required
                    value={signUpName}
                    onChange={(e) => setSignUpName(e.target.value)}
                    placeholder="e.g. Ramesh Kumar"
                    className="w-full pl-10 pr-4 py-2.5 bg-[var(--bg-primary)] border border-[var(--border-subtle)] focus:border-emerald-500 rounded-xl text-xs text-[var(--text-main)] placeholder:text-slate-500 focus:outline-none focus:ring-2 focus:ring-emerald-500/30 transition-all"
                  />
                </div>
              </div>

              <div className="space-y-1">
                <label className="text-xs font-semibold text-[var(--text-muted)]">Username or Gmail ID</label>
                <div className="relative flex items-center">
                  <div className="absolute left-3.5 text-slate-400 pointer-events-none">
                    <Mail className="w-4 h-4" />
                  </div>
                  <input
                    type="text"
                    required
                    value={signUpIdentifier}
                    onChange={(e) => setSignUpIdentifier(e.target.value)}
                    placeholder="e.g. ramesh.kumar@gmail.com"
                    className="w-full pl-10 pr-4 py-2.5 bg-[var(--bg-primary)] border border-[var(--border-subtle)] focus:border-emerald-500 rounded-xl text-xs text-[var(--text-main)] placeholder:text-slate-500 focus:outline-none focus:ring-2 focus:ring-emerald-500/30 transition-all"
                  />
                </div>
              </div>

              <div className="space-y-1">
                <label className="text-xs font-semibold text-[var(--text-muted)]">Village or City</label>
                <div className="relative flex items-center">
                  <div className="absolute left-3.5 text-slate-400 pointer-events-none">
                    <MapPin className="w-4 h-4" />
                  </div>
                  <input
                    type="text"
                    required
                    value={villageOrCity}
                    onChange={(e) => setVillageOrCity(e.target.value)}
                    placeholder="e.g. Odanthurai, Peelamedu, or Namakkal"
                    className="w-full pl-10 pr-4 py-2.5 bg-[var(--bg-primary)] border border-[var(--border-subtle)] focus:border-emerald-500 rounded-xl text-xs text-[var(--text-main)] placeholder:text-slate-500 focus:outline-none focus:ring-2 focus:ring-emerald-500/30 transition-all font-sans"
                  />
                </div>
              </div>

              <div className="space-y-1">
                <label className="text-xs font-semibold text-[var(--text-muted)]">Password</label>
                <div className="relative flex items-center">
                  <div className="absolute left-3.5 text-slate-400 pointer-events-none">
                    <Lock className="w-4 h-4" />
                  </div>
                  <input
                    type={showSignUpPassword ? 'text' : 'password'}
                    required
                    value={signUpPassword}
                    onChange={(e) => setSignUpPassword(e.target.value)}
                    placeholder="Create a strong password"
                    className="w-full pl-10 pr-10 py-2.5 bg-[var(--bg-primary)] border border-[var(--border-subtle)] focus:border-emerald-500 rounded-xl text-xs text-[var(--text-main)] placeholder:text-slate-500 focus:outline-none focus:ring-2 focus:ring-emerald-500/30 transition-all"
                  />
                  <button
                    type="button"
                    onClick={() => setShowSignUpPassword(!showSignUpPassword)}
                    className="absolute right-3 text-slate-400 hover:text-[var(--text-main)] p-1 rounded-md transition-colors cursor-pointer"
                  >
                    {showSignUpPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
              </div>

              <button
                type="submit"
                disabled={isSubmitting || isGoogleLoading}
                className="w-full py-3 px-4 rounded-xl text-xs font-bold text-slate-950 transition-all duration-200 flex items-center justify-center gap-2 shadow-lg shadow-emerald-950/40 hover:shadow-emerald-900/50 active:scale-98 cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed mt-2"
                style={{
                  background: `linear-gradient(135deg, ${activePalette.primary}, ${activePalette.secondary})`,
                }}
              >
                {isSubmitting ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin text-slate-950" />
                    <span>Registering Citizen Profile...</span>
                  </>
                ) : (
                  <>
                    <span>Create Citizen Account</span>
                    <ArrowRight className="w-4 h-4" />
                  </>
                )}
              </button>
            </form>
          )}

          {/* Divider */}
          <div className="relative flex items-center justify-center">
            <div className="border-t border-[var(--border-subtle)] w-full" />
            <span className="bg-[var(--bg-card)] px-3 text-[10px] uppercase font-bold text-[var(--text-muted)] tracking-wider absolute">
              Or Authenticate With
            </span>
          </div>

          {/* Google OAuth 2.0 Button */}
          <button
            type="button"
            onClick={() => triggerGoogleLogin()}
            disabled={isGoogleLoading || isSubmitting}
            className="w-full py-2.5 px-4 bg-[var(--bg-primary)] hover:bg-[var(--bg-card-hover)] text-[var(--text-main)] border border-[var(--border-subtle)] hover:border-slate-600 rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-3 shadow-md hover:shadow-lg active:scale-98 cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {isGoogleLoading ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin text-emerald-500" />
                <span>Connecting to Google OAuth 2.0...</span>
              </>
            ) : (
              <>
                <svg className="w-4 h-4" viewBox="0 0 24 24">
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
                <span>Continue with Google / Gmail</span>
              </>
            )}
          </button>

          {/* Security & Persistent Session Notice */}
          <div className="flex items-center justify-center gap-1.5 text-[11px] text-[var(--text-muted)] pt-1">
            <ShieldCheck className="w-3.5 h-3.5 text-emerald-500" style={{ color: activePalette.primary }} />
            <span>Encrypted Citizen Authentication • MoPR Compliant</span>
          </div>
        </div>

      </div>

      {/* Forgot Password Dialog Modal */}
      {isForgotPasswordOpen && (
        <div className="fixed inset-0 z-50 bg-black/70 backdrop-blur-md flex items-center justify-center p-4 animate-fadeIn">
          <div className="bg-[var(--bg-card)] border border-[var(--border-subtle)] rounded-2xl p-6 max-w-sm w-full shadow-2xl space-y-4 relative">
            <button
              type="button"
              onClick={() => setIsForgotPasswordOpen(false)}
              className="absolute top-4 right-4 text-slate-400 hover:text-[var(--text-main)] p-1 rounded-lg hover:bg-[var(--bg-card-hover)] cursor-pointer"
            >
              <X className="w-4 h-4" />
            </button>

            <div className="flex items-center gap-2.5">
              <div
                className="w-10 h-10 rounded-2xl flex items-center justify-center text-white"
                style={{ backgroundColor: `${activePalette.primary}25`, color: activePalette.primary }}
              >
                <KeyRound className="w-5 h-5" />
              </div>
              <div>
                <h3 className="text-sm font-bold text-[var(--text-main)]">Reset Citizen Password</h3>
                <p className="text-[11px] text-[var(--text-muted)]">Enter your registered email ID</p>
              </div>
            </div>

            {forgotSuccess ? (
              <div className="p-3 bg-emerald-500/15 border border-emerald-500/30 rounded-xl text-xs text-emerald-500 flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 flex-shrink-0" />
                <span>Password reset instructions sent to your email!</span>
              </div>
            ) : (
              <form onSubmit={handleForgotPasswordSubmit} className="space-y-3">
                <div className="space-y-1">
                  <label className="text-xs font-semibold text-[var(--text-muted)]">Registered Email ID</label>
                  <input
                    type="email"
                    required
                    value={forgotEmail}
                    onChange={(e) => setForgotEmail(e.target.value)}
                    placeholder="e.g. resident@gmail.com"
                    className="w-full px-3.5 py-2 bg-[var(--bg-primary)] border border-[var(--border-subtle)] rounded-xl text-xs text-[var(--text-main)] placeholder:text-slate-500 focus:outline-none focus:ring-2 focus:ring-emerald-500"
                  />
                </div>

                <button
                  type="submit"
                  className="w-full py-2.5 px-4 rounded-xl text-xs font-bold text-slate-950 transition-all cursor-pointer active:scale-95"
                  style={{
                    background: `linear-gradient(135deg, ${activePalette.primary}, ${activePalette.secondary})`,
                  }}
                >
                  Send Reset Link
                </button>
              </form>
            )}
          </div>
        </div>
      )}

    </div>
  );
}
