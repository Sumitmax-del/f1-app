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


def _filter_f1_only(results: List[Dict[str, str]]) -> List[Dict[str, str]]:
    """
    Filter search results to keep only Formula 1 content.
    Removes results about Formula 2, Formula 3, Formula E, WEC, MotoGP, etc.
    """
    NON_F1_INDICATORS = [
        "formula 2", "formula 3", "formula e", "formula one", 
        "f2 championship", "f3 championship", "fe championship",
        "fia formula 2", "fia formula 3", "fia formula e",
        "motogp", "moto gp", "indycar", "nascar", "wec ",
        "world endurance", "rally championship", "wrc ",
        "super formula", "formula regional",
    ]
    # These terms indicate it IS about F1 and should be kept
    F1_POSITIVE = [
        "formula 1", "formula one", "f1 ", " f1", "grand prix",
        "fia formula one", "world championship", "constructor",
        "red bull", "mercedes", "ferrari", "mclaren", "aston martin",
        "alpine", "williams", "haas", "sauber", "racing bulls",
        "verstappen", "hamilton", "norris", "leclerc", "sainz",
        "piastri", "russell", "alonso", "perez",
    ]

    filtered = []
    for item in results:
        text = f"{item.get('title', '')} {item.get('snippet', '')}".lower()

        # Check for non-F1 indicators
        is_non_f1 = False
        for indicator in NON_F1_INDICATORS:
            if indicator in text:
                # But check if it also mentions F1 positively (hybrid articles)
                has_f1 = any(pos in text for pos in F1_POSITIVE)
                if not has_f1:
                    is_non_f1 = True
                    break

        if not is_non_f1:
            filtered.append(item)

    return filtered if filtered else results[:1]  # Keep at least one result


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
    elif any(phrase in q_lower for phrase in ["last race", "latest race", "most recent race", "result of the last"]):
        clean_query = "Formula 1 last race result winner 2026"
    elif any(phrase in q_lower for phrase in ["who won the last", "who won last"]):
        clean_query = "Formula 1 latest Grand Prix race winner 2026"
    elif "f1" not in q_lower and "formula 1" not in q_lower and "grand prix" not in q_lower:
        clean_query = f"Formula 1 {clean_query}"
    
    # 1. Custom Provider (Tavily or Serper) if configured
    if (SEARCH_PROVIDER == "tavily" or TAVILY_API_KEY) and TAVILY_API_KEY:
        tavily_res = _search_tavily(clean_query, TAVILY_API_KEY, max_results)
        if tavily_res:
            return _filter_f1_only(tavily_res)

    if (SEARCH_PROVIDER == "serper" or SERPER_API_KEY) and SERPER_API_KEY:
        serper_res = _search_serper(clean_query, SERPER_API_KEY, max_results)
        if serper_res:
            return _filter_f1_only(serper_res)

    # 2. DuckDuckGo Search
    ddg_res = _search_duckduckgo(clean_query, max_results=max_results)
    if ddg_res:
        return _filter_f1_only(ddg_res)

    # 3. Authentic Wikipedia REST search fallback
    wiki_res = _search_wikipedia_api(clean_query, max_results=max_results)
    if wiki_res:
        return _filter_f1_only(wiki_res)

    return []


def search_f1_news(max_results: int = 4) -> List[Dict[str, str]]:
    """
    Retrieve latest Formula 1 news headlines and summaries.
    """
    return search_web("Formula 1 latest news headlines", max_results=max_results)
