import type { Command } from 'commander';
import { PlanWorkspace, type StoryStatus } from '@plan/store';
import { formatStory } from '../../formatters/terminal.js';
import { runPlanAction } from '../../lib/cli-action.js';

export function registerList(story: Command): void {
  story
    .command('list')
    .description('List stories')
    .option('-e, --epic <epicId>', 'filter by epic')
    .option('-s, --status <status>', 'filter by status')
    .option('-a, --assignee <name>', 'filter by assignee')
    .action((opts) => {
      runPlanAction(() => {
        const ws = PlanWorkspace.load(process.cwd());
        const stories = ws.listStories({
          epicId: opts.epic,
          status: opts.status as StoryStatus | undefined,
          assignee: opts.assignee,
        });
        if (stories.length === 0) {
          console.log('No stories found.');
          return;
        }
        for (const s of stories) {
          const progress = ws.getStoryProgress(s.id);
          console.log(formatStory(s, progress));
        }
      });
    });
}
