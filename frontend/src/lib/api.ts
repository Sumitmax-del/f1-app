/* eslint-disable @typescript-eslint/no-explicit-any */
const API_BASE = process.env.NEXT_PUBLIC_API_URL || '/api';

async function fetchApi<T>(endpoint: string): Promise<T> {
  const res = await fetch(`${API_BASE}${endpoint}`, {
    cache: 'no-store',
  });
  if (!res.ok) {
    throw new Error(`API Error: ${res.status}`);
  }
  const json = await res.json();
  return json.data;
}

export async function getDrivers() {
  return fetchApi<any[]>('/drivers');
}

export async function getDriver(id: string) {
  return fetchApi<any>(`/drivers/${id}`);
}

export async function getTeams() {
  return fetchApi<any[]>('/teams');
}

export async function getTeam(id: string) {
  return fetchApi<any>(`/teams/${id}`);
}

export async function getDriverStandings() {
  return fetchApi<any[]>('/standings/drivers');
}

export async function getConstructorStandings() {
  return fetchApi<any[]>('/standings/constructors');
}

export async function getRaces() {
  return fetchApi<any[]>('/races');
}

export async function getNextRace() {
  return fetchApi<any>('/races/next');
}

export async function startRace(trackId?: string) {
  const res = await fetch(`${API_BASE}/live/start`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ trackId: trackId || 'monaco' }),
  });
  const json = await res.json();
  return json.data;
}

export async function stopRace() {
  const res = await fetch(`${API_BASE}/live/stop`, { method: 'POST' });
  const json = await res.json();
  return json;
}

export async function getLiveTracks() {
  return fetchApi<any[]>('/live/tracks');
}

export async function getLiveRaceStatus() {
  return fetchApi<any>('/live/status');
}

export async function getLiveRaceResults() {
  return fetchApi<any>('/live/race-results');
}

export { API_BASE };
