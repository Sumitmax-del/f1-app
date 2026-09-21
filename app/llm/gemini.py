"""
Gemini LLM Integration Layer (via OpenRouter)
===============================================
Provides Gemini-powered answer synthesis for the F1 AI Agent.
Uses OpenRouter API to access google/gemini-2.5-flash.

The key design principle: tool-retrieved data (F1 API results, web search snippets,
RAG context) is passed as INTERNAL CONTEXT to Gemini, which synthesizes a clean,
natural-language answer. Raw search results are NEVER shown to the user.
"""

import os
import re
from typing import Optional
import httpx
from dotenv import load_dotenv

load_dotenv()

# ═══════════════════════════════════════════════════════════════════════════════
# Configuration
# ═══════════════════════════════════════════════════════════════════════════════

OPENROUTER_API_KEY = os.getenv("OPENROUTER_API_KEY") or os.getenv("GEMINI_API_KEY", "")
OPENROUTER_BASE_URL = "https://openrouter.ai/api/v1/chat/completions"
DEFAULT_MODEL = os.getenv("GEMINI_MODEL", "google/gemini-2.5-flash")

# ═══════════════════════════════════════════════════════════════════════════════
# System Prompt
# ═══════════════════════════════════════════════════════════════════════════════

F1_SYSTEM_PROMPT = """You are APEX, an expert Formula 1 AI assistant. You have access to real-time F1 data tools and web search. Your role is to synthesize retrieved data into clear, accurate, natural-language answers.

CRITICAL RULES:
1. NEVER display raw search results, URLs, or snippets to the user.
2. NEVER include phrases like "Real-time Web Search Results", "According to search results", or "Based on web search".
3. NEVER dump URLs into your answer body.
4. NEVER include internal labels like "Official F1 Data Status:", "Web Search Context:", etc.
5. Use the provided context ONLY as your internal knowledge to formulate a natural answer.
6. If context mentions Formula 2, Formula 3, Formula E, or other non-F1 series, IGNORE those results entirely. Only answer about FIA Formula One World Championship.
7. When the user says "last race" or "latest race", they mean the most recent FIA Formula One World Championship race, NOT F2/F3/FE.
8. Do NOT invent or hallucinate information. If the data is insufficient, say so honestly.
9. If multiple sources disagree, note the discrepancy rather than guessing.
10. Keep answers concise and direct. Answer the actual question first, then add supporting details.

FORMATTING GUIDELINES:
- For race results, use this format:
  🏆 Winner: [Driver] ([Team])
  🥈 2nd: [Driver] ([Team])
  🥉 3rd: [Driver] ([Team])
  ⚡ Fastest Lap: [Driver] — [time]

- For championship standings, list the top positions clearly.
- For historical events, provide a concise narrative summary.
- For technical concepts (DRS, ERS, etc.), give a clear explanation.
- Use emoji sparingly and appropriately for F1 context.
- Do NOT add a "Sources:" section — the system handles that separately.
"""


def get_gemini_api_key() -> Optional[str]:
    """Retrieve the OpenRouter/Gemini API key."""
    key = OPENROUTER_API_KEY
    if key and key.strip() and key.strip() not in ("your-gemini-api-key-here", ""):
        return key.strip()
    return None


def get_gemini_model_name() -> str:
    """Return the configured Gemini model name."""
    return DEFAULT_MODEL


def generate_gemini_response(
    question: str,
    context: Optional[str] = None,
    max_tokens: int = 1024,
    temperature: float = 0.4,
) -> str:
    """
    Generate a synthesized natural-language answer using Gemini via OpenRouter.

    Parameters:
    - question: The user's original question.
    - context: Internal context from tools (F1 data, web search, RAG).
               This is NEVER shown to the user — only used by Gemini to formulate the answer.
    - max_tokens: Maximum tokens for the response.
    - temperature: Lower = more factual, higher = more creative.

    Returns:
    - Clean, natural-language answer string.
    """
    api_key = get_gemini_api_key()
    if not api_key:
        return (
            "[!] API key is not configured. "
            "Please set OPENROUTER_API_KEY or GEMINI_API_KEY in your .env file."
        )

    # Build the user message with internal context
    if context and context.strip():
        user_content = (
            f"[INTERNAL CONTEXT — DO NOT EXPOSE TO USER]\n"
            f"{context.strip()}\n\n"
            f"[END INTERNAL CONTEXT]\n\n"
            f"User Question: {question.strip()}\n\n"
            f"Provide a clear, concise, natural-language answer to the user's question "
            f"using ONLY the data from the internal context above. "
            f"Do NOT reference the context, search results, or URLs in your answer. "
            f"Do NOT add a Sources section. "
            f"Answer as if you naturally know the information."
        )
    else:
        user_content = question.strip()

    messages = [
        {"role": "system", "content": F1_SYSTEM_PROMPT},
        {"role": "user", "content": user_content},
    ]

    headers = {
        "Authorization": f"Bearer {api_key}",
        "Content-Type": "application/json",
        "HTTP-Referer": "https://f1-app.local",
        "X-Title": "APEX F1 AI Agent",
    }

    payload = {
        "model": DEFAULT_MODEL,
        "messages": messages,
        "max_tokens": max_tokens,
        "temperature": temperature,
    }

    try:
        with httpx.Client(timeout=45.0) as client:
            response = client.post(
                OPENROUTER_BASE_URL,
                headers=headers,
                json=payload,
            )

            if response.status_code == 200:
                data = response.json()
                choices = data.get("choices", [])
                if choices and choices[0].get("message", {}).get("content"):
                    answer = choices[0]["message"]["content"].strip()
                    # Post-process: remove any leaked internal labels
                    answer = _clean_answer(answer)
                    return answer
                return "I couldn't generate a response. Please try again."

            elif response.status_code == 401:
                return "[!] API authentication failed. Please check your OPENROUTER_API_KEY in .env."
            elif response.status_code == 429:
                return "[!] Rate limit exceeded. Please wait a moment and try again."
            elif response.status_code == 503:
                return "[*] The AI model is temporarily unavailable. Please retry in a few seconds."
            else:
                error_detail = ""
                try:
                    err_data = response.json()
                    error_detail = err_data.get("error", {}).get("message", "")
                except Exception:
                    error_detail = response.text[:200]
                return f"[!] API error (HTTP {response.status_code}): {error_detail}"

    except httpx.TimeoutException:
        return "[!] Request timed out. The AI model took too long to respond. Please try again."
    except httpx.ConnectError:
        return "[!] Could not connect to the AI service. Please check your internet connection."
    except Exception as exc:
        return f"[!] Unexpected error communicating with AI service: {str(exc)}"


def _clean_answer(text: str) -> str:
    """
    Post-process the Gemini response to remove any accidentally leaked internal labels.
    """
    # Remove common internal-context leaks
    patterns_to_remove = [
        r"\[INTERNAL CONTEXT[^\]]*\]",
        r"\[END INTERNAL CONTEXT\]",
        r"Real-time Web Search Results & Context:",
        r"Real-time Web Search Results:",
        r"Web Search Context:",
        r"Official F1 Data Status:",
        r"Retrieved Local Formula 1 Knowledge Base Context:",
        r"According to (?:the )?(?:web )?search results?,?\s*",
        r"Based on (?:the )?(?:web )?search results?,?\s*",
        r"From (?:the )?search results?,?\s*",
    ]

    for pattern in patterns_to_remove:
        text = re.sub(pattern, "", text, flags=re.IGNORECASE)

    # Remove standalone URL lines (http/https links on their own line)
    text = re.sub(r"^\s*https?://\S+\s*$", "", text, flags=re.MULTILINE)

    # Remove "URL: http..." inline references
    text = re.sub(r"\(?\s*URL:\s*https?://\S+\s*\)?", "", text)

    # Clean up excessive blank lines
    text = re.sub(r"\n{3,}", "\n\n", text)

    return text.strip()
