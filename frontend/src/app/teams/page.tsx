'use client';

import { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { getTeams } from '@/lib/api';
import Link from 'next/link';
import { ChevronRight, Users } from 'lucide-react';
import { useAuth } from '@/context/AuthContext';
import { useRouter } from 'next/navigation';

// Map constructorId to official F1 car images
const TEAM_CAR_IMAGES: Record<string, string> = {
  'mercedes': 'https://media.formula1.com/d_team_car_fallback_image.png/content/dam/fom-website/teams/2025/mercedes.png.transform/4col/image.png',
  'ferrari': 'https://media.formula1.com/d_team_car_fallback_image.png/content/dam/fom-website/teams/2025/ferrari.png.transform/4col/image.png',
  'red_bull': 'https://media.formula1.com/d_team_car_fallback_image.png/content/dam/fom-website/teams/2025/red-bull-racing.png.transform/4col/image.png',
  'mclaren': 'https://media.formula1.com/d_team_car_fallback_image.png/content/dam/fom-website/teams/2025/mclaren.png.transform/4col/image.png',
  'aston_martin': 'https://media.formula1.com/d_team_car_fallback_image.png/content/dam/fom-website/teams/2025/aston-martin.png.transform/4col/image.png',
  'alpine': 'https://media.formula1.com/d_team_car_fallback_image.png/content/dam/fom-website/teams/2025/alpine.png.transform/4col/image.png',
  'williams': 'https://media.formula1.com/d_team_car_fallback_image.png/content/dam/fom-website/teams/2025/williams.png.transform/4col/image.png',
  'rb': 'https://media.formula1.com/d_team_car_fallback_image.png/content/dam/fom-website/teams/2025/rb.png.transform/4col/image.png',
  'haas': 'https://media.formula1.com/d_team_car_fallback_image.png/content/dam/fom-website/teams/2025/haas.png.transform/4col/image.png',
  'sauber': 'https://media.formula1.com/d_team_car_fallback_image.png/content/dam/fom-website/teams/2025/kick-sauber.png.transform/4col/image.png',
  'audi': 'https://media.formula1.com/d_team_car_fallback_image.png/content/dam/fom-website/teams/2025/kick-sauber.png.transform/4col/image.png', // Temporary fallback to Sauber's car for Audi
  'cadillac': 'https://media.formula1.com/d_team_car_fallback_image.png/content/dam/fom-website/teams/2025/f1-unbranded.png.transform/4col/image.png', // Generic F1 car for Cadillac
};

/** Car image with shimmer loading and graceful fallback */
function TeamCarImage({ constructorId, teamColor, teamName }: { constructorId: string; teamColor: string; teamName: string }) {
  const [status, setStatus] = useState<'loading' | 'loaded' | 'error'>('loading');
  const imageUrl = TEAM_CAR_IMAGES[constructorId];

  if (!imageUrl) {
    // No URL mapped — render a gradient fallback with team color
    return (
      <div
        className="w-full h-full rounded-lg flex items-center justify-center"
        style={{
          background: `linear-gradient(135deg, ${teamColor}08 0%, ${teamColor}18 50%, ${teamColor}08 100%)`,
        }}
      >
        <span className="font-display font-bold text-sm uppercase tracking-widest opacity-20" style={{ color: teamColor }}>
          {teamName}
        </span>
      </div>
    );
  }

  return (
    <div className="relative w-full h-full">
      {/* Shimmer skeleton while loading */}
      {status === 'loading' && (
        <div
          className="absolute inset-0 rounded-lg shimmer"
          style={{
            background: `linear-gradient(90deg, ${teamColor}05 0%, ${teamColor}15 50%, ${teamColor}05 100%)`,
          }}
        />
      )}

      {/* Error fallback — subtle team-branded gradient */}
      {status === 'error' && (
        <div
          className="absolute inset-0 rounded-lg flex items-center justify-center"
          style={{
            background: `linear-gradient(135deg, ${teamColor}08 0%, ${teamColor}18 50%, ${teamColor}08 100%)`,
          }}
        >
          <span className="font-display font-bold text-sm uppercase tracking-widest opacity-20" style={{ color: teamColor }}>
            {teamName}
          </span>
        </div>
      )}

      {/* Actual car image */}
      <motion.img
        src={imageUrl}
        alt={`${teamName} F1 car`}
        initial={{ opacity: 0, x: 20 }}
        animate={{ opacity: status === 'loaded' ? 1 : 0, x: status === 'loaded' ? 0 : 20 }}
        transition={{ duration: 0.5, ease: 'easeOut' }}
        onLoad={() => setStatus('loaded')}
        onError={() => setStatus('error')}
        style={{
          width: '100%',
          height: '100%',
          objectFit: 'contain',
          objectPosition: 'center',
          filter: 'drop-shadow(0 4px 12px rgba(0,0,0,0.4))',
        }}
        draggable={false}
      />
    </div>
  );
}

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
                    <div className="min-w-[160px]">
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

                    {/* Car Image — hidden on small screens */}
                    <div
                      className="hidden md:flex flex-1 items-center justify-center"
                      style={{ height: 72, minWidth: 160 }}
                    >
                      <TeamCarImage
                        constructorId={team.constructorId}
                        teamColor={team.color}
                        teamName={team.name}
                      />
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

