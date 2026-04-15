import type { Command } from 'commander';
import { PlanWorkspace } from '@plan/store';
import { formatEpic, formatStory, formatProgress, info } from '../formatters/terminal.js';
import { runPlanAction } from '../lib/cli-action.js';

export function register(program: Command): void {
  program
    .command('status')
    .description('Show workspace dashboard')
    .action(() => {
      runPlanAction(() => {
        const ws = PlanWorkspace.load(process.cwd());
        const epics = ws.listEpics();
        const activeEpicId = ws.getActiveEpicId();

        if (epics.length === 0) {
          info('Empty workspace. Run `plan epic create <id> "<title>"` (or `npm run plan -- epic create ...` from the monorepo root) to get started.');
          return;
        }

        for (const epic of epics) {
          console.log(formatEpic(epic, { activeEpicId }));
          const progress = ws.getEpicProgress(epic.id);
          const stories = ws.listStories({ epicId: epic.id });

          for (const story of stories) {
            const sp = ws.getStoryProgress(story.id);
            console.log(`  ${formatStory(story, sp)}`);
          }

          if (stories.length > 0) {
            console.log(`  ${formatProgress('Epic progress', progress)}`);
          }
          console.log('');
        }
      });
    });
}
