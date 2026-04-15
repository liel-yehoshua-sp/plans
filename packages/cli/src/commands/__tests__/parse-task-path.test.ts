import { describe, expect, it } from 'vitest';
import { parseTaskPath } from '../task/parse-task-path.js';

describe('parseTaskPath', () => {
  it('parses STORY-001/TASK-001', () => {
    expect(parseTaskPath('STORY-001/TASK-001')).toEqual({
      storyId: 'STORY-001',
      taskId: 'TASK-001',
    });
  });

  it('rejects a single segment', () => {
    expect(() => parseTaskPath('only-one')).toThrow(/Invalid task path/);
  });

  it('rejects more than two segments', () => {
    expect(() => parseTaskPath('a/b/c')).toThrow(/Invalid task path/);
  });

  it('rejects empty story id', () => {
    expect(() => parseTaskPath('/TASK-001')).toThrow(/Invalid task path/);
  });

  it('rejects empty task id', () => {
    expect(() => parseTaskPath('STORY-001/')).toThrow(/Invalid task path/);
  });

  it('rejects whitespace-only ids', () => {
    expect(() => parseTaskPath(' /TASK')).toThrow(/Invalid task path/);
  });
});
