import type { Command } from 'commander';
import { PlanWorkspace } from '@plans/store';
import { formatStory, formatTaskDetail, formatProgress } from '../../formatters/terminal.js';
import { runPlanAction } from '../../lib/cli-action.js';

export function registerShow(story: Command): void {
  story
    .command('show <id>')
    .description('Show story details with tasks')
    .action((id) => {
      runPlanAction(() => {
        const ws = PlanWorkspace.load(process.cwd());
        const storyRow = ws.getStory(id);
        const progress = ws.getStoryProgress(id);
        console.log(formatStory(storyRow, progress));
        console.log('');
        const tasks = ws.listTasks({ storyId: id });
        if (tasks.length > 0) {
          console.log('Tasks:');
          for (const t of tasks) console.log(formatTaskDetail(t));
        }
        console.log('');
        console.log(formatProgress('Progress', progress));
      });
    });
}
