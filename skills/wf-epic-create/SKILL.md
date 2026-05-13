---

## name: wf-epic-create
description: >
  Initialize and create a new epic using the plan CLI. Use when the user says wf-epic-create,
  epic create, or wants to start a new epic.

# Epic Create (`wf-epic-create`)

Initializes a new Epic using `**plan**` (`@das-portal/plan-cli`). This is the first step in the planning workflow.

## Hard Constraints

- **CLI Only**: Do not edit markdown files directly. You MUST use the `cd ~/dev/slpt/plan && npm run plan --` commands via the Shell tool.
- **No Git**: Do not perform any git operations in this skill.

## Steps

Complete **in order**:

### 1. Understand Goal

Read the user's prompt. If the goal or title of the Epic is unclear, ask clarifying questions before proceeding.

### 2. Check for Duplicates (Guard)

Run `cd ~/dev/slpt/plan && npm run plan -- epic list` using the Shell tool to see existing Epics.
If an Epic with a similar scope or title already exists, STOP and ask the user if they want to update that existing Epic instead of creating a new one.

### 3. Create the Epic

Run the following CLI command to create the Epic, providing an `<id>` (kebab-case) and the title:
`cd ~/dev/slpt/plan && npm run plan -- epic create <id> "<title>"`
Record the `<id>` you chose.

**Execution order:** New epics are appended automatically (`max+1`). If this epic should appear earlier in `/wf-status`, run `cd ~/dev/slpt/plan && npm run plan -- epic set-order <id> <n>` (lower `n` sorts first). To mark the team’s current focus, run `cd ~/dev/slpt/plan && npm run plan -- epic set-active <id>` when appropriate.

## Next Steps

At the end of your response, you MUST provide a copy-and-paste block to the user so they can continue to the next step in a new chat.

```text
Epic <id> created.

Please run `/wf-epic-plan <id>` to brainstorm and break this down into stories.
```

