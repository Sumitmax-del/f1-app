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
}

const TRACK_CONFIGS: TrackConfig[] = [
  { id: 'bahrain', name: 'Bahrain International Circuit', grandPrixName: 'Bahrain Grand Prix', totalLaps: 57, baseLapTimeSeconds: 91, overtakeDifficulty: 0.3, tyreDegradation: 0.75, rainProbability: 0.02, safetyCarProbability: 0.15, pitWindowStart: 14, pitWindowEnd: 42 },
  { id: 'jeddah', name: 'Jeddah Corniche Circuit', grandPrixName: 'Saudi Arabian Grand Prix', totalLaps: 50, baseLapTimeSeconds: 90, overtakeDifficulty: 0.4, tyreDegradation: 0.5, rainProbability: 0.01, safetyCarProbability: 0.35, pitWindowStart: 12, pitWindowEnd: 38 },
  { id: 'albert_park', name: 'Albert Park Circuit', grandPrixName: 'Australian Grand Prix', totalLaps: 58, baseLapTimeSeconds: 80, overtakeDifficulty: 0.4, tyreDegradation: 0.55, rainProbability: 0.2, safetyCarProbability: 0.3, pitWindowStart: 15, pitWindowEnd: 43 },
  { id: 'suzuka', name: 'Suzuka Circuit', grandPrixName: 'Japanese Grand Prix', totalLaps: 53, baseLapTimeSeconds: 91, overtakeDifficulty: 0.65, tyreDegradation: 0.6, rainProbability: 0.3, safetyCarProbability: 0.2, pitWindowStart: 13, pitWindowEnd: 40 },
  { id: 'shanghai', name: 'Shanghai International Circuit', grandPrixName: 'Chinese Grand Prix', totalLaps: 56, baseLapTimeSeconds: 94, overtakeDifficulty: 0.3, tyreDegradation: 0.65, rainProbability: 0.25, safetyCarProbability: 0.15, pitWindowStart: 14, pitWindowEnd: 42 },
  { id: 'miami', name: 'Miami International Autodrome', grandPrixName: 'Miami Grand Prix', totalLaps: 57, baseLapTimeSeconds: 90, overtakeDifficulty: 0.35, tyreDegradation: 0.6, rainProbability: 0.15, safetyCarProbability: 0.25, pitWindowStart: 14, pitWindowEnd: 42 },
  { id: 'imola', name: 'Autodromo Enzo e Dino Ferrari', grandPrixName: 'Emilia Romagna Grand Prix', totalLaps: 63, baseLapTimeSeconds: 76, overtakeDifficulty: 0.6, tyreDegradation: 0.5, rainProbability: 0.2, safetyCarProbability: 0.2, pitWindowStart: 16, pitWindowEnd: 47 },
  { id: 'monaco', name: 'Circuit de Monaco', grandPrixName: 'Monaco Grand Prix', totalLaps: 78, baseLapTimeSeconds: 73, overtakeDifficulty: 0.9, tyreDegradation: 0.35, rainProbability: 0.1, safetyCarProbability: 0.4, pitWindowStart: 20, pitWindowEnd: 58 },
  { id: 'villeneuve', name: 'Circuit Gilles Villeneuve', grandPrixName: 'Canadian Grand Prix', totalLaps: 70, baseLapTimeSeconds: 73, overtakeDifficulty: 0.3, tyreDegradation: 0.45, rainProbability: 0.2, safetyCarProbability: 0.4, pitWindowStart: 18, pitWindowEnd: 52 },
  { id: 'catalunya', name: 'Circuit de Barcelona-Catalunya', grandPrixName: 'Spanish Grand Prix', totalLaps: 66, baseLapTimeSeconds: 77, overtakeDifficulty: 0.55, tyreDegradation: 0.8, rainProbability: 0.08, safetyCarProbability: 0.12, pitWindowStart: 16, pitWindowEnd: 49 },
  { id: 'red_bull_ring', name: 'Red Bull Ring', grandPrixName: 'Austrian Grand Prix', totalLaps: 71, baseLapTimeSeconds: 66, overtakeDifficulty: 0.25, tyreDegradation: 0.55, rainProbability: 0.25, safetyCarProbability: 0.15, pitWindowStart: 18, pitWindowEnd: 53 },
  { id: 'silverstone', name: 'Silverstone Circuit', grandPrixName: 'British Grand Prix', totalLaps: 52, baseLapTimeSeconds: 87, overtakeDifficulty: 0.4, tyreDegradation: 0.65, rainProbability: 0.35, safetyCarProbability: 0.15, pitWindowStart: 13, pitWindowEnd: 39 },
  { id: 'hungaroring', name: 'Hungaroring', grandPrixName: 'Hungarian Grand Prix', totalLaps: 70, baseLapTimeSeconds: 77, overtakeDifficulty: 0.7, tyreDegradation: 0.7, rainProbability: 0.15, safetyCarProbability: 0.12, pitWindowStart: 18, pitWindowEnd: 52 },
  { id: 'spa', name: 'Circuit de Spa-Francorchamps', grandPrixName: 'Belgian Grand Prix', totalLaps: 44, baseLapTimeSeconds: 106, overtakeDifficulty: 0.25, tyreDegradation: 0.55, rainProbability: 0.45, safetyCarProbability: 0.25, pitWindowStart: 11, pitWindowEnd: 33 },
  { id: 'zandvoort', name: 'Circuit Zandvoort', grandPrixName: 'Dutch Grand Prix', totalLaps: 72, baseLapTimeSeconds: 71, overtakeDifficulty: 0.7, tyreDegradation: 0.6, rainProbability: 0.2, safetyCarProbability: 0.15, pitWindowStart: 18, pitWindowEnd: 54 },
  { id: 'monza', name: 'Autodromo Nazionale di Monza', grandPrixName: 'Italian Grand Prix', totalLaps: 53, baseLapTimeSeconds: 81, overtakeDifficulty: 0.2, tyreDegradation: 0.4, rainProbability: 0.12, safetyCarProbability: 0.18, pitWindowStart: 13, pitWindowEnd: 40 },
  { id: 'baku', name: 'Baku City Circuit', grandPrixName: 'Azerbaijan Grand Prix', totalLaps: 51, baseLapTimeSeconds: 103, overtakeDifficulty: 0.3, tyreDegradation: 0.5, rainProbability: 0.05, safetyCarProbability: 0.45, pitWindowStart: 13, pitWindowEnd: 38 },
  { id: 'marina_bay', name: 'Marina Bay Street Circuit', grandPrixName: 'Singapore Grand Prix', totalLaps: 62, baseLapTimeSeconds: 96, overtakeDifficulty: 0.65, tyreDegradation: 0.55, rainProbability: 0.25, safetyCarProbability: 0.45, pitWindowStart: 16, pitWindowEnd: 46 },
  { id: 'americas', name: 'Circuit of the Americas', grandPrixName: 'United States Grand Prix', totalLaps: 56, baseLapTimeSeconds: 96, overtakeDifficulty: 0.35, tyreDegradation: 0.65, rainProbability: 0.15, safetyCarProbability: 0.15, pitWindowStart: 14, pitWindowEnd: 42 },
  { id: 'rodriguez', name: 'Autódromo Hermanos Rodríguez', grandPrixName: 'Mexico City Grand Prix', totalLaps: 71, baseLapTimeSeconds: 78, overtakeDifficulty: 0.3, tyreDegradation: 0.7, rainProbability: 0.1, safetyCarProbability: 0.15, pitWindowStart: 18, pitWindowEnd: 53 },
  { id: 'interlagos', name: 'Autódromo José Carlos Pace', grandPrixName: 'São Paulo Grand Prix', totalLaps: 71, baseLapTimeSeconds: 71, overtakeDifficulty: 0.3, tyreDegradation: 0.55, rainProbability: 0.35, safetyCarProbability: 0.25, pitWindowStart: 18, pitWindowEnd: 53 },
  { id: 'yas_marina', name: 'Yas Marina Circuit', grandPrixName: 'Abu Dhabi Grand Prix', totalLaps: 58, baseLapTimeSeconds: 86, overtakeDifficulty: 0.4, tyreDegradation: 0.5, rainProbability: 0.01, safetyCarProbability: 0.12, pitWindowStart: 15, pitWindowEnd: 43 },
];

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

          this.io.emit('position_change', {
            overtaker: pos.driverName,
            overtaken: ahead.driverName,
            position: i,
            lap: this.raceState.currentLap,
          });
        }
      }
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
}
