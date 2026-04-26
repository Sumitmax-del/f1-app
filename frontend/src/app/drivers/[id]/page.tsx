'use client';

import { useEffect, useState } from 'react';
import { useParams } from 'next/navigation';
import { motion } from 'framer-motion';
import { getDriver, getDriverStandings } from '@/lib/api';
import { NATIONALITY_FLAGS } from '@/types';
import { LineChart, Line, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid } from 'recharts';
import { ArrowLeft, Trophy, Medal, CircleDot, Calendar } from 'lucide-react';
import Link from 'next/link';

export default function DriverProfilePage() {
  const params = useParams();
  const [driver, setDriver] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (params.id) {
      getDriver(params.id as string)
        .then(d => { setDriver(d); setLoading(false); })
        .catch(() => setLoading(false));
    }
  }, [params.id]);

  if (loading) {
    return (
      <div className="min-h-screen grid-bg flex items-center justify-center">
        <div className="shimmer w-48 h-2 rounded-full" />
      </div>
    );
  }

  if (!driver) {
    return (
      <div className="min-h-screen grid-bg flex items-center justify-center">
        <p className="text-[#6B6B8D]">Driver not found</p>
      </div>
    );
  }

  const teamColor = driver.team?.color || '#666';
  const flag = NATIONALITY_FLAGS[driver.nationality] || '🏁';

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
        <Link href="/drivers" className="inline-flex items-center gap-2 text-[#6B6B8D] hover:text-white text-sm mb-6 transition-colors">
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
              <div className="w-28 h-28 rounded-2xl flex items-center justify-center text-4xl font-display font-black text-white border-2"
                style={{ background: `${teamColor}20`, borderColor: `${teamColor}40` }}
              >
                {driver.code}
              </div>
              <div>
                <p className="text-sm text-[#6B6B8D] font-bold uppercase tracking-widest mb-1">#{driver.permanentNumber}</p>
                <h1 className="text-4xl sm:text-5xl font-display font-black text-white">
                  <span className="font-light text-[#6B6B8D]">{driver.givenName}</span>{' '}
                  <span className="uppercase">{driver.familyName}</span>
                </h1>
                <div className="flex items-center gap-3 mt-3">
                  <div className="w-3 h-3 rounded-full" style={{ background: teamColor }} />
                  <span className="text-sm font-semibold" style={{ color: teamColor }}>{driver.team?.name}</span>
                  <span className="text-2xl ml-2">{flag}</span>
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
              <p className="text-2xl font-display font-bold text-white">{stat.value}</p>
              <p className="text-xs text-[#6B6B8D] uppercase tracking-wider mt-1">{stat.label}</p>
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
          <h3 className="font-display font-bold text-white text-sm tracking-wider uppercase mb-6">Points Progression</h3>
          <div className="h-64 sm:h-80">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={pointsData}>
                <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" />
                <XAxis dataKey="race" tick={{ fill: '#6B6B8D', fontSize: 12 }} axisLine={false} />
                <YAxis tick={{ fill: '#6B6B8D', fontSize: 12 }} axisLine={false} />
                <Tooltip
                  contentStyle={{
                    background: 'rgba(30,30,46,0.95)',
                    border: '1px solid rgba(225,6,0,0.3)',
                    borderRadius: '8px',
                    color: '#fff',
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
