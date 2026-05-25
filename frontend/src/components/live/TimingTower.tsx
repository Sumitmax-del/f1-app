'use client';

import { motion, AnimatePresence, LayoutGroup } from 'framer-motion';
import { LivePosition } from '@/types';
import { getTireColor } from '@/lib/utils';
import {
  Gauge, ChevronUp, ChevronDown, Zap
} from 'lucide-react';

interface TimingTowerProps {
  positions: LivePosition[];
  fastestLap: { driverId: string; time: string } | null;
  previousPositions: Record<string, number>;
  selectedDriver: string | null;
  onSelectDriver: (driverId: string) => void;
}

export default function TimingTower({
  positions,
  fastestLap,
  previousPositions,
  selectedDriver,
  onSelectDriver,
}: TimingTowerProps) {
  const getPositionChange = (driverId: string, currentPos: number) => {
    const prev = previousPositions[driverId];
    if (prev === undefined) return 0;
    return prev - currentPos;
  };

  return (
    <div className="glass-card overflow-hidden h-full flex flex-col">
      {/* Header */}
      <div className="px-4 py-3 flex items-center gap-2 border-b shrink-0" style={{ borderColor: 'var(--border)' }}>
        <Gauge size={14} className="text-[#E10600]" />
        <span className="font-display font-bold text-xs tracking-wider uppercase" style={{ color: 'var(--text-primary)' }}>
          Live Timing
        </span>
      </div>

      {/* Column headers */}
      <div
        className="px-4 py-2 grid grid-cols-12 gap-1 text-[9px] uppercase tracking-wider font-bold border-b shrink-0"
        style={{ color: 'var(--text-secondary)', borderColor: 'var(--border)' }}
      >
        <span className="col-span-1">P</span>
        <span className="col-span-4">Driver</span>
        <span className="col-span-3 text-center hidden sm:block">Interval</span>
        <span className="col-span-2 text-center">Tire</span>
        <span className="col-span-2 text-center hidden sm:block">DRS</span>
      </div>

      {/* Rows */}
      <div className="flex-1 overflow-y-auto overflow-x-hidden">
        <LayoutGroup>
          <AnimatePresence>
            {positions.map(pos => {
              const change = getPositionChange(pos.driverId, pos.position);
              const isSelected = selectedDriver === pos.driverId;
              const hasFastestLap = fastestLap?.driverId === pos.driverId;

              return (
                <motion.button
                  key={pos.driverId}
                  layout
                  initial={{ opacity: 0 }}
                  animate={{ opacity: pos.status === 'retired' ? 0.3 : 1 }}
                  exit={{ opacity: 0 }}
                  transition={{ type: 'spring', stiffness: 200, damping: 25 }}
                  onClick={() => onSelectDriver(pos.driverId)}
                  className={`w-full px-4 py-2 grid grid-cols-12 gap-1 items-center border-b transition-colors text-left ${
                    isSelected ? 'bg-[var(--border-accent)]' : 'hover:bg-[var(--surface-hover)]'
                  }`}
                  style={{ borderColor: 'var(--border)' }}
                >
                  {/* Position */}
                  <div className="col-span-1 flex items-center gap-0.5">
                    <span className="text-xs font-display font-bold" style={{ color: 'var(--text-primary)' }}>
                      {pos.position}
                    </span>
                    {change > 0 && <ChevronUp size={8} className="text-green-400" />}
                    {change < 0 && <ChevronDown size={8} className="text-red-400" />}
                  </div>

                  {/* Driver */}
                  <div className="col-span-4 flex items-center gap-1.5 min-w-0">
                    <div className="w-0.5 h-5 rounded-full shrink-0" style={{ background: pos.teamColor }} />
                    <div className="min-w-0">
                      <p className="text-xs font-bold truncate" style={{ color: 'var(--text-primary)' }}>
                        {pos.driverName.split(' ').pop()}
                      </p>
                      <p className="text-[8px] truncate" style={{ color: 'var(--text-muted)' }}>
                        {pos.team}
                      </p>
                    </div>
                  </div>

                  {/* Interval */}
                  <span className="col-span-3 text-center text-[10px] font-mono hidden sm:block" style={{ color: 'var(--text-secondary)' }}>
                    {pos.gap === 'LEADER' ? (
                      <span className="font-bold text-[10px]" style={{ color: 'var(--text-primary)' }}>LEADER</span>
                    ) : (
                      pos.interval
                    )}
                  </span>

                  {/* Tire */}
                  <div className="col-span-2 flex items-center justify-center gap-1">
                    <span
                      className="w-4 h-4 rounded-full text-[7px] font-black flex items-center justify-center"
                      style={{
                        background: getTireColor(pos.tire) + '25',
                        color: getTireColor(pos.tire),
                        border: `1.5px solid ${getTireColor(pos.tire)}`,
                      }}
                    >
                      {pos.tire[0].toUpperCase()}
                    </span>
                    <span className="text-[8px]" style={{ color: 'var(--text-muted)' }}>
                      L{pos.tireAge}
                    </span>
                  </div>

                  {/* DRS + Fastest Lap */}
                  <div className="col-span-2 flex items-center justify-center gap-1 hidden sm:flex">
                    {pos.drs && pos.status === 'racing' && (
                      <span className="text-[8px] font-bold text-green-400 bg-green-400/10 px-1 py-0.5 rounded">
                        DRS
                      </span>
                    )}
                    {hasFastestLap && (
                      <Zap size={10} className="text-purple-400" />
                    )}
                  </div>
                </motion.button>
              );
            })}
          </AnimatePresence>
        </LayoutGroup>
      </div>
    </div>
  );
}
