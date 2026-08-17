'use client';

import { useState, useEffect, useCallback, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useSocket } from '@/context/SocketContext';
import {
  RaceFeedMode,
  LivePosition,
  EnhancedRaceEvent,
  WeatherCondition,
} from '@/types';
import {
  mockFP1Results,
  mockFP2Results,
  mockFP3Results,
  mockQualifyingResults,
  mockRaceEvents,
  mockPostRaceResults,
  mockPodiumFinishers,
  mockNextRace,
  generateMockLivePositions,
  generatePodiumFinishers,
} from '@/data/mockRaceFeedData';
import { startRace, stopRace, getNextRace } from '@/lib/api';
import { useF1LiveData, REPLAY_SESSIONS } from '@/hooks/useF1LiveData';
import PreRaceView from './PreRaceView';
import LiveRaceView from './LiveRaceView';
import PostRaceView from './PostRaceView';
import {
  Radio, Eye, EyeOff, Clock, Activity, Trophy,
} from 'lucide-react';

export default function RaceFeedPage() {
  // ── State ──────────────────────────────────────────────────────────────────
  const { socket, isConnected } = useSocket();
  const [mode, setMode] = useState<RaceFeedMode>('pre-race');
  const [forcedMode, setForcedMode] = useState<RaceFeedMode | null>(null);

  // Live race data
  const [positions, setPositions] = useState<LivePosition[]>([]);
  const [previousPositions, setPreviousPositions] = useState<Record<string, number>>({});
  const [currentLap, setCurrentLap] = useState(0);
  const [totalLaps, setTotalLaps] = useState(57);
  const [trackId, setTrackId] = useState('spa');
  const [raceName, setRaceName] = useState('Belgian Grand Prix');
  const [status, setStatus] = useState('not_started');
  const [weather, setWeather] = useState<WeatherCondition>('dry');
  const [fastestLap, setFastestLap] = useState<{ driverId: string; time: string } | null>(null);
  const [events, setEvents] = useState<EnhancedRaceEvent[]>([]);

  const eventIdSet = useRef(new Set<string>());

  // ── Telemetry & Replay mode state overrides ───────────────────────────────
  const [modeSelection, setModeSelection] = useState<'mock' | 'replay' | 'live'>('replay'); // Default to authentic Replay mode!
  const [selectedSessionKey, setSelectedSessionKey] = useState<number>(9557); // Hungary 2024 GP default
  const [isReplayPlaying, setIsReplayPlaying] = useState(false);
  const [replaySpeedMultiplier, setReplaySpeedMultiplier] = useState(10); // 10x default speed
  const [replaySessionsList, setReplaySessionsList] = useState<any[]>(REPLAY_SESSIONS);

  useEffect(() => {
    async function load2026Sessions() {
      try {
        const response = await fetch('https://api.openf1.org/v1/sessions?year=2026&session_name=Race');
        if (response.ok) {
          const sessions = await response.json();
          const formatted = sessions.map((s: any) => ({
            key: s.session_key,
            name: `${s.circuit_short_name} Grand Prix`,
            circuit: s.location,
            year: 2026,
            dateStart: s.date_start,
          }));
          
          setReplaySessionsList(prev => {
            const combined = [...formatted, ...REPLAY_SESSIONS];
            const unique = Array.from(new Map(combined.map(item => [item.key, item])).values());
            return unique;
          });

          // Automatically select the latest 2026 session if available
          if (formatted.length > 0) {
            setSelectedSessionKey(formatted[formatted.length - 1].key);
          }
        }
      } catch (e) {
        console.error('Failed to load dynamic 2026 sessions:', e);
      }
    }

    load2026Sessions();
  }, []);

  const useMockData = modeSelection === 'mock';

  // Resolve year from the selected session config (no more magic key ranges)
  const selectedSessionYear = replaySessionsList.find(
    (s: any) => s.key === selectedSessionKey
  )?.year ?? 2026;

  // Instantiate the F1 Telemetry Reconstruction Engine
  const telemetryData = useF1LiveData(
    selectedSessionKey,
    modeSelection !== 'replay',
    isReplayPlaying,
    replaySpeedMultiplier,
    selectedSessionYear
  );

  // Dynamic next race state
  const [nextRaceData, setNextRaceData] = useState<any>(mockNextRace);

  useEffect(() => {
    if (useMockData) {
      setNextRaceData(mockNextRace);
      setTrackId('hungaroring');
      setRaceName('Hungarian Grand Prix');
      return;
    }

    async function fetchNextRace() {
      try {
        const nextRace = await getNextRace();
        if (nextRace) {
          const raceStart = new Date(`${nextRace.date}T${nextRace.time || '13:00:00Z'}`);
          
          const enrichedNextRace = {
            raceName: nextRace.raceName,
            circuitName: nextRace.circuitName,
            country: nextRace.country,
            countryFlag: nextRace.flag || '🏁',
            locality: nextRace.locality,
            trackId: nextRace.circuitId,
            raceStart: nextRace.sessions?.race || raceStart,
            timezone: nextRace.timezone || 'UTC',
            sessions: nextRace.sessions,
          };

          setNextRaceData(enrichedNextRace);
          setTrackId(nextRace.circuitId);
          setRaceName(nextRace.raceName);
        }
      } catch (err) {
        console.error('Failed to fetch next race:', err);
        setNextRaceData(mockNextRace);
      }
    }

    fetchNextRace();
  }, [useMockData]);

  // Compute effective mode (forced preview OR auto-detected)
  const effectiveMode = modeSelection === 'replay' ? 'live' : (forcedMode || mode);

  // Override standard states with reconstructed real telemetry data if in replay mode
  const activePositions = modeSelection === 'replay' ? telemetryData.positions : positions;
  const activeEvents = modeSelection === 'replay' ? telemetryData.events : events;
  const activeCurrentLap = modeSelection === 'replay' ? telemetryData.currentLap : currentLap;
  const activeTotalLaps = modeSelection === 'replay' ? telemetryData.totalLaps : totalLaps;
  const activeStatus = modeSelection === 'replay' ? telemetryData.status : status;
  const activeWeather = modeSelection === 'replay' ? telemetryData.weather : weather;
  const activeFastestLap = modeSelection === 'replay' ? telemetryData.fastestLap : fastestLap;
  const activeTrackId = modeSelection === 'replay' ? (telemetryData.sessionInfo?.circuit_short_name?.toLowerCase()?.includes('monza') ? 'monza' : telemetryData.sessionInfo?.circuit_short_name?.toLowerCase()?.includes('hungaro') ? 'hungaroring' : telemetryData.sessionInfo?.circuit_short_name?.toLowerCase()?.includes('spa') ? 'spa' : telemetryData.sessionInfo?.circuit_short_name?.toLowerCase()?.includes('monaco') ? 'monaco' : 'spa') : trackId;
  const activeRaceName = modeSelection === 'replay' ? telemetryData.sessionInfo?.circuit_short_name + ' Grand Prix' : raceName;

  // ── Socket Event Listeners ─────────────────────────────────────────────────
  useEffect(() => {
    if (!socket || useMockData) return;

    const handleRaceState = (state: any) => {
      if (state.isActive && state.status === 'racing') {
        setMode('live');
      } else if (state.status === 'finished') {
        setMode('post-race');
      } else {
        setMode('pre-race');
      }
      setPositions(state.positions || []);
      setCurrentLap(state.currentLap || 0);
      setTotalLaps(state.totalLaps || 57);
      setTrackId(state.trackId || 'spa');
      setRaceName(state.raceName || 'Grand Prix');
      setStatus(state.status || 'not_started');
      setWeather(state.weather || 'dry');
      setFastestLap(state.fastestLap || null);
    };

    const handleLapUpdate = (data: any) => {
      // Store previous positions for change detection
      setPreviousPositions(prev => {
        const newPrev: Record<string, number> = { ...prev };
        positions.forEach(p => { newPrev[p.driverId] = p.position; });
        return newPrev;
      });

      setPositions(data.positions || []);
      setCurrentLap(data.currentLap || 0);
      setTotalLaps(data.totalLaps || 57);
      setFastestLap(data.fastestLap || null);
      setStatus(data.status || 'racing');
      setWeather(data.weather || 'dry');
      setTrackId(data.trackId || trackId);
      setMode('live');
      setForcedMode(null);
    };

    const handleRaceStart = (data: any) => {
      setMode('live');
      setForcedMode(null);
      setRaceName(data.raceName || 'Grand Prix');
      setTrackId(data.trackId || 'spa');
      setTotalLaps(data.totalLaps || 57);
      setPositions(data.positions || []);
      setWeather(data.weather || 'dry');
      setCurrentLap(0);
      setEvents([]);
      eventIdSet.current.clear();
    };

    const handleRaceFinish = () => {
      setMode('post-race');
      setForcedMode(null);
      setStatus('finished');
    };

    const handleRaceStopped = () => {
      setMode('pre-race');
      setForcedMode(null);
      setStatus('not_started');
    };

    const handleWeatherChange = (data: any) => {
      setWeather(data.weather || 'dry');
      addEvent({
        id: `weather-${Date.now()}`,
        type: 'weather',
        message: `Weather changed to ${data.weather === 'dry' ? 'Dry' : data.weather === 'light_rain' ? 'Light Rain' : 'Heavy Rain'}`,
        lap: data.lap || currentLap,
        timestamp: Date.now(),
      });
    };

    const handleSafetyCar = (data: any) => {
      setStatus('safety_car');
      addEvent({
        id: `sc-${Date.now()}`,
        type: 'safety_car',
        message: '🟡 SAFETY CAR DEPLOYED',
        lap: data.lap || currentLap,
        timestamp: Date.now(),
      });
    };

    const handleGreenFlag = (data: any) => {
      setStatus('racing');
      addEvent({
        id: `green-${Date.now()}`,
        type: 'green_flag',
        message: '🟢 Safety Car in — RACING RESUMES',
        lap: data.lap || currentLap,
        timestamp: Date.now(),
      });
    };

    const handlePitStop = (data: any) => {
      addEvent({
        id: `pit-${Date.now()}-${data.driverId}`,
        type: 'pit',
        message: `🔧 ${data.driverName?.split(' ').pop()?.substring(0, 3).toUpperCase()} pits — new ${data.newTire?.toUpperCase()} tyres`,
        lap: data.lap || currentLap,
        timestamp: Date.now(),
        driverId: data.driverId,
      });
    };

    const handleRetirement = (data: any) => {
      addEvent({
        id: `ret-${Date.now()}-${data.driverId}`,
        type: 'retirement',
        message: `❌ ${data.driverName?.split(' ').pop()?.substring(0, 3).toUpperCase()} has retired from the race`,
        lap: data.lap || currentLap,
        timestamp: Date.now(),
        driverId: data.driverId,
      });
    };

    const handleRaceEvent = (data: EnhancedRaceEvent) => {
      addEvent(data);
    };

    socket.on('race_state', handleRaceState);
    socket.on('lap_update', handleLapUpdate);
    socket.on('race_start', handleRaceStart);
    socket.on('race_finish', handleRaceFinish);
    socket.on('race_stopped', handleRaceStopped);
    socket.on('weather_change', handleWeatherChange);
    socket.on('safety_car', handleSafetyCar);
    socket.on('green_flag', handleGreenFlag);
    socket.on('pit_stop', handlePitStop);
    socket.on('retirement', handleRetirement);
    socket.on('race_event', handleRaceEvent);

    return () => {
      socket.off('race_state', handleRaceState);
      socket.off('lap_update', handleLapUpdate);
      socket.off('race_start', handleRaceStart);
      socket.off('race_finish', handleRaceFinish);
      socket.off('race_stopped', handleRaceStopped);
      socket.off('weather_change', handleWeatherChange);
      socket.off('safety_car', handleSafetyCar);
      socket.off('green_flag', handleGreenFlag);
      socket.off('pit_stop', handlePitStop);
      socket.off('retirement', handleRetirement);
      socket.off('race_event', handleRaceEvent);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [socket, useMockData]);

  const addEvent = useCallback((event: EnhancedRaceEvent) => {
    if (eventIdSet.current.has(event.id)) return;
    eventIdSet.current.add(event.id);
    setEvents(prev => [event, ...prev].slice(0, 100));
  }, []);

  // ── Mock Data Setup ────────────────────────────────────────────────────────
  useEffect(() => {
    if (useMockData && effectiveMode === 'live') {
      setPositions(generateMockLivePositions(25));
      setCurrentLap(25);
      setTotalLaps(57);
      setTrackId('spa');
      setRaceName('Belgian Grand Prix');
      setStatus('racing');
      setWeather('dry');
      setFastestLap({ driverId: 'lando_norris', time: '1:30.112' });
      setEvents(mockRaceEvents);
    }
  }, [useMockData, effectiveMode]);

  // ── Actions ────────────────────────────────────────────────────────────────
  const handleStartRace = useCallback(async () => {
    if (useMockData) {
      setForcedMode('live');
      return;
    }
    try {
      await startRace(trackId);
    } catch (err) {
      console.error('Failed to start race:', err);
    }
  }, [useMockData, trackId]);

  const handleStopRace = useCallback(async () => {
    if (useMockData) {
      setForcedMode('pre-race');
      return;
    }
    try {
      await stopRace();
    } catch (err) {
      console.error('Failed to stop race:', err);
    }
  }, [useMockData]);

  const handleBack = useCallback(() => {
    setForcedMode('pre-race');
  }, []);

  // ── Mock post-race data ────────────────────────────────────────────────────
  const postRacePodium = useMockData ? mockPodiumFinishers : generatePodiumFinishers(
    positions.filter(p => p.status !== 'retired').map((p, i) => ({
      position: i + 1,
      driverId: p.driverId,
      driverName: p.driverName,
      driverCode: p.driverCode,
      team: p.team,
      teamColor: p.teamColor,
      lapsCompleted: totalLaps,
      totalTime: i === 0 ? p.bestLapTime : p.gap,
      gap: p.gap,
      pitStops: p.pitStops,
      fastestLap: p.bestLapTime,
      fastestLapRank: i + 1,
      gridPosition: i + 1,
      positionsGained: 0,
      status: 'finished' as const,
      points: [25, 18, 15, 12, 10, 8, 6, 4, 2, 1][i] || 0,
    }))
  );

  const postRaceResults = useMockData ? mockPostRaceResults : positions.map((p, i) => ({
    position: p.status === 'retired' ? 20 : i + 1,
    driverId: p.driverId,
    driverName: p.driverName,
    driverCode: p.driverCode,
    team: p.team,
    teamColor: p.teamColor,
    lapsCompleted: p.status === 'retired' ? currentLap - 5 : totalLaps,
    totalTime: p.status === 'retired' ? 'DNF' : i === 0 ? p.bestLapTime : p.gap,
    gap: p.gap,
    pitStops: p.pitStops,
    fastestLap: p.bestLapTime,
    fastestLapRank: i + 1,
    gridPosition: i + 1,
    positionsGained: 0,
    status: (p.status === 'retired' ? 'dnf' : 'finished') as 'finished' | 'dnf' | 'dns',
    points: p.status === 'retired' ? 0 : ([25, 18, 15, 12, 10, 8, 6, 4, 2, 1][i] || 0),
  }));

  return (
    <div className="min-h-screen grid-bg">
      <div className="max-w-[1800px] mx-auto px-4 sm:px-6 py-6">
        {/* Top Controls Bar */}
        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          className="flex flex-col sm:flex-row items-start sm:items-center gap-3 mb-6"
        >
          {/* Title */}
          <div className="flex items-center gap-2">
            <Radio size={16} className="text-[#E10600]" />
            <h1 className="text-xl font-display font-black tracking-wider" style={{ color: 'var(--text-primary)' }}>
              LIVE RACE FEED
            </h1>
            {effectiveMode === 'live' && (
              <span className="w-2 h-2 rounded-full bg-[#E10600] live-pulse" />
            )}
          </div>

          <div className="flex items-center gap-3 sm:ml-auto">
            {/* Mode selection buttons */}
            <div className="flex gap-1 bg-surface border border-default p-0.5 rounded-xl">
              {[
                { id: 'mock' as const, label: 'Mock Preview', icon: Eye },
                { id: 'replay' as const, label: 'Historical Replay', icon: Activity },
                { id: 'live' as const, label: 'Live API Feed', icon: Radio },
              ].map(({ id, label, icon: Icon }) => (
                <button
                  key={id}
                  onClick={() => {
                    setModeSelection(id);
                    if (id === 'replay') {
                      setMode('live');
                      setForcedMode(null);
                    }
                  }}
                  className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-[10px] font-bold uppercase tracking-wider transition-all ${
                    modeSelection === id
                      ? 'bg-[#E10600] text-white shadow-lg shadow-red-500/10'
                      : 'hover:bg-[var(--surface-hover)]'
                  }`}
                  style={{ color: modeSelection === id ? '#fff' : 'var(--text-secondary)' }}
                >
                  <Icon size={10} />
                  {label}
                </button>
              ))}
            </div>

            {/* State Preview Buttons (only in mock mode) */}
            {useMockData && (
              <div className="flex gap-1">
                {[
                  { id: 'pre-race' as const, label: 'Pre-Race', icon: Clock },
                  { id: 'live' as const, label: 'Live', icon: Activity },
                  { id: 'post-race' as const, label: 'Post-Race', icon: Trophy },
                ].map(({ id, label, icon: Icon }) => (
                  <button
                    key={id}
                    onClick={() => setForcedMode(id)}
                    className={`flex items-center gap-1 px-3 py-1.5 rounded-lg text-[10px] font-bold uppercase tracking-wider transition-all ${
                      effectiveMode === id
                        ? 'bg-[#E10600] text-white shadow-lg shadow-red-500/20'
                        : ''
                    }`}
                    style={{
                      color: effectiveMode === id ? '#fff' : 'var(--text-secondary)',
                      background: effectiveMode === id ? undefined : 'var(--surface)',
                      border: '1px solid var(--border)',
                    }}
                  >
                    <Icon size={10} />
                    {label}
                  </button>
                ))}
              </div>
            )}
          </div>
        </motion.div>

        {/* Replay Mode Playback Control Panel */}
        {modeSelection === 'replay' && (
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            className="glass-card p-4 flex flex-wrap items-center gap-4 mb-6 border border-[var(--border-accent)]"
          >
            {/* Session Selector */}
            <div className="flex flex-col gap-1 min-w-[240px]">
              <span className="text-[9px] font-bold text-themed-muted uppercase tracking-wider">Select Replay Session</span>
              <select
                value={selectedSessionKey}
                onChange={(e) => setSelectedSessionKey(Number(e.target.value))}
                className="bg-[var(--surface)] text-themed border border-[var(--border)] rounded-xl px-3 py-2 text-xs outline-none focus:border-[#E10600]"
              >
                {replaySessionsList.map(s => (
                  <option key={s.key} value={s.key}>
                    {s.year} {s.name} — {s.circuit}
                  </option>
                ))}
              </select>
            </div>

            {/* Play/Pause Button */}
            <div className="flex items-center pt-4 sm:pt-0">
              <button
                onClick={() => setIsReplayPlaying(!isReplayPlaying)}
                className={`px-5 py-2 rounded-xl text-xs font-black uppercase tracking-wider transition-all duration-200 ${
                  isReplayPlaying
                    ? 'bg-amber-500 text-white shadow-lg shadow-amber-500/20'
                    : 'bg-[#E10600] text-white shadow-lg shadow-red-500/20'
                }`}
              >
                {isReplayPlaying ? '⏸ Pause' : '▶ Play Replay'}
              </button>
            </div>

            {/* Replay Speed Multiplier */}
            <div className="flex flex-col gap-1">
              <span className="text-[9px] font-bold text-themed-muted uppercase tracking-wider">Playback Speed</span>
              <div className="flex gap-1 bg-[var(--surface)] border border-[var(--border)] p-0.5 rounded-xl">
                {[1, 5, 10, 30, 60].map(s => (
                  <button
                    key={s}
                    onClick={() => setReplaySpeedMultiplier(s)}
                    className={`px-2.5 py-1 text-[10px] font-bold rounded-lg transition-all ${
                      replaySpeedMultiplier === s
                        ? 'bg-[#E10600] text-white'
                        : 'text-themed-secondary hover:bg-[var(--surface-hover)]'
                    }`}
                  >
                    {s}x
                  </button>
                ))}
              </div>
            </div>

            {/* Loader indicator */}
            {telemetryData.isLoading && (
              <div className="flex items-center gap-2 text-xs text-amber-400">
                <span className="w-2.5 h-2.5 border-2 border-amber-400 border-t-transparent rounded-full animate-spin" />
                <span>Reconstructing telemetry...</span>
              </div>
            )}

            {/* Clock / Session Progress */}
            {telemetryData.replayTime && (
              <div className="ml-auto flex items-center gap-4 bg-[var(--surface)] border border-[var(--border)] px-4 py-2 rounded-xl">
                <div className="text-right">
                  <span className="text-[9px] font-bold text-themed-muted uppercase tracking-wider block">Session Progress Time</span>
                  <span className="text-xs font-mono font-black text-[#E10600]">
                    {telemetryData.replayTime.toLocaleTimeString([], { hour12: false })}
                  </span>
                </div>
              </div>
            )}
          </motion.div>
        )}

        {/* View Content */}
        <AnimatePresence mode="wait">
          {effectiveMode === 'pre-race' && (
            <motion.div
              key="pre-race"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              transition={{ duration: 0.3 }}
            >
              <PreRaceView
                raceName={nextRaceData.raceName}
                circuitName={nextRaceData.circuitName}
                country={nextRaceData.country}
                countryFlag={nextRaceData.countryFlag}
                raceStart={nextRaceData.raceStart}
                sessions={nextRaceData.sessions}
                timezone={nextRaceData.timezone}
                fpResults={{ fp1: mockFP1Results, fp2: mockFP2Results, fp3: mockFP3Results }}
                qualifyingResults={mockQualifyingResults}
              />
            </motion.div>
          )}

          {effectiveMode === 'live' && (
            <motion.div
              key="live"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              transition={{ duration: 0.3 }}
            >
               <LiveRaceView
                trackId={activeTrackId}
                currentLap={activeCurrentLap}
                totalLaps={activeTotalLaps}
                status={activeStatus}
                weather={activeWeather}
                positions={activePositions}
                fastestLap={activeFastestLap}
                previousPositions={previousPositions}
                events={activeEvents}
                isConnected={useMockData || isConnected}
                onStart={handleStartRace}
                onStop={handleStopRace}
                onBack={handleBack}
              />
            </motion.div>
          )}

          {effectiveMode === 'post-race' && (
            <motion.div
              key="post-race"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              transition={{ duration: 0.3 }}
            >
              <PostRaceView
                raceName={activeRaceName}
                trackId={activeTrackId}
                podium={postRacePodium}
                results={postRaceResults}
                totalLaps={activeTotalLaps}
              />
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}
