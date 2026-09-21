"""
F1 AI Agent — FastAPI Server
============================
Main microservice entry point for the Tool-Using F1 AI Agent.
Powered by:
- Hugging Face LLM Layer (app/llm/huggingface.py)
- Structured F1 Data Tool (app/tools/f1_data_tool.py)
- Real-time Web Search Tool (app/tools/search_tool.py)
- Intent Detection Multi-Tool Orchestrator (app/agent.py)

Start with:
    python main.py
    # or: uvicorn main:app --host 0.0.0.0 --port 8000 --reload
"""

import os
import sys
from datetime import datetime
from typing import Optional, List, Dict, Any, Union

# Ensure path resolution
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))

from dotenv import load_dotenv
load_dotenv()

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel

from app.agent import F1Agent, ask_agent
from app.llm.huggingface import get_model_name, get_hf_api_key

# ═══════════════════════════════════════════════════════════════════════════════
# Configuration
# ═══════════════════════════════════════════════════════════════════════════════

AGENT_PORT = int(os.getenv("AGENT_PORT", "8000"))
MODEL_NAME = get_model_name()
HF_KEY_SET = bool(get_hf_api_key() and get_hf_api_key().strip() not in ("", "your_huggingface_api_key_here"))

# ═══════════════════════════════════════════════════════════════════════════════
# FastAPI App
# ═══════════════════════════════════════════════════════════════════════════════

app = FastAPI(
    title="F1 AI Agent",
    description="Tool-using F1 AI Agent powered by Hugging Face, Jolpica F1 API, and Web Search",
    version="4.0.0",
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# ═══════════════════════════════════════════════════════════════════════════════
# Request / Response Models
# ═══════════════════════════════════════════════════════════════════════════════

class ChatRequest(BaseModel):
    message: Optional[str] = None
    question: Optional[str] = None
    prompt: Optional[str] = None
    context: Optional[str] = None


class ChatResponse(BaseModel):
    reply: str
    response: str
    text: str
    output: str
    tool_used: Optional[Union[List[str], str]] = None
    sources: List[str] = []
    confidence: Optional[str] = "high"
    model: str


class AskRequest(BaseModel):
    question: Optional[str] = None
    message: Optional[str] = None
    context: Optional[str] = None


class AskResponse(BaseModel):
    question: str
    answer: str
    tool_used: Optional[Union[List[str], str]] = None
    sources: List[str] = []
    confidence: Optional[str] = "high"
    response: str
    reply: str
    model: str


# ═══════════════════════════════════════════════════════════════════════════════
# Endpoints
# ═══════════════════════════════════════════════════════════════════════════════

@app.post("/ask", response_model=AskResponse)
async def ask(request: AskRequest):
    """
    Direct LLM question-answering endpoint.
    Performs intent detection, F1 data retrieval when required, web search, and Hugging Face generation.
    """
    query = request.question or request.message or ""
    if not query.strip():
        return AskResponse(
            question="",
            answer="Please provide a question.",
            tool_used=None,
            sources=[],
            response="Please provide a question.",
            reply="Please provide a question.",
            model=get_model_name(),
        )

    print(f"[AGENT] Question: {query[:100]}...")
    agent_output = ask_agent(query)
    answer = agent_output.get("answer", "")
    tool_used = agent_output.get("tool_used", [])
    sources = agent_output.get("sources", [])
    confidence = agent_output.get("confidence", "high")
    print(f"[AGENT] Tool Used: {tool_used} | Sources: {len(sources)} | Confidence: {confidence}")

    model_name = get_model_name()
    return AskResponse(
        question=query,
        answer=answer,
        tool_used=tool_used,
        sources=sources,
        confidence=confidence,
        response=answer,
        reply=answer,
        model=model_name,
    )


@app.post("/api/chat", response_model=ChatResponse)
async def chat(request: ChatRequest):
    """
    Main chat endpoint for the frontend dashboard widget.
    Routes queries directly to the tool-using F1 AI Agent.
    """
    query = request.message or request.question or request.prompt or ""
    if not query.strip():
        empty_msg = "Please enter a message."
        return ChatResponse(
            reply=empty_msg,
            response=empty_msg,
            text=empty_msg,
            output=empty_msg,
            tool_used=[],
            sources=[],
            confidence="low",
            model=get_model_name(),
        )

    print(f"[CHAT] Received: {query[:100]}...")
    agent_output = ask_agent(query)
    answer = agent_output.get("answer", "")
    tool_used = agent_output.get("tool_used", [])
    sources = agent_output.get("sources", [])
    confidence = agent_output.get("confidence", "high")

    model_name = get_model_name()
    return ChatResponse(
        reply=answer,
        response=answer,
        text=answer,
        output=answer,
        tool_used=tool_used,
        sources=sources,
        confidence=confidence,
        model=model_name,
    )


@app.get("/")
async def root():
    """Service info."""
    return {
        "service": "F1 AI Agent",
        "version": "4.0.0",
        "status": "online",
        "model": get_model_name(),
        "hf_key_configured": HF_KEY_SET,
        "features": [
            "Hugging Face Inference LLM Layer",
            "Jolpica F1 API Structured Data Tool",
            "Multi-Provider Web Search Tool",
            "Automated Intent Detection & Routing",
        ],
    }


@app.get("/health")
async def health_check():
    """Health check endpoint."""
    return {
        "status": "healthy",
        "agent_ready": True,
        "timestamp": datetime.utcnow().isoformat(),
    }


# ═══════════════════════════════════════════════════════════════════════════════
# Main
# ═══════════════════════════════════════════════════════════════════════════════

if __name__ == "__main__":
    import uvicorn

    print()
    print("  +==================================================+")
    print("  |              F1 AI Agent -- v4.0                 |")
    print("  |                                                  |")
    print(f"  |   Model:    {MODEL_NAME:<37}|")
    print(f"  |   Data:     Jolpica (Ergast) API                 |")
    print(f"  |   Search:   DuckDuckGo / Wikipedia               |")
    print(f"  |                                                  |")
    print(f"  |   URL:  http://localhost:{AGENT_PORT}                   |")
    print(f"  |   Docs: http://localhost:{AGENT_PORT}/docs              |")
    print("  +==================================================+")
    print()

    uvicorn.run("main:app", host="0.0.0.0", port=AGENT_PORT, reload=True)
