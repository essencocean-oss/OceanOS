# OceanOS — Detailed Implementation & Cleanup Plan

## Overview
Ship a clean, fully-native Tauri desktop runtime branded as **OceanOS**, with a small footprint, futuristic UI, built-in agent squad, skills marketplace, and unique orchestration/memory/safety layers.

## Current State (tauri-migration, as of latest commit)
- Tauri 2.0 scaffold complete; Windows installers verified (NSIS 7.8 MB, MSI 9.2 MB).
- P0 legacy cleanup complete: `src/main/` and `src/preload/` archived under `electron-legacy/`; Electron configs removed; zero Electron-specific imports in active renderer TS/TSX.
- P1 Tauri-first architecture complete: typed `tauri.ts` service layer, all IPC calls use `tauri.invoke`, MSVC toolchain configured, Windows debug/release binaries verified.
- P2 theme system implemented: Ocean Deep (default), Abyss, Aether — with live switcher in Settings and full CSS variable blocks.
- P3 built-in agent team complete: Team screen with Titan/Maelstrom/Aegis/Oracle, delegation workflow workflow wired into Layout nav pane.
- TypeScript compilation clean: `npx tsc --noEmit --project tsconfig.web.json` returns 0 errors.
- Brand verification: `git grep -i hermes` returns zero hits in tracked sources; only 3rd-party lockfile references remain (intentionally untouched).
- `npm run dev:tauri` verified: Vite dev server responds on localhost:5173; Tauri debug binary launches; oceanos-tauri.exe process confirmed running.
- `npm run build:tauri` verified: release build completes; NSIS + MSI bundles produced; installer size ~9 MB (vs Electron ~73 MB).

## Priorities

### P0 — Ship a clean, verified Tauri baseline
- ~~Remove all legacy Electron main/preload shims~~
- ~~Deep brand cleanup: eradicate every remaining Hermes string~~
- ~~Re-verify builds after brand migration~~
- *Output*: `chore: final deep cleanup of all Hermes references` committed; build succeeds; installer output verified.

### P1 — Finalize Tauri-first architecture
- ~~Strip remaining Electron-specific comments/paths (archived, not active).~~
- ~~Replace all `ipcRenderer`, `contextBridge`, `remote` usages with Tauri primitives.~~
- ~~Ensure `src-tauri/src/main.rs` reads/writes only OceanOS paths and exposes the final command set.~~
- ~~Jacob’s Ladder / Claw migration flow exposed in Settings (`runClawMigrate`, `runOceanBackup`, `runOceanImport`, `readLogs`).~~
- *Output*: Minimal Electron footprint; only Tauri native code touches disk.

### P2 — Cockpit UI + Themes (futuristic Oceanos aesthetic)
- Ocean Deep (default): deep blues/teals, translucent glassmorphism, high contrast.
- Abyss: maximum contrast dark.
- Aether: clean light mode.
- Live theme switcher in Settings.
- Three-panel cockpit: sidebar registry → central execution → right agents/memory → bottom controls.
- *Output*: Settings screen ships theme picker; every screen consumes theme context.

### P3 — Built-in Agent Team (Titan / Maelstrom / Aegis / Oracle)
- Define each agent as a manifest/plugin in the registry (skill + persona + toolset config).
- Titan: planner (task decomposition → Kanban).
- Maelstrom: executor (runs skills / workflow / cron / tools).
- Aegis: security/guardrails (sandbox + approval + risk scoring).
- Oracle: reviewer / verifier / self-critique loop.
- End-to-end delegation workflow: Titan plan → Maelstrom execute → Oracle review → Aegis security check.
- *Output*: Agents list in cockpit shows four default agents; users can spawn them with one click; delegation workflow functional.

### P4 — Skills System & Marketplace *(next priority)*
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
1. Basic Skills Registry loading and execution (P4 foundation).
2. Verify end-to-end agent delegation workflow in running app.
3. Open PR for `tauri-migration` → `main` review.
4. Publish Windows installer for user desktop testing.

## Risk & Confidence
- Success criteria: brand hits zero in sources, build succeeds, installer <10 MB, Tauri MVP with themes + team UI functional.
- Risk: Some Hermes strings live in upstream dependencies (hermes-parser, hermes-estree) and unit tests that mock legacy APIs. Those can be normalized; npm packages we leave as-is.
