'use client';

import { useState, useMemo } from 'react';
import { motion } from 'framer-motion';
import { ALL_TRACKS } from '@/data/trackData';
import TrackCard from './TrackCard';
import { Search } from 'lucide-react';

interface TrackSelectorProps {
  onSelectTrack: (trackId: string) => void;
}

type SortMode = 'calendar' | 'alphabetical' | 'country';

export default function TrackSelector({ onSelectTrack }: TrackSelectorProps) {
  const [searchQuery, setSearchQuery] = useState('');
  const [sortMode, setSortMode] = useState<SortMode>('calendar');

  const filteredTracks = useMemo(() => {
    let tracks = [...ALL_TRACKS];

    // Filter by search
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      tracks = tracks.filter(
        t =>
          t.name.toLowerCase().includes(q) ||
          t.grandPrixName.toLowerCase().includes(q) ||
          t.country.toLowerCase().includes(q) ||
          t.locality.toLowerCase().includes(q) ||
          t.characteristics.some(c => c.toLowerCase().includes(q))
      );
    }

    // Sort
    if (sortMode === 'alphabetical') {
      tracks.sort((a, b) => a.grandPrixName.localeCompare(b.grandPrixName));
    } else if (sortMode === 'country') {
      tracks.sort((a, b) => a.country.localeCompare(b.country));
    }
    // 'calendar' = default order from array

    return tracks;
  }, [searchQuery, sortMode]);

  return (
    <div className="track-selector">
      {/* Header */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="mb-8"
      >
        <div className="flex items-center gap-3 mb-2">
          <p className="text-xs font-bold uppercase tracking-[0.3em] text-[#E10600]">
            Live Race Simulation
          </p>
        </div>
        <h1
          className="text-4xl sm:text-5xl lg:text-6xl font-display font-black leading-tight"
          style={{ color: 'var(--text-primary)' }}
        >
          SELECT YOUR CIRCUIT
        </h1>
        <p className="text-sm mt-3 max-w-xl" style={{ color: 'var(--text-secondary)' }}>
          Choose from all {ALL_TRACKS.length} official Formula 1 circuits. Each features realistic simulation
          with track-specific characteristics, pit strategies, and weather conditions.
        </p>
      </motion.div>

      {/* Search & Filter Bar */}
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.1 }}
        className="glass-card p-3 sm:p-4 mb-6"
      >
        <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3">
          {/* Search */}
          <div className="flex-1 relative">
            <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-[var(--text-muted)]" />
            <input
              type="text"
              placeholder="Search tracks, countries, or characteristics..."
              value={searchQuery}
              onChange={e => setSearchQuery(e.target.value)}
              className="w-full pl-9 pr-4 py-2.5 rounded-xl text-sm bg-[var(--surface)] border focus:border-[#E10600] outline-none transition-colors"
              style={{
                color: 'var(--text-primary)',
                borderColor: 'var(--border)',
              }}
            />
          </div>

          {/* Sort buttons */}
          <div className="flex items-center gap-1.5">
            <span className="text-[10px] font-bold uppercase tracking-wider mr-1" style={{ color: 'var(--text-muted)' }}>
              Sort:
            </span>
            {(['calendar', 'alphabetical', 'country'] as SortMode[]).map(mode => (
              <button
                key={mode}
                onClick={() => setSortMode(mode)}
                className={`text-[10px] font-bold uppercase tracking-wider px-3 py-1.5 rounded-lg transition-all ${
                  sortMode === mode
                    ? 'bg-[#E10600] text-white'
                    : 'hover:bg-[var(--surface-hover)]'
                }`}
                style={{
                  color: sortMode === mode ? '#fff' : 'var(--text-secondary)',
                }}
              >
                {mode === 'calendar' ? '🗓 Calendar' : mode === 'alphabetical' ? 'A-Z' : '🌍 Country'}
              </button>
            ))}
          </div>
        </div>

        {/* Results count */}
        <div className="mt-2 flex items-center gap-2">
          <span className="text-[10px] font-bold" style={{ color: 'var(--text-muted)' }}>
            {filteredTracks.length} circuit{filteredTracks.length !== 1 ? 's' : ''} found
          </span>
        </div>
      </motion.div>

      {/* Track Grid */}
      {filteredTracks.length === 0 ? (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="text-center py-20"
        >
          <p className="text-lg font-display font-bold" style={{ color: 'var(--text-secondary)' }}>
            No circuits match your search
          </p>
          <p className="text-sm mt-2" style={{ color: 'var(--text-muted)' }}>
            Try a different search term
          </p>
        </motion.div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
          {filteredTracks.map((track, index) => (
            <TrackCard
              key={track.id}
              track={track}
              onSelect={onSelectTrack}
              index={index}
            />
          ))}
        </div>
      )}
    </div>
  );
}
