from fastapi import FastAPI, HTTPException
from fastapi.staticfiles import StaticFiles
from pydantic import BaseModel
from typing import List, Optional
import os, json

app = FastAPI(title='HermesOS Registry')
app.mount('/ui', StaticFiles(directory='ui', html=True))
app.mount("/notifications", __import__("registery.notifications").notifications.notifs)
app.mount("/memory", __import__("registery.memory").memory.mem)
app.mount('/processes', __import__('registery.processes').processes.procs)
app.mount('/guardrails', __import__('registery.guardrails').guardrails.guardrails)
app.mount('/github', __import__('registery.github').github.github)
app.mount('/browser', __import__('registery.browser').browser.browser)
app.mount('/portfolio', __import__('registery.portfolio').portfolio.portfolio)

REGISTRY_PATH = 'skills'
USERS_PATH = 'users'
WORKSPACES_PATH = 'workspaces'

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

@app.get("/skills/{name}/ratings")
def get_ratings(name: str):
    if name not in ratings:
        return {"name": name, "avg_stars": 0, "count": 0}
    arr = ratings[name]
    return {"name": name, "avg_stars": sum(r["stars"] for r in arr) / len(arr), "count": len(arr)}

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
    # 1) manifest.json files
    for path in _glob.glob(f"{REGISTRY_PATH}/*/manifest.json"):
        try:
            with open(path, "r", encoding="utf-8") as f:
                data = json.load(f)
            out[data.get("name", _stem(path))] = data
        except Exception:
            pass
    # 2) SKILL.md files with YAML frontmatter (only if no manifest.json)
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
    # directory name is the skill identifier (e.g. .../skills/<name>/SKILL.md)
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

@app.get("/skills")
def list_skills():
    manifests = _load_manifests()
    items = []
    for name, m in manifests.items():
        items.append({
            "name": m.get("name", name),
            "version": m.get("version", "0.1.0"),
            "description": m.get("description", ""),
            "author": m.get("author", ""),
            "tags": m.get("tags", []),
            "price_cents": m.get("price_cents", 0),
            "downloads": downloads.get(name, 0),
            "ratings": ratings.get(name, []),
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
    downloads[name] = downloads.get(name, 0) + 1
    return {"installed": name, "downloads": downloads[name]}

@app.post("/skills/{name}/uninstall")
def uninstall_skill(name: str):
    manifests = _load_manifests()
    if name not in manifests:
        raise HTTPException(404, "Skill not found")
    return {"uninstalled": name}

@app.post("/skills")
def publish_skill(manifest: SkillManifest):
    return {
        "name": manifest.name,
        "version": manifest.version,
        "status": "published",
    }
