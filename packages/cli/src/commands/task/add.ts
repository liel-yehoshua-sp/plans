import type { Command } from 'commander';
import { PlanWorkspace } from '@plans/store';
import { success } from '../../formatters/terminal.js';
import { runPlanAction } from '../../lib/cli-action.js';

export function registerAdd(task: Command): void {
  task
    .command('add <storyId> <title>')
    .description('Add a task to a story')
    .option('-s, --steps <steps...>', 'initial steps (checkbox items)')
    .action((storyId, title, opts) => {
      runPlanAction(() => {
        const ws = PlanWorkspace.load(process.cwd());
        const createdTask = ws.addTask(storyId, { title, steps: opts.steps });
        success(`Created ${storyId}/${createdTask.id}: ${createdTask.title}`);
      });
    });
}
