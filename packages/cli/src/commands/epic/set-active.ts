import type { Command } from 'commander';
import { PlanWorkspace } from '@plans/store';
import { success } from '../../formatters/terminal.js';
import { runPlanAction } from '../../lib/cli-action.js';

export function registerSetActive(epic: Command): void {
  epic
    .command('set-active <id>')
    .description('Mark an epic as the active portfolio focus (optional)')
    .action((id: string) => {
      runPlanAction(() => {
        const ws = PlanWorkspace.load(process.cwd());
        ws.setActiveEpic(id);
        success(`Active epic: ${id}`);
      });
    });
}
