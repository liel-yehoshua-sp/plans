import type { Command } from 'commander';
import { PlanWorkspace } from '@plan/store';
import { success } from '../../formatters/terminal.js';
import { runPlanAction } from '../../lib/cli-action.js';
import { parseTaskPath } from './parse-task-path.js';

export function registerDone(task: Command): void {
  task
    .command('done <taskPath>')
    .description('Mark a task as done (format: STORY-001/TASK-001)')
    .action((taskPath) => {
      runPlanAction(() => {
        const ws = PlanWorkspace.load(process.cwd());
        const { storyId, taskId } = parseTaskPath(taskPath);
        const completedTask = ws.completeTask(storyId, taskId);
        success(`${storyId}/${completedTask.id}: ${completedTask.title} — done`);
      });
    });
}
