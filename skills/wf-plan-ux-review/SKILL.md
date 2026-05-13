---
name: wf-plan-ux-review
description: >
  Merge a full User Experience Expert review (eleven uxr-review-* lens passes) into an epic
  implementation plan in epics/<epic-id>/epic.md, following wf-plan structure (TDD block,
  tasks, Ship and close, execution order). Use when the user says wf-plan-ux-review, plan from UX
  review, or wants wf-plan plus user-experience-expert for the same scope.
---

# Epic plan from UX review (`wf-plan-ux-review`)

**Repo-native** workflow: combines **`wf-plan`** output shape with **`.cursor/agents/user-experience-expert.md`** orchestration. Produces **`## Implementation plan`** in **`epics/<epic-id>/epic.md`** with **Testing** first, **checkbox tasks**, **Ship and close** last, frontmatter **`state: ready`**, plus an **Execution order and parallelization** subsection.

## Skill vs agent

| Artifact | Use when |
| --- | --- |
| **This skill (`wf-plan-ux-review`)** | You want a **repeatable procedure** (invoke by name, steps, constraints, where output goes). Fits the **`wf-*`** family under `.cursor/skills/workflow/`. |
| **`user-experience-expert` agent** | Defines **orchestrator behavior in primary chat** (eleven lenses, merge rules). It is **not** a substitute for this skill’s **epic.md checklist + execution-order** deliverable. |
| **Dedicated “merged” agent** | **Not recommended:** a second agent would duplicate the orchestrator role or tempt incorrect nested delegation (see user-experience-expert **Host placement**). |

**Name:** **`wf-plan-ux-review`** — short, **`wf-*` aligned**, and reads as “wf-plan enriched with UX review outputs.”

## Hard constraints

1. **Canonical file:** Only **`epics/<epic-id>/epic.md`** is edited for the plan (same as **`wf-plan`**).
2. **No application implementation** in this skill — checklist and design/frontmatter updates only unless the user explicitly switches to execution.
3. **UX orchestration:** Run **eleven `uxr-review-*` delegates** in batches of **4, then 4, then 3** from the **primary** conversation with **one shared evidence packet** — per **`user-experience-expert.md`**. Do **not** delegate the **entire** workflow to a nested **`user-experience-expert`** Task.
4. **Plan shape:** Follow **`wf-plan`**: **Testing (TDD-oriented)** section **before** implementation tasks; final task **Ship and close** with **four** steps; **`state: ready`** when the plan is written.
5. **Execution order:** After tasks are listed, add **`### Execution order and parallelization`** using the template in [`references/execution-order.template.md`](references/execution-order.template.md).

## Prerequisites

- **`## Design`** exists and is approved (from **`wf-init`** if new work).
- Target **`epics/<epic-id>/`** locked; **`epic.md`** is the single SSOT.
- Optional: align **`.plan`** portfolio context — **`cd ~/dev/slpt/plan && npm run plan -- epic list`** (execution order) and **`cd ~/dev/slpt/plan && npm run plan -- epic active`** — so UX work matches the epic the team is executing in the CLI plan store.

## Steps

Complete **in order**:

### 1. Lock epic and scope

Confirm **`<epic-id>`**, UI or feature paths, and that **`wf-init`** design is present (or run **`wf-init`** first).

### 2. Build one evidence packet

For **Review changes:** file paths, routes, and enough context for every lens (same snapshot for all delegates). For **Review plan:** the spec text or path.

### 3. Run all eleven UX lenses

From **this chat**, spawn **`uxr-review-*`** subagents (or delegates bound to each `.cursor/skills/uxr-*/SKILL.md`) in **three batches** (max **4** concurrent). Each delegate: full **`SKILL.md`**, **`references/checklist.md`**, **exact Output shape** from that skill.

Skill ids → paths (repo-relative):

- `uxr-accessibility-fundamentals` → `.cursor/skills/uxr-accessibility-fundamentals/SKILL.md`
- `uxr-copy-and-messaging` → `.cursor/skills/uxr-copy-and-messaging/SKILL.md`
- `uxr-data-and-state-persistence` → `.cursor/skills/uxr-data-and-state-persistence/SKILL.md`
- `uxr-interaction-and-input` → `.cursor/skills/uxr-interaction-and-input/SKILL.md`
- `uxr-layout-and-responsiveness` → `.cursor/skills/uxr-layout-and-responsiveness/SKILL.md`
- `uxr-loading-and-feedback` → `.cursor/skills/uxr-loading-and-feedback/SKILL.md`
- `uxr-navigation-and-flow` → `.cursor/skills/uxr-navigation-and-flow/SKILL.md`
- `uxr-notifications-and-interruptions` → `.cursor/skills/uxr-notifications-and-interruptions/SKILL.md`
- `uxr-onboarding-and-discoverability` → `.cursor/skills/uxr-onboarding-and-discoverability/SKILL.md`
- `uxr-performance-perception` → `.cursor/skills/uxr-performance-perception/SKILL.md`
- `uxr-visual-consistency` → `.cursor/skills/uxr-visual-consistency/SKILL.md`

### 4. Merge and dedupe

Produce **one** merged finding set: **critical → warning → suggestion**, skill tags, conflicts called out — per **`user-experience-expert.md` → Your merged report**. Map **one task per theme** (bundle only when fixes share files or are trivially coupled).

### 5. Write `epic.md` (**`wf-plan`** rules)

- **`## Implementation plan`:** scope blurb, goal, architecture, tech stack.
- **`### Testing (TDD-oriented)`** with `- [ ]` steps **before** implementation tasks.
- **`### Task N: …`** each with issue, files, `- [ ]` steps.
- **`### Task last: Ship and close`** — four steps (PR, merge, branch delete, worktree remove / N/A).
- Frontmatter **`state: ready`**.
- Cite **`uxr-*`** tags in tasks where helpful.

### 6. Add execution order

Insert **`### Execution order and parallelization`** (after tech stack / before **Testing**, or immediately after **Testing** — pick one per epic and stay consistent). Fill using [`references/execution-order.template.md`](references/execution-order.template.md): **lanes**, **`&` parallel**, **`→` sequential**, **merge hot spots**.

## Optional plugins

- **`writing-plans`:** If available, use it for task decomposition; still add **Testing**, **Ship and close**, and **Execution order**.

## Next step

After the plan is saved: use **`/wf-execute`** (or team equivalent) to implement task-by-task.
