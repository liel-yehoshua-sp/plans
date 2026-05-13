---
name: wf-task-execute
description: >
  Execute a specific task. Writes the code, runs tests, and completes the task via the plan CLI. 
  Use when the user says wf-task-execute, task execute, or wants to run a single task.
---

# Task Execute (`wf-task-execute`)

The worker bee. Takes a single task (e.g., `STORY-001/TASK-001`), reads its specification, writes the code, verifies the changes, and uses **`plan`** (`@das-portal/plan-cli`) to update its status.

## Hard Constraints
- **CLI Only**: Do not edit the task markdown files directly. You MUST use the `cd ~/dev/slpt/plan && npm run plan --` commands via the Shell tool.
- **No Git**: Do not perform any git operations in this skill. Branching, committing, and pushing must be handled outside this skill.

## Portfolio: execution order and active epic

Epic **execution order** and **`cd ~/dev/slpt/plan && npm run plan -- epic active`** matter for portfolio reporting (`/wf-status`), not for task ids. Use them when you need the team’s current epic without asking the user.

## Steps

Complete **in order**:

### 1. Identify Target Task
You must be provided a specific task identifier (e.g., `STORY-001/TASK-001`). If not, ask the user.
Use `cd ~/dev/slpt/plan && npm run plan -- task show <STORY-ID>/<TASK-ID>` to read the task details and its steps.

### 2. Begin Execution
Mark the task as in-progress by running:
`cd ~/dev/slpt/plan && npm run plan -- task set-status <STORY-ID>/<TASK-ID> in-progress`

### 3. Implement
- Write the application code to fulfill the task requirements.
- Add or fix any tests related to this new functionality.
- You should execute tests using the appropriate CLI commands (e.g., `npm run test`) to verify your implementation.
- Refuse to declare the implementation complete until tests pass and build succeeds.

### 4. Mark Done
When the implementation is finished and verified, mark the task as complete by running:
`cd ~/dev/slpt/plan && npm run plan -- task done <STORY-ID>/<TASK-ID>`

## Next Steps
At the end of your response, you MUST provide a copy-and-paste block to the user so they can continue to the next step.
If this task was executed as part of `wf-story-execute`, return the status back to the orchestrator. Otherwise, present this to the user:

```text
Task <STORY-ID>/<TASK-ID> is complete and verified.

Please run `/wf-story-execute <STORY-ID>` to continue with the next task in the story.
```