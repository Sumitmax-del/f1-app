// ═══════════════════════════════════════════════════════════════════════════════
// F1 22 TRACK REGISTRY
// Integer track ID → circuit structure mapping, sourced from the F1 22 UDP
// telemetry specification (PacketSessionData.m_trackId).
//
// Use this when ingesting live UDP data from F1 22 / F1 23 / F1 24 games.
// Pass the trackId directly from the UDP packet stream to getTrackStructure()
// and use the returned circuitId to look up geometry/data in the rest of the app.
//
// How to extend:
//   - Add newer tracks: append entries below, assigning the next sequential ID
//     or matching the official Codemasters UDP spec for that game version.
//   - Legacy IDs (Hockenheim, Sepang, Jerez, Sochi): kept as placeholders to
//     preserve ID alignment with original game spec.
// ═══════════════════════════════════════════════════════════════════════════════

import { getTrackById, TrackData } from './trackData';

// ─── F1 22 track structure (mirrors Python dict schema exactly) ───────────────

export interface F1_22TrackStructure {
  /** F1 22 integer trackId */
  trackId: number;
  /** Human-readable city/venue name as used in the game UI */
  name: string;
  /** Country name */
  country: string;
  /** Circuit length in metres (from FIA homologation, F1 22 UDP spec) */
  length_meters: number;
  /** Total turn count as per official FIA layout */
  total_turns: number;
  /**
   * Matching circuitId in our trackData / trackGeometry system.
   * null for legacy placeholder tracks no longer on the F1 calendar.
   */
  circuitId: string | null;
  /** True for tracks that are no longer on the current F1 calendar. */
  isLegacy: boolean;
}

// ─── Registry (ID 0–31, matching F1 22 UDP spec) ─────────────────────────────

export const F1_22_TRACK_CONFIGS: Record<number, F1_22TrackStructure> = {
  0:  { trackId: 0,  name: 'Melbourne',          country: 'Australia',    length_meters: 5278, total_turns: 14, circuitId: 'albert_park',   isLegacy: false },
  1:  { trackId: 1,  name: 'Paul Ricard',         country: 'France',       length_meters: 5842, total_turns: 15, circuitId: null,            isLegacy: true  },
  2:  { trackId: 2,  name: 'Shanghai',            country: 'China',        length_meters: 5451, total_turns: 16, circuitId: 'shanghai',      isLegacy: false },
  3:  { trackId: 3,  name: 'Sakhir',              country: 'Bahrain',      length_meters: 5412, total_turns: 15, circuitId: 'bahrain',       isLegacy: false },
  4:  { trackId: 4,  name: 'Catalunya',           country: 'Spain',        length_meters: 4657, total_turns: 14, circuitId: 'catalunya',     isLegacy: false },
  5:  { trackId: 5,  name: 'Monaco',              country: 'Monaco',       length_meters: 3337, total_turns: 19, circuitId: 'monaco',        isLegacy: false },
  6:  { trackId: 6,  name: 'Montreal',            country: 'Canada',       length_meters: 4361, total_turns: 14, circuitId: 'villeneuve',    isLegacy: false },
  7:  { trackId: 7,  name: 'Silverstone',         country: 'UK',           length_meters: 5891, total_turns: 18, circuitId: 'silverstone',   isLegacy: false },
  8:  { trackId: 8,  name: 'Hockenheim',          country: 'Germany',      length_meters: 4574, total_turns: 17, circuitId: null,            isLegacy: true  },
  9:  { trackId: 9,  name: 'Hungaroring',         country: 'Hungary',      length_meters: 4381, total_turns: 14, circuitId: 'hungaroring',   isLegacy: false },
  10: { trackId: 10, name: 'Spa',                 country: 'Belgium',      length_meters: 7004, total_turns: 19, circuitId: 'spa',           isLegacy: false },
  11: { trackId: 11, name: 'Monza',               country: 'Italy',        length_meters: 5793, total_turns: 11, circuitId: 'monza',         isLegacy: false },
  12: { trackId: 12, name: 'Singapore',           country: 'Singapore',    length_meters: 5063, total_turns: 23, circuitId: 'marina_bay',    isLegacy: false },
  13: { trackId: 13, name: 'Suzuka',              country: 'Japan',        length_meters: 5807, total_turns: 18, circuitId: 'suzuka',        isLegacy: false },
  14: { trackId: 14, name: 'Sepang',              country: 'Malaysia',     length_meters: 5543, total_turns: 15, circuitId: null,            isLegacy: true  },
  15: { trackId: 15, name: 'Austin',              country: 'USA',          length_meters: 5513, total_turns: 20, circuitId: 'americas',      isLegacy: false },
  16: { trackId: 16, name: 'Interlagos',          country: 'Brazil',       length_meters: 4309, total_turns: 15, circuitId: 'interlagos',    isLegacy: false },
  17: { trackId: 17, name: 'Jerez',               country: 'Spain',        length_meters: 4428, total_turns: 13, circuitId: null,            isLegacy: true  },
  18: { trackId: 18, name: 'Rodriguez',           country: 'Mexico',       length_meters: 4304, total_turns: 17, circuitId: 'rodriguez',     isLegacy: false },
  19: { trackId: 19, name: 'Yas Marina',          country: 'Abu Dhabi',    length_meters: 5281, total_turns: 16, circuitId: 'yas_marina',    isLegacy: false },
  20: { trackId: 20, name: 'Austin Short',        country: 'USA',          length_meters: 3797, total_turns: 11, circuitId: null,            isLegacy: true  },
  21: { trackId: 21, name: 'Silverstone Short',   country: 'UK',           length_meters: 2638, total_turns: 10, circuitId: null,            isLegacy: true  },
  22: { trackId: 22, name: 'Subang Short',        country: 'Malaysia',     length_meters: 2721, total_turns: 9,  circuitId: null,            isLegacy: true  },
  23: { trackId: 23, name: 'Sakhir Short',        country: 'Bahrain',      length_meters: 3543, total_turns: 9,  circuitId: null,            isLegacy: true  },
  24: { trackId: 24, name: 'Red Bull Ring',       country: 'Austria',      length_meters: 4318, total_turns: 10, circuitId: 'red_bull_ring', isLegacy: false },
  25: { trackId: 25, name: 'Sochi',               country: 'Russia',       length_meters: 5848, total_turns: 18, circuitId: null,            isLegacy: true  },
  26: { trackId: 26, name: 'Baku',                country: 'Azerbaijan',   length_meters: 6003, total_turns: 20, circuitId: 'baku',          isLegacy: false },
  27: { trackId: 27, name: 'Zandvoort',           country: 'Netherlands',  length_meters: 4259, total_turns: 14, circuitId: 'zandvoort',     isLegacy: false },
  28: { trackId: 28, name: 'Imola',               country: 'Italy',        length_meters: 4909, total_turns: 19, circuitId: 'imola',         isLegacy: false },
  29: { trackId: 29, name: 'Portimao',            country: 'Portugal',     length_meters: 4653, total_turns: 15, circuitId: null,            isLegacy: true  },
  30: { trackId: 30, name: 'Jeddah',              country: 'Saudi Arabia', length_meters: 6174, total_turns: 27, circuitId: 'jeddah',        isLegacy: false },
  31: { trackId: 31, name: 'Miami',               country: 'USA',          length_meters: 5412, total_turns: 19, circuitId: 'miami',         isLegacy: false },
};

// ─── Fallback for unknown track IDs ──────────────────────────────────────────

const UNKNOWN_TRACK: F1_22TrackStructure = {
  trackId: -1,
  name: 'Unknown Track',
  country: 'Unknown',
  length_meters: 0,
  total_turns: 0,
  circuitId: null,
  isLegacy: false,
};

// ═══════════════════════════════════════════════════════════════════════════════
// PUBLIC API
// ═══════════════════════════════════════════════════════════════════════════════

/**
 * Returns the F1 22 track structure for a given integer trackId.
 * Pass the trackId directly from the F1 22 UDP packet stream to sync data.
 *
 * @param trackId  Integer from PacketSessionData.m_trackId (0–31)
 * @returns        F1_22TrackStructure, or an "Unknown Track" placeholder
 */
export function getTrackStructure(trackId: number): F1_22TrackStructure {
  return F1_22_TRACK_CONFIGS[trackId] ?? UNKNOWN_TRACK;
}

/**
 * Returns the app's full TrackData object for a given F1 22 integer trackId.
 * Bridges the UDP integer ID world with the app's string-based circuitId system.
 *
 * @param trackId  Integer from PacketSessionData.m_trackId (0–31)
 * @returns        Full TrackData (with UI/simulation fields) or undefined for legacy tracks
 */
export function getTrackDataByF1_22Id(trackId: number): TrackData | undefined {
  const entry = getTrackStructure(trackId);
  if (!entry.circuitId) return undefined;
  return getTrackById(entry.circuitId);
}

/**
 * Resolves a string circuitId to its F1 22 integer trackId.
 * Useful when sending a track selection back to a game-linked UDP listener.
 *
 * @param circuitId  String circuit ID (e.g. 'albert_park', 'monaco')
 * @returns          Integer F1 22 trackId, or -1 if not found
 */
export function getF1_22IdByCircuitId(circuitId: string): number {
  const entry = Object.values(F1_22_TRACK_CONFIGS).find(e => e.circuitId === circuitId);
  return entry ? entry.trackId : -1;
}

/**
 * Returns all active (non-legacy) tracks from the F1 22 registry
 * that have a matching circuitId in the app's track system.
 */
export function getActiveF1_22Tracks(): F1_22TrackStructure[] {
  return Object.values(F1_22_TRACK_CONFIGS).filter(t => !t.isLegacy && t.circuitId !== null);
}

/**
 * Returns all legacy track placeholders (tracks that appeared in F1 22
 * but are no longer on the F1 calendar).
 */
export function getLegacyF1_22Tracks(): F1_22TrackStructure[] {
  return Object.values(F1_22_TRACK_CONFIGS).filter(t => t.isLegacy);
}

/**
 * Validates that a given F1 22 integer trackId maps to a known, active circuit.
 * Use this to guard against stale or out-of-bounds UDP data.
 */
export function isValidF1_22TrackId(trackId: number): boolean {
  const entry = F1_22_TRACK_CONFIGS[trackId];
  return !!entry && !entry.isLegacy && entry.circuitId !== null;
}

// ─── Sync helper for live race page ──────────────────────────────────────────

/**
 * Given a live race's string trackId (as used by the simulator), returns the
 * F1 22 structure data to enrich the live race display with authoritative
 * circuit length and turn count from the UDP spec.
 *
 * Falls back gracefully if the circuit isn't in the F1 22 registry.
 *
 * @param circuitId  String circuitId (e.g. from useRaceSimulation().trackId)
 * @returns          F1_22TrackStructure or null
 */
export function getLiveRaceTrackStructure(circuitId: string): F1_22TrackStructure | null {
  const entry = Object.values(F1_22_TRACK_CONFIGS).find(e => e.circuitId === circuitId);
  return entry ?? null;
}
