import type { Command } from 'commander';
import { PlanWorkspace, type TaskStatus } from '@plan/store';
import { success } from '../../formatters/terminal.js';
import { runPlanAction } from '../../lib/cli-action.js';
import { parseTaskPath } from './parse-task-path.js';

export function registerSetStatus(task: Command): void {
  task
    .command('set-status <taskPath> <status>')
    .description('Transition task status (format: STORY-001/TASK-001)')
    .action((taskPath, status) => {
      runPlanAction(() => {
        const ws = PlanWorkspace.load(process.cwd());
        const { storyId, taskId } = parseTaskPath(taskPath);
        const updated = ws.transitionTask(storyId, taskId, status as TaskStatus);
        success(`${storyId}/${updated.id} → ${updated.status}`);
      });
    });
}
