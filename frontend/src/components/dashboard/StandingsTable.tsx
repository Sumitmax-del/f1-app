'use client';

import { motion } from 'framer-motion';
import Link from 'next/link';
import { Standing, TEAM_COLORS } from '@/types';
import { ChevronRight } from 'lucide-react';

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
      <div className="px-6 py-4 border-b border-white/5 flex items-center justify-between">
        <h3 className="font-display font-bold text-white text-sm tracking-wider uppercase">
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
      <div className="divide-y divide-white/5">
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
              className="px-6 py-3 flex items-center gap-4 hover:bg-white/[0.02] transition-colors group cursor-pointer"
            >
              {/* Position */}
              <span
                className="text-lg font-display font-bold w-8 text-center"
                style={{ color: index < 3 ? teamColor : '#6B6B8D' }}
              >
                {standing.position}
              </span>

              {/* Team color bar */}
              <div className="w-1 h-8 rounded-full" style={{ background: teamColor }} />

              {/* Name */}
              <div className="flex-1 min-w-0">
                <p className="text-sm font-bold text-white truncate group-hover:text-[#F5F5F5] transition-colors">
                  {type === 'driver' ? (
                    <>
                      <span className="font-normal text-[#6B6B8D]">{standing.driver?.givenName} </span>
                      <span className="uppercase">{standing.driver?.familyName}</span>
                    </>
                  ) : name}
                </p>
                {teamName && (
                  <p className="text-xs text-[#6B6B8D]">{teamName}</p>
                )}
              </div>

              {/* Wins */}
              <div className="hidden sm:block text-xs text-[#6B6B8D] w-12 text-center">
                <span className="text-white font-bold">{standing.wins}</span> wins
              </div>

              {/* Points bar + value */}
              <div className="flex items-center gap-3 w-32 sm:w-48">
                <div className="flex-1 h-1.5 rounded-full bg-white/5 overflow-hidden hidden sm:block">
                  <motion.div
                    initial={{ width: 0 }}
                    animate={{ width: `${barWidth}%` }}
                    transition={{ delay: 0.2 + index * 0.05, duration: 0.8, ease: 'easeOut' }}
                    className="h-full rounded-full"
                    style={{ background: `linear-gradient(90deg, ${teamColor}, ${teamColor}88)` }}
                  />
                </div>
                <span className="text-sm font-display font-bold text-white w-12 text-right">
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
