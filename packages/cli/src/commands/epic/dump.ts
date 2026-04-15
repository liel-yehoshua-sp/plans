import type { Command } from 'commander';
import { PlanWorkspace } from '@plan/store';
import { renderEpicDump } from '../../formatters/epic-dump.js';
import { runPlanAction } from '../../lib/cli-action.js';

export function registerDump(epic: Command): void {
  epic
    .command('dump <id>')
    .description('Print full epic, stories, and tasks (terminal layout by default; use --markdown to pipe)')
    .option('-m, --markdown', 'Emit Markdown instead of terminal-friendly text')
    .action((id, opts: { markdown?: boolean }) => {
      runPlanAction(() => {
        const ws = PlanWorkspace.load(process.cwd());
        process.stdout.write(renderEpicDump(ws, id, { markdown: Boolean(opts.markdown) }));
      });
    });
}
