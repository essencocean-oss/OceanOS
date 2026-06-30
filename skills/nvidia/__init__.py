"""
NVIDIA Skill for OceanOS
Provides Nemotron model access and NemoClaw execution support.
"""

from .config import NVIDIA_CONFIG
from .nvidia_tools import TOOLS as NVIDIA_TOOLS
from .nemoclaw import get_nemoclaw_status, run_agent_in_nemoclaw

__all__ = [
    "NVIDIA_CONFIG",
    "NVIDIA_TOOLS",
    "get_nemoclaw_status",
    "run_agent_in_nemoclaw",
]