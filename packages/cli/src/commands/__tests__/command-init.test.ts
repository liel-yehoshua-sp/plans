import { describe, expect, it, vi, afterEach } from 'vitest';
import { PlanWorkspace } from '@plan/store';
import { register } from '../init.js';
import { createTestProgram, exitNoop, exitThrows } from './fixtures/cli-test-harness.js';

describe('plan init', () => {
  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('initializes with default .plan directory', async () => {
    exitNoop();
    const init = vi.spyOn(PlanWorkspace, 'init').mockReturnValue({ root: '/proj/.plan' } as PlanWorkspace);

    const program = createTestProgram();
    register(program);
    await program.parseAsync(['node', 'test', 'init']);

    expect(init).toHaveBeenCalledWith(process.cwd(), { directory: '.plan' });
  });

  it('initializes with custom --directory', async () => {
    exitNoop();
    const init = vi.spyOn(PlanWorkspace, 'init').mockReturnValue({ root: '/proj/custom' } as PlanWorkspace);

    const program = createTestProgram();
    register(program);
    await program.parseAsync(['node', 'test', 'init', '-d', 'custom']);

    expect(init).toHaveBeenCalledWith(process.cwd(), { directory: 'custom' });
  });

  it('exits when PlanWorkspace.init throws', async () => {
    exitThrows(1);
    vi.spyOn(PlanWorkspace, 'init').mockImplementation(() => {
      throw new Error('workspace already exists');
    });

    const program = createTestProgram();
    register(program);

    await expect(program.parseAsync(['node', 'test', 'init'])).rejects.toThrow('process.exit:1');
  });
});
