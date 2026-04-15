import { describe, expect, it, vi } from 'vitest';
import type { Epic } from '@plan/store';
import {
  error,
  formatEpic,
  formatProgress,
  formatStory,
  formatTask,
  formatTaskDetail,
  info,
  success,
} from '../../formatters/terminal.js';
import { makeStory, makeTask } from './fixtures/plan-entity-factories.js';

describe('terminal formatters', () => {
  it('formatEpic includes execution order, id, title, and status badge', () => {
    const epic: Epic = {
      id: 'EPIC-1',
      slug: 'hello',
      title: 'Hello',
      status: 'draft',
      executionOrder: 2,
      description: '',
      createdAt: '2020-01-01',
      updatedAt: '2020-01-02',
    };
    const line = formatEpic(epic);
    expect(line).toContain('#2');
    expect(line).toContain('EPIC-1');
    expect(line).toContain('Hello');
    expect(line).toContain('[draft]');
  });

  it('formatEpic marks active epic when context matches', () => {
    const epic: Epic = {
      id: 'EPIC-1',
      slug: 'hello',
      title: 'Hello',
      status: 'draft',
      executionOrder: 1,
      description: '',
      createdAt: '2020-01-01',
      updatedAt: '2020-01-02',
    };
    const line = formatEpic(epic, { activeEpicId: 'EPIC-1' });
    expect(line).toContain('[active]');
  });

  it('formatProgress includes percent and counts', () => {
    const line = formatProgress('Epic progress', {
      totalTasks: 4,
      doneTasks: 2,
      totalSteps: 10,
      doneSteps: 5,
    });
    expect(line).toContain('Epic progress');
    expect(line).toContain('50%');
    expect(line).toContain('2/4');
    expect(line).toContain('5/10');
  });

  it('formatProgress handles zero tasks', () => {
    const line = formatProgress('Empty', {
      totalTasks: 0,
      doneTasks: 0,
      totalSteps: 0,
      doneSteps: 0,
    });
    expect(line).toContain('0%');
  });

  it('formatStory includes assignee, branch, and progress', () => {
    const line = formatStory(
      makeStory({
        assignee: 'dev',
        branch: 'feature/x',
      }),
      { totalTasks: 2, doneTasks: 1, totalSteps: 3, doneSteps: 1 },
    );
    expect(line).toContain('STORY-1');
    expect(line).toContain('@dev');
    expect(line).toContain('feature/x');
    expect(line).toContain('1/2');
    expect(line).toContain('1/3');
  });

  it('formatTask includes step progress', () => {
    const line = formatTask(
      makeTask({
        steps: [
          { text: 'a', done: true },
          { text: 'b', done: false },
        ],
      }),
    );
    expect(line).toContain('TASK-1');
    expect(line).toContain('1/2 steps');
  });

  it('formatTaskDetail includes steps and notes', () => {
    const block = formatTaskDetail(
      makeTask({
        steps: [{ text: 'Do', done: false }],
        notes: 'Extra',
      }),
    );
    expect(block).toContain('TASK-1');
    expect(block).toContain('Do');
    expect(block).toContain('Notes:');
    expect(block).toContain('Extra');
  });

  it('success, error, and info write to console', () => {
    const log = vi.spyOn(console, 'log').mockImplementation(() => {});
    const err = vi.spyOn(console, 'error').mockImplementation(() => {});

    success('ok');
    error('bad');
    info('note');

    expect(log).toHaveBeenCalledWith(expect.stringContaining('ok'));
    expect(err).toHaveBeenCalledWith(expect.stringContaining('bad'));
    expect(log).toHaveBeenCalledWith(expect.stringContaining('note'));

    log.mockRestore();
    err.mockRestore();
  });
});
