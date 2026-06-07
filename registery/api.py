from fastapi import FastAPI, HTTPException
from pydantic import BaseModel
from typing import List, Optional
import os, json

app = FastAPI(title='HermesOS Registry')
app.mount("/notifications", __import__("registery.notifications").notifications.notifs)
app.mount('/processes', __import__('registery.processes').processes.procs)

REGISTRY_PATH = 'skills'
USERS_PATH = 'users'
WORKSPACES_PATH = 'workspaces'

workflows = {}

@app.post("/workflow")
def save_workflow(data: dict):
    name = data.get("name", "default")
    skills = data.get("skills", [])
    workflows[name] = {"skills": skills, "saved_at": datetime.utcnow().isoformat() + "Z"}
    return {"saved": name, "skills": skills}

@app.get("/workflow/{name}")
def load_workflow(name: str):
    if name not in workflows:
        raise HTTPException(status_code=404, detail="Workflow not found")
    return workflows[name]
