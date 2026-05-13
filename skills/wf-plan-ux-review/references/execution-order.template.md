# Execution order block (for `epic.md`)

Paste under **`## Implementation plan`** after the goal/architecture/tech stack intro (team choice: before or after the **Testing** section; stay consistent per epic).

**Legend**

- **`&`** — tasks that may run **in parallel** (separate files or low coupling).
- **`→`** — **finish left before starting right** (dependency or safe merge order).
- **Lane** — an independent chain; different lanes can advance at the same time until a **merge hot spot** file forces coordination.

```markdown
### Execution order and parallelization

**Legend:** **`&`** = parallelizable. **`→`** = must complete in sequence. **Lanes** run independently until a **merge hot spot** (called out below).

| Lane | Sequence |
|------|----------|
| **0 · Testing** | Testing Steps 1–*n* run **throughout** (`&` all implementation lanes). |
| **A** | *e.g.* 15 → 16 |
| **B** | *e.g.* 18 → 19 (Step 2 only, after modal behavior lands) |
| **C** | *e.g.* 1 → 19 (Steps 1 & 3) |
| **P** | *e.g.* 3 & 4 & 5 & 6 & 7 & 8 & 9 & 11 & 12 & 13 & 17 & 20 & 22 & 23 & 24 |
| **H** | *e.g.* 2 & 10 & 14 & 21 — **one PR recommended** if all touch the same page file |
| **Z** | 25 & 26 — polish / optional |
| **Ω** | **Ship and close** — **strictly last** |

**Merge hot spots:** *List paths where parallel lanes conflict (e.g. `DevEpicsPage.tsx`, `useDevEpicPlans.ts`, `EpicPlanMarkdownModal.tsx`).*

**Notes:** *e.g. Task 27 after Task 10 if scroll restoration keys off query params. Task 21 Step 4 coordinates with Task 25.*
```

Replace placeholder task numbers with this epic’s real task ids.
