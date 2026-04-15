import type { Command } from 'commander';
import { PlanWorkspace } from '@plan/store';
import { success } from '../../formatters/terminal.js';
import { runPlanAction } from '../../lib/cli-action.js';

export function registerDelete(epic: Command): void {
  epic
    .command('delete <id>')
    .description('Delete an epic and all of its stories and tasks from the plan workspace')
    .action((id: string) => {
      runPlanAction(() => {
        const ws = PlanWorkspace.load(process.cwd());
        const { deletedStoryIds } = ws.deleteEpic(id);
        const n = deletedStoryIds.length;
        const storyPart =
          n === 0 ? 'no stories' : `${n} stor${n === 1 ? 'y' : 'ies'} (${deletedStoryIds.join(', ')})`;
        success(`Deleted epic ${id} and ${storyPart}.`);
      });
    });
}
