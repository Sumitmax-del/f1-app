'use client';

import { useState, useEffect, Suspense } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import { motion, AnimatePresence } from 'framer-motion';
import { useAuth } from '@/context/AuthContext';
import { Lock, Eye, EyeOff, ShieldAlert, CheckCircle2, ChevronRight, Check } from 'lucide-react';
import Link from 'next/link';

function ResetPasswordContent() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const { resetPassword } = useAuth();
  
  const token = searchParams.get('token');

  // Form Fields
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');

  // UI States
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  // Password Strength Checker
  const [passwordMetrics, setPasswordMetrics] = useState({
    length: false,
    number: false,
    capital: false,
    special: false,
  });
  const [strengthScore, setStrengthScore] = useState(0);

  // Validate Token Exists
  useEffect(() => {
    if (!token) {
      setErrorMsg('Password reset token is missing. Please request a new recovery link.');
    }
  }, [token]);

  // Track Password Complexity Realtime
  useEffect(() => {
    const metrics = {
      length: password.length >= 8,
      number: /\d/.test(password),
      capital: /[A-Z]/.test(password),
      special: /[^A-Za-z0-9]/.test(password),
    };

    setPasswordMetrics(metrics);

    let score = 0;
    if (metrics.length) score += 25;
    if (metrics.number) score += 25;
    if (metrics.capital) score += 25;
    if (metrics.special) score += 25;
    setStrengthScore(score);
  }, [password]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg(null);

    if (!token) {
      setErrorMsg('Password reset token is missing. Please request a new recovery link.');
      return;
    }

    if (!password || !confirmPassword) {
      setErrorMsg('Please specify and confirm your new security password.');
      return;
    }

    if (password !== confirmPassword) {
      setErrorMsg('Passwords do not match. Check your steering.');
      return;
    }

    if (strengthScore < 75) {
      setErrorMsg('Please strengthen your password before hitting the track.');
      return;
    }

    setSubmitting(true);
    const res = await resetPassword(token, password);
    setSubmitting(false);

    if (res.success) {
      setSuccess(true);
      setTimeout(() => {
        router.push('/login');
      }, 3000);
    } else {
      setErrorMsg(res.error || 'Reset failed. Reset link may have expired.');
    }
  };

  return (
    <div className="min-h-screen grid-bg py-12 px-4 flex items-center justify-center relative overflow-hidden">
      {/* Dynamic Glow Aura */}
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[400px] h-[400px] rounded-full blur-[130px] bg-[#E10600]/5 pointer-events-none" />

      <AnimatePresence mode="wait">
        {!success ? (
          <motion.div
            key="reset-card"
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
            <div className="text-center mb-6 relative z-10">
              <div className="inline-block px-3 py-1 rounded bg-[#E10600]/10 border border-[#E10600]/20 text-[#E10600] text-[10px] font-bold tracking-[0.25em] uppercase mb-3">
                NEW DRIVER LICENSE
              </div>
              <h2 className="text-2xl sm:text-3xl font-display font-black tracking-wider text-themed">
                RESET <span className="gradient-text">PASSWORD</span>
              </h2>
              <p className="text-xs text-themed-secondary mt-1 max-w-sm mx-auto">
                Secure your new credentials. Choose a highly resistant security code to get back on the grid.
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
                    <span className="font-bold uppercase tracking-wider block text-[10px] text-red-500 mb-0.5">Reset Warning</span>
                    {errorMsg}
                  </div>
                </motion.div>
              )}
            </AnimatePresence>

            {token && (
              <form onSubmit={handleSubmit} className="space-y-4 relative z-10">
                {/* Password Input */}
                <div className="space-y-1">
                  <label className="text-[11px] font-bold tracking-widest text-themed-secondary uppercase block">
                    New Security Password
                  </label>
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

                {/* Confirm Password Input */}
                <div className="space-y-1">
                  <label className="text-[11px] font-bold tracking-widest text-themed-secondary uppercase block">
                    Confirm Password
                  </label>
                  <div className="relative">
                    <Lock className="absolute left-3.5 top-1/2 -translate-y-1/2 text-themed-muted" size={15} />
                    <input
                      type={showConfirmPassword ? 'text' : 'password'}
                      required
                      placeholder="••••••••"
                      value={confirmPassword}
                      onChange={(e) => setConfirmPassword(e.target.value)}
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
                      onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-themed-muted hover:text-themed transition-colors outline-none"
                    >
                      {showConfirmPassword ? <EyeOff size={15} /> : <Eye size={15} />}
                    </button>
                  </div>
                </div>

                {/* Password Strength Gauge */}
                {password.length > 0 && (
                  <div className="bg-white/2 p-3 rounded-lg border border-white/5 space-y-2">
                    <div className="flex justify-between items-center text-[10px]">
                      <span className="text-themed-secondary font-semibold">Engine Compression (Strength):</span>
                      <span
                        className="font-bold uppercase tracking-wider"
                        style={{
                          color: strengthScore < 50 ? '#EF4444' : strengthScore < 100 ? '#FBBF24' : '#10B981'
                        }}
                      >
                        {strengthScore < 50 ? 'Volatile (Weak)' : strengthScore < 100 ? 'Stable (Medium)' : 'High Octane (Strong)'}
                      </span>
                    </div>

                    {/* Visual Gauge Bar */}
                    <div className="h-1.5 w-full bg-white/5 rounded-full overflow-hidden">
                      <motion.div
                        className="h-full rounded-full"
                        animate={{ width: `${strengthScore}%` }}
                        style={{
                          backgroundColor: strengthScore < 50 ? '#EF4444' : strengthScore < 100 ? '#FBBF24' : '#10B981',
                          boxShadow: `0 0 8px ${strengthScore < 50 ? '#EF444455' : strengthScore < 100 ? '#FBBF2455' : '#10B98155'}`
                        }}
                        transition={{ type: 'spring', stiffness: 80 }}
                      />
                    </div>

                    {/* Checklist Grid */}
                    <div className="grid grid-cols-2 gap-x-2 gap-y-1 text-[10px]">
                      <div className="flex items-center gap-1.5">
                        <span className={`w-3.5 h-3.5 rounded-full flex items-center justify-center shrink-0 border ${passwordMetrics.length ? 'border-green-500 bg-green-500/10' : 'border-white/5 bg-white/2'}`}>
                          {passwordMetrics.length && <Check size={8} className="text-green-500 font-black" />}
                        </span>
                        <span className={passwordMetrics.length ? 'text-themed font-semibold' : 'text-themed-muted'}>Min 8 characters</span>
                      </div>
                      <div className="flex items-center gap-1.5">
                        <span className={`w-3.5 h-3.5 rounded-full flex items-center justify-center shrink-0 border ${passwordMetrics.capital ? 'border-green-500 bg-green-500/10' : 'border-white/5 bg-white/2'}`}>
                          {passwordMetrics.capital && <Check size={8} className="text-green-500 font-black" />}
                        </span>
                        <span className={passwordMetrics.capital ? 'text-themed font-semibold' : 'text-themed-muted'}>Uppercase letter</span>
                      </div>
                      <div className="flex items-center gap-1.5">
                        <span className={`w-3.5 h-3.5 rounded-full flex items-center justify-center shrink-0 border ${passwordMetrics.number ? 'border-green-500 bg-green-500/10' : 'border-white/5 bg-white/2'}`}>
                          {passwordMetrics.number && <Check size={8} className="text-green-500 font-black" />}
                        </span>
                        <span className={passwordMetrics.number ? 'text-themed font-semibold' : 'text-themed-muted'}>Contains a number</span>
                      </div>
                      <div className="flex items-center gap-1.5">
                        <span className={`w-3.5 h-3.5 rounded-full flex items-center justify-center shrink-0 border ${passwordMetrics.special ? 'border-green-500 bg-green-500/10' : 'border-white/5 bg-white/2'}`}>
                          {passwordMetrics.special && <Check size={8} className="text-green-500 font-black" />}
                        </span>
                        <span className={passwordMetrics.special ? 'text-themed font-semibold' : 'text-themed-muted'}>Special symbol</span>
                      </div>
                    </div>
                  </div>
                )}

                {/* Submit button */}
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
                      <span>RECONFIGURING GEARS...</span>
                    </>
                  ) : (
                    <>
                      <span>CONFIRM PASSWORD CHANGE</span>
                      <ChevronRight size={16} />
                    </>
                  )}
                </button>
              </form>
            )}

            {!token && (
              <Link
                href="/forgot-password"
                className="mt-6 w-full py-3 px-6 rounded-lg text-white font-display font-black tracking-widest text-xs uppercase flex items-center justify-center gap-2 transition-all duration-300 bg-white/5 border border-white/10 hover:bg-white/10 outline-none"
              >
                <span>REQUEST RECOVERY LINK</span>
                <ChevronRight size={14} />
              </Link>
            )}
          </motion.div>
        ) : (
          /* Checkered Flag Success Screen */
          <motion.div
            key="success-card"
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="w-full max-w-[440px] glass-card p-8 text-center relative overflow-hidden border border-green-500/20"
            style={{
              boxShadow: '0 10px 40px -10px rgba(0,0,0,0.8), 0 0 30px rgba(16,185,129,0.15)'
            }}
          >
            <div className="absolute inset-0 checkered opacity-5 pointer-events-none" />

            <div className="w-16 h-16 rounded-full bg-green-500/10 border border-green-500/30 flex items-center justify-center mx-auto mb-6">
              <CheckCircle2 size={36} className="text-green-500 animate-bounce" />
            </div>

            <div className="px-3 py-1 rounded bg-green-500/15 border border-green-500/25 text-green-500 text-[10px] font-bold tracking-[0.2em] uppercase inline-block mb-4">
              Password Restored
            </div>

            <h3 className="text-2xl font-display font-black tracking-wider text-themed mb-3">
              RESET SUCCESSFUL!
            </h3>
            
            <p className="text-xs text-themed-secondary leading-relaxed mb-6">
              Your security password has been re-calibrated successfully! We are routing you back to the sign-in portal. Get ready to lock in your driver license.
            </p>

            <div className="mt-8 space-y-2">
              <div className="shimmer h-1 w-24 rounded-full mx-auto animate-pulse" />
              <p className="text-[10px] text-themed-muted font-semibold tracking-wider uppercase">
                Routing back to Pits...
              </p>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

export default function ResetPasswordPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen grid-bg flex items-center justify-center text-themed">
        <div className="w-16 h-16 rounded-full border-4 border-white/5 border-t-[#E10600] animate-spin mx-auto mb-4" />
        <p className="text-xs uppercase tracking-wider font-display font-bold">Connecting Recovery Node...</p>
      </div>
    }>
      <ResetPasswordContent />
    </Suspense>
  );
}
