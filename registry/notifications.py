from fastapi import FastAPI
from pydantic import BaseModel
from typing import Optional
import json, os
from datetime import datetime

notifs = FastAPI(title='OceanOS Notifications')
NOTIF_PATH = 'notifications.json'

class Notification(BaseModel):
    user_id: str
    title: str
    body: str
    type: str = 'info'

@notifs.get('/health')
def health():
    return {'status': 'ok'}

@notifs.post('/notifications')
def send_notification(n: Notification):
    entry = {
        'user_id': n.user_id,
        'title': n.title,
        'body': n.body,
        'type': n.type,
        'timestamp': datetime.utcnow().isoformat() + 'Z'
    }
    data = []
    if os.path.exists(NOTIF_PATH):
        with open(NOTIF_PATH) as f:
            data = json.load(f)
    data.append(entry)
    with open(NOTIF_PATH, 'w') as f:
        json.dump(data, f, indent=2)
    return entry

@notifs.get('/users/{user_id}/notifications')
def list_notifications(user_id: str):
    if not os.path.exists(NOTIF_PATH):
        return []
    with open(NOTIF_PATH) as f:
        data = json.load(f)
    return [n for n in data if n['user_id'] == user_id]
