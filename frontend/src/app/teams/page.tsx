'use client';

import { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { getTeams } from '@/lib/api';
import Link from 'next/link';
import { ChevronRight, Users } from 'lucide-react';
import { useAuth } from '@/context/AuthContext';
import { useRouter } from 'next/navigation';

export default function TeamsPage() {
  const { user, loading: authLoading } = useAuth();
  const router = useRouter();
  const [teams, setTeams] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!authLoading && !user) {
      router.push('/login');
    }
  }, [user, authLoading, router]);

  useEffect(() => {
    if (user) {
      getTeams().then(t => { setTeams(t || []); setLoading(false); }).catch(() => setLoading(false));
    }
  }, [user]);

  if (authLoading || !user) {
    return (
      <div className="min-h-screen grid-bg flex items-center justify-center">
        <div className="shimmer w-48 h-2 rounded-full" />
      </div>
    );
  }

  const maxPoints = Math.max(...teams.map(t => t.points || 0), 1);

  return (
    <div className="min-h-screen grid-bg">
      <div className="max-w-[1400px] mx-auto px-4 sm:px-6 py-8">
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="mb-8">
          <p className="text-xs font-bold uppercase tracking-[0.3em] text-[#E10600] mb-2">Constructors</p>
          <h1 className="text-4xl sm:text-5xl font-display font-black" style={{ color: 'var(--text-primary)' }}>TEAMS</h1>
        </motion.div>

        <div className="space-y-4">
          {teams.map((team, index) => (
            <Link key={team.constructorId} href={`/teams/${team.constructorId}`}>
              <motion.div
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: index * 0.05 }}
                whileHover={{ x: 4 }}
                className="glass-card overflow-hidden group cursor-pointer mb-4"
              >
                <div className="flex items-stretch">
                  {/* Team color sidebar */}
                  <div className="w-1.5 sm:w-2" style={{ background: team.color }} />

                  <div className="flex-1 p-5 sm:p-6 flex flex-col sm:flex-row items-start sm:items-center gap-4">
                    {/* Position & Logo area */}
                    <div className="flex items-center gap-4">
                      <span className="text-2xl font-display font-black w-8" style={{ color: team.color }}>
                        {team.position}
                      </span>
                      <div className="w-14 h-14 rounded-xl flex items-center justify-center border"
                        style={{ background: `${team.color}15`, borderColor: `${team.color}30` }}
                      >
                        <span className="font-display font-bold text-sm" style={{ color: team.color }}>
                          {team.name.substring(0, 3).toUpperCase()}
                        </span>
                      </div>
                    </div>

                    {/* Team info */}
                    <div className="flex-1">
                      <h3 className="text-lg font-bold" style={{ color: 'var(--text-primary)' }}>{team.name}</h3>
                      <p className="text-xs" style={{ color: 'var(--text-secondary)' }}>{team.nationality}</p>
                      {/* Drivers */}
                      <div className="flex items-center gap-3 mt-2">
                        <Users size={12} style={{ color: 'var(--text-secondary)' }} />
                        <span className="text-xs" style={{ color: 'var(--text-secondary)' }}>
                          {team.drivers?.map((d: any) => `${d.givenName} ${d.familyName}`).join(' • ') || 'Loading...'}
                        </span>
                      </div>
                    </div>

                    {/* Points */}
                    <div className="flex items-center gap-4 sm:gap-6">
                      <div className="hidden sm:block w-48">
                        <div className="h-2 rounded-full overflow-hidden" style={{ background: 'var(--border)' }}>
                          <motion.div
                            initial={{ width: 0 }}
                            animate={{ width: `${((team.points || 0) / maxPoints) * 100}%` }}
                            transition={{ delay: 0.3 + index * 0.05, duration: 0.8 }}
                            className="h-full rounded-full"
                            style={{ background: team.color }}
                          />
                        </div>
                      </div>
                      <div className="text-right">
                        <p className="text-2xl font-display font-bold" style={{ color: 'var(--text-primary)' }}>{team.points}</p>
                        <p className="text-[10px] uppercase tracking-wider" style={{ color: 'var(--text-secondary)' }}>Points</p>
                      </div>
                      <ChevronRight size={18} className="transition-colors" style={{ color: 'var(--text-secondary)' }} />
                    </div>
                  </div>
                </div>
              </motion.div>
            </Link>
          ))}
        </div>
      </div>
    </div>
  );
}
