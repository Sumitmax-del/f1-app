'use client';

import { motion } from 'framer-motion';
import { LivePosition } from '@/types';
import { getTireColor } from '@/lib/utils';
import { Gauge, Activity, Zap, Timer, Fuel } from 'lucide-react';

interface TelemetryPanelProps {
  driver: LivePosition | null;
  fastestLap: { driverId: string; time: string } | null;
}

export default function TelemetryPanel({ driver, fastestLap }: TelemetryPanelProps) {
  if (!driver) {
    return (
      <div className="glass-card p-6 flex items-center justify-center h-full">
        <p className="text-xs text-center" style={{ color: 'var(--text-muted)' }}>
          Select a driver from the timing tower to view telemetry
        </p>
      </div>
    );
  }

  const hasFastestLap = fastestLap?.driverId === driver.driverId;

  // Simulated telemetry values
  const speed = driver.status === 'pit' ? 80 : driver.status === 'retired' ? 0 : 180 + Math.floor(Math.random() * 170);
  const throttle = driver.status === 'racing' ? 60 + Math.floor(Math.random() * 40) : 0;
  const brake = driver.status === 'racing' ? Math.floor(Math.random() * 30) : 0;
  const ersDeployment = driver.status === 'racing' ? 40 + Math.floor(Math.random() * 60) : 0;

  // Sector color logic
  const getSectorColor = (sectorValue: string) => {
    if (sectorValue === '-') return 'var(--text-muted)';
    const val = parseFloat(sectorValue);
    if (val < 25) return '#a855f7'; // purple - fastest
    if (val < 26) return '#22c55e'; // green - personal best
    return '#eab308'; // yellow - slower
  };

  const tireLifePercent = Math.max(0, 100 - (driver.tireAge * (driver.tire === 'soft' ? 4 : driver.tire === 'medium' ? 2.5 : 1.5)));

  return (
    <div className="glass-card overflow-hidden h-full flex flex-col">
      {/* Header */}
      <div className="px-4 py-3 flex items-center gap-2 border-b shrink-0" style={{ borderColor: 'var(--border)' }}>
        <Activity size={14} className="text-[#E10600]" />
        <span className="font-display font-bold text-xs tracking-wider uppercase" style={{ color: 'var(--text-primary)' }}>
          Telemetry
        </span>
      </div>

      {/* Driver info */}
      <div className="px-4 py-3 border-b shrink-0" style={{ borderColor: 'var(--border)' }}>
        <div className="flex items-center gap-2">
          <div className="w-1 h-8 rounded-full" style={{ background: driver.teamColor }} />
          <div>
            <p className="text-sm font-display font-bold" style={{ color: 'var(--text-primary)' }}>
              {driver.driverName}
            </p>
            <p className="text-[10px]" style={{ color: 'var(--text-secondary)' }}>
              P{driver.position} — {driver.team}
            </p>
          </div>
          {hasFastestLap && (
            <span className="ml-auto flex items-center gap-1 text-[9px] font-bold text-purple-400 bg-purple-400/10 px-2 py-1 rounded">
              <Zap size={9} /> Fastest Lap
            </span>
          )}
        </div>
      </div>

      {/* Telemetry content */}
      <div className="p-4 space-y-4 flex-1 overflow-y-auto">
        {/* Speed */}
        <div>
          <div className="flex items-center justify-between mb-1">
            <span className="text-[10px] font-bold uppercase tracking-wider" style={{ color: 'var(--text-muted)' }}>Speed</span>
            <span className="text-sm font-display font-bold" style={{ color: 'var(--text-primary)' }}>{speed} km/h</span>
          </div>
          <div className="h-1.5 rounded-full overflow-hidden" style={{ background: 'var(--border)' }}>
            <motion.div
              className="h-full rounded-full bg-gradient-to-r from-[#E10600] to-[#ff6b6b]"
              animate={{ width: `${Math.min(100, (speed / 370) * 100)}%` }}
              transition={{ duration: 0.3 }}
            />
          </div>
        </div>

        {/* Sector times */}
        <div>
          <span className="text-[10px] font-bold uppercase tracking-wider block mb-2" style={{ color: 'var(--text-muted)' }}>
            Sector Times
          </span>
          <div className="grid grid-cols-3 gap-2">
            {['S1', 'S2', 'S3'].map((label, i) => {
              const value = i === 0 ? driver.sector1 : i === 1 ? driver.sector2 : driver.sector3;
              return (
                <div key={label} className="text-center p-2 rounded-lg" style={{ background: 'var(--surface)' }}>
                  <p className="text-[9px] font-bold tracking-wider" style={{ color: 'var(--text-muted)' }}>{label}</p>
                  <p className="text-xs font-mono font-bold mt-0.5" style={{ color: getSectorColor(value) }}>
                    {value}
                  </p>
                </div>
              );
            })}
          </div>
        </div>

        {/* Last / Best lap */}
        <div className="grid grid-cols-2 gap-2">
          <div className="p-2 rounded-lg" style={{ background: 'var(--surface)' }}>
            <p className="text-[9px] font-bold uppercase tracking-wider" style={{ color: 'var(--text-muted)' }}>Last Lap</p>
            <p className="text-xs font-mono font-bold mt-0.5" style={{ color: 'var(--text-primary)' }}>{driver.lastLapTime}</p>
          </div>
          <div className="p-2 rounded-lg" style={{ background: 'var(--surface)' }}>
            <p className="text-[9px] font-bold uppercase tracking-wider" style={{ color: 'var(--text-muted)' }}>Best Lap</p>
            <p className="text-xs font-mono font-bold mt-0.5 text-purple-400">{driver.bestLapTime}</p>
          </div>
        </div>

        {/* Tire */}
        <div>
          <div className="flex items-center justify-between mb-1">
            <span className="text-[10px] font-bold uppercase tracking-wider" style={{ color: 'var(--text-muted)' }}>
              Tire — {driver.tire.toUpperCase()} (L{driver.tireAge})
            </span>
            <span className="text-[10px] font-bold" style={{ color: getTireColor(driver.tire) }}>
              {Math.round(tireLifePercent)}%
            </span>
          </div>
          <div className="h-1.5 rounded-full overflow-hidden" style={{ background: 'var(--border)' }}>
            <motion.div
              className="h-full rounded-full"
              style={{ background: getTireColor(driver.tire) }}
              animate={{ width: `${tireLifePercent}%` }}
              transition={{ duration: 0.3 }}
            />
          </div>
        </div>

        {/* ERS */}
        <div>
          <div className="flex items-center justify-between mb-1">
            <span className="text-[10px] font-bold uppercase tracking-wider flex items-center gap-1" style={{ color: 'var(--text-muted)' }}>
              <Zap size={9} /> ERS Deploy
            </span>
            <span className="text-[10px] font-bold text-cyan-400">{ersDeployment}%</span>
          </div>
          <div className="h-1.5 rounded-full overflow-hidden" style={{ background: 'var(--border)' }}>
            <motion.div
              className="h-full rounded-full bg-gradient-to-r from-cyan-500 to-cyan-300"
              animate={{ width: `${ersDeployment}%` }}
              transition={{ duration: 0.3 }}
            />
          </div>
        </div>

        {/* Pit stops */}
        <div className="flex items-center justify-between p-2 rounded-lg" style={{ background: 'var(--surface)' }}>
          <span className="text-[10px] font-bold uppercase tracking-wider" style={{ color: 'var(--text-muted)' }}>Pit Stops</span>
          <span className="text-sm font-display font-bold" style={{ color: 'var(--text-primary)' }}>{driver.pitStops}</span>
        </div>
      </div>
    </div>
  );
}
