from fastapi import FastAPI, HTTPException
from fastapi.staticfiles import StaticFiles
from pydantic import BaseModel
from typing import List, Optional
import os, json, shutil

app = FastAPI(title='OceanOS Registry')
app.mount('/ui', StaticFiles(directory='ui', html=True))
app.mount("/notifications", __import__("registery.notifications").notifications.notifs)
app.mount("/memory", __import__("registery.memory").memory.mem)
app.mount('/processes', __import__('registery.processes').processes.procs)
app.mount('/guardrails', __import__('registery.guardrails').guardrails.guardrails)
app.mount('/github', __import__('registery.github').github.github)
app.mount('/browser', __import__('registery.browser').browser.browser)
app.mount('/portfolio', __import__('registery.portfolio').portfolio.portfolio)
app.mount('/sandbox', __import__('registery.sandbox').sandbox.sandbox)

REGISTRY_PATH = 'skills'
HEARTBEAT_PATH = "agents"
USERS_PATH = "users"
WORKSPACES_PATH = "workspaces"
AGENTS_PATH = "agents"
HEARTBEAT_FILENAME = "heartbeat.json"

# --- Versioning & Ratings ---
ratings = {}
downloads = {}

class SkillManifest(BaseModel):
    name: str
    version: str = "0.1.0"
    changelog: str = "Initial release"
    description: str
    author: str
    tags: list = []
    price_cents: int = 0
    license_key_required: bool = False

@app.post("/skills/{name}/rate")
def rate_skill(name: str, data: dict):
    user_id = data.get("user_id", "anonymous")
    stars = data.get("stars", 0)
    if name not in ratings:
        ratings[name] = []
    ratings[name].append({"user_id": user_id, "stars": stars})
    return {"name": name, "avg_stars": sum(r["stars"] for r in ratings[name]) / len(ratings[name])}

@app.get('/skills/{name}/ratings')
def get_ratings(name: str):
    if name not in ratings:
        return {"name": name, "avg_stars": 0, "count": 0}
    arr = ratings[name]
    return {"name": name, "avg_stars": sum(r["stars"] for r in arr) / len(arr), "count": len(arr)}

@app.get('/health')
def health():
    docker_cmd = os.environ.get('OCEANOS_DOCKER_CMD', 'docker')
    return {'status': 'ok', 'service': 'oceanos-registry', 'sandbox': False}

@app.post("/skills/{name}/download")
def track_download(name: str):
    downloads[name] = downloads.get(name, 0) + 1
    return {"name": name, "downloads": downloads[name]}

@app.get("/skills/{name}/downloads")
def get_downloads(name: str):
    return {"name": name, "downloads": downloads.get(name, 0)}

# --- Skills CRUD ---
import glob as _glob

def _load_manifests() -> dict:
    out = {}
    for path in _glob.glob(f"{REGISTRY_PATH}/*/manifest.json"):
        try:
            with open(path, "r", encoding="utf-8") as f:
                data = json.load(f)
            out[data.get("name", _stem(path))] = data
        except Exception:
            pass
    manifest_stems = {_stem(p) for p in _glob.glob(f"{REGISTRY_PATH}/*/manifest.json")}
    for path in _glob.glob(f"{REGISTRY_PATH}/*/SKILL.md"):
        if _stem(path) in manifest_stems:
            continue
        try:
            with open(path, "r", encoding="utf-8") as f:
                content = f.read()
            data = _parse_yaml_frontmatter(content)
            name = data.get("name") or _stem(path)
            data.setdefault("name", name)
            data.setdefault("version", "0.1.0")
            data.setdefault("description", "")
            data.setdefault("author", "")
            data.setdefault("tags", [])
            data.setdefault("price_cents", 0)
            data.setdefault("license_key_required", False)
            out[name] = data
        except Exception:
            pass
    return out

def _stem(path: str) -> str:
    return os.path.basename(os.path.dirname(path))

def _parse_yaml_frontmatter(text: str) -> dict:
    out = {}
    if not text.startswith("---"):
        return out
    _, body, _ = text.split("---", 2)
    for raw in body.splitlines():
        if ":" not in raw:
            continue
        line = raw.lstrip("\t").strip()
        k, v = line.split(":", 1)
        k, v = k.strip(), v.strip()
        if k == "tags":
            v = [t.strip() for t in v.split(",") if t.strip()] if v else []
            out[k] = v
            continue
        if v.lower() == "true":
            out[k] = True
        elif v.lower() == "false":
            out[k] = False
        elif k not in {"name", "description", "author"}:
            try:
                out[k] = int(v)
            except Exception:
                out[k] = v
        else:
            out[k] = v
    return out

def _copy_skill_dir(src: str, dest: str) -> int:
    copied = 0
    for root, _dirs, files in os.walk(src):
        rel = os.path.relpath(root, src)
        target_root = os.path.join(dest, rel) if rel != "." else dest
        os.makedirs(target_root, exist_ok=True)
        for name in files:
            src_file = os.path.join(root, name)
            dest_file = os.path.join(target_root, name)
            with open(src_file, "rb") as fsrc, open(dest_file, "wb") as fdst:
                fdst.write(fsrc.read())
            copied += 1
    return copied

@app.get("/skills")
def list_skills():
    manifests = _load_manifests()
    fallback_repo = {
        "memory": "https://github.com/NousResearch/oceanos-agent",
        "spawn": "https://github.com/NousResearch/oceanos-agent",
        "github-integration": "https://github.com/NousResearch/oceanos-agent",
        "guardrails-approval": "https://github.com/NousResearch/oceanos-agent",
        "web-browser-automation": "https://github.com/NousResearch/oceanos-agent",
        "portfolio-tracker": "https://github.com/essencocean-oss/OceanOS",
        "telegram-poster": "https://github.com/essencocean-oss/OceanOS",
    }
    items = []
    for name, m in manifests.items():
        repo = m.get("source_repo") or fallback_repo.get(name)
        items.append({
            "name": m.get("name", name),
            "version": m.get("version", "0.1.0"),
            "description": m.get("description", ""),
            "author": m.get("author", ""),
            "tags": m.get("tags", []),
            "price_cents": m.get("price_cents", 0),
            "downloads": downloads.get(name, 0),
            "ratings": ratings.get(name, []),
            "source_repo": repo,
            "is_verified": bool(repo),
        })
    return {"items": items}

@app.get("/skills/{name}")
def get_skill(name: str):
    manifests = _load_manifests()
    if name not in manifests:
        raise HTTPException(404, "Skill not found")
    m = manifests[name]
    return {
        "name": m.get("name", name),
        "version": m.get("version", "0.1.0"),
        "description": m.get("description", ""),
        "author": m.get("author", ""),
        "tags": m.get("tags", []),
        "price_cents": m.get("price_cents", 0),
        "downloads": downloads.get(name, 0),
        "ratings": ratings.get(name, []),
    }

@app.post("/skills/{name}/install")
def install_skill(name: str):
    manifests = _load_manifests()
    if name not in manifests:
        raise HTTPException(404, "Skill not found")
    m = manifests[name]
    src = os.path.join(REGISTRY_PATH, name)
    if not os.path.isdir(src):
        raise HTTPException(409, "Skill source directory missing")
    candidates = [
        os.environ.get("OCEANOS_SKILLS_DIR"),
        os.path.join(os.path.expanduser("~"), ".oceanos", "skills"),
        os.path.join(os.path.expanduser("~"), "AppData", "Local", "oceanos", "skills"),
    ]
    dest_root = next((p for p in candidates if p), os.path.join(os.path.expanduser("~"), ".oceanos", "skills"))
    dest = os.path.join(dest_root, name)
    if os.path.exists(dest):
        return {"installed": name, "status": "already_installed", "downloads": downloads.get(name, 0)}
    try:
        os.makedirs(dest, exist_ok=True)
    except Exception as exc:
        raise HTTPException(500, f"Failed to create skill directory: {exc}")
    copied = _copy_skill_dir(src, dest)
    if not copied:
        raise HTTPException(500, "Skill installed with no files copied")
    downloads[name] = downloads.get(name, 0) + 1
    return {"installed": name, "status": "installed", "files_copied": copied, "downloads": downloads[name]}

@app.post("/skills/{name}/uninstall")
def uninstall_skill(name: str):
    manifests = _load_manifests()
    if name not in manifests:
        raise HTTPException(404, "Skill not found")
    return {"uninstalled": name}

HEARTBEAT = {}

def _register_agent(agent_id: str, payload: dict):
    HEARTBEAT[agent_id] = {
        "agent_id": agent_id,
        "status": "online",
        "last_seen": __import__("datetime").datetime.utcnow().isoformat() + "Z",
        "payload": payload or {},
    }

def _load_agents() -> dict:
    return dict(HEARTBEAT)

@app.get("/agents")
def list_agents():
    agents = _load_agents()
    return {"items": list(agents.values())}

@app.get("/agents/{agent_id}")
def get_agent(agent_id: str):
    agents = _load_agents()
    if agent_id not in agents:
        raise HTTPException(404, "Agent not found")
    return agents[agent_id]

@app.post("/agents/{agent_id}/heartbeat")
def agent_heartbeat(agent_id: str, payload: Optional[dict] = None):
    _register_agent(agent_id, payload)
    return {"status": "ok"}
