New-Item -ItemType Directory -Force -Path registry | Out-Null

@'
from fastapi import FastAPI, HTTPException
from pydantic import BaseModel
from typing import List, Optional
import os, json

app = FastAPI(title="HermesOS Registry")

REGISTRY_PATH = "skills"
USERS_PATH = "users"

class Skill(BaseModel):
    name: str
    version: str
    description: str
    author: str
    price_cents: int = 0

class User(BaseModel):
    user_id: str
    telegram_chat_id: Optional[str] = None
    installed_skills: List[str] = []

@app.get("/health")
def health():
    return {"status": "ok", "service": "hermesos-registry"}

@app.get("/skills")
def list_skills():
    skills = []
    for root, dirs, files in os.walk(REGISTRY_PATH):
        for f in files:
            if f == "manifest.json":
                path = os.path.join(root, f)
                with open(path) as fp:
                    skills.append(json.load(fp))
    return skills

@app.get("/skills/{name}")
def get_skill(name: str):
    path = os.path.join(REGISTRY_PATH, name, "manifest.json")
    if not os.path.exists(path):
        raise HTTPException(status_code=404, detail="Skill not found")
    with open(path) as fp:
        return json.load(fp)

@app.post("/users/{user_id}/install/{skill_name}")
def install_skill(user_id: str, skill_name: str):
    user_dir = os.path.join(USERS_PATH, user_id)
    os.makedirs(user_dir, exist_ok=True)
    state_path = os.path.join(user_dir, "state.json")
    state = {"installed": []}
    if os.path.exists(state_path):
        with open(state_path) as fp:
            state = json.load(fp)
    if skill_name not in state.get("installed", []):
        state.setdefault("installed", []).append(skill_name)
        with open(state_path, "w") as fp:
            json.dump(state, fp, indent=2)
    return {"user_id": user_id, "skill": skill_name, "installed": True}
'@ | Out-File -FilePath registry/api.py -Encoding UTF8