import { Command } from 'commander';
import { vi } from 'vitest';

/**
 * Commander program configured for tests: no real exit, quiet help on validation errors.
 */
export function createTestProgram(): Command {
  const program = new Command();
  program.exitOverride();
  program.showHelpAfterError(false);
  program.configureOutput({
    writeOut: () => {},
    writeErr: () => {},
  });
  return program;
}

/** `process.exit` that throws so failures surface via `rejects` / try/catch. */
export function exitThrows(code = 0) {
  return vi.spyOn(process, 'exit').mockImplementation(((c?: number) => {
    throw Object.assign(new Error(`process.exit:${c ?? code}`), { exitCode: c ?? code });
  }) as typeof process.exit);
}

/** `process.exit` no-op (success paths that still reference exit in dependencies). */
export function exitNoop() {
  return vi.spyOn(process, 'exit').mockImplementation((() => undefined) as typeof process.exit);
}
