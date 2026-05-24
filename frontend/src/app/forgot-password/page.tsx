'use client';

import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useAuth } from '@/context/AuthContext';
import { Mail, ShieldAlert, CheckCircle2, ChevronRight, ArrowLeft } from 'lucide-react';
import Link from 'next/link';

export default function ForgotPasswordPage() {
  const { forgotPassword } = useAuth();
  const [email, setEmail] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg(null);

    if (!email) {
      setErrorMsg('Please specify your registered driver email address.');
      return;
    }

    setSubmitting(true);
    const res = await forgotPassword(email);
    setSubmitting(false);

    if (res.success) {
      setSuccess(true);
    } else {
      setErrorMsg(res.error || 'Connection failed. Please check your pits.');
    }
  };

  return (
    <div className="min-h-screen grid-bg py-12 px-4 flex items-center justify-center relative overflow-hidden">
      {/* Red Glow Aura */}
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[400px] h-[400px] rounded-full blur-[130px] bg-[#E10600]/5 pointer-events-none" />

      <AnimatePresence mode="wait">
        {!success ? (
          <motion.div
            key="forgot-card"
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

            {/* Back to Login */}
            <Link
              href="/login"
              className="inline-flex items-center gap-1.5 text-xs text-themed-secondary hover:text-white transition-colors uppercase font-bold tracking-wider outline-none mb-6"
            >
              <ArrowLeft size={13} /> Back to Sign In
            </Link>

            {/* Title Block */}
            <div className="text-center mb-6 relative z-10">
              <div className="inline-block px-3 py-1 rounded bg-[#E10600]/10 border border-[#E10600]/20 text-[#E10600] text-[10px] font-bold tracking-[0.25em] uppercase mb-3">
                PASSWORD RECOVERY
              </div>
              <h2 className="text-2xl sm:text-3xl font-display font-black tracking-wider text-themed">
                RESET <span className="gradient-text">LICENSE</span>
              </h2>
              <p className="text-xs text-themed-secondary mt-1 max-w-sm mx-auto">
                Specify your driver account email. We will dispatch a high-speed telemetry link to reset your security password.
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
                    <span className="font-bold uppercase tracking-wider block text-[10px] text-red-500 mb-0.5">Recovery Warning</span>
                    {errorMsg}
                  </div>
                </motion.div>
              )}
            </AnimatePresence>

            <form onSubmit={handleSubmit} className="space-y-5 relative z-10">
              {/* Email Input */}
              <div className="space-y-1">
                <label className="text-[11px] font-bold tracking-widest text-themed-secondary uppercase block">
                  Registered Driver Email
                </label>
                <div className="relative">
                  <Mail className="absolute left-3.5 top-1/2 -translate-y-1/2 text-themed-muted" size={15} />
                  <input
                    type="email"
                    required
                    placeholder="driver@raceportal.com"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
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
                    <span>TRANSMITTING SIGNAL...</span>
                  </>
                ) : (
                  <>
                    <span>SEND RESET LINK</span>
                    <ChevronRight size={16} />
                  </>
                )}
              </button>
            </form>
          </motion.div>
        ) : (
          /* Checkered Flag Success Screen */
          <motion.div
            key="success-card"
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="w-full max-w-[440px] glass-card p-8 text-center relative overflow-hidden border border-green-500/20"
            style={{
              boxShadow: '0 10px 40px -10px rgba(0,0,0,0.8), 0 0 30px rgba(16,185,129,0.1)'
            }}
          >
            <div className="absolute inset-0 checkered opacity-5 pointer-events-none" />

            <div className="w-16 h-16 rounded-full bg-green-500/10 border border-green-500/30 flex items-center justify-center mx-auto mb-6">
              <CheckCircle2 size={36} className="text-green-500 animate-pulse" />
            </div>

            <div className="px-3 py-1 rounded bg-green-500/15 border border-green-500/25 text-green-500 text-[10px] font-bold tracking-[0.2em] uppercase inline-block mb-4">
              Link Dispatched
            </div>

            <h3 className="text-2xl font-display font-black tracking-wider text-themed mb-3">
              CHECK INBOX!
            </h3>
            
            <p className="text-xs text-themed-secondary leading-relaxed mb-6">
              If an account is registered with <span className="text-white font-bold">{email}</span>, a high-speed password reset telemetry link has been transmitted. Please check your inbox and junk folders.
            </p>

            <Link
              href="/login"
              className="w-full py-3 px-6 rounded-lg text-white font-display font-black tracking-widest text-xs uppercase flex items-center justify-center gap-2 transition-all duration-300 bg-white/5 border border-white/10 hover:bg-white/10 outline-none"
            >
              <span>RETURN TO LOGIN</span>
              <ChevronRight size={14} />
            </Link>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
