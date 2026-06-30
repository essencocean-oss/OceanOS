"""
NVIDIA Tools for OceanOS
"""

import os
import logging
from typing import Dict, Any, Optional
import requests

from .config import NVIDIA_CONFIG

logger = logging.getLogger(__name__)

NVIDIA_API_KEY = os.getenv("NVIDIA_API_KEY")
NVIDIA_BASE_URL = NVIDIA_CONFIG.get("base_url", "https://integrate.api.nvidia.com/v1")


def _require_nvidia_key() -> Optional[Dict[str, str]]:
    if not NVIDIA_API_KEY:
        return {"error": "NVIDIA_API_KEY is not set in environment"}
    return None


def route_to_nemotron(
    prompt: str,
    model: Optional[str] = None,
    max_tokens: int = 2048,
    temperature: float = 0.7
) -> Dict[str, Any]:
    """Send a prompt to a Nemotron model via NVIDIA API."""
    if error := _require_nvidia_key():
        return error

    model = model or NVIDIA_CONFIG.get("default_model")

    headers = {
        "Authorization": f"Bearer {NVIDIA_API_KEY}",
        "Content-Type": "application/json"
    }

    payload = {
        "model": model,
        "messages": [{"role": "user", "content": prompt}],
        "max_tokens": max_tokens,
        "temperature": temperature
    }

    try:
        response = requests.post(
            f"{NVIDIA_BASE_URL}/chat/completions",
            headers=headers,
            json=payload,
            timeout=120
        )
        response.raise_for_status()
        data = response.json()

        if "choices" not in data or not data["choices"]:
            return {"success": False, "error": "Invalid response from NVIDIA API"}

        return {
            "success": True,
            "model": model,
            "response": data["choices"][0]["message"]["content"],
            "usage": data.get("usage", {})
        }
    except requests.exceptions.RequestException as e:
        logger.error(f"NVIDIA API request failed: {e}")
        return {"success": False, "error": str(e)}
    except Exception as e:
        logger.error(f"Unexpected error in route_to_nemotron: {e}")
        return {"success": False, "error": "Unexpected error occurred"}


def execute_in_nemoclaw(task: str, safety_level: str = "high") -> Dict[str, Any]:
    """Placeholder for NemoClaw execution."""
    return {
        "success": True,
        "environment": "NemoClaw",
        "task": task,
        "safety_level": safety_level,
        "status": "queued",
        "note": "NemoClaw integration pending."
    }


TOOLS = [
    {"name": "route_to_nemotron", "handler": route_to_nemotron},
    {"name": "execute_in_nemoclaw", "handler": execute_in_nemoclaw},
]