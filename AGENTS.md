# CS2 Bot Assistant Community — Agent Guide

## Quick start

```bash
npm install
npm run dev:web       # Vite dev server (http://localhost:5173)
npm run dev:desktop   # Tauri desktop debug (starts Vite + Rust backend)
npm run verify        # workspace:check → typecheck → lint → test → build:web
```

## Non‑obvious commands

| Command | What it does |
|---|---|
| `npm run typecheck` | `vue-tsc --build --force` (incremental, project references) |
| `npm run lint` | oxlint then eslint (both must pass — two parallel lint systems) |
| `npm run lint:oxlint` | Fast Rust‑based linter only |
| `npm run lint:eslint` | `eslint . --cache` |
| `npm run workspace:check` | Validates project registration before builds |
| `npm run commands:fetch` | Fetches CS2 console variables from upstream |
| `npm run commands:build` | Builds the in‑app command library |
| `npm run build:desktop` | `tauri build --no-bundle` (exe only, no installer) |
| `npm run bundle:desktop` | `tauri build` (full NSIS installer) |

## Architecture

- `src/` — Vue 3 rendering layer (Pinia, vue-router, vue-i18n)
- `src-tauri/` — Tauri 2 / Rust desktop backend
- `src/services/tauri/` — **only** frontend entry for Tauri `invoke` calls. Views must never call Tauri APIs directly.
- `src/features/` — domain feature groups by business area
- `src/views/` — page compositions only; no system logic
- `config/workspace/projects.json` — canonical project registry
- `@/` maps to `./src/` (configured in `vite.config.ts` and `tsconfig.app.json`)

Tauri service functions all have `isTauriRuntime()` guards — they provide web‑preview fallbacks when `__TAURI_INTERNALS__` is absent, so `dev:web` works without the Rust backend.

## Views (routes)

| Route | View | Purpose |
|---|---|---|
| `/` | DashboardView | Navigation hub + CS2 status |
| `/quick-control` | QuickControlView | One-click mode/difficulty/aim/nades |
| `/inventory` | InventoryView | Inventory simulator gateway |
| `/commands` | CommandsView | Command library + team presets |
| `/config` | ConfigView | Nade recovery, demo commands |
| `/guide` | GuideView | Install/uninstall + diagnostics |
| `/plugins` | PluginsView | CounterStrikeSharp plugin toggles |
| `/match-history` | MatchHistoryView | Match stats and HLTV rating |
| `/news` | NewsView | HLTV news feed + match schedules |
| `/settings` | SettingsView | Theme, language, autostart |
| `/release-notes` | ReleaseNotesView | Changelog |

## Testing

- Vitest + jsdom. Setup in `vitest.setup.ts` (Pinia, vue-i18n, component stubs for RouterLink/Transition/TransitionGroup).
- Test files in `tests/` and `src/**/__tests__/`.
- All Tauri service calls are mocked with `vi.mock('@/services/tauri/*')`.
- Use `resetSoftwareUpdateStateForTest()` to clear update modal state between tests.

## Lint → typecheck → test order

`npm run verify` runs in this exact order: workspace:check → typecheck → lint → test → build:web. When iterating, prefer `typecheck` before `test` since vue-tsc catches type errors that vitest alone would miss.

## Version / config quirks

- **Version bumps in Rust**: Only change `version` in `src-tauri/Cargo.toml`. Let Cargo maintain `Cargo.lock` — never bulk‑replace version strings (incident history in Cargo.toml comment).
- **Tauri config variants**: `tauri.conf.json` (default), `tauri.prod.json` (updater artifacts), `tauri.webview2-fixed.json`, `tauri.webview2-offline.json`. Merge via build scripts.
- **Environment**: `.env` files per project. Template at `.env.example`, project‑specific at `.env.projects.<id>`. Env vars defined in `env.d.ts`.
- **News feed**: `VITE_NEWS_FEED_URL` env var (optional); when empty the news view shows no data.

## Style conventions

- UTF‑8, LF line endings, 2‑space indent, 100‑char max line length (`.editorconfig`).
- Plain CSS (no Tailwind/SCSS), theme via CSS custom properties (`--color-accent`, `--app-bg`).
- Vue `<script setup lang="ts">`. Locale: zh‑CN default, en‑US available.
- `@vue/tsconfig/tsconfig.dom.json` base with `noUncheckedIndexedAccess` enabled.
