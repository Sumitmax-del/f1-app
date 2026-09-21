"""
Hugging Face LLM Integration Layer
===================================
Provides a configurable interface for communicating with Hugging Face models
via the Hugging Face Inference API / Serverless endpoints.
"""

import os
import sys
from typing import Optional
from dotenv import load_dotenv

# Load environment variables
load_dotenv()

# Default Hugging Face configuration
DEFAULT_MODEL = "HuggingFaceH4/zephyr-7b-beta"


def get_hf_api_key() -> Optional[str]:
    """Retrieve the Hugging Face API key from environment variables."""
    return os.getenv("HF_API_KEY") or os.getenv("HUGGINGFACE_API_KEY") or os.getenv("HF_TOKEN")


def get_model_name() -> str:
    """Retrieve the configured model name from environment variables."""
    return os.getenv("MODEL_NAME", DEFAULT_MODEL)


def format_prompt(prompt: str, context: Optional[str] = None) -> str:
    """
    Format user prompt with optional context into a structured prompt.
    """
    if not context or not context.strip():
        return prompt.strip()
    
    return f"Context:\n{context.strip()}\n\nQuestion:\n{prompt.strip()}"


def generate_response(prompt: str, context: Optional[str] = None) -> str:
    """
    Generate a natural language response using Hugging Face Inference API.
    
    Parameters:
    - prompt (str): The user question or prompt.
    - context (Optional[str]): Optional background context or data to inform the answer.
    
    Returns:
    - str: Natural language response from the model or graceful error message.
    """
    if not prompt or not prompt.strip():
        return "Please provide a valid question or prompt."

    api_key = get_hf_api_key()
    model_name = get_model_name()

    # If no API key is provided, return a friendly helpful message
    if not api_key or api_key.strip() in ("", "your-hf-api-key-here", "your_huggingface_api_key_here"):
        return (
            "[!] Hugging Face API Key is not configured. "
            "Please set HF_API_KEY in your .env file with a valid token from https://huggingface.co/settings/tokens."
        )

    formatted_input = format_prompt(prompt, context)

    # 1. Attempt using huggingface_hub InferenceClient if available
    try:
        from huggingface_hub import InferenceClient

        client = InferenceClient(token=api_key)

        # Build message history for chat completion
        system_instruction = (
            "You are an expert Formula 1 AI assistant. "
            "Provide accurate, clear, and informative answers to F1 questions."
        )
        
        try:
            # Try chat completion first (works for instruction-tuned models)
            messages = [
                {"role": "system", "content": system_instruction},
                {"role": "user", "content": formatted_input},
            ]
            response = client.chat_completion(
                messages=messages,
                model=model_name,
                max_tokens=512,
                temperature=0.7,
            )
            if response.choices and len(response.choices) > 0:
                content = response.choices[0].message.content
                if content:
                    return content.strip()
        except Exception:
            # Fall back to text_generation if chat_completion is not supported by model
            result = client.text_generation(
                prompt=f"<|system|>\n{system_instruction}</s>\n<|user|>\n{formatted_input}</s>\n<|assistant|>\n",
                model=model_name,
                max_new_tokens=512,
                temperature=0.7,
                return_full_text=False,
            )
            if result:
                return result.strip()

    except ImportError:
        pass
    except Exception as e:
        error_str = str(e)
        # Handle common Hugging Face API errors gracefully
        if "401" in error_str or "unauthorized" in error_str.lower():
            return "[!] Authentication error: Invalid Hugging Face API key. Please check HF_API_KEY in your .env file."
        elif "403" in error_str or "forbidden" in error_str.lower():
            return f"[!] Access denied: Your Hugging Face token does not have permission to access model '{model_name}'."
        elif "429" in error_str or "rate limit" in error_str.lower():
            return "[!] Rate limit exceeded: Hugging Face free-tier request limit reached. Please wait a moment and try again."
        elif "503" in error_str or "loading" in error_str.lower():
            return f"[*] Model '{model_name}' is currently loading on Hugging Face serverless infrastructure. Please retry in 20-30 seconds."
        else:
            # Log and return fallback attempt via raw HTTP
            pass

    # 2. Fallback via direct HTTP requests using httpx
    try:
        import httpx

        # Router and legacy endpoint URLs
        api_urls = [
            f"https://router.huggingface.co/hf-inference/models/{model_name}",
            f"https://api-inference.huggingface.co/models/{model_name}",
        ]
        
        headers = {
            "Authorization": f"Bearer {api_key}",
            "Content-Type": "application/json",
        }
        
        payload = {
            "inputs": formatted_input,
            "parameters": {
                "max_new_tokens": 512,
                "temperature": 0.7,
                "return_full_text": False,
            },
        }

        with httpx.Client(timeout=30.0) as http_client:
            for url in api_urls:
                try:
                    resp = http_client.post(url, headers=headers, json=payload)
                    if resp.status_code == 200:
                        data = resp.json()
                        if isinstance(data, list) and len(data) > 0 and "generated_text" in data[0]:
                            return data[0]["generated_text"].strip()
                        elif isinstance(data, dict) and "generated_text" in data:
                            return data["generated_text"].strip()
                    elif resp.status_code == 503:
                        return f"[*] Model '{model_name}' is currently loading on Hugging Face servers. Please retry shortly."
                    elif resp.status_code == 429:
                        return "[!] Hugging Face free-tier rate limit reached. Please wait a moment and try again."
                    elif resp.status_code in (401, 403):
                        return "[!] Hugging Face API key authorization failed. Please check HF_API_KEY in your .env file."
                except httpx.RequestError:
                    continue

    except Exception as exc:
        return f"[!] Error communicating with Hugging Face API: {str(exc)}"

    return f"[!] Unable to generate response from model '{model_name}'. Please verify your model name and HF_API_KEY."
