import type { Command } from 'commander';
import { PlanWorkspace } from '@plan/store';
import { runPlanAction } from '../../lib/cli-action.js';

export function registerActive(epic: Command): void {
  epic
    .command('active')
    .description('Print the active epic id, if set')
    .action(() => {
      runPlanAction(() => {
        const ws = PlanWorkspace.load(process.cwd());
        const id = ws.getActiveEpicId();
        if (!id) {
          console.log('No active epic set.');
          return;
        }
        console.log(id);
      });
    });
}
