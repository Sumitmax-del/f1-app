'use client';

import { useEffect, useState, Suspense } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import { motion, AnimatePresence } from 'framer-motion';
import { useAuth } from '@/context/AuthContext';
import {
  Trophy, ShieldAlert, CheckCircle2, ChevronRight,
  Mail, RefreshCw, Send, Flag
} from 'lucide-react';
import Link from 'next/link';

function VerifyEmailContent() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const { user, resendVerification } = useAuth();
  const token = searchParams.get('token');

  // Page States
  const [verifying, setVerifying] = useState(false);
  const [status, setStatus] = useState<'success' | 'error' | 'idle'>('idle');
  const [message, setMessage] = useState('');
  const [resending, setResending] = useState(false);
  const [resendStatus, setResendStatus] = useState<{ success?: boolean; message?: string } | null>(null);

  // Automatically execute verification if token is present
  useEffect(() => {
    if (token) {
      verifyToken(token);
    }
  }, [token]);

  const verifyToken = async (tokenStr: string) => {
    setVerifying(true);
    setStatus('idle');
    try {
      const res = await fetch(`/api/auth/verify-email?token=${tokenStr}`);
      const data = await res.json();

      if (res.ok && data.success) {
        setStatus('success');
        setMessage(data.message || 'Email verified successfully!');
      } else {
        setStatus('error');
        setMessage(data.error || 'Invalid or expired verification token.');
      }
    } catch (err) {
      console.error('[Verification Page Error]:', err);
      setStatus('error');
      setMessage('A connection error occurred while validating your credentials.');
    } finally {
      setVerifying(false);
    }
  };

  const handleResend = async () => {
    setResending(true);
    setResendStatus(null);
    const res = await resendVerification();
    setResending(false);
    if (res.success) {
      setResendStatus({ success: true, message: res.message });
      setTimeout(() => setResendStatus(null), 5000);
    } else {
      setResendStatus({ success: false, message: res.error });
      setTimeout(() => setResendStatus(null), 5000);
    }
  };

  return (
    <div className="min-h-screen grid-bg py-12 px-4 flex items-center justify-center relative overflow-hidden">
      {/* Dynamic Glow Aura */}
      <div
        className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[400px] h-[400px] rounded-full blur-[130px] opacity-10 pointer-events-none transition-colors duration-500"
        style={{
          backgroundColor: status === 'success' ? '#10B981' : status === 'error' ? '#EF4444' : '#E10600'
        }}
      />

      <AnimatePresence mode="wait">
        {/* State 1: Verifying active token */}
        {verifying && (
          <motion.div
            key="verifying-card"
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0 }}
            className="w-full max-w-[440px] glass-card p-8 text-center relative overflow-hidden"
          >
            <div className="absolute inset-0 checkered opacity-5 pointer-events-none" />
            <div className="relative mb-6">
              <div className="w-16 h-16 rounded-full border-4 border-white/5 border-t-[#E10600] animate-spin mx-auto" />
              <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 text-white">
                <Flag size={18} className="animate-pulse" />
              </div>
            </div>
            <h3 className="text-xl font-display font-black tracking-wider text-themed mb-2 uppercase">
              Pit Lane Telemetry
            </h3>
            <p className="text-xs text-themed-secondary">
              Reviewing driver licensing codes and calibrating server security...
            </p>
          </motion.div>
        )}

        {/* State 2: Verification Success */}
        {!verifying && status === 'success' && (
          <motion.div
            key="success-card"
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0 }}
            className="w-full max-w-[460px] glass-card p-8 text-center relative overflow-hidden border border-green-500/20"
            style={{ boxShadow: '0 10px 40px -10px rgba(0,0,0,0.8), 0 0 35px rgba(16,185,129,0.15)' }}
          >
            <div className="absolute inset-0 checkered opacity-5 pointer-events-none" />
            <div className="w-16 h-16 rounded-full bg-green-500/10 border border-green-500/30 flex items-center justify-center mx-auto mb-6 glow-green-sm">
              <Trophy size={32} className="text-green-500 animate-bounce" />
            </div>

            <div className="px-3 py-1 rounded bg-green-500/15 border border-green-500/25 text-green-500 text-[10px] font-bold tracking-[0.2em] uppercase inline-block mb-4">
              Championship Unlocked
            </div>

            <h3 className="text-2xl font-display font-black tracking-wider text-themed mb-3">
              DRIVING LICENSE APPROVED!
            </h3>
            
            <p className="text-xs text-themed-secondary leading-relaxed mb-6">
              Congratulations! Your email credentials have been confirmed. You now have full access to F1 Live real-time dashboard tracking, telemetry controllers, and constructor databases.
            </p>

            <button
              onClick={() => {
                // Instantly sync layout and redirect
                window.location.href = '/';
              }}
              className="w-full py-3 px-6 rounded-lg text-white font-display font-black tracking-widest text-xs uppercase flex items-center justify-center gap-2 transition-all duration-300 bg-gradient-to-r from-green-500 to-emerald-600 shadow-lg shadow-green-500/10 hover:shadow-green-500/20 outline-none"
            >
              <span>PROCEED TO GRID</span>
              <ChevronRight size={14} />
            </button>
          </motion.div>
        )}

        {/* State 3: Verification Error */}
        {!verifying && status === 'error' && (
          <motion.div
            key="error-card"
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0 }}
            className="w-full max-w-[460px] glass-card p-8 text-center relative overflow-hidden border border-red-500/20"
            style={{ boxShadow: '0 10px 40px -10px rgba(0,0,0,0.8), 0 0 35px rgba(239,68,68,0.1)' }}
          >
            <div className="absolute inset-0 checkered opacity-5 pointer-events-none" />
            <div className="w-16 h-16 rounded-full bg-red-500/10 border border-red-500/30 flex items-center justify-center mx-auto mb-6">
              <ShieldAlert size={32} className="text-red-500" />
            </div>

            <div className="px-3 py-1 rounded bg-red-500/15 border border-red-500/25 text-red-500 text-[10px] font-bold tracking-[0.2em] uppercase inline-block mb-4">
              Pit Exit Closed
            </div>

            <h3 className="text-2xl font-display font-black tracking-wider text-themed mb-3">
              VERIFICATION FAILED
            </h3>
            
            <p className="text-xs text-themed-secondary leading-relaxed mb-6">
              {message || 'The verification link you clicked is invalid, corrupted, or has already expired. Run a fresh telemetry check.'}
            </p>

            {user ? (
              <div className="space-y-3">
                <button
                  onClick={handleResend}
                  disabled={resending}
                  className="w-full py-3 px-6 rounded-lg text-white font-display font-black tracking-widest text-xs uppercase flex items-center justify-center gap-2 transition-all duration-300 bg-gradient-to-r from-[#E10600] to-[#B30500] shadow-lg shadow-red-500/10 outline-none"
                >
                  {resending ? <RefreshCw size={14} className="animate-spin" /> : <Send size={14} />}
                  <span>{resending ? 'RE-DISPATCHING LINK...' : 'DISPATCH NEW LINK'}</span>
                </button>
                {resendStatus && (
                  <p className={`text-[11px] font-bold ${resendStatus.success ? 'text-green-500' : 'text-red-500'}`}>
                    {resendStatus.message}
                  </p>
                )}
              </div>
            ) : (
              <Link
                href="/login"
                className="w-full py-3 px-6 rounded-lg text-white font-display font-black tracking-widest text-xs uppercase flex items-center justify-center gap-2 transition-all duration-300 bg-white/5 border border-white/10 hover:bg-white/10 outline-none"
              >
                <span>SIGN IN TO GARAGE</span>
                <ChevronRight size={14} />
              </Link>
            )}
          </motion.div>
        )}

        {/* State 4: Landing page for registered users pending verification */}
        {!verifying && status === 'idle' && !token && (
          <motion.div
            key="pending-card"
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0 }}
            className="w-full max-w-[480px] glass-card p-6 sm:p-8 text-center relative overflow-hidden"
            style={{ boxShadow: '0 10px 40px -10px rgba(0,0,0,0.8)' }}
          >
            <div className="absolute top-0 right-0 w-24 h-24 checkered opacity-5 pointer-events-none" />
            
            <div className="w-16 h-16 rounded-full bg-[#E10600]/10 border border-[#E10600]/30 flex items-center justify-center mx-auto mb-6">
              <Mail size={32} className="text-[#E10600] animate-pulse" />
            </div>

            <div className="px-3 py-1 rounded bg-[#E10600]/15 border border-[#E10600]/25 text-[#E10600] text-[10px] font-bold tracking-[0.2em] uppercase inline-block mb-4 animate-pulse">
              Grid Position Pending
            </div>

            <h3 className="text-2xl font-display font-black tracking-wider text-themed mb-3 uppercase">
              CONFIRM YOUR ENGINE SIGNALS
            </h3>
            
            <p className="text-xs text-themed-secondary leading-relaxed mb-6">
              We've dispatched a high-speed driver license link to your email inbox. Please click the link to confirm your telemetry settings and unlock live timing channels.
            </p>

            <div className="bg-white/2 border border-white/5 rounded-xl p-4 text-left space-y-2 mb-6">
              <span className="font-bold text-[10px] uppercase text-[#E10600] tracking-wider block">
                Verification Guidelines
              </span>
              <ul className="text-[11px] text-themed-secondary space-y-1.5 list-disc pl-4">
                <li>Check your spam or junk folder if the mail is not in your main inbox.</li>
                <li>The verification token remains active for exactly 7 days.</li>
                <li>Make sure you copy the exact telemetry URL link.</li>
              </ul>
            </div>

            <div className="space-y-4">
              <button
                onClick={handleResend}
                disabled={resending}
                className="w-full py-3 px-6 rounded-lg text-white font-display font-black tracking-widest text-xs uppercase flex items-center justify-center gap-2 transition-all duration-300 bg-gradient-to-r from-[#E10600] to-[#B30500] shadow-lg shadow-red-500/10 outline-none"
              >
                {resending ? <RefreshCw size={14} className="animate-spin" /> : <Send size={14} />}
                <span>{resending ? 'RE-DISPATCHING EMAIL...' : 'RE-SEND VERIFICATION EMAIL'}</span>
              </button>
              {resendStatus && (
                <p className={`text-[11px] font-bold ${resendStatus.success ? 'text-green-500' : 'text-red-500'}`}>
                  {resendStatus.message}
                </p>
              )}
            </div>

            <div className="mt-6 text-center text-xs text-themed-secondary border-t border-white/5 pt-4">
              Verified your license already?{' '}
              <Link href="/" className="font-bold underline text-white hover:text-red-500 transition-colors">
                Go to Dashboard
              </Link>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

export default function VerifyEmailPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen grid-bg flex items-center justify-center text-themed">
        <div className="w-16 h-16 rounded-full border-4 border-white/5 border-t-[#E10600] animate-spin mx-auto mb-4" />
        <p className="text-xs uppercase tracking-wider font-display font-bold">Warming Up Telemetry...</p>
      </div>
    }>
      <VerifyEmailContent />
    </Suspense>
  );
}
