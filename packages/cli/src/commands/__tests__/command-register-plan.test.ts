import { describe, expect, it, vi, afterEach } from 'vitest';
import { PlanWorkspace } from '@plan/store';
import { registerPlanCli } from '../register.js';
import { createTestProgram, exitNoop, exitThrows } from './fixtures/cli-test-harness.js';

describe('registerPlanCli (plan …)', () => {
  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('routes init to PlanWorkspace.init', async () => {
    exitNoop();
    const init = vi.spyOn(PlanWorkspace, 'init').mockReturnValue({ root: '/x/.plan' } as PlanWorkspace);

    const program = createTestProgram();
    registerPlanCli(program);
    await program.parseAsync(['node', 'test', 'init', '-d', 'custom']);

    expect(init).toHaveBeenCalledWith(process.cwd(), { directory: 'custom' });
  });

  it('routes epic create', async () => {
    exitNoop();
    const createEpic = vi.fn().mockReturnValue({
      id: 'e1',
      title: 'T',
      status: 'draft',
      description: '',
      createdAt: '',
      updatedAt: '',
    });
    vi.spyOn(PlanWorkspace, 'load').mockReturnValue({ createEpic } as unknown as PlanWorkspace);

    const program = createTestProgram();
    registerPlanCli(program);
    await program.parseAsync(['node', 'test', 'epic', 'create', 'e1', 'T']);

    expect(createEpic).toHaveBeenCalledWith({ id: 'e1', title: 'T', description: undefined });
  });

  it('propagates failures from nested commands', async () => {
    exitThrows(1);
    vi.spyOn(PlanWorkspace, 'load').mockImplementation(() => {
      throw new Error('fail');
    });

    const program = createTestProgram();
    registerPlanCli(program);

    await expect(program.parseAsync(['node', 'test', 'epic', 'list'])).rejects.toThrow('process.exit:1');
  });
});
