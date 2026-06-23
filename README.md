# OceanOS

The local-first operating environment for AI agents — a desktop runtime that turns your machine into mission control for autonomous work.

![OceanOS splash](docs/assets/hero.jpg)

## What it is

OceanOS runs AI agents, skills, and workflows locally. Its default view is a research and execution cockpit, with surfaces for chat, registry, marketplace, and autonomous builders.

## Quick start

- Requirements: Node.js 18+, npm
- Install deps: `npm install`
- Dev: `npm run dev`
- Build: `npm run build`
- Windows release: `npm run build:win`

## Repo layout

- `src/main` — Electron main process
- `src/preload` — context bridge layer
- `src/renderer` — React renderer / screens
- `src/shared` — shared types / i18n
- `registry/` — skills and agent registry
- `docs/` — architecture and runbooks
- `scripts/` — deployment and notification helpers
- `skills/` — bundled skills and manifests

## Topics

agentic-os · ai-agents · desktop-environment · tauri · local-first · marketplace · skills · windows · macos · linux
