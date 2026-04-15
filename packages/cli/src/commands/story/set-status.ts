import type { Command } from 'commander';
import { PlanWorkspace, type StoryStatus } from '@plan/store';
import { success } from '../../formatters/terminal.js';
import { runPlanAction } from '../../lib/cli-action.js';

export function registerSetStatus(story: Command): void {
  story
    .command('set-status <id> <status>')
    .description('Transition story status')
    .action((id, status) => {
      runPlanAction(() => {
        const ws = PlanWorkspace.load(process.cwd());
        const updated = ws.transitionStory(id, status as StoryStatus);
        success(`${updated.id} → ${updated.status}`);
      });
    });
}
