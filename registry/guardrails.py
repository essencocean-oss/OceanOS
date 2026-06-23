from fastapi import FastAPI, HTTPException
from pydantic import BaseModel, Field
from typing import Optional, Dict, Any
import os

guardrails = FastAPI(title='OceanOS Guardrails')

# In-memory default config
_config: Dict[str, Any] = {
    "approvals": {"mode": "default"},
    "security": {"redact_secrets": True},
    "privacy": {"redact_pii": True},
}

class GuardrailsSettings(BaseModel):
    approvals: Optional[Dict[str, Any]] = None
    security: Optional[Dict[str, Any]] = None
    privacy: Optional[Dict[str, Any]] = None

@guardrails.get('/health')
def health():
    return {'status': 'ok', 'module': 'guardrails-approval'}

@guardrails.get('/config')
def get_config():
    return _config

@guardrails.post('/config')
def set_config(settings: GuardrailsSettings):
    data = settings.dict(exclude_none=True)
    for section in ("approvals", "security", "privacy"):
        if section in data:
            _config[section].update(data[section])
    return {'applied': True, 'settings': _config}
