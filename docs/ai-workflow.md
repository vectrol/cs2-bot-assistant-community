# AI Workflow

## Required Inputs

- `docs/product.md`
- `docs/architecture.md`
- `config/workspace/projects.json`
- current task description
- current terminal or build log when debugging

## Required Output Shape

Each AI change should report:

1. Problem location
2. Minimal file edits
3. Why the change is needed
4. Verification commands
5. Known risks or follow-up

## Hard Constraints

- No unrequested large-scale refactors
- No dependency additions without recording them in `package.json`
- No build-config edits without a verification run
- No cross-module rewrites when a local fix is sufficient
- No project path reuse across `rootDir`, `distDir`, `bundleDir`, or `logDir`
