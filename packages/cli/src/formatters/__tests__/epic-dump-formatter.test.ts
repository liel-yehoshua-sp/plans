import { describe, expect, it } from 'vitest';
import type { PlanWorkspace } from '@plan/store';
import { renderEpicDump } from '../epic-dump.js';
import { makeEpic, makeStory, makeTask } from '../../commands/__tests__/fixtures/plan-entity-factories.js';

function makeDumpWorkspace(overrides: Partial<PlanWorkspace> = {}): PlanWorkspace {
  const epic = makeEpic({ id: 'E1', title: 'Epic', description: '**Bold** intro' });
  const story = makeStory({
    id: 'S1',
    epicId: 'E1',
    title: 'Story',
    body: 'Hello',
 });
  const task = makeTask({
    id: 'T1',
    storyId: 'S1',
    title: 'Task',
    steps: [{ text: 'Step', done: true }],
    notes: 'Note line',
  });

  return {
    getEpic: () => epic,
    listStories: () => [story],
    listTasks: () => [task],
    getActiveEpicId: () => null,
    ...overrides,
  } as unknown as PlanWorkspace;
}

describe('renderEpicDump', () => {
  it('emits markdown when markdown: true', () => {
    const ws = makeDumpWorkspace();
    const out = renderEpicDump(ws, 'E1', { markdown: true });
    expect(out).toContain('# Epic:');
    expect(out).toContain('**Execution order:**');
    expect(out).toContain('**Bold** intro');
    expect(out).toContain('## Story:');
    expect(out).toContain('#### T1:');
    expect(out).toContain('[x]');
    expect(out).toContain('Note line');
  });

  it('emits terminal-oriented output by default', () => {
    const ws = makeDumpWorkspace();
    const out = renderEpicDump(ws, 'E1');
    expect(out).toContain('E1');
    expect(out).toContain('Epic');
    expect(out).toContain('S1');
    expect(out).toContain('T1');
  });

  it('handles epic with no stories in markdown', () => {
    const epic = makeEpic({ id: 'E2', description: '' });
    const ws = {
      getEpic: () => epic,
      listStories: () => [],
      getActiveEpicId: () => null,
    } as unknown as PlanWorkspace;

    const out = renderEpicDump(ws, 'E2', { markdown: true });
    expect(out).toContain('# Epic:');
    expect(out).toContain('_No epic body._');
  });
});
