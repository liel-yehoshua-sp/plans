import type { Command } from 'commander';
import { PlanWorkspace } from '@plan/store';
import { success } from '../../formatters/terminal.js';
import { runPlanAction } from '../../lib/cli-action.js';

export function registerClearActive(epic: Command): void {
  epic
    .command('clear-active')
    .description('Clear the active epic pointer')
    .action(() => {
      runPlanAction(() => {
        const ws = PlanWorkspace.load(process.cwd());
        ws.setActiveEpic(null);
        success('Cleared active epic');
      });
    });
}
