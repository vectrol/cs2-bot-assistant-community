# Architecture Rules

## Layer Boundaries

- `src/` is the Vue rendering layer and owns UI, routing, state, and presentation logic.
- `src/services/tauri/` is the only frontend entry for desktop bridge calls.
- `src-tauri/src/commands/` exposes small, named commands to the frontend.
- `src-tauri/src/services/` contains system-facing Rust logic.

## Directory Protocol

- `src/features/` groups business features by domain.
- `src/components/` contains reusable UI pieces and layout primitives.
- `src/views/` only composes pages from features and shared services.
- `scripts/` contains repeatable automation helpers.
- `docs/` contains workflow, product, and release protocol.
- `config/workspace/projects.json` is the canonical project registry for multi-project isolation.
- `workspace/projects/<project-id>/` is the source root for an individual project.
- `workspace/runtime/<project-id>/` stores only build output, bundles, and logs for that project.

## Multi-Project Isolation

- Every project must have a unique `id`.
- Every project must have unique `rootDir`, `distDir`, `bundleDir`, and `logDir`.
- Source trees and runtime output trees must never overlap.
- Shared host code can live in the root shell, but project-specific assets and build state must stay inside the registered project paths.
- Run `npm run workspace:check` before builds and releases.

## Change Protocol

- Prefer the smallest possible edit set.
- Do not call Tauri APIs directly inside views.
- Do not mix filesystem or process logic into the Vue layer.
- Route all release-channel differences through `.env.*` or `src-tauri/tauri.*.json`.
