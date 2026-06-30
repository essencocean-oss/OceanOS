# OceanOS

The local-first operating environment for AI agents — a desktop runtime that turns your machine into mission control for autonomous work.

![OceanOS splash](docs/assets/hero.jpg)

## What it is

OceanOS runs AI agents, skills, and workflows locally. Its default view is a research and execution cockpit, with surfaces for chat, registry, marketplace, and autonomous builders.

## Quick start

### Frontend (Vite + React)

- Requirements: Node.js 20+, npm 10+, Rust/C toolchain for Tauri
- Install deps: `npm install`
- Dev server: `npm run dev`
- Production build: `npm run build` → writes assets into `dist/renderer`

### Tauri desktop app (verified)

- Dev: `npm run dev:tauri`
- Windows build: `npm run build:tauri`
- Verified outputs:
  - `src-tauri/target/release/bundle/nsis/OceanOS_0.1.0_x64-setup.exe` (7.8 MB)
  - `src-tauri/target/release/bundle/msi/OceanOS_0.1.0_x64_en-US.msi` (9.2 MB)
- Memory/disk: ~30–40 MB RAM at idle; ~9× smaller than the former Electron baseline

## Repo layout

- `src/renderer` — React + Vite frontend
- `src/renderer/src/shared/tauri.ts` — typed Tauri service bridge from renderer
- `src-tauri` — Tauri Rust backend and desktop config
- `registry/` — skills and agent registry
- `docs/` — architecture and runbooks
- `scripts/` — deployment and notification helpers
- `skills/` — bundled skills and manifests

## Migration notes

Electron has been replaced by Tauri 2.0. The renderer now calls Tauri commands directly; the legacy `window.oceanAPI` compatibility shim has been removed. All known Electron imports (`electron`, `ipcRenderer`, `contextBridge`, `remote`) are cleared from the renderer tree.

## Topics

agentic-os · ai-agents · desktop-environment · tauri · local-first · marketplace · skills · windows · macos · linux
