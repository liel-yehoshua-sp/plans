import { execSync } from 'node:child_process';
import { describe, expect, it, vi, afterEach } from 'vitest';
import { PlanWorkspace } from '@plan/store';
import { register as registerStory } from '../story/register.js';
import { createTestProgram, exitNoop, exitThrows } from './fixtures/cli-test-harness.js';
import { makeProgress, makeStory, makeTask } from './fixtures/plan-entity-factories.js';

vi.mock('node:child_process', () => ({
  execSync: vi.fn(),
}));

describe('plan story', () => {
  afterEach(() => {
    vi.restoreAllMocks();
  });

  describe('create', () => {
    it('creates story under epic', async () => {
      exitNoop();
      const createStory = vi.fn().mockReturnValue(
        makeStory({ id: 'S1', title: 'St', branch: 'b', epicId: 'E1' }),
      );
      vi.spyOn(PlanWorkspace, 'load').mockReturnValue({
        createStory,
        getStoryFilePath: () => '/tmp/.plan/epics/e/stories/s.md',
        root: '/tmp/.plan',
      } as unknown as PlanWorkspace);

      const program = createTestProgram();
      registerStory(program);
      await program.parseAsync(['node', 'test', 'story', 'create', 'E1', 'St']);

      expect(createStory).toHaveBeenCalledWith('E1', { title: 'St', assignee: undefined });
    });

    it('passes --assignee', async () => {
      exitNoop();
      const createStory = vi.fn().mockReturnValue(makeStory());
      vi.spyOn(PlanWorkspace, 'load').mockReturnValue({
        createStory,
        getStoryFilePath: () => '/r/epics/e/stories/s.md',
        root: '/r',
      } as unknown as PlanWorkspace);

      const program = createTestProgram();
      registerStory(program);
      await program.parseAsync(['node', 'test', 'story', 'create', 'E1', 'T', '-a', 'alice']);

      expect(createStory).toHaveBeenCalledWith('E1', { title: 'T', assignee: 'alice' });
    });

    it('exits on error', async () => {
      exitThrows(1);
      vi.spyOn(PlanWorkspace, 'load').mockImplementation(() => {
        throw new Error('x');
      });

      const program = createTestProgram();
      registerStory(program);
      await expect(
        program.parseAsync(['node', 'test', 'story', 'create', 'E1', 'T']),
      ).rejects.toThrow('process.exit:1');
    });
  });

  describe('list', () => {
    it('lists stories with no filters', async () => {
      exitNoop();
      const listStories = vi.fn().mockReturnValue([]);
      vi.spyOn(PlanWorkspace, 'load').mockReturnValue({
        listStories,
        getStoryProgress: () => makeProgress(),
      } as unknown as PlanWorkspace);

      const program = createTestProgram();
      registerStory(program);
      await program.parseAsync(['node', 'test', 'story', 'list']);

      expect(listStories).toHaveBeenCalledWith({
        epicId: undefined,
        status: undefined,
        assignee: undefined,
      });
    });

    it('prints when no stories', async () => {
      exitNoop();
      const log = vi.spyOn(console, 'log').mockImplementation(() => {});
      vi.spyOn(PlanWorkspace, 'load').mockReturnValue({
        listStories: () => [],
      } as unknown as PlanWorkspace);

      const program = createTestProgram();
      registerStory(program);
      await program.parseAsync(['node', 'test', 'story', 'list']);

      expect(log).toHaveBeenCalledWith('No stories found.');
      log.mockRestore();
    });

    it('lists with filters', async () => {
      exitNoop();
      const listStories = vi.fn().mockReturnValue([makeStory()]);
      vi.spyOn(PlanWorkspace, 'load').mockReturnValue({
        listStories,
        getStoryProgress: () => makeProgress(),
      } as unknown as PlanWorkspace);

      const program = createTestProgram();
      registerStory(program);
      await program.parseAsync([
        'node',
        'test',
        'story',
        'list',
        '-e',
        'E1',
        '-s',
        'draft',
        '-a',
        'bob',
      ]);

      expect(listStories).toHaveBeenCalledWith({
        epicId: 'E1',
        status: 'draft',
        assignee: 'bob',
      });
    });

    it('exits on error', async () => {
      exitThrows(1);
      vi.spyOn(PlanWorkspace, 'load').mockImplementation(() => {
        throw new Error('e');
      });

      const program = createTestProgram();
      registerStory(program);
      await expect(program.parseAsync(['node', 'test', 'story', 'list'])).rejects.toThrow('process.exit:1');
    });
  });

  describe('show', () => {
    it('prints story, tasks, and progress', async () => {
      exitNoop();
      const log = vi.spyOn(console, 'log').mockImplementation(() => {});
      const story = makeStory({ id: 'S1' });
      const task = makeTask({ id: 'T1', storyId: 'S1' });

      vi.spyOn(PlanWorkspace, 'load').mockReturnValue({
        getStory: () => story,
        getStoryProgress: () => makeProgress(),
        listTasks: () => [task],
      } as unknown as PlanWorkspace);

      const program = createTestProgram();
      registerStory(program);
      await program.parseAsync(['node', 'test', 'story', 'show', 'S1']);

      const out = log.mock.calls.map((c) => c.join(' ')).join('\n');
      expect(out).toContain('S1');
      expect(out).toContain('T1');
      log.mockRestore();
    });

    it('handles story with no tasks', async () => {
      exitNoop();
      const log = vi.spyOn(console, 'log').mockImplementation(() => {});
      vi.spyOn(PlanWorkspace, 'load').mockReturnValue({
        getStory: () => makeStory(),
        getStoryProgress: () => makeProgress({ totalTasks: 0, doneTasks: 0, totalSteps: 0, doneSteps: 0 }),
        listTasks: () => [],
      } as unknown as PlanWorkspace);

      const program = createTestProgram();
      registerStory(program);
      await program.parseAsync(['node', 'test', 'story', 'show', 'S1']);

      const out = log.mock.calls.map((c) => c.join(' ')).join('\n');
      expect(out).toContain('STORY-1');
      log.mockRestore();
    });

    it('exits on error', async () => {
      exitThrows(1);
      vi.spyOn(PlanWorkspace, 'load').mockReturnValue({
        getStory: () => {
          throw new Error('nope');
        },
      } as unknown as PlanWorkspace);

      const program = createTestProgram();
      registerStory(program);
      await expect(program.parseAsync(['node', 'test', 'story', 'show', 'S1'])).rejects.toThrow(
        'process.exit:1',
      );
    });
  });

  describe('edit', () => {
    it('updates body with --body', async () => {
      exitNoop();
      const updateStoryBody = vi.fn();
      const getStory = vi.fn().mockReturnValue(makeStory());
      vi.spyOn(PlanWorkspace, 'load').mockReturnValue({
        getStory,
        getStoryFilePath: () => '/r/epics/e/stories/s.md',
        updateStoryBody,
        root: '/r',
      } as unknown as PlanWorkspace);

      const program = createTestProgram();
      registerStory(program);
      await program.parseAsync(['node', 'test', 'story', 'edit', 'S1', '--body', 'x']);

      expect(updateStoryBody).toHaveBeenCalledWith('S1', 'x');
    });

    it('opens editor when --body omitted', async () => {
      exitNoop();
      vi.mocked(execSync).mockImplementation(() => '');
      const getStory = vi.fn().mockReturnValue(makeStory());
      vi.spyOn(PlanWorkspace, 'load').mockReturnValue({
        getStory,
        getStoryFilePath: () => '/tmp/plan-root/epics/story-title/stories/story-title.md',
        root: '/tmp/plan-root',
      } as unknown as PlanWorkspace);

      const program = createTestProgram();
      registerStory(program);
      await program.parseAsync(['node', 'test', 'story', 'edit', 'S1']);

      expect(execSync).toHaveBeenCalledWith(
        expect.stringContaining('/tmp/plan-root/epics/story-title/stories/story-title.md'),
        { stdio: 'inherit' },
      );
    });

    it('exits when getStory throws', async () => {
      exitThrows(1);
      vi.spyOn(PlanWorkspace, 'load').mockReturnValue({
        getStory: () => {
          throw new Error('missing');
        },
        root: '/r',
      } as unknown as PlanWorkspace);

      const program = createTestProgram();
      registerStory(program);
      await expect(
        program.parseAsync(['node', 'test', 'story', 'edit', 'S1', '--body', 'x']),
      ).rejects.toThrow('process.exit:1');
    });
  });

  describe('set-status', () => {
    it('transitions story', async () => {
      exitNoop();
      const transitionStory = vi.fn().mockReturnValue(makeStory({ id: 'S1', status: 'done' }));
      vi.spyOn(PlanWorkspace, 'load').mockReturnValue({ transitionStory } as unknown as PlanWorkspace);

      const program = createTestProgram();
      registerStory(program);
      await program.parseAsync(['node', 'test', 'story', 'set-status', 'S1', 'done']);

      expect(transitionStory).toHaveBeenCalledWith('S1', 'done');
    });

    it('exits on error', async () => {
      exitThrows(1);
      vi.spyOn(PlanWorkspace, 'load').mockReturnValue({
        transitionStory: () => {
          throw new Error('bad');
        },
      } as unknown as PlanWorkspace);

      const program = createTestProgram();
      registerStory(program);
      await expect(
        program.parseAsync(['node', 'test', 'story', 'set-status', 'S1', 'done']),
      ).rejects.toThrow('process.exit:1');
    });
  });
});
