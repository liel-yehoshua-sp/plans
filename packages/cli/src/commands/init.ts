import type { Command } from 'commander';
import { PlanWorkspace } from '@plan/store';
import { success } from '../formatters/terminal.js';
import { runPlanAction } from '../lib/cli-action.js';

export function register(program: Command): void {
  program
    .command('init')
    .description('Initialize a new plan workspace in the current directory')
    .option('-d, --directory <name>', 'workspace directory name', '.plan')
    .action((opts) => {
      runPlanAction(() => {
        const ws = PlanWorkspace.init(process.cwd(), { directory: opts.directory });
        success(`Workspace initialized at ${ws.root}`);
      });
    });
}
