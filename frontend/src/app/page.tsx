'use client';

import { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { getDriverStandings, getConstructorStandings, getRaces, getNextRace } from '@/lib/api';
import StatsCard from '@/components/dashboard/StatsCard';
import StandingsTable from '@/components/dashboard/StandingsTable';
import NextRaceCountdown from '@/components/dashboard/NextRaceCountdown';
import { Standing, Race } from '@/types';
import { Trophy, Flag, Users, Gauge } from 'lucide-react';

export default function HomePage() {
  const [driverStandings, setDriverStandings] = useState<Standing[]>([]);
  const [constructorStandings, setConstructorStandings] = useState<Standing[]>([]);
  const [nextRace, setNextRace] = useState<any>(null);
  const [races, setRaces] = useState<Race[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchData() {
      try {
        const [ds, cs, nr, r] = await Promise.all([
          getDriverStandings(),
          getConstructorStandings(),
          getNextRace(),
          getRaces(),
        ]);
        setDriverStandings(ds || []);
        setConstructorStandings(cs || []);
        setNextRace(nr);
        setRaces(r || []);
      } catch (err) {
        console.error('Failed to fetch data:', err);
      } finally {
        setLoading(false);
      }
    }
    fetchData();
  }, []);

  const completedRaces = races.filter(r => r.isPast).length;
  const totalRaces = races.length;
  const leader = driverStandings[0]?.driver;
  const totalPoints = driverStandings.reduce((sum, s) => sum + parseFloat(s.points || '0'), 0);

  if (loading) {
    return (
      <div className="min-h-screen grid-bg flex items-center justify-center">
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="text-center"
        >
          <div className="w-16 h-16 mx-auto mb-4 rounded-2xl bg-gradient-to-br from-[#E10600] to-[#B30500] flex items-center justify-center shadow-lg shadow-red-500/30">
            <span className="text-white font-display font-black text-xl">F1</span>
          </div>
          <div className="shimmer h-1 w-48 rounded-full mx-auto mb-3" />
          <p className="text-sm font-semibold" style={{ color: 'var(--text-secondary)' }}>Loading race data...</p>
        </motion.div>
      </div>
    );
  }

  return (
    <div className="min-h-screen grid-bg">
      {/* Hero Section */}
      <section className="relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-b from-[#E10600]/5 via-transparent to-transparent" />
        <div className="max-w-[1400px] mx-auto px-4 sm:px-6 pt-8 pb-4">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="mb-8"
          >
            <p className="text-xs font-bold uppercase tracking-[0.3em] text-[#E10600] mb-2">
              2026 Season
            </p>
            <h1 className="text-4xl sm:text-5xl lg:text-6xl font-display font-black leading-tight" style={{ color: 'var(--text-primary)' }}>
              FORMULA <span className="gradient-text">ONE</span>
            </h1>
            <p className="mt-2 text-sm sm:text-base max-w-lg" style={{ color: 'var(--text-secondary)' }}>
              Live timing, standings, and race data. Your complete F1 command center.
            </p>
          </motion.div>

          {/* Stats Cards */}
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4 mb-8">
            <StatsCard
              label="Races Complete"
              value={`${completedRaces}/${totalRaces}`}
              icon={<Flag size={18} className="text-[#E10600]" />}
              accent="#E10600"
              delay={0}
            />
            <StatsCard
              label="Championship Leader"
              value={leader ? `${leader.code}` : '-'}
              icon={<Trophy size={18} className="text-[#FFD700]" />}
              accent="#FFD700"
              delay={0.1}
            />
            <StatsCard
              label="Active Drivers"
              value="20"
              icon={<Users size={18} className="text-[#27F4D2]" />}
              accent="#27F4D2"
              delay={0.2}
            />
            <StatsCard
              label="Total Points"
              value={Math.round(totalPoints)}
              icon={<Gauge size={18} className="text-[#FF8000]" />}
              accent="#FF8000"
              delay={0.3}
            />
          </div>
        </div>
      </section>

      {/* Main Content */}
      <section className="max-w-[1400px] mx-auto px-4 sm:px-6 pb-16">
        <div className="grid lg:grid-cols-3 gap-6">
          {/* Left column - Countdown + Constructor standings */}
          <div className="lg:col-span-1 space-y-6">
            <NextRaceCountdown race={nextRace} />
            <StandingsTable standings={constructorStandings} type="constructor" limit={10} />
          </div>

          {/* Right column - Driver standings */}
          <div className="lg:col-span-2">
            <StandingsTable standings={driverStandings} type="driver" limit={20} />
          </div>
        </div>
      </section>
    </div>
  );
}
