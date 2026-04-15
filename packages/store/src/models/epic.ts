import * as fs from 'node:fs';
import * as path from 'node:path';
import type { Epic, EpicStatus } from './types.js';
import { parse, serialize, replaceBody } from '../parsers/frontmatter.js';

/** Epics without this field in frontmatter sort after numbered epics (migration). */
export const LEGACY_EPIC_EXECUTION_ORDER = 1_000_000;

interface EpicFrontmatter {
  id?: string;
  title?: string;
  status?: EpicStatus;
  executionOrder?: number;
  createdAt?: string;
  updatedAt?: string;
}

const EPIC_STATUSES: readonly EpicStatus[] = ['draft', 'active', 'completed', 'archived'];

function isEpicStatus(v: unknown): v is EpicStatus {
  return typeof v === 'string' && (EPIC_STATUSES as readonly string[]).includes(v);
}

export function readEpic(filePath: string): Epic {
  const content = fs.readFileSync(filePath, 'utf-8');
  const { data, body } = parse<EpicFrontmatter>(content);
  const fallbackId = path.basename(filePath, path.extname(filePath));
  const id = typeof data.id === 'string' && data.id.length > 0 ? data.id : fallbackId;
  const title = typeof data.title === 'string' && data.title.length > 0 ? data.title : fallbackId;
  const status: EpicStatus = isEpicStatus(data.status) ? data.status : 'draft';
  const isoNow = new Date().toISOString();
  const createdAt = typeof data.createdAt === 'string' && data.createdAt.length > 0 ? data.createdAt : isoNow;
  const updatedAt = typeof data.updatedAt === 'string' && data.updatedAt.length > 0 ? data.updatedAt : isoNow;
  const executionOrder =
    typeof data.executionOrder === 'number' && Number.isFinite(data.executionOrder)
      ? data.executionOrder
      : LEGACY_EPIC_EXECUTION_ORDER;

  const slug = path.basename(path.dirname(filePath));

  return {
    id,
    slug,
    title,
    status,
    executionOrder,
    description: body.trim(),
    createdAt,
    updatedAt,
  };
}

export function writeEpic(filePath: string, epic: Epic): void {
  const { description, ...frontmatter } = epic;
  const content = serialize(frontmatter as Record<string, unknown>, `\n${description}\n`);
  fs.mkdirSync(path.dirname(filePath), { recursive: true });
  fs.writeFileSync(filePath, content, 'utf-8');
}

export function updateEpicBody(filePath: string, newBody: string): void {
  const content = fs.readFileSync(filePath, 'utf-8');
  fs.writeFileSync(filePath, replaceBody(content, newBody), 'utf-8');
}
