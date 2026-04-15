import { describe, expect, it, vi, afterEach } from 'vitest';
import { PlanWorkspace } from '@plan/store';
import { register as registerTask } from '../task/register.js';
import { createTestProgram, exitNoop, exitThrows } from './fixtures/cli-test-harness.js';
import { makeTask } from './fixtures/plan-entity-factories.js';

describe('plan task', () => {
  afterEach(() => {
    vi.restoreAllMocks();
  });

  describe('add', () => {
    it('adds task with title', async () => {
      exitNoop();
      const addTask = vi.fn().mockReturnValue(makeTask({ id: 'TASK-9', title: 'Do' }));
      vi.spyOn(PlanWorkspace, 'load').mockReturnValue({ addTask } as unknown as PlanWorkspace);

      const program = createTestProgram();
      registerTask(program);
      await program.parseAsync(['node', 'test', 'task', 'add', 'STORY-1', 'Do']);

      expect(addTask).toHaveBeenCalledWith('STORY-1', { title: 'Do', steps: undefined });
    });

    it('passes --steps', async () => {
      exitNoop();
      const addTask = vi.fn().mockReturnValue(makeTask());
      vi.spyOn(PlanWorkspace, 'load').mockReturnValue({ addTask } as unknown as PlanWorkspace);

      const program = createTestProgram();
      registerTask(program);
      await program.parseAsync([
        'node',
        'test',
        'task',
        'add',
        'STORY-1',
        'T',
        '-s',
        'one',
        'two',
      ]);

      expect(addTask).toHaveBeenCalledWith('STORY-1', { title: 'T', steps: ['one', 'two'] });
    });

    it('exits on error', async () => {
      exitThrows(1);
      vi.spyOn(PlanWorkspace, 'load').mockImplementation(() => {
        throw new Error('x');
      });

      const program = createTestProgram();
      registerTask(program);
      await expect(
        program.parseAsync(['node', 'test', 'task', 'add', 'STORY-1', 'T']),
      ).rejects.toThrow('process.exit:1');
    });
  });

  describe('list', () => {
    it('prints when no tasks', async () => {
      exitNoop();
      const log = vi.spyOn(console, 'log').mockImplementation(() => {});
      vi.spyOn(PlanWorkspace, 'load').mockReturnValue({
        listTasks: () => [],
      } as unknown as PlanWorkspace);

      const program = createTestProgram();
      registerTask(program);
      await program.parseAsync(['node', 'test', 'task', 'list', 'STORY-1']);

      expect(log).toHaveBeenCalledWith('No tasks found.');
      log.mockRestore();
    });

    it('lists tasks without status filter', async () => {
      exitNoop();
      const listTasks = vi.fn().mockReturnValue([makeTask()]);
      vi.spyOn(PlanWorkspace, 'load').mockReturnValue({ listTasks } as unknown as PlanWorkspace);

      const program = createTestProgram();
      registerTask(program);
      await program.parseAsync(['node', 'test', 'task', 'list', 'STORY-1']);

      expect(listTasks).toHaveBeenCalledWith({ storyId: 'STORY-1', status: undefined });
    });

    it('lists tasks with status filter', async () => {
      exitNoop();
      const listTasks = vi.fn().mockReturnValue([makeTask()]);
      vi.spyOn(PlanWorkspace, 'load').mockReturnValue({ listTasks } as unknown as PlanWorkspace);

      const program = createTestProgram();
      registerTask(program);
      await program.parseAsync(['node', 'test', 'task', 'list', 'STORY-1', '-s', 'pending']);

      expect(listTasks).toHaveBeenCalledWith({ storyId: 'STORY-1', status: 'pending' });
    });

    it('exits on error', async () => {
      exitThrows(1);
      vi.spyOn(PlanWorkspace, 'load').mockImplementation(() => {
        throw new Error('e');
      });

      const program = createTestProgram();
      registerTask(program);
      await expect(program.parseAsync(['node', 'test', 'task', 'list', 'S1'])).rejects.toThrow(
        'process.exit:1',
      );
    });
  });

  describe('show', () => {
    it('prints task detail', async () => {
      exitNoop();
      const log = vi.spyOn(console, 'log').mockImplementation(() => {});
      const task = makeTask({ id: 'TASK-1', title: 'T' });
      vi.spyOn(PlanWorkspace, 'load').mockReturnValue({
        getTask: () => task,
      } as unknown as PlanWorkspace);

      const program = createTestProgram();
      registerTask(program);
      await program.parseAsync(['node', 'test', 'task', 'show', 'STORY-1/TASK-1']);

      const out = log.mock.calls.map((c) => c.join(' ')).join('\n');
      expect(out).toContain('TASK-1');
      log.mockRestore();
    });

    it('exits on invalid task path', async () => {
      exitThrows(1);
      vi.spyOn(PlanWorkspace, 'load').mockReturnValue({} as unknown as PlanWorkspace);

      const program = createTestProgram();
      registerTask(program);

      await expect(program.parseAsync(['node', 'test', 'task', 'show', 'bad'])).rejects.toThrow(
        'process.exit:1',
      );
    });

    it('exits when getTask throws', async () => {
      exitThrows(1);
      vi.spyOn(PlanWorkspace, 'load').mockReturnValue({
        getTask: () => {
          throw new Error('missing');
        },
      } as unknown as PlanWorkspace);

      const program = createTestProgram();
      registerTask(program);
      await expect(
        program.parseAsync(['node', 'test', 'task', 'show', 'STORY-1/TASK-1']),
      ).rejects.toThrow('process.exit:1');
    });
  });

  describe('edit', () => {
    it('updates task body with required --body', async () => {
      exitNoop();
      const updateTaskBody = vi.fn();
      vi.spyOn(PlanWorkspace, 'load').mockReturnValue({ updateTaskBody } as unknown as PlanWorkspace);

      const program = createTestProgram();
      registerTask(program);
      await program.parseAsync([
        'node',
        'test',
        'task',
        'edit',
        'STORY-1/TASK-1',
        '--body',
        'new body',
      ]);

      expect(updateTaskBody).toHaveBeenCalledWith('STORY-1', 'TASK-1', 'new body');
    });

    it('fails without --body', async () => {
      const program = createTestProgram();
      registerTask(program);
      await expect(
        program.parseAsync(['node', 'test', 'task', 'edit', 'STORY-1/TASK-1']),
      ).rejects.toThrow();
    });

    it('exits when update throws', async () => {
      exitThrows(1);
      vi.spyOn(PlanWorkspace, 'load').mockReturnValue({
        updateTaskBody: () => {
          throw new Error('fail');
        },
      } as unknown as PlanWorkspace);

      const program = createTestProgram();
      registerTask(program);
      await expect(
        program.parseAsync(['node', 'test', 'task', 'edit', 'STORY-1/TASK-1', '--body', 'x']),
      ).rejects.toThrow('process.exit:1');
    });
  });

  describe('set-status', () => {
    it('transitions task', async () => {
      exitNoop();
      const transitionTask = vi.fn().mockReturnValue(makeTask({ id: 'TASK-1', status: 'done' }));
      vi.spyOn(PlanWorkspace, 'load').mockReturnValue({ transitionTask } as unknown as PlanWorkspace);

      const program = createTestProgram();
      registerTask(program);
      await program.parseAsync(['node', 'test', 'task', 'set-status', 'STORY-1/TASK-1', 'done']);

      expect(transitionTask).toHaveBeenCalledWith('STORY-1', 'TASK-1', 'done');
    });

    it('exits on invalid path', async () => {
      exitThrows(1);
      vi.spyOn(PlanWorkspace, 'load').mockReturnValue({} as unknown as PlanWorkspace);

      const program = createTestProgram();
      registerTask(program);
      await expect(
        program.parseAsync(['node', 'test', 'task', 'set-status', 'bad', 'done']),
      ).rejects.toThrow('process.exit:1');
    });

    it('exits when transition throws', async () => {
      exitThrows(1);
      vi.spyOn(PlanWorkspace, 'load').mockReturnValue({
        transitionTask: () => {
          throw new Error('no');
        },
      } as unknown as PlanWorkspace);

      const program = createTestProgram();
      registerTask(program);
      await expect(
        program.parseAsync(['node', 'test', 'task', 'set-status', 'STORY-1/TASK-1', 'done']),
      ).rejects.toThrow('process.exit:1');
    });
  });

  describe('done', () => {
    it('completes task', async () => {
      exitNoop();
      const completeTask = vi.fn().mockReturnValue(makeTask({ id: 'TASK-1', title: 'Done task' }));
      vi.spyOn(PlanWorkspace, 'load').mockReturnValue({ completeTask } as unknown as PlanWorkspace);

      const program = createTestProgram();
      registerTask(program);
      await program.parseAsync(['node', 'test', 'task', 'done', 'STORY-1/TASK-1']);

      expect(completeTask).toHaveBeenCalledWith('STORY-1', 'TASK-1');
    });

    it('exits on invalid path', async () => {
      exitThrows(1);
      vi.spyOn(PlanWorkspace, 'load').mockReturnValue({} as unknown as PlanWorkspace);

      const program = createTestProgram();
      registerTask(program);
      await expect(program.parseAsync(['node', 'test', 'task', 'done', 'only'])).rejects.toThrow(
        'process.exit:1',
      );
    });

    it('exits when completeTask throws', async () => {
      exitThrows(1);
      vi.spyOn(PlanWorkspace, 'load').mockReturnValue({
        completeTask: () => {
          throw new Error('x');
        },
      } as unknown as PlanWorkspace);

      const program = createTestProgram();
      registerTask(program);
      await expect(
        program.parseAsync(['node', 'test', 'task', 'done', 'STORY-1/TASK-1']),
      ).rejects.toThrow('process.exit:1');
    });
  });
});
