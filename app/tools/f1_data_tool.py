"""
F1 Structured Data Tool
=======================
Responsible for retrieving structured Formula 1 information from authoritative
motorsports APIs (Jolpica / Ergast F1 API).

All API-specific endpoints, HTTP client communication, error handling, and JSON
parsing are encapsulated in this module so the underlying data provider can be
swapped without affecting callers.
"""

import os
import re
import time
from typing import Any, Dict, List, Optional, Tuple, Union
import httpx

# Primary and fallback F1 data API base URLs
# Jolpica is the official open-source Ergast replacement providing standard F1 schemas
API_BASE_URL = os.getenv("F1_API_BASE_URL", "https://api.jolpi.ca/ergast/f1")
FALLBACK_API_BASE_URL = "https://ergast.com/api/f1"
REQUEST_TIMEOUT = 10.0

# In-memory simple TTL cache to avoid redundant API queries
_CACHE: Dict[str, Tuple[float, Any]] = {}
_CACHE_TTL_SECONDS = 300  # 5 minutes


def _get_from_cache(key: str) -> Optional[Any]:
    entry = _CACHE.get(key)
    if entry:
        expiry, data = entry
        if time.monotonic() < expiry:
            return data
        del _CACHE[key]
    return None


def _set_in_cache(key: str, data: Any, ttl: int = _CACHE_TTL_SECONDS) -> None:
    _CACHE[key] = (time.monotonic() + ttl, data)


def _http_get(endpoint: str, params: Optional[Dict[str, Any]] = None) -> Optional[Dict[str, Any]]:
    """
    Perform a robust HTTP GET request to the F1 data API with caching and fallback.
    """
    cache_key = f"{endpoint}_{sorted(params.items()) if params else ''}"
    cached = _get_from_cache(cache_key)
    if cached is not None:
        return cached

    clean_endpoint = endpoint.lstrip("/")
    urls = [
        f"{API_BASE_URL.rstrip('/')}/{clean_endpoint}",
        f"{FALLBACK_API_BASE_URL.rstrip('/')}/{clean_endpoint}",
    ]

    for url in urls:
        try:
            with httpx.Client(timeout=REQUEST_TIMEOUT, follow_redirects=True) as client:
                response = client.get(url, params=params)
                if response.status_code == 200:
                    data = response.json()
                    _set_in_cache(cache_key, data)
                    return data
        except Exception:
            continue

    return None


def _normalize_name(name: str) -> str:
    """Normalize string for fuzzy comparison (lowercase, alphanumeric only)."""
    return re.sub(r"[^a-z0-9]", "", str(name).lower())


from datetime import datetime, date, timezone


def _parse_race_datetime(date_str: str, time_str: Optional[str] = None) -> Optional[datetime]:
    """Parse race date and optional time string to a standard datetime object."""
    if not date_str:
        return None
    try:
        clean_date = date_str.strip()
        if time_str and time_str.strip():
            clean_time = time_str.strip().rstrip("Z")
            for fmt in ("%Y-%m-%d %H:%M:%S", "%Y-%m-%d %H:%M"):
                try:
                    return datetime.strptime(f"{clean_date} {clean_time}", fmt)
                except ValueError:
                    pass
        return datetime.strptime(clean_date, "%Y-%m-%d")
    except Exception:
        return None


def get_race_schedule(year: Union[int, str] = "current") -> Dict[str, Any]:
    """
    Retrieve the Formula 1 race calendar/schedule for a given year.
    
    Parameters:
    - year: Season year (e.g. 2021, 2024, "current")
    
    Returns:
    - Structured dictionary with season races, dates, and circuit info.
    """
    try:
        data = _http_get(f"{year}.json")
        if not data:
            return {"error": f"Failed to retrieve race schedule for season {year}.", "year": str(year), "races": []}

        race_table = data.get("MRData", {}).get("RaceTable", {})
        races_raw = race_table.get("Races", [])

        races = []
        for r in races_raw:
            circuit = r.get("Circuit", {})
            location = circuit.get("Location", {})
            races.append({
                "round": int(r.get("round", 0)),
                "race_name": r.get("raceName", ""),
                "circuit_id": circuit.get("circuitId", ""),
                "circuit_name": circuit.get("circuitName", ""),
                "country": location.get("country", ""),
                "locality": location.get("locality", ""),
                "date": r.get("date", ""),
                "time": r.get("time", ""),
            })

        return {
            "year": str(race_table.get("season", year)),
            "total_rounds": len(races),
            "races": races,
        }
    except Exception as e:
        return {"error": f"Error fetching race schedule: {str(e)}", "year": str(year), "races": []}


def get_next_f1_race(current_dt: Optional[datetime] = None) -> Dict[str, Any]:
    """
    Date-aware function to retrieve the next upcoming Formula 1 race.
    
    Dynamically finds the first race whose date is in the future relative to runtime current date.
    Does NOT hardcode dates and does NOT simply return the first race of the season.
    """
    try:
        now = current_dt or datetime.now()
        now_date = now.date() if isinstance(now, datetime) else now
        current_year = now.year

        # Fetch schedule for current season
        schedule = get_race_schedule(current_year)
        races = schedule.get("races", []) if "error" not in schedule else []

        if not races:
            schedule = get_race_schedule("current")
            races = schedule.get("races", [])

        future_races = []
        for r in races:
            r_dt = _parse_race_datetime(r.get("date"), r.get("time"))
            if r_dt:
                r_date = r_dt.date()
                if r_date >= now_date:
                    days_until = (r_date - now_date).days
                    future_races.append({
                        "round": r.get("round"),
                        "race_name": r.get("race_name"),
                        "circuit_name": r.get("circuit_name"),
                        "circuit_id": r.get("circuit_id"),
                        "locality": r.get("locality"),
                        "country": r.get("country"),
                        "date": r.get("date"),
                        "time": r.get("time", ""),
                        "days_until": days_until,
                        "year": schedule.get("year", str(current_year)),
                        "_parsed_dt": r_dt,
                    })

        if future_races:
            future_races.sort(key=lambda x: x["_parsed_dt"])
            next_race = future_races[0]
            next_race.pop("_parsed_dt", None)
            return {
                "status": "success",
                "current_date": now_date.isoformat(),
                "calendar_races_found": len(races),
                "total_future_races": len(future_races),
                "next_race": next_race,
                "race_name": next_race["race_name"],
                "circuit_name": next_race["circuit_name"],
                "date": next_race["date"],
                "time": next_race.get("time", ""),
                "country": next_race["country"],
                "locality": next_race["locality"],
                "round": next_race["round"],
                "year": next_race["year"],
                "days_until": next_race["days_until"],
            }

        # Check next year's calendar if all current year races are done
        next_year_schedule = get_race_schedule(current_year + 1)
        next_races = next_year_schedule.get("races", [])
        if next_races:
            first_r = next_races[0]
            return {
                "status": "success",
                "current_date": now_date.isoformat(),
                "calendar_races_found": len(races),
                "message": f"All races for {current_year} season are completed.",
                "next_race": first_r,
                "race_name": first_r.get("race_name"),
                "circuit_name": first_r.get("circuit_name"),
                "date": first_r.get("date"),
                "year": str(current_year + 1),
            }

        return {
            "error": "No upcoming F1 races found in the calendar.",
            "current_date": now_date.isoformat(),
            "calendar_races_found": len(races),
        }
    except Exception as e:
        return {"error": f"Error calculating next race: {str(e)}"}


def get_last_completed_f1_race(current_dt: Optional[datetime] = None) -> Dict[str, Any]:
    """
    Date-aware function to retrieve the most recent completed Formula 1 race and its result.
    
    Dynamically finds races whose date is before runtime current date, selects the most recent,
    and returns its official race result.
    """
    try:
        now = current_dt or datetime.now()
        now_date = now.date() if isinstance(now, datetime) else now
        current_year = now.year

        # Fetch schedule for current season
        schedule = get_race_schedule(current_year)
        races = schedule.get("races", []) if "error" not in schedule else []

        if not races:
            schedule = get_race_schedule("current")
            races = schedule.get("races", [])

        past_races = []
        for r in races:
            r_dt = _parse_race_datetime(r.get("date"), r.get("time"))
            if r_dt:
                r_date = r_dt.date()
                if r_date <= now_date:
                    days_ago = (now_date - r_date).days
                    past_races.append({
                        "round": r.get("round"),
                        "race_name": r.get("race_name"),
                        "circuit_name": r.get("circuit_name"),
                        "circuit_id": r.get("circuit_id"),
                        "locality": r.get("locality"),
                        "country": r.get("country"),
                        "date": r.get("date"),
                        "days_ago": days_ago,
                        "year": schedule.get("year", str(current_year)),
                        "_parsed_dt": r_dt,
                    })

        if past_races:
            past_races.sort(key=lambda x: x["_parsed_dt"], reverse=True)
            last_race_info = past_races[0]
            last_round = last_race_info["round"]
            last_year = last_race_info["year"]

            # Fetch official race results for this exact round
            result = get_race_result(year=last_year, race=last_round)
            if "error" not in result:
                result["current_date"] = now_date.isoformat()
                result["days_ago"] = last_race_info["days_ago"]
                result["calendar_races_found"] = len(races)
                return result

            last_race_info.pop("_parsed_dt", None)
            return {
                "race": last_race_info["race_name"],
                "race_name": last_race_info["race_name"],
                "year": last_year,
                "round": last_round,
                "circuit": last_race_info["circuit_name"],
                "date": last_race_info["date"],
                "current_date": now_date.isoformat(),
                "days_ago": last_race_info["days_ago"],
                "calendar_races_found": len(races),
            }

        # Fallback to previous year
        prev_result = get_race_result(year=current_year - 1, race="last")
        return prev_result

    except Exception as e:
        return {"error": f"Error calculating last completed race: {str(e)}"}


def _resolve_round(year: Union[int, str], race_identifier: Union[int, str]) -> Tuple[Optional[str], Optional[str]]:
    """
    Resolve race name or round identifier to (round_number_str, official_race_name).
    """
    race_str = str(race_identifier).strip()

    # If it's already a numeric round number
    if race_str.isdigit():
        return race_str, None

    if race_str.lower() in ("last", "next", "current"):
        return race_str.lower(), None

    # Resolve by searching the season schedule
    schedule = get_race_schedule(year)
    if "error" in schedule or not schedule.get("races"):
        return None, None

    normalized_target = _normalize_name(race_str)
    # Target tokens for multi-word matching
    target_tokens = [t for t in re.split(r"\s+", race_str.lower()) if t not in ("gp", "grand", "prix")]

    best_match_round = None
    best_match_name = None

    for r in schedule["races"]:
        r_name = _normalize_name(r["race_name"])
        c_name = _normalize_name(r["circuit_name"])
        country = _normalize_name(r["country"])
        locality = _normalize_name(r["locality"])
        circuit_id = _normalize_name(r["circuit_id"])

        # Exact substring matches
        if (normalized_target in r_name or normalized_target in country or 
            normalized_target in locality or normalized_target in c_name or 
            normalized_target in circuit_id):
            return str(r["round"]), r["race_name"]

        # Check token matches (e.g. "mexican" -> "mexico")
        for token in target_tokens:
            if (token in r_name or token in country or token in locality or 
                token in c_name or token in circuit_id or
                (token == "mexican" and "mexico" in country)):
                best_match_round = str(r["round"])
                best_match_name = r["race_name"]
                break

    return best_match_round, best_match_name


def get_race_result(year: Union[int, str], race: Union[int, str]) -> Dict[str, Any]:
    """
    Retrieve full race results for a specific Grand Prix.
    
    Parameters:
    - year: Season year (e.g. 2021)
    - race: Round number (e.g. 18) or race name (e.g. "Mexican GP", "Monaco")
    
    Returns:
    - Structured dictionary with race info, winner, and classified results.
    """
    try:
        round_num, race_name_hint = _resolve_round(year, race)
        if not round_num:
            return {"error": f"Could not find race matching '{race}' in {year} season.", "year": year, "race": race}

        data = _http_get(f"{year}/{round_num}/results.json")
        if not data:
            return {"error": f"Failed to retrieve race results for {year} round {round_num}.", "year": year, "race": race}

        races = data.get("MRData", {}).get("RaceTable", {}).get("Races", [])
        if not races:
            return {"error": f"No results found for {year} round {round_num}.", "year": year, "race": race}

        race_info = races[0]
        circuit = race_info.get("Circuit", {})
        location = circuit.get("Location", {})

        results_list = []
        for res in race_info.get("Results", []):
            driver = res.get("Driver", {})
            constructor = res.get("Constructor", {})
            time_info = res.get("Time", {})
            fastest_lap_info = res.get("FastestLap", {})

            item = {
                "position": int(res.get("position", 0)),
                "position_text": res.get("positionText", ""),
                "driver": f"{driver.get('givenName', '')} {driver.get('familyName', '')}".strip(),
                "driver_id": driver.get("driverId", ""),
                "code": driver.get("code", ""),
                "number": res.get("number", ""),
                "team": constructor.get("name", ""),
                "constructor_id": constructor.get("constructorId", ""),
                "grid": int(res.get("grid", 0)),
                "laps": int(res.get("laps", 0)),
                "status": res.get("status", ""),
                "points": float(res.get("points", 0.0)),
                "time": time_info.get("time", ""),
                "millis": time_info.get("millis", ""),
            }

            if fastest_lap_info:
                fl_time = fastest_lap_info.get("Time", {}).get("time", "")
                avg_spd = fastest_lap_info.get("AverageSpeed", {}).get("speed", "")
                item["fastest_lap"] = {
                    "rank": int(fastest_lap_info.get("rank", 0)) if fastest_lap_info.get("rank") else None,
                    "lap": int(fastest_lap_info.get("lap", 0)) if fastest_lap_info.get("lap") else None,
                    "time": fl_time,
                    "average_speed_kph": float(avg_spd) if avg_spd else None,
                }

            results_list.append(item)

        winner = results_list[0] if results_list else None

        return {
            "race": race_info.get("raceName", race_name_hint or str(race)),
            "year": int(year) if str(year).isdigit() else year,
            "round": int(race_info.get("round", round_num)),
            "circuit": circuit.get("circuitName", ""),
            "country": location.get("country", ""),
            "locality": location.get("locality", ""),
            "date": race_info.get("date", ""),
            "winner": winner,
            "results": results_list,
        }
    except Exception as e:
        return {"error": f"Error fetching race result: {str(e)}", "year": year, "race": race}


def get_race_winner(year: Union[int, str], race: Union[int, str]) -> Dict[str, Any]:
    """
    Retrieve the winner of a specific Formula 1 Grand Prix.
    
    Parameters:
    - year: Season year (e.g. 2021)
    - race: Round number or race name (e.g. "Mexico", "Abu Dhabi")
    """
    full_result = get_race_result(year, race)
    if "error" in full_result:
        return full_result

    winner = full_result.get("winner")
    return {
        "race": full_result.get("race"),
        "year": full_result.get("year"),
        "round": full_result.get("round"),
        "circuit": full_result.get("circuit"),
        "winner": winner,
    }


def get_fastest_lap(year: Union[int, str], race: Union[int, str]) -> Dict[str, Any]:
    """
    Retrieve fastest lap data for a specific Formula 1 Grand Prix.
    
    Parameters:
    - year: Season year (e.g. 2021)
    - race: Round number or race name (e.g. "Mexican GP")
    
    Returns:
    - Structured dictionary matching:
      {
        "race": "Mexico",
        "year": 2021,
        "fastest_lap": {
          "driver": "...",
          "time": "...",
          "lap": 69
        }
      }
    """
    try:
        round_num, race_name_hint = _resolve_round(year, race)
        if not round_num:
            return {"error": f"Could not find race matching '{race}' in {year} season.", "year": year, "race": race}

        # Query fastest lap endpoint directly
        data = _http_get(f"{year}/{round_num}/fastest/1/results.json")
        races = data.get("MRData", {}).get("RaceTable", {}).get("Races", []) if data else []

        if races and races[0].get("Results"):
            race_info = races[0]
            result = race_info["Results"][0]
            driver = result.get("Driver", {})
            constructor = result.get("Constructor", {})
            fl = result.get("FastestLap", {})
            fl_time = fl.get("Time", {}).get("time", "")
            lap_num = int(fl.get("lap", 0)) if fl.get("lap") else None
            avg_spd = fl.get("AverageSpeed", {}).get("speed")

            return {
                "race": race_info.get("raceName", race_name_hint or str(race)),
                "year": int(year) if str(year).isdigit() else year,
                "round": int(race_info.get("round", round_num)),
                "fastest_lap": {
                    "driver": f"{driver.get('givenName', '')} {driver.get('familyName', '')}".strip(),
                    "driver_id": driver.get("driverId", ""),
                    "team": constructor.get("name", ""),
                    "time": fl_time,
                    "lap": lap_num,
                    "rank": int(fl.get("rank", 1)) if fl.get("rank") else 1,
                    "average_speed_kph": float(avg_spd) if avg_spd else None,
                },
            }

        # Fallback to general race result
        full_result = get_race_result(year, race)
        if "error" in full_result:
            return full_result

        for r in full_result.get("results", []):
            fl = r.get("fastest_lap")
            if fl and fl.get("rank") == 1:
                return {
                    "race": full_result.get("race"),
                    "year": full_result.get("year"),
                    "round": full_result.get("round"),
                    "fastest_lap": {
                        "driver": r.get("driver"),
                        "driver_id": r.get("driver_id"),
                        "team": r.get("team"),
                        "time": fl.get("time"),
                        "lap": fl.get("lap"),
                        "rank": 1,
                        "average_speed_kph": fl.get("average_speed_kph"),
                    },
                }

        return {"error": f"Fastest lap data not available for {year} {race}.", "year": year, "race": race}

    except Exception as e:
        return {"error": f"Error fetching fastest lap: {str(e)}", "year": year, "race": race}


def get_qualifying_result(year: Union[int, str], race: Union[int, str]) -> Dict[str, Any]:
    """
    Retrieve qualifying session results and pole position for a Grand Prix.
    
    Parameters:
    - year: Season year (e.g. 2021)
    - race: Round number or race name
    
    Returns:
    - Structured dictionary with pole position and all grid qualifying times (Q1, Q2, Q3).
    """
    try:
        round_num, race_name_hint = _resolve_round(year, race)
        if not round_num:
            return {"error": f"Could not find race matching '{race}' in {year} season.", "year": year, "race": race}

        data = _http_get(f"{year}/{round_num}/qualifying.json")
        if not data:
            return {"error": f"Failed to retrieve qualifying results for {year} round {round_num}.", "year": year, "race": race}

        races = data.get("MRData", {}).get("RaceTable", {}).get("Races", [])
        if not races:
            return {"error": f"No qualifying results found for {year} round {round_num}.", "year": year, "race": race}

        race_info = races[0]
        circuit = race_info.get("Circuit", {})

        qualifying_list = []
        for q in race_info.get("QualifyingResults", []):
            driver = q.get("Driver", {})
            constructor = q.get("Constructor", {})
            qualifying_list.append({
                "position": int(q.get("position", 0)),
                "driver": f"{driver.get('givenName', '')} {driver.get('familyName', '')}".strip(),
                "driver_id": driver.get("driverId", ""),
                "code": driver.get("code", ""),
                "number": q.get("number", ""),
                "team": constructor.get("name", ""),
                "q1": q.get("Q1", ""),
                "q2": q.get("Q2", ""),
                "q3": q.get("Q3", ""),
            })

        pole_driver = qualifying_list[0] if qualifying_list else None
        pole_position_info = None
        if pole_driver:
            pole_time = pole_driver.get("q3") or pole_driver.get("q2") or pole_driver.get("q1")
            pole_position_info = {
                "driver": pole_driver.get("driver"),
                "driver_id": pole_driver.get("driver_id"),
                "team": pole_driver.get("team"),
                "time": pole_time,
                "q3": pole_driver.get("q3"),
            }

        return {
            "race": race_info.get("raceName", race_name_hint or str(race)),
            "year": int(year) if str(year).isdigit() else year,
            "round": int(race_info.get("round", round_num)),
            "circuit": circuit.get("circuitName", ""),
            "pole_position": pole_position_info,
            "qualifying_results": qualifying_list,
        }
    except Exception as e:
        return {"error": f"Error fetching qualifying results: {str(e)}", "year": year, "race": race}


def get_pole_position(year: Union[int, str], race: Union[int, str]) -> Dict[str, Any]:
    """
    Retrieve pole position driver and lap time for a Grand Prix.
    """
    quali = get_qualifying_result(year, race)
    if "error" in quali:
        return quali

    return {
        "race": quali.get("race"),
        "year": quali.get("year"),
        "round": quali.get("round"),
        "circuit": quali.get("circuit"),
        "pole_position": quali.get("pole_position"),
    }


def get_driver_standings(
    driver_name: Optional[Union[str, int]] = None,
    year: Union[int, str] = "current"
) -> Dict[str, Any]:
    """
    Retrieve Driver Championship standings for a given year, or for a specific driver.
    
    Parameters:
    - driver_name: Optional driver name/query (e.g. "Lando Norris", "Verstappen", None)
    - year: Season year (e.g. 2021, 2024, "current")
    
    Returns:
    - If driver_name is provided: structured dictionary with:
      {
        "driver": "Lando Norris",
        "position": 1,
        "points": 275,
        "wins": 5,
        "rounds_completed": 14,
        "season": "2026",
        "team": "McLaren",
        "code": "NOR"
      }
    - If driver_name is None: structured dictionary with full standings table, leader, round, and season.
    """
    try:
        # Handle case where user passes year as first argument positionally
        if driver_name is not None:
            driver_str = str(driver_name).strip()
            if (driver_str.isdigit() and len(driver_str) == 4) or driver_str.lower() == "current":
                year = driver_str
                driver_name = None
            else:
                driver_name = driver_str

        data = _http_get(f"{year}/driverStandings.json")
        if not data:
            return {
                "error": f"Failed to retrieve driver standings for season {year}.",
                "driver": driver_name,
                "season": str(year),
                "standings": []
            }

        standings_lists = data.get("MRData", {}).get("StandingsTable", {}).get("StandingsLists", [])
        if not standings_lists:
            return {
                "error": f"No driver standings data found for season {year}.",
                "driver": driver_name,
                "season": str(year),
                "standings": []
            }

        curr_list = standings_lists[0]
        season_val = str(curr_list.get("season", year))
        round_val = int(curr_list.get("round", 0))

        standings = []
        for s in curr_list.get("DriverStandings", []):
            driver = s.get("Driver", {})
            constructors = s.get("Constructors", [])
            team_name = constructors[0].get("name", "") if constructors else ""
            constructor_id = constructors[0].get("constructorId", "") if constructors else ""
            
            raw_points = s.get("points", 0.0)
            try:
                pts_float = float(raw_points)
                points_val = int(pts_float) if pts_float.is_integer() else pts_float
            except (ValueError, TypeError):
                points_val = 0

            standings.append({
                "position": int(s.get("position", 0)),
                "position_text": s.get("positionText", ""),
                "points": points_val,
                "wins": int(s.get("wins", 0)),
                "driver": f"{driver.get('givenName', '')} {driver.get('familyName', '')}".strip(),
                "driver_id": driver.get("driverId", ""),
                "code": driver.get("code", ""),
                "permanent_number": driver.get("permanentNumber", ""),
                "nationality": driver.get("nationality", ""),
                "team": team_name,
                "constructor_id": constructor_id,
                "rounds_completed": round_val,
                "season": season_val,
            })

        # If a specific driver was requested, find and return structured data for that driver
        if driver_name:
            norm_target = _normalize_name(driver_name)
            target_tokens = [t for t in re.split(r"\s+", str(driver_name).lower()) if len(t) > 1]
            
            matched_entry = None
            for entry in standings:
                d_full_norm = _normalize_name(entry["driver"])
                d_id_norm = _normalize_name(entry["driver_id"])
                d_code_norm = _normalize_name(entry["code"])
                
                if norm_target in (d_full_norm, d_id_norm, d_code_norm):
                    matched_entry = entry
                    break
                if norm_target in d_full_norm or norm_target in d_id_norm:
                    matched_entry = entry
                    break
                if any(t in d_full_norm or t in d_id_norm for t in target_tokens):
                    matched_entry = entry
                    break

            if matched_entry:
                return {
                    "driver": matched_entry["driver"],
                    "position": matched_entry["position"],
                    "points": matched_entry["points"],
                    "wins": matched_entry["wins"],
                    "rounds_completed": round_val,
                    "season": season_val,
                    "team": matched_entry["team"],
                    "driver_id": matched_entry["driver_id"],
                    "code": matched_entry["code"],
                    "nationality": matched_entry["nationality"],
                }
            else:
                return {
                    "error": f"Driver '{driver_name}' was not found in the {season_val} championship standings.",
                    "driver": driver_name,
                    "season": season_val,
                    "rounds_completed": round_val,
                }

        return {
            "year": season_val,
            "season": season_val,
            "round": round_val,
            "rounds_completed": round_val,
            "leader": standings[0] if standings else None,
            "standings": standings,
        }
    except Exception as e:
        return {"error": f"Error fetching driver standings: {str(e)}", "year": str(year), "standings": []}


def get_constructor_standings(
    constructor_name: Optional[Union[str, int]] = None,
    year: Union[int, str] = "current"
) -> Dict[str, Any]:
    """
    Retrieve Constructor Championship standings for a given year, or for a specific constructor.
    
    Parameters:
    - constructor_name: Optional team name (e.g. "McLaren", "Ferrari", None)
    - year: Season year (e.g. 2021, 2024, "current")
    """
    try:
        if constructor_name is not None:
            c_str = str(constructor_name).strip()
            if (c_str.isdigit() and len(c_str) == 4) or c_str.lower() == "current":
                year = c_str
                constructor_name = None
            else:
                constructor_name = c_str

        data = _http_get(f"{year}/constructorStandings.json")
        if not data:
            return {
                "error": f"Failed to retrieve constructor standings for season {year}.",
                "constructor": constructor_name,
                "season": str(year),
                "standings": []
            }

        standings_lists = data.get("MRData", {}).get("StandingsTable", {}).get("StandingsLists", [])
        if not standings_lists:
            return {
                "error": f"No constructor standings data found for season {year}.",
                "constructor": constructor_name,
                "season": str(year),
                "standings": []
            }

        curr_list = standings_lists[0]
        season_val = str(curr_list.get("season", year))
        round_val = int(curr_list.get("round", 0))

        standings = []
        for s in curr_list.get("ConstructorStandings", []):
            constructor = s.get("Constructor", {})
            raw_points = s.get("points", 0.0)
            try:
                pts_float = float(raw_points)
                points_val = int(pts_float) if pts_float.is_integer() else pts_float
            except (ValueError, TypeError):
                points_val = 0

            standings.append({
                "position": int(s.get("position", 0)),
                "position_text": s.get("positionText", ""),
                "points": points_val,
                "wins": int(s.get("wins", 0)),
                "team": constructor.get("name", ""),
                "constructor_id": constructor.get("constructorId", ""),
                "nationality": constructor.get("nationality", ""),
                "rounds_completed": round_val,
                "season": season_val,
            })

        if constructor_name:
            norm_target = _normalize_name(constructor_name)
            matched_entry = None
            for entry in standings:
                c_norm = _normalize_name(entry["team"])
                cid_norm = _normalize_name(entry["constructor_id"])
                if norm_target in (c_norm, cid_norm) or norm_target in c_norm or norm_target in cid_norm:
                    matched_entry = entry
                    break

            if matched_entry:
                return {
                    "team": matched_entry["team"],
                    "constructor": matched_entry["team"],
                    "position": matched_entry["position"],
                    "points": matched_entry["points"],
                    "wins": matched_entry["wins"],
                    "rounds_completed": round_val,
                    "season": season_val,
                    "constructor_id": matched_entry["constructor_id"],
                    "nationality": matched_entry["nationality"],
                }
            else:
                return {
                    "error": f"Constructor '{constructor_name}' was not found in {season_val} constructor standings.",
                    "constructor": constructor_name,
                    "season": season_val,
                    "rounds_completed": round_val,
                }

        return {
            "year": season_val,
            "season": season_val,
            "round": round_val,
            "rounds_completed": round_val,
            "leader": standings[0] if standings else None,
            "standings": standings,
        }
    except Exception as e:
        return {"error": f"Error fetching constructor standings: {str(e)}", "year": str(year), "standings": []}


def _resolve_driver_id(driver_query: str, year: Optional[Union[int, str]] = None) -> Optional[str]:
    """Resolve driver name query to Ergast driverId."""
    q = _normalize_name(driver_query)
    
    # Common mappings
    direct_map = {
        "verstappen": "max_verstappen",
        "maxverstappen": "max_verstappen",
        "hamilton": "hamilton",
        "lewishamilton": "hamilton",
        "bottas": "bottas",
        "valtteribottas": "bottas",
        "leclerc": "leclerc",
        "charlesleclerc": "leclerc",
        "norris": "norris",
        "landonorris": "norris",
        "perez": "perez",
        "sergioperez": "perez",
        "alonso": "alonso",
        "fernandoalonso": "alonso",
        "sainz": "sainz",
        "carlossainz": "sainz",
        "russell": "russell",
        "georgerussell": "russell",
        "piastri": "piastri",
        "oscarpiastri": "piastri",
        "vettel": "vettel",
        "sebastianvettel": "vettel",
        "ricciardo": "ricciardo",
        "danielricciardo": "ricciardo",
    }
    if q in direct_map:
        return direct_map[q]

    # Search via driver standings or drivers endpoint
    season = year if year else "current"
    standings = get_driver_standings(season)
    if "standings" in standings:
        for s in standings["standings"]:
            d_norm = _normalize_name(s["driver"])
            id_norm = _normalize_name(s["driver_id"])
            if q in d_norm or q in id_norm or id_norm in q:
                return s["driver_id"]

    return driver_query.lower().replace(" ", "_")


def get_driver_statistics(driver: str, year: Optional[Union[int, str]] = None) -> Dict[str, Any]:
    """
    Retrieve statistics for a driver (either for a specific season or overall career).
    
    Parameters:
    - driver: Driver name or ID (e.g. "hamilton", "Max Verstappen")
    - year: Optional season year (e.g. 2021). If None, fetches overall/career stats.
    """
    try:
        driver_id = _resolve_driver_id(driver, year)
        
        if year:
            # Season specific stats
            endpoint = f"{year}/drivers/{driver_id}/driverStandings.json"
            data = _http_get(endpoint)
            standings_lists = data.get("MRData", {}).get("StandingsTable", {}).get("StandingsLists", []) if data else []
            
            # Also get results to count podiums / poles
            res_data = _http_get(f"{year}/drivers/{driver_id}/results.json?limit=100")
            races = res_data.get("MRData", {}).get("RaceTable", {}).get("Races", []) if res_data else []

            wins = 0
            podiums = 0
            poles = 0
            points = 0.0
            races_entered = len(races)
            best_finish = 99
            driver_info = {}
            team_name = ""

            for r in races:
                for res in r.get("Results", []):
                    driver_info = res.get("Driver", {})
                    team_name = res.get("Constructor", {}).get("name", team_name)
                    pos = int(res.get("position", 99))
                    grid = int(res.get("grid", 99))
                    pts = float(res.get("points", 0.0))
                    points += pts
                    if pos == 1:
                        wins += 1
                    if pos in (1, 2, 3):
                        podiums += 1
                    if grid == 1:
                        poles += 1
                    if pos < best_finish:
                        best_finish = pos

            position = None
            if standings_lists and standings_lists[0].get("DriverStandings"):
                s_entry = standings_lists[0]["DriverStandings"][0]
                position = int(s_entry.get("position", 0))
                wins = int(s_entry.get("wins", wins))
                points = float(s_entry.get("points", points))

            return {
                "driver": f"{driver_info.get('givenName', '')} {driver_info.get('familyName', '')}".strip() or driver,
                "driver_id": driver_id,
                "year": str(year),
                "team": team_name,
                "championship_position": position,
                "points": points,
                "wins": wins,
                "podiums": podiums,
                "poles": poles,
                "races_entered": races_entered,
                "best_finish": best_finish if best_finish != 99 else None,
            }
        else:
            # Career stats summary
            endpoint = f"drivers/{driver_id}/driverStandings.json?limit=100"
            data = _http_get(endpoint)
            standings_lists = data.get("MRData", {}).get("StandingsTable", {}).get("StandingsLists", []) if data else []

            total_wins = 0
            total_points = 0.0
            championships = 0
            seasons = []

            for s_list in standings_lists:
                season_yr = s_list.get("season", "")
                seasons.append(season_yr)
                for s in s_list.get("DriverStandings", []):
                    pos = int(s.get("position", 0))
                    w = int(s.get("wins", 0))
                    pts = float(s.get("points", 0.0))
                    total_wins += w
                    total_points += pts
                    if pos == 1:
                        championships += 1

            return {
                "driver": driver,
                "driver_id": driver_id,
                "scope": "career",
                "world_championships": championships,
                "seasons_active": len(seasons),
                "seasons": seasons,
                "total_wins": total_wins,
                "total_points": total_points,
            }

    except Exception as e:
        return {"error": f"Error fetching driver statistics: {str(e)}", "driver": driver, "year": str(year) if year else None}


def get_constructor_statistics(constructor: str, year: Optional[Union[int, str]] = None) -> Dict[str, Any]:
    """
    Retrieve statistics for a constructor/team.
    """
    try:
        constructor_id = _normalize_name(constructor).replace("racing", "").strip()
        season = year if year else "current"
        
        endpoint = f"{season}/constructors/{constructor_id}/constructorStandings.json"
        data = _http_get(endpoint)
        standings_lists = data.get("MRData", {}).get("StandingsTable", {}).get("StandingsLists", []) if data else []

        if standings_lists and standings_lists[0].get("ConstructorStandings"):
            entry = standings_lists[0]["ConstructorStandings"][0]
            c_info = entry.get("Constructor", {})
            return {
                "constructor": c_info.get("name", constructor),
                "constructor_id": constructor_id,
                "year": str(season),
                "championship_position": int(entry.get("position", 0)),
                "points": float(entry.get("points", 0.0)),
                "wins": int(entry.get("wins", 0)),
            }

        return {
            "constructor": constructor,
            "constructor_id": constructor_id,
            "year": str(season),
            "message": f"No standings entry found for constructor '{constructor}' in season {season}."
        }
    except Exception as e:
        return {"error": f"Error fetching constructor statistics: {str(e)}", "constructor": constructor}
