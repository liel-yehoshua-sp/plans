import * as fs from 'node:fs';
import * as path from 'node:path';

export interface PlanWorkspaceState {
  activeEpicId: string | null;
}

const EMPTY_STATE: PlanWorkspaceState = { activeEpicId: null };

export function readWorkspaceState(filePath: string): PlanWorkspaceState {
  if (!fs.existsSync(filePath)) return { ...EMPTY_STATE };
  try {
    const raw = JSON.parse(fs.readFileSync(filePath, 'utf-8')) as Record<string, unknown>;
    const id = raw.activeEpicId;
    if (id === null || id === undefined) return { ...EMPTY_STATE };
    if (typeof id !== 'string' || id.length === 0) return { ...EMPTY_STATE };
    return { activeEpicId: id };
  } catch {
    return { ...EMPTY_STATE };
  }
}

export function writeWorkspaceState(filePath: string, state: PlanWorkspaceState): void {
  const payload = {
    activeEpicId: state.activeEpicId,
  };
  fs.mkdirSync(path.dirname(filePath), { recursive: true });
  fs.writeFileSync(filePath, `${JSON.stringify(payload, null, 2)}\n`, 'utf-8');
}
