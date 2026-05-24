'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { motion, AnimatePresence } from 'framer-motion';
import { useAuth } from '@/context/AuthContext';
import { Mail, Lock, Eye, EyeOff, ShieldAlert, ChevronRight, CheckCircle2 } from 'lucide-react';
import Link from 'next/link';

export default function LoginPage() {
  const { login, user } = useAuth();
  const router = useRouter();

  // Form Fields
  const [emailOrUsername, setEmailOrUsername] = useState('');
  const [password, setPassword] = useState('');
  const [rememberMe, setRememberMe] = useState(false);

  // UI States
  const [showPassword, setShowPassword] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  // If user is already logged in, redirect to dashboard
  useEffect(() => {
    if (user) {
      router.push('/');
    }
  }, [user, router]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg(null);

    if (!emailOrUsername || !password) {
      setErrorMsg('Please enter both driver credentials and password.');
      return;
    }

    setSubmitting(true);

    const res = await login({
      emailOrUsername: emailOrUsername.trim(),
      password,
    });

    setSubmitting(false);

    if (res.success) {
      setSuccess(true);
      setTimeout(() => {
        router.push('/');
      }, 1500);
    } else {
      setErrorMsg(res.error || 'Authentication failed. Check your pit signals.');
    }
  };

  return (
    <div className="min-h-screen grid-bg py-12 px-4 flex items-center justify-center relative overflow-hidden">
      {/* Red F1 Background Glow */}
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[450px] h-[450px] rounded-full blur-[150px] bg-[#E10600]/5 pointer-events-none" />

      <AnimatePresence mode="wait">
        {!success ? (
          <motion.div
            key="login-card"
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -30 }}
            className="w-full max-w-[480px] glass-card p-6 sm:p-8 relative overflow-hidden racing-stripe"
            style={{
              borderColor: 'rgba(255, 255, 255, 0.05)',
              boxShadow: '0 10px 40px -10px rgba(0,0,0,0.8)'
            }}
          >
            {/* Header Checkered Accent */}
            <div className="absolute top-0 right-0 w-24 h-24 checkered opacity-5 pointer-events-none" />

            {/* Title block */}
            <div className="text-center mb-8 relative z-10">
              <div className="inline-block px-3 py-1 rounded bg-[#E10600]/10 border border-[#E10600]/20 text-[#E10600] text-[10px] font-bold tracking-[0.25em] uppercase mb-3">
                GARAGE SIGN-IN
              </div>
              <h2 className="text-2xl sm:text-3xl font-display font-black tracking-wider text-themed">
                DRIVER <span className="gradient-text">PORTAL</span>
              </h2>
              <p className="text-xs text-themed-secondary mt-1 max-w-sm mx-auto">
                Sign in with your F1 credentials to restore telemetry, settings, and team access.
              </p>
            </div>

            {/* Error Message Box */}
            <AnimatePresence>
              {errorMsg && (
                <motion.div
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: 'auto' }}
                  exit={{ opacity: 0, height: 0 }}
                  className="bg-red-950/40 border border-red-800/30 rounded-xl p-3 mb-5 flex items-start gap-2.5 text-xs text-red-400"
                >
                  <ShieldAlert className="shrink-0 mt-0.5" size={16} />
                  <div>
                    <span className="font-bold uppercase tracking-wider block text-[10px] text-red-500 mb-0.5">Telemetry Error</span>
                    {errorMsg}
                  </div>
                </motion.div>
              )}
            </AnimatePresence>

            <form onSubmit={handleSubmit} className="space-y-5 relative z-10">
              {/* Email / Username Field */}
              <div className="space-y-1">
                <label className="text-[11px] font-bold tracking-widest text-themed-secondary uppercase block">
                  Driver Credentials (Email or Username)
                </label>
                <div className="relative">
                  <Mail className="absolute left-3.5 top-1/2 -translate-y-1/2 text-themed-muted" size={15} />
                  <input
                    type="text"
                    required
                    placeholder="Enter email or username..."
                    value={emailOrUsername}
                    onChange={(e) => setEmailOrUsername(e.target.value)}
                    className="w-full text-xs font-semibold pl-10 pr-4 py-2.5 rounded-lg border bg-themed-surface text-themed outline-none transition-all"
                    style={{
                      borderColor: 'var(--border)',
                      background: 'rgba(20, 20, 30, 0.4)'
                    }}
                    onFocus={(e) => (e.target.style.borderColor = '#E10600')}
                    onBlur={(e) => (e.target.style.borderColor = 'var(--border)')}
                  />
                </div>
              </div>

              {/* Password Field */}
              <div className="space-y-1">
                <div className="flex justify-between items-center">
                  <label className="text-[11px] font-bold tracking-widest text-themed-secondary uppercase block">
                    Security Password
                  </label>
                  <Link
                    href="/forgot-password"
                    className="text-[10px] font-bold text-[#E10600] hover:underline uppercase tracking-wider outline-none"
                  >
                    Forgot Password?
                  </Link>
                </div>
                <div className="relative">
                  <Lock className="absolute left-3.5 top-1/2 -translate-y-1/2 text-themed-muted" size={15} />
                  <input
                    type={showPassword ? 'text' : 'password'}
                    required
                    placeholder="••••••••"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="w-full text-xs font-semibold pl-10 pr-10 py-2.5 rounded-lg border bg-themed-surface text-themed outline-none transition-all"
                    style={{
                      borderColor: 'var(--border)',
                      background: 'rgba(20, 20, 30, 0.4)'
                    }}
                    onFocus={(e) => (e.target.style.borderColor = '#E10600')}
                    onBlur={(e) => (e.target.style.borderColor = 'var(--border)')}
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-themed-muted hover:text-themed transition-colors outline-none"
                  >
                    {showPassword ? <EyeOff size={15} /> : <Eye size={15} />}
                  </button>
                </div>
              </div>

              {/* Remember Me Checkbox */}
              <div className="flex items-center justify-between text-xs py-1">
                <label className="flex items-center gap-2 text-themed-secondary font-semibold cursor-pointer select-none">
                  <input
                    type="checkbox"
                    checked={rememberMe}
                    onChange={(e) => setRememberMe(e.target.checked)}
                    className="w-4 h-4 rounded accent-[#E10600] border-white/10 bg-white/5 cursor-pointer outline-none"
                  />
                  <span>Remember Me</span>
                </label>
              </div>

              {/* Submit Button */}
              <button
                type="submit"
                disabled={submitting}
                className="mt-6 w-full py-3.5 px-6 rounded-lg text-white font-display font-black tracking-widest text-xs uppercase flex items-center justify-center gap-2 relative overflow-hidden transition-all duration-300 outline-none shadow-lg bg-gradient-to-r from-[#E10600] to-[#B30500]"
                style={{
                  boxShadow: submitting ? 'none' : '0 6px 20px -5px rgba(225,6,0,0.4)',
                  cursor: submitting ? 'not-allowed' : 'pointer'
                }}
              >
                {submitting ? (
                  <>
                    <svg className="animate-spin -ml-1 mr-3 h-4 w-4 text-white" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                    </svg>
                    <span>CONNECTING TELEMETRY...</span>
                  </>
                ) : (
                  <>
                    <span>SIGN IN TO GARAGE</span>
                    <ChevronRight size={16} />
                  </>
                )}
              </button>
            </form>

            <div className="mt-8 text-center text-xs text-white/90 border-t border-white/5 pt-5 font-semibold tracking-wide uppercase">
              New to the racing grid?{' '}
              <Link href="/signup" className="font-black underline text-[#FF3333] hover:text-white transition-colors duration-200 tracking-widest ml-1 uppercase">
                Apply for License (Sign Up)
              </Link>
            </div>
          </motion.div>
        ) : (
          /* Checkered Flag Success Screen */
          <motion.div
            key="success-card"
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="w-full max-w-[420px] glass-card p-8 text-center relative overflow-hidden"
            style={{
              borderColor: '#10B98133',
              boxShadow: '0 10px 40px -10px rgba(0,0,0,0.8), 0 0 30px rgba(16,185,129,0.15)'
            }}
          >
            <div className="absolute inset-0 checkered opacity-5 pointer-events-none" />

            <div className="w-16 h-16 rounded-full bg-green-500/10 border border-green-500/30 flex items-center justify-center mx-auto mb-6">
              <CheckCircle2 size={36} className="text-green-500" />
            </div>

            <div className="px-3 py-1 rounded bg-green-500/15 border border-green-500/25 text-green-500 text-[10px] font-bold tracking-[0.2em] uppercase inline-block mb-4">
              Driver Authenticated
            </div>

            <h3 className="text-2xl font-display font-black tracking-wider text-themed mb-2">
              WELCOME BACK!
            </h3>
            
            <p className="text-xs text-themed-secondary leading-relaxed">
              License verified. Connecting to the global F1 dashboard telemetry...
            </p>

            <div className="mt-8 space-y-2">
              <div className="shimmer h-1 w-24 rounded-full mx-auto" />
              <p className="text-[10px] text-themed-muted font-semibold tracking-wider uppercase">
                Synchronizing stream...
              </p>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
