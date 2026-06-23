# OceanOS

The local-first operating environment for AI agents — a desktop runtime that turns your machine into mission control for autonomous work.

![OceanOS splash](docs/assets/hero.jpg)

## What it is

OceanOS runs AI agents, skills, and workflows locally. Its default view is a research and execution cockpit, with surfaces for chat, registry, marketplace, and autonomous builders.

## Quick start

### Frontend

- Requirements: Node.js 20+, npm 10+, Rust 1.95+, C/C++ build tools
- Install deps: `npm install`
- Dev: `npm run dev`
- Build: `npm run build`

### Tauri desktop app

- Dev: `npm run dev:tauri`
- Build Windows: `npm run build:tauri`
- Output:
  - `src-tauri/target/release/bundle/nsis/OceanOS_0.1.0_x64-setup.exe`
  - `src-tauri/target/release/bundle/msi/OceanOS_0.1.0_x64_en-US.msi`

## Repo layout

- `src/main` — Electron main process (legacy)
- `src/preload` — context bridge layer (legacy)
- `src/renderer` — React renderer / screens
- `src/shared` — shared types / i18n
- `src-tauri` — Tauri Rust backend and desktop config
- `src/renderer/src/shared/tauri-bootstrap.ts` — Tauri compatibility shim
- `registry/` — skills and agent registry
- `docs/` — architecture and runbooks
- `scripts/` — deployment and notification helpers
- `skills/` — bundled skills and manifests

## Topics

agentic-os · ai-agents · desktop-environment · tauri · local-first · marketplace · skills · windows · macos · linux
