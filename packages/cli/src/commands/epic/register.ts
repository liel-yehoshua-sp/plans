import type { Command } from 'commander';
import { registerCreate } from './create.js';
import { registerList } from './list.js';
import { registerShow } from './show.js';
import { registerDump } from './dump.js';
import { registerEdit } from './edit.js';
import { registerSetStatus } from './set-status.js';
import { registerDelete } from './delete.js';
import { registerSetOrder } from './set-order.js';
import { registerSetActive } from './set-active.js';
import { registerClearActive } from './clear-active.js';
import { registerActive } from './active.js';

export function register(program: Command): void {
  const epic = program.command('epic').description('Manage epics');
  registerCreate(epic);
  registerList(epic);
  registerShow(epic);
  registerDump(epic);
  registerEdit(epic);
  registerSetStatus(epic);
  registerSetOrder(epic);
  registerSetActive(epic);
  registerClearActive(epic);
  registerActive(epic);
  registerDelete(epic);
}
