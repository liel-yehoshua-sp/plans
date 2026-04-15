import type { Command } from 'commander';
import { PlanWorkspace } from '@plan/store';
import { success } from '../../formatters/terminal.js';
import { runPlanAction } from '../../lib/cli-action.js';
import { parseTaskPath } from './parse-task-path.js';

export function registerEdit(task: Command): void {
  task
    .command('edit <taskPath>')
    .description('Edit task body (preserves frontmatter formatting)')
    .requiredOption('--body <body>', 'Update task body directly')
    .action((taskPath, opts) => {
      runPlanAction(() => {
        const ws = PlanWorkspace.load(process.cwd());
        const { storyId, taskId } = parseTaskPath(taskPath);
        ws.updateTaskBody(storyId, taskId, opts.body);
        success(`Updated task ${storyId}/${taskId} body`);
      });
    });
}
