import type { Command } from 'commander';
import { PlanWorkspace } from '@plans/store';
import { success } from '../../formatters/terminal.js';
import { runPlanAction } from '../../lib/cli-action.js';

export function registerSetOrder(epic: Command): void {
  epic
    .command('set-order <id> <order>')
    .description('Set epic execution order (lower values appear first in plan status and epic list)')
    .action((id: string, orderStr: string) => {
      runPlanAction(() => {
        const ws = PlanWorkspace.load(process.cwd());
        const order = Number.parseInt(orderStr, 10);
        if (!Number.isFinite(order)) {
          throw new Error(`Invalid execution order: ${orderStr}`);
        }
        const updated = ws.setEpicExecutionOrder(id, order);
        success(`Set execution order #${updated.executionOrder} for ${updated.id}`);
      });
    });
}
