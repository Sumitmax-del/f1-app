'use client';

import { motion } from 'framer-motion';
import Link from 'next/link';
import { Standing, TEAM_COLORS } from '@/types';
import { ChevronRight } from 'lucide-react';
import { useState } from 'react';

// Map driverId to F1 media headshot URLs (2025 season)
const DRIVER_HEADSHOTS: Record<string, string> = {
  'max_verstappen': 'https://media.formula1.com/d_driver_fallback_image.png/content/dam/fom-website/drivers/M/MAXVER01_Max_Verstappen/maxver01.png.transform/1col/image.png',
  'hamilton': 'https://media.formula1.com/d_driver_fallback_image.png/content/dam/fom-website/drivers/L/LEWHAM01_Lewis_Hamilton/lewham01.png.transform/1col/image.png',
  'leclerc': 'https://media.formula1.com/d_driver_fallback_image.png/content/dam/fom-website/drivers/C/CHALEC01_Charles_Leclerc/chalec01.png.transform/1col/image.png',
  'norris': 'https://media.formula1.com/d_driver_fallback_image.png/content/dam/fom-website/drivers/L/LANNOR01_Lando_Norris/lannor01.png.transform/1col/image.png',
  'piastri': 'https://media.formula1.com/d_driver_fallback_image.png/content/dam/fom-website/drivers/O/OSCPIA01_Oscar_Piastri/oscpia01.png.transform/1col/image.png',
  'russell': 'https://media.formula1.com/d_driver_fallback_image.png/content/dam/fom-website/drivers/G/GEORUS01_George_Russell/georus01.png.transform/1col/image.png',
  'sainz': 'https://media.formula1.com/d_driver_fallback_image.png/content/dam/fom-website/drivers/C/CARSAI01_Carlos_Sainz/carsai01.png.transform/1col/image.png',
  'perez': 'https://media.formula1.com/d_driver_fallback_image.png/content/dam/fom-website/drivers/S/SERPER01_Sergio_Perez/serper01.png.transform/1col/image.png',
  'alonso': 'https://media.formula1.com/d_driver_fallback_image.png/content/dam/fom-website/drivers/F/FERALO01_Fernando_Alonso/feralo01.png.transform/1col/image.png',
  'stroll': 'https://media.formula1.com/d_driver_fallback_image.png/content/dam/fom-website/drivers/L/LANSTR01_Lance_Stroll/lanstr01.png.transform/1col/image.png',
  'gasly': 'https://media.formula1.com/d_driver_fallback_image.png/content/dam/fom-website/drivers/P/PIEGAS01_Pierre_Gasly/piegas01.png.transform/1col/image.png',
  'ocon': 'https://media.formula1.com/d_driver_fallback_image.png/content/dam/fom-website/drivers/E/ESTOCO01_Esteban_Ocon/estoco01.png.transform/1col/image.png',
  'tsunoda': 'https://media.formula1.com/d_driver_fallback_image.png/content/dam/fom-website/drivers/Y/YUKTSU01_Yuki_Tsunoda/yuktsu01.png.transform/1col/image.png',
  'hulkenberg': 'https://media.formula1.com/d_driver_fallback_image.png/content/dam/fom-website/drivers/N/NICHUL01_Nico_Hulkenberg/nichul01.png.transform/1col/image.png',
  'magnussen': 'https://media.formula1.com/d_driver_fallback_image.png/content/dam/fom-website/drivers/K/KEVMAG01_Kevin_Magnussen/kevmag01.png.transform/1col/image.png',
  'albon': 'https://media.formula1.com/d_driver_fallback_image.png/content/dam/fom-website/drivers/A/ALEALB01_Alexander_Albon/alealb01.png.transform/1col/image.png',
  'sargeant': 'https://media.formula1.com/d_driver_fallback_image.png/content/dam/fom-website/drivers/L/LOGSAR01_Logan_Sargeant/logsar01.png.transform/1col/image.png',
  'bottas': 'https://media.formula1.com/d_driver_fallback_image.png/content/dam/fom-website/drivers/V/VALBOT01_Valtteri_Bottas/valbot01.png.transform/1col/image.png',
  'zhou': 'https://media.formula1.com/d_driver_fallback_image.png/content/dam/fom-website/drivers/G/GUAZHO01_Guanyu_Zhou/guazho01.png.transform/1col/image.png',
  'ricciardo': 'https://media.formula1.com/d_driver_fallback_image.png/content/dam/fom-website/drivers/D/DANRIC01_Daniel_Ricciardo/danric01.png.transform/1col/image.png',
  'lawson': 'https://media.formula1.com/d_driver_fallback_image.png/content/dam/fom-website/drivers/L/LIALAW01_Liam_Lawson/lialaw01.png.transform/1col/image.png',
  'bearman': 'https://media.formula1.com/d_driver_fallback_image.png/content/dam/fom-website/drivers/O/OLIBEA01_Oliver_Bearman/olibea01.png.transform/1col/image.png',
  'colapinto': 'https://media.formula1.com/d_driver_fallback_image.png/content/dam/fom-website/drivers/F/FRACOL01_Franco_Colapinto/fracol01.png.transform/1col/image.png',
  'doohan': 'https://media.formula1.com/d_driver_fallback_image.png/content/dam/fom-website/drivers/J/JACDOO01_Jack_Doohan/jacdoo01.png.transform/1col/image.png',
  'hadjar': 'https://media.formula1.com/d_driver_fallback_image.png/content/dam/fom-website/drivers/I/ISAHAD01_Isack_Hadjar/isahad01.png.transform/1col/image.png',
  'bortoleto': 'https://media.formula1.com/d_driver_fallback_image.png/content/dam/fom-website/drivers/G/GABBO01_Gabriel_Bortoleto/gabbo01.png.transform/1col/image.png',
  'antonelli': 'https://media.formula1.com/d_driver_fallback_image.png/content/dam/fom-website/drivers/A/ANDANT01_Andrea_Kimi_Antonelli/andant01.png.transform/1col/image.png',
};

function getDriverImageUrl(driverId: string): string | null {
  return DRIVER_HEADSHOTS[driverId] || null;
}

/** Small circular driver avatar with image + fallback */
function DriverAvatar({ driverId, driverCode, teamColor }: { driverId: string; driverCode: string; teamColor: string }) {
  const [imgError, setImgError] = useState(false);
  const imageUrl = getDriverImageUrl(driverId);

  if (!imageUrl || imgError) {
    // Fallback: driver code initials in a team-colored circle
    return (
      <div
        className="flex-shrink-0 flex items-center justify-center rounded-full font-display font-bold text-[10px] tracking-wide"
        style={{
          width: 32,
          height: 32,
          background: `${teamColor}25`,
          border: `2px solid ${teamColor}50`,
          color: teamColor,
        }}
      >
        {driverCode}
      </div>
    );
  }

  return (
    <div
      className="flex-shrink-0 rounded-full overflow-hidden"
      style={{
        width: 32,
        height: 32,
        border: `2px solid ${teamColor}50`,
        background: `${teamColor}15`,
      }}
    >
      <img
        src={imageUrl}
        alt={driverCode}
        width={32}
        height={32}
        onError={() => setImgError(true)}
        style={{
          width: '100%',
          height: '100%',
          objectFit: 'cover',
          objectPosition: 'top center',
        }}
      />
    </div>
  );
}

interface StandingsTableProps {
  standings: Standing[];
  type: 'driver' | 'constructor';
  limit?: number;
}

export default function StandingsTable({ standings, type, limit }: StandingsTableProps) {
  const displayed = limit ? standings.slice(0, limit) : standings;
  const maxPoints = Math.max(...displayed.map(s => parseFloat(s.points) || 0));

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.3 }}
      className="glass-card overflow-hidden"
    >
      {/* Header */}
      <div className="px-6 py-4 flex items-center justify-between" style={{ borderBottom: '1px solid var(--border)' }}>
        <h3 className="font-display font-bold text-sm tracking-wider uppercase" style={{ color: 'var(--text-primary)' }}>
          {type === 'driver' ? '🏆 Driver Standings' : '🏗️ Constructor Standings'}
        </h3>
        <Link
          href={type === 'driver' ? '/drivers' : '/teams'}
          className="flex items-center gap-1 text-xs text-[#E10600] hover:text-[#FF4444] font-semibold transition-colors"
        >
          View All <ChevronRight size={14} />
        </Link>
      </div>

      {/* Table */}
      <div>
        {displayed.map((standing, index) => {
          const name = type === 'driver'
            ? `${standing.driver?.givenName} ${standing.driver?.familyName}`
            : standing.team?.name || '';
          const teamColor = type === 'driver'
            ? (standing.driver?.team?.color || TEAM_COLORS[standing.driver?.team?.constructorId || ''] || '#666')
            : (standing.team?.color || TEAM_COLORS[standing.team?.constructorId || ''] || '#666');
          const teamName = type === 'driver' ? standing.driver?.team?.name : undefined;
          const points = parseFloat(standing.points);
          const barWidth = maxPoints > 0 ? (points / maxPoints) * 100 : 0;

          return (
            <motion.div
              key={standing.position}
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.1 * index }}
              className="px-6 py-3 flex items-center gap-4 transition-colors group cursor-pointer"
              style={{ borderBottom: '1px solid var(--border)' }}
              onMouseEnter={(e) => { e.currentTarget.style.background = 'var(--surface-hover)'; }}
              onMouseLeave={(e) => { e.currentTarget.style.background = 'transparent'; }}
            >
              {/* Position */}
              <span
                className="text-lg font-display font-bold w-8 text-center"
                style={{ color: index < 3 ? teamColor : 'var(--text-secondary)' }}
              >
                {standing.position}
              </span>

              {/* Team color bar */}
              <div className="w-1 h-8 rounded-full" style={{ background: teamColor }} />

              {/* Name */}
              <div className="flex-1 min-w-0">
                <p className="text-sm font-bold truncate transition-colors" style={{ color: 'var(--text-primary)' }}>
                  {type === 'driver' ? (
                    <>
                      <span className="font-normal" style={{ color: 'var(--text-secondary)' }}>{standing.driver?.givenName} </span>
                      <span className="uppercase">{standing.driver?.familyName}</span>
                    </>
                  ) : name}
                </p>
                {teamName && (
                  <p className="text-xs" style={{ color: 'var(--text-secondary)' }}>{teamName}</p>
                )}
              </div>

              {/* Driver Avatar (only for driver standings) */}
              {type === 'driver' && standing.driver && (
                <DriverAvatar
                  driverId={standing.driver.driverId}
                  driverCode={standing.driver.code || standing.driver.driverId.substring(0, 3).toUpperCase()}
                  teamColor={teamColor}
                />
              )}

              {/* Wins */}
              <div className="hidden sm:block text-xs w-12 text-center" style={{ color: 'var(--text-secondary)' }}>
                <span className="font-bold" style={{ color: 'var(--text-primary)' }}>{standing.wins}</span> wins
              </div>

              {/* Points bar + value */}
              <div className="flex items-center gap-3 w-32 sm:w-48">
                <div className="flex-1 h-1.5 rounded-full overflow-hidden hidden sm:block" style={{ background: 'var(--border)' }}>
                  <motion.div
                    initial={{ width: 0 }}
                    animate={{ width: `${barWidth}%` }}
                    transition={{ delay: 0.2 + index * 0.05, duration: 0.8, ease: 'easeOut' }}
                    className="h-full rounded-full"
                    style={{ background: `linear-gradient(90deg, ${teamColor}, ${teamColor}88)` }}
                  />
                </div>
                <span className="text-sm font-display font-bold w-12 text-right" style={{ color: 'var(--text-primary)' }}>
                  {standing.points}
                </span>
              </div>
            </motion.div>
          );
        })}
      </div>
    </motion.div>
  );
}

