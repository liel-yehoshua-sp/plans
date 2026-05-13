---
name: wf-resolve-pr-reviews
description: >
  Handle PR review comments with GitHub CLI: fetch unresolved PR review threads (GraphQL +
  REST), validate each comment independently, write a timestamped markdown REPORT under
  epics/<epic-id>/pr/, aggregate a conflict-free execution plan, execute fixes automatically
  (except when contradictory plans require a human decision), reply on GitHub per comment, and
  resolve each inline thread after replying so the next run skips it. Use when the user says
  wf-resolve-pr-reviews, /wf-resolve-pr-reviews, or when addressing PR review feedback, triaging
  review threads, or merging reviewer requests without conflicting parallel edits.
---

# `wf-resolve-pr-reviews` (resolve PR reviews)

Handle PR review comments by analyzing each independently, then aggregating into a single conflict-free fix plan.

**Why aggregate instead of fix-per-comment:** Parallel fixes cause file conflicts and contradictory edits. Always plan separately → merge → execute once.

**Deliverable every run:** One **report file** per invocation (not a generic “plan doc” elsewhere). See [Report file](#step-5--write-the-report-mandatory).

**Execution:** After the report is written, **apply all “Fix in PR” changes** in [Step 6](#step-6--execute-code-automatically) without waiting for user approval. **Exception:** contradictory plans for the same code region → **do not** execute those; document in the report and **stop** to ask the user (see Step 4).

## Prerequisites

- When work also touches **`.plan`** / **`cd ~/dev/slpt/plan && npm run plan --`**, respect epic **execution order** (`cd ~/dev/slpt/plan && npm run plan -- epic list`) and the **active** epic (`cd ~/dev/slpt/plan && npm run plan -- epic active`) — same rules as **`wf-status`**.
- `gh` CLI authenticated and in a git repo with an open PR
- Run scripts from the repo root using the paths below (or pass absolute paths to `bash`)
- **Epic folder** for the report: `epics/<epic-id>/` must be known or resolved (see [Step 0](#step-0--resolve-epic-id-and-report-path))

## Step 0 — Resolve epic id and report path

The report is written to:

`epics/<epic-id>/pr/PR_COMMENTS_FIX_<UTC_TIME>_REPORT.md`

**`<UTC_TIME>`** — filename-safe UTC timestamp, e.g. `date -u +%Y%m%dT%H%M%SZ` → `20260410T143022Z`.

**Resolve `<epic-id>` in this order:**

1. User states it in the message (e.g. “epic: workflow-refactoring”).
2. Branch name matches an existing folder under `epics/<name>/` — **confirm** with the user before using it.
3. Otherwise **stop and ask**: which epic folder should hold this report?

If `epics/<epic-id>/pr/` does not exist, **create** it when writing the report.

If there is **no** suitable epic yet (e.g. PR is unrelated to tracked epics), **stop and ask** whether to create a new epic folder later via **`wf-init`** or use a **temporary path** — do not guess `epic-id`.

## Steps

### Step 1 — Fetch unresolved review threads

**One shot** (GraphQL threads + REST inline comments; **only unresolved** inline threads):

```bash
bash .cursor/skills/workflow/wf-resolve-pr-reviews/scripts/fetch-review-comments.sh [PR_NUMBER]
```

**Optional:** include top-level `/pulls/{pr}/reviews` bodies (not a resolvable thread — no `resolveReviewThread`):

```bash
bash .cursor/skills/workflow/wf-resolve-pr-reviews/scripts/fetch-review-comments.sh [PR_NUMBER] --include-review-bodies
```

- If `PR_NUMBER` is omitted, it auto-detects from the current branch.
- Output: JSON array of items that still need triage. **Inline** rows include **`thread_id`** (GraphQL `PullRequestReviewThread` id) and **`resolve_after_reply: true`** when resolution after reply is supported.
- **Default:** only **unresolved** inline review threads. Resolved threads are omitted so the next bulk run matches “what is still open.”
- Each item includes **`html_url`** when the GitHub API provides it (use this as the comment URL in the report).
- Non-review comments (issue comments, bot noise, approvals without body) are already excluded.

If the output is empty → still complete [Step 5](#step-5--write-the-report-mandatory) with a **short** report stating **no unresolved review threads** (nothing left to address via this flow), then stop before code execution. **Skip [Step 8](#step-8--reply-on-github-mandatory)** unless the user asked for a generic PR timeline comment.

### Step 2 — (Legacy) Mark resolved on raw JSON

Only if you are **not** using the default fetch (e.g. pasted REST-only JSON). Pipe through:

```bash
bash .cursor/skills/workflow/wf-resolve-pr-reviews/scripts/check-resolved-threads.sh PR_NUMBER
```

The default `fetch-review-comments.sh` already returns **unresolved-only** inline threads; you do **not** need this step for normal runs.

### Step 3 — Validate and plan each comment (independently)

For **each** remaining comment, do the following **in isolation** (do not let one comment's analysis influence another):

#### 3a. Validate relevance

Check if the comment is actionable and valid:

- ✅ **Valid**: Points to a real bug, style violation, missing test, performance issue, security concern, or design improvement with a clear ask.
- 🔴 **Invalid** — flag in the report and skip planning. Common invalid cases:
  - Comment references code that no longer exists (stale diff)
  - Comment is a question with no action requested
  - Comment is subjective preference with no project-convention backing
  - Comment contradicts another reviewer's comment (flag both in the report; see Step 4 — **do not** auto-execute conflicting fixes)
  - Comment is about code outside the PR's scope

#### 3b. Decide: fix in this PR, skip, or defer to epic

- **Fix in this PR** — small, localized change; add a **Plan** subsection in the report (see [Report structure](#report-structure)).
- **Skip** — invalid or rejected with rationale in the report.
- **Defer (large / out of scope)** — valid but too large for this PR; **do not** silently drop it. In the report:
  - Explain why it should not be done in this PR.
  - Link **[How to initialize an Epic from a PR comment](references/initialize-epic-from-pr-comment.md)**.
  - If epic id / goal is unclear, **stop and ask the user** before claiming the epic will be created.

#### 3c. Create a fix plan for comments marked “fix in this PR”

For each such comment, capture:

```
Comment: #<id> by @<author> on `<path>:<line>`
Summary: <one-line summary of what's requested>
Files affected: <list of files that need changes>
Plan:
  1. <specific action>
  2. <specific action>
  ...
Risk: low | medium | high
```

Key rules:

- Read the **actual file content** and the **diff hunk** before planning — don't guess.
- If the comment references a pattern used elsewhere, check those locations too.
- Note any **dependencies** between this fix and other files.

### Step 4 — Aggregate into a single execution plan

Combine all individual plans from Step 3c into one execution plan:

1. **Group by file** — all changes to the same file go together.
2. **Deduplicate** — if two comments request the same change, merge them (cite both comment IDs).
3. **Detect conflicts** — if two plans contradict each other for the same code region:
   - Present both in the report with a ⚠️ note
   - **Do not** auto-execute fixes for that region (or either contradictory comment) until the user resolves the conflict in a follow-up; execute **non-conflicting** fixes normally
4. **Order by priority**:
   - 🔴 Breaking / correctness bugs first
   - 🟡 Logic / security / performance
   - 🟢 Style / readability / naming last
5. **Order by dependency** — if fix A must happen before fix B, note it.

Include the aggregated plan in the **report file** (see below) and briefly in chat.

### Step 5 — Write the report (mandatory)

**Every invocation** of this handler produces **exactly one** new file:

`epics/<epic-id>/pr/PR_COMMENTS_FIX_<UTC_TIME>_REPORT.md`

- **One bulk fetch** = one report file (may cover **many** comments).
- This file is a **report** (analysis + decisions + optional fix plans), not a substitute for **`epic.md`**.

#### Report structure

Use this structure (adjust headings only if needed for empty runs):

```markdown
# PR review comments report

**PR:** #<number> — <title>  
**PR URL:** <html_url of PR or `gh pr view --web`>  
**Report generated (UTC):** <ISO-8601>  
**Report file:** `epics/<epic-id>/pr/PR_COMMENTS_FIX_<UTC_TIME>_REPORT.md`  
**Epic folder:** `epics/<epic-id>/`

## TL;DR

- N unresolved threads/items from fetch; K to fix / skip / defer-to-epic.
- One line per comment id: decision + outcome.

---

## Comment: <github username> — <short label>

- **REST id:** `<id>` (for scripts and `in_reply_to`)
- **thread_id:** from JSON when present (GraphQL id for `resolveReviewThread` after reply)
- **URL:** <html_url from JSON, or `https://github.com/<owner>/<repo>/pull/<pr>#discussion_r<id>` for inline if missing>
- **Type:** `inline_review` | `review`
- **File / line:** `<path>:<line>` or “(review summary)” for review-only bodies

### Original comment

> <verbatim or fenced; preserve meaning>

### Decision

**Fix in PR** | **Skip** | **Defer to epic**

### Reasoning

<Why this decision — same text you will use for the GitHub reply body (may shorten slightly for posting).>

### Plan (only if Fix in PR)

1. …
2. …

### Epic follow-up (only if Defer to epic)

From `epics/<epic-id>/pr/<this-file>.md`, link to the skill reference with **four** parent segments to the repo root, then `.cursor/...`:

`../../../../.cursor/skills/workflow/wf-resolve-pr-reviews/references/initialize-epic-from-pr-comment.md`

[How to initialize an Epic from a PR comment](../../../../.cursor/skills/workflow/wf-resolve-pr-reviews/references/initialize-epic-from-pr-comment.md)

<What to capture in epic / open questions for the user>

---

## Aggregated execution plan (Fix in PR only)

### file: `<path>`
From comments: #…
1. …

---

⚠️ Conflicts requiring user decision: …

**Metrics:** 🔴 Invalid skipped: N — threads from fetch were unresolved-only (resolved after reply when `thread_id` was used)
```

After writing the file, tell the user the **absolute or repo-relative path** and paste the **TL;DR** section in chat.

### Step 6 — Execute code (automatically)

**Without waiting for user approval**, apply every change in the aggregated plan that is marked **Fix in PR** and is **not** blocked by a ⚠️ contradiction in Step 4.

1. Apply changes **file by file** in the priority order from Step 4.
2. After each file, verify the change does not break anything obvious (syntax, imports).
3. If a fix fails (tests, build, or unclear edit), **stop**, record the error in the report’s **Execution log** (or append a **## Execution errors** section), and **do not** claim success in [Step 8](#step-8--reply-on-github-mandatory).

**Skip / Defer to epic** items: do **not** change product code for those in this step; the report and GitHub reply carry the rationale.

**Nothing to fix** (empty fetch, all skipped, or all defer): skip this step except for any report updates you already wrote.

### Step 7 — Update the report after execution (if you fixed code)

If you applied fixes in Step 6, append a **## Execution log** section to the **same** report file (same invocation): date, files touched, and one line per comment id that was addressed. Do **not** replace the original sections. If execution was partial (conflicts or errors), state what ran and what did not.

### Step 8 — Reply on GitHub (mandatory) and resolve inline threads

For **each** comment row in the report (excluding empty-fetch runs where you already stopped):

1. Build the reply body from **Reasoning** plus **Plan / outcome**:
   - If **Fix in PR** and code was applied: summarize what changed (files or behavior).
   - If **Skip**: explain briefly.
   - If **Defer to epic**: point to [initialize-epic-from-pr-comment](references/initialize-epic-from-pr-comment.md) and next steps; offer **`wf-init`** when the user is ready.
2. Post using the helper (body in a temp file to preserve Markdown and newlines). For **`inline_review`**, pass **`thread_id`** from the fetch JSON when present so the script resolves the thread after posting (next bulk fetch omits it).

```bash
# Inline — pass GraphQL thread id as 5th arg when JSON includes thread_id
bash .cursor/skills/workflow/wf-resolve-pr-reviews/scripts/post-pr-comment-reply.sh \
  <PR_NUMBER> inline_review <COMMENT_ID> /path/to/body.md [<THREAD_ID>]

# Top-level review body (type review) — no thread resolve (omit THREAD_ID)
bash .cursor/skills/workflow/wf-resolve-pr-reviews/scripts/post-pr-comment-reply.sh \
  <PR_NUMBER> review <COMMENT_ID> /path/to/body.md
```

Use **`inline_review`** when the fetch JSON has `"type": "inline_review"`. Use **`review`** when `"type": "review"` (posts a PR timeline comment via `gh pr comment`). If **`thread_id`** is null (orphan thread mapping), post without the 5th arg — the thread will **not** auto-resolve; note that in the report.

**Error handling:** If `gh` fails on the reply, capture stderr and do not claim success. If the reply succeeds but **`resolveReviewThread`** fails, record the error in the report (the reply is already on GitHub).

## References

- [Comment classification examples](references/comment-classification.md)
- [Conflict resolution patterns](references/conflict-resolution.md)
- [How to initialize an Epic from a PR comment](references/initialize-epic-from-pr-comment.md)
