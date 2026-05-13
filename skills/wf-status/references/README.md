# `wf-status` and `epic.md`

`wf-status` discovers epic markdown the same way as the repo walker: active epics under **`epics/<epic-id>/epic.md`** and archived epics under **`epics/archive/<epic-id>/epic.md`** (nested `epic-id` segments are supported). It uses `summarizePlanMarkdownForStatus` from **`packages/epics`** (`plan-markdown.ts`). No separate input/output template is required beyond the canonical **`epic.md`** shape in **`wf-plan/references/epic-output.template.md`**.
