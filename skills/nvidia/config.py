"""
NVIDIA Configuration for OceanOS
Centralized configuration for Nemotron and NemoClaw.
"""

import os

NVIDIA_CONFIG = {
    # Default model used for reasoning
    "default_model": "nvidia/nemotron-3-ultra-550b-a55b",

    # API endpoint
    "base_url": os.getenv("NVIDIA_BASE_URL", "https://integrate.api.nvidia.com/v1"),

    # NemoClaw settings
    "nemoclaw_enabled": False,           # Toggle when real integration is ready
    "nemoclaw_safety_level": "high",     # high | medium | low

    # Supported models
    "supported_models": [
        "nvidia/nemotron-3-ultra-550b-a55b",
        "nvidia/nemotron-3-ultra-550b-a55b:free"
    ],

    # Request settings
    "default_max_tokens": 2048,
    "default_temperature": 0.7,
    "request_timeout": 120
}