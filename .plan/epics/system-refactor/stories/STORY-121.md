---

id: STORY-121
epicId: system-refactor
slug: STORY-121
title: "registry-remove-legacy-rows — Remove deprecated RegistryConfig paths: nugets, services, aiRegistries (loaders, schema, migrations)"
status: draft
branch: system-refactor/story-121-registry-remove-legacy-rows-remove-depre
createdAt: 2026-04-13T19:07:24.535Z
updatedAt: 2026-04-13T19:07:24.536Z
tasks:

- id: TASK-001
storyId: STORY-121
title: "Trace all reads of RegistryConfig.nugets, services, aiRegistries [Parallel: A]"
status: pending
order: 1
steps:
  - done: false
  text: Grep packages/core loader, folder-loader, schema, and packages/server consumers for optional static rows
  - done: false
  text: Note YAML fixtures and examples that still author these keys
  - done: false
  text: "Classify: discovery-only vs still-required merge behavior"
  notes: ""
  createdAt: 2026-04-13T19:13:22.764Z
  updatedAt: 2026-04-13T19:13:22.765Z
- id: TASK-002
storyId: STORY-121
title: "Schema + ajv: remove deprecated properties with version bump or strict mode toggle [Parallel: B]"
status: pending
order: 2
steps:
  - done: false
  text: Update packages/core/src/config/schema.ts to drop nugets, services, aiRegistries from required/optional as per deprecation policy
  - done: false
  text: Adjust validation tests expecting these keys in portal-registry.json fixtures
  - done: false
  text: Ensure invalid configs fail with actionable messages
  notes: ""
  createdAt: 2026-04-13T19:13:23.460Z
  updatedAt: 2026-04-13T19:13:23.461Z
- id: TASK-003
storyId: STORY-121
title: "Loader migration: stop merging legacy rows; map aiRegistries only from plugins/aik path"
status: pending
order: 3
steps:
  - done: false
  text: Remove or narrow backward-compat reads in loader.ts / folder-loader for the three fields
  - done: false
  text: Confirm AI registries flow from pluginConfigs.aik / plugins/aik/config.json per README
  - done: false
  text: Add tests proving old keys are ignored or rejected per chosen policy
  notes: ""
  createdAt: 2026-04-13T19:13:24.079Z
  updatedAt: 2026-04-13T19:13:24.080Z
- id: TASK-004
storyId: STORY-121
title: "Update RegistryConfig TypeScript: delete optional fields and @deprecated comments cleanup"
status: pending
order: 4
steps:
  - done: false
  text: Edit packages/core/src/types/registry.ts to remove nugets?, services?, aiRegistries?
  - done: false
  text: Fix downstream type errors in server, web, cli, and tests
  - done: false
  text: Run npm run build across workspaces
  notes: ""
  createdAt: 2026-04-13T19:13:24.719Z
  updatedAt: 2026-04-13T19:13:24.720Z
- id: TASK-005
storyId: STORY-121
title: "Refresh examples and test fixtures to Phase-10 folder-DB shape without legacy rows [Parallel: A]"
status: pending
order: 5
steps:
  - done: false
  text: Update examples/*.sample.json and server test temp registries to omit removed keys
  - done: false
  text: Add a minimal fixture showing nugets/services only via discovered.json if needed
  - done: false
  text: Search docs strings (AGENTS.md, README) for stale registry key references
  notes: ""
  createdAt: 2026-04-13T19:13:25.352Z
  updatedAt: 2026-04-13T19:13:25.353Z
- id: TASK-006
storyId: STORY-121
title: "Data-dir safety: optional CLI warning or one-shot migrate message for users with old portal-registry.json"
status: pending
order: 6
steps:
  - done: false
  text: If rejection is too breaking, implement load-time warning via existing diagnostics logger (no silent drop)
  - done: false
  text: "Document user action: move AI registries to plugins/aik/config.json"
  - done: false
  text: Cover with loader unit test using temp DAS_PORTAL_DATA_DIR
  notes: ""
  createdAt: 2026-04-13T19:13:25.963Z
  updatedAt: 2026-04-13T19:13:25.964Z
- id: TASK-007
storyId: STORY-121
title: "End-to-end regression: FullState still exposes nugets/services via discovery after registry cleanup [Parallel: C]"
status: pending
order: 7
steps:
  - done: false
  text: Run state.routes and workspace scanner integration tests
  - done: false
  text: Verify GET /api/state shape unchanged for clients relying on discovered slices
  - done: false
  text: Fix any regressions in web fixtures workspace-api-types
  notes: ""
  createdAt: 2026-04-13T19:13:26.611Z
  updatedAt: 2026-04-13T19:13:26.612Z

---

# registry-remove-legacy-rows — Remove deprecated RegistryConfig paths: nugets, services, aiRegistries (loaders, schema, migrations)

## Design

*Describe the design here.*