import os, json, uuid, subprocess
from datetime import datetime
from fastapi import FastAPI, HTTPException
from pydantic import BaseModel
from typing import List, Optional

procs = FastAPI(title='OceanOS Process Manager')
DB = 'processes.json'
_running: dict = {}  # logical_pid -> Popen

class StartReq(BaseModel):
    skill: str
    command: Optional[str] = None

def _db() -> list:
    if os.path.exists(DB):
        with open(DB) as f:
            return json.load(f)
    return []

def _save(data: list):
    with open(DB, 'w') as f:
        json.dump(data, f, indent=2)

@procs.get('/health')
def health():
    return {'status': 'ok', 'running': len(_running)}

@procs.get('/users/{user_id}/processes')
def list_processes(user_id: str):
    out = []
    for p in _db():
        if p['user_id'] != user_id:
            continue
        if p['status'] == 'running' and p.get('os_pid'):
            p['cpu'] = round(max(0.0, 0.1 * p.get('_ticks', 1)), 1)
            p['memory'] = round(12.0 + p.get('_ticks', 1) * 0.5, 1)
        out.append({k: v for k, v in p.items() if not k.startswith('_')})
    return out

@procs.post('/users/{user_id}/processes')
def start_process(user_id: str, req: StartReq):
    skill = req.skill
    lpid = f'p-{user_id}-{skill}-{uuid.uuid4().hex[:6]}'
    cmd = req.command or f'python -c "import time, sys; print(\'{skill} started\'); time.sleep(3600)"'
    ts = datetime.utcnow().isoformat() + 'Z'
    try:
        proc = subprocess.Popen(cmd, shell=True, stdout=subprocess.PIPE, stderr=subprocess.PIPE, text=True)
        _running[lpid] = proc
        opts = {'pid': lpid, 'os_pid': proc.pid}
    except Exception as e:
        return {'pid': lpid, 'skill': skill, 'status': 'failed', 'error': str(e), 'started_at': ts}
    rec = {'pid': lpid, 'os_pid': proc.pid, 'user_id': user_id, 'skill': skill, 'status': 'running', 'started_at': ts, 'cpu': 0.0, 'memory': 0.0, '_ticks': 0}
    d = _db(); d.append(rec); _save(d)
    return rec

@procs.post('/users/{user_id}/processes/{pid}/stop')
def stop_process(user_id: str, pid: str):
    d = _db()
    tgt = None
    for p in d:
        if p['pid'] == pid and p['user_id'] == user_id:
            tgt = p; break
    if not tgt:
        raise HTTPException(404, 'Not found')
    proc = _running.get(pid)
    if proc and proc.poll() is None:
        proc.terminate()
        try: proc.wait(timeout=5)
        except subprocess.TimeoutExpired: proc.kill()
    _running.pop(pid, None)
    tgt['status'] = 'stopped'
    tgt['stopped_at'] = datetime.utcnow().isoformat() + 'Z'
    _save(d)
    return {'stopped': pid}

@procs.post('/users/{user_id}/processes/{pid}/restart')
def restart_process(user_id: str, pid: str):
    d = _db()
    tgt = None
    for p in d:
        if p['pid'] == pid and p['user_id'] == user_id:
            tgt = p; break
    if not tgt:
        raise HTTPException(404, 'Not found')
    stop_process(user_id, pid)
    req = StartReq(skill=tgt['skill'])
    return start_process(user_id, req)