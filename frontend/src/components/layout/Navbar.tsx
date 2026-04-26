'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { motion, AnimatePresence } from 'framer-motion';
import { useState } from 'react';
import { useTheme } from '@/context/ThemeContext';
import { useSocket } from '@/context/SocketContext';
import {
  Flag, Users, Trophy, Calendar, Radio, GitCompare,
  Sun, Moon, Menu, X, Wifi, WifiOff
} from 'lucide-react';

const navLinks = [
  { href: '/', label: 'Dashboard', icon: Flag },
  { href: '/drivers', label: 'Drivers', icon: Users },
  { href: '/teams', label: 'Teams', icon: Trophy },
  { href: '/calendar', label: 'Calendar', icon: Calendar },
  { href: '/live', label: 'Live Race', icon: Radio },
  { href: '/compare', label: 'Compare', icon: GitCompare },
];

export default function Navbar() {
  const pathname = usePathname();
  const { isDark, toggleTheme } = useTheme();
  const { isConnected } = useSocket();
  const [mobileOpen, setMobileOpen] = useState(false);

  return (
    <>
      <nav className="fixed top-0 left-0 right-0 z-50 border-b border-white/5" style={{ background: 'rgba(13,13,20,0.85)', backdropFilter: 'blur(20px)' }}>
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
                <p className="font-display font-bold text-white text-sm tracking-wider">FORMULA 1</p>
                <p className="text-[10px] text-[#6B6B8D] tracking-widest uppercase">Live Timing</p>
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
                      color: isActive ? '#FFFFFF' : '#6B6B8D',
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
                    {href === '/live' && (
                      <span className="relative z-10 w-1.5 h-1.5 rounded-full bg-[#E10600] live-pulse" />
                    )}
                  </Link>
                );
              })}
            </div>

            {/* Right side */}
            <div className="flex items-center gap-3">
              {/* Connection status */}
              <div className="hidden sm:flex items-center gap-1.5 text-xs">
                {isConnected ? (
                  <>
                    <Wifi size={12} className="text-green-400" />
                    <span className="text-green-400">Live</span>
                  </>
                ) : (
                  <>
                    <WifiOff size={12} className="text-[#6B6B8D]" />
                    <span className="text-[#6B6B8D]">Offline</span>
                  </>
                )}
              </div>

              {/* Theme toggle */}
              <button
                onClick={toggleTheme}
                className="p-2 rounded-lg transition-colors hover:bg-white/5"
                aria-label="Toggle theme"
              >
                {isDark ? <Sun size={18} className="text-[#6B6B8D]" /> : <Moon size={18} className="text-[#6B6B8D]" />}
              </button>

              {/* Mobile menu button */}
              <button
                onClick={() => setMobileOpen(!mobileOpen)}
                className="lg:hidden p-2 rounded-lg hover:bg-white/5"
                aria-label="Toggle menu"
              >
                {mobileOpen ? <X size={20} className="text-white" /> : <Menu size={20} className="text-white" />}
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
            className="fixed top-16 left-0 right-0 z-40 border-b border-white/5 lg:hidden"
            style={{ background: 'rgba(13,13,20,0.95)', backdropFilter: 'blur(20px)' }}
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
                      color: isActive ? '#FFFFFF' : '#6B6B8D',
                      background: isActive ? 'rgba(225,6,0,0.15)' : 'transparent',
                    }}
                  >
                    <Icon size={18} />
                    <span>{label}</span>
                    {href === '/live' && (
                      <span className="w-1.5 h-1.5 rounded-full bg-[#E10600] live-pulse ml-auto" />
                    )}
                  </Link>
                );
              })}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}
