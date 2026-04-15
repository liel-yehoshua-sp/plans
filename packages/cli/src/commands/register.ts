import type { Command } from 'commander';
import { register as registerInit } from './init.js';
import { register as registerEpic } from './epic/register.js';
import { register as registerStory } from './story/register.js';
import { register as registerTask } from './task/register.js';
import { register as registerPlanStatus } from './status.js';
import { register as registerStart } from './start.js';
import { register as registerMigrate } from './migrate/register.js';

/**
 * Registers the `plan` CLI — file-backed epics, stories, and tasks under `.plan/`.
 */
export function registerPlanCli(program: Command): void {
  registerInit(program);
  registerEpic(program);
  registerStory(program);
  registerTask(program);
  registerPlanStatus(program);
  registerStart(program);
  registerMigrate(program);
}
