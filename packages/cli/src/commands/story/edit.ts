import { execSync } from 'node:child_process';
import type { Command } from 'commander';
import { PlanWorkspace } from '@plans/store';
import { success } from '../../formatters/terminal.js';
import { runPlanAction } from '../../lib/cli-action.js';

export function registerEdit(story: Command): void {
  story
    .command('edit <id>')
    .description('Open story spec in $EDITOR or update body directly')
    .option('--body <body>', 'Update story body directly without opening editor')
    .action((id, opts) => {
      runPlanAction(() => {
        const ws = PlanWorkspace.load(process.cwd());
        ws.getStory(id); // validate exists
        if (opts.body) {
          ws.updateStoryBody(id, opts.body);
          success(`Updated story ${id} body`);
        } else {
          const specPath = ws.getStoryFilePath(id);
          const editor = process.env.EDITOR || 'vi';
          execSync(`${editor} ${specPath}`, { stdio: 'inherit' });
        }
      });
    });
}
