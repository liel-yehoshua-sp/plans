import type { Command } from 'commander';
import { exec } from 'node:child_process';
import { platform } from 'node:os';
import { startViewer, DEFAULT_PORT } from '@plans/viewer';
import chalk from 'chalk';

function openBrowser(url: string): void {
  const cmd =
    platform() === 'darwin'
      ? 'open'
      : platform() === 'win32'
        ? 'start'
        : 'xdg-open';

  exec(`${cmd} ${url}`, () => {
    /* best-effort — ignore errors (e.g. no display) */
  });
}

export function register(program: Command): void {
  program
    .command('start')
    .description('Start the plan dashboard in the browser')
    .option('-p, --port <number>', 'Port to run the dashboard on', String(DEFAULT_PORT))
    .action(async (opts: { port: string }) => {
      const port = Number(opts.port);
      if (!Number.isFinite(port) || port <= 0) {
        console.error(chalk.red(`Invalid port: ${opts.port}`));
        process.exit(1);
      }

      try {
        const { url } = await startViewer({ port, cwd: process.cwd() });
        console.log(chalk.green(`Dashboard running at ${chalk.bold(url)}`));
        console.log(chalk.dim('Press Ctrl+C to stop.\n'));
        openBrowser(url);
      } catch (err: unknown) {
        const msg = err instanceof Error ? err.message : String(err);
        console.error(chalk.red(`Failed to start dashboard: ${msg}`));
        process.exit(1);
      }
    });
}
