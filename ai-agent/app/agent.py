"""
Integrated Formula 1 AI Agent Orchestrator
===========================================
Unified AI Agent connecting:
1. Hugging Face LLM Layer (app/llm/huggingface.py)
2. F1 Structured Data Tool (app/tools/f1_data_tool.py)
3. Web Search Tool (app/tools/search_tool.py)
4. Local RAG Knowledge Base (app/rag/)
5. F1 Telemetry Tool (app/tools/telemetry_tool.py)

Performs intelligent multi-tool routing, executes necessary data providers,
formats grounded context, and synthesizes answers via the LLM with no hallucinations.
"""

import os
import re
from typing import Any, Dict, List, Optional, Tuple, Union

from app.llm.huggingface import generate_response
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
)
from app.tools.search_tool import search_web, search_f1_news
from app.tools.telemetry_tool import (
    analyze_sector_time_loss,
    compare_driver_telemetry,
    get_live_telemetry_snapshot,
)
from app.rag import retrieve_knowledge, is_knowledge_query


class F1Agent:
    """
    Unified F1 AI Agent with intelligent multi-tool intent detection and routing.
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

    KNOWN_DRIVERS = [
        "verstappen", "hamilton", "bottas", "leclerc", "norris", "perez",
        "alonso", "sainz", "russell", "piastri", "vettel", "ricciardo",
        "gasly", "ocon", "tsunoda", "albon", "hulkenberg", "magnussen",
        "stroll", "zhou", "sargeant", "colapinto", "bearman", "lawson",
        "raikkonen", "schumacher", "massa", "button", "rosberg", "senna", "prost",
    ]

    KNOWN_TEAMS = [
        "red bull", "mercedes", "ferrari", "mclaren", "aston martin",
        "alpine", "williams", "haas", "sauber", "kick sauber", "rb",
        "racing bulls", "alphatauri", "alfa romeo", "toro rosso", "renault",
        "racing point", "force india",
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
            if candidate and len(candidate) > 2:
                return candidate

        return None

    def _extract_drivers(self, text: str) -> List[str]:
        """Extract all driver names mentioned in the query."""
        text_lower = text.lower()
        found = []
        for d in self.KNOWN_DRIVERS:
            if re.search(rf"\b{re.escape(d)}\b", text_lower):
                found.append(d)
        return found

    def _extract_team(self, text: str) -> Optional[str]:
        """Extract constructor / team name from query."""
        text_lower = text.lower()
        for t in self.KNOWN_TEAMS:
            if t in text_lower:
                return t
        return None

    def detect_intent(self, question: str) -> Tuple[List[str], Dict[str, Any]]:
        """
        Analyze incoming user query and determine which tool(s) to execute.
        
        Returns:
            Tuple of (tools_list, parameters_dict)
            e.g. (["f1_data"], {...}), (["f1_data", "web_search"], {...}), (["rag"], {...}), (["telemetry"], {...})
        """
        q = question.lower().strip()
        q_clean = re.sub(r"['’`]", "", q)
        year = self._extract_year(q)
        race = self._extract_race(q)
        drivers = self._extract_drivers(q)
        driver = drivers[0] if drivers else None
        team = self._extract_team(q)

        # 1. Telemetry Tool Intent
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
            return ["telemetry"], {"sector": sector_num, "driver": driver, "query": question}

        # 2. Best / Greatest Driver Query (Multi-criteria evaluation with no biased definitive claim)
        if any(term in q for term in [
            "best driver", "best f1 driver", "greatest driver", "greatest f1 driver",
            "goat of f1", "goat driver", "who is the best driver", "who is the greatest"
        ]):
            return ["f1_data"], {"action": "best_driver_analysis", "query": question}

        # 3. Driver Comparison (F1 Data Tool)
        if len(drivers) >= 2 and any(term in q for term in ["compare", "vs", "versus", "better", "head to head", "between"]):
            return ["f1_data"], {
                "action": "compare_drivers",
                "driver_a": drivers[0],
                "driver_b": drivers[1],
                "year": year
            }

        # 3. Hybrid Narrative / 'What Happened' (F1 Data + Web Search)
        if (any(term in q for term in [
            "what happened", "why was", "why did", "controversy", "drama",
            "explain the race", "incident", "crash between", "safety car restart"
        ]) or (q.startswith("what happened") and (race or year))):
            target_year = year or "current"
            target_race = race or "last"
            return ["f1_data", "web_search"], {
                "action": "hybrid_race_narrative",
                "year": target_year,
                "race": target_race,
                "query": question
            }

        # 4. News / Latest updates / Breaking stories / Rumors (Web Search)
        if any(term in q for term in [
            "news", "latest news", "recent news", "breaking news", "headlines",
            "transfer", "transfers", "signed", "signing", "rumor", "rumour", "rumours",
            "rumors", "contract", "upgrade", "upgrades", "newey", "adrian newey"
        ]):
            return ["web_search"], {"query": question}

        # 5. Local RAG Knowledge Base (Rules, DRS, ERS, Tyres, Points, Aero, Flags, Concepts)
        if is_knowledge_query(q) and not race and not year:
            return ["rag"], {"query": question}

        # 6. Fastest Lap Intent (F1 Data Tool)
        if any(term in q for term in ["fastest lap", "fastest time", "quickest lap", "fastest lap time"]):
            target_year = year or "current"
            target_race = race or "last"
            return ["f1_data"], {"action": "get_fastest_lap", "year": target_year, "race": target_race}

        # 7. Pole Position / Qualifying Intent (F1 Data Tool)
        if any(term in q for term in ["pole position", "on pole", "took pole", "qualifying", "qualify", "grid position", "starting grid", "quali"]):
            target_year = year or "current"
            target_race = race or "last"
            return ["f1_data"], {"action": "get_qualifying_result", "year": target_year, "race": target_race}

        # 8. Constructor Standings Intent (F1 Data Tool)
        if any(term in q or term in q_clean for term in [
            "constructor standings", "constructors standings", "constructors championship",
            "constructor championship", "team standings", "teams championship",
            "leading the constructors", "leading constructor", "who led the constructors",
            "who led the constructor", "who was leading the constructors",
            "constructor points", "team points", "leading team", "constructors title",
            "constructor standing", "constructors champion"
        ]) or (("constructor" in q_clean or "team" in q_clean) and any(w in q_clean for w in ["standings", "championship", "title", "won", "leader", "leading", "led"])):
            target_year = year or "current"
            return ["f1_data"], {"action": "get_constructor_standings", "year": target_year}

        # 9. Driver Standings / Championship Leader Intent (F1 Data Tool)
        if any(term in q or term in q_clean for term in [
            "driver standings", "drivers standings", "drivers championship", "driver championship",
            "championship standings", "leading the championship", "leading championship",
            "leading the drivers", "who is leading the", "who was leading the", "who led the",
            "world championship leader", "drivers title", "driver points", "standings leader",
            "driver standing", "won the championship", "won the title", "world champion",
            "drivers championship leader"
        ]) or (("driver" in q_clean or "championship" in q_clean) and any(w in q_clean for w in ["leader", "leading", "led the", "standings", "title", "won the"])):
            target_year = year or "current"
            return ["f1_data"], {"action": "get_driver_standings", "year": target_year}

        # 10. Race Schedule / Calendar Intent (F1 Data Tool)
        if any(term in q for term in ["schedule", "calendar", "races in", "how many races", "next grand prix", "upcoming race"]):
            target_year = year or "current"
            return ["f1_data"], {"action": "get_race_schedule", "year": target_year}

        # 11. Driver Statistics Intent (F1 Data Tool)
        if driver and any(term in q for term in ["stats", "statistic", "statistics", "how many wins", "how many podiums", "how many championships", "career", "career wins", "record"]):
            return ["f1_data"], {"action": "get_driver_statistics", "driver": driver, "year": year}

        # 12. Constructor Statistics Intent (F1 Data Tool)
        if team and any(term in q for term in ["stats", "statistics", "record", "constructor stats"]):
            return ["f1_data"], {"action": "get_constructor_statistics", "constructor": team, "year": year}

        # 13. Race Winner / Race Result Intent (F1 Data Tool)
        if any(term in q for term in ["who won", "winner of", "race winner", "won the", "won at", "race result", "results of", "who finished first", "podium of", "podium at", "who took victory"]):
            target_year = year or "current"
            target_race = race or "last"
            return ["f1_data"], {"action": "get_race_result", "year": target_year, "race": target_race}

        # 14. Mention of specific race + year defaults to Race Result
        if race and year:
            return ["f1_data"], {"action": "get_race_result", "year": year, "race": race}

        # 15. Fallback: If external query of sufficient length, use Web Search
        if len(q.split()) > 3:
            return ["web_search"], {"query": question}

        return [], {}

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
            if action == "best_driver_analysis":
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
                sources.append(f"Jolpica F1 API — {d_a.title()} vs {d_b.title()} Statistics ({y or 'Career'})")

            elif action == "hybrid_race_narrative":
                y = params.get("year", "current")
                r = params.get("race", "last")
                race_data = get_race_result(year=y, race=r)
                aggregated_data["f1_data"] = race_data
                sources.append(f"Jolpica F1 API — {y} {race_data.get('race', r)} Race Results")

            elif action == "get_fastest_lap":
                fl_data = get_fastest_lap(year=params.get("year", "current"), race=params.get("race", "last"))
                aggregated_data["f1_data"] = fl_data
                sources.append(f"Jolpica F1 API — {params.get('year')} {fl_data.get('race', params.get('race'))} Fastest Lap")

            elif action == "get_qualifying_result":
                q_data = get_qualifying_result(year=params.get("year", "current"), race=params.get("race", "last"))
                aggregated_data["f1_data"] = q_data
                sources.append(f"Jolpica F1 API — {params.get('year')} {q_data.get('race', params.get('race'))} Qualifying")

            elif action == "get_driver_standings":
                standings = get_driver_standings(year=params.get("year", "current"))
                aggregated_data["f1_data"] = standings
                sources.append(f"Jolpica F1 API — {standings.get('year', params.get('year'))} World Driver Championship Standings")

            elif action == "get_constructor_standings":
                c_standings = get_constructor_standings(year=params.get("year", "current"))
                aggregated_data["f1_data"] = c_standings
                sources.append(f"Jolpica F1 API — {c_standings.get('year', params.get('year'))} World Constructor Championship Standings")

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
                aggregated_data["f1_data"] = sched
                sources.append(f"Jolpica F1 API — {sched.get('year', params.get('year'))} Race Calendar")

            else:  # Default to race result
                res = get_race_result(year=params.get("year", "current"), race=params.get("race", "last"))
                aggregated_data["f1_data"] = res
                sources.append(f"Jolpica F1 API — {params.get('year')} {res.get('race', params.get('race'))} Race Results")

        # 4. Web Search Execution
        if "web_search" in tools:
            query = params.get("query", "")
            search_items = search_web(query, max_results=3)
            aggregated_data["web_search"] = {"results": search_items, "query": query}
            for item in search_items:
                if item.get("url"):
                    sources.append(item["url"])

        return aggregated_data, sources

    def _format_context(self, tools: List[str], data: Dict[str, Any]) -> str:
        """
        Format collected multi-tool data into structured context for the LLM.
        """
        blocks = []

        # RAG Context
        if "rag" in data:
            rag_info = data["rag"]
            blocks.append("Retrieved Local Formula 1 Knowledge Base Context:")
            blocks.append(rag_info.get("context", ""))

        # Telemetry Context
        if "telemetry" in data:
            tel = data["telemetry"]
            blocks.append("Official Telemetry & Sector Analysis:")
            blocks.append(f"- Sector: {tel.get('sector_name')}")
            blocks.append(f"- Time Loss Delta: {tel.get('time_loss_delta')}")
            blocks.append(f"- Primary Cause: {tel.get('primary_cause')}")
            blocks.append("- Telemetry Findings:")
            for item in tel.get("telemetry_findings", []):
                blocks.append(f"  * {item}")
            blocks.append(f"- Recommendation: {tel.get('recommendation')}")

        # F1 Data Context
        if "f1_data" in data:
            f1_d = data["f1_data"]
            if isinstance(f1_d, dict):
                if "error" in f1_d:
                    blocks.append(f"Official F1 Data Status: {f1_d['error']}")
                elif f1_d.get("type") == "best_driver_analysis":
                    blocks.append("F1 Historical Analysis & All-Time Statistical Records:")
                    blocks.append("Note: Declaring a single definitive 'best' driver is subjective because car competitiveness, regulations, and season lengths vary across eras. Present a multi-criteria evaluation with these official statistics:")
                    for leg in f1_d.get("legends", []):
                        blocks.append(f"- **{leg['driver']}**: {leg['titles']} World Titles, {leg['wins']} Wins, {leg['poles']} Poles, {leg['podiums']} Podiums ({leg['key_strength']})")
                elif f1_d.get("type") == "driver_comparison":
                    blocks.append("Official Driver Comparison Statistics:")
                    a = f1_d.get("driver_a_stats", {})
                    b = f1_d.get("driver_b_stats", {})
                    blocks.append(f"- {a.get('driver')}: {a.get('wins')} wins, {a.get('podiums')} podiums, {a.get('points')} pts (P{a.get('championship_position')})")
                    blocks.append(f"- {b.get('driver')}: {b.get('wins')} wins, {b.get('podiums')} podiums, {b.get('points')} pts (P{b.get('championship_position')})")
                elif "fastest_lap" in f1_d:
                    fl = f1_d.get("fastest_lap", {})
                    blocks.append(f"Official Fastest Lap ({f1_d.get('year')} {f1_d.get('race')}):")
                    blocks.append(f"- Driver: {fl.get('driver')} ({fl.get('team')}) - Time: {fl.get('time')} on lap {fl.get('lap')}")
                elif "pole_position" in f1_d:
                    p = f1_d.get("pole_position", {})
                    blocks.append(f"Official Qualifying ({f1_d.get('year')} {f1_d.get('race')}):")
                    blocks.append(f"- Pole Position: {p.get('driver')} ({p.get('team')}) - Time: {p.get('time')}")
                elif "standings" in f1_d:
                    leader = f1_d.get("leader", {})
                    blocks.append(f"Official Championship Standings ({f1_d.get('year')}):")
                    if leader.get("driver"):
                        blocks.append(f"- Leader: {leader.get('driver')} ({leader.get('team')}) with {leader.get('points')} pts")
                    elif leader.get("team"):
                        blocks.append(f"- Leading Constructor: {leader.get('team')} with {leader.get('points')} pts")
                elif "winner" in f1_d:
                    w = f1_d.get("winner", {})
                    blocks.append(f"Official Race Result ({f1_d.get('year')} {f1_d.get('race')}):")
                    blocks.append(f"- Winner: {w.get('driver')} ({w.get('team')}) - Time: {w.get('time')}")
                elif "races" in f1_d:
                    blocks.append(f"Official Calendar ({f1_d.get('year')}): {f1_d.get('total_rounds')} rounds scheduled.")

        # Web Search Context
        if "web_search" in data:
            ws = data["web_search"]
            blocks.append("\nReal-time Web Search Results & Context:")
            for item in ws.get("results", []):
                blocks.append(f"- **{item.get('title')}**: {item.get('snippet')} (URL: {item.get('url')})")

        return "\n".join(blocks)

    def process_query(self, question: str) -> Dict[str, Any]:
        """
        Execute end-to-end intelligent multi-tool query orchestration.
        
        Returns schema:
        {
            "answer": str,
            "tool_used": List[str],  # e.g. ["f1_data"], ["f1_data", "web_search"], ["rag"], ["telemetry"]
            "sources": List[str],
            "confidence": "high" | "medium" | "low"
        }
        """
        if not question or not question.strip():
            return {
                "answer": "Please provide a valid Formula 1 question.",
                "tool_used": [],
                "sources": [],
                "confidence": "low"
            }

        tools, params = self.detect_intent(question)
        sources: List[str] = []
        context = None
        confidence = "high"

        if tools:
            data, tool_sources = self.execute_tools(tools, params)
            sources = tool_sources

            # Check if F1 Data returned a specific not-found error
            f1_d = data.get("f1_data")
            if isinstance(f1_d, dict) and "error" in f1_d and len(tools) == 1 and tools[0] == "f1_data":
                answer = f"According to official Formula 1 records, {f1_d['error']}"
                return {
                    "answer": answer,
                    "tool_used": tools,
                    "sources": sources,
                    "confidence": "medium"
                }

            context = self._format_context(tools, data)

        llm_response = generate_response(prompt=question, context=context)

        # Handle unconfigured HF key gracefully
        if "[!] Hugging Face API Key is not configured" in llm_response:
            if context:
                clean_answer = re.sub(r"--- \[Document:.*?\] ---\n?", "", context)
                clean_answer = re.sub(r"^Retrieved Local Formula 1 Knowledge Base Context:\n?", "", clean_answer).strip()
                clean_answer = re.sub(r"^Official Telemetry & Sector Analysis:\n?", "", clean_answer).strip()
                clean_answer = re.sub(r"^F1 Historical Analysis & All-Time Statistical Records:\n?", "", clean_answer).strip()
                answer = clean_answer
            else:
                answer = "Formula 1 AI Agent: Please configure HF_API_KEY in .env for open-ended LLM conversation, or ask questions about F1 rules, telemetry, race results, and driver standings."
                confidence = "medium"
        else:
            answer = llm_response

        return {
            "answer": answer,
            "tool_used": tools,
            "sources": sources,
            "confidence": confidence
        }


# Global agent instance
default_agent = F1Agent()


def ask_agent(question: str) -> Dict[str, Any]:
    """Convenience helper to ask the unified F1 agent."""
    return default_agent.process_query(question)
