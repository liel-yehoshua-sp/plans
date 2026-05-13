---

## name: wf-epic-execute
description: >
  Orchestrator for executing all stories in an epic sequentially using subagents.
  Use when the user says wf-epic-execute, epic execute, or wants to run all stories in an epic.

# Epic Execute (`wf-epic-execute`)

The master orchestrator. Finds the first incomplete Story in the Epic, and runs `wf-story-execute` on it. Loops until the Epic is fully implemented.

## Hard Constraints

- **CLI Only**: Do not edit markdown files directly. You MUST use the `cd ~/dev/slpt/plan && npm run plan --` commands via the Shell tool.
- **No Git**: Do not perform any git operations in this skill. Branching, committing, and pushing must be handled outside this skill.

## Portfolio: execution order and active epic

Epics have **execution order** (portfolio sort) and an optional **active epic**. See `**wf-status`** / `cd ~/dev/slpt/plan && npm run plan -- epic list` for ordering. Set focus with `cd ~/dev/slpt/plan && npm run plan -- epic set-active <epic-id>`.

## Steps

Complete **in order**:

### 1. Identify Target Epic

Resolve `<EPIC-ID>` in this order:

1. If the user provided `<EPIC-ID>`, use it.
2. Otherwise run `cd ~/dev/slpt/plan && npm run plan -- epic active`:
  - If stdout is a single epic id (not the “No active epic set.” message), use that as `<EPIC-ID>`.
  - If there is no active epic, **stop** and ask the user for an epic id, or ask them to run `cd ~/dev/slpt/plan && npm run plan -- epic set-active <epic-id>` first.

Run `cd ~/dev/slpt/plan && npm run plan -- story list --epic <EPIC-ID>` to see all pending, in-progress, and done stories for the Epic.
If there are no stories, inform the user to run `/wf-epic-plan` first.

### 2. Execution Loop

For each remaining story that is not `done`, executed sequentially (never in parallel):

- Launch a single `wf-story-execute` subagent for the next pending story.
- Wait for it to complete. 
- If a subagent fails or reports an issue, stop execution and alert the user.
- Run `cd ~/dev/slpt/plan && npm run plan -- story list --epic <EPIC-ID>` again to refresh the status.

### 3. Verify

Continue the loop until all stories under the Epic are `done`.

## Next Steps

At the end of your response, you MUST provide a copy-and-paste block to the user.

```text
EPIC-001 execution is complete.

Please run `/wf-status` to review the portfolio status.
```

