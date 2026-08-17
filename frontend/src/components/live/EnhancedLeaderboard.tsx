'use client';

import { useState } from 'react';
import { motion, AnimatePresence, LayoutGroup } from 'framer-motion';
import { LivePosition } from '@/types';
import { getTireColor } from '@/lib/utils';
import {
  Gauge, ChevronUp, ChevronDown, Zap, Activity,
} from 'lucide-react';

interface EnhancedLeaderboardProps {
  positions: LivePosition[];
  fastestLap: { driverId: string; time: string } | null;
  previousPositions: Record<string, number>;
}

export default function EnhancedLeaderboard({
  positions,
  fastestLap,
  previousPositions,
}: EnhancedLeaderboardProps) {
  const [expandedDriver, setExpandedDriver] = useState<string | null>(null);

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
        <span className="ml-auto text-[9px] font-mono" style={{ color: 'var(--text-muted)' }}>
          {positions.filter(p => p.status === 'racing').length} racing
        </span>
      </div>

      {/* Column headers */}
      <div
        className="px-4 py-2 grid grid-cols-[2rem_1fr_4rem_3rem_3rem_3.5rem] gap-1 text-[9px] uppercase tracking-wider font-bold border-b shrink-0"
        style={{ color: 'var(--text-muted)', borderColor: 'var(--border)' }}
      >
        <span>P</span>
        <span>Driver</span>
        <span className="text-center">Gap</span>
        <span className="text-center">Tyre</span>
        <span className="text-center hidden sm:block">Pit</span>
        <span className="text-center hidden sm:block">DRS</span>
      </div>

      {/* Driver rows */}
      <div className="flex-1 overflow-y-auto overflow-x-hidden">
        <LayoutGroup>
          <AnimatePresence>
            {positions.map(pos => {
              const change = getPositionChange(pos.driverId, pos.position);
              const hasFastestLap = fastestLap?.driverId === pos.driverId;
              const isExpanded = expandedDriver === pos.driverId;
              const isPitting = pos.status === 'pit';

              return (
                <motion.div
                  key={pos.driverId}
                  layout
                  initial={{ opacity: 0 }}
                  animate={{ opacity: pos.status === 'retired' ? 0.3 : 1 }}
                  exit={{ opacity: 0 }}
                  transition={{ type: 'spring', stiffness: 200, damping: 25 }}
                >
                  {/* Main Row */}
                  <button
                    onClick={() => setExpandedDriver(isExpanded ? null : pos.driverId)}
                    className={`w-full px-4 py-2 grid grid-cols-[2rem_1fr_4rem_3rem_3rem_3.5rem] gap-1 items-center border-b transition-colors text-left ${
                      isExpanded ? 'bg-[var(--border-accent)]' : 'hover:bg-[var(--surface-hover)]'
                    } ${change > 0 ? 'pos-gain' : change < 0 ? 'pos-loss' : ''}`}
                    style={{ borderColor: 'var(--border)' }}
                  >
                    {/* Position */}
                    <div className="flex items-center gap-0.5">
                      <span className="text-xs font-display font-bold" style={{ color: 'var(--text-primary)' }}>
                        {pos.position}
                      </span>
                      {change > 0 && <ChevronUp size={8} className="text-green-400" />}
                      {change < 0 && <ChevronDown size={8} className="text-red-400" />}
                    </div>

                    {/* Driver */}
                    <div className="flex items-center gap-1.5 min-w-0">
                      <div className="w-0.5 h-5 rounded-full shrink-0" style={{ background: pos.teamColor }} />
                      <div className="min-w-0">
                        <p className="text-xs font-bold truncate" style={{ color: 'var(--text-primary)' }}>
                          {pos.driverCode || pos.driverName.split(' ').pop()}
                        </p>
                        <p className="text-[8px] truncate" style={{ color: 'var(--text-muted)' }}>
                          {pos.team}
                        </p>
                      </div>
                      {hasFastestLap && <Zap size={10} className="text-purple-400 shrink-0" />}
                    </div>

                    {/* Gap / Interval */}
                    <div className="text-center">
                      {pos.gap === 'LEADER' ? (
                        <span className="text-[10px] font-bold" style={{ color: 'var(--text-primary)' }}>LEADER</span>
                      ) : (
                        <div>
                          <p className="text-[10px] font-mono" style={{ color: 'var(--text-secondary)' }}>
                            {pos.interval}
                          </p>
                          <p className="text-[8px] font-mono" style={{ color: 'var(--text-muted)' }}>
                            {pos.gap}
                          </p>
                        </div>
                      )}
                    </div>

                    {/* Tyre */}
                    <div className="flex items-center justify-center gap-1">
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
                        {pos.tireAge}
                      </span>
                    </div>

                    {/* Pit Status */}
                    <div className="flex items-center justify-center hidden sm:flex">
                      {isPitting ? (
                        <span className="text-[8px] font-bold text-amber-400 bg-amber-400/15 px-1.5 py-0.5 rounded pit-badge-glow">
                          IN PIT
                        </span>
                      ) : pos.pitStops > 0 ? (
                        <span className="text-[8px] font-mono" style={{ color: 'var(--text-muted)' }}>
                          {pos.pitStops}×
                        </span>
                      ) : (
                        <span className="text-[8px]" style={{ color: 'var(--text-muted)' }}>—</span>
                      )}
                    </div>

                    {/* DRS */}
                    <div className="flex items-center justify-center hidden sm:flex">
                      {pos.drs && pos.status === 'racing' && (
                        <span className="text-[8px] font-bold text-green-400 bg-green-400/10 px-1 py-0.5 rounded">
                          DRS
                        </span>
                      )}
                    </div>
                  </button>

                  {/* Expanded Telemetry */}
                  <AnimatePresence>
                    {isExpanded && (
                      <motion.div
                        initial={{ height: 0, opacity: 0 }}
                        animate={{ height: 'auto', opacity: 1 }}
                        exit={{ height: 0, opacity: 0 }}
                        transition={{ duration: 0.2 }}
                        className="overflow-hidden border-b"
                        style={{ borderColor: 'var(--border)', background: 'var(--surface)' }}
                      >
                        <div className="px-4 py-3">
                          {/* Driver Name + Activity */}
                          <div className="flex items-center gap-2 mb-3">
                            <Activity size={10} style={{ color: pos.teamColor }} />
                            <span className="text-[10px] font-bold uppercase tracking-wider" style={{ color: pos.teamColor }}>
                              {pos.driverName} — Telemetry
                            </span>
                          </div>

                          {/* Lap Times */}
                          <div className="grid grid-cols-2 gap-2 mb-3">
                            <div className="p-2 rounded-lg" style={{ background: 'var(--surface)' }}>
                              <p className="text-[9px] font-bold uppercase tracking-wider" style={{ color: 'var(--text-muted)' }}>Last Lap</p>
                              <p className="text-xs font-mono font-bold mt-0.5" style={{ color: 'var(--text-primary)' }}>{pos.lastLapTime}</p>
                            </div>
                            <div className="p-2 rounded-lg" style={{ background: 'var(--surface)' }}>
                              <p className="text-[9px] font-bold uppercase tracking-wider" style={{ color: 'var(--text-muted)' }}>Best Lap</p>
                              <p className="text-xs font-mono font-bold mt-0.5 text-purple-400">{pos.bestLapTime}</p>
                            </div>
                          </div>

                          {/* Sector Times */}
                          <div className="grid grid-cols-3 gap-2 mb-3">
                            {['S1', 'S2', 'S3'].map((label, i) => {
                              const value = i === 0 ? pos.sector1 : i === 1 ? pos.sector2 : pos.sector3;
                              const val = parseFloat(value);
                              const sectorColor = val < 25 ? '#a855f7' : val < 26 ? '#22c55e' : '#eab308';
                              return (
                                <div key={label} className="text-center p-2 rounded-lg" style={{ background: 'var(--surface)' }}>
                                  <p className="text-[9px] font-bold tracking-wider" style={{ color: 'var(--text-muted)' }}>{label}</p>
                                  <p className="text-xs font-mono font-bold mt-0.5" style={{ color: value === '-' ? 'var(--text-muted)' : sectorColor }}>
                                    {value}
                                  </p>
                                </div>
                              );
                            })}
                          </div>

                          {/* Tyre Info + Pit Stops */}
                          <div className="flex items-center gap-3">
                            <div className="flex items-center gap-1">
                              <span
                                className="text-[9px] font-bold uppercase px-2 py-0.5 rounded"
                                style={{
                                  background: getTireColor(pos.tire) + '20',
                                  color: getTireColor(pos.tire),
                                }}
                              >
                                {pos.tire} — L{pos.tireAge}
                              </span>
                            </div>
                            <span className="text-[9px]" style={{ color: 'var(--text-muted)' }}>
                              Pit stops: <strong style={{ color: 'var(--text-primary)' }}>{pos.pitStops}</strong>
                            </span>
                            {pos.status === 'retired' && (
                              <span className="text-[9px] font-bold text-red-400 bg-red-400/10 px-2 py-0.5 rounded">
                                RETIRED
                              </span>
                            )}
                          </div>
                        </div>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </motion.div>
              );
            })}
          </AnimatePresence>
        </LayoutGroup>
      </div>
    </div>
  );
}
