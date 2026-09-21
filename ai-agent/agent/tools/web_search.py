"""
Web Search Tool — DuckDuckGo
==============================
Provides web search capability for current F1 news, breaking events,
and any information not available in the local knowledge base.
"""

from duckduckgo_search import DDGS


async def search_web(query: str, max_results: int = 5) -> str:
    """
    Search the web for current F1 information using DuckDuckGo.

    Args:
        query: The search query string.
        max_results: Maximum number of results to return (default 5).

    Returns:
        Formatted string with search results including titles, snippets, and URLs.
    """
    try:
        # Add F1 context to the query for more relevant results
        search_query = f"Formula 1 F1 {query}"

        results = []
        with DDGS() as ddgs:
            for r in ddgs.text(search_query, max_results=max_results):
                results.append(r)

        if not results:
            return f"No web results found for: {query}"

        lines = [f"Web Search Results for: \"{query}\"", ""]
        for i, r in enumerate(results, 1):
            title = r.get("title", "No title")
            snippet = r.get("body", "No description")
            url = r.get("href", "")
            lines.append(f"{i}. **{title}**")
            lines.append(f"   {snippet}")
            if url:
                lines.append(f"   Source: {url}")
            lines.append("")

        return "\n".join(lines)

    except Exception as e:
        return f"Web search failed: {str(e)}. Please answer based on your training data."
