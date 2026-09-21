"""
Agent Orchestrator — ReAct-style Agentic Loop with Gemini Function Calling
============================================================================
The brain of the APEX F1 AI Agent. Receives user questions, retrieves
relevant context from the RAG vector store, uses Gemini's native
function-calling to decide which tools to invoke, executes them,
and returns a final answer.
"""

import os
import asyncio
from typing import Optional

from google import genai
from google.genai import types

from .tools import f1_api, web_search, telemetry
from .rag.vector_store import get_vector_store

# ═══════════════════════════════════════════════════════════════════════════════
# Configuration
# ═══════════════════════════════════════════════════════════════════════════════

MODEL_ID = os.getenv("MODEL_ID", "gemini-2.5-flash")

# ═══════════════════════════════════════════════════════════════════════════════
# System Prompt
# ═══════════════════════════════════════════════════════════════════════════════

SYSTEM_PROMPT = """You are **APEX**, a lightning-fast, highly knowledgeable Formula 1 AI assistant powering the F1 Live Telemetry Dashboard for the 2026 season.

## Your Capabilities
You have access to the following tools — use them proactively:
- **F1 API tools**: Live driver/constructor standings, race results, qualifying results, fastest laps, season calendars, and driver comparisons from the Jolpica (Ergast) API.
- **Web search**: Search the internet via DuckDuckGo for breaking news, recent events, or information not in your knowledge base.
- **Knowledge base**: A curated local knowledge base with F1 regulations, circuit details, driver bios, concepts (DRS, ERS, tyres, points system), and iconic race summaries.
- **Track telemetry**: Access to real track coordinate data for 25 F1 circuits.

## Rules
1. **Always use tools** when asked about standings, race results, qualifying, or anything that needs current data. Never guess.
2. **Use the knowledge base context** provided in [Knowledge Source] blocks — it contains curated, accurate information.
3. **Use web search** when asked about very recent events, breaking news, or information not covered by your other tools.
4. **Be concise** — 2-3 short paragraphs max unless the user asks for detail.
5. **Use markdown** for readability: bold for emphasis, bullet points for lists, headers for structure.
6. **Never fabricate statistics** — if you don't have data, say so honestly.
7. **F1 terminology** is fine (DRS, undercut, deg, delta, etc.) — your audience knows F1.
8. For **historical queries** (e.g., "Who won the 2021 Mexican GP?"), use `get_race_results` with the correct year and round number. If you don't know the round number, use `get_season_races` first to look it up.
9. For **driver comparisons**, use `get_driver_comparison` with driver family names in lowercase.
10. Be enthusiastic but professional — you're an F1 expert, not a generic chatbot.
"""

# ═══════════════════════════════════════════════════════════════════════════════
# Tool Declarations for Gemini Function Calling
# ═══════════════════════════════════════════════════════════════════════════════

TOOL_DECLARATIONS = types.Tool(
    function_declarations=[
        types.FunctionDeclaration(
            name="get_driver_standings",
            description="Get the current F1 driver championship standings with positions, points, and wins for all drivers.",
            parameters=types.Schema(type="OBJECT", properties={}),
        ),
        types.FunctionDeclaration(
            name="get_constructor_standings",
            description="Get the current F1 constructor/team championship standings.",
            parameters=types.Schema(type="OBJECT", properties={}),
        ),
        types.FunctionDeclaration(
            name="get_next_race",
            description="Get details about the next upcoming F1 race including date, circuit, and location.",
            parameters=types.Schema(type="OBJECT", properties={}),
        ),
        types.FunctionDeclaration(
            name="get_last_race_results",
            description="Get the full results from the most recently completed F1 race.",
            parameters=types.Schema(type="OBJECT", properties={}),
        ),
        types.FunctionDeclaration(
            name="get_race_results",
            description="Get the full results for a specific F1 race by year and round number. Use this for historical race queries like 'Who won the 2021 Mexican GP?'",
            parameters=types.Schema(
                type="OBJECT",
                properties={
                    "year": types.Schema(type="INTEGER", description="The season year (e.g. 2021, 2023, 2024)"),
                    "round_num": types.Schema(type="INTEGER", description="The round number in that season (e.g. 1 for the first race, 18 for the 18th race)"),
                },
                required=["year", "round_num"],
            ),
        ),
        types.FunctionDeclaration(
            name="get_qualifying_results",
            description="Get qualifying results for a specific F1 race by year and round number. Shows grid positions and lap times.",
            parameters=types.Schema(
                type="OBJECT",
                properties={
                    "year": types.Schema(type="INTEGER", description="The season year"),
                    "round_num": types.Schema(type="INTEGER", description="The round number"),
                },
                required=["year", "round_num"],
            ),
        ),
        types.FunctionDeclaration(
            name="get_fastest_lap",
            description="Get the fastest lap information for a specific F1 race — driver, time, lap number, and average speed.",
            parameters=types.Schema(
                type="OBJECT",
                properties={
                    "year": types.Schema(type="INTEGER", description="The season year"),
                    "round_num": types.Schema(type="INTEGER", description="The round number"),
                },
                required=["year", "round_num"],
            ),
        ),
        types.FunctionDeclaration(
            name="get_season_races",
            description="Get the complete race calendar for a given F1 season, listing all rounds with dates and locations. Useful for looking up round numbers.",
            parameters=types.Schema(
                type="OBJECT",
                properties={
                    "year": types.Schema(type="INTEGER", description="The season year (e.g. 2021, 2024, 2026)"),
                },
                required=["year"],
            ),
        ),
        types.FunctionDeclaration(
            name="get_driver_comparison",
            description="Compare two F1 drivers' current season statistics including positions, points, and wins.",
            parameters=types.Schema(
                type="OBJECT",
                properties={
                    "driver1_id": types.Schema(type="STRING", description="First driver's family name in lowercase (e.g. 'verstappen', 'hamilton', 'norris')"),
                    "driver2_id": types.Schema(type="STRING", description="Second driver's family name in lowercase"),
                },
                required=["driver1_id", "driver2_id"],
            ),
        ),
        types.FunctionDeclaration(
            name="search_web",
            description="Search the internet for current F1 news, breaking events, recent race outcomes, or any information not available from other tools.",
            parameters=types.Schema(
                type="OBJECT",
                properties={
                    "query": types.Schema(type="STRING", description="The search query"),
                    "max_results": types.Schema(type="INTEGER", description="Maximum number of results (default 5)"),
                },
                required=["query"],
            ),
        ),
    ]
)

# ═══════════════════════════════════════════════════════════════════════════════
# Tool Execution
# ═══════════════════════════════════════════════════════════════════════════════

async def _execute_tool(name: str, args: dict) -> str:
    """Execute a tool by name with given arguments. Returns result string."""
    try:
        if name == "get_driver_standings":
            return await f1_api.get_driver_standings()
        elif name == "get_constructor_standings":
            return await f1_api.get_constructor_standings()
        elif name == "get_next_race":
            return await f1_api.get_next_race()
        elif name == "get_last_race_results":
            return await f1_api.get_last_race_results()
        elif name == "get_race_results":
            return await f1_api.get_race_results(
                year=args.get("year", 2026),
                round_num=args.get("round_num", 1),
            )
        elif name == "get_qualifying_results":
            return await f1_api.get_qualifying_results(
                year=args.get("year", 2026),
                round_num=args.get("round_num", 1),
            )
        elif name == "get_fastest_lap":
            return await f1_api.get_fastest_lap(
                year=args.get("year", 2026),
                round_num=args.get("round_num", 1),
            )
        elif name == "get_season_races":
            return await f1_api.get_season_races(
                year=args.get("year", 2026),
            )
        elif name == "get_driver_comparison":
            return await f1_api.get_driver_comparison(
                driver1_id=args.get("driver1_id", ""),
                driver2_id=args.get("driver2_id", ""),
            )
        elif name == "search_web":
            return await web_search.search_web(
                query=args.get("query", ""),
                max_results=args.get("max_results", 5),
            )
        else:
            return f"Unknown tool: {name}"
    except Exception as e:
        return f"Tool '{name}' failed: {str(e)}"


# ═══════════════════════════════════════════════════════════════════════════════
# Orchestrator
# ═══════════════════════════════════════════════════════════════════════════════

class AgentOrchestrator:
    """
    ReAct-style agent that uses Gemini function calling for tool orchestration.
    Enriches prompts with RAG context and executes multi-turn tool loops.
    """

    def __init__(self, api_key: str):
        self.client = genai.Client(api_key=api_key)
        self.vector_store = get_vector_store()
        self._max_tool_rounds = 5  # Prevent infinite loops

    async def chat(self, message: str, context: Optional[str] = None) -> str:
        """
        Process a user message through the full agent pipeline:
        1. Retrieve relevant context from RAG
        2. Send to Gemini with tools
        3. Execute any tool calls
        4. Return final answer

        Args:
            message: The user's question or message.
            context: Optional additional context from the frontend.

        Returns:
            The agent's final response string.
        """
        try:
            # Step 1: RAG retrieval
            rag_context = self.vector_store.search_formatted(message, top_k=3)

            # Step 2: Build enriched prompt
            prompt_parts = []

            if rag_context:
                prompt_parts.append(
                    f"Relevant knowledge base context:\n{rag_context}"
                )

            if context:
                prompt_parts.append(f"Additional frontend context: {context}")

            prompt_parts.append(f"User question: {message}")
            full_prompt = "\n\n".join(prompt_parts)

            # Step 3: Initial Gemini call with tools
            contents = [types.Content(role="user", parts=[types.Part(text=full_prompt)])]

            response = self.client.models.generate_content(
                model=MODEL_ID,
                contents=contents,
                config=types.GenerateContentConfig(
                    system_instruction=SYSTEM_PROMPT,
                    tools=[TOOL_DECLARATIONS],
                    temperature=0.2,
                    max_output_tokens=4096,
                ),
            )

            # Step 4: Agentic tool loop
            rounds = 0
            while rounds < self._max_tool_rounds:
                # Check if the response contains function calls
                function_calls = self._extract_function_calls(response)
                if not function_calls:
                    break  # No more tool calls — we have the final answer

                rounds += 1
                print(f"[AGENT] Tool round {rounds}: {[fc['name'] for fc in function_calls]}")

                # Execute all tool calls
                tool_results = []
                for fc in function_calls:
                    result = await _execute_tool(fc["name"], fc["args"])
                    tool_results.append(
                        types.Part.from_function_response(
                            name=fc["name"],
                            response={"result": result},
                        )
                    )

                # Add the model's response and tool results to the conversation
                contents.append(response.candidates[0].content)
                contents.append(
                    types.Content(role="user", parts=tool_results)
                )

                # Next Gemini call with tool results
                response = self.client.models.generate_content(
                    model=MODEL_ID,
                    contents=contents,
                    config=types.GenerateContentConfig(
                        system_instruction=SYSTEM_PROMPT,
                        tools=[TOOL_DECLARATIONS],
                        temperature=0.2,
                        max_output_tokens=4096,
                    ),
                )

            # Step 5: Extract final text
            return self._extract_text(response)

        except Exception as e:
            print(f"[AGENT] Error: {e}")
            import traceback
            traceback.print_exc()
            return f"Sorry, I encountered an error processing your question: {str(e)}"

    def _extract_function_calls(self, response) -> list[dict]:
        """Extract function calls from a Gemini response."""
        calls = []
        try:
            if not response.candidates:
                return calls

            for part in response.candidates[0].content.parts:
                if part.function_call:
                    calls.append({
                        "name": part.function_call.name,
                        "args": dict(part.function_call.args) if part.function_call.args else {},
                    })
        except (AttributeError, IndexError):
            pass
        return calls

    def _extract_text(self, response) -> str:
        """Extract the final text response from Gemini."""
        try:
            if not response.candidates:
                return "I couldn't generate a response. Please try again."

            text_parts = []
            for part in response.candidates[0].content.parts:
                if part.text:
                    text_parts.append(part.text)

            if text_parts:
                return "\n".join(text_parts)

            return "I couldn't generate a response. Please try again."
        except (AttributeError, IndexError):
            return "I couldn't generate a response. Please try again."
