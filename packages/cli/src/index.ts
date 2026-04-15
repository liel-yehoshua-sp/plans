#!/usr/bin/env node
import { Command } from 'commander';
import { getCliErrorMessage } from './lib/cli-action.js';
import { registerPlanCli } from './commands/register.js';

const program = new Command();

program
  .name('plan')
  .description('File-based epics, stories, and tasks (.plan workspace)')
  .version('1.0.0');

registerPlanCli(program);

void program.parseAsync(process.argv).catch((err: unknown) => {
  console.error(getCliErrorMessage(err));
  process.exit(1);
});
