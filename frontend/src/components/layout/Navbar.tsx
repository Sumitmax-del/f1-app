'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { motion, AnimatePresence } from 'framer-motion';
import { useState, useRef, useEffect } from 'react';
import { useTheme } from '@/context/ThemeContext';
import { useSocket } from '@/context/SocketContext';
import { useAuth } from '@/context/AuthContext';
import {
  Flag, Users, Trophy, Calendar, MapPin, GitCompare, Activity,
  Sun, Moon, Menu, X, Wifi, WifiOff, LogOut, User as UserIcon, ShieldAlert, CheckCircle2
} from 'lucide-react';

const navLinks = [
  { href: '/', label: 'Dashboard', icon: Flag },
  { href: '/drivers', label: 'Drivers', icon: Users },
  { href: '/teams', label: 'Teams', icon: Trophy },
  { href: '/calendar', label: 'Calendar', icon: Calendar },
  { href: '/live', label: 'Race Tracks', icon: MapPin },
  { href: '/compare', label: 'Compare', icon: GitCompare },
  { href: '/blueprint', label: 'Blueprint', icon: Activity },
];

const teamColors: Record<string, string> = {
  'Red Bull': '#3671C6',
  'McLaren': '#FF8000',
  'Ferrari': '#E8002D',
  'Mercedes': '#27F4D2',
  'Aston Martin': '#229971',
  'Alpine': '#FF87BC',
  'Haas': '#B6BABD',
  'VCARB': '#6692FF',
  'Kick Sauber': '#52E252',
  'Williams': '#64C4FF',
};

export default function Navbar() {
  const pathname = usePathname();
  const { isDark, toggleTheme } = useTheme();
  const { isConnected } = useSocket();
  const { user, logout, resendVerification } = useAuth();
  const [mobileOpen, setMobileOpen] = useState(false);
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const [resendStatus, setResendStatus] = useState<{ success?: boolean; message?: string } | null>(null);
  const [sendingEmail, setSendingEmail] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  // Close dropdown on click outside
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setDropdownOpen(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleResend = async () => {
    setSendingEmail(true);
    setResendStatus(null);
    const res = await resendVerification();
    setSendingEmail(false);
    if (res.success) {
      setResendStatus({ success: true, message: res.message });
      setTimeout(() => setResendStatus(null), 5000);
    } else {
      setResendStatus({ success: false, message: res.error });
      setTimeout(() => setResendStatus(null), 5000);
    }
  };

  const userColor = user ? (teamColors[user.favouriteTeam] || '#E10600') : '#E10600';

  return (
    <>
      <nav className="fixed top-0 left-0 right-0 z-50" style={{ background: 'var(--nav-bg)', backdropFilter: 'blur(20px)', borderBottom: '1px solid var(--border)' }}>
        {/* Verification Alert Banner */}
        {user && !user.emailVerified && (
          <div className="bg-gradient-to-r from-amber-600/90 to-amber-700/90 text-white text-[13px] py-1.5 px-4 font-semibold text-center flex items-center justify-center gap-2 border-b border-amber-500/20">
            <ShieldAlert size={14} className="animate-bounce" />
            <span>Welcome, driver! Please verify your email to unlock all live metrics.</span>
            <button
              onClick={handleResend}
              disabled={sendingEmail}
              className="underline hover:text-amber-200 transition-colors ml-2 bg-amber-500/30 px-2 py-0.5 rounded text-xs"
            >
              {sendingEmail ? 'Re-dispatching...' : 'Re-send Verification'}
            </button>
            {resendStatus && (
              <span className={`ml-2 px-2 py-0.5 rounded text-xs font-bold ${resendStatus.success ? 'bg-green-500 text-white' : 'bg-red-500 text-white'}`}>
                {resendStatus.message}
              </span>
            )}
          </div>
        )}

        <div className="max-w-[1400px] mx-auto px-4 sm:px-6">
          <div className="flex items-center justify-between h-16">
            {/* Logo */}
            <Link href="/" className="flex items-center gap-3 group">
              <div className="relative">
                <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-[#E10600] to-[#B30500] flex items-center justify-center shadow-lg shadow-red-500/20 group-hover:shadow-red-500/40 transition-shadow">
                  <span className="text-white font-display font-black text-sm">F1</span>
                </div>
                <div className="absolute -top-0.5 -right-0.5 w-2.5 h-2.5 bg-[#E10600] rounded-full live-pulse" />
              </div>
              <div className="hidden sm:block">
                <p className="font-display font-bold text-sm tracking-wider" style={{ color: 'var(--text-primary)' }}>FORMULA 1</p>
                <p className="text-[10px] tracking-widest uppercase" style={{ color: 'var(--text-secondary)' }}>Live Timing</p>
              </div>
            </Link>

            {/* Desktop Nav */}
            <div className="hidden lg:flex items-center gap-1">
              {navLinks.map(({ href, label, icon: Icon }) => {
                const isActive = pathname === href;
                return (
                  <Link
                    key={href}
                    href={href}
                    className="relative px-4 py-2 rounded-lg flex items-center gap-2 text-sm font-semibold transition-all duration-200"
                    style={{
                      color: isActive ? 'var(--text-primary)' : 'var(--text-secondary)',
                    }}
                  >
                    {isActive && (
                      <motion.div
                        layoutId="navIndicator"
                        className="absolute inset-0 rounded-lg"
                        style={{ background: 'rgba(225,6,0,0.15)', border: '1px solid rgba(225,6,0,0.3)' }}
                        transition={{ type: 'spring', stiffness: 300, damping: 30 }}
                      />
                    )}
                    <Icon size={16} className="relative z-10" />
                    <span className="relative z-10">{label}</span>

                  </Link>
                );
              })}
            </div>

            {/* Right side */}
            <div className="flex items-center gap-3">
              {/* Connection status */}
              <div className="hidden sm:flex items-center gap-1.5 text-xs mr-1">
                {isConnected ? (
                  <>
                    <Wifi size={12} className="text-green-500" />
                    <span className="text-green-500 font-semibold">Live</span>
                  </>
                ) : (
                  <>
                    <WifiOff size={12} style={{ color: 'var(--text-secondary)' }} />
                    <span style={{ color: 'var(--text-secondary)' }}>Offline</span>
                  </>
                )}
              </div>

              {/* Theme toggle */}
              <button
                onClick={toggleTheme}
                className="p-2 rounded-lg transition-colors hover:bg-[rgba(255,255,255,0.03)]"
                style={{ color: 'var(--text-secondary)' }}
                aria-label="Toggle theme"
              >
                {isDark ? <Sun size={18} /> : <Moon size={18} />}
              </button>

              {/* Auth Area */}
              {user ? (
                /* Logged in state dropdown */
                <div className="relative" ref={dropdownRef}>
                  <button
                    onClick={() => setDropdownOpen(!dropdownOpen)}
                    className="flex items-center gap-2.5 p-1 rounded-full transition-all duration-200 outline-none"
                    style={{ border: `2px solid ${userColor}`, background: 'rgba(30, 30, 46, 0.4)' }}
                  >
                    <div className="w-8 h-8 rounded-full bg-gradient-to-br from-[#1E1E2E] to-[#2A2A3E] flex items-center justify-center text-white font-bold text-sm">
                      {user.fullName.charAt(0).toUpperCase()}
                    </div>
                    <span className="hidden sm:inline text-xs font-bold pr-2 tracking-wider uppercase" style={{ color: 'var(--text-primary)' }}>
                      {user.username}
                    </span>
                  </button>

                  <AnimatePresence>
                    {dropdownOpen && (
                      <motion.div
                        initial={{ opacity: 0, y: 10, scale: 0.95 }}
                        animate={{ opacity: 1, y: 0, scale: 1 }}
                        exit={{ opacity: 0, y: 10, scale: 0.95 }}
                        transition={{ duration: 0.15 }}
                        className="absolute right-0 mt-2.5 w-64 glass-card p-4 shadow-2xl z-50 text-left border border-white/5"
                        style={{ background: 'var(--nav-bg-solid)', backdropFilter: 'blur(30px)' }}
                      >
                        <div className="border-b border-white/5 pb-3 mb-3">
                          <p className="text-sm font-bold truncate text-themed">{user.fullName}</p>
                          <p className="text-xs text-themed-secondary truncate">{user.email}</p>
                          <div className="mt-2 flex items-center gap-1.5">
                            <span className="w-2.5 h-2.5 rounded-full inline-block" style={{ backgroundColor: userColor }} />
                            <span className="text-[10px] uppercase font-display font-bold tracking-wider" style={{ color: userColor }}>
                              {user.favouriteTeam} Fan
                            </span>
                          </div>
                        </div>

                        <div className="space-y-2">
                          <div className="flex items-center justify-between text-xs px-2 py-1.5 rounded bg-white/2">
                            <span className="text-themed-secondary">Favourite Driver:</span>
                            <span className="font-bold text-themed">{user.favouriteDriver}</span>
                          </div>

                          <div className="flex items-center justify-between text-xs px-2 py-1.5 rounded bg-white/2">
                            <span className="text-themed-secondary">Verification Status:</span>
                            {user.emailVerified ? (
                              <span className="flex items-center gap-1 text-green-500 font-bold text-[10px] uppercase">
                                <CheckCircle2 size={10} /> Verified
                              </span>
                            ) : (
                              <span className="flex items-center gap-1 text-amber-500 font-bold text-[10px] uppercase">
                                <ShieldAlert size={10} /> Unverified
                              </span>
                            )}
                          </div>
                        </div>

                        <button
                          onClick={() => { setDropdownOpen(false); logout(); }}
                          className="mt-4 w-full flex items-center justify-center gap-2 py-2 px-3 rounded-lg bg-red-600/10 border border-red-600/20 hover:bg-red-600 hover:text-white transition-all text-xs font-bold text-red-500 outline-none"
                        >
                          <LogOut size={14} />
                          <span>SIGN OUT</span>
                        </button>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>
              ) : (
                /* Logged out state link options (Unified single button) */
                <div className="hidden sm:flex items-center">
                  <Link
                    href="/login"
                    className="relative px-4 py-2 rounded-lg text-xs font-black tracking-widest transition-all uppercase text-white shadow-lg overflow-hidden flex items-center justify-center gap-1.5 border border-red-600/35 hover:scale-[1.02] hover:shadow-red-600/40 active:scale-95 duration-200"
                    style={{
                      background: 'linear-gradient(135deg, #E10600 0%, #B30500 100%)',
                      boxShadow: '0 4px 12px rgba(225, 6, 0, 0.2)'
                    }}
                  >
                    <span>SIGN IN / REGISTER</span>
                  </Link>
                </div>
              )}

              {/* Mobile menu button */}
              <button
                onClick={() => setMobileOpen(!mobileOpen)}
                className="lg:hidden p-2 rounded-lg hover:bg-[rgba(255,255,255,0.03)]"
                aria-label="Toggle menu"
              >
                {mobileOpen
                  ? <X size={20} style={{ color: 'var(--text-primary)' }} />
                  : <Menu size={20} style={{ color: 'var(--text-primary)' }} />
                }
              </button>
            </div>
          </div>
        </div>
      </nav>

      {/* Mobile menu */}
      <AnimatePresence>
        {mobileOpen && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            className="fixed top-16 left-0 right-0 z-40 lg:hidden"
            style={{ background: 'var(--nav-bg-solid)', backdropFilter: 'blur(20px)', borderBottom: '1px solid var(--border)' }}
          >
            <div className="p-4 space-y-1">
              {navLinks.map(({ href, label, icon: Icon }) => {
                const isActive = pathname === href;
                return (
                  <Link
                    key={href}
                    href={href}
                    onClick={() => setMobileOpen(false)}
                    className="flex items-center gap-3 px-4 py-3 rounded-lg text-sm font-semibold transition-all"
                    style={{
                      color: isActive ? 'var(--text-primary)' : 'var(--text-secondary)',
                      background: isActive ? 'rgba(225,6,0,0.15)' : 'transparent',
                    }}
                  >
                    <Icon size={18} />
                    <span>{label}</span>

                  </Link>
                );
              })}

              {/* Auth links for Mobile (Unified single button) */}
              {!user ? (
                <div className="pt-4 border-t border-white/5 mt-4">
                  <Link
                    href="/login"
                    onClick={() => setMobileOpen(false)}
                    className="block py-3 rounded-lg text-center text-xs font-black tracking-widest text-white transition-all uppercase hover:scale-[1.01] active:scale-95 duration-200"
                    style={{ background: 'linear-gradient(135deg, #E10600 0%, #B30500 100%)' }}
                  >
                    SIGN IN / REGISTER
                  </Link>
                </div>
              ) : (
                <div className="pt-4 border-t border-white/5 mt-4 space-y-2 text-xs">
                  <div className="px-4 py-2 bg-white/2 rounded-lg">
                    <p className="font-bold text-themed">{user.fullName} (@{user.username})</p>
                    <p className="text-[10px] text-themed-secondary mt-0.5">{user.email}</p>
                    <p className="text-[10px] mt-1 font-semibold uppercase" style={{ color: userColor }}>
                      {user.favouriteTeam} Fan • Driver: {user.favouriteDriver}
                    </p>
                  </div>
                  <button
                    onClick={() => { setMobileOpen(false); logout(); }}
                    className="w-full flex items-center justify-center gap-2 py-3 rounded-lg bg-red-600/10 text-red-500 font-bold border border-red-600/20 uppercase"
                  >
                    <LogOut size={14} />
                    <span>Sign Out</span>
                  </button>
                </div>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}
