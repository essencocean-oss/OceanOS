# OceanOS — Detailed Implementation & Cleanup Plan

## Overview
Ship a clean, fully-native Tauri desktop runtime branded as **OceanOS**, with a small footprint, futuristic UI, built-in agent squad, skills marketplace, and unique orchestration/memory/safety layers.

## Current State (tauri-migration, as of latest commit)
- Tauri 2.0 scaffold complete; Windows installers verified (~9 MB NSIS, ~9.2 MB MSI).
- P1 legacy cleanup mostly done: `src/main/` and `src/preload/` archived under `electron-legacy/`; Electron configs removed; no Electron-specific imports remain in renderer or Rust backend.
- P2 theme system implemented: Ocean Deep (default), Abyss, Aether — with live switcher in Settings and full CSS variable blocks.
- P3 built-in agent team scaffolded: Team screen with Titan/Maelstrom/Aegis/Oracle, wired into Layout nav and pane system.
- TypeScript errors reduced to API-shape mismatches from bulk IPC migration (not new regressions).
- Brand verification: `git grep -i hermes` returns zero hits in repo sources; only 3rd-party lockfile references remain (hermes-parser, hermes-estree).

## Priorities

### P0 — Ship a clean, verified Tauri baseline
- ~~Remove all legacy Electron main/preload shims~~
- ~~Deep brand cleanup: eradicate every remaining Hermes string~~
- ~~Re-verify builds after brand migration~~
- *Output*: `chore: final deep cleanup of all Hermes references` committed; build succeeds; installer output verified.

### P1 — Finalize Tauri-first architecture
- Strip remaining Electron-specific comments/paths (archived, not active).
- Replace all `ipcRenderer`, `contextBridge`, `remote` usages with Tauri primitives.
- Ensure `src-tauri/src/main.rs` reads/writes only OceanOS paths and exposes the final command set.
- *Output*: Minimal Electron footprint; only Tauri native code touches disk.

### P2 — Cockpit UI + Themes (futuristic Oceanos aesthetic)
- Ocean Deep (default): deep blues/teals, translucent glassmorphism, high contrast.
- Abyss: maximum contrast dark.
- Aether: clean light mode.
- Live theme switcher in Settings.
- Lay out the three-panel cockpit: sidebar registry → central execution → right agents/memory → bottom controls.
- *Output*: Settings screen ships theme picker; every screen consumes theme context.

### P3 — Built-in Agent Team (Titan / Maelstrom / Aegis / Oracle)
- Define each agent as a manifest/plugin in the registry (skill + persona + toolset config).
- Titan: planner (task decomposition → Kanban).
- Maelstrom: executor (runs skills / workflow / cron / tools).
- Aegis: security/guardrails (sandbox + approval + risk scoring).
- Oracle: reviewer / verifier / self-critique loop.
- *Output*: Agents list in cockpit shows four default agents; users can spawn them with one click.

### P4 — Skills System & Marketplace
- Local registry (`registry/`) with install/update/uninstall flow.
- Marketplace web/desktop view (browse, rate, publish, versioning, sandbox).
- Auto-discovery: watch skills folder, read `manifest.yaml`.
- *Output*: Users install and run third-party skills from a curated source.

### P5 — Governance & Memory Learning Loop
- Aegis + Oracle approvals around tool use.
- Closed learning: agent memory graph (visual knowledge map), sessions indexed by vector store, skills auto-update when recurring patterns are detected.
- *Output*: Dashboard shows “memory graph” + agent improvement suggestions.

### P6 — High-priority differentiators
- Browser/computer-use capabilities (Playwright or Puppeteer via Tauri sidecar).
- Voice I/O (system TTS + STT).
- Multi-model routing (Claude / GPT / Grok / Nemotron / local Ollama).
- CPU/GPU perf dashboard.
- *Output*: Parity with competing agent desktops.

## Immediate Next Steps
1. Fix remaining TypeScript API shape mismatches from bulk migration (Settings, Schedules, Providers, Team).
2. Verify theme switcher and Team UI in `npm run dev:tauri`.
3. Re-run full `npm run build:tauri` and capture final installer size.
4. Push and open PR for review.

## Risk & Confidence
- Success criteria: brand hits zero in sources, build succeeds, installer <10 MB, Tauri MVP with themes + team UI functional.
- Risk: Some Hermes strings live in upstream dependencies (hermes-parser, hermes-estree) and unit tests that mock legacy APIs. Those can be normalized; npm packages we leave as-is.
