import { Server as SocketIOServer } from 'socket.io';
import { LiveRaceState, LivePosition } from '../types';
import { mockDrivers } from '../data/mockData';

const TIRE_TYPES = ['soft', 'medium', 'hard'] as const;
const TIRE_COLORS: Record<string, string> = {
  soft: '#FF3333',
  medium: '#FFC300',
  hard: '#FFFFFF',
  intermediate: '#43B02A',
  wet: '#0072C6'
};

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

  constructor(io: SocketIOServer) {
    this.io = io;
    this.raceState = this.getDefaultState();
  }

  private getDefaultState(): LiveRaceState {
    return {
      isActive: false,
      currentLap: 0,
      totalLaps: 57,
      raceName: 'Monaco Grand Prix',
      trackId: '',
      positions: [],
      fastestLap: null,
      status: 'not_started',
      weather: 'dry'
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

    return drivers.map((driver, index) => {
      // Base lap time varies by team strength (position)
      const baseLapTime = 78 + (index * 0.15) + Math.random() * 0.5;
      this.baseLapTimes.set(driver.driverId, baseLapTime);

      const startingTire = index < 10 ? 'soft' : 'medium';

      return {
        position: index + 1,
        driverId: driver.driverId,
        driverName: `${driver.givenName} ${driver.familyName}`,
        driverCode: driver.code,
        team: driver.team?.name || 'Unknown',
        teamColor: driver.team?.color || '#666666',
        gap: index === 0 ? 'LEADER' : `+${(index * 1.2 + Math.random() * 0.5).toFixed(3)}`,
        interval: index === 0 ? '-' : `+${(0.3 + Math.random() * 1.5).toFixed(3)}`,
        lastLapTime: '-',
        bestLapTime: '-',
        tire: startingTire as any,
        tireAge: 0,
        pitStops: 0,
        status: 'racing',
        drs: false,
        sector1: '-',
        sector2: '-',
        sector3: '-'
      };
    });
  }

  startRace(trackId = ''): LiveRaceState {
    if (this.raceState.isActive) {
      return this.raceState;
    }

    this.raceState = {
      ...this.getDefaultState(),
      isActive: true,
      status: 'racing',
      trackId: trackId || 'monaco',
      positions: this.initializePositions()
    };

    this.io.emit('race_start', {
      raceName: this.raceState.raceName,
      totalLaps: this.raceState.totalLaps,
      trackId: this.raceState.trackId,
      weather: this.raceState.weather,
      positions: this.raceState.positions
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

    // Safety car chance (3%)
    if (Math.random() < 0.03 && this.raceState.status !== 'safety_car') {
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
    let cumulativeGap = 0;

    // Update each position
    this.raceState.positions.forEach((pos, index) => {
      if (pos.status === 'retired') return;

      pos.tireAge++;

      // Pit stop logic
      const shouldPit = this.shouldPitStop(pos, this.raceState.currentLap, this.raceState.totalLaps);
      if (shouldPit) {
        pos.status = 'pit';
        pos.pitStops++;
        pos.tire = this.getNextTire(pos.tire);
        pos.tireAge = 0;
        this.io.emit('pit_stop', {
          driverId: pos.driverId,
          driverName: pos.driverName,
          lap: this.raceState.currentLap,
          newTire: pos.tire,
          pitStops: pos.pitStops
        });
        // Pit stop costs ~3 seconds
        setTimeout(() => { pos.status = 'racing'; }, 1000);
      }

      // Retirement chance (0.3%)
      if (Math.random() < 0.003 && this.raceState.currentLap > 5) {
        pos.status = 'retired';
        this.io.emit('retirement', {
          driverId: pos.driverId,
          driverName: pos.driverName,
          lap: this.raceState.currentLap
        });
        return;
      }

      // Generate lap time
      const baseLapTime = this.baseLapTimes.get(pos.driverId) || 80;
      const tireDeg = pos.tireAge * (pos.tire === 'soft' ? 0.04 : pos.tire === 'medium' ? 0.025 : 0.015);
      const pitPenalty = pos.status === 'pit' ? 20 : 0;
      const safetyCarPenalty = isSafetyCar ? 15 : 0;
      const actualLapTime = baseLapTime + tireDeg + pitPenalty + safetyCarPenalty + (Math.random() - 0.5) * 0.8;

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

      // DRS detection
      if (index > 0) {
        const aheadInterval = this.raceState.positions[index - 1]?.interval || '2';
        const gapToAhead = aheadInterval === '-' ? 99 : parseFloat(aheadInterval.replace('+', '')) || 2;
        pos.drs = gapToAhead < 1.0 && !isSafetyCar;
      }

      // Calculate gaps — safely parse previous gap, guarding against 'LEADER' or any non-numeric string
      if (index === 0) {
        pos.gap = 'LEADER';
        pos.interval = '-';
        cumulativeGap = 0;
      } else {
        const prevGapStr = this.raceState.positions[index - 1]?.gap ?? 'LEADER';
        const prevGap = prevGapStr === 'LEADER' ? 0 : (parseFloat(prevGapStr.replace('+', '')) || 0);
        const incrementGap = 0.3 + Math.random() * 1.2 + (pos.status === 'pit' ? 20 : 0);
        cumulativeGap = prevGap + incrementGap;
        pos.gap = `+${cumulativeGap.toFixed(3)}`;
        const intervalSec = cumulativeGap - prevGap;
        pos.interval = `+${Math.abs(intervalSec).toFixed(3)}`;
      }
    });

    // Position changes (overtakes)
    if (!isSafetyCar) {
      for (let i = 1; i < this.raceState.positions.length; i++) {
        const pos = this.raceState.positions[i];
        const ahead = this.raceState.positions[i - 1];
        if (pos.status !== 'racing' || ahead.status !== 'racing') continue;

        const overtakeChance = pos.drs ? 0.08 : 0.03;
        if (Math.random() < overtakeChance) {
          // Swap positions
          [this.raceState.positions[i], this.raceState.positions[i - 1]] = [this.raceState.positions[i - 1], this.raceState.positions[i]];
          this.raceState.positions[i - 1].position = i;
          this.raceState.positions[i].position = i + 1;

          this.io.emit('position_change', {
            overtaker: pos.driverName,
            overtaken: ahead.driverName,
            position: i,
            lap: this.raceState.currentLap
          });
        }
      }
    }

    // Update positions
    this.raceState.positions.forEach((p, i) => { p.position = i + 1; });

    // Emit lap update — include weather and trackId so the frontend stays fully in sync
    this.io.emit('lap_update', {
      currentLap: this.raceState.currentLap,
      totalLaps: this.raceState.totalLaps,
      positions: this.raceState.positions,
      fastestLap: this.raceState.fastestLap,
      status: this.raceState.status,
      weather: this.raceState.weather,
      trackId: this.raceState.trackId
    });
  }

  private parseLapTime(timeStr: string): number {
    if (timeStr === '-') return Infinity;
    const parts = timeStr.split(':');
    return parseFloat(parts[0]) * 60 + parseFloat(parts[1]);
  }

  private shouldPitStop(pos: LivePosition, currentLap: number, totalLaps: number): boolean {
    if (pos.status === 'pit' || pos.pitStops >= 2) return false;
    if (currentLap < 10 || currentLap > totalLaps - 5) return false;

    // One-stop strategy around lap 25-35, two-stop has second around 40-45
    if (pos.pitStops === 0 && pos.tireAge > 18 + Math.floor(Math.random() * 8)) return true;
    if (pos.pitStops === 1 && pos.tire === 'soft' && pos.tireAge > 15 + Math.floor(Math.random() * 5)) return true;

    return false;
  }

  private getNextTire(current: string): 'soft' | 'medium' | 'hard' {
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
      winner: this.raceState.positions[0]
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
}
