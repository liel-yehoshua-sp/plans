---
name: wf-update
description: >
  Apply a change, convention, or requirement across all wf-* workflow skills (and optionally related
  workflow skills). Understands the request, dispatches one subagent per skill for conflict detection
  and editing, and reports a summary. Use when the user says wf-update, update epic skills,
  change all flow skills, add a convention to epic workflows, or wants to modify behavior across the
  wf-* skill family.
---

# Workflow update (`wf-update`)

Orchestrates a **cross-cutting change** across the `wf-*` skill family and optionally related workflow skills. Ensures consistency: every affected skill is read, checked for conflicts, and updated — or the user is alerted before any edit.

## When to use

- The user wants to **add, modify, or remove** a convention, constraint, section, or behavior that applies to **multiple** `wf-*` skills.
- Examples: "all epic skills should require a confirmation before editing plan files", "add a new step to every flow skill", "rename the Ship and close task everywhere", "remove legacy dual-read references".

## Target skills

### Primary (always checked)

All `wf-*` skills under `.cursor/skills/workflow/`:

| Skill | Path |
|-------|------|
| wf-brainstorm | `.cursor/skills/workflow/wf-brainstorm/SKILL.md` |
| wf-epic-create | `.cursor/skills/workflow/wf-epic-create/SKILL.md` |
| wf-epic-plan | `.cursor/skills/workflow/wf-epic-plan/SKILL.md` |
| wf-epic-execute | `.cursor/skills/workflow/wf-epic-execute/SKILL.md` |
| wf-story-plan | `.cursor/skills/workflow/wf-story-plan/SKILL.md` |
| wf-story-execute | `.cursor/skills/workflow/wf-story-execute/SKILL.md` |
| wf-task-execute | `.cursor/skills/workflow/wf-task-execute/SKILL.md` |
| wf-status | `.cursor/skills/workflow/wf-status/SKILL.md` |
| wf-plan-ux-review | `.cursor/skills/workflow/wf-plan-ux-review/SKILL.md` |
| wf-resolve-pr-reviews | `.cursor/skills/workflow/wf-resolve-pr-reviews/SKILL.md` |
| wf-update | `.cursor/skills/workflow/wf-update/SKILL.md` |

### Extended (checked when the change could affect them)

Related Superpowers plugin skills that the `wf-*` family may delegate to. Only include these when the change touches shared behavior (e.g. plan format, checkbox rules, worktree conventions):

- `brainstorming`
- `writing-plans`
- `subagent-driven-development`
- `using-git-worktrees`
- `verification-before-completion`
- `finishing-a-development-branch`

Extended skills are **read-only targets** by default — the agent flags needed changes but does not edit plugin-managed skills unless the user explicitly confirms.

## Steps

### 1. Understand the change request

1. Read the user's request carefully. Identify:
   - **What** is changing (new constraint, renamed concept, added step, removed section, behavioral rule, etc.).
   - **Scope**: does it affect all wf-* skills or only a subset?
   - **Extended impact**: could it affect the delegated Superpowers skills listed above?
2. If the request is ambiguous or underspecified, use `AskQuestion` to clarify before proceeding. Typical clarifications:
   - "Should this apply to all wf-* skills or only [subset]?"
   - "Does this override existing behavior X, or should it coexist?"
   - "Should I also update the related Superpowers skills (brainstorming, writing-plans, etc.)?"
3. Summarize the change back to the user in **one short paragraph** and wait for confirmation before dispatching subagents.

### 2. Dispatch subagents (parallel)

Launch one **`generalPurpose` subagent per skill** (respect the project's max-4-concurrent-agents rule — batch in waves if more than 4 skills need updates).

Each subagent receives this prompt template (fill in the placeholders):

```text
You are updating a Cursor agent skill file.

## Change request
{user_change_description}

## Skill file
Path: {skill_path}

## Instructions
1. Read the skill file at the path above.
2. Understand its purpose, structure, and constraints.
3. Determine whether the change request **conflicts** with existing content:
   - A conflict means the change **contradicts** an existing rule, breaks a delegation contract
     with another skill, or creates an ambiguous/duplicate instruction.
   - If a section already covers the same topic but says something different, that is a conflict.
4. If there is a **conflict**:
   - Do NOT edit the file.
   - Return a structured report:
     ```
     CONFLICT DETECTED
     Skill: {skill_name}
     Section: <section heading where the conflict lives>
     Existing rule: <quote the conflicting text>
     Proposed change: <what would be added/modified>
     Reason: <why these conflict>
     ```
5. If there is **no conflict**:
   - Apply the change to the skill file. Preserve the existing structure, tone, and formatting.
   - Place the new content in the most logical location within the file.
   - Do not add redundant sections or duplicate existing content.
   - Return:
     ```
     CHANGE APPLIED
     Skill: {skill_name}
     What changed: <one-line summary>
     Location: <section heading where the change was placed>
     ```
```

For **extended skills** (plugin-managed), change the instructions to **read-only conflict check** — report what would need to change but do not edit.

### 3. Collect and report results

After all subagents complete:

1. **Group results** into three categories:
   - **Applied**: skills that were updated successfully.
   - **Conflicts**: skills where a conflict was detected (not edited).
   - **Extended skill flags**: read-only notes for plugin-managed skills.

2. **Present a summary table** to the user:

   ```
   | Skill | Status | Detail |
   |-------|--------|--------|
   | wf-epic-create | Applied | Added X to Hard constraints |
   | wf-epic-execute | Conflict | Contradicts existing rule in execution loop |
   | writing-plans | Flag (plugin) | Would need update to section Y |
   ```

3. For each **conflict**, show the structured report so the user can decide how to resolve it.

### 4. Resolve conflicts (if any)

For each conflict:

1. Present the conflict details and ask the user how to proceed:
   - **Override**: replace the existing rule with the new one.
   - **Merge**: combine both rules (agent proposes merged text).
   - **Skip**: leave this skill unchanged.
2. Apply the user's choice. If overriding or merging, edit the skill file directly.

### 5. Verify consistency

After all edits are applied:

1. Briefly scan the updated skills for **cross-skill consistency** — e.g. if skill A says "`epic.md` must have frontmatter field X" and skill B creates **`epic.md`**, does B mention field X?
2. Flag any remaining inconsistencies to the user.

## Constraints

- **Never silently override** an existing rule. If the change contradicts something, it is a conflict — report it.
- **Preserve skill structure**: do not reorganize sections, rename headings, or change formatting beyond what the change requires.
- **One change at a time**: if the user asks for multiple unrelated changes, process them sequentially (run steps 1–5 for each change) to avoid cross-contamination.
- **Skill line budget**: after editing, each SKILL.md should remain under ~500 lines. If adding content would exceed this, suggest splitting into a reference file.

## Next Steps

After completion, tell the user:
*"All wf-* skills have been updated. Review the summary above — use `/wf-update` again for additional changes."*
