from fastapi import FastAPI
from pydantic import BaseModel
from typing import List, Optional, Dict, Any
import os, json, time, re
from datetime import datetime

mem = FastAPI(title='OceanOS Memory Store')
STORE = 'memory_store.json'

class MemoryEntry(BaseModel):
    key: str
    value: str
    user_id: str
    tags: List[str] = []
    importance: int = 1  # 1-5
    ttl: Optional[int] = None  # seconds

class QueryReq(BaseModel):
    user_id: str
    query: str
    tags: List[str] = []
    top_k: int = 5

def _db() -> list:
    if os.path.exists(STORE):
        with open(STORE) as f:
            return json.load(f)
    return []

def _save(data: list):
    with open(STORE, 'w') as f:
        json.dump(data, f, indent=2)

@mem.get('/health')
def health():
    return {'status': 'ok'}

@mem.post('/memory/upsert')
def upsert(m: MemoryEntry):
    data = _db()
    now = datetime.utcnow().isoformat() + 'Z'
    existing = None
    for p in data:
        if p['key'] == m.key and p['user_id'] == m.user_id:
            existing = p
            break
    rec = {
        'key': m.key,
        'value': m.value,
        'user_id': m.user_id,
        'tags': m.tags,
        'importance': m.importance,
        'updated_at': now,
    }
    if m.ttl:
        rec['expires_at'] = int(time.time()) + m.ttl
    if existing:
        existing.update(rec)
    else:
        rec['created_at'] = now
        data.append(rec)
    _save(data)
    return {'upserted': m.key}

@mem.post('/memory/query')
def query(q: QueryReq):
    data = _db()
    now = int(time.time())
    scored = []
    for p in data:
        if p['user_id'] != q.user_id:
            continue
        if 'expires_at' in p and now > p['expires_at']:
            continue
        score = 0
        terms = re.findall(r'\w+', q.query.lower())
        text = (p['key'] + ' ' + p['value'] + ' ' + ' '.join(p.get('tags', []))).lower()
        for t in terms:
            if t in text:
                score += 1
        score *= p.get('importance', 1)
        if q.tags:
            if not any(tag in p.get('tags', []) for tag in q.tags):
                score *= 0.1
        scored.append((score, p))
    scored.sort(key=lambda x: x[0], reverse=True)
    return {'results': [p for _, p in scored[:q.top_k]]}

@mem.get('/memory/{user_id}')
def list_memories(user_id: str, tags: Optional[str] = None):
    data = _db()
    out = []
    for p in data:
        if p['user_id'] != user_id:
            continue
        if tags:
            tag_list = [t.strip() for t in tags.split(',')]
            if not any(tag in p.get('tags', []) for tag in tag_list):
                continue
        out.append(p)
    out.sort(key=lambda x: x.get('importance', 1), reverse=True)
    return out

@mem.delete('/memory/{user_id}/{key}')
def delete(user_id: str, key: str):
    data = _db()
    data = [p for p in data if not (p['user_id'] == user_id and p['key'] == key)]
    _save(data)
    return {'deleted': key}