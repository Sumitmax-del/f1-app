// ═══════════════════════════════════════════════════════
// Mock Race Feed Data — Preview all UI states without live data
// ═══════════════════════════════════════════════════════

import {
  PracticeResult,
  QualifyingResult,
  PostRaceResult,
  PodiumFinisher,
  EnhancedRaceEvent,
  WinProbability,
  LivePosition,
} from '@/types';

// ── Driver Base Data (matches server mockDrivers) ────────────────────────────

interface DriverSeed {
  driverId: string;
  code: string;
  givenName: string;
  familyName: string;
  team: string;
  teamColor: string;
  nationality: string;
  number: string;
  basePace: number; // lower = faster
}

const DRIVER_SEEDS: DriverSeed[] = [
  { driverId: 'max_verstappen', code: 'VER', givenName: 'Max', familyName: 'Verstappen', team: 'Red Bull Racing', teamColor: '#3671C6', nationality: 'Dutch', number: '1', basePace: 0 },
  { driverId: 'lando_norris', code: 'NOR', givenName: 'Lando', familyName: 'Norris', team: 'McLaren', teamColor: '#FF8000', nationality: 'British', number: '4', basePace: 0.1 },
  { driverId: 'charles_leclerc', code: 'LEC', givenName: 'Charles', familyName: 'Leclerc', team: 'Ferrari', teamColor: '#E8002D', nationality: 'Monegasque', number: '16', basePace: 0.15 },
  { driverId: 'oscar_piastri', code: 'PIA', givenName: 'Oscar', familyName: 'Piastri', team: 'McLaren', teamColor: '#FF8000', nationality: 'Australian', number: '81', basePace: 0.2 },
  { driverId: 'lewis_hamilton', code: 'HAM', givenName: 'Lewis', familyName: 'Hamilton', team: 'Ferrari', teamColor: '#E8002D', nationality: 'British', number: '44', basePace: 0.22 },
  { driverId: 'george_russell', code: 'RUS', givenName: 'George', familyName: 'Russell', team: 'Mercedes', teamColor: '#27F4D2', nationality: 'British', number: '63', basePace: 0.3 },
  { driverId: 'carlos_sainz', code: 'SAI', givenName: 'Carlos', familyName: 'Sainz', team: 'Williams', teamColor: '#64C4FF', nationality: 'Spanish', number: '55', basePace: 0.35 },
  { driverId: 'liam_lawson', code: 'LAW', givenName: 'Liam', familyName: 'Lawson', team: 'Red Bull Racing', teamColor: '#3671C6', nationality: 'New Zealander', number: '30', basePace: 0.4 },
  { driverId: 'fernando_alonso', code: 'ALO', givenName: 'Fernando', familyName: 'Alonso', team: 'Aston Martin', teamColor: '#229971', nationality: 'Spanish', number: '14', basePace: 0.5 },
  { driverId: 'kimi_antonelli', code: 'ANT', givenName: 'Kimi', familyName: 'Antonelli', team: 'Mercedes', teamColor: '#27F4D2', nationality: 'Italian', number: '12', basePace: 0.55 },
  { driverId: 'pierre_gasly', code: 'GAS', givenName: 'Pierre', familyName: 'Gasly', team: 'Alpine', teamColor: '#FF87BC', nationality: 'French', number: '10', basePace: 0.7 },
  { driverId: 'nico_hulkenberg', code: 'HUL', givenName: 'Nico', familyName: 'Hülkenberg', team: 'Kick Sauber', teamColor: '#52E252', nationality: 'German', number: '27', basePace: 0.75 },
  { driverId: 'yuki_tsunoda', code: 'TSU', givenName: 'Yuki', familyName: 'Tsunoda', team: 'Racing Bulls', teamColor: '#6692FF', nationality: 'Japanese', number: '22', basePace: 0.8 },
  { driverId: 'lance_stroll', code: 'STR', givenName: 'Lance', familyName: 'Stroll', team: 'Aston Martin', teamColor: '#229971', nationality: 'Canadian', number: '18', basePace: 0.85 },
  { driverId: 'alexander_albon', code: 'ALB', givenName: 'Alexander', familyName: 'Albon', team: 'Williams', teamColor: '#64C4FF', nationality: 'Thai', number: '23', basePace: 0.9 },
  { driverId: 'oliver_bearman', code: 'BEA', givenName: 'Oliver', familyName: 'Bearman', team: 'Haas F1 Team', teamColor: '#B6BABD', nationality: 'British', number: '87', basePace: 0.95 },
  { driverId: 'esteban_ocon', code: 'OCO', givenName: 'Esteban', familyName: 'Ocon', team: 'Haas F1 Team', teamColor: '#B6BABD', nationality: 'French', number: '31', basePace: 1.0 },
  { driverId: 'isack_hadjar', code: 'HAD', givenName: 'Isack', familyName: 'Hadjar', team: 'Racing Bulls', teamColor: '#6692FF', nationality: 'French', number: '6', basePace: 1.05 },
  { driverId: 'jack_doohan', code: 'DOO', givenName: 'Jack', familyName: 'Doohan', team: 'Alpine', teamColor: '#FF87BC', nationality: 'Australian', number: '7', basePace: 1.1 },
  { driverId: 'gabriel_bortoleto', code: 'BOR', givenName: 'Gabriel', familyName: 'Bortoleto', team: 'Kick Sauber', teamColor: '#52E252', nationality: 'Brazilian', number: '5', basePace: 1.15 },
];

// ── Helpers ──────────────────────────────────────────────────────────────────

function formatLapTime(seconds: number): string {
  const min = Math.floor(seconds / 60);
  const sec = seconds % 60;
  return `${min}:${sec.toFixed(3).padStart(6, '0')}`;
}

function formatSector(seconds: number): string {
  return seconds.toFixed(3);
}

/** Seeded shuffle with slight variance — keeps order roughly consistent but imperfect */
function shuffleSlightly<T>(arr: T[], variance: number = 0.3): T[] {
  const result = [...arr];
  for (let i = result.length - 1; i > 0; i--) {
    if (Math.random() < variance) {
      const j = Math.max(0, i - Math.floor(Math.random() * 3));
      [result[i], result[j]] = [result[j], result[i]];
    }
  }
  return result;
}

// ═══════════════════════════════════════════════════════
// PRE-RACE: Free Practice Results
// ═══════════════════════════════════════════════════════

function generatePracticeResults(session: string, baseLapTime: number = 91): PracticeResult[] {
  const shuffled = shuffleSlightly(DRIVER_SEEDS, session === 'FP1' ? 0.5 : session === 'FP2' ? 0.4 : 0.3);
  const leaderTime = baseLapTime + (session === 'FP1' ? 1.5 : session === 'FP2' ? 0.8 : 0.3);

  return shuffled.map((d, i) => {
    const lapTime = leaderTime + d.basePace + Math.random() * 0.4;
    const s1 = lapTime / 3 - 2 + Math.random() * 0.3;
    const s2 = lapTime / 3 + Math.random() * 0.3;
    const s3 = lapTime / 3 + 2 + Math.random() * 0.3;

    return {
      position: i + 1,
      driverId: d.driverId,
      driverName: `${d.givenName} ${d.familyName}`,
      driverCode: d.code,
      team: d.team,
      teamColor: d.teamColor,
      bestLapTime: formatLapTime(lapTime),
      gap: i === 0 ? '-' : `+${(lapTime - leaderTime - shuffled[0].basePace).toFixed(3)}`,
      sector1: formatSector(s1),
      sector2: formatSector(s2),
      sector3: formatSector(s3),
      laps: 15 + Math.floor(Math.random() * 15),
    };
  });
}

export const mockFP1Results = generatePracticeResults('FP1');
export const mockFP2Results = generatePracticeResults('FP2');
export const mockFP3Results = generatePracticeResults('FP3');

// ═══════════════════════════════════════════════════════
// PRE-RACE: Qualifying Results
// ═══════════════════════════════════════════════════════

export function generateQualifyingResults(baseLapTime: number = 89): QualifyingResult[] {
  const sorted = [...DRIVER_SEEDS].sort((a, b) => a.basePace - b.basePace);

  return sorted.map((d, i) => {
    const q1Time = baseLapTime + d.basePace + Math.random() * 0.3;
    const q2Time = i < 15 ? baseLapTime - 0.3 + d.basePace + Math.random() * 0.3 : 0;
    const q3Time = i < 10 ? baseLapTime - 0.6 + d.basePace + Math.random() * 0.2 : 0;

    return {
      position: i + 1,
      driverId: d.driverId,
      driverName: `${d.givenName} ${d.familyName}`,
      driverCode: d.code,
      team: d.team,
      teamColor: d.teamColor,
      q1Time: formatLapTime(q1Time),
      q2Time: q2Time > 0 ? formatLapTime(q2Time) : '-',
      q3Time: q3Time > 0 ? formatLapTime(q3Time) : '-',
      eliminated: i >= 15 ? 'Q1' : i >= 10 ? 'Q2' : null,
      gridPosition: i + 1,
    };
  });
}

export const mockQualifyingResults = generateQualifyingResults();

// ═══════════════════════════════════════════════════════
// LIVE: Initial Race State (for mock preview)
// ═══════════════════════════════════════════════════════

export function generateMockLivePositions(lap: number = 25): LivePosition[] {
  const shuffled = shuffleSlightly(DRIVER_SEEDS, 0.35);
  const tires: Array<'soft' | 'medium' | 'hard'> = ['medium', 'hard', 'soft'];
  let cumulativeGap = 0;

  return shuffled.map((d, i) => {
    const gap = i === 0 ? 0 : 0.5 + Math.random() * 2.5;
    cumulativeGap += gap;
    const tireAge = 5 + Math.floor(Math.random() * 20);

    return {
      position: i + 1,
      driverId: d.driverId,
      driverName: `${d.givenName} ${d.familyName}`,
      driverCode: d.code,
      team: d.team,
      teamColor: d.teamColor,
      gap: i === 0 ? 'LEADER' : `+${cumulativeGap.toFixed(3)}`,
      interval: i === 0 ? '-' : `+${gap.toFixed(3)}`,
      lastLapTime: formatLapTime(91 + d.basePace + Math.random() * 0.5),
      bestLapTime: formatLapTime(90.5 + d.basePace),
      tire: tires[i % 3],
      tireAge,
      pitStops: lap > 20 ? (i < 15 ? 1 : 0) : 0,
      status: i === 7 ? 'pit' as const : 'racing' as const,
      drs: i > 0 && i < 5 && Math.random() > 0.5,
      sector1: formatSector(29 + Math.random() * 1.5),
      sector2: formatSector(30 + Math.random() * 1.5),
      sector3: formatSector(31 + Math.random() * 1.5),
    };
  });
}

// ═══════════════════════════════════════════════════════
// LIVE: Win Probability Calculator
// ═══════════════════════════════════════════════════════

export function calculateWinProbabilities(
  positions: LivePosition[],
  currentLap: number,
  totalLaps: number
): WinProbability[] {
  const racing = positions.filter(p => p.status !== 'retired');
  const top = racing.slice(0, 8);

  if (top.length === 0) return [];

  const lapsRemaining = Math.max(1, totalLaps - currentLap);
  const raceProgress = currentLap / totalLaps;

  const rawScores = top.map(p => {
    const positionScore = Math.max(0, 25 - (p.position - 1) * 4);
    const gapPenalty = p.gap === 'LEADER' ? 0 : Math.min(20, parseFloat(p.gap.replace('+', '')) * 0.8);
    const tireFreshness = Math.max(0, (30 - p.tireAge) / 30) * 5;
    const pitAdvantage = p.pitStops > 0 && raceProgress > 0.4 ? 3 : 0;
    const lateRaceBonus = raceProgress > 0.7 && p.position <= 3 ? (4 - p.position) * 5 : 0;

    return Math.max(1, positionScore - gapPenalty + tireFreshness + pitAdvantage + lateRaceBonus);
  });

  const totalScore = rawScores.reduce((sum, s) => sum + s, 0);

  return top.map((p, i) => ({
    driverId: p.driverId,
    driverName: p.driverName,
    driverCode: p.driverCode,
    team: p.team,
    teamColor: p.teamColor,
    probability: Math.round((rawScores[i] / totalScore) * 1000) / 10,
    position: p.position,
  })).sort((a, b) => b.probability - a.probability).slice(0, 5);
}

// ═══════════════════════════════════════════════════════
// LIVE: Mock Event Feed
// ═══════════════════════════════════════════════════════

export const mockRaceEvents: EnhancedRaceEvent[] = [
  { id: 'e1', type: 'start', message: 'LIGHTS OUT AND AWAY WE GO! Race has started.', lap: 1, timestamp: Date.now() - 50000 },
  { id: 'e2', type: 'overtake', message: 'NOR overtakes VER for P1 at Turn 4!', lap: 3, timestamp: Date.now() - 44000, driverId: 'lando_norris', driverCode: 'NOR', teamColor: '#FF8000' },
  { id: 'e3', type: 'drs_enabled', message: 'DRS enabled from Lap 3.', lap: 3, timestamp: Date.now() - 43000 },
  { id: 'e4', type: 'fastest_lap', message: '⚡ LEC sets fastest lap — 1:30.456', lap: 5, timestamp: Date.now() - 40000, driverId: 'charles_leclerc', driverCode: 'LEC', teamColor: '#E8002D' },
  { id: 'e5', type: 'team_radio', message: '📻 VER: "I\'m losing the rear in the slow corners."', lap: 7, timestamp: Date.now() - 36000, driverId: 'max_verstappen', driverCode: 'VER', teamColor: '#3671C6' },
  { id: 'e6', type: 'pit', message: '🔧 HAM pits from P5 — Soft → Hard — 2.4s stop', lap: 12, timestamp: Date.now() - 30000, driverId: 'lewis_hamilton', driverCode: 'HAM', teamColor: '#E8002D' },
  { id: 'e7', type: 'yellow_flag', message: '🟡 Yellow flag at Turn 11 — debris on track', lap: 15, timestamp: Date.now() - 25000 },
  { id: 'e8', type: 'green_flag', message: '🟢 Track clear. Green flag resumed.', lap: 15, timestamp: Date.now() - 23000 },
  { id: 'e9', type: 'investigation', message: '⚠️ PIA under investigation — exceeding track limits Turn 9', lap: 18, timestamp: Date.now() - 20000, driverId: 'oscar_piastri', driverCode: 'PIA', teamColor: '#FF8000' },
  { id: 'e10', type: 'overtake', message: 'LEC overtakes PIA for P3 with DRS on the main straight!', lap: 20, timestamp: Date.now() - 16000, driverId: 'charles_leclerc', driverCode: 'LEC', teamColor: '#E8002D' },
  { id: 'e11', type: 'safety_car', message: '🟡 SAFETY CAR DEPLOYED — incident at Turn 6', lap: 22, timestamp: Date.now() - 12000 },
  { id: 'e12', type: 'pit', message: '🔧 Multiple cars pit under Safety Car — VER, NOR, RUS pit together', lap: 23, timestamp: Date.now() - 10000 },
  { id: 'e13', type: 'green_flag', message: '🟢 Safety Car in — RACING RESUMES at Lap 25', lap: 25, timestamp: Date.now() - 6000 },
  { id: 'e14', type: 'fastest_lap', message: '⚡ NOR takes fastest lap — 1:30.112', lap: 26, timestamp: Date.now() - 3000, driverId: 'lando_norris', driverCode: 'NOR', teamColor: '#FF8000' },
  { id: 'e15', type: 'team_radio', message: '📻 LEC: "Box box box, box this lap."', lap: 28, timestamp: Date.now() - 1000, driverId: 'charles_leclerc', driverCode: 'LEC', teamColor: '#E8002D' },
];

// ═══════════════════════════════════════════════════════
// POST-RACE: Results & Podium
// ═══════════════════════════════════════════════════════

const POINTS_TABLE = [25, 18, 15, 12, 10, 8, 6, 4, 2, 1, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0];

export function generatePostRaceResults(): PostRaceResult[] {
  const sorted = shuffleSlightly(DRIVER_SEEDS, 0.35);
  const baseTotalTime = 5400; // ~1h30m

  return sorted.map((d, i) => {
    const gapSeconds = i === 0 ? 0 : 2 + i * 3.5 + Math.random() * 8;
    const isDNF = i === 17 || i === 19; // 2 retirements
    const gridPos = DRIVER_SEEDS.findIndex(s => s.driverId === d.driverId) + 1;

    return {
      position: isDNF ? 20 : i + 1,
      driverId: d.driverId,
      driverName: `${d.givenName} ${d.familyName}`,
      driverCode: d.code,
      team: d.team,
      teamColor: d.teamColor,
      lapsCompleted: isDNF ? 30 + Math.floor(Math.random() * 20) : 57,
      totalTime: isDNF ? 'DNF' : i === 0 ? formatLapTime(baseTotalTime) : `+${gapSeconds.toFixed(3)}`,
      gap: i === 0 ? '-' : isDNF ? 'DNF' : `+${gapSeconds.toFixed(3)}`,
      pitStops: isDNF ? 0 : 1 + Math.floor(Math.random() * 2),
      fastestLap: formatLapTime(90 + d.basePace + Math.random() * 0.5),
      fastestLapRank: i + 1,
      gridPosition: gridPos,
      positionsGained: gridPos - (i + 1),
      status: isDNF ? 'dnf' : 'finished',
      points: isDNF ? 0 : (POINTS_TABLE[i] || 0),
    };
  });
}

export const mockPostRaceResults = generatePostRaceResults();

export function generatePodiumFinishers(results: PostRaceResult[]): PodiumFinisher[] {
  if (!results || results.length === 0) return [];
  const finished = results.filter(r => r.status === 'finished').sort((a, b) => a.position - b.position);
  if (finished.length === 0) return [];
  
  const top3 = finished.slice(0, 3);
  
  let fastestLapDriver = finished[0];
  finished.forEach(curr => {
    if (curr.status === 'dnf' || curr.fastestLap === '-' || !curr.fastestLap) return;
    if (fastestLapDriver.fastestLap === '-' || !fastestLapDriver.fastestLap) {
      fastestLapDriver = curr;
      return;
    }
    try {
      const prevParts = fastestLapDriver.fastestLap.split(':');
      const currParts = curr.fastestLap.split(':');
      const prevTime = parseFloat(prevParts[0]) * 60 + parseFloat(prevParts[1]);
      const currTime = parseFloat(currParts[0]) * 60 + parseFloat(currParts[1]);
      if (!isNaN(currTime) && !isNaN(prevTime) && currTime < prevTime) {
        fastestLapDriver = curr;
      }
    } catch (e) {
      // Ignore conversion failures
    }
  });

  return top3.map((r, i) => {
    const seed = DRIVER_SEEDS.find(d => d.driverId === r.driverId)!;
    return {
      position: (i + 1) as 1 | 2 | 3,
      driverId: r.driverId,
      driverName: r.driverName,
      driverCode: r.driverCode,
      team: r.team,
      teamColor: r.teamColor,
      totalTime: r.totalTime,
      hasFastestLap: fastestLapDriver.driverId === r.driverId,
      nationality: seed.nationality,
      driverNumber: seed.number,
    };
  });
}

export const mockPodiumFinishers = generatePodiumFinishers(mockPostRaceResults);

// ═══════════════════════════════════════════════════════
// Mock Race Schedule (for countdown timer)
// ═══════════════════════════════════════════════════════

export const mockNextRace = {
  raceName: 'Hungarian Grand Prix',
  circuitName: 'Hungaroring',
  country: 'Hungary',
  countryFlag: '🇭🇺',
  locality: 'Budapest',
  trackId: 'hungaroring',
  timezone: 'Europe/Budapest',
  // Race start: July 26, 2026 at 13:00 UTC
  raceStart: '2026-07-26T13:00:00Z',
  sessions: {
    fp1: '2026-07-24T11:30:00Z',
    fp2: '2026-07-24T15:00:00Z',
    fp3: '2026-07-25T10:30:00Z',
    qualifying: '2026-07-25T14:00:00Z',
    race: '2026-07-26T13:00:00Z',
  },
};
