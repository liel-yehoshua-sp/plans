# @plan/store

File-backed `.plan/` workspace: epics, stories, tasks (`PlanWorkspace`, parsers, state machine).

## Layout

| Path | Role |
|------|------|
| **`src/store.ts`** | Public barrel — import **`@plan/store`** |
| **`src/workspace.ts`**, **`src/core/`**, **`src/models/`**, **`src/parsers/`**, **`src/utils/`** | Store implementation |

## Build

```bash
npm run build -w @plan/store
```

## Tests

```bash
npm run test -w @plan/store
```
