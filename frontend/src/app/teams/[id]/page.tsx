'use client';

import { useEffect, useState } from 'react';
import { useParams } from 'next/navigation';
import { motion } from 'framer-motion';
import { getTeam } from '@/lib/api';
import { ArrowLeft, Trophy, Medal, Users } from 'lucide-react';
import Link from 'next/link';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid } from 'recharts';

export default function TeamDetailPage() {
  const params = useParams();
  const [team, setTeam] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (params.id) {
      getTeam(params.id as string)
        .then(t => { setTeam(t); setLoading(false); })
        .catch(() => setLoading(false));
    }
  }, [params.id]);

  if (loading) return <div className="min-h-screen grid-bg flex items-center justify-center"><div className="shimmer w-48 h-2 rounded-full" /></div>;
  if (!team) return <div className="min-h-screen grid-bg flex items-center justify-center"><p className="text-[#6B6B8D]">Team not found</p></div>;

  const driverData = (team.drivers || []).map((d: any) => ({
    name: d.code || d.familyName?.substring(0, 3).toUpperCase(),
    points: d.points || 0,
    wins: d.wins || 0,
  }));

  return (
    <div className="min-h-screen grid-bg">
      <div className="max-w-[1400px] mx-auto px-4 sm:px-6 py-8">
        <Link href="/teams" className="inline-flex items-center gap-2 text-[#6B6B8D] hover:text-white text-sm mb-6 transition-colors">
          <ArrowLeft size={16} /> Back to Teams
        </Link>

        {/* Hero */}
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="glass-card overflow-hidden mb-8">
          <div className="h-2 w-full" style={{ background: team.color }} />
          <div className="p-8 sm:p-12 relative">
            <div className="absolute top-4 right-8 text-[120px] font-display font-black leading-none opacity-5"
              style={{ color: team.color }}
            >
              P{team.position}
            </div>
            <span className="text-xs font-bold uppercase tracking-[0.3em] text-[#6B6B8D]">Constructor</span>
            <h1 className="text-4xl sm:text-5xl font-display font-black text-white mt-2">{team.name}</h1>
            <p className="text-sm text-[#6B6B8D] mt-2">{team.nationality}</p>
          </div>
        </motion.div>

        <div className="grid lg:grid-cols-3 gap-4 mb-8">
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }} className="glass-card p-5">
            <Trophy size={20} style={{ color: team.color }} className="mb-3" />
            <p className="text-3xl font-display font-bold text-white">P{team.position}</p>
            <p className="text-xs text-[#6B6B8D] uppercase tracking-wider">Championship</p>
          </motion.div>
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.15 }} className="glass-card p-5">
            <Medal size={20} style={{ color: team.color }} className="mb-3" />
            <p className="text-3xl font-display font-bold text-white">{team.points}</p>
            <p className="text-xs text-[#6B6B8D] uppercase tracking-wider">Total Points</p>
          </motion.div>
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }} className="glass-card p-5">
            <Users size={20} style={{ color: team.color }} className="mb-3" />
            <p className="text-3xl font-display font-bold text-white">{team.wins || 0}</p>
            <p className="text-xs text-[#6B6B8D] uppercase tracking-wider">Race Wins</p>
          </motion.div>
        </div>

        {/* Drivers */}
        <div className="grid sm:grid-cols-2 gap-4 mb-8">
          {(team.drivers || []).map((driver: any, i: number) => (
            <Link key={driver.driverId} href={`/drivers/${driver.driverId}`}>
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.3 + i * 0.1 }}
                whileHover={{ y: -2 }}
                className="glass-card p-6 cursor-pointer group"
              >
                <div className="flex items-center gap-4">
                  <div className="w-16 h-16 rounded-xl flex items-center justify-center text-2xl font-display font-bold text-white border"
                    style={{ background: `${team.color}20`, borderColor: `${team.color}40` }}
                  >
                    {driver.code || '??'}
                  </div>
                  <div>
                    <p className="text-lg font-bold text-white group-hover:text-white/90">
                      {driver.givenName} <span className="uppercase">{driver.familyName}</span>
                    </p>
                    <p className="text-sm text-[#6B6B8D]">#{driver.permanentNumber} · {driver.points || 0} pts</p>
                  </div>
                </div>
              </motion.div>
            </Link>
          ))}
        </div>

        {/* Driver comparison chart */}
        {driverData.length > 0 && (
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.5 }} className="glass-card p-6">
            <h3 className="font-display font-bold text-white text-sm tracking-wider uppercase mb-6">Driver Comparison</h3>
            <div className="h-64">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={driverData}>
                  <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" />
                  <XAxis dataKey="name" tick={{ fill: '#6B6B8D', fontSize: 12 }} axisLine={false} />
                  <YAxis tick={{ fill: '#6B6B8D', fontSize: 12 }} axisLine={false} />
                  <Tooltip contentStyle={{ background: 'rgba(30,30,46,0.95)', border: `1px solid ${team.color}40`, borderRadius: '8px', color: '#fff' }} />
                  <Bar dataKey="points" fill={team.color} radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </motion.div>
        )}
      </div>
    </div>
  );
}
