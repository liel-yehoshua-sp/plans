import type { Command } from 'commander';
import { registerCreate } from './create.js';
import { registerList } from './list.js';
import { registerShow } from './show.js';
import { registerEdit } from './edit.js';
import { registerSetStatus } from './set-status.js';

export function register(program: Command): void {
  const story = program.command('story').description('Manage stories');
  registerCreate(story);
  registerList(story);
  registerShow(story);
  registerEdit(story);
  registerSetStatus(story);
}
