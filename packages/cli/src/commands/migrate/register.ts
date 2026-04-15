import * as path from 'node:path';
import type { Command } from 'commander';
import chalk from 'chalk';
import { loadConfig, runLegacyLayoutMigration } from '@plan/store';

export function register(program: Command): void {
  const migrate = program.command('migrate').description('Migrate an older .plan/ on-disk layout');

  migrate
    .command('legacy')
    .description(
      'Migrate flat epics/*.md + stories/<id>/spec.md and tasks/*.md into epics/<slug>/EPIC.md and nested stories/',
    )
    .option('--cwd <dir>', 'Project root containing the plan directory', process.cwd())
    .option('--epic-id <id>', 'Only migrate this epic and stories that reference it')
    .option('--dry-run', 'Print what would happen without writing files', false)
    .option('--delete-legacy', 'Remove legacy epic files and story folders after success', false)
    .option('--force', 'Overwrite existing EPIC.md / story markdown files', false)
    .action((opts: {
      cwd: string;
      epicId?: string;
      dryRun?: boolean;
      deleteLegacy?: boolean;
      force?: boolean;
    }) => {
      const cwd = path.resolve(opts.cwd);
      const config = loadConfig(cwd);
      const planDir = path.join(cwd, config.directory);

      const result = runLegacyLayoutMigration({
        planDir,
        epicIdFilter: opts.epicId,
        dryRun: Boolean(opts.dryRun),
        deleteLegacy: Boolean(opts.deleteLegacy),
        force: Boolean(opts.force),
      });

      const storyLabel =
        result.storiesMigrated.length === 1
          ? '1 story'
          : `${result.storiesMigrated.length} stories`;
      console.log(
        chalk.green(
          `${opts.dryRun ? '[dry-run] Would migrate' : 'Migrated'} ${result.epicsMigrated.length} epic(s), ${storyLabel}.`,
        ),
      );
      if (result.epicsMigrated.length) {
        console.log(chalk.dim(` Epics: ${result.epicsMigrated.join(', ')}`));
      }
      if (result.storiesMigrated.length) {
        console.log(chalk.dim(`  Stories: ${result.storiesMigrated.join(', ')}`));
      }
      for (const w of result.warnings) {
        console.log(chalk.yellow(`Warning: ${w}`));
      }
    });
}
