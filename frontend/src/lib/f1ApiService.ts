// ═══════════════════════════════════════════════════════════════════════════════
// F1 API Service Layer — Dual-Source Architecture
//
// OpenF1 (api.openf1.org)  → Live telemetry, positions, intervals, GPS, flags
// Jolpica (api.jolpi.ca)   → Historical results, qualifying, season calendar
//
// All fetch methods return `null` on failure instead of throwing, allowing
// callers to implement graceful fallback chains.
// ═══════════════════════════════════════════════════════════════════════════════

const OPENF1_BASE = 'https://api.openf1.org/v1';
const JOLPICA_BASE = 'https://api.jolpi.ca/ergast/f1';

// ─── Interfaces ──────────────────────────────────────────────────────────────

export interface OpenF1Driver {
  driver_number: number;
  broadcast_name: string;
  full_name: string;
  name_acronym: string;
  team_name: string;
  team_color: string;
  headshot_url?: string;
  session_key?: number;
}

export interface OpenF1Session {
  session_key: number;
  session_name: string;
  session_type: string;
  date_start: string;
  date_end: string;
  meeting_key: number;
  circuit_key: number;
  circuit_short_name: string;
  country_name: string;
  location: string;
  year: number;
}

export interface OpenF1Location {
  date: string;
  driver_number: number;
  x: number;
  y: number;
}

export interface OpenF1Position {
  date: string;
  driver_number: number;
  position: number;
  meeting_key?: number;
  session_key?: number;
}

export interface OpenF1Interval {
  date: string;
  driver_number: number;
  gap_to_leader: number | string | null;
  interval: number | string | null;
  session_key?: number;
  meeting_key?: number;
}

export interface OpenF1Lap {
  driver_number: number;
  lap_number: number;
  lap_duration: number | null;
  duration_sector_1: number | null;
  duration_sector_2: number | null;
  duration_sector_3: number | null;
  i1_speed: number | null;
  i2_speed: number | null;
  is_pit_out_lap: boolean;
  date_start?: string;
  session_key?: number;
}

export interface OpenF1Stint {
  driver_number: number;
  stint_number: number;
  compound: 'SOFT' | 'MEDIUM' | 'HARD' | 'INTERMEDIATE' | 'WET' | string;
  lap_start: number;
  lap_end: number;
  tyre_age_at_start?: number;
  session_key?: number;
}

export interface OpenF1Pit {
  date: string;
  driver_number: number;
  lap_number: number;
  pit_duration: number;
  session_key?: number;
}

export interface OpenF1RaceControl {
  date: string;
  lap_number: number;
  category: string;
  message: string;
  flag: 'YELLOW' | 'DOUBLE YELLOW' | 'GREEN' | 'RED' | 'CLEAR' | string | null;
  session_key?: number;
}

// Jolpica race result (Ergast-format)
export interface JolpicaRaceResult {
  position: string;
  number: string;
  Driver: {
    driverId: string;
    code: string;
    givenName: string;
    familyName: string;
  };
  Constructor: {
    constructorId: string;
    name: string;
  };
  grid: string;
  laps: string;
  status: string;
  Time?: { millis: string; time: string };
  FastestLap?: {
    rank: string;
    lap: string;
    Time: { time: string };
  };
}

// ─── Cache Layer ─────────────────────────────────────────────────────────────

const fetchCache: Record<string, { data: any; timestamp: number }> = {};
const CACHE_TTL_STATIC = 300_000;  // 5 min for sessions, drivers, calendar
const CACHE_TTL_LIVE = 5_000;      // 5 sec for live telemetry

// ─── Robust Fetch Wrapper ────────────────────────────────────────────────────

/**
 * Fetches JSON from a URL with optional caching.
 * Returns `null` on any HTTP or network error instead of throwing,
 * so callers can implement fallback chains.
 */
async function safeFetch<T>(
  url: string,
  cacheTtl: number | false = CACHE_TTL_STATIC
): Promise<T | null> {
  try {
    // Check cache
    if (cacheTtl !== false) {
      const cached = fetchCache[url];
      if (cached && Date.now() - cached.timestamp < cacheTtl) {
        return cached.data;
      }
    }

    const res = await fetch(url);

    if (!res.ok) {
      if (res.status === 429) {
        console.error(`[F1 API] Rate limited (429): ${url}`);
      } else {
        console.error(`[F1 API] HTTP ${res.status} ${res.statusText}: ${url}`);
      }
      return null;
    }

    const data: T = await res.json();

    if (cacheTtl !== false) {
      fetchCache[url] = { data, timestamp: Date.now() };
    }

    return data;
  } catch (err) {
    console.error(`[F1 API] Network error for ${url}:`, err);
    return null;
  }
}

// ═════════════════════════════════════════════════════════════════════════════
// OpenF1 API Methods
// ═════════════════════════════════════════════════════════════════════════════

/** Fetch sessions by year and name. */
export async function getSessions(
  year: number,
  sessionName = 'Race'
): Promise<OpenF1Session[]> {
  const url = `${OPENF1_BASE}/sessions?year=${year}&session_name=${encodeURIComponent(sessionName)}`;
  return (await safeFetch<OpenF1Session[]>(url)) ?? [];
}

/** Resolve the current/latest session key dynamically. */
export async function getLatestSessionKey(
  sessionName = 'Race'
): Promise<number | null> {
  const url = `${OPENF1_BASE}/sessions?meeting_key=latest&session_name=${encodeURIComponent(sessionName)}`;
  const sessions = await safeFetch<OpenF1Session[]>(url);
  if (!sessions || sessions.length === 0) return null;
  return sessions[sessions.length - 1].session_key;
}

/** Fetch drivers for a session. */
export async function getDrivers(sessionKey: number): Promise<OpenF1Driver[]> {
  const url = `${OPENF1_BASE}/drivers?session_key=${sessionKey}`;
  return (await safeFetch<OpenF1Driver[]>(url)) ?? [];
}

/** Fetch positions (optionally up to a timestamp). */
export async function getPositions(
  sessionKey: number,
  dateStr?: string
): Promise<OpenF1Position[]> {
  const datePart = dateStr ? `&date<=${dateStr}` : '';
  const url = `${OPENF1_BASE}/position?session_key=${sessionKey}${datePart}`;
  return (await safeFetch<OpenF1Position[]>(url, CACHE_TTL_LIVE)) ?? [];
}

/** Fetch intervals (gap_to_leader + interval) for a session. */
export async function getIntervals(
  sessionKey: number,
  dateStr?: string
): Promise<OpenF1Interval[]> {
  const datePart = dateStr ? `&date<=${dateStr}` : '';
  const url = `${OPENF1_BASE}/intervals?session_key=${sessionKey}${datePart}`;
  return (await safeFetch<OpenF1Interval[]>(url, CACHE_TTL_LIVE)) ?? [];
}

/** Fetch location coordinates within a time window. */
export async function getLocations(
  sessionKey: number,
  startTime: string,
  endTime: string
): Promise<OpenF1Location[]> {
  const url = `${OPENF1_BASE}/location?session_key=${sessionKey}&date>=${startTime}&date<=${endTime}`;
  return (await safeFetch<OpenF1Location[]>(url, false)) ?? [];
}

/** Fetch all laps data for a session. */
export async function getLaps(sessionKey: number): Promise<OpenF1Lap[]> {
  const url = `${OPENF1_BASE}/laps?session_key=${sessionKey}`;
  return (await safeFetch<OpenF1Lap[]>(url, CACHE_TTL_LIVE)) ?? [];
}

/** Fetch stints (tyre compounds). */
export async function getStints(sessionKey: number): Promise<OpenF1Stint[]> {
  const url = `${OPENF1_BASE}/stints?session_key=${sessionKey}`;
  return (await safeFetch<OpenF1Stint[]>(url, CACHE_TTL_LIVE)) ?? [];
}

/** Fetch pit stop records. */
export async function getPits(sessionKey: number): Promise<OpenF1Pit[]> {
  const url = `${OPENF1_BASE}/pit?session_key=${sessionKey}`;
  return (await safeFetch<OpenF1Pit[]>(url, CACHE_TTL_LIVE)) ?? [];
}

/** Fetch race control messages. */
export async function getRaceControl(
  sessionKey: number
): Promise<OpenF1RaceControl[]> {
  const url = `${OPENF1_BASE}/race_control?session_key=${sessionKey}`;
  return (await safeFetch<OpenF1RaceControl[]>(url, CACHE_TTL_LIVE)) ?? [];
}

// ═════════════════════════════════════════════════════════════════════════════
// Jolpica (Ergast) Fallback Methods
// ═════════════════════════════════════════════════════════════════════════════

/** Fetch the latest race results from Jolpica. */
export async function getJolpicaRaceResults(
  year = 2026
): Promise<JolpicaRaceResult[]> {
  const url = `${JOLPICA_BASE}/${year}/last/results.json`;
  const data = await safeFetch<any>(url);
  if (!data) return [];
  try {
    return data.MRData.RaceTable.Races[0]?.Results ?? [];
  } catch {
    console.error('[Jolpica] Failed to parse race results response');
    return [];
  }
}

/** Fetch qualifying results from Jolpica. */
export async function getJolpicaQualifying(
  year = 2026
): Promise<any[]> {
  const url = `${JOLPICA_BASE}/${year}/last/qualifying.json`;
  const data = await safeFetch<any>(url);
  if (!data) return [];
  try {
    return data.MRData.RaceTable.Races[0]?.QualifyingResults ?? [];
  } catch {
    console.error('[Jolpica] Failed to parse qualifying results response');
    return [];
  }
}

/** Fetch the full season calendar from Jolpica. */
export async function getJolpicaCalendar(
  year = 2026
): Promise<any[]> {
  const url = `${JOLPICA_BASE}/${year}.json`;
  const data = await safeFetch<any>(url);
  if (!data) return [];
  try {
    return data.MRData.RaceTable.Races ?? [];
  } catch {
    console.error('[Jolpica] Failed to parse calendar response');
    return [];
  }
}

// ═════════════════════════════════════════════════════════════════════════════
// Data Aggregation Utilities (Pure Functions)
// ═════════════════════════════════════════════════════════════════════════════

/**
 * Groups `/v1/position` records by driver_number and returns
 * the latest position per driver, sorted by position (1 → 20).
 */
export function extractLatestPositions(
  records: OpenF1Position[]
): Record<number, number> {
  const latest: Record<number, { date: string; position: number }> = {};

  for (const r of records) {
    const existing = latest[r.driver_number];
    if (!existing || r.date > existing.date) {
      latest[r.driver_number] = { date: r.date, position: r.position };
    }
  }

  const result: Record<number, number> = {};
  for (const [num, val] of Object.entries(latest)) {
    result[Number(num)] = val.position;
  }
  return result;
}

/**
 * Groups `/v1/intervals` records by driver_number and returns
 * the latest gap_to_leader + interval per driver.
 * String values like "+1 LAP" are passed through directly.
 */
export function extractLatestIntervals(
  records: OpenF1Interval[]
): Record<number, { gap_to_leader: number | string | null; interval: number | string | null }> {
  const latest: Record<number, { date: string; gap_to_leader: number | string | null; interval: number | string | null }> = {};

  for (const r of records) {
    const existing = latest[r.driver_number];
    if (!existing || r.date > existing.date) {
      latest[r.driver_number] = {
        date: r.date,
        gap_to_leader: r.gap_to_leader,
        interval: r.interval,
      };
    }
  }

  const result: Record<number, { gap_to_leader: number | string | null; interval: number | string | null }> = {};
  for (const [num, val] of Object.entries(latest)) {
    result[Number(num)] = {
      gap_to_leader: val.gap_to_leader,
      interval: val.interval,
    };
  }
  return result;
}

/**
 * Calculates tyre age for a driver at a given lap:
 *   tyre_age = current_lap - stint.lap_start + 1
 * Falls back to 1 if no matching stint is found.
 */
export function calculateTyreAge(
  stints: OpenF1Stint[],
  currentLap: number,
  driverNumber: number
): { compound: string; age: number } {
  const driverStints = stints
    .filter(s => s.driver_number === driverNumber)
    .sort((a, b) => a.stint_number - b.stint_number);

  // Find the stint containing the current lap
  const activeStint = driverStints.find(
    s => currentLap >= s.lap_start && currentLap <= s.lap_end
  );

  if (activeStint) {
    return {
      compound: activeStint.compound.toLowerCase(),
      age: currentLap - activeStint.lap_start + 1,
    };
  }

  // Fallback: use the last known stint
  const lastStint = driverStints[driverStints.length - 1];
  if (lastStint) {
    return {
      compound: lastStint.compound.toLowerCase(),
      age: Math.max(1, currentLap - lastStint.lap_start + 1),
    };
  }

  return { compound: 'medium', age: 1 };
}

/**
 * Formats a gap/interval value for display:
 *   number  → "+X.XXX"
 *   string  → pass-through (e.g. "+1 LAP")
 *   null    → "-"
 *   0       → "LEADER" (for position 1)
 */
export function formatGap(
  value: number | string | null,
  isLeader = false
): string {
  if (isLeader) return 'LEADER';
  if (value === null || value === undefined) return '-';
  if (typeof value === 'string') return value;
  if (value === 0) return '-';
  return `+${value.toFixed(3)}`;
}

/**
 * Formats a duration in seconds to F1 timing format (M:SS.mmm or SS.mmm).
 */
export function formatLapDuration(seconds: number | null): string {
  if (seconds === null || seconds === undefined) return '-';
  const min = Math.floor(seconds / 60);
  const sec = seconds % 60;
  return min > 0
    ? `${min}:${sec.toFixed(3).padStart(6, '0')}`
    : sec.toFixed(3);
}

/**
 * Determines the UI session state based on session start/end vs current time.
 *   pre-race  → current_date < session_start
 *   live      → session_start <= current_date <= session_end
 *   post-race → current_date > session_end
 */
export function resolveSessionState(
  dateStart: string,
  dateEnd: string,
  now = new Date()
): 'pre-race' | 'live' | 'post-race' {
  const start = new Date(dateStart);
  const end = new Date(dateEnd);
  if (now < start) return 'pre-race';
  if (now > end) return 'post-race';
  return 'live';
}

/**
 * Formats a UTC date string to the viewer's local time.
 */
export function formatToLocalTime(
  utcString: string,
  options?: Intl.DateTimeFormatOptions
): string {
  const date = new Date(utcString);
  return new Intl.DateTimeFormat(undefined, {
    hour: '2-digit',
    minute: '2-digit',
    hour12: false,
    ...options,
  }).format(date);
}

/**
 * Formats a UTC date string to a specific timezone.
 */
export function formatToTimezone(
  utcString: string,
  timeZone: string,
  options?: Intl.DateTimeFormatOptions
): string {
  const date = new Date(utcString);
  return new Intl.DateTimeFormat(undefined, {
    hour: '2-digit',
    minute: '2-digit',
    hour12: false,
    timeZone,
    ...options,
  }).format(date);
}
