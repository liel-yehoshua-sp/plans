import { error } from '../formatters/terminal.js';

/**
 * Normalizes thrown values for stderr (never returns an empty string for non-empty failures).
 */
export function getCliErrorMessage(err: unknown): string {
  if (err instanceof Error) return err.message;
  if (typeof err === 'string') return err;
  if (
    err != null &&
    typeof err === 'object' &&
    'message' in err &&
    typeof (err as { message: unknown }).message === 'string'
  ) {
    return (err as { message: string }).message;
  }
  try {
    return JSON.stringify(err);
  } catch {
    return String(err);
  }
}

/**
 * Runs a synchronous plan CLI action; on failure prints a message and exits with code 1.
 */
export function runPlanAction(action: () => void): void {
  try {
    action();
  } catch (err: unknown) {
    error(getCliErrorMessage(err));
    process.exit(1);
  }
}
