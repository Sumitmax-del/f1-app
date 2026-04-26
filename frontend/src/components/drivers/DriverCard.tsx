'use client';

import { motion } from 'framer-motion';
import Link from 'next/link';
import { NATIONALITY_FLAGS } from '@/types';

interface DriverCardProps {
  driver: {
    driverId: string;
    permanentNumber: string;
    code: string;
    givenName: string;
    familyName: string;
    nationality: string;
    team?: { name: string; color: string; constructorId: string };
    points?: number;
    wins?: number;
    position?: number;
  };
  index: number;
}

export default function DriverCard({ driver, index }: DriverCardProps) {
  const teamColor = driver.team?.color || '#666';
  const flag = NATIONALITY_FLAGS[driver.nationality] || '🏁';

  return (
    <Link href={`/drivers/${driver.driverId}`}>
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: index * 0.05 }}
        whileHover={{ y: -4, scale: 1.02 }}
        className="glass-card overflow-hidden group cursor-pointer relative"
      >
        {/* Top team color bar */}
        <div className="h-1 w-full" style={{ background: `linear-gradient(90deg, ${teamColor}, ${teamColor}44)` }} />

        <div className="p-5">
          {/* Position & Number */}
          <div className="flex items-start justify-between mb-4">
            <div>
              <span className="text-xs font-bold text-[#6B6B8D] uppercase tracking-widest">P{driver.position}</span>
            </div>
            <span className="text-4xl font-display font-black opacity-10 group-hover:opacity-20 transition-opacity"
              style={{ color: teamColor }}
            >
              {driver.permanentNumber}
            </span>
          </div>

          {/* Avatar */}
          <div className="w-16 h-16 rounded-full mb-4 flex items-center justify-center text-2xl font-display font-bold text-white border-2"
            style={{ background: `${teamColor}20`, borderColor: `${teamColor}40` }}
          >
            {driver.code}
          </div>

          {/* Name */}
          <p className="text-lg font-bold text-white">
            <span className="font-light text-[#6B6B8D]">{driver.givenName}</span>
            <br />
            <span className="uppercase">{driver.familyName}</span>
          </p>

          {/* Team */}
          <div className="flex items-center gap-2 mt-2 mb-4">
            <div className="w-2 h-2 rounded-full" style={{ background: teamColor }} />
            <span className="text-xs text-[#6B6B8D] font-semibold">{driver.team?.name}</span>
          </div>

          {/* Stats */}
          <div className="flex items-center gap-4 pt-3 border-t border-white/5">
            <div>
              <p className="text-lg font-display font-bold text-white">{driver.points}</p>
              <p className="text-[10px] text-[#6B6B8D] uppercase tracking-wider">Points</p>
            </div>
            <div>
              <p className="text-lg font-display font-bold text-white">{driver.wins}</p>
              <p className="text-[10px] text-[#6B6B8D] uppercase tracking-wider">Wins</p>
            </div>
            <div className="ml-auto text-2xl">{flag}</div>
          </div>
        </div>
      </motion.div>
    </Link>
  );
}
