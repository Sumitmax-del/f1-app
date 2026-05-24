'use client';

import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { motion } from 'framer-motion';
import { getDriver, getDriverStandings } from '@/lib/api';
import { NATIONALITY_FLAGS } from '@/types';
import { LineChart, Line, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid } from 'recharts';
import { ArrowLeft, Trophy, Medal, CircleDot, Calendar, Star } from 'lucide-react';
import Link from 'next/link';
import { useAuth } from '@/context/AuthContext';

export default function DriverProfilePage() {
  const params = useParams();
  const router = useRouter();
  const { user, loading: authLoading, updateFavorites } = useAuth();
  
  const [driver, setDriver] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [updating, setUpdating] = useState(false);

  // Auth Guard
  useEffect(() => {
    if (!authLoading && !user) {
      router.push('/login');
    }
  }, [user, authLoading, router]);

  useEffect(() => {
    if (user && params.id) {
      getDriver(params.id as string)
        .then(d => { setDriver(d); setLoading(false); })
        .catch(() => setLoading(false));
    }
  }, [user, params.id]);

  if (authLoading || loading) {
    return (
      <div className="min-h-screen grid-bg flex items-center justify-center">
        <div className="shimmer w-48 h-2 rounded-full" />
      </div>
    );
  }

  if (!driver) {
    return (
      <div className="min-h-screen grid-bg flex items-center justify-center">
        <p style={{ color: 'var(--text-secondary)' }}>Driver not found</p>
      </div>
    );
  }

  const driverFullName = `${driver.givenName} ${driver.familyName}`;
  const isFavourite = user?.favouriteDriver === driverFullName;
  const teamColor = driver.team?.color || '#666';
  const flag = NATIONALITY_FLAGS[driver.nationality] || '🏁';

  const handleToggleFavourite = async () => {
    if (updating) return;
    setUpdating(true);
    const newFavourite = isFavourite ? '' : driverFullName;
    await updateFavorites({ favouriteDriver: newFavourite });
    setUpdating(false);
  };

  // Simulated points progression for chart
  const pointsData = Array.from({ length: 10 }, (_, i) => ({
    race: `R${i + 1}`,
    points: Math.round((driver.points || 100) * ((i + 1) / 10) + (Math.random() - 0.5) * 15),
  }));

  const stats = [
    { icon: <Trophy size={20} />, label: 'Championship Position', value: `P${driver.position || '-'}`, color: '#FFD700' },
    { icon: <Medal size={20} />, label: 'Points', value: driver.points || 0, color: teamColor },
    { icon: <CircleDot size={20} />, label: 'Wins', value: driver.wins || 0, color: '#E10600' },
    { icon: <Calendar size={20} />, label: 'Nationality', value: `${flag} ${driver.nationality}`, color: '#27F4D2' },
  ];

  return (
    <div className="min-h-screen grid-bg">
      <div className="max-w-[1400px] mx-auto px-4 sm:px-6 py-8">
        {/* Back */}
        <Link href="/drivers" className="inline-flex items-center gap-2 transition-colors hover:opacity-80 text-sm mb-6" style={{ color: 'var(--text-secondary)' }}>
          <ArrowLeft size={16} /> Back to Drivers
        </Link>

        {/* Hero */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="glass-card overflow-hidden mb-8"
        >
          <div className="h-1.5 w-full" style={{ background: `linear-gradient(90deg, ${teamColor}, ${teamColor}44)` }} />
          <div className="p-8 sm:p-12 relative">
            <div className="absolute top-0 right-0 text-[200px] font-display font-black leading-none opacity-5 select-none"
              style={{ color: teamColor }}
            >
              {driver.permanentNumber}
            </div>
            <div className="relative flex flex-col sm:flex-row items-start gap-8">
              {/* Avatar */}
              <div className="w-28 h-28 rounded-2xl flex items-center justify-center text-4xl font-display font-black border-2"
                style={{ background: `${teamColor}20`, borderColor: `${teamColor}40`, color: 'var(--text-primary)' }}
              >
                {driver.code}
              </div>
              <div className="flex-1">
                <p className="text-sm font-bold uppercase tracking-widest mb-1" style={{ color: 'var(--text-secondary)' }}>#{driver.permanentNumber}</p>
                <h1 className="text-4xl sm:text-5xl font-display font-black text-themed">
                  <span className="font-light" style={{ color: 'var(--text-secondary)' }}>{driver.givenName}</span>{' '}
                  <span className="uppercase">{driver.familyName}</span>
                </h1>
                
                <div className="flex flex-wrap items-center gap-4 mt-3">
                  <div className="flex items-center gap-2">
                    <div className="w-3 h-3 rounded-full" style={{ background: teamColor }} />
                    <span className="text-sm font-semibold" style={{ color: teamColor }}>{driver.team?.name}</span>
                  </div>
                  <span className="text-2xl">{flag}</span>
                  
                  {/* Favourite Driver Toggle */}
                  <button
                    onClick={handleToggleFavourite}
                    disabled={updating}
                    className="flex items-center gap-2 px-3 py-1.5 rounded-lg text-xs font-bold transition-all border outline-none cursor-pointer hover:opacity-90 active:scale-95"
                    style={{
                      borderColor: isFavourite ? '#FFD70044' : 'var(--border)',
                      background: isFavourite ? 'rgba(255, 215, 0, 0.1)' : 'rgba(255,255,255,0.02)',
                      color: isFavourite ? '#FFD700' : 'var(--text-secondary)'
                    }}
                  >
                    <Star size={13} fill={isFavourite ? '#FFD700' : 'transparent'} style={{ color: isFavourite ? '#FFD700' : 'currentColor' }} />
                    <span>{isFavourite ? 'MY FAVOURITE DRIVER' : 'SET AS FAVOURITE'}</span>
                  </button>
                </div>
              </div>
            </div>
          </div>
        </motion.div>

        {/* Stats Grid */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
          {stats.map((stat, i) => (
            <motion.div
              key={stat.label}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.1 + i * 0.05 }}
              className="glass-card p-5"
            >
              <div className="p-2 rounded-lg inline-block mb-3" style={{ background: `${stat.color}15` }}>
                <span style={{ color: stat.color }}>{stat.icon}</span>
              </div>
              <p className="text-2xl font-display font-bold" style={{ color: 'var(--text-primary)' }}>{stat.value}</p>
              <p className="text-xs uppercase tracking-wider mt-1" style={{ color: 'var(--text-secondary)' }}>{stat.label}</p>
            </motion.div>
          ))}
        </div>

        {/* Points Chart */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4 }}
          className="glass-card p-6"
        >
          <h3 className="font-display font-bold text-sm tracking-wider uppercase mb-6" style={{ color: 'var(--text-primary)' }}>Points Progression</h3>
          <div className="h-64 sm:h-80">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={pointsData}>
                <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" />
                <XAxis dataKey="race" tick={{ fill: 'var(--text-secondary)', fontSize: 12 }} axisLine={false} />
                <YAxis tick={{ fill: 'var(--text-secondary)', fontSize: 12 }} axisLine={false} />
                <Tooltip
                  contentStyle={{
                    background: 'var(--surface-solid)',
                    border: '1px solid var(--border)',
                    borderRadius: '8px',
                    color: 'var(--text-primary)',
                  }}
                />
                <Line
                  type="monotone"
                  dataKey="points"
                  stroke={teamColor}
                  strokeWidth={2}
                  dot={{ fill: teamColor, r: 4, strokeWidth: 0 }}
                  activeDot={{ fill: '#fff', stroke: teamColor, strokeWidth: 2, r: 6 }}
                />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </motion.div>
      </div>
    </div>
  );
}
