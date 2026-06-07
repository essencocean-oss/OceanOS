from fastapi import FastAPI, HTTPException

guardrails = FastAPI(title='HermesOS Guardrails')

@guardrails.get('/health')
def health():
    return {'status': 'ok', 'module': 'guardrails-approval'}

@guardrails.post('/config')
def set_config(payload: dict):
    return {'applied': True, 'settings': payload}
