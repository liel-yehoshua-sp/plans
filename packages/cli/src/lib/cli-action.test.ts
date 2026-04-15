import { describe, expect, it, vi } from 'vitest';
import { getCliErrorMessage, runPlanAction } from './cli-action.js';

describe('getCliErrorMessage', () => {
  it('reads Error.message', () => {
    expect(getCliErrorMessage(new Error('oops'))).toBe('oops');
  });

  it('returns plain strings', () => {
    expect(getCliErrorMessage('plain')).toBe('plain');
  });

  it('reads object .message when it is a string', () => {
    expect(getCliErrorMessage({ message: 'from object' })).toBe('from object');
  });

  it('stringifies unknown objects', () => {
    expect(getCliErrorMessage({ code: 1 })).toBe('{"code":1}');
  });

  it('stringifies numbers', () => {
    expect(getCliErrorMessage(42)).toBe('42');
  });
});

describe('runPlanAction', () => {
  it('runs action when it does not throw', () => {
    const spy = vi.fn();
    runPlanAction(() => {
      spy();
    });
    expect(spy).toHaveBeenCalled();
  });

  it('prints error and exits when action throws', () => {
    const exit = vi.spyOn(process, 'exit').mockImplementation(((code?: number) => {
      throw new Error(`exit:${code}`);
    }) as typeof process.exit);
    const err = vi.spyOn(console, 'error').mockImplementation(() => {});

    expect(() =>
      runPlanAction(() => {
        throw new Error('boom');
      }),
    ).toThrow('exit:1');

    expect(err).toHaveBeenCalledWith(expect.stringContaining('boom'));
    expect(exit).toHaveBeenCalledWith(1);

    exit.mockRestore();
    err.mockRestore();
  });
});
