import type { Command } from 'commander';
import { PlanWorkspace } from '@plan/store';
import { success } from '../../formatters/terminal.js';
import { runPlanAction } from '../../lib/cli-action.js';

export function registerCreate(story: Command): void {
  story
    .command('create <epicId> <title>')
    .description('Create a new story under an epic')
    .option('-a, --assignee <name>', 'assignee')
    .action((epicId, title, opts) => {
      runPlanAction(() => {
        const ws = PlanWorkspace.load(process.cwd());
        const createdStory = ws.createStory(epicId, { title, assignee: opts.assignee });
        success(`Created ${createdStory.id}: ${createdStory.title}`);
        console.log(`  Branch: ${createdStory.branch}`);
        console.log(`  Spec:   ${ws.getStoryFilePath(createdStory.id)}`);
      });
    });
}
