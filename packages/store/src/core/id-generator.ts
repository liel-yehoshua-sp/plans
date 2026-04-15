import * as fs from 'node:fs';

import type { Task } from '../models/types.js';

/**
 * Scans a directory for files matching `PREFIX-NNN.md` and returns the next ID.
 * If the directory is empty or doesn't exist, returns `PREFIX-001`.
 */
export function nextId(dir: string, prefix: string): string {
  if (!fs.existsSync(dir)) return `${prefix}-001`;

  const entries = fs.readdirSync(dir);
  const pattern = new RegExp(`^${prefix}-(\\d+)\\.md$`, 'i');

  let max = 0;
  for (const entry of entries) {
    const match = entry.match(pattern);
    if (match) {
      const num = parseInt(match[1], 10);
      if (num > max) max = num;
    }
  }

  return `${prefix}-${String(max + 1).padStart(3, '0')}`;
}

/** Next task id from existing embedded tasks (e.g. `TASK-003`). */
export function nextTaskIdFromTasks(tasks: Task[], prefix: string): string {
  const pattern = new RegExp(`^${prefix}-(\\d+)$`, 'i');
  let max = 0;
  for (const t of tasks) {
    const match = t.id.match(pattern);
    if (match) {
      const num = parseInt(match[1], 10);
      if (num > max) max = num;
    }
  }
  return `${prefix}-${String(max + 1).padStart(3, '0')}`;
}
