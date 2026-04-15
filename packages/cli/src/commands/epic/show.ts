import type { Command } from 'commander';
import { PlanWorkspace } from '@plan/store';
import { formatEpic, formatStory, formatProgress } from '../../formatters/terminal.js';
import { runPlanAction } from '../../lib/cli-action.js';

export function registerShow(epic: Command): void {
  epic
    .command('show <id>')
    .description('Show epic details')
    .action((id) => {
      runPlanAction(() => {
        const ws = PlanWorkspace.load(process.cwd());
        const epicRow = ws.getEpic(id);
        console.log(formatEpic(epicRow, { activeEpicId: ws.getActiveEpicId() }));
        if (epicRow.description) console.log(`\n${epicRow.description}`);
        const stories = ws.listStories({ epicId: id });
        if (stories.length > 0) {
          console.log(`\nStories (${stories.length}):`);
          for (const s of stories) {
            const progress = ws.getStoryProgress(s.id);
            console.log(`  ${formatStory(s, progress)}`);
          }
        }
        console.log(`\n${formatProgress('Overall', ws.getEpicProgress(id))}`);
      });
    });
}
