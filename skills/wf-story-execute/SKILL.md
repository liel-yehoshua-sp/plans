---
name: wf-story-execute
description: >
  Orchestrator for executing all tasks in a story using subagents. It runs tasks one by one
  (or concurrently if parallelizable). Use when the user says wf-story-execute,
  story execute, or wants to run all tasks for a story.
---

# Story Execute (`wf-story-execute`)

The orchestrator for executing an entire Story. It runs the implementation tasks by delegating to `wf-task-execute` subagents.

## Hard Constraints
- **CLI Only**: Do not edit markdown files directly. You MUST use the `cd ~/dev/slpt/plan && npm run plan --` commands via the Shell tool.
- **No Git**: Do not perform any git operations in this skill. Branching, committing, and pushing must be handled outside this skill.

## Portfolio: execution order and active epic

If the user does not name a story, use **`wf-epic-plan`** / **`wf-status`** context: epics are ordered by **execution order**, and **`cd ~/dev/slpt/plan && npm run plan -- epic active`** names the team focus epic when set.

## Steps

Complete **in order**:

### 1. Identify Target Story
You must be provided a `<STORY-ID>`. If not, ask the user.
Run `cd ~/dev/slpt/plan && npm run plan -- task list <STORY-ID>` to see all pending and in-progress tasks.
If there are no tasks, or all tasks are `done`, inform the user that the story is complete.

### 2. Execution Loop
For each remaining task that is not `done`:

- Check if the task is grouped for parallel execution (look for `[Parallel: Group A]` in the title or description).
- **If parallelizable**: 
  - Launch multiple `wf-task-execute` subagents simultaneously for all tasks in that same group using the `Task` tool (up to 4 concurrent agents). 
  - Wait for all subagents in the group to return success.
- **If not parallelizable**:
  - Launch a single `wf-task-execute` subagent for the next pending task.
  - Wait for it to complete.

### 3. Verify
Continue the loop until `cd ~/dev/slpt/plan && npm run plan -- task list <STORY-ID>` shows all tasks are `done`.
If a subagent fails or reports an issue, stop execution and alert the user.

## Next Steps
At the end of your response, you MUST provide a copy-and-paste block to the user.
If this story was executed as part of `wf-epic-execute`, return control back to the epic orchestrator. Otherwise, present this:

```text
STORY-001 execution is complete.

Please run `/wf-epic-execute <EPIC-ID>` to continue with the next story in the epic.
```