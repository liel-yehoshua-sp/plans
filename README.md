# plans

File-backed **`.plan/`** portfolios: **`@plans/store`**, **`plan`** CLI, and a local read-only **viewer**.

## Setup

```bash
cd ~/dev/slpt/plans
npm install
npm run build
```

## CLI

From this repository root:

```bash
npm run plan -- epic list
npm run plan -- status
```

Or after build: `node ./packages/cli/dist/index.js …`

## Viewer

```bash
PLAN_CWD=/path/to/repo-with-dot-plan npm run plan:viewer
# http://127.0.0.1:3847
```

## Tests

```bash
npm test
```
