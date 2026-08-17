import { Server as SocketIOServer } from 'socket.io';
import { LiveRaceState, LivePosition } from '../types';
import { mockDrivers } from '../data/mockData';

// ═══════════════════════════════════════════════════════
// Track Configuration Data (server-side, no SVG needed)
// ═══════════════════════════════════════════════════════

interface TrackConfig {
  id: string;
  name: string;
  grandPrixName: string;
  totalLaps: number;
  baseLapTimeSeconds: number;
  overtakeDifficulty: number;
  tyreDegradation: number;
  rainProbability: number;
  safetyCarProbability: number;
  pitWindowStart: number;
  pitWindowEnd: number;
  /** Authoritative circuit length from F1 22 UDP spec (metres). */
  circuitLengthM: number;
  /** Total turn count per FIA homologation / F1 22 UDP spec. */
  totalTurns: number;
  /** F1 22 integer trackId from PacketSessionData.m_trackId. -1 = not in F1 22. */
  f1_22TrackId: number;
}

const TRACK_CONFIGS: TrackConfig[] = [
  // ── F1 22 ID #3 ──
  { id: 'bahrain',       name: 'Bahrain International Circuit',   grandPrixName: 'Bahrain Grand Prix',           totalLaps: 57, baseLapTimeSeconds: 91,  overtakeDifficulty: 0.3,  tyreDegradation: 0.75, rainProbability: 0.02, safetyCarProbability: 0.15, pitWindowStart: 14, pitWindowEnd: 42, circuitLengthM: 5412, totalTurns: 15, f1_22TrackId: 3  },
  // ── F1 22 ID #30 ──
  { id: 'jeddah',        name: 'Jeddah Corniche Circuit',          grandPrixName: 'Saudi Arabian Grand Prix',     totalLaps: 50, baseLapTimeSeconds: 90,  overtakeDifficulty: 0.4,  tyreDegradation: 0.5,  rainProbability: 0.01, safetyCarProbability: 0.35, pitWindowStart: 12, pitWindowEnd: 38, circuitLengthM: 6174, totalTurns: 27, f1_22TrackId: 30 },
  // ── F1 22 ID #0 — 2023 chicane removal: length 5278m, turns reduced 16→14 ──
  { id: 'albert_park',   name: 'Albert Park Circuit',              grandPrixName: 'Australian Grand Prix',        totalLaps: 58, baseLapTimeSeconds: 80,  overtakeDifficulty: 0.35, tyreDegradation: 0.55, rainProbability: 0.2,  safetyCarProbability: 0.3,  pitWindowStart: 15, pitWindowEnd: 43, circuitLengthM: 5278, totalTurns: 14, f1_22TrackId: 0  },
  // ── F1 22 ID #13 ──
  { id: 'suzuka',        name: 'Suzuka Circuit',                   grandPrixName: 'Japanese Grand Prix',          totalLaps: 53, baseLapTimeSeconds: 91,  overtakeDifficulty: 0.65, tyreDegradation: 0.6,  rainProbability: 0.3,  safetyCarProbability: 0.2,  pitWindowStart: 13, pitWindowEnd: 40, circuitLengthM: 5807, totalTurns: 18, f1_22TrackId: 13 },
  // ── F1 22 ID #2 ──
  { id: 'shanghai',      name: 'Shanghai International Circuit',   grandPrixName: 'Chinese Grand Prix',           totalLaps: 56, baseLapTimeSeconds: 94,  overtakeDifficulty: 0.3,  tyreDegradation: 0.65, rainProbability: 0.25, safetyCarProbability: 0.15, pitWindowStart: 14, pitWindowEnd: 42, circuitLengthM: 5451, totalTurns: 16, f1_22TrackId: 2  },
  // ── F1 22 ID #31 ──
  { id: 'miami',         name: 'Miami International Autodrome',    grandPrixName: 'Miami Grand Prix',             totalLaps: 57, baseLapTimeSeconds: 90,  overtakeDifficulty: 0.35, tyreDegradation: 0.6,  rainProbability: 0.15, safetyCarProbability: 0.25, pitWindowStart: 14, pitWindowEnd: 42, circuitLengthM: 5412, totalTurns: 19, f1_22TrackId: 31 },
  // ── F1 22 ID #28 ──
  { id: 'imola',         name: 'Autodromo Enzo e Dino Ferrari',    grandPrixName: 'Emilia Romagna Grand Prix',    totalLaps: 63, baseLapTimeSeconds: 76,  overtakeDifficulty: 0.6,  tyreDegradation: 0.5,  rainProbability: 0.2,  safetyCarProbability: 0.2,  pitWindowStart: 16, pitWindowEnd: 47, circuitLengthM: 4909, totalTurns: 19, f1_22TrackId: 28 },
  // ── F1 22 ID #5 ──
  { id: 'monaco',        name: 'Circuit de Monaco',                grandPrixName: 'Monaco Grand Prix',            totalLaps: 78, baseLapTimeSeconds: 73,  overtakeDifficulty: 0.9,  tyreDegradation: 0.35, rainProbability: 0.1,  safetyCarProbability: 0.4,  pitWindowStart: 20, pitWindowEnd: 58, circuitLengthM: 3337, totalTurns: 19, f1_22TrackId: 5  },
  // ── F1 22 ID #6 ──
  { id: 'villeneuve',    name: 'Circuit Gilles Villeneuve',        grandPrixName: 'Canadian Grand Prix',          totalLaps: 70, baseLapTimeSeconds: 73,  overtakeDifficulty: 0.3,  tyreDegradation: 0.45, rainProbability: 0.2,  safetyCarProbability: 0.4,  pitWindowStart: 18, pitWindowEnd: 52, circuitLengthM: 4361, totalTurns: 14, f1_22TrackId: 6  },
  // ── F1 22 ID #4 — Turn 10 reprofile: same length, overtake harder ──
  { id: 'catalunya',     name: 'Circuit de Barcelona-Catalunya',   grandPrixName: 'Spanish Grand Prix',           totalLaps: 66, baseLapTimeSeconds: 77,  overtakeDifficulty: 0.6,  tyreDegradation: 0.8,  rainProbability: 0.08, safetyCarProbability: 0.12, pitWindowStart: 16, pitWindowEnd: 49, circuitLengthM: 4657, totalTurns: 14, f1_22TrackId: 4  },
  // ── F1 22 ID #24 ──
  { id: 'red_bull_ring', name: 'Red Bull Ring',                    grandPrixName: 'Austrian Grand Prix',          totalLaps: 71, baseLapTimeSeconds: 66,  overtakeDifficulty: 0.25, tyreDegradation: 0.55, rainProbability: 0.25, safetyCarProbability: 0.15, pitWindowStart: 18, pitWindowEnd: 53, circuitLengthM: 4318, totalTurns: 10, f1_22TrackId: 24 },
  // ── F1 22 ID #7 ──
  { id: 'silverstone',   name: 'Silverstone Circuit',              grandPrixName: 'British Grand Prix',           totalLaps: 52, baseLapTimeSeconds: 87,  overtakeDifficulty: 0.4,  tyreDegradation: 0.65, rainProbability: 0.35, safetyCarProbability: 0.15, pitWindowStart: 13, pitWindowEnd: 39, circuitLengthM: 5891, totalTurns: 18, f1_22TrackId: 7  },
  // ── F1 22 ID #9 ──
  { id: 'hungaroring',   name: 'Hungaroring',                      grandPrixName: 'Hungarian Grand Prix',         totalLaps: 70, baseLapTimeSeconds: 77,  overtakeDifficulty: 0.7,  tyreDegradation: 0.7,  rainProbability: 0.15, safetyCarProbability: 0.12, pitWindowStart: 18, pitWindowEnd: 52, circuitLengthM: 4381, totalTurns: 14, f1_22TrackId: 9  },
  // ── F1 22 ID #10 — gravel traps reinstated, weather more dangerous ──
  { id: 'spa',           name: 'Circuit de Spa-Francorchamps',     grandPrixName: 'Belgian Grand Prix',           totalLaps: 44, baseLapTimeSeconds: 106, overtakeDifficulty: 0.25, tyreDegradation: 0.55, rainProbability: 0.5,  safetyCarProbability: 0.3,  pitWindowStart: 11, pitWindowEnd: 33, circuitLengthM: 7004, totalTurns: 19, f1_22TrackId: 10 },
  // ── F1 22 ID #27 ──
  { id: 'zandvoort',     name: 'Circuit Zandvoort',                grandPrixName: 'Dutch Grand Prix',             totalLaps: 72, baseLapTimeSeconds: 71,  overtakeDifficulty: 0.7,  tyreDegradation: 0.6,  rainProbability: 0.2,  safetyCarProbability: 0.15, pitWindowStart: 18, pitWindowEnd: 54, circuitLengthM: 4259, totalTurns: 14, f1_22TrackId: 27 },
  // ── F1 22 ID #11 — Prima Variante curbs flattened ──
  { id: 'monza',         name: 'Autodromo Nazionale di Monza',     grandPrixName: 'Italian Grand Prix',           totalLaps: 53, baseLapTimeSeconds: 81,  overtakeDifficulty: 0.2,  tyreDegradation: 0.4,  rainProbability: 0.12, safetyCarProbability: 0.18, pitWindowStart: 13, pitWindowEnd: 40, circuitLengthM: 5793, totalTurns: 11, f1_22TrackId: 11 },
  // ── F1 22 ID #26 ──
  { id: 'baku',          name: 'Baku City Circuit',                grandPrixName: 'Azerbaijan Grand Prix',        totalLaps: 51, baseLapTimeSeconds: 103, overtakeDifficulty: 0.3,  tyreDegradation: 0.5,  rainProbability: 0.05, safetyCarProbability: 0.45, pitWindowStart: 13, pitWindowEnd: 38, circuitLengthM: 6003, totalTurns: 20, f1_22TrackId: 26 },
  // ── F1 22 ID #12 ──
  { id: 'marina_bay',    name: 'Marina Bay Street Circuit',        grandPrixName: 'Singapore Grand Prix',         totalLaps: 62, baseLapTimeSeconds: 96,  overtakeDifficulty: 0.65, tyreDegradation: 0.55, rainProbability: 0.25, safetyCarProbability: 0.45, pitWindowStart: 16, pitWindowEnd: 46, circuitLengthM: 5063, totalTurns: 23, f1_22TrackId: 12 },
  // ── F1 22 ID #15 ──
  { id: 'americas',      name: 'Circuit of the Americas',          grandPrixName: 'United States Grand Prix',     totalLaps: 56, baseLapTimeSeconds: 96,  overtakeDifficulty: 0.35, tyreDegradation: 0.65, rainProbability: 0.15, safetyCarProbability: 0.15, pitWindowStart: 14, pitWindowEnd: 42, circuitLengthM: 5513, totalTurns: 20, f1_22TrackId: 15 },
  // ── F1 22 ID #18 ──
  { id: 'rodriguez',     name: 'Autódromo Hermanos Rodríguez',     grandPrixName: 'Mexico City Grand Prix',       totalLaps: 71, baseLapTimeSeconds: 78,  overtakeDifficulty: 0.3,  tyreDegradation: 0.7,  rainProbability: 0.1,  safetyCarProbability: 0.15, pitWindowStart: 18, pitWindowEnd: 53, circuitLengthM: 4304, totalTurns: 17, f1_22TrackId: 18 },
  // ── F1 22 ID #16 ──
  { id: 'interlagos',    name: 'Autódromo José Carlos Pace',       grandPrixName: 'São Paulo Grand Prix',         totalLaps: 71, baseLapTimeSeconds: 71,  overtakeDifficulty: 0.3,  tyreDegradation: 0.55, rainProbability: 0.35, safetyCarProbability: 0.25, pitWindowStart: 18, pitWindowEnd: 53, circuitLengthM: 4309, totalTurns: 15, f1_22TrackId: 16 },
  // ── Not in F1 22 (post-2022 addition) ──
  { id: 'las_vegas',     name: 'Las Vegas Strip Circuit',          grandPrixName: 'Las Vegas Grand Prix',         totalLaps: 50, baseLapTimeSeconds: 93,  overtakeDifficulty: 0.3,  tyreDegradation: 0.5,  rainProbability: 0.02, safetyCarProbability: 0.2,  pitWindowStart: 12, pitWindowEnd: 38, circuitLengthM: 6201, totalTurns: 17, f1_22TrackId: -1 },
  // ── Not in F1 22 (post-2022 addition) ──
  { id: 'lusail',        name: 'Lusail International Circuit',     grandPrixName: 'Qatar Grand Prix',             totalLaps: 57, baseLapTimeSeconds: 82,  overtakeDifficulty: 0.45, tyreDegradation: 0.6,  rainProbability: 0.01, safetyCarProbability: 0.12, pitWindowStart: 14, pitWindowEnd: 42, circuitLengthM: 5419, totalTurns: 16, f1_22TrackId: -1 },
  // ── F1 22 ID #19 — 2021 layout overhaul: faster, fewer slow sections ──
  { id: 'yas_marina',    name: 'Yas Marina Circuit',               grandPrixName: 'Abu Dhabi Grand Prix',         totalLaps: 58, baseLapTimeSeconds: 84,  overtakeDifficulty: 0.35, tyreDegradation: 0.5,  rainProbability: 0.01, safetyCarProbability: 0.12, pitWindowStart: 15, pitWindowEnd: 43, circuitLengthM: 5281, totalTurns: 16, f1_22TrackId: 19 },
];

/**
 * Returns the F1 22 structure data embedded in the track config.
 * Exposed for use by the live race API routes.
 */
export function getF1_22TrackOverride(circuitId: string) {
  const cfg = TRACK_CONFIGS.find(t => t.id === circuitId);
  if (!cfg || cfg.f1_22TrackId === -1) return null;
  return {
    length_meters: cfg.circuitLengthM,
    total_turns: cfg.totalTurns,
    f1_22_track_id: cfg.f1_22TrackId,
  };
}

function getTrackConfig(trackId: string): TrackConfig {
  return TRACK_CONFIGS.find(t => t.id === trackId) || TRACK_CONFIGS[7]; // default Monaco
}

function generateLapTime(baseTime: number, variance: number): string {
  const time = baseTime + (Math.random() - 0.5) * variance;
  const minutes = Math.floor(time / 60);
  const seconds = time % 60;
  return `${minutes}:${seconds.toFixed(3).padStart(6, '0')}`;
}

function generateSectorTime(base: number): string {
  const time = base + (Math.random() - 0.4) * 1.5;
  return time.toFixed(3);
}

export class RaceSimulator {
  private io: SocketIOServer;
  private raceState: LiveRaceState;
  private intervalId: NodeJS.Timeout | null = null;
  private baseLapTimes: Map<string, number> = new Map();
  private currentTrack: TrackConfig | null = null;

  constructor(io: SocketIOServer) {
    this.io = io;
    this.raceState = this.getDefaultState();
  }

  private getDefaultState(): LiveRaceState {
    return {
      isActive: false,
      currentLap: 0,
      totalLaps: 57,
      raceName: 'Grand Prix',
      trackId: '',
      positions: [],
      fastestLap: null,
      status: 'not_started',
      weather: 'dry',
    };
  }

  private initializePositions(): LivePosition[] {
    const drivers = [...mockDrivers];
    // Shuffle slightly based on qualifying simulation
    for (let i = drivers.length - 1; i > 0; i--) {
      if (Math.random() < 0.3) {
        const j = Math.max(0, i - Math.floor(Math.random() * 3));
        [drivers[i], drivers[j]] = [drivers[j], drivers[i]];
      }
    }

    const baseLapTime = this.currentTrack?.baseLapTimeSeconds || 80;

    return drivers.map((driver, index) => {
      // Base lap time varies by team strength (position)
      const driverBaseLap = baseLapTime + (index * 0.15) + Math.random() * 0.5;
      this.baseLapTimes.set(driver.driverId, driverBaseLap);

      const startingTire = index < 10 ? 'soft' : 'medium';

      return {
        position: index + 1,
        driverId: driver.driverId,
        driverName: `${driver.givenName} ${driver.familyName}`,
        driverCode: driver.code || driver.familyName.substring(0, 3).toUpperCase(),
        team: driver.team?.name || 'Unknown',
        teamColor: driver.team?.color || '#666666',
        gap: index === 0 ? 'LEADER' : `+${(index * 1.2 + Math.random() * 0.5).toFixed(3)}`,
        interval: index === 0 ? '-' : `+${(0.3 + Math.random() * 1.5).toFixed(3)}`,
        lastLapTime: '-',
        bestLapTime: '-',
        tire: startingTire as 'soft' | 'medium' | 'hard' | 'intermediate' | 'wet',
        tireAge: 0,
        pitStops: 0,
        status: 'racing',
        drs: false,
        sector1: '-',
        sector2: '-',
        sector3: '-',
      };
    });
  }

  startRace(trackId?: string): LiveRaceState {
    if (this.raceState.isActive) {
      return this.raceState;
    }

    const selectedTrackId = trackId || 'monaco';
    this.currentTrack = getTrackConfig(selectedTrackId);

    this.raceState = {
      ...this.getDefaultState(),
      isActive: true,
      status: 'racing',
      raceName: this.currentTrack.grandPrixName,
      trackId: this.currentTrack.id,
      totalLaps: this.currentTrack.totalLaps,
      positions: this.initializePositions(),
      weather: 'dry',
    };

    this.io.emit('race_start', {
      raceName: this.raceState.raceName,
      trackId: this.raceState.trackId,
      totalLaps: this.raceState.totalLaps,
      positions: this.raceState.positions,
      weather: this.raceState.weather,
    });

    // Simulate laps every 2 seconds
    this.intervalId = setInterval(() => {
      this.simulateLap();
    }, 2000);

    return this.raceState;
  }

  private simulateLap(): void {
    this.raceState.currentLap++;

    if (this.raceState.currentLap > this.raceState.totalLaps) {
      this.finishRace();
      return;
    }

    const track = this.currentTrack!;

    // Weather change check (uses track rain probability)
    if (Math.random() < track.rainProbability * 0.15) {
      const prevWeather = this.raceState.weather;
      if (this.raceState.weather === 'dry') {
        this.raceState.weather = 'light_rain';
      } else if (this.raceState.weather === 'light_rain') {
        this.raceState.weather = Math.random() > 0.5 ? 'heavy_rain' : 'dry';
      } else {
        this.raceState.weather = 'light_rain';
      }
      if (prevWeather !== this.raceState.weather) {
        this.io.emit('weather_change', {
          weather: this.raceState.weather,
          lap: this.raceState.currentLap,
        });
      }
    }

    // Safety car chance (uses track-specific probability)
    if (Math.random() < track.safetyCarProbability * 0.05 && this.raceState.status !== 'safety_car') {
      this.raceState.status = 'safety_car';
      this.io.emit('safety_car', { lap: this.raceState.currentLap });
      setTimeout(() => {
        if (this.raceState.isActive) {
          this.raceState.status = 'racing';
          this.io.emit('green_flag', { lap: this.raceState.currentLap });
        }
      }, 10000);
    }

    const isSafetyCar = this.raceState.status === 'safety_car';
    const isWet = this.raceState.weather !== 'dry';
    let cumulativeGap = 0;

    // Update each position
    this.raceState.positions.forEach((pos, index) => {
      if (pos.status === 'retired') return;

      pos.tireAge++;

      // Pit stop logic (track-aware pit window)
      const shouldPit = this.shouldPitStop(pos, this.raceState.currentLap, this.raceState.totalLaps);
      if (shouldPit) {
        pos.status = 'pit';
        pos.pitStops++;
        pos.tire = this.getNextTire(pos.tire, isWet);
        pos.tireAge = 0;
        this.io.emit('pit_stop', {
          driverId: pos.driverId,
          driverName: pos.driverName,
          lap: this.raceState.currentLap,
          newTire: pos.tire,
          pitStops: pos.pitStops,
        });
        setTimeout(() => { pos.status = 'racing'; }, 1000);
      }

      // Retirement chance (slightly higher in rain)
      const retirementChance = isWet ? 0.005 : 0.003;
      if (Math.random() < retirementChance && this.raceState.currentLap > 5) {
        pos.status = 'retired';
        this.io.emit('retirement', {
          driverId: pos.driverId,
          driverName: pos.driverName,
          lap: this.raceState.currentLap,
        });
        return;
      }

      // Generate lap time (track-specific base time)
      const baseLapTime = this.baseLapTimes.get(pos.driverId) || track.baseLapTimeSeconds;
      const tireDegRate = track.tyreDegradation;
      const tireDeg = pos.tireAge * (
        pos.tire === 'soft' ? 0.04 * tireDegRate :
        pos.tire === 'medium' ? 0.025 * tireDegRate :
        pos.tire === 'hard' ? 0.015 * tireDegRate :
        pos.tire === 'intermediate' ? 0.02 :
        0.018
      );
      const pitPenalty = pos.status === 'pit' ? 20 : 0;
      const safetyCarPenalty = isSafetyCar ? 15 : 0;
      const wetPenalty = isWet && !['intermediate', 'wet'].includes(pos.tire) ? (this.raceState.weather === 'heavy_rain' ? 8 : 3) : 0;
      const actualLapTime = baseLapTime + tireDeg + pitPenalty + safetyCarPenalty + wetPenalty + (Math.random() - 0.5) * 0.8;

      pos.lastLapTime = generateLapTime(actualLapTime, 0);
      pos.sector1 = generateSectorTime(actualLapTime / 3 - 2);
      pos.sector2 = generateSectorTime(actualLapTime / 3);
      pos.sector3 = generateSectorTime(actualLapTime / 3 + 2);

      if (pos.bestLapTime === '-' || actualLapTime < this.parseLapTime(pos.bestLapTime)) {
        pos.bestLapTime = pos.lastLapTime;
      }

      // Check fastest lap
      if (!this.raceState.fastestLap || actualLapTime < this.parseLapTime(this.raceState.fastestLap.time)) {
        this.raceState.fastestLap = { driverId: pos.driverId, time: pos.lastLapTime };
        this.io.emit('race_event', {
          id: `fl-${this.raceState.currentLap}-${pos.driverId}`,
          type: 'fastest_lap',
          message: `⚡ ${pos.driverCode || pos.driverName.split(' ').pop()?.substring(0, 3).toUpperCase()} sets fastest lap — ${pos.lastLapTime}`,
          lap: this.raceState.currentLap,
          timestamp: Date.now(),
          driverId: pos.driverId,
          driverCode: pos.driverCode,
          teamColor: pos.teamColor,
        });
      }

      // DRS detection (affected by overtake difficulty)
      if (index > 0) {
        const gapToAhead = parseFloat(this.raceState.positions[index - 1]?.interval?.replace('+', '') || '2');
        pos.drs = gapToAhead < 1.0 && !isSafetyCar && !isWet;
      }

      // Calculate gaps
      if (index === 0) {
        pos.gap = 'LEADER';
        pos.interval = '-';
      } else {
        cumulativeGap += 0.3 + Math.random() * 1.2 + (pos.status === 'pit' ? 20 : 0);
        pos.gap = `+${cumulativeGap.toFixed(3)}`;
        pos.interval = `+${(cumulativeGap - (parseFloat(this.raceState.positions[index - 1]?.gap?.replace('+', '') || '0'))).toFixed(3)}`;
        if (pos.interval.startsWith('+-')) pos.interval = pos.interval.replace('+-', '-');
      }
    });

    // Position changes (overtakes — track overtake difficulty affects chance)
    if (!isSafetyCar) {
      for (let i = 1; i < this.raceState.positions.length; i++) {
        const pos = this.raceState.positions[i];
        const ahead = this.raceState.positions[i - 1];
        if (pos.status !== 'racing' || ahead.status !== 'racing') continue;

        const trackOvertakeModifier = 1 - (this.currentTrack?.overtakeDifficulty || 0.5);
        const overtakeChance = (pos.drs ? 0.08 : 0.03) * (trackOvertakeModifier + 0.5);
        if (Math.random() < overtakeChance) {
          // Swap positions
          [this.raceState.positions[i], this.raceState.positions[i - 1]] = [this.raceState.positions[i - 1], this.raceState.positions[i]];
          this.raceState.positions[i - 1].position = i;
          this.raceState.positions[i].position = i + 1;

          const overtakerCode = pos.driverCode || pos.driverName.split(' ').pop()?.substring(0, 3).toUpperCase();
          const overtakenCode = ahead.driverCode || ahead.driverName.split(' ').pop()?.substring(0, 3).toUpperCase();

          this.io.emit('position_change', {
            overtaker: pos.driverName,
            overtaken: ahead.driverName,
            position: i,
            lap: this.raceState.currentLap,
          });

          this.io.emit('race_event', {
            id: `ov-${this.raceState.currentLap}-${pos.driverId}`,
            type: 'overtake',
            message: `${overtakerCode} overtakes ${overtakenCode} for P${i}!`,
            lap: this.raceState.currentLap,
            timestamp: Date.now(),
            driverId: pos.driverId,
            driverCode: pos.driverCode,
            teamColor: pos.teamColor,
          });
        }
      }
    }

    // Random enhanced events (team radio, investigation, yellow flags)
    if (Math.random() < 0.08 && this.raceState.currentLap > 2) {
      const randomDriver = this.raceState.positions[Math.floor(Math.random() * Math.min(10, this.raceState.positions.length))];
      const radioMessages = [
        `"These tyres are gone, I\'m struggling out here."`,
        `"The car feels amazing, let\'s push!"`,
        `"I\'m losing time in the slow corners."`,
        `"Can you check the gap to the car ahead?"`,
        `"Copy, we are looking at Plan B."`,
        `"Is there rain coming? The sky looks dark."`,
      ];
      const code = randomDriver.driverCode || randomDriver.driverName.split(' ').pop()?.substring(0, 3).toUpperCase();
      this.io.emit('race_event', {
        id: `radio-${this.raceState.currentLap}-${randomDriver.driverId}`,
        type: 'team_radio',
        message: `📻 ${code}: ${radioMessages[Math.floor(Math.random() * radioMessages.length)]}`,
        lap: this.raceState.currentLap,
        timestamp: Date.now(),
        driverId: randomDriver.driverId,
        driverCode: randomDriver.driverCode,
        teamColor: randomDriver.teamColor,
      });
    }

    if (Math.random() < 0.03 && this.raceState.currentLap > 5) {
      const randomDriver = this.raceState.positions[Math.floor(Math.random() * this.raceState.positions.length)];
      const code = randomDriver.driverCode || randomDriver.driverName.split(' ').pop()?.substring(0, 3).toUpperCase();
      this.io.emit('race_event', {
        id: `inv-${this.raceState.currentLap}-${randomDriver.driverId}`,
        type: 'investigation',
        message: `⚠️ ${code} under investigation — exceeding track limits`,
        lap: this.raceState.currentLap,
        timestamp: Date.now(),
        driverId: randomDriver.driverId,
        driverCode: randomDriver.driverCode,
        teamColor: randomDriver.teamColor,
      });
    }

    // Update positions
    this.raceState.positions.forEach((p, i) => { p.position = i + 1; });

    // Emit lap update
    this.io.emit('lap_update', {
      currentLap: this.raceState.currentLap,
      totalLaps: this.raceState.totalLaps,
      positions: this.raceState.positions,
      fastestLap: this.raceState.fastestLap,
      status: this.raceState.status,
      weather: this.raceState.weather,
      trackId: this.raceState.trackId,
    });
  }

  private parseLapTime(timeStr: string): number {
    if (timeStr === '-') return Infinity;
    const parts = timeStr.split(':');
    return parseFloat(parts[0]) * 60 + parseFloat(parts[1]);
  }

  private shouldPitStop(pos: LivePosition, currentLap: number, totalLaps: number): boolean {
    if (pos.status === 'pit' || pos.pitStops >= 2) return false;

    const track = this.currentTrack;
    const pitStart = track?.pitWindowStart || 10;
    const pitEnd = track?.pitWindowEnd || (totalLaps - 5);

    if (currentLap < pitStart || currentLap > pitEnd) return false;

    // Weather-induced pit stops (switch to intermediates/wets)
    if (this.raceState.weather !== 'dry' && !['intermediate', 'wet'].includes(pos.tire) && Math.random() < 0.15) {
      return true;
    }

    // Strategy based on tyre deg rate
    const degradation = this.currentTrack?.tyreDegradation || 0.5;
    const tireLifeMax = pos.tire === 'soft' ? 18 : pos.tire === 'medium' ? 28 : 38;
    const adjustedTireLife = Math.floor(tireLifeMax * (1.2 - degradation));

    if (pos.pitStops === 0 && pos.tireAge > adjustedTireLife + Math.floor(Math.random() * 5)) return true;
    if (pos.pitStops === 1 && pos.tire === 'soft' && pos.tireAge > 15 + Math.floor(Math.random() * 5)) return true;

    return false;
  }

  private getNextTire(current: string, isWet: boolean): 'soft' | 'medium' | 'hard' | 'intermediate' | 'wet' {
    if (isWet) {
      if (this.raceState.weather === 'heavy_rain') return 'wet';
      return 'intermediate';
    }
    if (current === 'intermediate' || current === 'wet') {
      return Math.random() > 0.5 ? 'medium' : 'soft';
    }
    if (current === 'soft') return Math.random() > 0.5 ? 'hard' : 'medium';
    if (current === 'medium') return Math.random() > 0.5 ? 'hard' : 'soft';
    return Math.random() > 0.5 ? 'medium' : 'soft';
  }

  private finishRace(): void {
    this.raceState.isActive = false;
    this.raceState.status = 'finished';
    if (this.intervalId) {
      clearInterval(this.intervalId);
      this.intervalId = null;
    }

    this.io.emit('race_finish', {
      positions: this.raceState.positions,
      fastestLap: this.raceState.fastestLap,
      winner: this.raceState.positions[0],
    });
  }

  stopRace(): void {
    this.raceState.isActive = false;
    this.raceState.status = 'finished';
    if (this.intervalId) {
      clearInterval(this.intervalId);
      this.intervalId = null;
    }
    this.io.emit('race_stopped', {});
  }

  getState(): LiveRaceState {
    return this.raceState;
  }

  getAvailableTracks(): Array<{ id: string; name: string; grandPrixName: string; totalLaps: number }> {
    return TRACK_CONFIGS.map(t => ({
      id: t.id,
      name: t.name,
      grandPrixName: t.grandPrixName,
      totalLaps: t.totalLaps,
    }));
  }

  /** Returns post-race results from last finished race */
  getPostRaceResults() {
    if (this.raceState.status !== 'finished' || this.raceState.positions.length === 0) return null;
    return {
      positions: this.raceState.positions,
      fastestLap: this.raceState.fastestLap,
      raceName: this.raceState.raceName,
      trackId: this.raceState.trackId,
      totalLaps: this.raceState.totalLaps,
    };
  }
}
