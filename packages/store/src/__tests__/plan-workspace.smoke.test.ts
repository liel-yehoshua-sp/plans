import { describe, expect, it, beforeEach, afterEach } from 'vitest';
import * as fs from 'node:fs';
import * as path from 'node:path';
import { fileURLToPath } from 'node:url';
import { PlanWorkspace } from '../workspace.js';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const TMP_ROOT = path.resolve(__dirname, '../../../../.tmp-test');

describe('@plan/store', () => {
  let tmpDir: string;

  beforeEach(() => {
    fs.mkdirSync(TMP_ROOT, { recursive: true });
    tmpDir = fs.mkdtempSync(path.join(TMP_ROOT, 'plan-store-smoke-'));
  });

  afterEach(() => {
    fs.rmSync(tmpDir, { recursive: true, force: true });
  });

  it('initializes a workspace and round-trips an epic', () => {
    const plan = PlanWorkspace.init(tmpDir);
    const epic = plan.createEpic({ id: 'epic-smoke', title: 'Smoke epic' });
    expect(epic.id).toBe('epic-smoke');
    expect(epic.slug).toBe('smoke-epic');
    expect(epic.executionOrder).toBe(1);

    const loaded = PlanWorkspace.load(tmpDir);
    expect(loaded.getEpic('epic-smoke').title).toBe('Smoke epic');
    expect(loaded.getEpic('epic-smoke').executionOrder).toBe(1);
  });

  it('lists epics by execution order then id', () => {
    const plan = PlanWorkspace.init(tmpDir);
    plan.createEpic({ id: 'b', title: 'B' });
    plan.createEpic({ id: 'a', title: 'A' });
    plan.setEpicExecutionOrder('a', 1);
    plan.setEpicExecutionOrder('b', 2);
    expect(plan.listEpics().map(e => e.id)).toEqual(['a', 'b']);
  });

  it('defaults executionOrder when frontmatter omits it', () => {
    PlanWorkspace.init(tmpDir);
    const legacyDir = path.join(tmpDir, '.plan', 'epics', 'legacy');
    fs.mkdirSync(legacyDir, { recursive: true });
    const legacy = `---
id: legacy
title: Legacy
status: draft
createdAt: 2020-01-01T00:00:00.000Z
updatedAt: 2020-01-01T00:00:00.000Z
---

Body
`;
    fs.writeFileSync(path.join(legacyDir, 'EPIC.md'), legacy, 'utf-8');
    const loaded = PlanWorkspace.load(tmpDir);
    expect(loaded.getEpic('legacy').executionOrder).toBe(1_000_000);
  });

  it('clears active epic when that epic is deleted', () => {
    const plan = PlanWorkspace.init(tmpDir);
    plan.createEpic({ id: 'gone', title: 'G' });
    plan.setActiveEpic('gone');
    plan.deleteEpic('gone');
    expect(plan.getActiveEpicId()).toBe(null);
  });

  it('deleteEpic removes epic folder and nested stories', () => {
    const plan = PlanWorkspace.init(tmpDir);
    plan.createEpic({ id: 'to-delete', title: 'Gone' });
    const s1 = plan.createStory('to-delete', { title: 'S one' });
    plan.addTask(s1.id, { title: 'T' });
    const epicFolder = path.join(tmpDir, '.plan', 'epics', 'gone');
    expect(fs.existsSync(path.join(epicFolder, 'EPIC.md'))).toBe(true);
    const storyPath = path.join(epicFolder, 'stories', 's-one.md');
    expect(fs.existsSync(storyPath)).toBe(true);

    const { deletedStoryIds } = plan.deleteEpic('to-delete');
    expect(deletedStoryIds).toEqual([s1.id]);
    expect(fs.existsSync(epicFolder)).toBe(false);

    const reloaded = PlanWorkspace.load(tmpDir);
    expect(() => reloaded.getEpic('to-delete')).toThrow();
  });
});
