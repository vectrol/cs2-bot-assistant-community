# Product Outline

## Goal

AI PC Fac is a desktop workspace host for AI-assisted product execution. The first version focuses on managing multiple desktop projects in parallel with isolated runtime state, visible project registries, task orchestration, runtime diagnostics, and configurable release channels.

## Initial Scope

- Dashboard with runtime status, active channel, and verification entry points
- Project registry with isolated roots, dist paths, bundle paths, and log paths
- Task queue view for planned AI work items
- Logs view for local development and build diagnostics
- Settings view for environment-driven configuration
- Tauri command bridge for app metadata and desktop runtime status

## Non-Goals

- Heavy media editing
- 3D rendering workloads
- Background daemon orchestration beyond the local desktop app
