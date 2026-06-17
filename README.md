# HermesOS

The local-first operating environment for AI agents — an Electron app that turns your desktop into a mission control for autonomous work.

![HermesOS splash](docs/assets/hero.jpg)

## What it is

HermesOS runs AI agents, skills, and workflows on your machine. Its default view is a research and execution cockpit, but it’s built to support many surfaces: chat, registry, marketplace, and autonomous builders.

## Quick start

- Requirements: Node.js 18+, pnpm or npm
- Install deps: `pnpm install`
- Dev: `pnpm dev`
- Build: `pnpm build`
- macOS release: `pnpm release:mac`
- Windows release: `pnpm release:win`

## Repo layout

- `src/main` — Electron main process
- `src/preload` — context bridge layer
- `src/renderer` — React renderer / screens
- `src/shared` — shared types / i18n
- `sign/` — code signing and notarization scripts

## Notes

This README now includes the latest app image.
