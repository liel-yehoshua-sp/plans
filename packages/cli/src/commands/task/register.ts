import type { Command } from 'commander';
import { registerAdd } from './add.js';
import { registerList } from './list.js';
import { registerShow } from './show.js';
import { registerEdit } from './edit.js';
import { registerSetStatus } from './set-status.js';
import { registerDone } from './done.js';

export function register(program: Command): void {
  const task = program.command('task').description('Manage tasks within stories');
  registerAdd(task);
  registerList(task);
  registerShow(task);
  registerEdit(task);
  registerSetStatus(task);
  registerDone(task);
}
