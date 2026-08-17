import { Driver, Team, Race, Standing, RaceResult } from '../types';

// Team colors for 2026 season
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
};

export const TEAM_NAMES: Record<string, string> = {
  'red_bull': 'Red Bull Racing',
  'mclaren': 'McLaren',
  'ferrari': 'Ferrari',
  'mercedes': 'Mercedes',
  'aston_martin': 'Aston Martin',
  'alpine': 'Alpine',
  'haas': 'Haas F1 Team',
  'rb': 'Racing Bulls',
  'sauber': 'Kick Sauber',
  'williams': 'Williams',
};

export const mockDrivers: Driver[] = [
  { driverId: 'max_verstappen', permanentNumber: '1', code: 'VER', givenName: 'Max', familyName: 'Verstappen', dateOfBirth: '1997-09-30', nationality: 'Dutch', url: '', team: { constructorId: 'red_bull', name: 'Red Bull Racing', nationality: 'Austrian', url: '', color: '#3671C6' }, points: 195, wins: 4, podiums: 7, position: 1 },
  { driverId: 'lando_norris', permanentNumber: '4', code: 'NOR', givenName: 'Lando', familyName: 'Norris', dateOfBirth: '1999-11-13', nationality: 'British', url: '', team: { constructorId: 'mclaren', name: 'McLaren', nationality: 'British', url: '', color: '#FF8000' }, points: 180, wins: 3, podiums: 8, position: 2 },
  { driverId: 'charles_leclerc', permanentNumber: '16', code: 'LEC', givenName: 'Charles', familyName: 'Leclerc', dateOfBirth: '1997-10-16', nationality: 'Monegasque', url: '', team: { constructorId: 'ferrari', name: 'Ferrari', nationality: 'Italian', url: '', color: '#E8002D' }, points: 168, wins: 3, podiums: 6, position: 3 },
  { driverId: 'oscar_piastri', permanentNumber: '81', code: 'PIA', givenName: 'Oscar', familyName: 'Piastri', dateOfBirth: '2001-04-06', nationality: 'Australian', url: '', team: { constructorId: 'mclaren', name: 'McLaren', nationality: 'British', url: '', color: '#FF8000' }, points: 155, wins: 2, podiums: 6, position: 4 },
  { driverId: 'lewis_hamilton', permanentNumber: '44', code: 'HAM', givenName: 'Lewis', familyName: 'Hamilton', dateOfBirth: '1985-01-07', nationality: 'British', url: '', team: { constructorId: 'ferrari', name: 'Ferrari', nationality: 'Italian', url: '', color: '#E8002D' }, points: 142, wins: 2, podiums: 5, position: 5 },
  { driverId: 'george_russell', permanentNumber: '63', code: 'RUS', givenName: 'George', familyName: 'Russell', dateOfBirth: '1998-02-15', nationality: 'British', url: '', team: { constructorId: 'mercedes', name: 'Mercedes', nationality: 'German', url: '', color: '#27F4D2' }, points: 120, wins: 1, podiums: 5, position: 6 },
  { driverId: 'carlos_sainz', permanentNumber: '55', code: 'SAI', givenName: 'Carlos', familyName: 'Sainz', dateOfBirth: '1994-09-01', nationality: 'Spanish', url: '', team: { constructorId: 'williams', name: 'Williams', nationality: 'British', url: '', color: '#64C4FF' }, points: 98, wins: 1, podiums: 4, position: 7 },
  { driverId: 'liam_lawson', permanentNumber: '30', code: 'LAW', givenName: 'Liam', familyName: 'Lawson', dateOfBirth: '2002-02-11', nationality: 'New Zealander', url: '', team: { constructorId: 'red_bull', name: 'Red Bull Racing', nationality: 'Austrian', url: '', color: '#3671C6' }, points: 88, wins: 0, podiums: 4, position: 8 },
  { driverId: 'fernando_alonso', permanentNumber: '14', code: 'ALO', givenName: 'Fernando', familyName: 'Alonso', dateOfBirth: '1981-07-29', nationality: 'Spanish', url: '', team: { constructorId: 'aston_martin', name: 'Aston Martin', nationality: 'British', url: '', color: '#229971' }, points: 72, wins: 0, podiums: 3, position: 9 },
  { driverId: 'kimi_antonelli', permanentNumber: '12', code: 'ANT', givenName: 'Kimi', familyName: 'Antonelli', dateOfBirth: '2006-08-25', nationality: 'Italian', url: '', team: { constructorId: 'mercedes', name: 'Mercedes', nationality: 'German', url: '', color: '#27F4D2' }, points: 68, wins: 0, podiums: 2, position: 10 },
  { driverId: 'pierre_gasly', permanentNumber: '10', code: 'GAS', givenName: 'Pierre', familyName: 'Gasly', dateOfBirth: '1996-02-07', nationality: 'French', url: '', team: { constructorId: 'alpine', name: 'Alpine', nationality: 'French', url: '', color: '#FF87BC' }, points: 52, wins: 0, podiums: 1, position: 11 },
  { driverId: 'nico_hulkenberg', permanentNumber: '27', code: 'HUL', givenName: 'Nico', familyName: 'Hülkenberg', dateOfBirth: '1987-08-19', nationality: 'German', url: '', team: { constructorId: 'sauber', name: 'Kick Sauber', nationality: 'Swiss', url: '', color: '#52E252' }, points: 42, wins: 0, podiums: 1, position: 12 },
  { driverId: 'yuki_tsunoda', permanentNumber: '22', code: 'TSU', givenName: 'Yuki', familyName: 'Tsunoda', dateOfBirth: '2000-05-11', nationality: 'Japanese', url: '', team: { constructorId: 'rb', name: 'Racing Bulls', nationality: 'Italian', url: '', color: '#6692FF' }, points: 38, wins: 0, podiums: 1, position: 13 },
  { driverId: 'lance_stroll', permanentNumber: '18', code: 'STR', givenName: 'Lance', familyName: 'Stroll', dateOfBirth: '1998-10-29', nationality: 'Canadian', url: '', team: { constructorId: 'aston_martin', name: 'Aston Martin', nationality: 'British', url: '', color: '#229971' }, points: 30, wins: 0, podiums: 0, position: 14 },
  { driverId: 'alexander_albon', permanentNumber: '23', code: 'ALB', givenName: 'Alexander', familyName: 'Albon', dateOfBirth: '1996-03-23', nationality: 'Thai', url: '', team: { constructorId: 'williams', name: 'Williams', nationality: 'British', url: '', color: '#64C4FF' }, points: 26, wins: 0, podiums: 0, position: 15 },
  { driverId: 'oliver_bearman', permanentNumber: '87', code: 'BEA', givenName: 'Oliver', familyName: 'Bearman', dateOfBirth: '2005-05-08', nationality: 'British', url: '', team: { constructorId: 'haas', name: 'Haas F1 Team', nationality: 'American', url: '', color: '#B6BABD' }, points: 22, wins: 0, podiums: 0, position: 16 },
  { driverId: 'esteban_ocon', permanentNumber: '31', code: 'OCO', givenName: 'Esteban', familyName: 'Ocon', dateOfBirth: '1996-09-17', nationality: 'French', url: '', team: { constructorId: 'haas', name: 'Haas F1 Team', nationality: 'American', url: '', color: '#B6BABD' }, points: 18, wins: 0, podiums: 0, position: 17 },
  { driverId: 'isack_hadjar', permanentNumber: '6', code: 'HAD', givenName: 'Isack', familyName: 'Hadjar', dateOfBirth: '2004-09-28', nationality: 'French', url: '', team: { constructorId: 'rb', name: 'Racing Bulls', nationality: 'Italian', url: '', color: '#6692FF' }, points: 14, wins: 0, podiums: 0, position: 18 },
  { driverId: 'jack_doohan', permanentNumber: '7', code: 'DOO', givenName: 'Jack', familyName: 'Doohan', dateOfBirth: '2003-01-20', nationality: 'Australian', url: '', team: { constructorId: 'alpine', name: 'Alpine', nationality: 'French', url: '', color: '#FF87BC' }, points: 8, wins: 0, podiums: 0, position: 19 },
  { driverId: 'gabriel_bortoleto', permanentNumber: '5', code: 'BOR', givenName: 'Gabriel', familyName: 'Bortoleto', dateOfBirth: '2004-10-14', nationality: 'Brazilian', url: '', team: { constructorId: 'sauber', name: 'Kick Sauber', nationality: 'Swiss', url: '', color: '#52E252' }, points: 5, wins: 0, podiums: 0, position: 20 },
];

export const mockTeams: Team[] = [
  { constructorId: 'mclaren', name: 'McLaren', nationality: 'British', url: '', color: '#FF8000', points: 335, position: 1, wins: 5 },
  { constructorId: 'ferrari', name: 'Ferrari', nationality: 'Italian', url: '', color: '#E8002D', points: 310, position: 2, wins: 5 },
  { constructorId: 'red_bull', name: 'Red Bull Racing', nationality: 'Austrian', url: '', color: '#3671C6', points: 283, position: 3, wins: 4 },
  { constructorId: 'mercedes', name: 'Mercedes', nationality: 'German', url: '', color: '#27F4D2', points: 188, position: 4, wins: 1 },
  { constructorId: 'williams', name: 'Williams', nationality: 'British', url: '', color: '#64C4FF', points: 124, position: 5, wins: 1 },
  { constructorId: 'aston_martin', name: 'Aston Martin', nationality: 'British', url: '', color: '#229971', points: 102, position: 6, wins: 0 },
  { constructorId: 'alpine', name: 'Alpine', nationality: 'French', url: '', color: '#FF87BC', points: 60, position: 7, wins: 0 },
  { constructorId: 'rb', name: 'Racing Bulls', nationality: 'Italian', url: '', color: '#6692FF', points: 52, position: 8, wins: 0 },
  { constructorId: 'haas', name: 'Haas F1 Team', nationality: 'American', url: '', color: '#B6BABD', points: 40, position: 9, wins: 0 },
  { constructorId: 'sauber', name: 'Kick Sauber', nationality: 'Swiss', url: '', color: '#52E252', points: 47, position: 10, wins: 0 },
];

export const mockRaces: Race[] = [
  { season: '2026', round: '1', raceName: 'Australian Grand Prix', circuitId: 'albert_park', circuitName: 'Albert Park Grand Prix Circuit', locality: 'Melbourne', country: 'Australia', date: '2026-03-15', time: '05:00:00Z', url: '' },
  { season: '2026', round: '2', raceName: 'Chinese Grand Prix', circuitId: 'shanghai', circuitName: 'Shanghai International Circuit', locality: 'Shanghai', country: 'China', date: '2026-03-22', time: '07:00:00Z', url: '' },
  { season: '2026', round: '3', raceName: 'Japanese Grand Prix', circuitId: 'suzuka', circuitName: 'Suzuka Circuit', locality: 'Suzuka', country: 'Japan', date: '2026-04-05', time: '05:00:00Z', url: '' },
  { season: '2026', round: '4', raceName: 'Bahrain Grand Prix', circuitId: 'bahrain', circuitName: 'Bahrain International Circuit', locality: 'Sakhir', country: 'Bahrain', date: '2026-04-12', time: '15:00:00Z', url: '' },
  { season: '2026', round: '5', raceName: 'Saudi Arabian Grand Prix', circuitId: 'jeddah', circuitName: 'Jeddah Corniche Circuit', locality: 'Jeddah', country: 'Saudi Arabia', date: '2026-04-19', time: '17:00:00Z', url: '' },
  { season: '2026', round: '6', raceName: 'Miami Grand Prix', circuitId: 'miami', circuitName: 'Miami International Autodrome', locality: 'Miami', country: 'USA', date: '2026-05-03', time: '20:00:00Z', url: '' },
  { season: '2026', round: '7', raceName: 'Emilia Romagna Grand Prix', circuitId: 'imola', circuitName: 'Autodromo Enzo e Dino Ferrari', locality: 'Imola', country: 'Italy', date: '2026-05-17', time: '13:00:00Z', url: '' },
  { season: '2026', round: '8', raceName: 'Monaco Grand Prix', circuitId: 'monaco', circuitName: 'Circuit de Monaco', locality: 'Monte-Carlo', country: 'Monaco', date: '2026-05-24', time: '13:00:00Z', url: '' },
  { season: '2026', round: '9', raceName: 'Spanish Grand Prix', circuitId: 'catalunya', circuitName: 'Circuit de Barcelona-Catalunya', locality: 'Montmeló', country: 'Spain', date: '2026-06-07', time: '13:00:00Z', url: '' },
  { season: '2026', round: '10', raceName: 'Belgian Grand Prix', circuitId: 'spa', circuitName: 'Circuit de Spa-Francorchamps', locality: 'Spa', country: 'Belgium', date: '2026-07-19', time: '13:00:00Z', url: '' },
  { season: '2026', round: '11', raceName: 'Hungarian Grand Prix', circuitId: 'hungaroring', circuitName: 'Hungaroring', locality: 'Budapest', country: 'Hungary', date: '2026-07-26', time: '13:00:00Z', url: '' },
  { season: '2026', round: '12', raceName: 'Dutch Grand Prix', circuitId: 'zandvoort', circuitName: 'Circuit Zandvoort', locality: 'Zandvoort', country: 'Netherlands', date: '2026-08-30', time: '13:00:00Z', url: '' },
  { season: '2026', round: '13', raceName: 'Italian Grand Prix', circuitId: 'monza', circuitName: 'Autodromo Nazionale di Monza', locality: 'Monza', country: 'Italy', date: '2026-09-06', time: '13:00:00Z', url: '' },
  { season: '2026', round: '14', raceName: 'Azerbaijan Grand Prix', circuitId: 'baku', circuitName: 'Baku City Circuit', locality: 'Baku', country: 'Azerbaijan', date: '2026-09-20', time: '11:00:00Z', url: '' },
  { season: '2026', round: '15', raceName: 'Singapore Grand Prix', circuitId: 'marina_bay', circuitName: 'Marina Bay Street Circuit', locality: 'Marina Bay', country: 'Singapore', date: '2026-10-04', time: '12:00:00Z', url: '' },
  { season: '2026', round: '16', raceName: 'United States Grand Prix', circuitId: 'americas', circuitName: 'Circuit of the Americas', locality: 'Austin', country: 'USA', date: '2026-10-18', time: '19:00:00Z', url: '' },
  { season: '2026', round: '17', raceName: 'Mexico City Grand Prix', circuitId: 'rodriguez', circuitName: 'Autódromo Hermanos Rodríguez', locality: 'Mexico City', country: 'Mexico', date: '2026-10-25', time: '20:00:00Z', url: '' },
  { season: '2026', round: '18', raceName: 'São Paulo Grand Prix', circuitId: 'interlagos', circuitName: 'Autódromo José Carlos Pace', locality: 'São Paulo', country: 'Brazil', date: '2026-11-08', time: '17:00:00Z', url: '' },
  { season: '2026', round: '19', raceName: 'Las Vegas Grand Prix', circuitId: 'las_vegas', circuitName: 'Las Vegas Strip Street Circuit', locality: 'Las Vegas', country: 'USA', date: '2026-11-21', time: '06:00:00Z', url: '' },
  { season: '2026', round: '20', raceName: 'Qatar Grand Prix', circuitId: 'losail', circuitName: 'Losail International Circuit', locality: 'Lusail', country: 'Qatar', date: '2026-11-29', time: '14:00:00Z', url: '' },
  { season: '2026', round: '21', raceName: 'Abu Dhabi Grand Prix', circuitId: 'yas_marina', circuitName: 'Yas Marina Circuit', locality: 'Abu Dhabi', country: 'UAE', date: '2026-12-06', time: '13:00:00Z', url: '' },
];

export const COUNTRY_FLAGS: Record<string, string> = {
  'Australia': '🇦🇺', 'China': '🇨🇳', 'Japan': '🇯🇵', 'Bahrain': '🇧🇭',
  'Saudi Arabia': '🇸🇦', 'USA': '🇺🇸', 'Italy': '🇮🇹', 'Monaco': '🇲🇨',
  'Spain': '🇪🇸', 'Canada': '🇨🇦', 'Austria': '🇦🇹', 'UK': '🇬🇧',
  'Belgium': '🇧🇪', 'Hungary': '🇭🇺', 'Netherlands': '🇳🇱',
  'Azerbaijan': '🇦🇿', 'Singapore': '🇸🇬', 'Mexico': '🇲🇽',
  'Brazil': '🇧🇷', 'Qatar': '🇶🇦', 'UAE': '🇦🇪',
  'Dutch': '🇳🇱', 'British': '🇬🇧', 'Monegasque': '🇲🇨', 'Australian': '🇦🇺',
  'French': '🇫🇷', 'German': '🇩🇪', 'Spanish': '🇪🇸', 'Canadian': '🇨🇦',
  'Thai': '🇹🇭', 'Japanese': '🇯🇵', 'Italian': '🇮🇹', 'New Zealander': '🇳🇿',
  'Brazilian': '🇧🇷',
};
