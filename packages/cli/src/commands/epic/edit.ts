import type { Command } from 'commander';
import { PlanWorkspace } from '@plans/store';
import { success } from '../../formatters/terminal.js';
import { runPlanAction } from '../../lib/cli-action.js';

export function registerEdit(epic: Command): void {
  epic
    .command('edit <id>')
    .description('Edit epic body (preserves frontmatter formatting)')
    .requiredOption('--body <body>', 'Update epic body directly')
    .action((id, opts) => {
      runPlanAction(() => {
        const ws = PlanWorkspace.load(process.cwd());
        ws.updateEpicBody(id, opts.body);
        success(`Updated epic ${id} body`);
      });
    });
}
