import type { Command } from 'commander';
import { PlanWorkspace, type EpicStatus } from '@plan/store';
import { formatEpic } from '../../formatters/terminal.js';
import { runPlanAction } from '../../lib/cli-action.js';

export function registerList(epic: Command): void {
  epic
    .command('list')
    .description('List epics')
    .option('-s, --status <status>', 'filter by status')
    .action((opts) => {
      runPlanAction(() => {
        const ws = PlanWorkspace.load(process.cwd());
        const epics = ws.listEpics(opts.status ? { status: opts.status as EpicStatus } : undefined);
        if (epics.length === 0) {
          console.log('No epics found.');
          return;
        }
        const activeEpicId = ws.getActiveEpicId();
        for (const e of epics) console.log(formatEpic(e, { activeEpicId }));
      });
    });
}
