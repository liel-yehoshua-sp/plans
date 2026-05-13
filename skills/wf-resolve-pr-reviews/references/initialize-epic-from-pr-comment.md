# How to initialize an Epic from a PR comment

Use this when a review comment asks for work that is **too large** to fold into the current PR (new feature area, cross-cutting refactor, or multi-file redesign that should be **skipped** in this PR and tracked separately).

## When to use

- The change would **blow up the PR scope** or **block merge** for a long time.
- The comment is **valid** but **not** a quick fix; you prefer a **dedicated epic** (design + checklist) instead of a drive-by in the same branch.

## When to stop and ask the user

- **Epic id** (kebab-case folder name under `epics/<epic-id>/`) is unclear.
- The **goal** is ambiguous or conflicts with an existing epic in `epics/`.
- **Ownership** or **priority** (must do now vs later) is unclear.

Do **not** invent a new epic id without confirming with the user.

## Steps (follow `wf-init`)

1. **Confirm** the user wants a **new epic** (or an existing epic) **instead of** a PR fix in this branch.
2. **Invoke** the **`wf-init`** workflow skill (see `.cursor/skills/workflow/wf-init/SKILL.md`).
3. **Inventory** `epics/` and **exclude** the top-level `archive` directory when listing active epic ids (see `AGENTS.md` — Superpowers epic folders).
4. **Create or update** `epics/<epic-id>/epic.md` with **`## Design`** only; **no** product implementation until the design is approved.
5. Optionally **link back** to the PR in the epic `## Design` (PR number and review comment URL) so reviewers can trace the origin.

## After the epic exists

- Use **`wf-plan`** when the user wants a checkbox **Implementation plan** in the same `epic.md`.
- Do **not** skip **`wf-init`** and write an ad hoc plan in another file — the repo’s SSOT is **`epic.md`** per epic folder.

## References

- [AGENTS.md](../../../../../AGENTS.md) — epic folders, `epic.md`, archive path
- [wf-init skill](../../workflow/wf-init/SKILL.md) — epic init workflow
