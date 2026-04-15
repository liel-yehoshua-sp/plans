import type { Command } from 'commander';
import { PlanWorkspace } from '@plan/store';
import { success } from '../../formatters/terminal.js';
import { runPlanAction } from '../../lib/cli-action.js';

export function registerCreate(epic: Command): void {
  epic
    .command('create <id> <title>')
    .description('Create a new epic')
    .option('-d, --description <text>', 'Epic description')
    .action((id, title, opts) => {
      runPlanAction(() => {
        const ws = PlanWorkspace.load(process.cwd());
        const createdEpic = ws.createEpic({ id, title, description: opts.description });
        success(`Created ${createdEpic.id}: ${createdEpic.title}`);
      });
    });
}
