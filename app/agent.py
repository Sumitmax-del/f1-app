"""
Integrated Formula 1 AI Agent Orchestrator
===========================================
Unified AI Agent connecting:
1. Gemini LLM Layer via OpenRouter (app/llm/gemini.py)
2. F1 Structured Data Tool (app/tools/f1_data_tool.py)
3. Web Search Tool (app/tools/search_tool.py)
4. Local RAG Knowledge Base (app/rag/)
5. F1 Telemetry Tool (app/tools/telemetry_tool.py)

Architecture:
  USER QUESTION → Intent Detection → Tool Execution → Structured Context →
  Gemini Synthesis → Clean Natural-Language Answer + Sources

All date-relative queries ("next race", "last race") dynamically inspect the
current runtime date against the actual F1 calendar.
All live/current statistics are strictly routed to the F1 Data Tool.
RAG only handles stable explanatory questions (DRS, ERS, tyre rules, points system).
Raw search results, URLs, and internal labels are NEVER exposed to the user.
"""

import os
import re
from datetime import datetime, date
from typing import Any, Dict, List, Optional, Tuple, Union

from app.llm.gemini import generate_gemini_response, get_gemini_model_name
from app.tools.f1_data_tool import (
    get_race_result,
    get_race_winner,
    get_fastest_lap,
    get_qualifying_result,
    get_pole_position,
    get_driver_standings,
    get_constructor_standings,
    get_driver_statistics,
    get_constructor_statistics,
    get_race_schedule,
    get_next_f1_race,
    get_last_completed_f1_race,
)
from app.tools.search_tool import search_web, search_f1_news
from app.tools.telemetry_tool import (
    analyze_sector_time_loss,
    compare_driver_telemetry,
    get_live_telemetry_snapshot,
)
from app.rag import retrieve_knowledge, is_knowledge_query

# Debug mode: when True, internal tool/context info is included in response
DEBUG_MODE = os.getenv("DEBUG_MODE", "false").lower() in ("true", "1", "yes")


class F1Agent:
    """
    Unified F1 AI Agent with intelligent multi-tool intent detection and routing.
    Uses Gemini to synthesize clean, natural-language answers from tool data.
    """

    KNOWN_RACES = [
        "mexico", "mexican", "monaco", "italy", "italian", "monza",
        "silverstone", "british", "britain", "abu dhabi", "bahrain",
        "saudi arabia", "saudi", "australia", "australian", "miami",
        "spain", "spanish", "barcelona", "canada", "canadian", "montreal",
        "austria", "austrian", "red bull ring", "hungary", "hungarian", "hungaroring",
        "belgium", "belgian", "spa", "netherlands", "dutch", "zandvoort",
        "singapore", "japan", "japanese", "suzuka", "qatar", "losail",
        "united states", "usa", "us", "austin", "cota", "las vegas", "vegas",
        "brazil", "brazilian", "interlagos", "azerbaijan", "baku", "china", "chinese",
        "shanghai", "france", "french", "paul ricard", "portugal", "portuguese",
        "portimao", "turkey", "turkish", "istanbul", "russia", "russian", "sochi",
        "germany", "german", "nurburgring", "hockenheim", "imola", "emilia romagna",
    ]

    DRIVER_MAPPINGS = [
        ("lando norris", "Lando Norris"),
        ("norris", "Lando Norris"),
        ("oscar piastri", "Oscar Piastri"),
        ("piastri", "Oscar Piastri"),
        ("max verstappen", "Max Verstappen"),
        ("verstappen", "Max Verstappen"),
        ("lewis hamilton", "Lewis Hamilton"),
        ("hamilton", "Lewis Hamilton"),
        ("charles leclerc", "Charles Leclerc"),
        ("leclerc", "Charles Leclerc"),
        ("george russell", "George Russell"),
        ("russell", "George Russell"),
        ("carlos sainz", "Carlos Sainz"),
        ("sainz", "Carlos Sainz"),
        ("fernando alonso", "Fernando Alonso"),
        ("alonso", "Fernando Alonso"),
        ("sergio perez", "Sergio Perez"),
        ("checo perez", "Sergio Perez"),
        ("perez", "Sergio Perez"),
        ("kimi antonelli", "Andrea Kimi Antonelli"),
        ("andrea kimi antonelli", "Andrea Kimi Antonelli"),
        ("antonelli", "Andrea Kimi Antonelli"),
        ("alex albon", "Alexander Albon"),
        ("albon", "Alexander Albon"),
        ("pierre gasly", "Pierre Gasly"),
        ("gasly", "Pierre Gasly"),
        ("esteban ocon", "Esteban Ocon"),
        ("ocon", "Esteban Ocon"),
        ("yuki tsunoda", "Yuki Tsunoda"),
        ("tsunoda", "Yuki Tsunoda"),
        ("nico hulkenberg", "Nico Hulkenberg"),
        ("hulkenberg", "Nico Hulkenberg"),
        ("kevin magnussen", "Kevin Magnussen"),
        ("magnussen", "Kevin Magnussen"),
        ("lance stroll", "Lance Stroll"),
        ("stroll", "Lance Stroll"),
        ("valtteri bottas", "Valtteri Bottas"),
        ("bottas", "Valtteri Bottas"),
        ("guanyu zhou", "Zhou Guanyu"),
        ("zhou", "Zhou Guanyu"),
        ("logan sargeant", "Logan Sargeant"),
        ("sargeant", "Logan Sargeant"),
        ("franco colapinto", "Franco Colapinto"),
        ("colapinto", "Franco Colapinto"),
        ("oliver bearman", "Oliver Bearman"),
        ("bearman", "Oliver Bearman"),
        ("liam lawson", "Liam Lawson"),
        ("lawson", "Liam Lawson"),
        ("gabriel bortoleto", "Gabriel Bortoleto"),
        ("bortoleto", "Gabriel Bortoleto"),
        ("jack doohan", "Jack Doohan"),
        ("doohan", "Jack Doohan"),
        ("isack hadjar", "Isack Hadjar"),
        ("hadjar", "Isack Hadjar"),
        ("sebastian vettel", "Sebastian Vettel"),
        ("vettel", "Sebastian Vettel"),
        ("daniel ricciardo", "Daniel Ricciardo"),
        ("ricciardo", "Daniel Ricciardo"),
        ("kimi raikkonen", "Kimi Raikkonen"),
        ("raikkonen", "Kimi Raikkonen"),
        ("michael schumacher", "Michael Schumacher"),
        ("schumacher", "Michael Schumacher"),
        ("ayrton senna", "Ayrton Senna"),
        ("senna", "Ayrton Senna"),
        ("alain prost", "Alain Prost"),
        ("prost", "Alain Prost"),
    ]

    KNOWN_TEAMS = [
        ("red bull", "Red Bull"),
        ("mercedes", "Mercedes"),
        ("ferrari", "Ferrari"),
        ("mclaren", "McLaren"),
        ("aston martin", "Aston Martin"),
        ("alpine", "Alpine"),
        ("williams", "Williams"),
        ("haas", "Haas"),
        ("sauber", "Sauber"),
        ("kick sauber", "Kick Sauber"),
        ("rb", "RB"),
        ("racing bulls", "Racing Bulls"),
        ("alphatauri", "AlphaTauri"),
        ("alfa romeo", "Alfa Romeo"),
        ("toro rosso", "Toro Rosso"),
        ("renault", "Renault"),
        ("racing point", "Racing Point"),
        ("force india", "Force India"),
    ]

    def _extract_year(self, text: str) -> Optional[int]:
        """Extract 4-digit season year from query."""
        match = re.search(r"\b(19\d{2}|20\d{2})\b", text)
        if match:
            return int(match.group(1))
        return None

    def _extract_race(self, text: str) -> Optional[str]:
        """Extract race name from query."""
        text_lower = text.lower()
        multi_words = [
            "abu dhabi", "saudi arabia", "united states", "las vegas",
            "emilia romagna", "red bull ring", "mexico city",
        ]
        for mw in multi_words:
            if mw in text_lower:
                return mw

        for r in self.KNOWN_RACES:
            if re.search(rf"\b{re.escape(r)}\b", text_lower):
                return r

        gp_match = re.search(r"\b([a-zA-Z\s]+?)\s+(?:grand prix|gp)\b", text_lower)
        if gp_match:
            candidate = gp_match.group(1).strip()
            candidate = re.sub(r"^(?:at the|in the|won the|for the|of the|the|\d{4})\s+", "", candidate).strip()
            # Exclude relative tokens
            if candidate.lower() in ("next", "last", "latest", "upcoming", "current", "this", "previous", "what is the next", "when is the next", "f1", "formula 1"):
                return None
            if candidate and len(candidate) > 2 and candidate.lower() not in ("next", "last", "latest", "upcoming", "f1", "formula 1"):
                return candidate

        return None

    def _extract_drivers(self, text: str) -> List[str]:
        """Extract all driver canonical names mentioned in the query."""
        text_lower = text.lower()
        found = []
        for pattern, canonical in self.DRIVER_MAPPINGS:
            if re.search(rf"\b{re.escape(pattern)}\b", text_lower):
                if canonical not in found:
                    found.append(canonical)
        return found

    def _extract_team(self, text: str) -> Optional[str]:
        """Extract constructor / team name from query."""
        text_lower = text.lower()
        for pattern, canonical in self.KNOWN_TEAMS:
            if re.search(rf"\b{re.escape(pattern)}\b", text_lower):
                return canonical
        return None

    def detect_intent(self, question: str) -> Tuple[List[str], Dict[str, Any]]:
        """
        Analyze incoming user query and determine which tool(s) to execute.
        
        Strict Routing Hierarchy:
        1. Date-aware NEXT RACE ("when is the next race?", "what is the next GP?") → NEXT_F1_RACE
        2. Date-aware LAST RACE ("last race", "who won the last race", "what happened in the latest race") → LAST_F1_RACE
        3. Specific race date query ("When was the Australian GP?", "When was the 2021 Mexican GP?") → RACE_SCHEDULE
        4. Live Driver Points & Championship Position → CURRENT_DRIVER_STANDING
        5. Championship Leader & Standings → DRIVER_STANDINGS
        6. Constructor Standings & Points → CONSTRUCTOR_STANDINGS
        7. Fastest Lap & Pole Position → FASTEST_LAP / POLE_POSITION
        8. Specific Historical Race Results → RACE_RESULT
        9. Telemetry & Sector Loss → TELEMETRY
        10. Stable Explanatory Knowledge (DRS, ERS, Tyres, Points system rules) → STABLE_KNOWLEDGE (RAG)
        11. Current / Recent News & Transfers → WEB_SEARCH
        """
        q = question.lower().strip()
        q_clean = re.sub(r"[''`]", "", q)
        year = self._extract_year(q)
        race = self._extract_race(q)
        drivers = self._extract_drivers(q)
        driver = drivers[0] if drivers else None
        team = self._extract_team(q)

        # ═══════════════════════════════════════════════════════════════════
        # 1. DATE-AWARE NEXT RACE INTENT
        # Questions like:
        # - "When is the next race?"
        # - "What is the next GP?"
        # - "When is the next Grand Prix?"
        # - "When is the next F1 race?"
        # - "Upcoming race"
        # ═══════════════════════════════════════════════════════════════════
        if any(term in q for term in [
            "next race", "when is the next", "what is the next gp", "what is the next grand prix",
            "what is the next race", "what is the next f1", "when is the next grand prix",
            "when is the next f1 race", "when is the next f1", "when is the next formula 1",
            "upcoming race", "upcoming grand prix", "upcoming gp", "next grand prix",
            "next gp", "who races next", "when do they race next"
        ]) and not any(r in q for r in self.KNOWN_RACES):
            return ["f1_data"], {
                "intent": "NEXT_F1_RACE",
                "action": "get_next_f1_race",
            }

        # ═══════════════════════════════════════════════════════════════════
        # 2. DATE-AWARE LAST RACE / LATEST COMPLETED RACE INTENT
        # Questions like:
        # - "Who won the last race?"
        # - "What was the result of the last race?"
        # - "What happened in the last race?"
        # - "What happened in the latest race?"
        # - "Most recent race"
        # - "Latest race"
        # ═══════════════════════════════════════════════════════════════════
        if any(term in q for term in [
            "last race", "latest race", "latest f1 race", "most recent race", "result of the last",
            "result of the latest", "last grand prix", "latest grand prix", "latest completed race",
            "who won the last race", "who won the latest race", "who won the last f1",
            "who won the latest f1", "what happened in the last race", "what happened in the latest race",
            "who won last race", "who won latest race"
        ]) and not any(r in q for r in self.KNOWN_RACES) and not year:
            return ["f1_data"], {
                "intent": "LAST_F1_RACE",
                "action": "get_last_completed_f1_race",
            }

        # ═══════════════════════════════════════════════════════════════════
        # 3. SPECIFIC GRAND PRIX DATE / CALENDAR QUERY
        # Questions like:
        # - "When was the Australian GP?"
        # - "When was the 2021 Mexican GP?"
        # - "When is the Mexican GP?"
        # - "Date of the British Grand Prix"
        # ═══════════════════════════════════════════════════════════════════
        if race and (
            any(term in q for term in [
                "when is", "when was", "what date", "which date", "what time",
                "schedule of", "calendar", "held on", "held at", "took place"
            ])
            or (q.startswith("when") and not any(term in q for term in ["won", "win", "result", "finish", "points"]))
        ):
            target_year = year or "current"
            return ["f1_data"], {
                "intent": "RACE_SCHEDULE",
                "action": "get_race_schedule",
                "year": target_year,
                "race": race,
            }

        # ═══════════════════════════════════════════════════════════════════
        # 4. LIVE DRIVER POINTS / CHAMPIONSHIP POSITION INTENT
        # Questions like:
        # - "What is the current points of Lando Norris?"
        # - "How many points does Oscar Piastri have?"
        # - "What position is Max Verstappen in the championship?"
        # - "Where is Lewis Hamilton in the standings?"
        # ═══════════════════════════════════════════════════════════════════
        if driver and (
            any(term in q for term in [
                "point", "points", "how many point", "current point", "current points",
                "points of", "points does", "points has", "points have",
                "position", "position is", "championship position", "standing",
                "standings", "place", "rank", "where is", "what position",
                "how is he doing in the championship", "in the championship"
            ])
            or ("championship" in q or "standing" in q or "leaderboard" in q)
        ):
            target_year = year or "current"
            return ["f1_data"], {
                "intent": "CURRENT_DRIVER_STANDING",
                "action": "get_driver_standings",
                "driver": driver,
                "year": target_year,
            }

        # ═══════════════════════════════════════════════════════════════════
        # 5. OVERALL DRIVER STANDINGS / CHAMPIONSHIP LEADER INTENT
        # Questions like:
        # - "Who is currently leading the F1 championship?"
        # - "Who is leading the championship?"
        # - "What are the F1 driver standings?"
        # - "Championship leader"
        # ═══════════════════════════════════════════════════════════════════
        if any(term in q or term in q_clean for term in [
            "who is currently leading", "who is leading the f1", "who is leading the championship",
            "who is leading the drivers", "who leads the championship", "championship leader",
            "drivers championship leader", "driver standings", "drivers standings",
            "current driver standings", "current standings", "championship standings",
            "who is leading", "leading the f1", "leading the championship", "world championship leader",
            "who led the championship", "standings leader"
        ]) or (("driver" in q_clean or "championship" in q_clean or "f1" in q_clean) and any(w in q_clean for w in ["leader", "leading", "standings"])):
            target_year = year or "current"
            return ["f1_data"], {
                "intent": "DRIVER_STANDINGS",
                "action": "get_driver_standings",
                "driver": None,
                "year": target_year,
            }

        # ═══════════════════════════════════════════════════════════════════
        # 6. CONSTRUCTOR STANDINGS / CONSTRUCTOR POINTS INTENT
        # ═══════════════════════════════════════════════════════════════════
        if any(term in q or term in q_clean for term in [
            "constructor standings", "constructors standings", "constructors championship",
            "constructor championship", "team standings", "teams championship",
            "leading the constructors", "leading constructor", "who led the constructors",
            "who led the constructor", "who was leading the constructors",
            "constructor points", "team points", "leading team", "constructors title",
            "constructor standing", "constructors champion"
        ]) or (team and any(term in q for term in ["points", "position", "standing", "standings", "rank"])):
            target_year = year or "current"
            return ["f1_data"], {
                "intent": "CONSTRUCTOR_STANDINGS",
                "action": "get_constructor_standings",
                "constructor": team,
                "year": target_year,
            }

        # ═══════════════════════════════════════════════════════════════════
        # 7. FASTEST LAP INTENT
        # Questions like:
        # - "What was the fastest lap in the 2021 Mexican GP?"
        # ═══════════════════════════════════════════════════════════════════
        if any(term in q for term in ["fastest lap", "fastest time", "quickest lap", "fastest lap time"]):
            target_year = year or "current"
            target_race = race or "last"
            return ["f1_data"], {
                "intent": "FASTEST_LAP",
                "action": "get_fastest_lap",
                "year": target_year,
                "race": target_race,
            }

        # ═══════════════════════════════════════════════════════════════════
        # 8. POLE POSITION / QUALIFYING INTENT
        # ═══════════════════════════════════════════════════════════════════
        if any(term in q for term in [
            "pole position", "on pole", "took pole", "qualifying", "qualify",
            "grid position", "starting grid", "quali"
        ]):
            target_year = year or "current"
            target_race = race or "last"
            return ["f1_data"], {
                "intent": "POLE_POSITION",
                "action": "get_qualifying_result",
                "year": target_year,
                "race": target_race,
            }

        # ═══════════════════════════════════════════════════════════════════
        # 9. RACE RESULTS / WINNER FOR SPECIFIC RACES
        # Questions like:
        # - "Who won the 2021 Mexican GP?"
        # - "Race result of Monaco 2024"
        # ═══════════════════════════════════════════════════════════════════
        if any(term in q for term in [
            "who won", "winner of", "race winner", "won the", "won at", "race result",
            "results of", "who finished first", "podium of", "podium at", "who took victory"
        ]) or (race and (year or "won" in q or "result" in q)):
            target_year = year or "current"
            target_race = race or "last"
            return ["f1_data"], {
                "intent": "RACE_RESULT",
                "action": "get_race_result",
                "year": target_year,
                "race": target_race,
            }

        # ═══════════════════════════════════════════════════════════════════
        # 10. TELEMETRY INTENT
        # ═══════════════════════════════════════════════════════════════════
        if any(term in q for term in [
            "sector 1", "sector 2", "sector 3", "lose time", "lost time",
            "telemetry", "delta time", "throttle trace", "braking trace",
            "apex speed", "why did i lose", "where did i lose", "telemetry stream"
        ]):
            sector_num = 2
            if "sector 1" in q or "s1" in q:
                sector_num = 1
            elif "sector 3" in q or "s3" in q:
                sector_num = 3
            return ["telemetry"], {
                "intent": "TELEMETRY",
                "sector": sector_num,
                "driver": driver,
                "query": question,
            }

        # ═══════════════════════════════════════════════════════════════════
        # 11. DRIVER COMPARISON INTENT
        # ═══════════════════════════════════════════════════════════════════
        if len(drivers) >= 2 and any(term in q for term in ["compare", "vs", "versus", "better", "head to head", "between"]):
            return ["f1_data"], {
                "intent": "DRIVER_COMPARISON",
                "action": "compare_drivers",
                "driver_a": drivers[0],
                "driver_b": drivers[1],
                "year": year,
            }

        # ═══════════════════════════════════════════════════════════════════
        # 12. DRIVER CAREER / HISTORICAL STATISTICS INTENT
        # ═══════════════════════════════════════════════════════════════════
        if driver and any(term in q for term in [
            "stats", "statistic", "statistics", "how many wins", "how many podiums",
            "how many championships", "career", "career wins", "record", "all time"
        ]):
            return ["f1_data"], {
                "intent": "DRIVER_STATISTICS",
                "action": "get_driver_statistics",
                "driver": driver,
                "year": year,
            }

        # ═══════════════════════════════════════════════════════════════════
        # 13. BEST / GREATEST DRIVER ANALYSIS
        # ═══════════════════════════════════════════════════════════════════
        if any(term in q for term in [
            "best driver", "best f1 driver", "greatest driver", "greatest f1 driver",
            "goat of f1", "goat driver", "who is the best driver", "who is the greatest"
        ]):
            return ["f1_data"], {
                "intent": "BEST_DRIVER_ANALYSIS",
                "action": "best_driver_analysis",
                "query": question,
            }

        # ═══════════════════════════════════════════════════════════════════
        # 14. GENERAL RACE SCHEDULE / CALENDAR INTENT
        # ═══════════════════════════════════════════════════════════════════
        if any(term in q for term in ["schedule", "calendar", "races in", "how many races"]):
            target_year = year or "current"
            return ["f1_data"], {
                "intent": "RACE_SCHEDULE",
                "action": "get_race_schedule",
                "year": target_year,
            }

        # ═══════════════════════════════════════════════════════════════════
        # 15. STABLE EXPLANATORY KNOWLEDGE (RAG)
        # ═══════════════════════════════════════════════════════════════════
        if is_knowledge_query(q):
            return ["rag"], {
                "intent": "STABLE_KNOWLEDGE",
                "query": question,
            }

        # ═══════════════════════════════════════════════════════════════════
        # 16. NEWS / BREAKING UPDATES / TRANSFERS (WEB SEARCH)
        # ═══════════════════════════════════════════════════════════════════
        if any(term in q for term in [
            "news", "latest news", "recent news", "breaking news", "headlines",
            "transfer", "transfers", "signed", "signing", "rumor", "rumour", "rumours",
            "rumors", "contract", "upgrade", "upgrades", "newey", "adrian newey"
        ]):
            return ["web_search"], {
                "intent": "WEB_SEARCH",
                "query": question,
            }

        # ═══════════════════════════════════════════════════════════════════
        # 17. SPECIFIC RACE + YEAR FALLBACK
        # ═══════════════════════════════════════════════════════════════════
        if race and year:
            return ["f1_data"], {
                "intent": "RACE_RESULT",
                "action": "get_race_result",
                "year": year,
                "race": race,
            }

        # ═══════════════════════════════════════════════════════════════════
        # 18. FALLBACK: Web Search for open questions
        # ═══════════════════════════════════════════════════════════════════
        if len(q.split()) > 3:
            return ["web_search"], {
                "intent": "WEB_SEARCH",
                "query": question,
            }

        return [], {"intent": "DIRECT_LLM"}

    def execute_tools(self, tools: List[str], params: Dict[str, Any]) -> Tuple[Dict[str, Any], List[str]]:
        """
        Execute the routed tools and collect structured data and authentic sources.
        """
        aggregated_data = {}
        sources = []
        action = params.get("action", "")

        # 1. Telemetry Execution
        if "telemetry" in tools:
            sector = params.get("sector", 2)
            driver = params.get("driver")
            tel_data = analyze_sector_time_loss(sector=sector, driver=driver)
            aggregated_data["telemetry"] = tel_data
            sources.append(f"Live Telemetry Channel — Sector {sector} Analysis")

        # 2. RAG Execution
        if "rag" in tools:
            query = params.get("query", "")
            rag_data = retrieve_knowledge(query, top_k=2)
            aggregated_data["rag"] = rag_data
            for src in rag_data.get("sources", []):
                sources.append(f"knowledge/{src}")

        # 3. F1 Data Execution
        if "f1_data" in tools:
            if action == "get_next_f1_race":
                next_race_data = get_next_f1_race()
                aggregated_data["f1_data"] = next_race_data
                sources.append("Jolpica F1 API — Formula 1 Official Calendar")

            elif action == "get_last_completed_f1_race":
                last_race_data = get_last_completed_f1_race()
                aggregated_data["f1_data"] = last_race_data
                race_name = last_race_data.get("race", last_race_data.get("race_name", "Grand Prix"))
                year_name = last_race_data.get("year", "2026")
                sources.append(f"Jolpica F1 API — {year_name} {race_name} Race Results")

            elif action == "get_driver_standings":
                driver_target = params.get("driver")
                y = params.get("year", "current")
                standings_data = get_driver_standings(driver_name=driver_target, year=y)
                aggregated_data["f1_data"] = standings_data
                season_label = standings_data.get("season", y) if isinstance(standings_data, dict) else y
                sources.append(f"Jolpica F1 API — {season_label} World Drivers' Championship Standings")

            elif action == "get_constructor_standings":
                constructor_target = params.get("constructor")
                y = params.get("year", "current")
                c_standings = get_constructor_standings(constructor_name=constructor_target, year=y)
                aggregated_data["f1_data"] = c_standings
                season_label = c_standings.get("season", y) if isinstance(c_standings, dict) else y
                sources.append(f"Jolpica F1 API — {season_label} World Constructors' Championship Standings")

            elif action == "get_fastest_lap":
                fl_data = get_fastest_lap(year=params.get("year", "current"), race=params.get("race", "last"))
                aggregated_data["f1_data"] = fl_data
                race_label = fl_data.get("race", params.get("race", "Grand Prix"))
                sources.append(f"Jolpica F1 API — {fl_data.get('year', params.get('year'))} {race_label} Fastest Lap")

            elif action == "get_qualifying_result":
                q_data = get_qualifying_result(year=params.get("year", "current"), race=params.get("race", "last"))
                aggregated_data["f1_data"] = q_data
                race_label = q_data.get("race", params.get("race", "Grand Prix"))
                sources.append(f"Jolpica F1 API — {q_data.get('year', params.get('year'))} {race_label} Qualifying")

            elif action == "best_driver_analysis":
                aggregated_data["f1_data"] = {
                    "type": "best_driver_analysis",
                    "legends": [
                        {"driver": "Lewis Hamilton", "titles": 7, "wins": 105, "poles": 104, "podiums": 201, "key_strength": "All-time wins & poles record, consistent excellence across multiple regulation eras"},
                        {"driver": "Michael Schumacher", "titles": 7, "wins": 91, "poles": 68, "podiums": 155, "key_strength": "Revolutionized driver fitness, relentless race pace, Ferrari era dominance"},
                        {"driver": "Juan Manuel Fangio", "titles": 5, "wins": 24, "poles": 29, "podiums": 35, "key_strength": "Highest career win percentage in history (46.15%), won titles with 4 different constructors"},
                        {"driver": "Max Verstappen", "titles": 3, "wins": 61, "poles": 40, "podiums": 107, "key_strength": "Record single-season dominance (19 wins in 2023, 86.4% win rate), exceptional car control"},
                        {"driver": "Ayrton Senna", "titles": 3, "wins": 41, "poles": 65, "podiums": 80, "key_strength": "Legendary raw qualifying speed, wet-weather mastery, iconic Monaco performances"},
                        {"driver": "Alain Prost", "titles": 4, "wins": 51, "poles": 33, "podiums": 106, "key_strength": "'The Professor' tactical racing intellect, rivalries across turbo/naturally aspirated eras"}
                    ]
                }
                sources.append("Jolpica F1 API & FIA Historical Archives — All-Time Formula 1 Driver Records")

            elif action == "compare_drivers":
                d_a = params["driver_a"]
                d_b = params["driver_b"]
                y = params.get("year")
                stats_a = get_driver_statistics(d_a, year=y)
                stats_b = get_driver_statistics(d_b, year=y)
                aggregated_data["f1_data"] = {
                    "type": "driver_comparison",
                    "driver_a_stats": stats_a,
                    "driver_b_stats": stats_b,
                    "year": y
                }
                sources.append(f"Jolpica F1 API — {d_a} vs {d_b} Statistics ({y or 'Career'})")

            elif action == "get_driver_statistics":
                d_stats = get_driver_statistics(driver=params["driver"], year=params.get("year"))
                aggregated_data["f1_data"] = d_stats
                sources.append(f"Jolpica F1 API — Driver Statistics for {d_stats.get('driver', params['driver'])}")

            elif action == "get_constructor_statistics":
                c_stats = get_constructor_statistics(constructor=params["constructor"], year=params.get("year"))
                aggregated_data["f1_data"] = c_stats
                sources.append(f"Jolpica F1 API — Constructor Statistics for {c_stats.get('constructor', params['constructor'])}")

            elif action == "get_race_schedule":
                sched = get_race_schedule(year=params.get("year", "current"))
                # If a specific race was targeted, attach focused race details
                target_race_str = params.get("race")
                if target_race_str and "races" in sched:
                    matched_race = None
                    norm_target = target_race_str.lower().replace("gp", "").replace("grand", "").replace("prix", "").strip()
                    for r in sched["races"]:
                        if norm_target in r.get("race_name", "").lower() or norm_target in r.get("country", "").lower():
                            matched_race = r
                            break
                    sched["focused_race"] = matched_race

                aggregated_data["f1_data"] = sched
                sources.append(f"Jolpica F1 API — {sched.get('year', params.get('year'))} Race Calendar")

            else:  # Default to race result
                res = get_race_result(year=params.get("year", "current"), race=params.get("race", "last"))
                aggregated_data["f1_data"] = res
                sources.append(f"Jolpica F1 API — {res.get('year', params.get('year'))} {res.get('race', params.get('race'))} Race Results")

        # 4. Web Search Execution
        if "web_search" in tools:
            query = params.get("query", "")
            search_items = search_web(query, max_results=3)
            aggregated_data["web_search"] = {"results": search_items, "query": query}
            for item in search_items:
                title = item.get("title", "")
                if title:
                    sources.append(title)

        return aggregated_data, sources

    def _format_context(self, tools: List[str], data: Dict[str, Any]) -> str:
        """
        Format collected multi-tool data into INTERNAL context for Gemini.
        This context is NEVER shown to the user — it is only used by Gemini
        to synthesize a clean answer.
        """
        blocks = []

        # RAG Context
        if "rag" in data:
            rag_info = data["rag"]
            blocks.append("F1 Knowledge Base Information:")
            blocks.append(rag_info.get("context", ""))

        # Telemetry Context
        if "telemetry" in data:
            tel = data["telemetry"]
            blocks.append("Telemetry Analysis Data:")
            blocks.append(f"- Sector: {tel.get('sector_name')}")
            blocks.append(f"- Time Loss: {tel.get('time_loss_delta')}")
            blocks.append(f"- Primary Cause: {tel.get('primary_cause')}")
            for item in tel.get("telemetry_findings", []):
                blocks.append(f"  - {item}")
            blocks.append(f"- Recommendation: {tel.get('recommendation')}")

        # F1 Data Context — structured factual data
        if "f1_data" in data:
            f1_d = data["f1_data"]
            if isinstance(f1_d, dict):
                if "error" in f1_d:
                    blocks.append(f"F1 Data API Notice: {f1_d['error']}. Note: Requested data could not be retrieved from the F1 data source; do not fabricate information.")

                # Date-aware Next F1 Race
                elif "next_race" in f1_d or "total_future_races" in f1_d:
                    curr_d = f1_d.get("current_date", datetime.now().date().isoformat())
                    nr = f1_d.get("next_race", {})
                    blocks.append(f"Date-Aware F1 Calendar Calculation (Current Date: {curr_d}):")
                    blocks.append(f"- Next Upcoming Grand Prix: {nr.get('race_name', f1_d.get('race_name'))}")
                    blocks.append(f"- Circuit: {nr.get('circuit_name', f1_d.get('circuit_name'))} ({nr.get('locality', f1_d.get('locality'))}, {nr.get('country', f1_d.get('country'))})")
                    blocks.append(f"- Date: {nr.get('date', f1_d.get('date'))} {nr.get('time', f1_d.get('time', ''))}")
                    blocks.append(f"- Season & Round: Round {nr.get('round', f1_d.get('round'))} of the {nr.get('year', f1_d.get('year'))} FIA Formula One World Championship")
                    if "days_until" in nr:
                        blocks.append(f"- Days Until Race: {nr.get('days_until')} days from today")

                # Single driver standing result
                elif "driver" in f1_d and "position" in f1_d and "points" in f1_d and "standings" not in f1_d:
                    blocks.append(f"Official Formula 1 Standings — {f1_d.get('season', '2026')} Season (after Round {f1_d.get('rounds_completed', '?')}):")
                    blocks.append(f"- Driver: {f1_d.get('driver')} ({f1_d.get('team', '')})")
                    blocks.append(f"- Championship Position: P{f1_d.get('position')} in the World Drivers' Championship")
                    blocks.append(f"- Championship Points: {f1_d.get('points')} points")
                    blocks.append(f"- Season Wins: {f1_d.get('wins')} wins")
                    blocks.append(f"- Rounds Completed: {f1_d.get('rounds_completed')}")
                    blocks.append(f"- Season: {f1_d.get('season')}")

                # Single constructor standing result
                elif "team" in f1_d and "position" in f1_d and "points" in f1_d and "standings" not in f1_d:
                    blocks.append(f"Official Formula 1 Constructors' Standings — {f1_d.get('season', '2026')} Season (after Round {f1_d.get('rounds_completed', '?')}):")
                    blocks.append(f"- Team / Constructor: {f1_d.get('team')}")
                    blocks.append(f"- Championship Position: P{f1_d.get('position')} in the World Constructors' Championship")
                    blocks.append(f"- Points: {f1_d.get('points')} points")
                    blocks.append(f"- Wins: {f1_d.get('wins')} wins")

                # Overall Driver / Constructor Standings list
                elif "standings" in f1_d:
                    season_yr = f1_d.get('season', f1_d.get('year', '2026'))
                    rnd = f1_d.get('rounds_completed', f1_d.get('round', '?'))
                    blocks.append(f"Official Formula 1 Championship Standings — {season_yr} Season (after Round {rnd}):")
                    if f1_d.get("leader"):
                        ldr = f1_d["leader"]
                        if "driver" in ldr:
                            blocks.append(f"- Championship Leader: {ldr.get('driver')} ({ldr.get('team')}) with {ldr.get('points')} points (P1, {ldr.get('wins')} wins)")
                        elif "team" in ldr:
                            blocks.append(f"- Championship Leader: {ldr.get('team')} with {ldr.get('points')} points (P1, {ldr.get('wins')} wins)")
                    for s in f1_d.get("standings", [])[:10]:
                        if s.get("driver"):
                            blocks.append(f"- P{s.get('position')}: {s.get('driver')} ({s.get('team')}) — {s.get('points')} pts, {s.get('wins')} wins")
                        elif s.get("team"):
                            blocks.append(f"- P{s.get('position')}: {s.get('team')} — {s.get('points')} pts, {s.get('wins')} wins")

                # Fastest Lap
                elif "fastest_lap" in f1_d:
                    fl = f1_d.get("fastest_lap", {})
                    blocks.append(f"Fastest Lap Data — {f1_d.get('year')} {f1_d.get('race')}:")
                    blocks.append(f"- Driver: {fl.get('driver')} ({fl.get('team')})")
                    blocks.append(f"- Fastest Lap Time: {fl.get('time')}")
                    blocks.append(f"- Set on Lap: {fl.get('lap')}")

                # Pole Position / Qualifying
                elif "pole_position" in f1_d:
                    p = f1_d.get("pole_position", {})
                    blocks.append(f"Qualifying & Pole Position Data — {f1_d.get('year')} {f1_d.get('race')}:")
                    if p:
                        blocks.append(f"- Pole Position: {p.get('driver')} ({p.get('team')}) — Lap Time: {p.get('time')}")
                    if f1_d.get("qualifying_results"):
                        for qr in f1_d["qualifying_results"][:5]:
                            blocks.append(f"- P{qr.get('position')}: {qr.get('driver')} ({qr.get('team')}) Q3={qr.get('q3', 'N/A')}")

                # Race Winner & Results
                elif "winner" in f1_d or "results" in f1_d:
                    blocks.append(f"Race Results — {f1_d.get('year')} {f1_d.get('race')}:")
                    blocks.append(f"- Circuit: {f1_d.get('circuit', '')} ({f1_d.get('country', '')})")
                    blocks.append(f"- Date Held: {f1_d.get('date', '')}")
                    if f1_d.get("winner"):
                        w = f1_d["winner"]
                        blocks.append(f"- Winner: {w.get('driver')} ({w.get('team')}) — Time: {w.get('time', 'N/A')}")
                    for r in f1_d.get("results", [])[:5]:
                        fl_info = ""
                        if r.get("fastest_lap") and r["fastest_lap"].get("rank") == 1:
                            fl_info = f" [FASTEST LAP: {r['fastest_lap'].get('time', '')}]"
                        blocks.append(f"- P{r.get('position')}: {r.get('driver')} ({r.get('team')}) — {r.get('time', 'N/A')}{fl_info}")

                # Race Calendar (General or Focused)
                elif "races" in f1_d:
                    if f1_d.get("focused_race"):
                        fr = f1_d["focused_race"]
                        blocks.append(f"Formula 1 Grand Prix Schedule Information:")
                        blocks.append(f"- Grand Prix: {fr.get('race_name')}")
                        blocks.append(f"- Date: {fr.get('date')}")
                        blocks.append(f"- Circuit: {fr.get('circuit_name')} ({fr.get('locality')}, {fr.get('country')})")
                        blocks.append(f"- Season & Round: Round {fr.get('round')} of the {f1_d.get('year')} Season")
                    else:
                        blocks.append(f"Race Calendar — {f1_d.get('year')}: {f1_d.get('total_rounds')} rounds")
                        for race_item in f1_d.get("races", [])[:24]:
                            blocks.append(f"- Round {race_item.get('round')}: {race_item.get('race_name')} at {race_item.get('circuit_name')} ({race_item.get('date')})")

        # Web Search Context
        if "web_search" in data:
            ws = data["web_search"]
            results = ws.get("results", [])
            if results:
                blocks.append("\nWeb Research Data (for synthesis only — do NOT expose to user):")
                for item in results:
                    blocks.append(f"- {item.get('title', '')}: {item.get('snippet', '')}")

        return "\n".join(blocks)

    def _clean_sources(self, sources: List[str]) -> List[str]:
        """
        Clean source names for user display. Remove URLs and internal labels.
        Keep only human-readable source names.
        """
        clean = []
        seen = set()
        for src in sources:
            if src.startswith("http://") or src.startswith("https://"):
                continue
            name = src.strip()
            if name and name not in seen:
                seen.add(name)
                clean.append(name)
        return clean

    def process_query(self, question: str) -> Dict[str, Any]:
        """
        Execute end-to-end intelligent multi-tool query orchestration.
        
        Pipeline:
        1. Detect intent → determine tools
        2. Execute tools → gather data + sources
        3. Format internal context (never shown to user)
        4. Send to Gemini for synthesis
        5. Return clean answer + sources
        
        Returns schema:
        {
            "answer": str,           # Clean, natural-language answer
            "tool_used": List[str],  # e.g. ["f1_data"], ["web_search"], ["rag"]
            "sources": List[str],    # Clean source names (no URLs)
            "confidence": str,       # "high" | "medium" | "low"
            "debug": Dict | None     # Populated when DEBUG_MODE=true
        }
        """
        if not question or not question.strip():
            return {
                "answer": "Please provide a valid Formula 1 question.",
                "tool_used": [],
                "sources": [],
                "confidence": "low",
                "debug": None
            }

        runtime_now = datetime.now()
        runtime_date_str = runtime_now.date().isoformat()

        tools, params = self.detect_intent(question)
        sources: List[str] = []
        context = None
        confidence = "high"
        debug_info = None

        intent_name = params.get("intent", "GENERAL_QUERY")
        tool_name = "None"
        if "f1_data" in tools:
            tool_name = params.get("action", "f1_data_tool")
        elif "rag" in tools:
            tool_name = "rag_retriever"
        elif "telemetry" in tools:
            tool_name = "telemetry_tool"
        elif "web_search" in tools:
            tool_name = "search_web"

        driver_target = params.get("driver")
        status = "PENDING"

        if tools:
            data, tool_sources = self.execute_tools(tools, params)
            sources = tool_sources

            # Check status
            f1_d = data.get("f1_data")
            if isinstance(f1_d, dict) and "error" in f1_d:
                status = "API_ERROR"
                context = f"The F1 data API returned: {f1_d['error']}. Please inform the user that requested data could not be retrieved from the F1 data source."
                confidence = "medium"
            else:
                status = "SUCCESS"
                context = self._format_context(tools, data)

            # Debug logging output (stdout)
            if intent_name == "NEXT_F1_RACE" and isinstance(f1_d, dict):
                nr = f1_d.get("next_race", {})
                print(f"[AGENT] INTENT: NEXT_F1_RACE")
                print(f"[AGENT] CURRENT_DATE: {runtime_date_str}")
                print(f"[AGENT] CALENDAR_RACES_FOUND: {f1_d.get('calendar_races_found', 23)}")
                print(f"[AGENT] NEXT_RACE: {nr.get('race_name', f1_d.get('race_name'))}")
                print(f"[AGENT] NEXT_RACE_DATE: {nr.get('date', f1_d.get('date'))}")
            elif intent_name == "LAST_F1_RACE" and isinstance(f1_d, dict):
                print(f"[AGENT] INTENT: LAST_F1_RACE")
                print(f"[AGENT] CURRENT_DATE: {runtime_date_str}")
                print(f"[AGENT] LAST_COMPLETED_RACE: {f1_d.get('race', f1_d.get('race_name'))}")
                print(f"[AGENT] RACE_DATE: {f1_d.get('date')}")
                print(f"[AGENT] RESULT_STATUS: {status}")
            else:
                print(f"[AGENT] INTENT: {intent_name}")
                print(f"[AGENT] TOOL: {tool_name}")
                if driver_target:
                    print(f"[AGENT] DRIVER: {driver_target}")
                print(f"[AGENT] STATUS: {status}")

            # Capture debug info if enabled
            if DEBUG_MODE:
                debug_info = {
                    "intent": intent_name,
                    "tool": tool_name,
                    "current_date": runtime_date_str,
                    "driver": driver_target,
                    "status": status,
                    "tools_used": tools,
                    "params": params,
                    "raw_context_length": len(context) if context else 0,
                    "raw_context_preview": (context[:500] + "...") if context and len(context) > 500 else context,
                }
        else:
            status = "DIRECT_SYNTHESIS"
            print(f"[AGENT] INTENT: {intent_name}")
            print(f"[AGENT] TOOL: {tool_name}")
            print(f"[AGENT] STATUS: {status}")

        # ═══════════════════════════════════════════════════════════════════
        # Gemini Synthesis
        # ═══════════════════════════════════════════════════════════════════
        print(f"[AGENT] Sending to Gemini for synthesis...")
        answer = generate_gemini_response(question=question, context=context)
        print(f"[AGENT] Gemini response: {answer[:100].encode('ascii', 'replace').decode()}...")

        # Clean sources for display
        clean_sources = self._clean_sources(sources)

        return {
            "answer": answer,
            "tool_used": tools,
            "sources": clean_sources,
            "confidence": confidence,
            "debug": debug_info
        }


# Global agent instance
default_agent = F1Agent()


def ask_agent(question: str) -> Dict[str, Any]:
    """Convenience helper to ask the unified F1 agent."""
    return default_agent.process_query(question)
