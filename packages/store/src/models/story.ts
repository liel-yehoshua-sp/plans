import * as fs from 'node:fs';
import * as path from 'node:path';
import type { Story, StoryStatus, Task, TaskStatus, Step } from './types.js';
import { parse, serialize, replaceBody } from '../parsers/frontmatter.js';

interface StoryFrontmatter {
  id: string;
  epicId: string;
  slug?: string;
  title: string;
  status: StoryStatus;
  branch: string;
  assignee?: string;
  createdAt: string;
  updatedAt: string;
  tasks?: unknown;
}

const TASK_STATUSES: readonly TaskStatus[] = ['pending', 'active', 'done', 'skipped'];

function isTaskStatus(v: unknown): v is TaskStatus {
  return typeof v === 'string' && (TASK_STATUSES as readonly string[]).includes(v);
}

function isStep(v: unknown): v is Step {
  if (!v || typeof v !== 'object') return false;
  const o = v as Record<string, unknown>;
  return typeof o.text === 'string' && typeof o.done === 'boolean';
}

function normalizeTask(raw: unknown, storyId: string): Task | null {
  if (!raw || typeof raw !== 'object') return null;
  const o = raw as Record<string, unknown>;
  const id = typeof o.id === 'string' && o.id.length > 0 ? o.id : null;
  const title = typeof o.title === 'string' && o.title.length > 0 ? o.title : null;
  if (!id || !title) return null;

  const status: TaskStatus = isTaskStatus(o.status) ? o.status : 'pending';
  const order = typeof o.order === 'number' && Number.isFinite(o.order) ? o.order : 0;
  let steps: Step[] = [];
  if (Array.isArray(o.steps)) {
    steps = o.steps.filter(isStep);
  }
  const notes = typeof o.notes === 'string' ? o.notes : '';
  const createdAt =
    typeof o.createdAt === 'string' && o.createdAt.length > 0 ? o.createdAt : new Date().toISOString();
  const updatedAt =
    typeof o.updatedAt === 'string' && o.updatedAt.length > 0 ? o.updatedAt : createdAt;

  return {
    id,
    storyId: typeof o.storyId === 'string' && o.storyId.length > 0 ? o.storyId : storyId,
    title,
    status,
    order,
    steps,
    notes,
    createdAt,
    updatedAt,
  };
}

function normalizeTasks(raw: unknown, storyId: string): Task[] {
  if (!Array.isArray(raw)) return [];
  const out: Task[] = [];
  for (const item of raw) {
    const t = normalizeTask(item, storyId);
    if (t) out.push(t);
  }
  return out;
}

export function readStory(filePath: string): Story {
  const content = fs.readFileSync(filePath, 'utf-8');
  const { data, body } = parse<StoryFrontmatter>(content);
  const slugFromFile = path.basename(filePath, path.extname(filePath));
  const slug =
    typeof data.slug === 'string' && data.slug.length > 0 ? data.slug : slugFromFile;

  const storyId = data.id;
  const tasks = normalizeTasks(data.tasks, storyId);

  return {
    id: storyId,
    epicId: data.epicId,
    slug,
    title: data.title,
    status: data.status,
    branch: data.branch,
    assignee: data.assignee,
    createdAt: data.createdAt,
    updatedAt: data.updatedAt,
    body: body.trim(),
    tasks,
  };
}

export function writeStory(filePath: string, story: Story): void {
  const { body, tasks, ...frontmatter } = story;
  const content = serialize({ ...frontmatter, tasks } as Record<string, unknown>, `\n${body}\n`);
  fs.mkdirSync(path.dirname(filePath), { recursive: true });
  fs.writeFileSync(filePath, content, 'utf-8');
}

export function updateStoryBody(filePath: string, newBody: string): void {
  const content = fs.readFileSync(filePath, 'utf-8');
  fs.writeFileSync(filePath, replaceBody(content, newBody), 'utf-8');
}
