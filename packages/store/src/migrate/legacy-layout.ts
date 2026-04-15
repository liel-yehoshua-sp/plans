import * as fs from 'node:fs';
import * as path from 'node:path';
import type { Epic, Story, StoryStatus, Task, TaskStatus } from '../models/types.js';
import { parse } from '../parsers/frontmatter.js';
import { parseSteps } from '../parsers/steps.js';
import { writeEpic } from '../models/epic.js';
import { writeStory } from '../models/story.js';

export interface LegacyLayoutMigrationOptions {
  /** Absolute path to the `.plan` directory (contains `config.yaml`, `epics/`, etc.). */
  planDir: string;
  /** If set, only migrate this epic (matched against epic frontmatter `id` or legacy file stem) and its stories. */
  epicIdFilter?: string;
  dryRun?: boolean;
  /** Remove `epics/<slug>.md` and `stories/<STORY>/` after a successful migrate. */
  deleteLegacy?: boolean;
  /** Overwrite `epics/<slug>/EPIC.md` and story files if they already exist. */
  force?: boolean;
}

export interface LegacyMigrationResult {
  epicsMigrated: string[];
  storiesMigrated: string[];
  warnings: string[];
}

interface LegacyEpicFile {
  stem: string;
  filePath: string;
  id: string;
  epic: Epic;
}

interface LegacyStoryFolder {
  storyKey: string;
  dirPath: string;
  specPath: string;
  epicId: string;
  storyId: string;
  title: string;
  statusRaw: string;
  branch: string;
  assignee?: string;
  createdAt: string;
  updatedAt: string;
  body: string;
}

const STORY_STATUSES: readonly StoryStatus[] = [
  'draft',
  'ready',
  'in-progress',
  'review',
  'done',
  'archived',
];

const TASK_STATUSES: readonly TaskStatus[] = ['pending', 'active', 'done', 'skipped'];

function isStoryStatus(v: string): v is StoryStatus {
  return (STORY_STATUSES as readonly string[]).includes(v);
}

function isTaskStatus(v: string): v is TaskStatus {
  return (TASK_STATUSES as readonly string[]).includes(v);
}

function normalizeStoryStatus(raw: string, warnings: string[], storyId: string): StoryStatus {
  const s = raw.trim();
  if (isStoryStatus(s)) return s;
  if (s === 'in_progress') return 'in-progress';
  if (s === 'complete' || s === 'completed') return 'done';
  if (s === 'active') {
    warnings.push(`Story ${storyId}: status "active" mapped to "in-progress".`);
    return 'in-progress';
  }
  warnings.push(`Story ${storyId}: unknown status "${raw}" — using "draft".`);
  return 'draft';
}

function normalizeTaskStatus(raw: string, warnings: string[], taskId: string): TaskStatus {
  const s = raw.trim();
  if (isTaskStatus(s)) return s;
  if (s === 'complete' || s === 'completed') return 'done';
  warnings.push(`Task ${taskId}: unknown status "${raw}" — using "pending".`);
  return 'pending';
}

function listLegacyEpicMarkdownFiles(epicsDir: string): string[] {
  if (!fs.existsSync(epicsDir)) return [];
  const out: string[] = [];
  for (const name of fs.readdirSync(epicsDir)) {
    if (!name.endsWith('.md')) continue;
    const p = path.join(epicsDir, name);
    if (fs.statSync(p).isFile()) out.push(p);
  }
  return out;
}

function listLegacyStoryDirs(storiesDir: string): string[] {
  if (!fs.existsSync(storiesDir)) return [];
  const out: string[] = [];
  for (const name of fs.readdirSync(storiesDir)) {
    const p = path.join(storiesDir, name);
    if (fs.statSync(p).isDirectory()) out.push(p);
  }
  return out;
}

interface OldEpicFm {
  id?: string;
  title?: string;
  status?: string;
  executionOrder?: number;
  createdAt?: string;
  updatedAt?: string;
}

interface OldStoryFm {
  id?: string;
  epicId?: string;
  title?: string;
  status?: string;
  branch?: string;
  assignee?: string;
  createdAt?: string;
  updatedAt?: string;
}

interface OldTaskFm {
  id?: string;
  storyId?: string;
  title?: string;
  status?: string;
  order?: number;
  createdAt?: string;
  updatedAt?: string;
}

function readLegacyEpic(epicPath: string, warnings: string[]): LegacyEpicFile | null {
  const content = fs.readFileSync(epicPath, 'utf-8');
  const { data, body } = parse<OldEpicFm>(content);
  const stem = path.basename(epicPath, path.extname(epicPath));
  const id = typeof data.id === 'string' && data.id.length > 0 ? data.id : stem;
  const title = typeof data.title === 'string' && data.title.length > 0 ? data.title : id;
  const executionOrder =
    typeof data.executionOrder === 'number' && Number.isFinite(data.executionOrder)
      ? data.executionOrder
      : 1_000_000;

  const allowedEpic = ['draft', 'active', 'completed', 'archived'] as const;
  type EpicSt = (typeof allowedEpic)[number];
  let status: EpicSt = 'draft';
  const st = typeof data.status === 'string' ? data.status.trim() : '';
  if ((allowedEpic as readonly string[]).includes(st)) {
    status = st as EpicSt;
  } else if (st) {
    warnings.push(`Epic ${id}: unknown epic status "${st}" — using "draft".`);
  }

  const isoNow = new Date().toISOString();
  const createdAt = typeof data.createdAt === 'string' && data.createdAt.length > 0 ? data.createdAt : isoNow;
  const updatedAt = typeof data.updatedAt === 'string' && data.updatedAt.length > 0 ? data.updatedAt : isoNow;

  const epic: Epic = {
    id,
    slug: stem,
    title,
    status,
    executionOrder,
    description: body.trim(),
    createdAt,
    updatedAt,
  };

  return { stem, filePath: epicPath, id, epic };
}

function readLegacyStoryFolder(dirPath: string, warnings: string[]): LegacyStoryFolder | null {
  const storyKey = path.basename(dirPath);
  const specPath = path.join(dirPath, 'spec.md');
  if (!fs.existsSync(specPath)) {
    warnings.push(`Skipping ${storyKey}: missing spec.md`);
    return null;
  }
  const content = fs.readFileSync(specPath, 'utf-8');
  const { data, body } = parse<OldStoryFm>(content);
  const storyId = typeof data.id === 'string' && data.id.length > 0 ? data.id : storyKey;
  const epicId = typeof data.epicId === 'string' && data.epicId.length > 0 ? data.epicId : '';
  if (!epicId) {
    warnings.push(`Skipping ${storyKey}: spec.md has no epicId`);
    return null;
  }
  const title = typeof data.title === 'string' && data.title.length > 0 ? data.title : storyId;
  const statusRaw = typeof data.status === 'string' ? data.status : 'draft';
  const branch = typeof data.branch === 'string' && data.branch.length > 0 ? data.branch : '';
  if (!branch) {
    warnings.push(`Story ${storyId}: missing branch in frontmatter — using empty string.`);
  }
  const isoNow = new Date().toISOString();
  const createdAt = typeof data.createdAt === 'string' && data.createdAt.length > 0 ? data.createdAt : isoNow;
  const updatedAt = typeof data.updatedAt === 'string' && data.updatedAt.length > 0 ? data.updatedAt : isoNow;
  const assignee = typeof data.assignee === 'string' && data.assignee.length > 0 ? data.assignee : undefined;

  return {
    storyKey,
    dirPath,
    specPath,
    epicId,
    storyId,
    title,
    statusRaw,
    branch,
    assignee,
    createdAt,
    updatedAt,
    body: body.trim(),
  };
}

function taskSortKey(taskId: string): number {
  const m = taskId.match(/(\d+)$/);
  return m ? parseInt(m[1], 10) : 0;
}

function readTasksFromLegacyFolder(
  storyFolder: string,
  storyId: string,
  warnings: string[],
): Task[] {
  const tasksDir = path.join(storyFolder, 'tasks');
  if (!fs.existsSync(tasksDir)) return [];

  const files = fs
    .readdirSync(tasksDir)
    .filter(f => f.endsWith('.md'))
    .map(f => path.join(tasksDir, f));

  const parsed: Task[] = [];

  for (const filePath of files) {
    const rawFile = fs.readFileSync(filePath, 'utf-8');
    const { data, body } = parse<OldTaskFm>(rawFile);
    const id = typeof data.id === 'string' && data.id.length > 0 ? data.id : path.basename(filePath, '.md');
    const title = typeof data.title === 'string' && data.title.length > 0 ? data.title : id;
    const status = normalizeTaskStatus(typeof data.status === 'string' ? data.status : 'pending', warnings, id);
    const order =
      typeof data.order === 'number' && Number.isFinite(data.order) ? data.order : taskSortKey(id);
    const isoNow = new Date().toISOString();
    const createdAt = typeof data.createdAt === 'string' && data.createdAt.length > 0 ? data.createdAt : isoNow;
    const updatedAt = typeof data.updatedAt === 'string' && data.updatedAt.length > 0 ? data.updatedAt : createdAt;
    const { steps, notes } = parseSteps(body.trim());

    parsed.push({
      id,
      storyId: typeof data.storyId === 'string' && data.storyId.length > 0 ? data.storyId : storyId,
      title,
      status,
      order,
      steps,
      notes,
      createdAt,
      updatedAt,
    });
  }

  parsed.sort((a, b) => {
    if (a.order !== b.order) return a.order - b.order;
    return taskSortKey(a.id) - taskSortKey(b.id);
  });

  return parsed;
}

function detectLegacyLayout(planDir: string): boolean {
  const storiesDir = path.join(planDir, 'stories');
  const epicsDir = path.join(planDir, 'epics');
  if (!fs.existsSync(storiesDir) || !fs.statSync(storiesDir).isDirectory()) return false;
  return listLegacyEpicMarkdownFiles(epicsDir).length > 0;
}

/**
 * Migrates the legacy layout:
 * - `epics/<slug>.md` → `epics/<slug>/EPIC.md`
 * - `stories/<KEY>/spec.md` + `stories/<KEY>/tasks/*.md` → `epics/<slug>/stories/<KEY>.md` with tasks in frontmatter.
 */
export function runLegacyLayoutMigration(options: LegacyLayoutMigrationOptions): LegacyMigrationResult {
  const { planDir, epicIdFilter, dryRun, deleteLegacy, force } = options;
  const warnings: string[] = [];
  const epicsMigrated: string[] = [];
  const storiesMigrated: string[] = [];

  if (!fs.existsSync(planDir) || !fs.statSync(planDir).isDirectory()) {
    throw new Error(`Plan directory does not exist: ${planDir}`);
  }

  if (!detectLegacyLayout(planDir)) {
    throw new Error(
      `No legacy layout detected under ${planDir} (expected epics/*.md files and a stories/ directory).`,
    );
  }

  const epicsDir = path.join(planDir, 'epics');
  const storiesDir = path.join(planDir, 'stories');

  const epicFiles = listLegacyEpicMarkdownFiles(epicsDir)
    .map(p => readLegacyEpic(p, warnings))
    .filter((x): x is LegacyEpicFile => x !== null);

  const epicById = new Map<string, LegacyEpicFile>();
  for (const e of epicFiles) {
    epicById.set(e.id, e);
    if (e.stem !== e.id) epicById.set(e.stem, e);
  }

  let epicsToWrite = epicFiles;
  if (epicIdFilter) {
    const f = epicIdFilter.trim();
    epicsToWrite = epicFiles.filter(e => e.id === f || e.stem === f);
    if (epicsToWrite.length === 0) {
      throw new Error(`No legacy epic file matches --epic-id "${epicIdFilter}".`);
    }
  }

  const allowedEpicStems = new Set(epicsToWrite.map(e => e.stem));

  for (const legacyEpic of epicsToWrite) {
    const epicFolder = path.join(epicsDir, legacyEpic.stem);
    const epicMd = path.join(epicFolder, 'EPIC.md');
    if (fs.existsSync(epicMd) && !force) {
      throw new Error(`Refusing to overwrite ${epicMd} (use --force).`);
    }
    if (!dryRun) {
      fs.mkdirSync(epicFolder, { recursive: true });
      fs.mkdirSync(path.join(epicFolder, 'stories'), { recursive: true });
      writeEpic(epicMd, legacyEpic.epic);
    }
    epicsMigrated.push(legacyEpic.id);
  }

  const storyFolders = listLegacyStoryDirs(storiesDir);
  for (const dir of storyFolders) {
    const meta = readLegacyStoryFolder(dir, warnings);
    if (!meta) continue;

    if (epicIdFilter && meta.epicId !== epicIdFilter.trim()) continue;

    const legacyEpic = epicById.get(meta.epicId);
    if (!legacyEpic) {
      warnings.push(
        `Story ${meta.storyId}: epicId "${meta.epicId}" has no matching legacy epics/<slug>.md — skipped.`,
      );
      continue;
    }

    if (!allowedEpicStems.has(legacyEpic.stem)) {
      continue;
    }

    const status = normalizeStoryStatus(meta.statusRaw, warnings, meta.storyId);
    const tasks = readTasksFromLegacyFolder(meta.dirPath, meta.storyId, warnings);
    const story: Story = {
      id: meta.storyId,
      epicId: meta.epicId,
      slug: meta.storyKey,
      title: meta.title,
      status,
      branch: meta.branch,
      assignee: meta.assignee,
      createdAt: meta.createdAt,
      updatedAt: meta.updatedAt,
      body: meta.body,
      tasks,
    };

    const dest = path.join(epicsDir, legacyEpic.stem, 'stories', `${meta.storyKey}.md`);
    if (fs.existsSync(dest) && !force) {
      throw new Error(`Refusing to overwrite ${dest} (use --force).`);
    }

    if (!dryRun) {
      writeStory(dest, story);
    }
    storiesMigrated.push(meta.storyId);
  }

  if (deleteLegacy && !dryRun) {
    for (const legacyEpic of epicsToWrite) {
      if (fs.existsSync(legacyEpic.filePath)) {
        fs.unlinkSync(legacyEpic.filePath);
      }
    }

    for (const dir of storyFolders) {
      const meta = readLegacyStoryFolder(dir, warnings);
      if (!meta) continue;
      if (epicIdFilter && meta.epicId !== epicIdFilter.trim()) continue;
      const legacyEpic = epicById.get(meta.epicId);
      if (!legacyEpic || !allowedEpicStems.has(legacyEpic.stem)) continue;
      if (storiesMigrated.includes(meta.storyId)) {
        fs.rmSync(dir, { recursive: true, force: true });
      }
    }
  }

  return { epicsMigrated, storiesMigrated, warnings };
}

export function isLegacyPlanLayout(planDir: string): boolean {
  try {
    return detectLegacyLayout(planDir);
  } catch {
    return false;
  }
}
