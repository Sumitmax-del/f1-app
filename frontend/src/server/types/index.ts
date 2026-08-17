export interface Driver {
  driverId: string;
  permanentNumber: string;
  code: string;
  givenName: string;
  familyName: string;
  dateOfBirth: string;
  nationality: string;
  url: string;
  team?: Team;
  points?: number;
  wins?: number;
  podiums?: number;
  position?: number;
}

export interface Team {
  constructorId: string;
  name: string;
  nationality: string;
  url: string;
  color: string;
  points?: number;
  position?: number;
  wins?: number;
  drivers?: Driver[];
}

export interface Race {
  season: string;
  round: string;
  raceName: string;
  circuitId: string;
  circuitName: string;
  locality: string;
  country: string;
  date: string;
  time?: string;
  url: string;
  results?: RaceResult[];
}

export interface RaceResult {
  position: string;
  driverId: string;
  driverName: string;
  team: string;
  teamColor: string;
  laps: string;
  time?: string;
  status: string;
  points: string;
  grid: string;
  fastestLap?: {
    rank: string;
    lap: string;
    time: string;
  };
}

export interface Standing {
  position: string;
  points: string;
  wins: string;
  driver?: Driver;
  team?: Team;
}

export type WeatherCondition = 'dry' | 'light_rain' | 'heavy_rain';

export interface LiveRaceState {
  isActive: boolean;
  currentLap: number;
  totalLaps: number;
  raceName: string;
  trackId: string;
  positions: LivePosition[];
  fastestLap: { driverId: string; time: string } | null;
  status: 'not_started' | 'racing' | 'finished' | 'safety_car';
  weather: WeatherCondition;
}

export interface LivePosition {
  position: number;
  driverId: string;
  driverName: string;
  driverCode: string;
  team: string;
  teamColor: string;
  gap: string;
  interval: string;
  lastLapTime: string;
  bestLapTime: string;
  tire: 'soft' | 'medium' | 'hard' | 'intermediate' | 'wet';
  tireAge: number;
  pitStops: number;
  status: 'racing' | 'retired' | 'pit';
  drs: boolean;
  sector1: string;
  sector2: string;
  sector3: string;
  x?: number;
  y?: number;
}

export interface User {
  id: string;
  username: string;
  email: string;
  password: string;
  favoriteDriver?: string;
  favoriteTeam?: string;
}
