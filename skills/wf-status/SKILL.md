---
name: wf-status
description: >
  Epic portfolio status: aggregate progress across Epics and Stories using the plan CLI.
  Use when the user says wf-status, epic status, or all epics progress.
---

# Epic Status (`wf-status`)

Produces a **portfolio view** of all Epics, Stories, and Tasks by using **`plan`** (`@das-portal/plan-cli`).

## Portfolio: execution order and active epic

The `.plan` workspace stores each epic’s **execution order** (integer) and an optional **active epic** (team focus). **`cd ~/dev/slpt/plan && npm run plan -- epic list`** and **`cd ~/dev/slpt/plan && npm run plan -- status`** return epics **sorted by execution order** (ascending), then id. The active epic is shown with an **`[active]`** marker when set.

- **Reorder**: `cd ~/dev/slpt/plan && npm run plan -- epic set-order <epic-id> <n>` (lower `n` appears earlier).
- **Active pointer**: `cd ~/dev/slpt/plan && npm run plan -- epic set-active <epic-id>` · clear: `cd ~/dev/slpt/plan && npm run plan -- epic clear-active` · print id only: `cd ~/dev/slpt/plan && npm run plan -- epic active`.
- New epics append `max(executionOrder)+1` automatically.

## Hard Constraints
- **CLI Only**: Do not edit or read markdown files directly for progress calculations. You MUST use the `cd ~/dev/slpt/plan && npm run plan --` commands via the Shell tool.
- **No Git**: Do not perform any git operations in this skill unless specifically requested by the user.

## Steps

Complete **in order**:

### 1. Retrieve Epic Status
Run `cd ~/dev/slpt/plan && npm run plan -- epic list` or `cd ~/dev/slpt/plan && npm run plan -- status` using the Shell tool. **Treat the CLI order as the canonical execution order** — do not re-sort epics yourself.
If the CLI provides `plan status`, prefer it for the dashboard-style layout.

### 2. Retrieve Story Status (Optional Drill-down)
If the user asks for a specific Epic, run `cd ~/dev/slpt/plan && npm run plan -- epic show <EPIC-ID>` and `cd ~/dev/slpt/plan && npm run plan -- story list --epic <EPIC-ID>` to provide a detailed drill-down into the stories and their progress.

### 3. Build the Report
Format the output from the CLI into a clean, human-readable markdown status report. Include:
- A high-level summary of active Epics **in execution order** (same sequence the CLI printed).
- Which epic is **active**, if any (from `[active]` or `epic active`).
- Completion progress (if provided by the CLI).
- The next logical step (e.g., the first incomplete epic in execution order, or the active epic if it is still in progress).

## Next Steps
At the end of your response, you MUST explicitly tell the user the next step available. For example:

```text
If you want to continue execution on the top-priority epic, run:
`/wf-epic-execute <EPIC-ID>`
```