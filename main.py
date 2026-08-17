"""
F1 AI Agent Backend — Powered by Google Gemini
Simple JSON request/response with automatic tool execution. No streaming.
"""

import os
# pyrefly: ignore [missing-import]
from dotenv import load_dotenv
load_dotenv()

import json
import time
import asyncio
from datetime import datetime
from typing import Optional

import httpx
from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from google import genai
from google.genai import types

# ═══════════════════════════════════════════════════════════════════════════════
# CONFIGURATION
# ═══════════════════════════════════════════════════════════════════════════════

GEMINI_API_KEY = os.getenv("GEMINI_API_KEY")
if not GEMINI_API_KEY:
    raise ValueError("GEMINI_API_KEY is missing from environment/.env")

client = genai.Client(api_key=GEMINI_API_KEY)
MODEL_ID = "gemini-2.5-flash"

# ═══════════════════════════════════════════════════════════════════════════════
# TTL CACHE
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
# F1 TOOLS — 2.5s timeout, plain string returns, clean fallbacks
# ═══════════════════════════════════════════════════════════════════════════════

JOLPICA = "https://api.jolpi.ca/ergast/f1"


async def get_driver_standings() -> str:
    """Fetch current top 10 F1 driver standings."""
    cached = _cache_get("driver_standings")
    if cached:
        return cached
    try:
        async with httpx.AsyncClient(timeout=2.5) as c:
            res = await c.get(f"{JOLPICA}/current/driverStandings.json")
            if res.status_code != 200:
                return "Unable to fetch live standings right now."
            data = res.json()
            standings = data["MRData"]["StandingsTable"]["StandingsLists"][0]["DriverStandings"]
            result = "\n".join([
                f"{s['position']}. {s['Driver']['givenName']} {s['Driver']['familyName']} "
                f"({s['Constructors'][0]['name']}) - {s['points']} pts"
                for s in standings[:10]
            ])
            _cache_set("driver_standings", result, 60)
            return result
    except Exception:
        return "Live standings timed out. Answer with the latest known 2025 season standings."


async def get_next_race() -> str:
    """Fetch the next upcoming F1 race."""
    cached = _cache_get("next_race")
    if cached:
        return cached
    try:
        async with httpx.AsyncClient(timeout=2.5) as c:
            res = await c.get(f"{JOLPICA}/current.json")
            if res.status_code != 200:
                return "Unable to fetch race schedule right now."
            races = res.json()["MRData"]["RaceTable"]["Races"]
            now = datetime.utcnow()
            for race in races:
                try:
                    dt = datetime.fromisoformat(
                        f"{race['date']}T{race.get('time', '14:00:00Z').replace('Z', '+00:00')}"
                    )
                    if dt.replace(tzinfo=None) > now:
                        circuit = race.get("Circuit", {})
                        loc = circuit.get("Location", {})
                        result = (
                            f"Next: {race['raceName']} (Rd {race['round']})\n"
                            f"Date: {race['date']} at {race.get('time','TBD')}\n"
                            f"Circuit: {circuit.get('circuitName','TBD')}\n"
                            f"Location: {loc.get('locality','')}, {loc.get('country','')}"
                        )
                        _cache_set("next_race", result, 300)
                        return result
                except (ValueError, TypeError):
                    continue
            return "No upcoming races found — season may be over."
    except Exception:
        return "Live schedule timed out. Answer with the latest known race calendar."


async def get_constructor_standings() -> str:
    """Fetch current F1 constructor standings."""
    cached = _cache_get("constructor_standings")
    if cached:
        return cached
    try:
        async with httpx.AsyncClient(timeout=2.5) as c:
            res = await c.get(f"{JOLPICA}/current/constructorStandings.json")
            if res.status_code != 200:
                return "Unable to fetch constructor standings right now."
            data = res.json()
            standings = data["MRData"]["StandingsTable"]["StandingsLists"][0]["ConstructorStandings"]
            result = "\n".join([
                f"{s['position']}. {s['Constructor']['name']} - {s['points']} pts ({s['wins']} wins)"
                for s in standings[:10]
            ])
            _cache_set("constructor_standings", result, 60)
            return result
    except Exception:
        return "Live constructor standings timed out. Answer with the latest known standings."


async def get_last_race_results() -> str:
    """Fetch results from the most recent F1 race."""
    cached = _cache_get("last_race_results")
    if cached:
        return cached
    try:
        async with httpx.AsyncClient(timeout=2.5) as c:
            res = await c.get(f"{JOLPICA}/current/last/results.json")
            if res.status_code != 200:
                return "Unable to fetch last race results right now."
            data = res.json()
            race = data["MRData"]["RaceTable"]["Races"][0]
            lines = [f"{race['raceName']} — {race.get('date','')}", f"Circuit: {race['Circuit']['circuitName']}", ""]
            for r in race.get("Results", [])[:10]:
                d = r["Driver"]
                lines.append(f"P{r['position']}. {d['givenName']} {d['familyName']} ({r['Constructor']['name']}) - {r.get('points','0')} pts")
            result = "\n".join(lines)
            _cache_set("last_race_results", result, 60)
            return result
    except Exception:
        return "Live results timed out. Answer with the latest known race results."


# Tool dispatcher
TOOL_MAP = {
    "get_driver_standings": get_driver_standings,
    "get_next_race": get_next_race,
    "get_constructor_standings": get_constructor_standings,
    "get_last_race_results": get_last_race_results,
}

# ═══════════════════════════════════════════════════════════════════════════════
# SYSTEM PROMPT
# ═══════════════════════════════════════════════════════════════════════════════

F1_SYSTEM_PROMPT = """You are ApexAI, a lightning-fast F1 assistant for the 2026 season. Provide direct, factual, and concise answers without fluff.

Rules:
- Answer immediately — no preamble, no filler
- Use F1 tools to fetch live data when asked about standings, races, or results
- Max 2-3 short paragraphs unless user asks for detail
- Use markdown formatting for readability
- Never fabricate statistics — use tools or say you're unsure
- F1 terminology is fine (DRS, undercut, deg, delta, etc.)
"""

# ═══════════════════════════════════════════════════════════════════════════════
# TOOL DECLARATIONS
# ═══════════════════════════════════════════════════════════════════════════════

gemini_tools = [
    {
        "function_declarations": [
            {
                "name": "get_driver_standings",
                "description": "Get the current F1 driver championship standings.",
                "parameters": {"type": "object", "properties": {}},
            },
            {
                "name": "get_next_race",
                "description": "Get details about the next upcoming F1 race.",
                "parameters": {"type": "object", "properties": {}},
            },
            {
                "name": "get_constructor_standings",
                "description": "Get the current F1 constructor/team championship standings.",
                "parameters": {"type": "object", "properties": {}},
            },
            {
                "name": "get_last_race_results",
                "description": "Get the results from the most recent F1 race.",
                "parameters": {"type": "object", "properties": {}},
            },
        ]
    }
]

# ═══════════════════════════════════════════════════════════════════════════════
# FASTAPI APP
# ═══════════════════════════════════════════════════════════════════════════════

app = FastAPI(title="APEX F1 AI Agent", version="3.0.0")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


class ChatRequest(BaseModel):
    message: str
    context: Optional[str] = None


# ═══════════════════════════════════════════════════════════════════════════════
# CHAT ENDPOINT — Simple JSON, no streaming
# ═══════════════════════════════════════════════════════════════════════════════

from fastapi import Request

@app.post("/api/chat")
async def chat(request: Request):
    """
    Non-streaming chat endpoint. Returns {"reply": "..."}.
    Directly injects live F1 data into the prompt to avoid 500 tool schema errors.
    """
    try:
        data = await request.json()
        message = data.get("message") or data.get("prompt") or data.get("query") or ""
        context = data.get("context")

        if not message:
            return {"reply": "No message provided."}

        # Step 1: Fetch live data directly
        drivers = await get_driver_standings()
        constructors = await get_constructor_standings()
        next_race = await get_next_race()
        last_results = await get_last_race_results()
        
        # Step 2: Inject data into prompt
        injected_context = (
            f"Here is the latest live F1 data for context:\n"
            f"--- DRIVER STANDINGS ---\n{drivers}\n\n"
            f"--- CONSTRUCTOR STANDINGS ---\n{constructors}\n\n"
            f"--- NEXT RACE ---\n{next_race}\n\n"
            f"--- LAST RACE RESULTS ---\n{last_results}\n\n"
        )
        
        prompt = f"{injected_context}\nUser question: {message}"
        if context:
            prompt = f"[Context: {context}]\n\n{prompt}"

        # Step 3: Ask Gemini
        response = client.models.generate_content(
            model=MODEL_ID,
            contents=prompt,
            config=types.GenerateContentConfig(
                system_instruction=F1_SYSTEM_PROMPT,
                temperature=0.1,
                max_output_tokens=2048,
                thinking_config=types.ThinkingConfig(thinking_budget=0),
            ),
        )
        
        reply = response.text or "I couldn't generate a response. Please try again."
        return {"reply": reply}

    except Exception as e:
        import traceback
        traceback.print_exc()
        return {"reply": f"Sorry, I encountered an internal error: {str(e)}"}


@app.get("/")
async def root():
    return {"service": "APEX F1 AI Agent", "status": "online", "model": MODEL_ID}


@app.get("/health")
async def health_check():
    return {"status": "healthy", "timestamp": datetime.utcnow().isoformat()}


# ═══════════════════════════════════════════════════════════════════════════════
# MAIN
# ═══════════════════════════════════════════════════════════════════════════════

if __name__ == "__main__":
    import uvicorn
    print()
    print("  🏎️  APEX F1 AI Agent — v3.0")
    print(f"  📡 Model:  {MODEL_ID}")
    print(f"  🔑 Key:    ***{GEMINI_API_KEY[-4:]}")
    print(f"  ✅ GEMINI_API_KEY detected: YES")
    print(f"  🌐 http://localhost:8000")
    print(f"  📖 http://localhost:8000/docs")
    print()
    uvicorn.run("main:app", host="0.0.0.0", port=8000, reload=True)
