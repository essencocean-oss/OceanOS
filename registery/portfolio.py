from fastapi import FastAPI, HTTPException

portfolio = FastAPI(title='HermesOS Portfolio')

@portfolio.get('/health')
def health():
    return {'status': 'ok', 'module': 'portfolio-tracker'}

@portfolio.post('/summary')
def summary(payload: dict):
    return {'ok': True, 'summary': payload}
