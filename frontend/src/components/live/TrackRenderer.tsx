'use client';

import { useEffect, useRef, useMemo, useState } from 'react';
import { getTrackPath, TrackPathData } from '@/data/trackPaths';
import { getTrackById } from '@/data/trackData';
import { LivePosition } from '@/types';

// ─── Module-level animation constants ────────────────────────────────────────
/** Fraction of lap length separating adjacent cars on the track map */
const GAP_PER_POSITION = 0.0045;
/** Where the leader starts on the track (just past start/finish line) */
const LEADER_PROGRESS_INIT = 0.06;
/** Base lap fraction per second during racing (≈62 second visual lap) */
const SPEED_RACING = 0.016;
/** Reduced speed under safety car */
const SPEED_SC = 0.009;

// ─── Helper: point along SVG path ────────────────────────────────────────────
function getPointAtPercent(pathEl: SVGPathElement, percent: number): { x: number; y: number } {
  const totalLength = pathEl.getTotalLength();
  const point = pathEl.getPointAtLength(totalLength * Math.max(0, Math.min(1, percent)));
  return { x: point.x, y: point.y };
}

interface TrackRendererProps {
  trackId: string;
  positions: LivePosition[];
  weather?: 'dry' | 'light_rain' | 'heavy_rain';
  status?: string;
  showCars?: number;
  className?: string;
}

export default function TrackRenderer({
  trackId,
  positions,
  weather = 'dry',
  status,
  showCars = 20,
  className = '',
}: TrackRendererProps) {
  const [pathElement, setPathElement] = useState<SVGPathElement | null>(null);
  const [sectorPoints, setSectorPoints] = useState<Array<{ x: number; y: number }>>([]);
  const [carPositions, setCarPositions] = useState<Array<{
    x: number; y: number; driverId: string; teamColor: string;
    code: string; position: number; isPitting: boolean;
  }>>([]);

  const animFrameRef = useRef<number>(0);
  /** Smooth animation progress for every driverId (0–1, fraction of lap) */
  const progressRef = useRef<Map<string, number>>(new Map());

  // Shadow refs so the animation loop can read latest values without being a dep
  const positionsRef = useRef<LivePosition[]>([]);
  const statusRef = useRef<string | undefined>(status);

  useEffect(() => { positionsRef.current = positions; }, [positions]);
  useEffect(() => { statusRef.current = status; }, [status]);

  const trackPath = useMemo(() => getTrackPath(trackId), [trackId]);
  const trackData = useMemo(() => getTrackById(trackId), [trackId]);

  // ── Sector markers ────────────────────────────────────────────────────────
  useEffect(() => {
    if (pathElement && trackPath) {
      setSectorPoints(trackPath.sectorSplits.map(split => getPointAtPercent(pathElement, split)));
    } else {
      setSectorPoints([]);
    }
  }, [trackPath, pathElement]);

  // ── Position SYNC effect ──────────────────────────────────────────────────
  // Runs whenever the live leaderboard changes (every ~2 s from socket).
  // Smoothly nudges each car's visual progress toward the correct race order
  // so the track map stays 1:1 with the TimingTower without teleporting dots.
  useEffect(() => {
    if (positions.length === 0) return;

    const sorted = positions
      .filter(p => p.status !== 'retired')
      .sort((a, b) => a.position - b.position);
    if (sorted.length === 0) return;

    // Anchor from the current leader's progress
    const leaderId = sorted[0].driverId;
    const leaderProgress = progressRef.current.get(leaderId) ?? LEADER_PROGRESS_INIT;

    sorted.forEach((driver, idx) => {
      const target = (leaderProgress - idx * GAP_PER_POSITION + 1) % 1;
      const current = progressRef.current.get(driver.driverId);

      if (current === undefined) {
        // First time seeing this driver — place them at the correct spot
        progressRef.current.set(driver.driverId, target);
      } else {
        // Signed difference accounting for track wrap (−0.5 to +0.5)
        const diff = ((target - current) + 1.5) % 1 - 0.5;
        // Lerp 22% toward target — smooth enough to avoid jerks, fast enough to sync
        progressRef.current.set(driver.driverId, (current + diff * 0.22 + 1) % 1);
      }
    });

    // Evict retired drivers from the progress map
    const activeIds = new Set(sorted.map(d => d.driverId));
    for (const id of Array.from(progressRef.current.keys())) {
      if (!activeIds.has(id)) progressRef.current.delete(id);
    }
  }, [positions]); // ← runs on every timing tower update

  // ── Continuous ANIMATION loop ─────────────────────────────────────────────
  // Depends only on stable values (trackPath, pathElement).
  // Reads live data from refs — NEVER restarted by socket updates.
  useEffect(() => {
    if (!pathElement || !trackPath) return;

    let lastTime = performance.now();

    const animate = (time: number) => {
      // Cap delta at 50 ms to avoid huge jumps after tab-switch / focus loss
      const delta = Math.min((time - lastTime) / 1000, 0.05);
      lastTime = time;

      const currentPositions = positionsRef.current;
      if (currentPositions.length === 0) {
        animFrameRef.current = requestAnimationFrame(animate);
        return;
      }

      const isSafetyCar = statusRef.current === 'safety_car';
      const baseSpeed = isSafetyCar ? SPEED_SC : SPEED_RACING;

      const activeDrivers = currentPositions
        .filter(p => p.status !== 'retired')
        .sort((a, b) => a.position - b.position);

      const newPositions = activeDrivers.map((driver, idx) => {
        const fallback = (LEADER_PROGRESS_INIT - idx * GAP_PER_POSITION + 1) % 1;
        let progress = progressRef.current.get(driver.driverId) ?? fallback;

        const speedAtPos = getSpeedAtPercent(trackPath.speedProfile, progress);
        // Each subsequent position is 0.2% slower — maintains visual gap naturally
        const positionFactor = Math.max(0.6, 1 - idx * 0.002);
        const pitModifier = driver.status === 'pit' ? 0.2 : 1;

        progress += baseSpeed * speedAtPos * positionFactor * pitModifier * delta;
        if (progress >= 1) progress -= 1;

        // Visual ordering clamp: prevent any car from visually overtaking the one ahead
        if (idx > 0) {
          const aheadId = activeDrivers[idx - 1].driverId;
          const aheadProgress = progressRef.current.get(aheadId) ?? progress;
          const diff = (aheadProgress - progress + 1) % 1;
          if (diff < 0.002) {
            progress = (aheadProgress - 0.002 + 1) % 1;
          }
        }

        progressRef.current.set(driver.driverId, progress);

        const point = getPointAtPercent(pathElement, progress);
        if (!isFinite(point.x) || !isFinite(point.y)) return null;

        const code = driver.driverCode
          || driver.driverName.split(' ').pop()?.substring(0, 3).toUpperCase()
          || '???';

        return {
          x: point.x,
          y: point.y,
          driverId: driver.driverId,
          teamColor: driver.teamColor || '#888888',
          code,
          position: driver.position,
          isPitting: driver.status === 'pit',
        };
      }).filter((p): p is NonNullable<typeof p> => p !== null);

      setCarPositions(newPositions);
      animFrameRef.current = requestAnimationFrame(animate);
    };

    animFrameRef.current = requestAnimationFrame(animate);
    return () => cancelAnimationFrame(animFrameRef.current);
  }, [trackPath, pathElement]); // ← stable — never restarts due to position updates

  if (!trackPath || !trackData) {
    return (
      <div className={`flex items-center justify-center h-full ${className}`}>
        <p className="text-themed-secondary text-sm">Track not found</p>
      </div>
    );
  }

  const isRaining = weather !== 'dry';

  return (
    <div className={`track-renderer relative ${className}`}>
      {/* Weather overlay */}
      {isRaining && (
        <div className="absolute inset-0 pointer-events-none z-10 overflow-hidden rounded-2xl">
          <div className={`rain-overlay ${weather === 'heavy_rain' ? 'rain-heavy' : 'rain-light'}`} />
        </div>
      )}

      {/* Safety car overlay */}
      {status === 'safety_car' && (
        <div className="absolute inset-0 pointer-events-none z-10 rounded-2xl safety-car-overlay" />
      )}

      <svg
        viewBox={trackPath.viewBox}
        className="w-full h-full"
        style={{ filter: isRaining ? 'brightness(0.85)' : 'none' }}
      >
        <defs>
          {/* Track gradient */}
          <linearGradient id={`trackGrad-${trackId}`} x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#4a4a6a" />
            <stop offset="100%" stopColor="#2a2a4a" />
          </linearGradient>

          {/* DRS zone gradient */}
          <linearGradient id="drsGrad" x1="0%" y1="0%" x2="100%" y2="0%">
            <stop offset="0%" stopColor="#00ff88" stopOpacity="0.6" />
            <stop offset="100%" stopColor="#00ff88" stopOpacity="0.2" />
          </linearGradient>

          {/* Car glow filter */}
          <filter id="carGlow">
            <feGaussianBlur stdDeviation="3" result="coloredBlur" />
            <feMerge>
              <feMergeNode in="coloredBlur" />
              <feMergeNode in="SourceGraphic" />
            </feMerge>
          </filter>

          {/* Track glow */}
          <filter id="trackGlow">
            <feGaussianBlur stdDeviation="1.5" result="coloredBlur" />
            <feMerge>
              <feMergeNode in="coloredBlur" />
              <feMergeNode in="SourceGraphic" />
            </feMerge>
          </filter>
        </defs>

        {/* Track background shadow */}
        <path
          d={trackPath.mainPath}
          fill="none"
          stroke="rgba(0,0,0,0.3)"
          strokeWidth="28"
          strokeLinecap="round"
          strokeLinejoin="round"
        />

        {/* Main track */}
        <path
          ref={setPathElement}
          d={trackPath.mainPath}
          fill="none"
          stroke={`url(#trackGrad-${trackId})`}
          strokeWidth="22"
          strokeLinecap="round"
          strokeLinejoin="round"
          filter="url(#trackGlow)"
        />

        {/* Track center line */}
        <path
          d={trackPath.mainPath}
          fill="none"
          stroke="rgba(255,255,255,0.08)"
          strokeWidth="1"
          strokeDasharray="8 12"
          strokeLinecap="round"
        />

        {/* Pit lane */}
        <path
          d={trackPath.pitLanePath}
          fill="none"
          stroke="#555577"
          strokeWidth="8"
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeDasharray="6 4"
          opacity="0.5"
        />

        {/* DRS zones highlight */}
        {trackPath.drsZones.map((zone, i) => (
          <path
            key={`drs-${i}`}
            d={trackPath.mainPath}
            fill="none"
            stroke="#00ff88"
            strokeWidth="26"
            strokeLinecap="round"
            strokeLinejoin="round"
            opacity="0.12"
            strokeDasharray={getDRSDashArray(trackPath, zone)}
            strokeDashoffset={getDRSOffset(trackPath, zone)}
          />
        ))}

        {/* Sector split markers */}
        {sectorPoints.map((point, i) => (
          <g key={`sector-${i}`}>
            <line
              x1={point.x - 15}
              y1={point.y - 15}
              x2={point.x + 15}
              y2={point.y + 15}
              stroke={i === 0 ? '#e10600' : '#ffaa00'}
              strokeWidth="2"
              opacity="0.6"
            />
            <text
              x={point.x + 18}
              y={point.y - 5}
              fill={i === 0 ? '#e10600' : '#ffaa00'}
              fontSize="10"
              fontFamily="Orbitron"
              fontWeight="bold"
              opacity="0.7"
            >
              S{i + 2}
            </text>
          </g>
        ))}

        {/* Start/finish line */}
        <g transform={`translate(${trackPath.startFinishLine.x}, ${trackPath.startFinishLine.y}) rotate(${trackPath.startFinishLine.angle})`}>
          <rect x="-2" y="-14" width="4" height="28" fill="#fff" opacity="0.8" rx="1" />
          {/* Checkered pattern */}
          {[0, 1, 2, 3].map(i => (
            <rect
              key={i}
              x="-2"
              y={-14 + i * 7}
              width="2"
              height="3.5"
              fill={i % 2 === 0 ? '#fff' : '#000'}
              opacity="0.9"
            />
          ))}
          {[0, 1, 2, 3].map(i => (
            <rect
              key={`b-${i}`}
              x="0"
              y={-14 + i * 7}
              width="2"
              height="3.5"
              fill={i % 2 === 1 ? '#fff' : '#000'}
              opacity="0.9"
            />
          ))}
        </g>

        {/* Animated cars */}
        {carPositions.map((car) => {
          const isLeader = car.position === 1;
          const dotRadius = isLeader ? 6 : 4.5;
          const haloRadius = isLeader ? 10 : 6;
          return (
            <g key={car.driverId} filter="url(#carGlow)">
              {/* Car glow halo */}
              <circle
                cx={car.x}
                cy={car.y}
                r={haloRadius}
                fill={car.isPitting ? '#ffaa00' : car.teamColor}
                opacity={0.2}
              >
                {isLeader && (
                  <animate attributeName="r" values="10;14;10" dur="1.5s" repeatCount="indefinite" />
                )}
              </circle>

              {/* Car dot */}
              <circle
                cx={car.x}
                cy={car.y}
                r={dotRadius}
                fill={car.isPitting ? '#ffaa00' : car.teamColor}
                stroke="#fff"
                strokeWidth="1.5"
                opacity={car.isPitting ? 0.7 : 1}
              />

              {/* Driver code label */}
              <text
                x={car.x}
                y={car.y - 9}
                fill="#fff"
                fontSize="6.5"
                fontFamily="Orbitron"
                fontWeight="bold"
                textAnchor="middle"
                opacity="0.95"
              >
                {car.code}
              </text>

              {/* Position number (actual race position, not array index) */}
              <text
                x={car.x}
                y={car.y + 2.5}
                fill="#fff"
                fontSize="4.5"
                fontFamily="Orbitron"
                fontWeight="bold"
                textAnchor="middle"
              >
                {car.position}
              </text>

              {/* PIT indicator */}
              {car.isPitting && (
                <text
                  x={car.x}
                  y={car.y + 14}
                  fill="#ffaa00"
                  fontSize="5"
                  fontFamily="Orbitron"
                  fontWeight="bold"
                  textAnchor="middle"
                  opacity="0.9"
                >
                  PIT
                </text>
              )}
            </g>
          );
        })}
      </svg>

      {/* Track info overlay */}
      <div className="absolute bottom-3 left-3 flex items-center gap-2 pointer-events-none">
        <span className="text-[10px] font-display font-bold tracking-wider uppercase px-2 py-1 rounded bg-black/40 backdrop-blur-sm" style={{ color: trackData.accentColor }}>
          {trackData.name}
        </span>
        {weather !== 'dry' && (
          <span className="text-[10px] font-bold tracking-wider uppercase px-2 py-1 rounded bg-blue-500/20 text-blue-300 backdrop-blur-sm">
            {weather === 'light_rain' ? '🌧 Light Rain' : '⛈ Heavy Rain'}
          </span>
        )}
      </div>

      {/* DRS status */}
      <div className="absolute top-3 right-3 pointer-events-none">
        <span className="text-[9px] font-display font-bold tracking-wider uppercase px-2 py-1 rounded bg-green-500/15 text-green-400 backdrop-blur-sm">
          DRS {trackData.drsZones} ZONES
        </span>
      </div>
    </div>
  );
}

// ─── Helpers ─────────────────────────────────

function getSpeedAtPercent(speedProfile: TrackPathData['speedProfile'], percent: number): number {
  if (speedProfile.length === 0) return 0.7;

  let low = speedProfile[0];
  let high = speedProfile[speedProfile.length - 1];

  for (let i = 0; i < speedProfile.length - 1; i++) {
    if (percent >= speedProfile[i].percent && percent <= speedProfile[i + 1].percent) {
      low = speedProfile[i];
      high = speedProfile[i + 1];
      break;
    }
  }

  const range = high.percent - low.percent;
  if (range === 0) return low.speedFactor;
  const t = (percent - low.percent) / range;
  return low.speedFactor + (high.speedFactor - low.speedFactor) * t;
}

function getDRSDashArray(trackPath: TrackPathData, zone: { startPercent: number; endPercent: number }): string {
  // Approximate: make the stroke only appear for the DRS zone portion
  const zoneLength = (zone.endPercent - zone.startPercent) * 1000;
  const restLength = 1000 - zoneLength;
  return `${zoneLength} ${restLength}`;
}

function getDRSOffset(trackPath: TrackPathData, zone: { startPercent: number; endPercent: number }): string {
  return `${-zone.startPercent * 1000}`;
}
