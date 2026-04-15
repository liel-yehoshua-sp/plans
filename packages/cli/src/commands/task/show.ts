import type { Command } from 'commander';
import { PlanWorkspace } from '@plans/store';
import { formatTaskDetail } from '../../formatters/terminal.js';
import { runPlanAction } from '../../lib/cli-action.js';
import { parseTaskPath } from './parse-task-path.js';

export function registerShow(task: Command): void {
  task
    .command('show <taskPath>')
    .description('Show task details (format: STORY-001/TASK-001)')
    .action((taskPath) => {
      runPlanAction(() => {
        const ws = PlanWorkspace.load(process.cwd());
        const { storyId, taskId } = parseTaskPath(taskPath);
        const taskRow = ws.getTask(storyId, taskId);
        console.log(formatTaskDetail(taskRow));
      });
    });
}
