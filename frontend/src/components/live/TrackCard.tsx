'use client';

import { motion } from 'framer-motion';
import { getTrackPath } from '@/data/trackPaths';
import { TrackData } from '@/data/trackData';
import { MapPin, Timer, Zap } from 'lucide-react';

/**
 * Compute a proportional stroke width so tracks with smaller viewBoxes
 * don't appear disproportionately thick compared to tracks with larger ones.
 * Reference: strokeWidth 14 at viewBox width ~1000 looks correct.
 */
function getScaledStrokeWidth(viewBox: string, baseWidth: number = 14): number {
  const parts = viewBox.split(/\s+/).map(Number);
  if (parts.length < 4) return baseWidth;
  const vbWidth = parts[2];
  const vbHeight = parts[3];
  const maxDim = Math.max(vbWidth, vbHeight);
  // Reference: 14 stroke at ~1000 maxDim ≈ 1.4% ratio
  const REFERENCE_DIM = 1000;
  return Math.round((baseWidth * maxDim / REFERENCE_DIM) * 10) / 10;
}

interface TrackCardProps {
  track: TrackData;
  onSelect: (trackId: string) => void;
  index: number;
}

export default function TrackCard({ track, onSelect, index }: TrackCardProps) {
  const trackPath = getTrackPath(track.id);

  return (
    <motion.button
      initial={{ opacity: 0, y: 30 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: index * 0.04, duration: 0.4, ease: 'easeOut' }}
      whileHover={{ y: -6, scale: 1.02 }}
      whileTap={{ scale: 0.98 }}
      onClick={() => onSelect(track.id)}
      className="track-card group glass-card p-0 overflow-hidden text-left w-full cursor-pointer transition-shadow duration-300"
      style={{
        '--track-accent': track.accentColor,
      } as React.CSSProperties}
    >
      {/* Track SVG Preview */}
      <div className="relative h-40 overflow-hidden bg-gradient-to-br from-[#1a1a2e] to-[#0d0d14] p-4">
        {/* Accent glow */}
        <div
          className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-500"
          style={{
            background: `radial-gradient(ellipse at center, ${track.accentColor}15 0%, transparent 70%)`,
          }}
        />

        {trackPath && (() => {
          const sw = getScaledStrokeWidth(trackPath.viewBox, 14);
          const clSw = Math.max(0.3, sw / 14); // center-line stroke proportional
          const dashLen = Math.round(sw / 3.5);
          const gapLen = Math.round(sw / 1.75);
          return (
            <svg viewBox={trackPath.viewBox} className="w-full h-full opacity-40 group-hover:opacity-70 transition-opacity duration-300">
              <path
                d={trackPath.mainPath}
                fill="none"
                stroke={track.accentColor}
                strokeWidth={sw}
                strokeLinecap="round"
                strokeLinejoin="round"
                className="track-card-path"
              />
              <path
                d={trackPath.mainPath}
                fill="none"
                stroke="#fff"
                strokeWidth={clSw}
                strokeDasharray={`${dashLen} ${gapLen}`}
                opacity="0.15"
                strokeLinecap="round"
              />
            </svg>
          );
        })()}

        {/* Country Code (ISO 2-letter, F1 app style) */}
        <div className="absolute top-3 right-3 flex items-center gap-1.5">
          <span
            className="text-lg font-display font-black tracking-wider opacity-60 group-hover:opacity-90 transition-opacity"
            style={{ color: 'var(--text-primary)' }}
          >
            {track.countryCode}
          </span>
        </div>

        {/* Country name badge */}
        <div className="absolute top-3 left-3">
          <span className="text-[9px] font-display font-bold tracking-widest uppercase px-2 py-1 rounded-md bg-white/10 backdrop-blur-sm" style={{ color: track.accentColor }}>
            {track.country}
          </span>
        </div>
      </div>

      {/* Track info */}
      <div className="p-4 space-y-3">
        <div>
          <h3 className="text-sm font-display font-bold tracking-wide leading-tight" style={{ color: 'var(--text-primary)' }}>
            {track.grandPrixName.toUpperCase()}
          </h3>
          <p className="text-xs mt-1 flex items-center gap-1" style={{ color: 'var(--text-secondary)' }}>
            <MapPin size={10} />
            {track.name}
          </p>
        </div>

        {/* Stats row */}
        <div className="grid grid-cols-3 gap-2">
          <div className="text-center">
            <p className="text-[10px] uppercase tracking-wider" style={{ color: 'var(--text-muted)' }}>Length</p>
            <p className="text-xs font-display font-bold" style={{ color: 'var(--text-primary)' }}>{track.lengthKm}km</p>
          </div>
          <div className="text-center">
            <p className="text-[10px] uppercase tracking-wider" style={{ color: 'var(--text-muted)' }}>Laps</p>
            <p className="text-xs font-display font-bold" style={{ color: 'var(--text-primary)' }}>{track.totalLaps}</p>
          </div>
          <div className="text-center">
            <p className="text-[10px] uppercase tracking-wider" style={{ color: 'var(--text-muted)' }}>Corners</p>
            <p className="text-xs font-display font-bold" style={{ color: 'var(--text-primary)' }}>{track.cornerCount}</p>
          </div>
        </div>

        {/* Lap record */}
        <div className="flex items-center gap-1.5 pt-1 border-t" style={{ borderColor: 'var(--border)' }}>
          <Timer size={10} className="text-purple-400" />
          <span className="text-[10px] font-mono text-purple-400 font-bold">{track.lapRecord}</span>
          <span className="text-[10px]" style={{ color: 'var(--text-muted)' }}>— {track.lapRecordHolder}</span>
        </div>

        {/* Characteristics */}
        <div className="flex flex-wrap gap-1">
          {track.characteristics.slice(0, 3).map(tag => (
            <span
              key={tag}
              className="text-[9px] font-bold tracking-wider uppercase px-1.5 py-0.5 rounded"
              style={{
                background: `${track.accentColor}15`,
                color: track.accentColor,
              }}
            >
              {tag}
            </span>
          ))}
          {track.drsZones > 0 && (
            <span className="text-[9px] font-bold tracking-wider uppercase px-1.5 py-0.5 rounded bg-green-500/10 text-green-400 flex items-center gap-0.5">
              <Zap size={8} /> {track.drsZones} DRS
            </span>
          )}
        </div>
      </div>

      {/* Hover accent border */}
      <div
        className="absolute bottom-0 left-0 right-0 h-[3px] opacity-0 group-hover:opacity-100 transition-opacity duration-300"
        style={{ background: `linear-gradient(90deg, ${track.accentColor}, transparent)` }}
      />
    </motion.button>
  );
}
