'use client';

import { useState, useCallback, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useRaceSimulation } from '@/hooks/useRaceSimulation';
import { getTrackById } from '@/data/trackData';
import { getLiveRaceTrackStructure, getF1_22IdByCircuitId, isValidF1_22TrackId } from '@/data/f1_22TrackRegistry';
import { getTireColor } from '@/lib/utils';
import TrackSelector from '@/components/live/TrackSelector';
import TrackRenderer from '@/components/live/TrackRenderer';
import TimingTower from '@/components/live/TimingTower';
import RaceHeader from '@/components/live/RaceHeader';
import RaceFeed from '@/components/live/RaceFeed';
import TelemetryPanel from '@/components/live/TelemetryPanel';
import '@/components/live/trackStyles.css';

type PageView = 'selector' | 'race';

export default function LiveRacePage() {
  const [view, setView] = useState<PageView>('selector');
  const [selectedTrackId, setSelectedTrackId] = useState<string>('');

  const {
    positions,
    currentLap,
    totalLaps,
    fastestLap,
    status,
    weather,
    trackId,
    events,
    previousPositions,
    selectedDriver,
    selectedDriverData,
    isConnected,
    setSelectedDriver,
    handleStart,
    handleStop,
  } = useRaceSimulation();

  const activeTrackId = trackId || selectedTrackId;
  const trackData = useMemo(() => getTrackById(activeTrackId), [activeTrackId]);
  // F1 22 registry lookup: validates the active circuit and provides UDP-spec structure data
  const f1_22Track = useMemo(() => getLiveRaceTrackStructure(activeTrackId), [activeTrackId]);
  const f1_22TrackId = useMemo(() => getF1_22IdByCircuitId(activeTrackId), [activeTrackId]);

  // Track selection handler
  const onSelectTrack = useCallback((id: string) => {
    setSelectedTrackId(id);
    setView('race');
  }, []);

  // Start race on selected track
  const onStartRace = useCallback(() => {
    handleStart(selectedTrackId);
  }, [handleStart, selectedTrackId]);

  // Go back to selector
  const onBack = useCallback(() => {
    if (status === 'racing' || status === 'safety_car') {
      handleStop();
    }
    setView('selector');
    setSelectedTrackId('');
  }, [status, handleStop]);

  // If server already has a race running, sync to that
  const effectiveStatus = status;
  const effectiveTrackId = activeTrackId;

  // Tire strategy widget data
  const tireStats = useMemo(() => {
    const counts: Record<string, number> = { soft: 0, medium: 0, hard: 0, intermediate: 0, wet: 0 };
    positions.filter(p => p.status !== 'retired').forEach(p => { counts[p.tire] = (counts[p.tire] || 0) + 1; });
    return counts;
  }, [positions]);

  return (
    <div className="min-h-screen grid-bg">
      <div className="max-w-[1600px] mx-auto px-4 sm:px-6 py-6">
        <AnimatePresence mode="wait">
          {view === 'selector' ? (
            <motion.div
              key="selector"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0, y: -20 }}
              transition={{ duration: 0.3 }}
            >
              <TrackSelector onSelectTrack={onSelectTrack} />
            </motion.div>
          ) : (
            <motion.div
              key="race"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.3 }}
            >
              {/* Race Header */}
              <RaceHeader
                trackId={effectiveTrackId}
                currentLap={currentLap}
                totalLaps={totalLaps}
                status={effectiveStatus}
                weather={weather}
                fastestLap={fastestLap}
                isConnected={isConnected}
                onStart={onStartRace}
                onStop={handleStop}
                onBack={onBack}
              />

              {/* F1 22 Track Registry Info Strip */}
              {f1_22Track && (
                <motion.div
                  initial={{ opacity: 0, y: -6 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.15 }}
                  className="glass-card px-4 py-2 mb-4 flex flex-wrap items-center gap-x-6 gap-y-1.5"
                >
                  <span className="text-[9px] font-bold uppercase tracking-[0.2em]" style={{ color: 'var(--text-muted)' }}>
                    F1&apos;22 UDP Registry
                  </span>
                  <div className="flex items-center gap-1.5">
                    <span className="text-[9px] uppercase tracking-wider" style={{ color: 'var(--text-muted)' }}>TrackID</span>
                    <span className="font-mono text-[11px] font-black" style={{ color: 'var(--text-primary)' }}>
                      {f1_22TrackId >= 0 ? `#${f1_22TrackId}` : '—'}
                    </span>
                  </div>
                  <div className="flex items-center gap-1.5">
                    <span className="text-[9px] uppercase tracking-wider" style={{ color: 'var(--text-muted)' }}>Length</span>
                    <span className="font-mono text-[11px] font-black" style={{ color: 'var(--text-primary)' }}>
                      {f1_22Track.length_meters.toLocaleString()} m
                    </span>
                  </div>
                  <div className="flex items-center gap-1.5">
                    <span className="text-[9px] uppercase tracking-wider" style={{ color: 'var(--text-muted)' }}>Turns</span>
                    <span className="font-mono text-[11px] font-black" style={{ color: 'var(--text-primary)' }}>
                      {f1_22Track.total_turns}
                    </span>
                  </div>
                  <div className="flex items-center gap-1.5">
                    <span className="text-[9px] uppercase tracking-wider" style={{ color: 'var(--text-muted)' }}>Venue</span>
                    <span className="font-mono text-[11px] font-bold" style={{ color: 'var(--text-primary)' }}>
                      {f1_22Track.name}, {f1_22Track.country}
                    </span>
                  </div>
                  {isValidF1_22TrackId(f1_22TrackId) && (
                    <span className="ml-auto text-[9px] font-bold px-2 py-0.5 rounded bg-green-500/10 text-green-400 tracking-wider">
                      ✓ VERIFIED
                    </span>
                  )}
                </motion.div>
              )}

              {/* Main Race Layout */}
              <div className="grid grid-cols-1 lg:grid-cols-12 gap-4">
                {/* Left Column — Track Map + Telemetry */}
                <div className="lg:col-span-5 xl:col-span-5 space-y-4">
                  {/* SVG Track Map */}
                  <div className="aspect-square lg:aspect-[4/3]">
                    <TrackRenderer
                      trackId={effectiveTrackId}
                      positions={positions}
                      weather={weather}
                      status={effectiveStatus}
                      showCars={6}
                      className="w-full h-full"
                    />
                  </div>

                  {/* Tire Strategy Mini Widget */}
                  <motion.div
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.2 }}
                    className="glass-card p-3"
                  >
                    <div className="flex items-center gap-2 mb-2">
                      <span className="font-display font-bold text-[10px] tracking-wider uppercase" style={{ color: 'var(--text-secondary)' }}>
                        Tire Strategy
                      </span>
                    </div>
                    <div className="flex items-center gap-3 justify-center">
                      {(['soft', 'medium', 'hard', 'intermediate', 'wet'] as const).map(tire => {
                        const count = tireStats[tire] || 0;
                        if (count === 0 && (tire === 'intermediate' || tire === 'wet') && weather === 'dry') return null;
                        return (
                          <div key={tire} className="text-center tire-widget">
                            <div
                              className="w-8 h-8 rounded-full mx-auto mb-1 flex items-center justify-center text-[9px] font-black"
                              style={{
                                background: getTireColor(tire) + '20',
                                color: getTireColor(tire),
                                border: `2px solid ${getTireColor(tire)}`,
                              }}
                            >
                              {tire[0].toUpperCase()}
                            </div>
                            <span className="text-[9px]" style={{ color: 'var(--text-muted)' }}>
                              {count}
                            </span>
                          </div>
                        );
                      })}
                    </div>
                  </motion.div>

                  {/* Telemetry Panel (visible on larger screens) */}
                  <div className="hidden xl:block">
                    <TelemetryPanel driver={selectedDriverData} fastestLap={fastestLap} />
                  </div>
                </div>

                {/* Center Column — Timing Tower */}
                <div className="lg:col-span-4 xl:col-span-4">
                  <div className="h-[calc(100vh-200px)] lg:h-[calc(100vh-180px)] sticky top-20">
                    <TimingTower
                      positions={positions}
                      fastestLap={fastestLap}
                      previousPositions={previousPositions}
                      selectedDriver={selectedDriver}
                      onSelectDriver={setSelectedDriver}
                    />
                  </div>
                </div>

                {/* Right Column — Race Feed + Telemetry (on smaller screens) */}
                <div className="lg:col-span-3 xl:col-span-3 space-y-4">
                  {/* Telemetry Panel (visible on smaller-than-xl screens) */}
                  <div className="xl:hidden">
                    <TelemetryPanel driver={selectedDriverData} fastestLap={fastestLap} />
                  </div>

                  {/* Race Feed */}
                  <div className="h-[400px] lg:h-[calc(100vh-200px)]">
                    <RaceFeed events={events} currentLap={currentLap} />
                  </div>
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}
