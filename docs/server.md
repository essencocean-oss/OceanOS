# OceanOS — Server Runtime (Windows-native, no Docker)

## Quick start
```powershell
py -3 install.py
python -m uvicorn registery.api:app --host 127.0.0.1 --port 8000
python gateway/server.py
```

## Services
- Registry: 127.0.0.1:8000
- Gateway: 127.0.0.1:8080

## Agents
Place `agents/<id>/agent.json` with `{"name", "skills": [], "state": {}}`. Server exposes:
- GET /agents
- GET /agents/{id}
- POST /agents/{id}/heartbeat

## Skills
Place skills under `skills/<name>/SKILL.md`. Registry mounts `/skills`, `/skills/{name}/install`, `/skills/{name}/ratings`.

## State
`agents/`, `workspaces/`, `users/` are persisted locally. Do not put secrets in these folders.

## Process Manager
`src/main/processes.ts` exposes local process lifecycle over Electron IPC:
- `processes:start` -> spawn with label/command/args/cwd
- `processes:list` -> managed process snapshot
- `processes:kill` -> stop by id
- `processes:restart` -> stop then start

Renderer screen: `src/renderer/src/screens/Processes/Processes.tsx`
Preload bridge: `src/preload/index.ts` in `window.oceanAPI`
