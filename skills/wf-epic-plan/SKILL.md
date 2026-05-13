---
name: wf-epic-plan
description: >
  Brainstorm about the epic's stories and creates them using the plan CLI.
  Use when the user says wf-epic-plan, epic plan, or wants to plan the stories for an epic.
---

# Epic Plan (`wf-epic-plan`)

Takes a specific Epic, brainstorms the architectural design to break it down into Stories, and creates those Stories using **`plan`** (`@das-portal/plan-cli`).

## Hard Constraints
- **CLI Only**: Do not edit markdown files directly. You MUST use the `cd ~/dev/slpt/plan && npm run plan --` commands via the Shell tool.
- **No Git**: Do not perform any git operations in this skill.

## Portfolio: execution order and active epic

`cd ~/dev/slpt/plan && npm run plan -- epic list` shows epics in **execution order**; the **active** epic is labeled `[active]`. Resolve an ambiguous target with `cd ~/dev/slpt/plan && npm run plan -- epic active`. Reorder with `cd ~/dev/slpt/plan && npm run plan -- epic set-order <epic-id> <n>`.

## Steps

Complete **in order**:

### 1. Identify Target Epic (Guard)
If the user did not provide an `<EPIC-ID>`, run `cd ~/dev/slpt/plan && npm run plan -- epic active`; if that returns an id, confirm with the user or use it. Otherwise run `cd ~/dev/slpt/plan && npm run plan -- epic list` (already sorted by execution order) and ask which epic they want to plan.
Run `cd ~/dev/slpt/plan && npm run plan -- epic show <EPIC-ID>` to see if it is already planned. If its status is `done`, refuse to plan it.

### 2. Brainstorm Stories
Delegate to the **`wf-brainstorm`** skill by reading its rules.
Using the `wf-brainstorm` guidelines:
- Read the Epic description and repository context.
- Discuss with the user to figure out the best way to break this Epic down into independent "Stories".
- Present the final design of the Stories and wait for user approval.

### 3. Create Stories
Once the user approves the brainstormed stories, use the plan CLI to create them:
Run `cd ~/dev/slpt/plan && npm run plan -- story create <EPIC-ID> "<Story Title>"` for each approved story.

## Next Steps
At the end of your response, you MUST provide a copy-and-paste block to the user so they can continue to the next step.

```text
Stories created for EPIC-001.

Please run `/wf-story-plan <STORY-ID>` to plan the tasks for the first story.
```