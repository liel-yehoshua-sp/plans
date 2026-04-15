import { describe, expect, it, vi, afterEach } from 'vitest';
import { PlanWorkspace } from '@plans/store';
import { register } from '../status.js';
import { createTestProgram, exitNoop, exitThrows } from './fixtures/cli-test-harness.js';
import { makeEpic, makeProgress, makeStory } from './fixtures/plan-entity-factories.js';

describe('plan status', () => {
  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('prints guidance when workspace has no epics', async () => {
    exitNoop();
    const log = vi.spyOn(console, 'log').mockImplementation(() => {});

    vi.spyOn(PlanWorkspace, 'load').mockReturnValue({
      listEpics: () => [],
      getActiveEpicId: () => null,
    } as unknown as PlanWorkspace);

    const program = createTestProgram();
    register(program);
    await program.parseAsync(['node', 'test', 'status']);

    expect(log).toHaveBeenCalledWith(expect.stringContaining('Empty workspace'));
    log.mockRestore();
  });

  it('prints epics, stories, and progress when data exists', async () => {
    exitNoop();
    const log = vi.spyOn(console, 'log').mockImplementation(() => {});

    const epic = makeEpic({ id: 'E1', title: 'E' });
    const story = makeStory({ id: 'S1', epicId: 'E1', title: 'S' });

    vi.spyOn(PlanWorkspace, 'load').mockReturnValue({
      listEpics: () => [epic],
      listStories: () => [story],
      getEpicProgress: () => makeProgress(),
      getStoryProgress: () => makeProgress({ totalTasks: 1, doneTasks: 0, totalSteps: 0, doneSteps: 0 }),
      getActiveEpicId: () => null,
    } as unknown as PlanWorkspace);

    const program = createTestProgram();
    register(program);
    await program.parseAsync(['node', 'test', 'status']);

    const joined = log.mock.calls.map((c) => c.join(' ')).join('\n');
    expect(joined).toContain('E1');
    expect(joined).toContain('S1');
    log.mockRestore();
  });

  it('exits when PlanWorkspace.load throws', async () => {
    exitThrows(1);
    vi.spyOn(PlanWorkspace, 'load').mockImplementation(() => {
      throw new Error('no .plan');
    });

    const program = createTestProgram();
    register(program);

    await expect(program.parseAsync(['node', 'test', 'status'])).rejects.toThrow('process.exit:1');
  });
});
