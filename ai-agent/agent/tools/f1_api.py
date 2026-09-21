"""
F1 Data Tools — Jolpica (Ergast) API
=====================================
Provides live and historical F1 data via the Jolpica API.
All functions return plain strings for injection into LLM prompts.
Includes TTL caching and graceful timeout handling.
"""

import time
import httpx
from typing import Optional

# ═══════════════════════════════════════════════════════════════════════════════
# Configuration
# ═══════════════════════════════════════════════════════════════════════════════

JOLPICA_BASE = "https://api.jolpi.ca/ergast/f1"
REQUEST_TIMEOUT = 3.0  # seconds

# ═══════════════════════════════════════════════════════════════════════════════
# TTL Cache
# ═══════════════════════════════════════════════════════════════════════════════

_cache: dict[str, tuple[float, str]] = {}


def _cache_get(key: str) -> str | None:
    entry = _cache.get(key)
    if entry and time.monotonic() < entry[0]:
        return entry[1]
    return None


def _cache_set(key: str, data: str, ttl: int) -> None:
    _cache[key] = (time.monotonic() + ttl, data)


# ═══════════════════════════════════════════════════════════════════════════════
# HTTP Client
# ═══════════════════════════════════════════════════════════════════════════════

async def _fetch(url: str) -> dict | None:
    """Fetch JSON from URL with timeout. Returns None on failure."""
    try:
        async with httpx.AsyncClient(timeout=REQUEST_TIMEOUT) as client:
            res = await client.get(url)
            if res.status_code != 200:
                return None
            return res.json()
    except Exception:
        return None


# ═══════════════════════════════════════════════════════════════════════════════
# Tools — Live Data
# ═══════════════════════════════════════════════════════════════════════════════

async def get_driver_standings() -> str:
    """Fetch current F1 driver championship standings (top 20)."""
    cached = _cache_get("driver_standings")
    if cached:
        return cached

    data = await _fetch(f"{JOLPICA_BASE}/current/driverStandings.json")
    if not data:
        return "Unable to fetch live driver standings right now."

    try:
        standings = data["MRData"]["StandingsTable"]["StandingsLists"][0]["DriverStandings"]
        lines = []
        for s in standings[:20]:
            d = s["Driver"]
            team = s["Constructors"][0]["name"] if s.get("Constructors") else "Unknown"
            lines.append(
                f"P{s['position']}. {d['givenName']} {d['familyName']} "
                f"({team}) — {s['points']} pts, {s['wins']} wins"
            )
        result = "\n".join(lines)
        _cache_set("driver_standings", result, 60)
        return result
    except (KeyError, IndexError):
        return "Driver standings data format unexpected."


async def get_constructor_standings() -> str:
    """Fetch current F1 constructor/team championship standings."""
    cached = _cache_get("constructor_standings")
    if cached:
        return cached

    data = await _fetch(f"{JOLPICA_BASE}/current/constructorStandings.json")
    if not data:
        return "Unable to fetch live constructor standings right now."

    try:
        standings = data["MRData"]["StandingsTable"]["StandingsLists"][0]["ConstructorStandings"]
        lines = []
        for s in standings[:10]:
            c = s["Constructor"]
            lines.append(
                f"P{s['position']}. {c['name']} — {s['points']} pts ({s['wins']} wins)"
            )
        result = "\n".join(lines)
        _cache_set("constructor_standings", result, 60)
        return result
    except (KeyError, IndexError):
        return "Constructor standings data format unexpected."


async def get_next_race() -> str:
    """Fetch the next upcoming F1 race."""
    cached = _cache_get("next_race")
    if cached:
        return cached

    data = await _fetch(f"{JOLPICA_BASE}/current.json")
    if not data:
        return "Unable to fetch race schedule right now."

    try:
        from datetime import datetime, timezone
        races = data["MRData"]["RaceTable"]["Races"]
        now = datetime.now(timezone.utc)

        for race in races:
            try:
                time_str = race.get("time", "14:00:00Z").replace("Z", "+00:00")
                dt = datetime.fromisoformat(f"{race['date']}T{time_str}")
                if dt > now:
                    circuit = race.get("Circuit", {})
                    loc = circuit.get("Location", {})
                    result = (
                        f"Next Race: {race['raceName']} (Round {race['round']})\n"
                        f"Date: {race['date']} at {race.get('time', 'TBD')}\n"
                        f"Circuit: {circuit.get('circuitName', 'TBD')}\n"
                        f"Location: {loc.get('locality', '')}, {loc.get('country', '')}"
                    )
                    _cache_set("next_race", result, 300)
                    return result
            except (ValueError, TypeError):
                continue
        return "No upcoming races found — the season may be over."
    except (KeyError, IndexError):
        return "Race schedule data format unexpected."


async def get_last_race_results() -> str:
    """Fetch results from the most recent completed F1 race."""
    cached = _cache_get("last_race_results")
    if cached:
        return cached

    data = await _fetch(f"{JOLPICA_BASE}/current/last/results.json")
    if not data:
        return "Unable to fetch last race results right now."

    try:
        race = data["MRData"]["RaceTable"]["Races"][0]
        lines = [
            f"{race['raceName']} — {race.get('date', '')}",
            f"Circuit: {race['Circuit']['circuitName']}",
            "",
        ]
        for r in race.get("Results", [])[:10]:
            d = r["Driver"]
            lines.append(
                f"P{r['position']}. {d['givenName']} {d['familyName']} "
                f"({r['Constructor']['name']}) — {r.get('points', '0')} pts"
            )
        result = "\n".join(lines)
        _cache_set("last_race_results", result, 60)
        return result
    except (KeyError, IndexError):
        return "Last race results data format unexpected."


# ═══════════════════════════════════════════════════════════════════════════════
# Tools — Historical Data
# ═══════════════════════════════════════════════════════════════════════════════

async def get_race_results(year: int, round_num: int) -> str:
    """Fetch full results for a specific race by year and round number."""
    cache_key = f"race_results_{year}_{round_num}"
    cached = _cache_get(cache_key)
    if cached:
        return cached

    data = await _fetch(f"{JOLPICA_BASE}/{year}/{round_num}/results.json")
    if not data:
        return f"Unable to fetch results for {year} round {round_num}."

    try:
        races = data["MRData"]["RaceTable"]["Races"]
        if not races:
            return f"No results found for {year} round {round_num}."

        race = races[0]
        lines = [
            f"{race['raceName']} {race['season']} — {race.get('date', '')}",
            f"Circuit: {race['Circuit']['circuitName']}",
            "",
        ]
        for r in race.get("Results", []):
            d = r["Driver"]
            status = r.get("status", "")
            time_info = ""
            if r.get("Time"):
                time_info = f" [{r['Time'].get('time', '')}]"
            elif status and status != "Finished":
                time_info = f" [{status}]"
            lines.append(
                f"P{r['position']}. {d['givenName']} {d['familyName']} "
                f"({r['Constructor']['name']}) — {r.get('points', '0')} pts{time_info}"
            )
        result = "\n".join(lines)
        _cache_set(cache_key, result, 300)
        return result
    except (KeyError, IndexError):
        return f"Race results data format unexpected for {year} round {round_num}."


async def get_qualifying_results(year: int, round_num: int) -> str:
    """Fetch qualifying results for a specific race by year and round number."""
    cache_key = f"quali_results_{year}_{round_num}"
    cached = _cache_get(cache_key)
    if cached:
        return cached

    data = await _fetch(f"{JOLPICA_BASE}/{year}/{round_num}/qualifying.json")
    if not data:
        return f"Unable to fetch qualifying for {year} round {round_num}."

    try:
        races = data["MRData"]["RaceTable"]["Races"]
        if not races:
            return f"No qualifying data found for {year} round {round_num}."

        race = races[0]
        lines = [
            f"Qualifying — {race['raceName']} {race['season']}",
            f"Circuit: {race['Circuit']['circuitName']}",
            "",
        ]
        for q in race.get("QualifyingResults", []):
            d = q["Driver"]
            q3 = q.get("Q3", "")
            q2 = q.get("Q2", "")
            q1 = q.get("Q1", "")
            best = q3 or q2 or q1 or "No time"
            lines.append(
                f"P{q['position']}. {d['givenName']} {d['familyName']} "
                f"({q['Constructor']['name']}) — {best}"
            )
        result = "\n".join(lines)
        _cache_set(cache_key, result, 300)
        return result
    except (KeyError, IndexError):
        return f"Qualifying data format unexpected for {year} round {round_num}."


async def get_fastest_lap(year: int, round_num: int) -> str:
    """Fetch the fastest lap for a specific race by year and round number."""
    cache_key = f"fastest_lap_{year}_{round_num}"
    cached = _cache_get(cache_key)
    if cached:
        return cached

    data = await _fetch(f"{JOLPICA_BASE}/{year}/{round_num}/results.json")
    if not data:
        return f"Unable to fetch fastest lap for {year} round {round_num}."

    try:
        races = data["MRData"]["RaceTable"]["Races"]
        if not races:
            return f"No data found for {year} round {round_num}."

        race = races[0]
        fastest = None
        for r in race.get("Results", []):
            fl = r.get("FastestLap")
            if fl and fl.get("rank") == "1":
                fastest = r
                break

        if not fastest:
            return f"No fastest lap data available for {race['raceName']} {year}."

        d = fastest["Driver"]
        fl = fastest["FastestLap"]
        result = (
            f"Fastest Lap — {race['raceName']} {year}\n"
            f"Driver: {d['givenName']} {d['familyName']} ({fastest['Constructor']['name']})\n"
            f"Time: {fl['Time']['time']}\n"
            f"Lap: {fl['lap']}\n"
            f"Average Speed: {fl.get('AverageSpeed', {}).get('speed', 'N/A')} "
            f"{fl.get('AverageSpeed', {}).get('units', 'kph')}"
        )
        _cache_set(cache_key, result, 300)
        return result
    except (KeyError, IndexError):
        return f"Fastest lap data format unexpected for {year} round {round_num}."


async def get_season_races(year: int) -> str:
    """Fetch the complete race calendar for a given season."""
    cache_key = f"season_races_{year}"
    cached = _cache_get(cache_key)
    if cached:
        return cached

    data = await _fetch(f"{JOLPICA_BASE}/{year}.json")
    if not data:
        return f"Unable to fetch {year} season calendar."

    try:
        races = data["MRData"]["RaceTable"]["Races"]
        if not races:
            return f"No races found for {year}."

        lines = [f"{year} Formula 1 Season — {len(races)} races", ""]
        for r in races:
            circuit = r.get("Circuit", {})
            loc = circuit.get("Location", {})
            lines.append(
                f"R{r['round']}. {r['raceName']} — {r['date']} "
                f"({loc.get('locality', '')}, {loc.get('country', '')})"
            )
        result = "\n".join(lines)
        _cache_set(cache_key, result, 300)
        return result
    except (KeyError, IndexError):
        return f"Season calendar data format unexpected for {year}."


async def get_driver_comparison(driver1_id: str, driver2_id: str) -> str:
    """Compare two drivers' current season statistics."""
    cache_key = f"comparison_{driver1_id}_{driver2_id}"
    cached = _cache_get(cache_key)
    if cached:
        return cached

    data = await _fetch(f"{JOLPICA_BASE}/current/driverStandings.json")
    if not data:
        return "Unable to fetch standings for comparison."

    try:
        standings = data["MRData"]["StandingsTable"]["StandingsLists"][0]["DriverStandings"]

        d1_id = driver1_id.lower()
        d2_id = driver2_id.lower()

        d1 = None
        d2 = None
        for s in standings:
            did = s["Driver"]["driverId"].lower()
            family = s["Driver"]["familyName"].lower()
            if did == d1_id or family == d1_id:
                d1 = s
            if did == d2_id or family == d2_id:
                d2 = s

        if not d1:
            return f"Driver '{driver1_id}' not found in current standings."
        if not d2:
            return f"Driver '{driver2_id}' not found in current standings."

        def fmt(s: dict) -> str:
            d = s["Driver"]
            team = s["Constructors"][0]["name"] if s.get("Constructors") else "Unknown"
            return (
                f"  {d['givenName']} {d['familyName']} ({team})\n"
                f"  Position: P{s['position']}\n"
                f"  Points: {s['points']}\n"
                f"  Wins: {s['wins']}"
            )

        result = (
            f"Driver Comparison — {d1['Driver']['familyName']} vs {d2['Driver']['familyName']}\n"
            f"{'=' * 50}\n\n"
            f"{fmt(d1)}\n\n"
            f"  vs\n\n"
            f"{fmt(d2)}\n\n"
            f"Points gap: {abs(float(d1['points']) - float(d2['points'])):.0f} pts"
        )
        _cache_set(cache_key, result, 60)
        return result
    except (KeyError, IndexError):
        return "Unable to compare drivers — data format unexpected."


# ═══════════════════════════════════════════════════════════════════════════════
# Tool Dispatcher
# ═══════════════════════════════════════════════════════════════════════════════

TOOL_MAP = {
    "get_driver_standings": get_driver_standings,
    "get_constructor_standings": get_constructor_standings,
    "get_next_race": get_next_race,
    "get_last_race_results": get_last_race_results,
    "get_race_results": get_race_results,
    "get_qualifying_results": get_qualifying_results,
    "get_fastest_lap": get_fastest_lap,
    "get_season_races": get_season_races,
    "get_driver_comparison": get_driver_comparison,
}
