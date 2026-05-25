'use client';

import { motion } from 'framer-motion';
import { getTrackById } from '@/data/trackData';
import { WeatherCondition } from '@/types';
import {
  Play, Square, ArrowLeft, Radio, Zap, Cloud, Sun, CloudRain,
} from 'lucide-react';

interface RaceHeaderProps {
  trackId: string;
  currentLap: number;
  totalLaps: number;
  status: string;
  weather: WeatherCondition;
  fastestLap: { driverId: string; time: string } | null;
  isConnected: boolean;
  onStart: () => void;
  onStop: () => void;
  onBack: () => void;
}

export default function RaceHeader({
  trackId,
  currentLap,
  totalLaps,
  status,
  weather,
  fastestLap,
  isConnected,
  onStart,
  onStop,
  onBack,
}: RaceHeaderProps) {
  const track = getTrackById(trackId);
  const lapProgress = totalLaps > 0 ? (currentLap / totalLaps) * 100 : 0;

  const WeatherIcon = weather === 'dry' ? Sun : weather === 'light_rain' ? Cloud : CloudRain;

  const statusConfig: Record<string, { label: string; color: string; bg: string }> = {
    racing: { label: 'RACING', color: '#22c55e', bg: 'rgba(34,197,94,0.12)' },
    safety_car: { label: 'SAFETY CAR', color: '#eab308', bg: 'rgba(234,179,8,0.12)' },
    finished: { label: 'FINISHED', color: '#a855f7', bg: 'rgba(168,85,247,0.12)' },
    not_started: { label: 'READY', color: '#6b7280', bg: 'rgba(107,114,128,0.12)' },
  };

  const currentStatus = statusConfig[status] || statusConfig.not_started;

  return (
    <motion.div
      initial={{ opacity: 0, y: -10 }}
      animate={{ opacity: 1, y: 0 }}
      className="glass-card p-4 mb-5"
    >
      {/* Top row */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center gap-3 mb-3">
        {/* Back + Title */}
        <div className="flex items-center gap-3 flex-1 min-w-0">
          <button
            onClick={onBack}
            className="shrink-0 p-2 rounded-lg hover:bg-[var(--surface-hover)] transition-colors"
            style={{ color: 'var(--text-secondary)' }}
          >
            <ArrowLeft size={18} />
          </button>

          <div className="min-w-0">
            <div className="flex items-center gap-2">
              <span className="text-lg">{track?.countryFlag}</span>
              <h2 className="text-lg sm:text-xl font-display font-black tracking-wide truncate" style={{ color: 'var(--text-primary)' }}>
                {track?.grandPrixName.toUpperCase() || 'GRAND PRIX'}
              </h2>
              {status === 'racing' && <span className="w-2 h-2 rounded-full bg-[#E10600] live-pulse shrink-0" />}
            </div>
            <p className="text-[10px] tracking-wider uppercase" style={{ color: 'var(--text-muted)' }}>
              {track?.name} — {track?.lengthKm}km — {track?.cornerCount} corners
            </p>
          </div>
        </div>

        {/* Controls */}
        <div className="flex items-center gap-2 shrink-0">
          {/* Weather badge */}
          <div className="flex items-center gap-1 px-2 py-1 rounded-lg" style={{ background: weather !== 'dry' ? 'rgba(59,130,246,0.12)' : 'rgba(234,179,8,0.08)' }}>
            <WeatherIcon size={12} className={weather !== 'dry' ? 'text-blue-400' : 'text-yellow-400'} />
            <span className="text-[9px] font-bold uppercase tracking-wider" style={{ color: weather !== 'dry' ? '#60a5fa' : '#fbbf24' }}>
              {weather === 'dry' ? 'Dry' : weather === 'light_rain' ? 'Rain' : 'Storm'}
            </span>
          </div>

          {/* Status badge */}
          <div className="flex items-center gap-1 px-2 py-1 rounded-lg" style={{ background: currentStatus.bg }}>
            <div className="w-1.5 h-1.5 rounded-full" style={{ background: currentStatus.color }} />
            <span className="text-[9px] font-display font-bold tracking-wider" style={{ color: currentStatus.color }}>
              {currentStatus.label}
            </span>
          </div>

          {/* Start/Stop */}
          {status === 'not_started' || status === 'finished' ? (
            <button
              onClick={onStart}
              disabled={!isConnected}
              className="flex items-center gap-1.5 px-4 py-2 rounded-xl bg-[#E10600] hover:bg-[#B30500] text-white font-bold text-xs transition-all disabled:opacity-50 disabled:cursor-not-allowed shadow-lg shadow-red-500/20"
            >
              <Play size={12} /> Start Race
            </button>
          ) : (
            <button
              onClick={onStop}
              className="flex items-center gap-1.5 px-4 py-2 rounded-xl bg-[#6B6B8D]/20 hover:bg-[#6B6B8D]/30 font-bold text-xs transition-all border"
              style={{ color: 'var(--text-primary)', borderColor: 'var(--border)' }}
            >
              <Square size={12} /> Stop
            </button>
          )}
        </div>
      </div>

      {/* Bottom row — Lap + Progress */}
      <div className="flex items-center gap-4">
        <div className="flex items-center gap-2">
          <Radio size={12} style={{ color: 'var(--text-secondary)' }} />
          <span className="text-xs font-display font-bold" style={{ color: 'var(--text-primary)' }}>
            LAP {currentLap}/{totalLaps}
          </span>
        </div>

        {/* Progress bar */}
        <div className="flex-1">
          <div className="h-1.5 rounded-full overflow-hidden" style={{ background: 'var(--border)' }}>
            <motion.div
              className="h-full rounded-full"
              style={{ background: `linear-gradient(90deg, #E10600, ${track?.accentColor || '#FF4444'})` }}
              animate={{ width: `${lapProgress}%` }}
              transition={{ duration: 0.5 }}
            />
          </div>
        </div>

        {/* Fastest lap */}
        {fastestLap && (
          <div className="flex items-center gap-1.5">
            <Zap size={10} className="text-purple-400" />
            <span className="text-[10px] text-purple-400 font-bold font-mono">{fastestLap.time}</span>
          </div>
        )}

        {!isConnected && (
          <span className="text-[10px] text-[#E10600] font-bold">Connecting...</span>
        )}
      </div>
    </motion.div>
  );
}
