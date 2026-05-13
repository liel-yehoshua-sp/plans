# Conflict Resolution Patterns

## Types of conflicts during plan aggregation

### 1. Same-region edits (most common)

Two comments target the same lines of code with different changes.

**Detection:** Compare `path` + `line` range. If two plans modify overlapping line ranges in the same file, flag as conflict.

**Resolution:** Present both to the user. Common patterns:

- One subsumes the other (e.g., "rename variable" + "refactor entire function that contains it") → do the bigger one
- They're complementary (e.g., "add null check" + "add type annotation" on same line) → do both
- They're contradictory → user must pick

### 2. Semantic conflicts

Changes in different files that are logically incompatible.

**Detection:** Check if two plans modify the same function signature, API contract, type definition, or shared state from different comments.

**Example:** Comment A says "make this function async" in `utils.ts`, Comment B says "call this function synchronously" in `handler.ts`.

**Resolution:** Always flag these. They require understanding the broader intent.

### 3. Ordering dependencies

Fix A must be applied before Fix B.

**Detection:**

- Fix B references a symbol/import that Fix A creates
- Fix B modifies code that Fix A is moving/renaming
- Fix A changes a type definition that Fix B's code depends on

**Resolution:** Automatically order A before B in the plan. Note the dependency explicitly.

### 4. Duplicate requests

Two reviewers flag the same issue independently.

**Detection:** Same file + overlapping lines + semantically equivalent request (use judgment).

**Resolution:** Merge into one plan item, cite both comment IDs. No user action needed.

## Presentation format for conflicts

```
⚠️ CONFLICT: Comments #12 and #45 on `src/api/handler.ts:30-35`

  #12 (@alice): "Extract this into a helper function"
  #45 (@bob):   "Inline this logic, the abstraction isn't worth it"

  These are contradictory. Which approach do you prefer?
  → [Extract to helper] [Inline the logic] [Skip both]
```
