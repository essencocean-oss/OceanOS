from fastapi import FastAPI, HTTPException

github = FastAPI(title='HermesOS GitHub')

@github.get('/health')
def health():
    return {'status': 'ok', 'module': 'github-integration'}

@github.post('/repos/{owner}/{repo}/issues')
def create_issue(owner: str, repo: str, payload: dict):
    return {'created': True, 'owner': owner, 'repo': repo, 'issue': payload.get('title')}
