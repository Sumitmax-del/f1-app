'use client';

import { useMemo } from 'react';
import { motion } from 'framer-motion';
import { LivePosition, WinProbability } from '@/types';
import { calculateWinProbabilities } from '@/data/mockRaceFeedData';
import { BarChart3 } from 'lucide-react';

interface WinProbabilityWidgetProps {
  positions: LivePosition[];
  currentLap: number;
  totalLaps: number;
}

export default function WinProbabilityWidget({
  positions,
  currentLap,
  totalLaps,
}: WinProbabilityWidgetProps) {
  const probabilities = useMemo(
    () => calculateWinProbabilities(positions, currentLap, totalLaps),
    [positions, currentLap, totalLaps]
  );

  if (probabilities.length === 0) {
    return (
      <div className="glass-card p-6 flex items-center justify-center h-full">
        <p className="text-xs text-center" style={{ color: 'var(--text-muted)' }}>
          Win probabilities will appear when the race starts
        </p>
      </div>
    );
  }

  const maxProbability = Math.max(...probabilities.map(p => p.probability));

  return (
    <div className="glass-card overflow-hidden h-full flex flex-col">
      {/* Header */}
      <div className="px-4 py-3 flex items-center gap-2 border-b shrink-0" style={{ borderColor: 'var(--border)' }}>
        <BarChart3 size={14} className="text-[#E10600]" />
        <span className="font-display font-bold text-xs tracking-wider uppercase" style={{ color: 'var(--text-primary)' }}>
          Win Probability
        </span>
        <span className="ml-auto text-[9px] font-mono" style={{ color: 'var(--text-muted)' }}>
          Lap {currentLap}/{totalLaps}
        </span>
      </div>

      {/* Probability Bars */}
      <div className="p-4 space-y-3 flex-1">
        {probabilities.map((p, i) => (
          <motion.div
            key={p.driverId}
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: i * 0.05 }}
          >
            {/* Driver info row */}
            <div className="flex items-center gap-2 mb-1">
              <span
                className="text-[9px] font-display font-black px-1.5 py-0.5 rounded"
                style={{ background: `${p.teamColor}20`, color: p.teamColor }}
              >
                P{p.position}
              </span>
              <div className="w-0.5 h-4 rounded-full" style={{ background: p.teamColor }} />
              <span className="text-xs font-bold flex-1 truncate" style={{ color: 'var(--text-primary)' }}>
                {p.driverCode}
              </span>
              <span
                className="text-xs font-display font-black"
                style={{ color: i === 0 ? p.teamColor : 'var(--text-secondary)' }}
              >
                {p.probability}%
              </span>
            </div>

            {/* Progress Bar */}
            <div className="h-2 rounded-full overflow-hidden" style={{ background: 'var(--border)' }}>
              <motion.div
                className="h-full rounded-full relative overflow-hidden"
                style={{
                  background: `linear-gradient(90deg, ${p.teamColor}, ${p.teamColor}aa)`,
                }}
                initial={{ width: 0 }}
                animate={{ width: `${(p.probability / maxProbability) * 100}%` }}
                transition={{ duration: 0.8, ease: 'easeOut' }}
              >
                {/* Shimmer on leader bar */}
                {i === 0 && (
                  <div
                    className="absolute inset-0 shimmer"
                    style={{ background: `linear-gradient(90deg, transparent, ${p.teamColor}40, transparent)` }}
                  />
                )}
              </motion.div>
            </div>
          </motion.div>
        ))}

        {/* Legend */}
        <div className="pt-2 border-t mt-auto" style={{ borderColor: 'var(--border)' }}>
          <p className="text-[9px] leading-relaxed" style={{ color: 'var(--text-muted)' }}>
            Based on position, gap, tyre strategy, and race pace.
            Updates every lap.
          </p>
        </div>
      </div>
    </div>
  );
}
