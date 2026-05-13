---

## name: wf-brainstorm

description: "You MUST use this before any creative work - designing epics, stories, or tasks. Explores user intent, requirements and design before implementation."

# Brainstorming Ideas Into Designs (`wf-brainstorm`)

Help turn ideas into fully formed designs and specs through natural collaborative dialogue. This skill is typically delegated to by other workflow skills (like `wf-epic-plan` and `wf-story-plan`) to handle the collaborative design phase.

Do NOT invoke any CLI commands to create Stories or Tasks, write any code, scaffold any project, or take any implementation action until you have presented a design and the user has approved it. This applies to EVERY project regardless of perceived simplicity.

## Anti-Pattern: "This Is Too Simple To Need A Design"

Every project goes through this process. A single-function utility, a config change — all of them. "Simple" projects are where unexamined assumptions cause the most wasted work. The design can be short (a few sentences for truly simple projects), but you MUST present it and get approval.

## Checklist

You MUST create a task (or tasks) for each of these items and complete them in order:

1. **Explore project context** — (using sub agents) check files, docs, recent commits, and (when planning work) `plan status` / `plan epic list` so you respect **execution order** and the **active** epic (`plan epic active`).
2. **Ask clarifying questions** — understand purpose/constraints/success criteria (Try to use a tool like "AskQuestion" if you have any) - You can ask as much as questions you need.
3. **Propose 2-3 approaches** — with trade-offs and your recommendation
4. **Present design** — in sections scaled to their complexity, get user approval after each section
5. **Spec self-review** — quick inline check for placeholders, contradictions, ambiguity, scope
6. **User reviews the final design** — ask user to review the finalized design before proceeding
7. **Transition back** — return the finalized design back to the delegating skill (e.g. `wf-epic-plan` or `wf-story-plan`) so it can execute the CLI commands.

## The Process

**Understanding the idea:**

- Check out the current project state first (files, docs, recent commits)
- Before asking detailed questions, assess scope. If it's too large, help the user decompose it.
- Ask questions one at a time to refine the idea
- Prefer multiple choice questions when possible, but open-ended is fine too
- Focus on understanding: purpose, constraints, success criteria

**Exploring approaches:**

- Propose 2-3 different approaches with trade-offs
- Present options conversationally with your recommendation and reasoning
- Lead with your recommended option and explain why

**Presenting the design:**

- Once you believe you understand what you're building, present the design
- Scale each section to its complexity: a few sentences if straightforward, up to 200-300 words if nuanced
- Ask after each section whether it looks right so far
- Cover: architecture, components, data flow, error handling, testing
- Be ready to go back and clarify if something doesn't make sense

## After the Design

**Spec Self-Review:**
After proposing the final design, look at it with fresh eyes:

1. **Placeholder scan:** Any "TBD", "TODO", incomplete sections, or vague requirements? Fix them.
2. **Internal consistency:** Do any sections contradict each other?
3. **Ambiguity check:** Could any requirement be interpreted two different ways? If so, pick one and make it explicit.

**User Review Gate:**
After the spec review loop passes, ask the user to review the final design before proceeding:

> "The design is complete. Please review it and let me know if you want to make any changes before we proceed."

Wait for the user's response. If they request changes, make them and re-run the spec review loop. Only proceed once the user approves.

## Key Principles

- **One question at a time** - Don't overwhelm with multiple questions
- **Multiple choice preferred** - Easier to answer than open-ended when possible
- **YAGNI ruthlessly** - Remove unnecessary features from all designs
- **Explore alternatives** - Always propose 2-3 approaches before settling
- **Incremental validation** - Present design, get approval before moving on
- **Be flexible** - Go back and clarify when something doesn't make sense

