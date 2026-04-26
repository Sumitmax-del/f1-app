const API_BASE = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000/api';

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

export async function startRace() {
  const res = await fetch(`${API_BASE}/live/start`, { method: 'POST' });
  const json = await res.json();
  return json.data;
}

export async function stopRace() {
  const res = await fetch(`${API_BASE}/live/stop`, { method: 'POST' });
  const json = await res.json();
  return json;
}

export async function getRaceStatus() {
  return fetchApi<any>('/live/status');
}

export { API_BASE };
