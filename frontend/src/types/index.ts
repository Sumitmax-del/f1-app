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
  flag?: string;
  isPast?: boolean;
  isNext?: boolean;
}

export interface Standing {
  position: string;
  points: string;
  wins: string;
  driver?: Driver;
  team?: Team;
}

export interface LivePosition {
  position: number;
  driverId: string;
  driverName: string;
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
}

export interface LiveRaceState {
  isActive: boolean;
  currentLap: number;
  totalLaps: number;
  raceName: string;
  positions: LivePosition[];
  fastestLap: { driverId: string; time: string } | null;
  status: 'not_started' | 'racing' | 'finished' | 'safety_car';
}

export interface ApiResponse<T> {
  success: boolean;
  data: T;
  error?: string;
}

export const TEAM_COLORS: Record<string, string> = {
  'red_bull': '#3671C6',
  'mclaren': '#FF8000',
  'ferrari': '#E8002D',
  'mercedes': '#27F4D2',
  'aston_martin': '#229971',
  'alpine': '#FF87BC',
  'haas': '#B6BABD',
  'rb': '#6692FF',
  'sauber': '#52E252',
  'williams': '#64C4FF',
  'Red Bull Racing': '#3671C6',
  'McLaren': '#FF8000',
  'Ferrari': '#E8002D',
  'Mercedes': '#27F4D2',
  'Aston Martin': '#229971',
  'Alpine': '#FF87BC',
  'Haas F1 Team': '#B6BABD',
  'Racing Bulls': '#6692FF',
  'Kick Sauber': '#52E252',
  'Williams': '#64C4FF',
};

export const NATIONALITY_FLAGS: Record<string, string> = {
  'Dutch': '🇳🇱', 'British': '🇬🇧', 'Monegasque': '🇲🇨', 'Australian': '🇦🇺',
  'French': '🇫🇷', 'German': '🇩🇪', 'Spanish': '🇪🇸', 'Canadian': '🇨🇦',
  'Thai': '🇹🇭', 'Japanese': '🇯🇵', 'Italian': '🇮🇹', 'New Zealander': '🇳🇿',
  'Brazilian': '🇧🇷', 'Finnish': '🇫🇮', 'Mexican': '🇲🇽', 'Danish': '🇩🇰',
  'Chinese': '🇨🇳',
  'Australia': '🇦🇺', 'China': '🇨🇳', 'Japan': '🇯🇵', 'Bahrain': '🇧🇭',
  'Saudi Arabia': '🇸🇦', 'USA': '🇺🇸', 'Italy': '🇮🇹', 'Monaco': '🇲🇨',
  'Spain': '🇪🇸', 'Canada': '🇨🇦', 'Austria': '🇦🇹', 'UK': '🇬🇧',
  'Belgium': '🇧🇪', 'Hungary': '🇭🇺', 'Netherlands': '🇳🇱',
  'Azerbaijan': '🇦🇿', 'Singapore': '🇸🇬', 'Mexico': '🇲🇽',
  'Brazil': '🇧🇷', 'Qatar': '🇶🇦', 'UAE': '🇦🇪',
};
