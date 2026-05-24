'use client';

import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { motion } from 'framer-motion';
import { getTeam } from '@/lib/api';
import { ArrowLeft, Trophy, Medal, Users, Star } from 'lucide-react';
import Link from 'next/link';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid } from 'recharts';
import { useAuth } from '@/context/AuthContext';

export default function TeamDetailPage() {
  const params = useParams();
  const router = useRouter();
  const { user, loading: authLoading, updateFavorites } = useAuth();

  const [team, setTeam] = useState<any>(null);
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
      getTeam(params.id as string)
        .then(t => { setTeam(t); setLoading(false); })
        .catch(() => setLoading(false));
    }
  }, [user, params.id]);

  if (authLoading || loading) return <div className="min-h-screen grid-bg flex items-center justify-center"><div className="shimmer w-48 h-2 rounded-full" /></div>;
  if (!team) return <div className="min-h-screen grid-bg flex items-center justify-center"><p style={{ color: 'var(--text-secondary)' }}>Team not found</p></div>;

  const isFavourite = user?.favouriteTeam === team.name;

  const handleToggleFavourite = async () => {
    if (updating) return;
    setUpdating(true);
    const newFavourite = isFavourite ? '' : team.name;
    await updateFavorites({ favouriteTeam: newFavourite });
    setUpdating(false);
  };

  const driverData = (team.drivers || []).map((d: any) => ({
    name: d.code || d.familyName?.substring(0, 3).toUpperCase(),
    points: d.points || 0,
    wins: d.wins || 0,
  }));

  return (
    <div className="min-h-screen grid-bg">
      <div className="max-w-[1400px] mx-auto px-4 sm:px-6 py-8">
        <Link href="/teams" className="inline-flex items-center gap-2 transition-colors hover:opacity-80 text-sm mb-6" style={{ color: 'var(--text-secondary)' }}>
          <ArrowLeft size={16} /> Back to Teams
        </Link>

        {/* Hero */}
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="glass-card overflow-hidden mb-8">
          <div className="h-2 w-full" style={{ background: team.color }} />
          <div className="p-8 sm:p-12 relative">
            <div className="absolute top-4 right-8 text-[120px] font-display font-black leading-none opacity-5 select-none"
              style={{ color: team.color }}
            >
              P{team.position}
            </div>
            <span className="text-xs font-bold uppercase tracking-[0.3em]" style={{ color: 'var(--text-secondary)' }}>Constructor</span>
            
            <div className="flex flex-wrap items-center gap-4 mt-2">
              <h1 className="text-4xl sm:text-5xl font-display font-black text-themed">{team.name}</h1>
              
              {/* Favourite Team Toggle */}
              <button
                onClick={handleToggleFavourite}
                disabled={updating}
                className="flex items-center gap-2 px-3 py-1.5 rounded-lg text-xs font-bold tracking-wider transition-all border outline-none cursor-pointer hover:opacity-90 active:scale-95"
                style={{
                  borderColor: isFavourite ? `${team.color}44` : 'var(--border)',
                  background: isFavourite ? `${team.color}15` : 'rgba(255,255,255,0.02)',
                  color: isFavourite ? team.color : 'var(--text-secondary)'
                }}
              >
                <Star size={13} fill={isFavourite ? team.color : 'transparent'} style={{ color: isFavourite ? team.color : 'currentColor' }} />
                <span>{isFavourite ? 'MY FAVOURITE TEAM' : 'SET AS FAVOURITE'}</span>
              </button>
            </div>
            
            <p className="text-sm mt-2" style={{ color: 'var(--text-secondary)' }}>{team.nationality}</p>
          </div>
        </motion.div>

        <div className="grid grid-cols-3 gap-4 mb-8">
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }} className="glass-card p-5">
            <Trophy size={20} style={{ color: team.color }} className="mb-3" />
            <p className="text-3xl font-display font-bold" style={{ color: 'var(--text-primary)' }}>P{team.position}</p>
            <p className="text-xs uppercase tracking-wider" style={{ color: 'var(--text-secondary)' }}>Championship</p>
          </motion.div>
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.15 }} className="glass-card p-5">
            <Medal size={20} style={{ color: team.color }} className="mb-3" />
            <p className="text-3xl font-display font-bold" style={{ color: 'var(--text-primary)' }}>{team.points}</p>
            <p className="text-xs uppercase tracking-wider" style={{ color: 'var(--text-secondary)' }}>Total Points</p>
          </motion.div>
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }} className="glass-card p-5">
            <Users size={20} style={{ color: team.color }} className="mb-3" />
            <p className="text-3xl font-display font-bold" style={{ color: 'var(--text-primary)' }}>{team.wins || 0}</p>
            <p className="text-xs uppercase tracking-wider" style={{ color: 'var(--text-secondary)' }}>Race Wins</p>
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
                  <div className="w-16 h-16 rounded-xl flex items-center justify-center text-2xl font-display font-bold border"
                    style={{ background: `${team.color}20`, borderColor: `${team.color}40`, color: 'var(--text-primary)' }}
                  >
                    {driver.code || '??'}
                  </div>
                  <div>
                    <p className="text-lg font-bold" style={{ color: 'var(--text-primary)' }}>
                      {driver.givenName} <span className="uppercase">{driver.familyName}</span>
                    </p>
                    <p className="text-sm" style={{ color: 'var(--text-secondary)' }}>#{driver.permanentNumber} · {driver.points || 0} pts</p>
                  </div>
                </div>
              </motion.div>
            </Link>
          ))}
        </div>

        {/* Driver comparison chart */}
        {driverData.length > 0 && (
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.5 }} className="glass-card p-6">
            <h3 className="font-display font-bold text-sm tracking-wider uppercase mb-6" style={{ color: 'var(--text-primary)' }}>Driver Comparison</h3>
            <div className="h-64">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={driverData}>
                  <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" />
                  <XAxis dataKey="name" tick={{ fill: 'var(--text-secondary)', fontSize: 12 }} axisLine={false} />
                  <YAxis tick={{ fill: 'var(--text-secondary)', fontSize: 12 }} axisLine={false} />
                  <Tooltip contentStyle={{ background: 'var(--surface-solid)', border: `1px solid var(--border)`, borderRadius: '8px', color: 'var(--text-primary)' }} />
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
