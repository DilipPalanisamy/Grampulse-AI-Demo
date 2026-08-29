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
  Award,
  HelpCircle,
  X,
  MapPin,
  KeyRound,
} from 'lucide-react';
import { useGoogleLogin } from '@react-oauth/google';
import { useAuth, DEMO_CITIZEN } from '../context/AuthContext';
import { useTheme } from '../context/ThemeContext';

export default function LoginPage() {
  const {
    loginWithCredentials,
    loginWithGoogleAccessToken,
    quickDemoLogin,
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
  const [signUpVillage, setSignUpVillage] = useState('Odanthurai GP');
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
    if (!signUpName.trim() || !signUpIdentifier.trim() || !signUpPassword.trim()) {
      setAuthError('Please fill out all registration fields.');
      return;
    }

    setIsSubmitting(true);
    try {
      await loginWithCredentials(signUpIdentifier, signUpPassword);
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
    <div className="min-h-screen bg-slate-950/80 text-slate-100 flex flex-col justify-center items-center px-4 py-10 relative selection:bg-emerald-500 selection:text-white font-sans">
      
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
            <div className="inline-flex items-center gap-2 px-3 py-0.5 rounded-full text-xs font-semibold bg-slate-900/80 text-emerald-300 border border-white/10 backdrop-blur-md">
              <span
                className="w-2 h-2 rounded-full animate-ping"
                style={{ backgroundColor: activePalette.primary }}
              />
              <span style={{ color: activePalette.primary }}>MoPR Rural AI &amp; Geospatial Platform</span>
            </div>
            
            <h1 className="text-2xl sm:text-3xl font-black tracking-tight text-white font-sans">
              GramPulse <span style={{ color: activePalette.primary }}>AI</span>
            </h1>
            
            <p className="text-xs text-slate-400 max-w-sm mx-auto leading-relaxed">
              Predictive GPDP Planning, Spatial Telemetry &amp; Centrally Sponsored Schemes
            </p>
          </div>
        </div>

        {/* =================================================================== */}
        {/* Modern Glassmorphic Auth Card                                       */}
        {/* =================================================================== */}
        <div className="bg-slate-900/75 backdrop-blur-xl border border-white/10 rounded-2xl p-6 sm:p-8 shadow-2xl shadow-black/90 space-y-5">
          
          {/* Sign In vs Sign Up Tab Switcher */}
          <div className="grid grid-cols-2 gap-1 bg-slate-950/80 p-1 rounded-xl border border-slate-800">
            <button
              type="button"
              onClick={() => {
                setActiveTab('signin');
                setAuthError(null);
              }}
              className={`py-2 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                activeTab === 'signin'
                  ? 'bg-slate-850 text-white shadow-md'
                  : 'text-slate-400 hover:text-slate-200'
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
                  ? 'bg-slate-850 text-white shadow-md'
                  : 'text-slate-400 hover:text-slate-200'
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

          {/* Quick 1-Click Demo Citizen Card (Only on Sign In tab) */}
          {activeTab === 'signin' && (
            <div className="bg-slate-950/70 p-3 rounded-xl border border-slate-800/80 flex items-center justify-between gap-3 shadow-inner">
              <div className="flex items-center gap-2.5">
                <span
                  className="p-1.5 rounded-lg flex-shrink-0"
                  style={{ backgroundColor: `${activePalette.primary}20`, color: activePalette.primary }}
                >
                  <CheckCircle2 className="w-4 h-4" />
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
                className="px-3 py-1.5 rounded-lg text-xs font-bold transition-all active:scale-95 disabled:opacity-50 cursor-pointer border"
                style={{
                  backgroundColor: `${activePalette.primary}20`,
                  color: activePalette.primary,
                  borderColor: `${activePalette.primary}40`,
                }}
              >
                Auto-Fill
              </button>
            </div>
          )}

          {/* Error Banner */}
          {authError && (
            <div className="flex items-center gap-2.5 p-3 rounded-xl bg-rose-500/10 border border-rose-500/30 text-rose-300 text-xs animate-shake">
              <AlertCircle className="w-4 h-4 flex-shrink-0 text-rose-400" />
              <span>{authError}</span>
            </div>
          )}

          {/* ----------------------------------------------------------------- */}
          {/* TAB 1: SIGN IN FORM                                               */}
          {/* ----------------------------------------------------------------- */}
          {activeTab === 'signin' ? (
            <form onSubmit={handleSignInSubmit} className="space-y-3.5">
              {/* Username or Gmail ID */}
              <div className="space-y-1">
                <label className="text-xs font-semibold text-slate-300">Username or Gmail ID</label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-500">
                    <User className="w-4 h-4" />
                  </div>
                  <input
                    type="text"
                    required
                    value={identifier}
                    onChange={(e) => setIdentifier(e.target.value)}
                    placeholder="e.g. citizen@punsari.in or dilip_tamilnadu"
                    className="w-full pl-10 pr-4 py-2.5 bg-slate-950/90 border border-slate-700/80 rounded-xl text-xs sm:text-sm text-slate-100 placeholder:text-slate-500 focus:outline-none focus:ring-2 focus:ring-emerald-500/50 transition-all font-mono shadow-inner"
                    style={{ borderColor: identifier ? `${activePalette.primary}60` : undefined }}
                  />
                </div>
              </div>

              {/* Password */}
              <div className="space-y-1">
                <div className="flex items-center justify-between">
                  <label className="text-xs font-semibold text-slate-300">Password</label>
                  <button
                    type="button"
                    onClick={() => setIsForgotPasswordOpen(true)}
                    className="text-[11px] text-slate-400 hover:text-slate-200 transition-colors cursor-pointer"
                  >
                    Forgot Password?
                  </button>
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
                    className="w-full pl-10 pr-10 py-2.5 bg-slate-950/90 border border-slate-700/80 rounded-xl text-xs sm:text-sm text-slate-100 placeholder:text-slate-500 focus:outline-none focus:ring-2 focus:ring-emerald-500/50 transition-all font-mono shadow-inner"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute inset-y-0 right-0 pr-3.5 flex items-center text-slate-500 hover:text-slate-300 cursor-pointer"
                  >
                    {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
              </div>

              {/* Remember Me Checkbox */}
              <div className="flex items-center justify-between pt-1 text-xs text-slate-400">
                <label className="flex items-center gap-2 cursor-pointer select-none">
                  <input
                    type="checkbox"
                    checked={rememberMe}
                    onChange={(e) => setRememberMe(e.target.checked)}
                    className="w-4 h-4 rounded bg-slate-950 border-slate-700 text-emerald-500 focus:ring-0 cursor-pointer"
                    style={{ accentColor: activePalette.primary }}
                  />
                  <span>Remember me across sessions</span>
                </label>
              </div>

              {/* Primary Sign In Button */}
              <button
                type="submit"
                disabled={isSubmitting || isGoogleLoading}
                className="w-full flex items-center justify-center gap-2 py-3 px-4 rounded-xl text-sm font-bold text-slate-950 shadow-xl transition-all active:scale-[0.99] disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer"
                style={{
                  background: `linear-gradient(135deg, ${activePalette.primary}, ${activePalette.secondary})`,
                  boxShadow: `0 10px 25px -5px ${activePalette.primary}60`,
                }}
              >
                {isSubmitting ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin text-slate-950" />
                    <span>Authenticating...</span>
                  </>
                ) : (
                  <>
                    <span>Sign In to Citizen Portal</span>
                    <ArrowRight className="w-4 h-4" />
                  </>
                )}
              </button>
            </form>
          ) : (
            /* --------------------------------------------------------------- */
            /* TAB 2: SIGN UP FORM                                             */
            /* --------------------------------------------------------------- */
            <form onSubmit={handleSignUpSubmit} className="space-y-3">
              {/* Full Name */}
              <div className="space-y-1">
                <label className="text-xs font-semibold text-slate-300">Full Name</label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-500">
                    <User className="w-4 h-4" />
                  </div>
                  <input
                    type="text"
                    required
                    value={signUpName}
                    onChange={(e) => setSignUpName(e.target.value)}
                    placeholder="e.g. Ramesh Kumar"
                    className="w-full pl-10 pr-4 py-2 bg-slate-950/90 border border-slate-700/80 rounded-xl text-xs sm:text-sm text-slate-100 placeholder:text-slate-500 focus:outline-none focus:ring-2 focus:ring-emerald-500/50 transition-all font-sans"
                  />
                </div>
              </div>

              {/* Username or Email */}
              <div className="space-y-1">
                <label className="text-xs font-semibold text-slate-300">Gmail or Username</label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-500">
                    <Mail className="w-4 h-4" />
                  </div>
                  <input
                    type="text"
                    required
                    value={signUpIdentifier}
                    onChange={(e) => setSignUpIdentifier(e.target.value)}
                    placeholder="e.g. ramesh.kumar@gmail.com"
                    className="w-full pl-10 pr-4 py-2 bg-slate-950/90 border border-slate-700/80 rounded-xl text-xs sm:text-sm text-slate-100 placeholder:text-slate-500 focus:outline-none focus:ring-2 focus:ring-emerald-500/50 transition-all font-mono"
                  />
                </div>
              </div>

              {/* Habitation / Panchayat */}
              <div className="space-y-1">
                <label className="text-xs font-semibold text-slate-300">Gram Panchayat / Village</label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-500">
                    <MapPin className="w-4 h-4" />
                  </div>
                  <input
                    type="text"
                    required
                    value={signUpVillage}
                    onChange={(e) => setSignUpVillage(e.target.value)}
                    placeholder="e.g. Odanthurai GP, Coimbatore"
                    className="w-full pl-10 pr-4 py-2 bg-slate-950/90 border border-slate-700/80 rounded-xl text-xs sm:text-sm text-slate-100 placeholder:text-slate-500 focus:outline-none focus:ring-2 focus:ring-emerald-500/50 transition-all font-sans"
                  />
                </div>
              </div>

              {/* Password */}
              <div className="space-y-1">
                <label className="text-xs font-semibold text-slate-300">Password</label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-500">
                    <Lock className="w-4 h-4" />
                  </div>
                  <input
                    type={showSignUpPassword ? 'text' : 'password'}
                    required
                    value={signUpPassword}
                    onChange={(e) => setSignUpPassword(e.target.value)}
                    placeholder="Create a strong password"
                    className="w-full pl-10 pr-10 py-2 bg-slate-950/90 border border-slate-700/80 rounded-xl text-xs sm:text-sm text-slate-100 placeholder:text-slate-500 focus:outline-none focus:ring-2 focus:ring-emerald-500/50 transition-all font-mono"
                  />
                  <button
                    type="button"
                    onClick={() => setShowSignUpPassword(!showSignUpPassword)}
                    className="absolute inset-y-0 right-0 pr-3.5 flex items-center text-slate-500 hover:text-slate-300 cursor-pointer"
                  >
                    {showSignUpPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
              </div>

              {/* Primary Register Button */}
              <button
                type="submit"
                disabled={isSubmitting || isGoogleLoading}
                className="w-full flex items-center justify-center gap-2 py-3 px-4 rounded-xl text-sm font-bold text-slate-950 shadow-xl transition-all active:scale-[0.99] disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer mt-2"
                style={{
                  background: `linear-gradient(135deg, ${activePalette.primary}, ${activePalette.secondary})`,
                  boxShadow: `0 10px 25px -5px ${activePalette.primary}60`,
                }}
              >
                {isSubmitting ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin text-slate-950" />
                    <span>Registering Account...</span>
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

          {/* OR Separator */}
          <div className="relative flex items-center justify-center my-3">
            <div className="border-t border-slate-800 w-full" />
            <span className="bg-slate-900 px-3 text-[11px] font-bold text-slate-500 uppercase tracking-wider relative z-10">
              OR
            </span>
            <div className="border-t border-slate-800 w-full" />
          </div>

          {/* Official Prominent Continue with Google Button */}
          <button
            type="button"
            onClick={() => {
              setAuthError(null);
              triggerGoogleLogin();
            }}
            disabled={isGoogleLoading || isSubmitting}
            className="w-full flex items-center justify-center gap-3 py-2.5 px-4 rounded-xl bg-slate-950/80 hover:bg-slate-900 text-slate-100 border border-slate-700/80 hover:border-slate-600 font-semibold text-xs sm:text-sm shadow-md hover:shadow-lg transition-all active:scale-[0.99] disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer"
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

          {/* Security & Persistent Session Notice */}
          <div className="flex items-center justify-center gap-1.5 text-[11px] text-slate-500 pt-1">
            <ShieldCheck className="w-3.5 h-3.5 text-emerald-400" style={{ color: activePalette.primary }} />
            <span>Encrypted Citizen Authentication • MoPR Compliant</span>
          </div>
        </div>

        {/* =================================================================== */}
        {/* Presenter Acknowledgment Badge (Dilip & Isanth)                     */}
        {/* =================================================================== */}
        <div className="flex items-center justify-center gap-2 py-2 px-4 rounded-xl bg-slate-900/60 border border-slate-800/80 backdrop-blur-sm text-center text-xs text-slate-400">
          <Award className="w-3.5 h-3.5 text-emerald-400" style={{ color: activePalette.primary }} />
          <span>
            GramPulse AI Architecture &amp; Demonstration presented by{' '}
            <strong className="text-slate-200 font-bold">Dilip &amp; Isanth</strong>
          </span>
        </div>

      </div>

      {/* Forgot Password Dialog Modal */}
      {isForgotPasswordOpen && (
        <div className="fixed inset-0 z-50 bg-black/70 backdrop-blur-md flex items-center justify-center p-4 animate-fadeIn">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 max-w-sm w-full shadow-2xl space-y-4 relative">
            <button
              type="button"
              onClick={() => setIsForgotPasswordOpen(false)}
              className="absolute top-4 right-4 text-slate-400 hover:text-white p-1 rounded-lg hover:bg-slate-800 cursor-pointer"
            >
              <X className="w-4 h-4" />
            </button>

            <div className="flex items-center gap-2.5">
              <div
                className="w-10 h-10 rounded-xl flex items-center justify-center text-white"
                style={{ backgroundColor: `${activePalette.primary}25`, color: activePalette.primary }}
              >
                <KeyRound className="w-5 h-5" />
              </div>
              <div>
                <h3 className="text-sm font-bold text-white">Reset Citizen Password</h3>
                <p className="text-[11px] text-slate-400">Enter your registered email ID</p>
              </div>
            </div>

            {forgotSuccess ? (
              <div className="p-3 bg-emerald-500/15 border border-emerald-500/30 rounded-xl text-xs text-emerald-300 flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 flex-shrink-0" />
                <span>Password reset instructions sent to your email!</span>
              </div>
            ) : (
              <form onSubmit={handleForgotPasswordSubmit} className="space-y-3">
                <div className="space-y-1">
                  <label className="text-xs text-slate-300 font-semibold">Registered Email ID</label>
                  <input
                    type="email"
                    required
                    value={forgotEmail}
                    onChange={(e) => setForgotEmail(e.target.value)}
                    placeholder="e.g. resident@punsari.in"
                    className="w-full px-3.5 py-2 bg-slate-950 border border-slate-700 rounded-xl text-xs text-slate-100 placeholder:text-slate-500 focus:outline-none focus:ring-2 focus:ring-emerald-500"
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
