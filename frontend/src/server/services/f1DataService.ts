import { cacheGet, cacheSet } from './cache';
import { mockDrivers, mockTeams, mockRaces, TEAM_COLORS, COUNTRY_FLAGS } from '../data/mockData';
import { Driver, Team, Race, Standing } from '../types';

const API_BASE = 'https://api.jolpi.ca/ergast/f1';

async function fetchWithCache<T>(key: string, fetcher: () => Promise<T>, ttl = 300): Promise<T> {
  const cached = cacheGet<T>(key);
  if (cached) {
    console.log(`[CACHE HIT] ${key}`);
    return cached;
  }
  console.log(`[CACHE MISS] ${key} — fetching from API`);
  try {
    const data = await fetcher();
    cacheSet(key, data, ttl);
    return data;
  } catch (err) {
    console.error(`[API ERROR] ${key}:`, err);
    throw err;
  }
}

// Rate limiting - max 4 requests per second
let lastRequestTime = 0;
async function rateLimitedFetch(url: string): Promise<any> {
  const now = Date.now();
  const timeSinceLastRequest = now - lastRequestTime;
  if (timeSinceLastRequest < 250) {
    await new Promise(resolve => setTimeout(resolve, 250 - timeSinceLastRequest));
  }
  lastRequestTime = Date.now();

  const response = await fetch(url);
  if (!response.ok) {
    throw new Error(`API request failed: ${response.status} ${response.statusText}`);
  }
  return response.json();
}

export async function getDriverStandings(): Promise<Standing[]> {
  return fetchWithCache('driver_standings', async () => {
    try {
      const data = await rateLimitedFetch(`${API_BASE}/current/driverStandings.json`);
      const standings = data.MRData.StandingsTable.StandingsLists[0]?.DriverStandings || [];

      return standings.map((s: any) => ({
        position: s.position,
        points: s.points,
        wins: s.wins,
        driver: {
          driverId: s.Driver.driverId,
          permanentNumber: s.Driver.permanentNumber || '0',
          code: s.Driver.code || s.Driver.driverId.substring(0, 3).toUpperCase(),
          givenName: s.Driver.givenName,
          familyName: s.Driver.familyName,
          dateOfBirth: s.Driver.dateOfBirth,
          nationality: s.Driver.nationality,
          url: s.Driver.url,
          team: s.Constructors[0] ? {
            constructorId: s.Constructors[0].constructorId,
            name: s.Constructors[0].name,
            nationality: s.Constructors[0].nationality,
            url: s.Constructors[0].url,
            color: TEAM_COLORS[s.Constructors[0].constructorId] || '#666666'
          } : undefined,
          points: parseFloat(s.points),
          wins: parseInt(s.wins),
          position: parseInt(s.position)
        }
      }));
    } catch {
      // Fallback to mock data
      return mockDrivers.map(d => ({
        position: String(d.position),
        points: String(d.points),
        wins: String(d.wins),
        driver: d
      }));
    }
  });
}

export async function getConstructorStandings(): Promise<Standing[]> {
  return fetchWithCache('constructor_standings', async () => {
    try {
      const data = await rateLimitedFetch(`${API_BASE}/current/constructorStandings.json`);
      const standings = data.MRData.StandingsTable.StandingsLists[0]?.ConstructorStandings || [];

      return standings.map((s: any) => ({
        position: s.position,
        points: s.points,
        wins: s.wins,
        team: {
          constructorId: s.Constructor.constructorId,
          name: s.Constructor.name,
          nationality: s.Constructor.nationality,
          url: s.Constructor.url,
          color: TEAM_COLORS[s.Constructor.constructorId] || '#666666',
          points: parseFloat(s.points),
          position: parseInt(s.position),
          wins: parseInt(s.wins)
        }
      }));
    } catch {
      return mockTeams.map(t => ({
        position: String(t.position),
        points: String(t.points),
        wins: String(t.wins),
        team: t
      }));
    }
  });
}

export async function getDrivers(): Promise<Driver[]> {
  return fetchWithCache('all_drivers', async () => {
    try {
      const standings = await getDriverStandings();
      return standings.map(s => ({
        ...s.driver!,
        points: parseFloat(s.points),
        wins: parseInt(s.wins),
        position: parseInt(s.position)
      }));
    } catch {
      return mockDrivers;
    }
  });
}

export async function getDriverById(driverId: string): Promise<Driver | undefined> {
  const drivers = await getDrivers();
  return drivers.find(d => d.driverId === driverId);
}

export async function getTeams(): Promise<Team[]> {
  return fetchWithCache('all_teams', async () => {
    try {
      const standings = await getConstructorStandings();
      const drivers = await getDrivers();

      return standings.map(s => ({
        ...s.team!,
        drivers: drivers.filter(d => d.team?.constructorId === s.team?.constructorId)
      }));
    } catch {
      return mockTeams.map(t => ({
        ...t,
        drivers: mockDrivers.filter(d => d.team?.constructorId === t.constructorId)
      }));
    }
  });
}

export async function getTeamById(teamId: string): Promise<Team | undefined> {
  const teams = await getTeams();
  return teams.find(t => t.constructorId === teamId);
}

export async function getRaces(): Promise<Race[]> {
  return fetchWithCache('all_races', async () => {
    try {
      const data = await rateLimitedFetch(`${API_BASE}/current.json`);
      const races = data.MRData.RaceTable.Races || [];

      return races.map((r: any) => ({
        season: r.season,
        round: r.round,
        raceName: r.raceName,
        circuitId: r.Circuit.circuitId,
        circuitName: r.Circuit.circuitName,
        locality: r.Circuit.Location.locality,
        country: r.Circuit.Location.country,
        date: r.date,
        time: r.time || '13:00:00Z',
        url: r.url
      }));
    } catch {
      return mockRaces;
    }
  });
}

export async function getRaceByRound(round: string): Promise<Race | undefined> {
  const races = await getRaces();
  return races.find(r => r.round === round);
}

export { COUNTRY_FLAGS, TEAM_COLORS };
