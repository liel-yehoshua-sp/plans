import type { Command } from 'commander';
import { PlanWorkspace, type EpicStatus } from '@plans/store';
import { success } from '../../formatters/terminal.js';
import { runPlanAction } from '../../lib/cli-action.js';

export function registerSetStatus(epic: Command): void {
  epic
    .command('set-status <id> <status>')
    .description('Transition epic status')
    .action((id, status) => {
      runPlanAction(() => {
        const ws = PlanWorkspace.load(process.cwd());
        const updated = ws.transitionEpic(id, status as EpicStatus);
        success(`${updated.id} → ${updated.status}`);
      });
    });
}
