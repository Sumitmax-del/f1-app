'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { motion, AnimatePresence } from 'framer-motion';
import { useAuth } from '@/context/AuthContext';
import {
  User as UserIcon, Mail, Lock, Eye, EyeOff, Flag, ShieldAlert,
  ChevronRight, Check, CheckCircle2, UserCheck, Flame
} from 'lucide-react';
import Link from 'next/link';

const F1_TEAMS = [
  { name: 'Red Bull', color: '#3671C6', drivers: ['Max Verstappen', 'Liam Lawson'] },
  { name: 'McLaren', color: '#FF8000', drivers: ['Lando Norris', 'Oscar Piastri'] },
  { name: 'Ferrari', color: '#E8002D', drivers: ['Charles Leclerc', 'Lewis Hamilton'] },
  { name: 'Mercedes', color: '#27F4D2', drivers: ['George Russell', 'Kimi Antonelli'] },
  { name: 'Aston Martin', color: '#229971', drivers: ['Fernando Alonso', 'Lance Stroll'] },
  { name: 'Alpine', color: '#FF87BC', drivers: ['Pierre Gasly', 'Jack Doohan'] },
  { name: 'Haas', color: '#B6BABD', drivers: ['Esteban Ocon', 'Oliver Bearman'] },
  { name: 'VCARB', color: '#6692FF', drivers: ['Yuki Tsunoda', 'Isack Hadjar'] },
  { name: 'Kick Sauber', color: '#52E252', drivers: ['Nico Hulkenberg', 'Gabriel Bortoleto'] },
  { name: 'Williams', color: '#64C4FF', drivers: ['Alexander Albon', 'Carlos Sainz'] },
];

export default function SignupPage() {
  const { signup, user } = useAuth();
  const router = useRouter();

  // Form Fields
  const [fullName, setFullName] = useState('');
  const [username, setUsername] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [favouriteTeam, setFavouriteTeam] = useState('Ferrari');
  const [favouriteDriver, setFavouriteDriver] = useState('Charles Leclerc');

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

  // If user is already logged in, redirect to dashboard
  useEffect(() => {
    if (user) {
      router.push('/');
    }
  }, [user, router]);

  // Update drivers list based on selected team
  useEffect(() => {
    const selectedTeamData = F1_TEAMS.find(t => t.name === favouriteTeam);
    if (selectedTeamData && selectedTeamData.drivers.length > 0) {
      setFavouriteDriver(selectedTeamData.drivers[0]);
    }
  }, [favouriteTeam]);

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

  const activeTeamColor = F1_TEAMS.find(t => t.name === favouriteTeam)?.color || '#E10600';

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg(null);

    // 1. Frontend validation
    if (!fullName || !username || !email || !password || !confirmPassword) {
      setErrorMsg('All fields are required to secure your seat.');
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

    const res = await signup({
      fullName,
      username: username.trim(),
      email: email.trim(),
      password,
      favouriteTeam,
      favouriteDriver,
    });

    setSubmitting(false);

    if (res.success) {
      setSuccess(true);
      setTimeout(() => {
        router.push('/');
      }, 3500);
    } else {
      setErrorMsg(res.error || 'Server error occurred during signup.');
    }
  };

  const currentDrivers = F1_TEAMS.find(t => t.name === favouriteTeam)?.drivers || [];

  return (
    <div className="min-h-screen grid-bg py-12 px-4 flex items-center justify-center relative overflow-hidden">
      {/* Dynamic Team Colored Background Aura */}
      <div
        className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[500px] h-[500px] rounded-full blur-[150px] opacity-10 transition-all duration-700 pointer-events-none"
        style={{ backgroundColor: activeTeamColor }}
      />

      <AnimatePresence mode="wait">
        {!success ? (
          <motion.div
            key="signup-card"
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -30 }}
            transition={{ duration: 0.4 }}
            className="w-full max-w-[650px] glass-card p-6 sm:p-8 relative overflow-hidden racing-stripe"
            style={{
              borderColor: `${activeTeamColor}33`,
              boxShadow: `0 10px 40px -10px rgba(0,0,0,0.7), 0 0 30px ${activeTeamColor}10`
            }}
          >
            {/* Header Checkered Accent */}
            <div className="absolute top-0 right-0 w-24 h-24 checkered opacity-5 pointer-events-none" />

            {/* Title block */}
            <div className="text-center mb-6 relative z-10">
              <div className="inline-block px-3 py-1 rounded bg-[#E10600]/10 border border-[#E10600]/20 text-[#E10600] text-[10px] font-bold tracking-[0.25em] uppercase mb-3 animate-pulse">
                Driver Registration
              </div>
              <h2 className="text-2xl sm:text-3xl font-display font-black tracking-wider text-themed">
                CREATING YOUR <span className="gradient-text">DRIVER ID</span>
              </h2>
              <p className="text-xs text-themed-secondary mt-1 max-w-sm mx-auto">
                Secure your F1 credentials, customize your garage telemetry, and join the championship race.
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
                    <span className="font-bold uppercase tracking-wider block text-[10px] text-red-500 mb-0.5">Pitstop Warning</span>
                    {errorMsg}
                  </div>
                </motion.div>
              )}
            </AnimatePresence>

            <form onSubmit={handleSubmit} className="space-y-4 relative z-10">
              {/* Row 1: Full Name & Username */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-1">
                  <label className="text-[11px] font-bold tracking-widest text-themed-secondary uppercase block">
                    Full Name
                  </label>
                  <div className="relative">
                    <UserIcon className="absolute left-3.5 top-1/2 -translate-y-1/2 text-themed-muted" size={15} />
                    <input
                      type="text"
                      required
                      placeholder="e.g. Sebastian Vettel"
                      value={fullName}
                      onChange={(e) => setFullName(e.target.value)}
                      className="w-full text-xs font-semibold pl-10 pr-4 py-2.5 rounded-lg border bg-themed-surface text-themed outline-none transition-all"
                      style={{
                        borderColor: 'var(--border)',
                        background: 'rgba(20, 20, 30, 0.4)'
                      }}
                      onFocus={(e) => (e.target.style.borderColor = activeTeamColor)}
                      onBlur={(e) => (e.target.style.borderColor = 'var(--border)')}
                    />
                  </div>
                </div>

                <div className="space-y-1">
                  <label className="text-[11px] font-bold tracking-widest text-themed-secondary uppercase block">
                    Username
                  </label>
                  <div className="relative">
                    <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-xs font-black text-themed-muted font-display">@</span>
                    <input
                      type="text"
                      required
                      placeholder="e.g. seb_5"
                      value={username}
                      onChange={(e) => setUsername(e.target.value)}
                      className="w-full text-xs font-semibold pl-8 pr-4 py-2.5 rounded-lg border bg-themed-surface text-themed outline-none transition-all"
                      style={{
                        borderColor: 'var(--border)',
                        background: 'rgba(20, 20, 30, 0.4)'
                      }}
                      onFocus={(e) => (e.target.style.borderColor = activeTeamColor)}
                      onBlur={(e) => (e.target.style.borderColor = 'var(--border)')}
                    />
                  </div>
                </div>
              </div>

              {/* Row 2: Email */}
              <div className="space-y-1">
                <label className="text-[11px] font-bold tracking-widest text-themed-secondary uppercase block">
                  Email Address
                </label>
                <div className="relative">
                  <Mail className="absolute left-3.5 top-1/2 -translate-y-1/2 text-themed-muted" size={15} />
                  <input
                    type="email"
                    required
                    placeholder="your.email@raceportal.com"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="w-full text-xs font-semibold pl-10 pr-4 py-2.5 rounded-lg border bg-themed-surface text-themed outline-none transition-all"
                    style={{
                      borderColor: 'var(--border)',
                      background: 'rgba(20, 20, 30, 0.4)'
                    }}
                    onFocus={(e) => (e.target.style.borderColor = activeTeamColor)}
                    onBlur={(e) => (e.target.style.borderColor = 'var(--border)')}
                  />
                </div>
              </div>

              {/* Row 3: Password & Confirm Password */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-1">
                  <label className="text-[11px] font-bold tracking-widest text-themed-secondary uppercase block">
                    Password
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
                      onFocus={(e) => (e.target.style.borderColor = activeTeamColor)}
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
                      onFocus={(e) => (e.target.style.borderColor = activeTeamColor)}
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

              {/* Row 4: Constructor selection (favouriteTeam) & Favourite Driver */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 border-t border-white/5 pt-4 mt-2">
                <div className="space-y-1">
                  <label className="text-[11px] font-bold tracking-widest text-white/95 uppercase block">
                    Constructor Affiliate (Favourite Team)
                  </label>
                  <div className="relative">
                    <Flag className="absolute left-3.5 top-1/2 -translate-y-1/2 text-themed-muted" size={15} />
                    <select
                      value={favouriteTeam}
                      onChange={(e) => setFavouriteTeam(e.target.value)}
                      className="w-full text-xs font-semibold pl-10 pr-4 py-2.5 rounded-lg border bg-[#0D0D14] text-white outline-none appearance-none cursor-pointer transition-all border-white/15"
                      style={{
                        borderColor: 'rgba(255, 255, 255, 0.15)',
                        backgroundImage: `url("data:image/svg+xml;charset=UTF-8,%3Csvg xmlns='http://www.w3.org/2000/svg' width='24' height='24' viewBox='0 0 24 24' fill='none' stroke='%239E9EBA' stroke-width='2' stroke-linecap='round' stroke-linejoin='round'%3E%3Cpolyline points='6 9 12 15 18 9'%3E%3C/polyline%3E%3C/svg%3E")`,
                        backgroundRepeat: 'no-repeat',
                        backgroundPosition: 'right 12px center',
                        backgroundSize: '16px'
                      }}
                    >
                      {F1_TEAMS.map((team) => (
                        <option key={team.name} value={team.name} className="bg-[#15151E] py-2 text-white">
                          {team.name}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>

                <div className="space-y-1">
                  <label className="text-[11px] font-bold tracking-widest text-white/95 uppercase block">
                    Select Favourite Driver
                  </label>
                  <div className="relative">
                    <UserIcon className="absolute left-3.5 top-1/2 -translate-y-1/2 text-themed-muted" size={15} />
                    <select
                      value={favouriteDriver}
                      onChange={(e) => setFavouriteDriver(e.target.value)}
                      className="w-full text-xs font-semibold pl-10 pr-4 py-2.5 rounded-lg border bg-[#0D0D14] text-white outline-none appearance-none cursor-pointer transition-all border-white/15"
                      style={{
                        borderColor: 'rgba(255, 255, 255, 0.15)',
                        backgroundImage: `url("data:image/svg+xml;charset=UTF-8,%3Csvg xmlns='http://www.w3.org/2000/svg' width='24' height='24' viewBox='0 0 24 24' fill='none' stroke='%239E9EBA' stroke-width='2' stroke-linecap='round' stroke-linejoin='round'%3E%3Cpolyline points='6 9 12 15 18 9'%3E%3C/polyline%3E%3C/svg%3E")`,
                        backgroundRepeat: 'no-repeat',
                        backgroundPosition: 'right 12px center',
                        backgroundSize: '16px'
                      }}
                    >
                      {currentDrivers.map((d) => (
                        <option key={d} value={d} className="bg-[#15151E] py-2 text-white">
                          {d}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>
              </div>

              {/* Submit Button */}
              <button
                type="submit"
                disabled={submitting}
                className="mt-6 w-full py-3.5 px-6 rounded-lg text-white font-display font-black tracking-widest text-xs uppercase flex items-center justify-center gap-2 relative overflow-hidden transition-all duration-300 outline-none shadow-lg"
                style={{
                  background: submitting ? 'rgba(30, 30, 46, 0.6)' : `linear-gradient(135deg, ${activeTeamColor} 0%, #000 200%)`,
                  boxShadow: submitting ? 'none' : `0 6px 20px -5px ${activeTeamColor}55`,
                  border: submitting ? '1px solid var(--border)' : `1px solid ${activeTeamColor}44`,
                  cursor: submitting ? 'not-allowed' : 'pointer'
                }}
              >
                {submitting ? (
                  <>
                    <svg className="animate-spin -ml-1 mr-3 h-4 w-4 text-white" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                    </svg>
                    <span>CONFIGURING ENGINE...</span>
                  </>
                ) : (
                  <>
                    <span>REGISTER AS {favouriteTeam.toUpperCase()} DRIVER</span>
                    <ChevronRight size={16} />
                  </>
                )}
              </button>
            </form>

            <div className="mt-6 text-center text-xs text-themed-secondary border-t border-white/5 pt-4">
              Already have an active F1 License?{' '}
              <Link href="/login" className="font-bold underline text-white hover:text-red-500 transition-colors">
                Sign In here
              </Link>
            </div>
          </motion.div>
        ) : (
          /* Checkered Flag Success Screen */
          <motion.div
            key="success-card"
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="w-full max-w-[480px] glass-card p-8 text-center relative overflow-hidden"
            style={{
              borderColor: '#10B98133',
              boxShadow: '0 10px 40px -10px rgba(0,0,0,0.8), 0 0 30px rgba(16,185,129,0.1)'
            }}
          >
            <div className="absolute inset-0 checkered opacity-5 pointer-events-none" />

            <div className="w-16 h-16 rounded-full bg-green-500/10 border border-green-500/30 flex items-center justify-center mx-auto mb-6">
              <CheckCircle2 size={36} className="text-green-500" />
            </div>

            <div className="px-3 py-1 rounded bg-green-500/15 border border-green-500/25 text-green-500 text-[10px] font-bold tracking-[0.2em] uppercase inline-block mb-4">
              Grid Position Secured
            </div>

            <h3 className="text-2xl font-display font-black tracking-wider text-themed mb-3">
              LICENSE ISSUED!
            </h3>
            
            <p className="text-xs text-themed-secondary leading-relaxed mb-6">
              Welcome, <span className="text-white font-bold">@{username}</span>! Your Formula 1 profile is locked and loaded. We've sent a high-speed verification link to your inbox.
            </p>

            <div className="p-4 rounded-xl border border-white/5 bg-white/2 flex items-center justify-center gap-3 text-left">
              <Flame size={20} style={{ color: activeTeamColor }} />
              <div>
                <span className="font-bold uppercase tracking-wider block text-[9px]" style={{ color: activeTeamColor }}>
                  Constructor Fanbase Joined
                </span>
                <span className="text-xs font-semibold text-themed">{favouriteTeam} Formula 1 Team</span>
              </div>
            </div>

            <div className="mt-8 space-y-2">
              <div className="shimmer h-1 w-32 rounded-full mx-auto" />
              <p className="text-[10px] text-themed-muted font-semibold tracking-wider">
                WARMING UP TYRES • REDIRECTING...
              </p>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
