'use client';

import { useEffect, useCallback, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { TrackData } from '@/data/trackData';
import { getTrackPath } from '@/data/trackPaths';
import {
  X, MapPin, Timer, Zap, Trophy, CloudRain,
  AlertTriangle, Gauge, CircleDot, ArrowRight,
} from 'lucide-react';

interface TrackDetailModalProps {
  track: TrackData | null;
  onClose: () => void;
}

// ─── Radar Chart Component ────────────────────────────────────────────────────
function RadarChart({ data, color }: { data: { label: string; value: number }[]; color: string }) {
  const size = 200;
  const center = size / 2;
  const radius = 70;
  const levels = 5;
  const angleStep = (Math.PI * 2) / data.length;

  const getPoint = (index: number, value: number) => {
    const angle = angleStep * index - Math.PI / 2;
    const r = radius * value;
    return {
      x: center + r * Math.cos(angle),
      y: center + r * Math.sin(angle),
    };
  };

  const gridLines = Array.from({ length: levels }, (_, i) => {
    const r = (radius / levels) * (i + 1);
    const points = data.map((_, j) => {
      const angle = angleStep * j - Math.PI / 2;
      return `${center + r * Math.cos(angle)},${center + r * Math.sin(angle)}`;
    });
    return points.join(' ');
  });

  const dataPoints = data.map((d, i) => getPoint(i, d.value));
  const dataPolygon = dataPoints.map(p => `${p.x},${p.y}`).join(' ');

  return (
    <svg viewBox={`0 0 ${size} ${size}`} className="w-full h-full">
      {/* Grid lines */}
      {gridLines.map((points, i) => (
        <polygon
          key={i}
          points={points}
          fill="none"
          stroke="var(--border)"
          strokeWidth="0.5"
          opacity={0.5}
        />
      ))}
      {/* Axis lines */}
      {data.map((_, i) => {
        const angle = angleStep * i - Math.PI / 2;
        return (
          <line
            key={i}
            x1={center}
            y1={center}
            x2={center + radius * Math.cos(angle)}
            y2={center + radius * Math.sin(angle)}
            stroke="var(--border)"
            strokeWidth="0.5"
            opacity={0.3}
          />
        );
      })}
      {/* Data polygon */}
      <motion.polygon
        initial={{ opacity: 0, scale: 0.3 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ delay: 0.3, duration: 0.6, ease: 'easeOut' }}
        points={dataPolygon}
        fill={`${color}20`}
        stroke={color}
        strokeWidth="2"
        style={{ transformOrigin: 'center' }}
      />
      {/* Data points */}
      {dataPoints.map((p, i) => (
        <motion.circle
          key={i}
          initial={{ opacity: 0, r: 0 }}
          animate={{ opacity: 1, r: 3 }}
          transition={{ delay: 0.4 + i * 0.05, duration: 0.3 }}
          cx={p.x}
          cy={p.y}
          fill={color}
          stroke="#fff"
          strokeWidth="1"
        />
      ))}
      {/* Labels */}
      {data.map((d, i) => {
        const angle = angleStep * i - Math.PI / 2;
        const labelR = radius + 20;
        const x = center + labelR * Math.cos(angle);
        const y = center + labelR * Math.sin(angle);
        return (
          <text
            key={i}
            x={x}
            y={y}
            textAnchor="middle"
            dominantBaseline="middle"
            fill="var(--text-secondary)"
            fontSize="7"
            fontFamily="'Titillium Web', system-ui, sans-serif"
            fontWeight="600"
          >
            {d.label}
          </text>
        );
      })}
    </svg>
  );
}

// ─── Stat Meter Component ─────────────────────────────────────────────────────
function StatMeter({ value, label, color, icon: Icon }: {
  value: number;
  label: string;
  color: string;
  icon: React.ElementType;
}) {
  return (
    <div className="space-y-1.5">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-1.5">
          <Icon size={12} style={{ color }} />
          <span className="text-[10px] font-bold uppercase tracking-wider" style={{ color: 'var(--text-secondary)' }}>
            {label}
          </span>
        </div>
        <span className="text-[10px] font-display font-bold" style={{ color }}>
          {Math.round(value * 100)}%
        </span>
      </div>
      <div className="h-1.5 rounded-full overflow-hidden" style={{ background: 'var(--surface)' }}>
        <motion.div
          initial={{ width: 0 }}
          animate={{ width: `${value * 100}%` }}
          transition={{ delay: 0.3, duration: 0.8, ease: 'easeOut' }}
          className="h-full rounded-full"
          style={{ background: `linear-gradient(90deg, ${color}88, ${color})` }}
        />
      </div>
    </div>
  );
}

// ─── Main Modal Component ─────────────────────────────────────────────────────
export default function TrackDetailModal({ track, onClose }: TrackDetailModalProps) {
  const modalRef = useRef<HTMLDivElement>(null);

  // Close on Escape key
  const handleKeyDown = useCallback((e: KeyboardEvent) => {
    if (e.key === 'Escape') onClose();
  }, [onClose]);

  useEffect(() => {
    document.addEventListener('keydown', handleKeyDown);
    // Prevent body scroll
    document.body.style.overflow = 'hidden';
    return () => {
      document.removeEventListener('keydown', handleKeyDown);
      document.body.style.overflow = '';
    };
  }, [handleKeyDown]);

  // Close on backdrop click
  const handleBackdropClick = useCallback((e: React.MouseEvent) => {
    if (modalRef.current && !modalRef.current.contains(e.target as Node)) {
      onClose();
    }
  }, [onClose]);

  if (!track) return null;

  const trackPath = getTrackPath(track.id);

  const radarData = [
    { label: 'Overtake', value: 1 - track.overtakeDifficulty },
    { label: 'Tyre Deg', value: track.tyreDegradation },
    { label: 'Rain Risk', value: track.rainProbability },
    { label: 'SC Risk', value: track.safetyCaProbability },
    { label: 'Speed', value: track.baseLapTimeSeconds > 90 ? 0.7 : track.baseLapTimeSeconds > 80 ? 0.5 : 0.3 },
  ];

  const pitWindowTotal = track.totalLaps;
  const pitStartPct = (track.pitWindowStart / pitWindowTotal) * 100;
  const pitEndPct = (track.pitWindowEnd / pitWindowTotal) * 100;

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        transition={{ duration: 0.2 }}
        className="fixed inset-0 z-[100] flex items-start justify-center overflow-y-auto"
        style={{ background: 'rgba(0, 0, 0, 0.75)', backdropFilter: 'blur(8px)' }}
        onClick={handleBackdropClick}
      >
        <motion.div
          ref={modalRef}
          initial={{ opacity: 0, y: 40, scale: 0.97 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          exit={{ opacity: 0, y: 40, scale: 0.97 }}
          transition={{ duration: 0.35, ease: [0.16, 1, 0.3, 1] }}
          className="relative w-full max-w-5xl my-8 mx-4 rounded-2xl overflow-hidden"
          style={{
            background: 'var(--surface-solid)',
            border: '1px solid var(--border-accent)',
            boxShadow: `0 25px 80px rgba(0,0,0,0.5), 0 0 60px ${track.accentColor}15`,
          }}
        >
          {/* Close Button */}
          <button
            onClick={onClose}
            className="absolute top-4 right-4 z-20 w-10 h-10 rounded-full flex items-center justify-center transition-all duration-200 hover:scale-110"
            style={{
              background: 'rgba(0,0,0,0.5)',
              backdropFilter: 'blur(10px)',
              border: '1px solid var(--border)',
              color: 'var(--text-primary)',
            }}
          >
            <X size={18} />
          </button>

          {/* ─── Hero Section ─────────────────────────────────────────────── */}
          <div className="relative h-[300px] sm:h-[360px] overflow-hidden">
            {/* Background gradient */}
            <div
              className="absolute inset-0"
              style={{
                background: `linear-gradient(135deg, #0d0d14 0%, ${track.accentColor}12 50%, #0d0d14 100%)`,
              }}
            />
            {/* Radial accent glow */}
            <div
              className="absolute inset-0"
              style={{
                background: `radial-gradient(ellipse at 60% 40%, ${track.accentColor}20 0%, transparent 60%)`,
              }}
            />

            {/* Track SVG */}
            {trackPath && (() => {
              const parts = trackPath.viewBox.split(/\s+/).map(Number);
              const maxDim = parts.length >= 4 ? Math.max(parts[2], parts[3]) : 1000;
              const REF = 1000;
              const shadowSw = Math.round((24 * maxDim / REF) * 10) / 10;
              const mainSw = Math.round((16 * maxDim / REF) * 10) / 10;
              const clSw = Math.max(0.3, Math.round((1 * maxDim / REF) * 10) / 10);
              const pitSw = Math.max(1, Math.round((6 * maxDim / REF) * 10) / 10);
              const dashA = Math.round(mainSw / 2.7);
              const dashB = Math.round(mainSw / 1.6);
              const pitDashA = Math.round(pitSw / 1.5);
              const pitDashB = Math.round(pitSw / 2);
              return (
              <div className="absolute inset-0 flex items-center justify-center p-8">
                <svg viewBox={trackPath.viewBox} className="w-full h-full max-h-[280px] track-detail-svg">
                  {/* Track shadow */}
                  <path
                    d={trackPath.mainPath}
                    fill="none"
                    stroke="rgba(0,0,0,0.3)"
                    strokeWidth={shadowSw}
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  />
                  {/* Main track */}
                  <path
                    d={trackPath.mainPath}
                    fill="none"
                    stroke={track.accentColor}
                    strokeWidth={mainSw}
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    opacity="0.6"
                    className="track-detail-path"
                  />
                  {/* Center dashed line */}
                  <path
                    d={trackPath.mainPath}
                    fill="none"
                    stroke="#fff"
                    strokeWidth={clSw}
                    strokeDasharray={`${dashA} ${dashB}`}
                    strokeLinecap="round"
                    opacity="0.15"
                  />
                  {/* Pit lane */}
                  <path
                    d={trackPath.pitLanePath}
                    fill="none"
                    stroke="#555577"
                    strokeWidth={pitSw}
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeDasharray={`${pitDashA} ${pitDashB}`}
                    opacity="0.4"
                  />
                </svg>
              </div>
              );
            })()}

            {/* Country badge */}
            <div className="absolute top-5 left-5 z-10">
              <motion.span
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.1 }}
                className="text-[10px] font-display font-bold tracking-[0.2em] uppercase px-3 py-1.5 rounded-lg"
                style={{
                  background: `${track.accentColor}25`,
                  color: track.accentColor,
                  border: `1px solid ${track.accentColor}40`,
                  backdropFilter: 'blur(10px)',
                }}
              >
                {track.countryFlag} {track.country}
              </motion.span>
            </div>

            {/* Country code */}
            <div className="absolute top-5 right-16 z-10">
              <motion.span
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.15 }}
                className="text-4xl font-display font-black tracking-wider"
                style={{ color: 'var(--text-primary)', opacity: 0.25 }}
              >
                {track.countryCode}
              </motion.span>
            </div>

            {/* Hero text overlay */}
            <div className="absolute bottom-0 left-0 right-0 p-6 z-10"
              style={{ background: 'linear-gradient(transparent, rgba(0,0,0,0.7))' }}
            >
              <motion.h2
                initial={{ opacity: 0, y: 15 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.2 }}
                className="text-2xl sm:text-3xl font-display font-black tracking-wide"
                style={{ color: 'var(--text-primary)' }}
              >
                {track.grandPrixName.toUpperCase()}
              </motion.h2>
              <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.25 }}
                className="flex items-center gap-2 mt-1"
              >
                <MapPin size={13} style={{ color: track.accentColor }} />
                <span className="text-sm" style={{ color: 'var(--text-secondary)' }}>
                  {track.name} — {track.locality}
                </span>
              </motion.div>
            </div>
          </div>

          {/* ─── Content Body ─────────────────────────────────────────────── */}
          <div className="p-5 sm:p-8 space-y-6">
            {/* Stats Grid */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.15 }}
              className="grid grid-cols-2 sm:grid-cols-4 gap-3"
            >
              {[
                { label: 'LENGTH', value: `${track.lengthKm}km`, sub: 'Circuit Length' },
                { label: 'LAPS', value: `${track.totalLaps}`, sub: 'Race Distance' },
                { label: 'CORNERS', value: `${track.cornerCount}`, sub: 'Total Turns' },
                { label: 'DRS ZONES', value: `${track.drsZones}`, sub: 'Overtaking Aids', icon: Zap },
              ].map((stat, i) => (
                <motion.div
                  key={stat.label}
                  initial={{ opacity: 0, y: 15 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.2 + i * 0.05 }}
                  className="text-center p-4 rounded-xl"
                  style={{
                    background: 'var(--surface)',
                    border: '1px solid var(--border)',
                  }}
                >
                  <p className="text-[9px] font-display font-bold tracking-[0.15em] uppercase mb-1"
                    style={{ color: 'var(--text-muted)' }}>
                    {stat.label}
                  </p>
                  <p className="text-2xl sm:text-3xl font-display font-black"
                    style={{ color: 'var(--text-primary)' }}>
                    {stat.icon ? (
                      <span className="inline-flex items-center gap-1.5">
                        <Zap size={16} className="text-green-400" />
                        {stat.value}
                      </span>
                    ) : stat.value}
                  </p>
                  <p className="text-[9px] mt-0.5" style={{ color: 'var(--text-muted)' }}>
                    {stat.sub}
                  </p>
                </motion.div>
              ))}
            </motion.div>

            {/* Lap Record Card */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.3 }}
              className="p-5 rounded-xl relative overflow-hidden"
              style={{
                background: `linear-gradient(135deg, var(--surface) 0%, ${track.accentColor}08 100%)`,
                border: `1px solid ${track.accentColor}30`,
              }}
            >
              {/* Decorative accent */}
              <div className="absolute top-0 left-0 w-1 h-full" style={{ background: track.accentColor }} />

              <div className="flex items-center gap-3 mb-3">
                <div className="w-9 h-9 rounded-lg flex items-center justify-center"
                  style={{ background: `${track.accentColor}20` }}>
                  <Trophy size={18} style={{ color: track.accentColor }} />
                </div>
                <div>
                  <p className="text-[9px] font-display font-bold tracking-[0.2em] uppercase"
                    style={{ color: 'var(--text-muted)' }}>
                    ALL-TIME LAP RECORD
                  </p>
                </div>
              </div>

              <div className="flex flex-col sm:flex-row items-start sm:items-end gap-3 sm:gap-6">
                <div className="flex items-baseline gap-2">
                  <Timer size={16} className="text-purple-400 shrink-0 self-center" />
                  <span className="text-3xl sm:text-4xl font-display font-black text-purple-400">
                    {track.lapRecord}
                  </span>
                </div>
                <div className="flex items-center gap-2">
                  <ArrowRight size={12} style={{ color: 'var(--text-muted)' }} />
                  <span className="text-sm font-semibold" style={{ color: 'var(--text-primary)' }}>
                    {track.lapRecordHolder}
                  </span>
                  <span className="text-xs px-2 py-0.5 rounded-md font-bold"
                    style={{
                      background: `${track.accentColor}15`,
                      color: track.accentColor,
                    }}>
                    {track.lapRecordYear}
                  </span>
                </div>
              </div>
            </motion.div>

            {/* Two Column: Radar + Meters */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
              {/* Radar Chart */}
              <motion.div
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.35 }}
                className="p-5 rounded-xl"
                style={{
                  background: 'var(--surface)',
                  border: '1px solid var(--border)',
                }}
              >
                <h3 className="text-[10px] font-display font-bold tracking-[0.2em] uppercase mb-4"
                  style={{ color: 'var(--text-secondary)' }}>
                  CIRCUIT CHARACTERISTICS
                </h3>
                <div className="w-full max-w-[220px] mx-auto aspect-square">
                  <RadarChart data={radarData} color={track.accentColor} />
                </div>
              </motion.div>

              {/* Stat Meters */}
              <motion.div
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.4 }}
                className="p-5 rounded-xl space-y-4"
                style={{
                  background: 'var(--surface)',
                  border: '1px solid var(--border)',
                }}
              >
                <h3 className="text-[10px] font-display font-bold tracking-[0.2em] uppercase mb-1"
                  style={{ color: 'var(--text-secondary)' }}>
                  PERFORMANCE METRICS
                </h3>

                <StatMeter
                  value={1 - track.overtakeDifficulty}
                  label="Overtaking Opportunity"
                  color="#22c55e"
                  icon={Gauge}
                />
                <StatMeter
                  value={track.tyreDegradation}
                  label="Tyre Degradation"
                  color="#f59e0b"
                  icon={CircleDot}
                />
                <StatMeter
                  value={track.rainProbability}
                  label="Rain Probability"
                  color="#3b82f6"
                  icon={CloudRain}
                />
                <StatMeter
                  value={track.safetyCaProbability}
                  label="Safety Car Probability"
                  color="#ef4444"
                  icon={AlertTriangle}
                />

                {/* Pit Window */}
                <div className="pt-2 mt-2" style={{ borderTop: '1px solid var(--border)' }}>
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-[10px] font-bold uppercase tracking-wider"
                      style={{ color: 'var(--text-secondary)' }}>
                      Optimal Pit Window
                    </span>
                    <span className="text-[10px] font-display font-bold"
                      style={{ color: 'var(--text-primary)' }}>
                      Lap {track.pitWindowStart} — {track.pitWindowEnd}
                    </span>
                  </div>
                  <div className="relative h-3 rounded-full overflow-hidden"
                    style={{ background: 'var(--surface)' }}>
                    {/* Full track bar */}
                    <div className="absolute inset-0 rounded-full"
                      style={{ background: 'rgba(255,255,255,0.04)' }} />
                    {/* Pit window */}
                    <motion.div
                      initial={{ width: 0, left: `${pitStartPct}%` }}
                      animate={{ width: `${pitEndPct - pitStartPct}%`, left: `${pitStartPct}%` }}
                      transition={{ delay: 0.5, duration: 0.8, ease: 'easeOut' }}
                      className="absolute top-0 h-full rounded-full"
                      style={{
                        background: `linear-gradient(90deg, ${track.accentColor}88, ${track.accentColor})`,
                      }}
                    />
                    {/* Lap markers */}
                    {[0.25, 0.5, 0.75].map(pct => (
                      <div
                        key={pct}
                        className="absolute top-0 h-full w-px"
                        style={{ left: `${pct * 100}%`, background: 'rgba(255,255,255,0.1)' }}
                      />
                    ))}
                  </div>
                  <div className="flex justify-between mt-1">
                    <span className="text-[8px]" style={{ color: 'var(--text-muted)' }}>Lap 1</span>
                    <span className="text-[8px]" style={{ color: 'var(--text-muted)' }}>Lap {track.totalLaps}</span>
                  </div>
                </div>
              </motion.div>
            </div>

            {/* Characteristics Tags */}
            <motion.div
              initial={{ opacity: 0, y: 15 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.45 }}
              className="flex flex-wrap gap-2"
            >
              {track.characteristics.map((tag, i) => (
                <motion.span
                  key={tag}
                  initial={{ opacity: 0, scale: 0.8 }}
                  animate={{ opacity: 1, scale: 1 }}
                  transition={{ delay: 0.5 + i * 0.06 }}
                  className="text-[10px] font-bold tracking-wider uppercase px-3 py-1.5 rounded-lg"
                  style={{
                    background: `${track.accentColor}12`,
                    color: track.accentColor,
                    border: `1px solid ${track.accentColor}25`,
                  }}
                >
                  {tag}
                </motion.span>
              ))}
              {track.drsZones > 0 && (
                <motion.span
                  initial={{ opacity: 0, scale: 0.8 }}
                  animate={{ opacity: 1, scale: 1 }}
                  transition={{ delay: 0.5 + track.characteristics.length * 0.06 }}
                  className="text-[10px] font-bold tracking-wider uppercase px-3 py-1.5 rounded-lg flex items-center gap-1 bg-green-500/10 text-green-400"
                  style={{ border: '1px solid rgba(34,197,94,0.25)' }}
                >
                  <Zap size={10} /> {track.drsZones} DRS ZONES
                </motion.span>
              )}
            </motion.div>

            {/* Base Lap Time Info */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.55 }}
              className="flex items-center gap-3 pt-2"
              style={{ borderTop: '1px solid var(--border)' }}
            >
              <span className="text-[9px] font-bold uppercase tracking-wider"
                style={{ color: 'var(--text-muted)' }}>
                Est. Race Lap Time
              </span>
              <span className="text-xs font-display font-bold"
                style={{ color: 'var(--text-primary)' }}>
                ~{Math.floor(track.baseLapTimeSeconds / 60)}:{(track.baseLapTimeSeconds % 60).toString().padStart(2, '0')}
              </span>
              <span className="text-[9px]" style={{ color: 'var(--text-muted)' }}>•</span>
              <span className="text-[9px] font-bold uppercase tracking-wider"
                style={{ color: 'var(--text-muted)' }}>
                Race Distance
              </span>
              <span className="text-xs font-display font-bold"
                style={{ color: 'var(--text-primary)' }}>
                {(track.lengthKm * track.totalLaps).toFixed(1)} km
              </span>
            </motion.div>
          </div>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
}
