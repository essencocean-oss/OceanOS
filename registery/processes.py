from fastapi import FastAPI; from pydantic import BaseModel; from typing import List, Optional; import os, json, datetime
procs = FastAPI(title='HermesOS Processes')
PROCESSES_PATH = 'processes.json'

class Process(BaseModel):
    pid: str
    user_id: str
    skill: str
    status: str = 'running'
    started_at: Optional[str] = None
    cpu: Optional[float] = None
    memory: Optional[float] = None

@procs.get('/health')
def health():
    return {'status': 'ok'}

@procs.get('/users/{user_id}/processes')
def list_processes(user_id: str):
    data = []
    if os.path.exists(PROCESSES_PATH):
        with open(PROCESSES_PATH) as f:
            data = json.load(f)
    return [p for p in data if p['user_id'] == user_id]

@procs.post('/users/{user_id}/processes')
def start_process(user_id: str, skill: str):
    pid = f'p-{user_id}-{skill}'
    proc = {'pid': pid, 'user_id': user_id, 'skill': skill, 'status': 'running', 'started_at': datetime.datetime.utcnow().isoformat() + 'Z', 'cpu': 0.1, 'memory': 12.0}
    data = []
    if os.path.exists(PROCESSES_PATH):
        with open(PROCESSES_PATH) as f:
            data = json.load(f)
    data.append(proc)
    with open(PROCESSES_PATH, 'w') as f:
        json.dump(data, f, indent=2)
    return proc

@procs.post('/users/{user_id}/processes/{pid}/stop')
def stop_process(user_id: str, pid: str):
    if os.path.exists(PROCESSES_PATH):
        with open(PROCESSES_PATH) as f:
            data = json.load(f)
        for p in data:
            if p['pid'] == pid and p['user_id'] == user_id:
                p['status'] = 'stopped'
        with open(PROCESSES_PATH, 'w') as f:
            json.dump(data, f, indent=2)
    return {'stopped': pid}

