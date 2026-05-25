'use client';

import { useEffect, useRef, useMemo, useState } from 'react';
import { motion } from 'framer-motion';
import { getTrackPath, TrackPathData } from '@/data/trackPaths';
import { getTrackById } from '@/data/trackData';
import { LivePosition } from '@/types';

interface TrackRendererProps {
  trackId: string;
  positions: LivePosition[];
  weather?: 'dry' | 'light_rain' | 'heavy_rain';
  status?: string;
  showCars?: number; // how many cars to render on track (default 6)
  className?: string;
}

// Get a point along an SVG path at a given percentage
function getPointAtPercent(pathEl: SVGPathElement, percent: number): { x: number; y: number } {
  const totalLength = pathEl.getTotalLength();
  const point = pathEl.getPointAtLength(totalLength * Math.max(0, Math.min(1, percent)));
  return { x: point.x, y: point.y };
}

export default function TrackRenderer({
  trackId,
  positions,
  weather = 'dry',
  status,
  showCars = 6,
  className = '',
}: TrackRendererProps) {
  const svgRef = useRef<SVGSVGElement>(null);
  const [pathElement, setPathElement] = useState<SVGPathElement | null>(null);
  const [sectorPoints, setSectorPoints] = useState<Array<{ x: number; y: number }>>([]);
  const [carPositions, setCarPositions] = useState<Array<{ x: number; y: number; driverId: string; teamColor: string; code: string }>>([]);
  const animFrameRef = useRef<number>(0);
  const progressRef = useRef<Map<string, number>>(new Map());

  const trackPath = useMemo(() => getTrackPath(trackId), [trackId]);
  const trackData = useMemo(() => getTrackById(trackId), [trackId]);

  // Calculate sector split points once the path element is ready
  useEffect(() => {
    if (pathElement && trackPath) {
      const points = trackPath.sectorSplits.map(split => getPointAtPercent(pathElement, split));
      setSectorPoints(points);
    } else {
      setSectorPoints([]);
    }
  }, [trackPath, pathElement]);

  // Animate cars around the track
  useEffect(() => {
    if (!pathElement || !trackPath || positions.length === 0) return;

    const pathEl = pathElement;
    const topDrivers = positions.filter(p => p.status !== 'retired').slice(0, showCars);

    // Initialize progress if new drivers
    topDrivers.forEach((driver, index) => {
      if (!progressRef.current.has(driver.driverId)) {
        progressRef.current.set(driver.driverId, (index * 0.05) % 1);
      }
    });

    let lastTime = performance.now();

    const animate = (time: number) => {
      const delta = (time - lastTime) / 1000;
      lastTime = time;

      const isSafetyCar = status === 'safety_car';
      const baseSpeed = isSafetyCar ? 0.02 : 0.06;

      const newPositions = topDrivers.map((driver, index) => {
        let progress = progressRef.current.get(driver.driverId) || 0;

        // Get speed at current position from speed profile
        const speedAtPos = getSpeedAtPercent(trackPath.speedProfile, progress);
        const driverSpeedVariation = 1 - (index * 0.008); // leader is slightly faster

        // Pit status = slower
        const pitModifier = driver.status === 'pit' ? 0.3 : 1;

        progress += baseSpeed * speedAtPos * driverSpeedVariation * pitModifier * delta;
        if (progress >= 1) progress -= 1;

        progressRef.current.set(driver.driverId, progress);

        const point = getPointAtPercent(pathEl, progress);
        const code = driver.driverName.split(' ').pop()?.substring(0, 3).toUpperCase() || '???';

        return {
          x: point.x,
          y: point.y,
          driverId: driver.driverId,
          teamColor: driver.teamColor,
          code,
        };
      });

      setCarPositions(newPositions);
      animFrameRef.current = requestAnimationFrame(animate);
    };

    animFrameRef.current = requestAnimationFrame(animate);
    return () => cancelAnimationFrame(animFrameRef.current);
  }, [trackPath, positions, showCars, status, pathElement]);

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
        ref={svgRef}
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
        {carPositions.map((car, index) => (
          <g key={car.driverId} filter="url(#carGlow)">
            {/* Car glow halo */}
            <circle
              cx={car.x}
              cy={car.y}
              r={index === 0 ? 10 : 7}
              fill={car.teamColor}
              opacity={0.2}
            >
              {index === 0 && (
                <animate attributeName="r" values="10;14;10" dur="1.5s" repeatCount="indefinite" />
              )}
            </circle>

            {/* Car dot */}
            <circle
              cx={car.x}
              cy={car.y}
              r={index === 0 ? 6 : 5}
              fill={car.teamColor}
              stroke="#fff"
              strokeWidth="1.5"
            />

            {/* Driver code label */}
            <text
              x={car.x}
              y={car.y - 10}
              fill="#fff"
              fontSize="7"
              fontFamily="Orbitron"
              fontWeight="bold"
              textAnchor="middle"
              opacity="0.9"
            >
              {car.code}
            </text>

            {/* Position number */}
            <text
              x={car.x}
              y={car.y + 3}
              fill="#fff"
              fontSize="5"
              fontFamily="Orbitron"
              fontWeight="bold"
              textAnchor="middle"
            >
              {index + 1}
            </text>
          </g>
        ))}
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
