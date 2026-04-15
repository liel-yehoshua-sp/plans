import * as fs from 'node:fs';
import * as os from 'node:os';
import * as path from 'node:path';
import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { readStory } from '../../models/story.js';
import { readEpic } from '../../models/epic.js';
import { runLegacyLayoutMigration } from '../legacy-layout.js';

function write(p: string, content: string): void {
  fs.mkdirSync(path.dirname(p), { recursive: true });
  fs.writeFileSync(p, content, 'utf-8');
}

describe('runLegacyLayoutMigration', () => {
  let tmp: string;
  let planDir: string;

  beforeEach(() => {
    tmp = fs.mkdtempSync(path.join(os.tmpdir(), 'plan-migrate-'));
    planDir = path.join(tmp, '.plan');
    fs.mkdirSync(planDir, { recursive: true });
    write(
      path.join(planDir, 'config.yaml'),
      `directory: .plan\nidPrefix:\n  epic: EPIC\n  story: STORY\n  task: TASK\nbranchPattern: "{epicId}/{storyId}-{slug}"\n`,
    );
  });

  afterEach(() => {
    fs.rmSync(tmp, { recursive: true, force: true });
  });

  it('migrates flat epic and story with task files into nested layout', () => {
    write(
      path.join(planDir, 'epics', 'acme.md'),
      `---
id: acme
title: Acme epic
status: active
executionOrder: 10
createdAt: '2026-01-01T00:00:00.000Z'
updatedAt: '2026-01-02T00:00:00.000Z'
---

## Design

Hello epic.
`,
    );

    write(
      path.join(planDir, 'stories', 'STORY-001', 'spec.md'),
      `---
id: STORY-001
epicId: acme
title: First story
status: draft
branch: acme/story-001-first
createdAt: '2026-01-03T00:00:00.000Z'
updatedAt: '2026-01-04T00:00:00.000Z'
---

## Design

Story body.
`,
    );

    write(
      path.join(planDir, 'stories', 'STORY-001', 'tasks', 'TASK-001.md'),
      `---
id: TASK-001
storyId: STORY-001
title: Do the thing
status: pending
order: 1
createdAt: '2026-01-05T00:00:00.000Z'
updatedAt: '2026-01-06T00:00:00.000Z'
---

## Steps
- [ ] Step one
- [x] Step two
`,
    );

    const result = runLegacyLayoutMigration({ planDir, deleteLegacy: true });
    expect(result.epicsMigrated).toEqual(['acme']);
    expect(result.storiesMigrated).toEqual(['STORY-001']);
    expect(fs.existsSync(path.join(planDir, 'epics', 'acme.md'))).toBe(false);
    expect(fs.existsSync(path.join(planDir, 'stories', 'STORY-001'))).toBe(false);

    const epic = readEpic(path.join(planDir, 'epics', 'acme', 'EPIC.md'));
    expect(epic.slug).toBe('acme');
    expect(epic.title).toBe('Acme epic');
    expect(epic.description).toContain('Hello epic.');

    const story = readStory(path.join(planDir, 'epics', 'acme', 'stories', 'STORY-001.md'));
    expect(story.tasks).toHaveLength(1);
    expect(story.tasks[0].steps).toEqual([
      { done: false, text: 'Step one' },
      { done: true, text: 'Step two' },
    ]);
  });

  it('respects --epic-id filter', () => {
    write(
      path.join(planDir, 'epics', 'a.md'),
      `---
id: a
title: A
status: draft
executionOrder: 1
createdAt: '2026-01-01T00:00:00.000Z'
updatedAt: '2026-01-01T00:00:00.000Z'
---
`,
    );
    write(
      path.join(planDir, 'epics', 'b.md'),
      `---
id: b
title: B
status: draft
executionOrder: 2
createdAt: '2026-01-01T00:00:00.000Z'
updatedAt: '2026-01-01T00:00:00.000Z'
---
`,
    );
    write(
      path.join(planDir, 'stories', 'STORY-A', 'spec.md'),
      `---
id: STORY-A
epicId: a
title: SA
status: draft
branch: a/x
createdAt: '2026-01-01T00:00:00.000Z'
updatedAt: '2026-01-01T00:00:00.000Z'
---
`,
    );
    write(
      path.join(planDir, 'stories', 'STORY-B', 'spec.md'),
      `---
id: STORY-B
epicId: b
title: SB
status: draft
branch: b/x
createdAt: '2026-01-01T00:00:00.000Z'
updatedAt: '2026-01-01T00:00:00.000Z'
---
`,
    );

    const result = runLegacyLayoutMigration({ planDir, epicIdFilter: 'a', deleteLegacy: true });
    expect(result.epicsMigrated).toEqual(['a']);
    expect(result.storiesMigrated).toEqual(['STORY-A']);
    expect(fs.existsSync(path.join(planDir, 'epics', 'a.md'))).toBe(false);
    expect(fs.existsSync(path.join(planDir, 'epics', 'b.md'))).toBe(true);
    expect(fs.existsSync(path.join(planDir, 'stories', 'STORY-B'))).toBe(true);
  });
});
