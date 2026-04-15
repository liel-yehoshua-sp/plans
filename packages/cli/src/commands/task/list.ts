import type { Command } from 'commander';
import { PlanWorkspace, type TaskStatus } from '@plans/store';
import { formatTask } from '../../formatters/terminal.js';
import { runPlanAction } from '../../lib/cli-action.js';

export function registerList(task: Command): void {
  task
    .command('list <storyId>')
    .description('List tasks in a story')
    .option('-s, --status <status>', 'filter by status')
    .action((storyId, opts) => {
      runPlanAction(() => {
        const ws = PlanWorkspace.load(process.cwd());
        const tasks = ws.listTasks({ storyId, status: opts.status as TaskStatus | undefined });
        if (tasks.length === 0) {
          console.log('No tasks found.');
          return;
        }
        for (const t of tasks) console.log(formatTask(t));
      });
    });
}
