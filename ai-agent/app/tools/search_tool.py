"""
F1 Web Search Tool
===================
Provides real-time web search capabilities for recent F1 news, event narrative
context, and external research without scraping raw search HTML.

Supported search providers:
- DuckDuckGo (Free, default, zero-config)
- Wikipedia REST Search (Fast, authentic, fallback)
- Tavily / Serper (Configurable via environment variables)
"""

import os
import re
import urllib.parse
from typing import Any, Dict, List, Optional
import httpx

SEARCH_PROVIDER = os.getenv("SEARCH_PROVIDER", "duckduckgo").lower()
TAVILY_API_KEY = os.getenv("TAVILY_API_KEY")
SERPER_API_KEY = os.getenv("SERPER_API_KEY")

USER_AGENT = "APEX-F1-Agent/4.0 (https://github.com/Sumitmax-del/f1-app; contact@f1agent.local)"


def _search_duckduckgo(query: str, max_results: int = 5) -> List[Dict[str, str]]:
    """Search using DuckDuckGo client."""
    results: List[Dict[str, str]] = []
    try:
        from duckduckgo_search import DDGS

        with DDGS() as ddgs:
            raw_results = list(ddgs.text(query, max_results=max_results))
            for item in raw_results:
                title = item.get("title", "")
                url = item.get("href") or item.get("link", "")
                snippet = item.get("body") or item.get("snippet", "")
                if title and url and snippet:
                    results.append({
                        "title": title.strip(),
                        "url": url.strip(),
                        "snippet": snippet.strip(),
                    })
    except Exception:
        pass

    return results


def _search_wikipedia_api(query: str, max_results: int = 4) -> List[Dict[str, str]]:
    """
    Search Wikipedia REST API for authentic event articles and news context.
    """
    results: List[Dict[str, str]] = []
    try:
        clean_q = query.strip()
        # Search for Wikipedia articles matching the query
        search_url = "https://en.wikipedia.org/w/api.php"
        params = {
            "action": "query",
            "list": "search",
            "srsearch": clean_q,
            "utf8": "1",
            "format": "json",
            "srlimit": max_results,
        }
        with httpx.Client(timeout=6.0, headers={"User-Agent": USER_AGENT}) as client:
            resp = client.get(search_url, params=params)
            if resp.status_code == 200:
                data = resp.json()
                for item in data.get("query", {}).get("search", []):
                    title = item.get("title", "")
                    raw_snippet = item.get("snippet", "")
                    clean_snippet = re.sub(r"<[^>]+>", "", raw_snippet)
                    encoded_title = urllib.parse.quote(title.replace(" ", "_"))
                    page_url = f"https://en.wikipedia.org/wiki/{encoded_title}"

                    if title and clean_snippet:
                        results.append({
                            "title": title,
                            "url": page_url,
                            "snippet": clean_snippet,
                        })
    except Exception:
        pass

    return results


def _search_tavily(query: str, api_key: str, max_results: int = 5) -> List[Dict[str, str]]:
    """Search using Tavily AI Search API."""
    results: List[Dict[str, str]] = []
    try:
        url = "https://api.tavily.com/search"
        payload = {
            "api_key": api_key,
            "query": query,
            "search_depth": "basic",
            "max_results": max_results,
        }
        with httpx.Client(timeout=8.0) as client:
            resp = client.post(url, json=payload)
            if resp.status_code == 200:
                data = resp.json()
                for item in data.get("results", []):
                    results.append({
                        "title": item.get("title", ""),
                        "url": item.get("url", ""),
                        "snippet": item.get("content", ""),
                    })
    except Exception:
        pass
    return results


def _search_serper(query: str, api_key: str, max_results: int = 5) -> List[Dict[str, str]]:
    """Search using Serper Google Search API."""
    results: List[Dict[str, str]] = []
    try:
        url = "https://google.serper.dev/search"
        headers = {"X-API-KEY": api_key, "Content-Type": "application/json"}
        payload = {"q": query, "num": max_results}
        with httpx.Client(timeout=8.0) as client:
            resp = client.post(url, headers=headers, json=payload)
            if resp.status_code == 200:
                data = resp.json()
                for item in data.get("organic", []):
                    results.append({
                        "title": item.get("title", ""),
                        "url": item.get("link", ""),
                        "snippet": item.get("snippet", ""),
                    })
    except Exception:
        pass
    return results


def search_web(query: str, max_results: int = 4) -> List[Dict[str, str]]:
    """
    Execute web search and return structured search results.
    
    Parameters:
    - query (str): The search query.
    - max_results (int): Maximum number of search results to return.
    
    Returns:
    - List of structured dictionaries with 'title', 'url', and 'snippet'.
    """
    if not query or not query.strip():
        return []

    clean_query = query.strip()
    
    # Clean conversational phrases to improve search relevance
    q_lower = clean_query.lower()
    if any(phrase in q_lower for phrase in ["latest f1 news", "latest news", "f1 news", "recent news", "breaking news"]):
        clean_query = "Formula 1 racing latest news"
    elif "f1" not in q_lower and "formula 1" not in q_lower and "grand prix" not in q_lower:
        clean_query = f"Formula 1 {clean_query}"
    
    # 1. Custom Provider (Tavily or Serper) if configured
    if (SEARCH_PROVIDER == "tavily" or TAVILY_API_KEY) and TAVILY_API_KEY:
        tavily_res = _search_tavily(clean_query, TAVILY_API_KEY, max_results)
        if tavily_res:
            return tavily_res

    if (SEARCH_PROVIDER == "serper" or SERPER_API_KEY) and SERPER_API_KEY:
        serper_res = _search_serper(clean_query, SERPER_API_KEY, max_results)
        if serper_res:
            return serper_res

    # 2. DuckDuckGo Search
    ddg_res = _search_duckduckgo(clean_query, max_results=max_results)
    if ddg_res:
        return ddg_res

    # 3. Authentic Wikipedia REST search fallback
    wiki_res = _search_wikipedia_api(clean_query, max_results=max_results)
    if wiki_res:
        return wiki_res

    return []


def search_f1_news(max_results: int = 4) -> List[Dict[str, str]]:
    """
    Retrieve latest Formula 1 news headlines and summaries.
    """
    return search_web("Formula 1 latest news headlines", max_results=max_results)
