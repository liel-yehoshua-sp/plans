import { describe, expect, it, vi, afterEach } from 'vitest';
import { PlanWorkspace } from '@plans/store';
import { register as registerEpic } from '../epic/register.js';
import { createTestProgram, exitNoop, exitThrows } from './fixtures/cli-test-harness.js';
import { makeEpic, makeStory } from './fixtures/plan-entity-factories.js';

describe('plan epic', () => {
  afterEach(() => {
    vi.restoreAllMocks();
  });

  describe('create', () => {
    it('creates epic with id and title', async () => {
      exitNoop();
      const createEpic = vi.fn().mockReturnValue(makeEpic({ id: 'e1', title: 'T' }));
      vi.spyOn(PlanWorkspace, 'load').mockReturnValue({ createEpic } as unknown as PlanWorkspace);

      const program = createTestProgram();
      registerEpic(program);
      await program.parseAsync(['node', 'test', 'epic', 'create', 'e1', 'T']);

      expect(createEpic).toHaveBeenCalledWith({ id: 'e1', title: 'T', description: undefined });
    });

    it('passes --description', async () => {
      exitNoop();
      const createEpic = vi.fn().mockReturnValue(makeEpic());
      vi.spyOn(PlanWorkspace, 'load').mockReturnValue({ createEpic } as unknown as PlanWorkspace);

      const program = createTestProgram();
      registerEpic(program);
      await program.parseAsync([
        'node',
        'test',
        'epic',
        'create',
        'e1',
        'T',
        '-d',
        'Long description',
      ]);

      expect(createEpic).toHaveBeenCalledWith({
        id: 'e1',
        title: 'T',
        description: 'Long description',
      });
    });

    it('exits on error', async () => {
      exitThrows(1);
      vi.spyOn(PlanWorkspace, 'load').mockImplementation(() => {
        throw new Error('boom');
      });

      const program = createTestProgram();
      registerEpic(program);
      await expect(
        program.parseAsync(['node', 'test', 'epic', 'create', 'e1', 'T']),
      ).rejects.toThrow('process.exit:1');
    });
  });

  describe('list', () => {
    it('prints message when no epics', async () => {
      exitNoop();
      const log = vi.spyOn(console, 'log').mockImplementation(() => {});
      vi.spyOn(PlanWorkspace, 'load').mockReturnValue({
        listEpics: () => [],
        getActiveEpicId: () => null,
      } as unknown as PlanWorkspace);

      const program = createTestProgram();
      registerEpic(program);
      await program.parseAsync(['node', 'test', 'epic', 'list']);

      expect(log).toHaveBeenCalledWith('No epics found.');
      log.mockRestore();
    });

    it('lists epics without filter', async () => {
      exitNoop();
      const listEpics = vi.fn().mockReturnValue([makeEpic()]);
      const getActiveEpicId = vi.fn().mockReturnValue(null);
      vi.spyOn(PlanWorkspace, 'load').mockReturnValue({ listEpics, getActiveEpicId } as unknown as PlanWorkspace);

      const program = createTestProgram();
      registerEpic(program);
      await program.parseAsync(['node', 'test', 'epic', 'list']);

      expect(listEpics).toHaveBeenCalledWith(undefined);
      expect(getActiveEpicId).toHaveBeenCalled();
    });

    it('lists epics and passes status filter', async () => {
      exitNoop();
      const listEpics = vi.fn().mockReturnValue([makeEpic()]);
      vi.spyOn(PlanWorkspace, 'load').mockReturnValue({
        listEpics,
        getActiveEpicId: () => null,
      } as unknown as PlanWorkspace);

      const program = createTestProgram();
      registerEpic(program);
      await program.parseAsync(['node', 'test', 'epic', 'list', '-s', 'draft']);

      expect(listEpics).toHaveBeenCalledWith({ status: 'draft' });
    });

    it('exits on error', async () => {
      exitThrows(1);
      vi.spyOn(PlanWorkspace, 'load').mockImplementation(() => {
        throw new Error('fail');
      });

      const program = createTestProgram();
      registerEpic(program);
      await expect(program.parseAsync(['node', 'test', 'epic', 'list'])).rejects.toThrow('process.exit:1');
    });
  });

  describe('show', () => {
    it('prints epic, stories, and progress', async () => {
      exitNoop();
      const log = vi.spyOn(console, 'log').mockImplementation(() => {});
      const epic = makeEpic({ id: 'E1', description: 'Desc' });
      const story = makeStory({ id: 'S1', epicId: 'E1' });

      vi.spyOn(PlanWorkspace, 'load').mockReturnValue({
        getEpic: () => epic,
        listStories: () => [story],
        getStoryProgress: () => ({ totalTasks: 0, doneTasks: 0, totalSteps: 0, doneSteps: 0 }),
        getEpicProgress: () => ({ totalTasks: 1, doneTasks: 0, totalSteps: 0, doneSteps: 0 }),
        getActiveEpicId: () => null,
      } as unknown as PlanWorkspace);

      const program = createTestProgram();
      registerEpic(program);
      await program.parseAsync(['node', 'test', 'epic', 'show', 'E1']);

      const out = log.mock.calls.map((c) => c.join(' ')).join('\n');
      expect(out).toContain('E1');
      expect(out).toContain('Desc');
      expect(out).toContain('S1');
      log.mockRestore();
    });

    it('exits on error', async () => {
      exitThrows(1);
      vi.spyOn(PlanWorkspace, 'load').mockReturnValue({
        getEpic: () => {
          throw new Error('missing');
        },
      } as unknown as PlanWorkspace);

      const program = createTestProgram();
      registerEpic(program);
      await expect(program.parseAsync(['node', 'test', 'epic', 'show', 'E1'])).rejects.toThrow(
        'process.exit:1',
      );
    });
  });

  describe('dump', () => {
    it('writes terminal dump to stdout by default', async () => {
      exitNoop();
      const write = vi.spyOn(process.stdout, 'write').mockImplementation(() => true);
      const epic = makeEpic({ id: 'E1', description: '' });
      vi.spyOn(PlanWorkspace, 'load').mockReturnValue({
        getEpic: () => epic,
        listStories: () => [],
        getActiveEpicId: () => null,
      } as unknown as PlanWorkspace);

      const program = createTestProgram();
      registerEpic(program);
      await program.parseAsync(['node', 'test', 'epic', 'dump', 'E1']);

      expect(write).toHaveBeenCalled();
      const combined = write.mock.calls.map((c) => String(c[0])).join('');
      expect(combined).toContain('E1');
      write.mockRestore();
    });

    it('writes markdown when --markdown', async () => {
      exitNoop();
      const write = vi.spyOn(process.stdout, 'write').mockImplementation(() => true);
      const epic = makeEpic({ id: 'E1', description: 'Body' });
      vi.spyOn(PlanWorkspace, 'load').mockReturnValue({
        getEpic: () => epic,
        listStories: () => [],
        getActiveEpicId: () => null,
      } as unknown as PlanWorkspace);

      const program = createTestProgram();
      registerEpic(program);
      await program.parseAsync(['node', 'test', 'epic', 'dump', 'E1', '--markdown']);

      const combined = write.mock.calls.map((c) => String(c[0])).join('');
      expect(combined).toContain('# Epic:');
      expect(combined).toContain('Body');
      write.mockRestore();
    });

    it('exits on error', async () => {
      exitThrows(1);
      vi.spyOn(PlanWorkspace, 'load').mockImplementation(() => {
        throw new Error('x');
      });

      const program = createTestProgram();
      registerEpic(program);
      await expect(program.parseAsync(['node', 'test', 'epic', 'dump', 'E1'])).rejects.toThrow(
        'process.exit:1',
      );
    });
  });

  describe('edit', () => {
    it('updates body when --body provided', async () => {
      exitNoop();
      const updateEpicBody = vi.fn();
      vi.spyOn(PlanWorkspace, 'load').mockReturnValue({ updateEpicBody } as unknown as PlanWorkspace);

      const program = createTestProgram();
      registerEpic(program);
      await program.parseAsync(['node', 'test', 'epic', 'edit', 'E1', '--body', 'new']);

      expect(updateEpicBody).toHaveBeenCalledWith('E1', 'new');
    });

    it('fails without --body (requiredOption)', async () => {
      const program = createTestProgram();
      registerEpic(program);
      await expect(program.parseAsync(['node', 'test', 'epic', 'edit', 'E1'])).rejects.toThrow();
    });

    it('exits when update throws', async () => {
      exitThrows(1);
      vi.spyOn(PlanWorkspace, 'load').mockReturnValue({
        updateEpicBody: () => {
          throw new Error('write fail');
        },
      } as unknown as PlanWorkspace);

      const program = createTestProgram();
      registerEpic(program);
      await expect(
        program.parseAsync(['node', 'test', 'epic', 'edit', 'E1', '--body', 'x']),
      ).rejects.toThrow('process.exit:1');
    });
  });

  describe('set-status', () => {
    it('transitions epic', async () => {
      exitNoop();
      const transitionEpic = vi.fn().mockReturnValue(makeEpic({ id: 'E1', status: 'active' }));
      vi.spyOn(PlanWorkspace, 'load').mockReturnValue({ transitionEpic } as unknown as PlanWorkspace);

      const program = createTestProgram();
      registerEpic(program);
      await program.parseAsync(['node', 'test', 'epic', 'set-status', 'E1', 'active']);

      expect(transitionEpic).toHaveBeenCalledWith('E1', 'active');
    });

    it('exits on error', async () => {
      exitThrows(1);
      vi.spyOn(PlanWorkspace, 'load').mockReturnValue({
        transitionEpic: () => {
          throw new Error('bad transition');
        },
      } as unknown as PlanWorkspace);

      const program = createTestProgram();
      registerEpic(program);
      await expect(
        program.parseAsync(['node', 'test', 'epic', 'set-status', 'E1', 'active']),
      ).rejects.toThrow('process.exit:1');
    });
  });

  describe('set-order', () => {
    it('updates execution order', async () => {
      exitNoop();
      const setEpicExecutionOrder = vi.fn().mockReturnValue(makeEpic({ id: 'E1', executionOrder: 9 }));
      vi.spyOn(PlanWorkspace, 'load').mockReturnValue({ setEpicExecutionOrder } as unknown as PlanWorkspace);

      const program = createTestProgram();
      registerEpic(program);
      await program.parseAsync(['node', 'test', 'epic', 'set-order', 'E1', '9']);

      expect(setEpicExecutionOrder).toHaveBeenCalledWith('E1', 9);
    });
  });

  describe('set-active', () => {
    it('sets active epic id', async () => {
      exitNoop();
      const setActiveEpic = vi.fn();
      vi.spyOn(PlanWorkspace, 'load').mockReturnValue({ setActiveEpic } as unknown as PlanWorkspace);

      const program = createTestProgram();
      registerEpic(program);
      await program.parseAsync(['node', 'test', 'epic', 'set-active', 'my-epic']);

      expect(setActiveEpic).toHaveBeenCalledWith('my-epic');
    });
  });

  describe('clear-active', () => {
    it('clears active epic', async () => {
      exitNoop();
      const setActiveEpic = vi.fn();
      vi.spyOn(PlanWorkspace, 'load').mockReturnValue({ setActiveEpic } as unknown as PlanWorkspace);

      const program = createTestProgram();
      registerEpic(program);
      await program.parseAsync(['node', 'test', 'epic', 'clear-active']);

      expect(setActiveEpic).toHaveBeenCalledWith(null);
    });
  });

  describe('active', () => {
    it('prints epic id when set', async () => {
      exitNoop();
      const log = vi.spyOn(console, 'log').mockImplementation(() => {});
      vi.spyOn(PlanWorkspace, 'load').mockReturnValue({
        getActiveEpicId: () => 'focus-epic',
      } as unknown as PlanWorkspace);

      const program = createTestProgram();
      registerEpic(program);
      await program.parseAsync(['node', 'test', 'epic', 'active']);

      expect(log).toHaveBeenCalledWith('focus-epic');
      log.mockRestore();
    });

    it('prints message when none', async () => {
      exitNoop();
      const log = vi.spyOn(console, 'log').mockImplementation(() => {});
      vi.spyOn(PlanWorkspace, 'load').mockReturnValue({
        getActiveEpicId: () => null,
      } as unknown as PlanWorkspace);

      const program = createTestProgram();
      registerEpic(program);
      await program.parseAsync(['node', 'test', 'epic', 'active']);

      expect(log).toHaveBeenCalledWith('No active epic set.');
      log.mockRestore();
    });
  });

  describe('delete', () => {
    it('calls deleteEpic on workspace', async () => {
      exitNoop();
      const deleteEpic = vi.fn().mockReturnValue({ deletedStoryIds: ['STORY-001', 'STORY-002'] });
      vi.spyOn(PlanWorkspace, 'load').mockReturnValue({ deleteEpic } as unknown as PlanWorkspace);

      const program = createTestProgram();
      registerEpic(program);
      await program.parseAsync(['node', 'test', 'epic', 'delete', 'my-epic']);

      expect(deleteEpic).toHaveBeenCalledWith('my-epic');
    });

    it('exits on error', async () => {
      exitThrows(1);
      vi.spyOn(PlanWorkspace, 'load').mockReturnValue({
        deleteEpic: () => {
          throw new Error('not found');
        },
      } as unknown as PlanWorkspace);

      const program = createTestProgram();
      registerEpic(program);
      await expect(program.parseAsync(['node', 'test', 'epic', 'delete', 'x'])).rejects.toThrow(
        'process.exit:1',
      );
    });
  });
});
