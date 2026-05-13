---
name: wf-story-plan
description: >
  Brainstorm about the story's tasks and creates them using the plan CLI. 
  Use when the user says wf-story-plan, story plan, or wants to plan the tasks for a story.
---

# Story Plan (`wf-story-plan`)

Takes a specific Story, brainstorms the exact implementation steps (Tasks), and creates them using **`plan`** (`@das-portal/plan-cli`).

## Hard Constraints
- **CLI Only**: Do not edit markdown files directly. You MUST use the `cd ~/dev/slpt/plan && npm run plan --` commands via the Shell tool.
- **No Git**: Do not perform any git operations in this skill.

## Portfolio: execution order and active epic

When choosing a story’s parent epic, prefer the **active epic** (`cd ~/dev/slpt/plan && npm run plan -- epic active`) or the epic list order from `cd ~/dev/slpt/plan && npm run plan -- epic list` (execution order). See **`wf-status`** for the full portfolio rules.

## Steps

Complete **in order**:

### 1. Identify Target Story (Guard)
If the user did not provide a `<STORY-ID>`, run `cd ~/dev/slpt/plan && npm run plan -- story list` (optionally `--epic` after resolving the epic as above) and ask them which story they want to plan.
Run `cd ~/dev/slpt/plan && npm run plan -- story show <STORY-ID>` to see if it is already planned. If its status is `done`, refuse to plan it.

### 2. Brainstorm Tasks
Delegate to the **`wf-brainstorm`** skill by reading its rules.
Using the `wf-brainstorm` guidelines:
- Read the Story's description, parent Epic, and repository context.
- Discuss with the user to figure out the exact implementation tasks for the story.
- **Parallelism**: As part of your design, you must determine which tasks can be executed concurrently without conflict. 
  - If multiple tasks can be safely run in parallel, explicitly add a note to their proposed titles like `[Parallel: Group A]`.
- Present the final sequence of tasks and wait for user approval.

### 3. Create Tasks
Once the user approves the brainstormed tasks, use the plan CLI to create them:
Run `cd ~/dev/slpt/plan && npm run plan -- task add <STORY-ID> "<Task Title>" --steps "<step 1>" "<step 2>" ...` for each approved task.

If a task is parallelizable, make sure its title or description reflects the `[Parallel: Group A]` grouping, so that `wf-story-execute` knows it can run those tasks concurrently.

## Next Steps
At the end of your response, you MUST provide a copy-and-paste block to the user so they can continue to the next step.

```text
Tasks created for STORY-001.

Please run `/wf-story-execute <STORY-ID>` to begin execution.
```