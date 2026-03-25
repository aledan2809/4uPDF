"""
AI Router — 4uPDF Python Integration
Calls AI providers via HTTP (same API as ai-router Node.js module).
Default: Cohere (best for text summarization/extraction).
Fallback order: Cohere → Gemini → Mistral → Together → Fireworks → OpenAI → Claude → Groq
"""

import os
import json
import time
from typing import Optional, Dict, Any, List

# Provider configs — same as ai-router Node.js module
PROVIDERS = {
    "cohere": {
        "url": "https://api.cohere.com/v2/chat",
        "env": "COHERE_API_KEY",
        "model": "command-r-plus",
        "auth_header": "Authorization",
        "auth_prefix": "Bearer ",
        "format": "cohere",
    },
    "gemini": {
        "url": "https://generativelanguage.googleapis.com/v1beta/models/{model}:generateContent",
        "env": "GEMINI_API_KEY",
        "model": "gemini-2.0-flash",
        "format": "gemini",
    },
    "mistral": {
        "url": "https://api.mistral.ai/v1/chat/completions",
        "env": "MISTRAL_API_KEY",
        "model": "mistral-small-latest",
        "auth_header": "Authorization",
        "auth_prefix": "Bearer ",
        "format": "openai",
    },
    "together": {
        "url": "https://api.together.xyz/v1/chat/completions",
        "env": "TOGETHER_API_KEY",
        "model": "meta-llama/Llama-3.3-70B-Instruct-Turbo",
        "auth_header": "Authorization",
        "auth_prefix": "Bearer ",
        "format": "openai",
    },
    "fireworks": {
        "url": "https://api.fireworks.ai/inference/v1/chat/completions",
        "env": "FIREWORKS_API_KEY",
        "model": "accounts/fireworks/models/llama-v3p3-70b-instruct",
        "auth_header": "Authorization",
        "auth_prefix": "Bearer ",
        "format": "openai",
    },
    "openai": {
        "url": "https://api.openai.com/v1/chat/completions",
        "env": "OPENAI_API_KEY",
        "model": "gpt-4o-mini",
        "auth_header": "Authorization",
        "auth_prefix": "Bearer ",
        "format": "openai",
    },
    "claude": {
        "url": "https://api.anthropic.com/v1/messages",
        "env": "ANTHROPIC_API_KEY",
        "model": "claude-haiku-4-5-20251001",
        "format": "claude",
    },
    "groq": {
        "url": "https://api.groq.com/openai/v1/chat/completions",
        "env": "GROQ_API_KEY",
        "model": "llama-3.3-70b-versatile",
        "auth_header": "Authorization",
        "auth_prefix": "Bearer ",
        "format": "openai",
    },
}

# Round-robin state
_rr_index = 0
_provider_order = ["cohere", "gemini", "mistral", "together", "fireworks", "openai", "claude", "groq"]


def _get_available_providers() -> List[str]:
    """Return providers that have API keys configured."""
    return [pid for pid in _provider_order if os.getenv(PROVIDERS[pid]["env"])]


def _call_provider(provider_id: str, messages: List[Dict], max_tokens: int = 1024, temperature: float = 0.3) -> Dict[str, Any]:
    """Call a single AI provider. Returns {"content": str, "provider": str, "model": str, "latency_ms": int}."""
    import urllib.request

    cfg = PROVIDERS[provider_id]
    api_key = os.getenv(cfg["env"])
    if not api_key:
        raise ValueError(f"Missing API key: {cfg['env']}")

    model = cfg["model"]
    start = time.time()
    fmt = cfg["format"]

    if fmt == "openai":
        body = json.dumps({
            "model": model,
            "messages": [{"role": m["role"], "content": m["content"]} for m in messages],
            "max_tokens": max_tokens,
            "temperature": temperature,
        }).encode()
        req = urllib.request.Request(cfg["url"], data=body, headers={
            "Content-Type": "application/json",
            cfg.get("auth_header", "Authorization"): f"{cfg.get('auth_prefix', 'Bearer ')}{api_key}",
        })
        with urllib.request.urlopen(req, timeout=60) as resp:
            data = json.loads(resp.read())
        content = data["choices"][0]["message"]["content"]

    elif fmt == "gemini":
        sys_msg = next((m for m in messages if m["role"] == "system"), None)
        user_msgs = [m for m in messages if m["role"] != "system"]
        body_obj: Dict[str, Any] = {
            "contents": [{"role": "user" if m["role"] == "user" else "model", "parts": [{"text": m["content"]}]} for m in user_msgs],
            "generationConfig": {"maxOutputTokens": max_tokens, "temperature": temperature},
        }
        if sys_msg:
            body_obj["systemInstruction"] = {"parts": [{"text": sys_msg["content"]}]}
        url = cfg["url"].replace("{model}", model) + f"?key={api_key}"
        body = json.dumps(body_obj).encode()
        req = urllib.request.Request(url, data=body, headers={"Content-Type": "application/json"})
        with urllib.request.urlopen(req, timeout=60) as resp:
            data = json.loads(resp.read())
        content = data["candidates"][0]["content"]["parts"][0]["text"]

    elif fmt == "claude":
        sys_msg = next((m for m in messages if m["role"] == "system"), None)
        non_sys = [m for m in messages if m["role"] != "system"]
        body_obj = {
            "model": model,
            "max_tokens": max_tokens,
            "temperature": temperature,
            "messages": [{"role": m["role"], "content": m["content"]} for m in non_sys],
        }
        if sys_msg:
            body_obj["system"] = sys_msg["content"]
        body = json.dumps(body_obj).encode()
        req = urllib.request.Request(cfg["url"], data=body, headers={
            "Content-Type": "application/json",
            "x-api-key": api_key,
            "anthropic-version": "2023-06-01",
        })
        with urllib.request.urlopen(req, timeout=60) as resp:
            data = json.loads(resp.read())
        content = data["content"][0]["text"]

    elif fmt == "cohere":
        body = json.dumps({
            "model": model,
            "messages": [{"role": m["role"], "content": m["content"]} for m in messages],
            "max_tokens": max_tokens,
            "temperature": temperature,
        }).encode()
        req = urllib.request.Request(cfg["url"], data=body, headers={
            "Content-Type": "application/json",
            "Authorization": f"Bearer {api_key}",
        })
        with urllib.request.urlopen(req, timeout=60) as resp:
            data = json.loads(resp.read())
        content = data["message"]["content"][0]["text"]

    else:
        raise ValueError(f"Unknown format: {fmt}")

    latency_ms = int((time.time() - start) * 1000)
    return {"content": content, "provider": provider_id, "model": model, "latency_ms": latency_ms}


def ai_chat(
    system_prompt: str,
    user_message: str,
    provider: Optional[str] = None,
    max_tokens: int = 1024,
    temperature: float = 0.3,
) -> Dict[str, Any]:
    """
    Send a message to an AI provider with automatic round-robin and fallback.

    Args:
        system_prompt: System instructions
        user_message: User message
        provider: Specific provider ID, or None for auto round-robin
        max_tokens: Max output tokens
        temperature: Sampling temperature

    Returns:
        {"content": str, "provider": str, "model": str, "latency_ms": int}
    """
    global _rr_index
    messages = [
        {"role": "system", "content": system_prompt},
        {"role": "user", "content": user_message},
    ]

    if provider and provider != "auto":
        return _call_provider(provider, messages, max_tokens, temperature)

    # Auto mode: round-robin with fallback
    available = _get_available_providers()
    if not available:
        raise RuntimeError("No AI providers configured. Add API keys to .env")

    primary_idx = _rr_index % len(available)
    _rr_index += 1
    order = available[primary_idx:] + available[:primary_idx]

    errors = []
    for pid in order:
        try:
            return _call_provider(pid, messages, max_tokens, temperature)
        except Exception as e:
            errors.append(f"{pid}: {str(e)[:80]}")
            continue

    raise RuntimeError(f"All AI providers failed: {' | '.join(errors)}")
