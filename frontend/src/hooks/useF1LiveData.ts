// ═══════════════════════════════════════════════════════════════════════════════
// useF1LiveData.ts — Telemetry Reconstruction Engine (v2)
//
// Client-side hook for real-time live F1 session polling and
// authentic step-by-step historical replay mode.
//
// Key fixes over v1:
//   • Real gap/interval from /v1/intervals (no more Math.random)
//   • Actual lap counting from leader's laps data
//   • Year read from session config, not magic key ranges
//   • Jolpica fallback when OpenF1 fails or rate-limits
//   • Session state auto-resolver (pre-race/live/post-race)
// ═══════════════════════════════════════════════════════════════════════════════

'use client';

import { useState, useEffect, useRef } from 'react';
import {
  LivePosition,
  EnhancedRaceEvent,
  WeatherCondition,
} from '@/types';
import * as f1 from '@/lib/f1ApiService';

// ─── Replay Session Configuration ────────────────────────────────────────────

export interface ReplaySessionConfig {
  key: number;
  name: string;
  circuit: string;
  year: number;
  dateStart: string;
}

export const REPLAY_SESSIONS: ReplaySessionConfig[] = [
  { key: 9557, name: 'Hungarian Grand Prix', circuit: 'Hungaroring', year: 2024, dateStart: '2024-07-21T13:00:00Z' },
  { key: 9565, name: 'Belgian Grand Prix', circuit: 'Spa-Francorchamps', year: 2024, dateStart: '2024-07-28T13:00:00Z' },
  { key: 9549, name: 'British Grand Prix', circuit: 'Silverstone', year: 2024, dateStart: '2024-07-07T14:00:00Z' },
  { key: 9517, name: 'Monaco Grand Prix', circuit: 'Circuit de Monaco', year: 2024, dateStart: '2024-05-26T13:00:00Z' },
  { key: 9581, name: 'Italian Grand Prix', circuit: 'Autodromo Nazionale di Monza', year: 2024, dateStart: '2024-09-01T13:00:00Z' },
];

// ─── Hook ────────────────────────────────────────────────────────────────────

export function useF1LiveData(
  sessionKey: number,
  useMock: boolean,
  isPlaying: boolean,
  speed: number,
  sessionYear = 2026
) {
  // ── State ──────────────────────────────────────────────────────────────────
  const [positions, setPositions] = useState<LivePosition[]>([]);
  const [events, setEvents] = useState<EnhancedRaceEvent[]>([]);
  const [currentLap, setCurrentLap] = useState(0);
  const [totalLaps, setTotalLaps] = useState(70);
  const [status, setStatus] = useState<'not_started' | 'racing' | 'finished' | 'safety_car'>('racing');
  const [weather, setWeather] = useState<WeatherCondition>('dry');
  const [fastestLap, setFastestLap] = useState<{ driverId: string; time: string } | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [replayTime, setReplayTime] = useState<Date | null>(null);
  const [sessionInfo, setSessionInfo] = useState<f1.OpenF1Session | null>(null);
  const [autoMode, setAutoMode] = useState<'pre-race' | 'live' | 'post-race' | null>(null);

  // ── Refs (mutable caches, not re-render triggers) ──────────────────────────
  const driversCache = useRef<Record<number, f1.OpenF1Driver>>({});
  const allLaps = useRef<f1.OpenF1Lap[]>([]);
  const allStints = useRef<f1.OpenF1Stint[]>([]);
  const allPits = useRef<f1.OpenF1Pit[]>([]);
  const allRaceControl = useRef<f1.OpenF1RaceControl[]>([]);
  const eventIds = useRef<Set<string>>(new Set());

  // ── 1. Load Session Meta + Static Data ─────────────────────────────────────
  useEffect(() => {
    if (useMock) return;

    let cancelled = false;

    async function loadSession() {
      setIsLoading(true);
      try {
        // Fetch session info using the year from config (not a magic range)
        const sessions = await f1.getSessions(sessionYear);
        const match = sessions.find(s => s.session_key === sessionKey);

        if (match && !cancelled) {
          setSessionInfo(match);
          setReplayTime(new Date(match.date_start));
          setCurrentLap(1);
          setFastestLap(null);
          setEvents([]);
          eventIds.current.clear();

          // Compute auto session state
          const state = f1.resolveSessionState(match.date_start, match.date_end);
          setAutoMode(state);
        }

        // Fetch drivers
        const driversList = await f1.getDrivers(sessionKey);
        const cache: Record<number, f1.OpenF1Driver> = {};
        for (const d of driversList) {
          cache[d.driver_number] = d;
        }
        driversCache.current = cache;

        // Fetch static datasets in parallel
        const [laps, stints, pits, raceCtrl] = await Promise.all([
          f1.getLaps(sessionKey),
          f1.getStints(sessionKey),
          f1.getPits(sessionKey),
          f1.getRaceControl(sessionKey),
        ]);

        allLaps.current = laps;
        allStints.current = stints;
        allPits.current = pits;
        allRaceControl.current = raceCtrl;

        // Determine total laps from data
        if (laps.length > 0) {
          const maxLap = Math.max(...laps.map(l => l.lap_number));
          if (maxLap > 0) setTotalLaps(maxLap);
        }
      } catch (err) {
        console.error('[useF1LiveData] Failed to load session:', err);
      } finally {
        if (!cancelled) setIsLoading(false);
      }
    }

    loadSession();
    return () => { cancelled = true; };
  }, [sessionKey, sessionYear, useMock]);

  // ── 2. Playback Tick Timer ─────────────────────────────────────────────────
  useEffect(() => {
    if (useMock || !isPlaying || !replayTime || !sessionInfo) return;

    const interval = setInterval(() => {
      setReplayTime(prev => {
        if (!prev) return null;
        const next = new Date(prev.getTime() + 1000 * speed);
        const end = new Date(sessionInfo.date_end);
        if (next >= end) {
          setStatus('finished');
          clearInterval(interval);
          return end;
        }
        return next;
      });
    }, 1000);

    return () => clearInterval(interval);
  }, [isPlaying, replayTime, sessionInfo, speed, useMock]);

  // ── 3. Telemetry Reconstruction at Each Tick ───────────────────────────────
  useEffect(() => {
    if (useMock || !replayTime) return;

    let cancelled = false;

    async function reconstruct() {
      const activeTime = replayTime!.toISOString();
      const drivers = driversCache.current;

      if (Object.keys(drivers).length === 0) return;

      try {
        // A. Fetch positions + intervals in parallel
        const [rawPositions, rawIntervals] = await Promise.all([
          f1.getPositions(sessionKey, activeTime),
          f1.getIntervals(sessionKey, activeTime),
        ]);

        const latestPositions = f1.extractLatestPositions(rawPositions);
        const latestIntervals = f1.extractLatestIntervals(rawIntervals);

        // B. Fetch coordinates (5-second window)
        const windowStart = new Date(replayTime!.getTime() - 5000).toISOString();
        const rawLocations = await f1.getLocations(sessionKey, windowStart, activeTime);

        const latestLocations: Record<number, f1.OpenF1Location> = {};
        for (const loc of rawLocations) {
          latestLocations[loc.driver_number] = loc;
        }

        // C. Determine actual current lap from the leader's laps data
        const leaderNumber = Object.entries(latestPositions)
          .find(([, pos]) => pos === 1)?.[0];

        let computedLap = 1;
        if (leaderNumber) {
          const leaderLaps = allLaps.current
            .filter(l => l.driver_number === Number(leaderNumber))
            .sort((a, b) => a.lap_number - b.lap_number);

          // Find the last lap whose date_start is before the replay time
          if (leaderLaps.length > 0 && leaderLaps[0].date_start) {
            for (const lap of leaderLaps) {
              if (lap.date_start && new Date(lap.date_start) <= replayTime!) {
                computedLap = lap.lap_number;
              }
            }
          } else {
            // Fallback: use the total completed laps count
            computedLap = Math.max(1, leaderLaps.length);
          }
        }

        computedLap = Math.max(1, Math.min(totalLaps, computedLap));
        if (!cancelled) setCurrentLap(computedLap);

        // D. Build timing tower with REAL data
        const tower: LivePosition[] = Object.keys(drivers).map(numStr => {
          const num = Number(numStr);
          const drv = drivers[num];
          const pos = latestPositions[num] ?? 20;
          const loc = latestLocations[num];
          const intervalData = latestIntervals[num];

          // Lap data
          const driverLaps = allLaps.current.filter(
            l => l.driver_number === num && l.lap_number <= computedLap
          );
          const lastLap = driverLaps[driverLaps.length - 1];
          const bestLap = driverLaps.reduce<f1.OpenF1Lap | null>((best, curr) => {
            if (!curr.lap_duration) return best;
            if (!best?.lap_duration) return curr;
            return curr.lap_duration < best.lap_duration ? curr : best;
          }, null);

          // Tyre data
          const tyreInfo = f1.calculateTyreAge(allStints.current, computedLap, num);

          // Pit stops
          const pitCount = allPits.current.filter(
            p => p.driver_number === num && p.lap_number <= computedLap
          ).length;
          const isPitting = allPits.current.some(
            p => p.driver_number === num && p.lap_number === computedLap
          );

          // DRS detection
          const currentLapInfo = allLaps.current.find(
            l => l.driver_number === num && l.lap_number === computedLap
          );

          return {
            position: pos,
            driverId: drv.full_name.toLowerCase().replace(/\s/g, '_'),
            driverName: drv.full_name,
            driverCode: drv.name_acronym,
            team: drv.team_name,
            teamColor: `#${drv.team_color}`,
            gap: f1.formatGap(intervalData?.gap_to_leader ?? null, pos === 1),
            interval: f1.formatGap(intervalData?.interval ?? null, pos === 1),
            lastLapTime: lastLap ? f1.formatLapDuration(lastLap.lap_duration) : '-',
            bestLapTime: bestLap ? f1.formatLapDuration(bestLap.lap_duration) : '-',
            tire: (['soft', 'medium', 'hard', 'intermediate', 'wet'].includes(tyreInfo.compound)
              ? tyreInfo.compound
              : 'medium') as LivePosition['tire'],
            tireAge: Math.max(1, tyreInfo.age),
            pitStops: pitCount,
            status: isPitting ? 'pit' : 'racing',
            drs: currentLapInfo?.i2_speed ? currentLapInfo.i2_speed > 310 : false,
            sector1: lastLap ? (lastLap.duration_sector_1 !== null ? lastLap.duration_sector_1.toFixed(3) : '-') : '-',
            sector2: lastLap ? (lastLap.duration_sector_2 !== null ? lastLap.duration_sector_2.toFixed(3) : '-') : '-',
            sector3: lastLap ? (lastLap.duration_sector_3 !== null ? lastLap.duration_sector_3.toFixed(3) : '-') : '-',
            x: loc?.x,
            y: loc?.y,
          };
        }).sort((a, b) => a.position - b.position);

        if (!cancelled) {
          setPositions(tower);

          // E. Fastest lap
          const overallBest = allLaps.current
            .filter(l => l.lap_number <= computedLap && l.lap_duration !== null)
            .reduce<f1.OpenF1Lap | null>((best, curr) => {
              if (!curr.lap_duration) return best;
              if (!best?.lap_duration) return curr;
              return curr.lap_duration < best.lap_duration ? curr : best;
            }, null);

          if (overallBest?.lap_duration) {
            const drv = drivers[overallBest.driver_number];
            if (drv) {
              setFastestLap({
                driverId: drv.full_name.toLowerCase().replace(/\s/g, '_'),
                time: f1.formatLapDuration(overallBest.lap_duration),
              });
            }
          }

          // F. Race control events
          const windowMessages = allRaceControl.current.filter(msg => {
            const msgDate = new Date(msg.date);
            return msgDate <= replayTime! && msgDate >= new Date(replayTime!.getTime() - 1000 * speed);
          });

          for (const msg of windowMessages) {
            const eventId = `${msg.date}-${msg.message.substring(0, 20)}`;
            if (eventIds.current.has(eventId)) continue;
            eventIds.current.add(eventId);

            let eventType: EnhancedRaceEvent['type'] = 'weather';
            if (msg.flag === 'YELLOW' || msg.flag === 'DOUBLE YELLOW') eventType = 'yellow_flag';
            else if (msg.flag === 'GREEN' || msg.flag === 'CLEAR') eventType = 'green_flag';
            else if (msg.flag === 'RED') eventType = 'red_flag';
            else if (msg.message.toLowerCase().includes('safety car')) eventType = 'safety_car';
            else if (msg.message.toLowerCase().includes('vsc')) eventType = 'vsc';

            setEvents(prev => [
              {
                id: eventId,
                type: eventType,
                message: msg.message,
                lap: msg.lap_number || computedLap,
                timestamp: new Date(msg.date).getTime(),
              },
              ...prev,
            ].slice(0, 50));
          }
        }
      } catch (err) {
        console.error('[useF1LiveData] Telemetry reconstruction error:', err);

        // ── Jolpica Fallback ─────────────────────────────────────────────
        if (!cancelled) {
          console.warn('[useF1LiveData] Attempting Jolpica fallback...');
          try {
            const jolpicaResults = await f1.getJolpicaRaceResults(sessionYear);
            if (jolpicaResults.length > 0) {
              const fallbackTower: LivePosition[] = jolpicaResults.map((r, i) => ({
                position: parseInt(r.position) || i + 1,
                driverId: r.Driver.driverId,
                driverName: `${r.Driver.givenName} ${r.Driver.familyName}`,
                driverCode: r.Driver.code || r.Driver.driverId.substring(0, 3).toUpperCase(),
                team: r.Constructor.name,
                teamColor: '#666666',
                gap: r.Time?.time ? `+${r.Time.time}` : r.status === 'Finished' ? 'LEADER' : r.status,
                interval: '-',
                lastLapTime: r.FastestLap?.Time?.time ?? '-',
                bestLapTime: r.FastestLap?.Time?.time ?? '-',
                tire: 'medium' as const,
                tireAge: 1,
                pitStops: 0,
                status: r.status === 'Finished' ? 'racing' as const : 'retired' as const,
                drs: false,
                sector1: '-',
                sector2: '-',
                sector3: '-',
              }));
              setPositions(fallbackTower);
              setStatus('finished');
              console.info('[useF1LiveData] Jolpica fallback loaded successfully');
            }
          } catch (fallbackErr) {
            console.error('[useF1LiveData] Jolpica fallback also failed:', fallbackErr);
          }
        }
      }
    }

    reconstruct();
    return () => { cancelled = true; };
  }, [replayTime, sessionKey, useMock, sessionYear, speed, totalLaps]);

  return {
    positions,
    events,
    currentLap,
    totalLaps,
    status,
    weather,
    fastestLap,
    isLoading,
    replayTime,
    sessionInfo,
    autoMode,
  };
}
