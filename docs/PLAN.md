# OceanOS — Detailed Implementation & Cleanup Plan

## Overview
Ship a clean, fully-native Tauri desktop runtime branded as **OceanOS**, with a small footprint, futuristic UI, built-in agent squad, skills marketplace, and unique orchestration/memory/safety layers.

## Current State (tauri-migration)
- Tauri 2.0 scaffold complete; Windows installers verified (~9 MB NSIS).
- Frontend still calls legacy Electron APIs in `src/main/` and `src/preload/`.
- OceanOS/OceanOSOS branding still appears in dozens of files and strings.
- No theme system beyond token scaffolding; no built-in agent squad manifests.
- Marketplace and learning-loop not yet deployed.

## Priorities

### P0 — Ship a clean, verified Tauri baseline
- **Remove all legacy Electron main/preload shims** that remain in `src/main/` and `src/preload/`.
- **Deep brand cleanup**: eradicate every remaining OceanOS/oceanos/OceanOSOS string (code, comments, configs, docs, i18n, CSS classes, keys, env vars, installers).
- **Consolidate home paths**: move from `~/.oceanos` / `%LocalAppData%\oceanos` to `~/.oceanos` / `%LocalAppData%\oceanos`.
- **Re-verify builds** after brand migration.
- *Output*: One merged commit `chore: final deep cleanup of all OceanOS references`; `tsc --noEmit` clean; `npm run build:tauri` succeeds; Windows installer output verified.

### P1 — Finalize Tauri-first architecture
- Strip out remaining Electron-specific comments/paths (`src/main/installer.ts`, `src/main/config-health.ts`, etc.).
- Replace all `ipcRenderer`, `contextBridge`, `remote` usages with Tauri primitives.
- Remove `src/main/` and `src/preload/` from active build; guard them in `.gitignore` as archival unless user wants them gone entirely.
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
- Maelstrom: executor (runs skills / workflows / cron / tools).
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

## Immediate Next Steps (right now)
1. **Brand cleanup script** — run a repo-wide safe find/replace to crush every OceanOS/ oceanosos / OceanOSOS reference (strings, variables, keys, paths, env vars, comments, UI labels).
2. **Changelog update** — rewrite `CHANGELOG.md` to stop referencing old alpha phases.
3. **Commit** with `chore: final deep cleanup of all OceanOS references`.
4. **Verify** with `git grep -i oceanos` (filtering node_modules, dist, target) returns zero matches.
5. **Build check** — `npm run build:tauri`; ensure Windows bundles still appear and are under 10 MB.

## Risk & Confidence
- Success criteria: zero brand hits in trackable sources, build artifacts identical or smaller, no regression in installer output.
- Risk: Some OceanOS strings live in upstream dependencies (oceanos-parser, oceanos-estree) and unit tests that mock `window.oceanAPI`. Those can be normalized; npm packages we leave as-is.
