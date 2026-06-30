'use client';

import { useState, useCallback, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ALL_TRACKS, getTrackById } from '@/data/trackData';
import TrackSelector from '@/components/live/TrackSelector';
import TrackDetailModal from '@/components/live/TrackDetailModal';
import '@/components/live/trackStyles.css';

export default function RaceTracksPage() {
  const [selectedTrackId, setSelectedTrackId] = useState<string | null>(null);

  const selectedTrack = useMemo(
    () => (selectedTrackId ? getTrackById(selectedTrackId) ?? null : null),
    [selectedTrackId]
  );

  const onSelectTrack = useCallback((id: string) => {
    setSelectedTrackId(id);
  }, []);

  const onCloseDetail = useCallback(() => {
    setSelectedTrackId(null);
  }, []);

  return (
    <div className="min-h-screen grid-bg">
      <div className="max-w-[1600px] mx-auto px-4 sm:px-6 py-6">
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.3 }}
        >
          <TrackSelector onSelectTrack={onSelectTrack} />
        </motion.div>
      </div>

      {/* Track Detail Modal */}
      <AnimatePresence>
        {selectedTrack && (
          <TrackDetailModal track={selectedTrack} onClose={onCloseDetail} />
        )}
      </AnimatePresence>
    </div>
  );
}
