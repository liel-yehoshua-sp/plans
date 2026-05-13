# Comment Classification Examples

## ✅ Valid — actionable review comments

| Comment | Why valid |
|---------|-----------|
| "This function doesn't handle the null case on line 42" | Clear bug, specific location |
| "Missing await here — this will silently drop errors" | Correctness issue with clear fix |
| "Per our style guide, use camelCase for local variables" | Convention-backed style request |
| "This query is N+1, should batch-fetch instead" | Performance issue with suggested approach |
| "Add a test for the empty-array edge case" | Missing test coverage, specific |
| "This secret should come from env vars, not hardcoded" | Security concern, clear action |

## 🔴 Invalid — skip with reason

| Comment | Why invalid | Reason to show user |
|---------|-------------|---------------------|
| "What does this function do?" | Question, no action requested | No action requested — just a question |
| "I would have done this differently" | Subjective, no specific ask | Subjective preference with no convention backing |
| "This whole module should be rewritten" | Out of PR scope | Scope exceeds this PR — suggest a follow-up issue |
| "Nit: I prefer tabs over spaces" | Preference not backed by project config | No project convention enforces this |
| Comment on a line that was deleted in a later commit | Stale reference | References code that no longer exists in the PR |
| "LGTM" / "Looks good" / emoji-only | Not a review request | No action requested |
| Bot-generated comment (CI status, coverage report) | Automated, not a human review | Automated bot comment — not a review |

## ⚠️ Edge cases — ask user

| Comment | Why ambiguous |
|---------|---------------|
| Reviewer A says "use async/await", Reviewer B says "use .then() chains" | Contradictory reviews |
| "Consider adding caching here" | Valid suggestion but scope is unclear — is it blocking? |
| Comment from a non-maintainer on a protected file | May lack authority for that file |
