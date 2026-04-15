import * as fs from 'node:fs';
import * as path from 'node:path';
import { loadConfig, writeConfig } from './core/config.js';
import { nextTaskIdFromTasks } from './core/id-generator.js';
import {
  validateEpicTransition,
  validateStoryTransition,
  validateTaskTransition,
  getValidEpicTransitions,
  getValidStoryTransitions,
  getValidTaskTransitions,
} from './core/state-machine.js';
import { readEpic, writeEpic, updateEpicBody as fsUpdateEpicBody } from './models/epic.js';
import { readWorkspaceState, writeWorkspaceState } from './workspace-state.js';
import { readStory, writeStory, updateStoryBody as fsUpdateStoryBody } from './models/story.js';
import type {
  PlanConfig,
  Epic,
  EpicStatus,
  Story,
  StoryStatus,
  Task,
  TaskStatus,
  EpicFilter,
  StoryFilter,
  TaskFilter,
  Progress,
} from './models/types.js';
import { DEFAULT_CONFIG } from './models/types.js';
import {
  WorkspaceNotFoundError,
  EntityNotFoundError,
  InvalidTransitionError,
  DuplicateEntityError,
} from './utils/errors.js';
import { slugifyPlanSegment, allocateUniqueSlug } from './utils/slug.js';
import { parseSteps } from './parsers/steps.js';

function now(): string {
  return new Date().toISOString();
}

function compareEpicsByExecutionOrder(a: Epic, b: Epic): number {
  if (a.executionOrder !== b.executionOrder) return a.executionOrder - b.executionOrder;
  return String(a.id).localeCompare(String(b.id));
}

export class PlanWorkspace {
  readonly root: string;
  readonly config: PlanConfig;

  private constructor(root: string, config: PlanConfig) {
    this.root = root;
    this.config = config;
  }

  /** Resolve workspace from cwd. Throws if .plan/ doesn't exist. */
  static load(cwd: string): PlanWorkspace {
    const config = loadConfig(cwd);
    const planDir = path.join(cwd, config.directory);
    if (!fs.existsSync(planDir) || !fs.statSync(planDir).isDirectory()) {
      throw new WorkspaceNotFoundError(cwd);
    }
    return new PlanWorkspace(planDir, config);
  }

  /** Initialize a new workspace in cwd. */
  static init(cwd: string, overrides?: Partial<PlanConfig>): PlanWorkspace {
    const config = { ...DEFAULT_CONFIG, idPrefix: { ...DEFAULT_CONFIG.idPrefix }, ...overrides };
    const planDir = path.join(cwd, config.directory);
    fs.mkdirSync(path.join(planDir, 'epics'), { recursive: true });
    writeConfig(planDir, config);
    return new PlanWorkspace(planDir, config);
  }

  // ── Paths ──

  private epicsDir(): string {
    return path.join(this.root, 'epics');
  }

  private epicFolder(slug: string): string {
    return path.join(this.epicsDir(), slug);
  }

  private epicFilePath(slug: string): string {
    return path.join(this.epicFolder(slug), 'EPIC.md');
  }

  private storiesDirForEpicSlug(epicSlug: string): string {
    return path.join(this.epicFolder(epicSlug), 'stories');
  }

  private storyFilePath(epicSlug: string, storySlug: string): string {
    return path.join(this.storiesDirForEpicSlug(epicSlug), `${storySlug}.md`);
  }

  private workspaceStateFile(): string {
    return path.join(this.root, 'workspace-state.json');
  }

  private *eachEpicFilePath(): Generator<string> {
    const dir = this.epicsDir();
    if (!fs.existsSync(dir)) return;
    for (const name of fs.readdirSync(dir)) {
      const epicDir = path.join(dir, name);
      if (!fs.statSync(epicDir).isDirectory()) continue;
      const epicMd = path.join(epicDir, 'EPIC.md');
      if (fs.existsSync(epicMd)) yield epicMd;
    }
  }

  private *eachStoryFilePath(): Generator<string> {
    for (const epicMd of this.eachEpicFilePath()) {
      const storiesDir = path.join(path.dirname(epicMd), 'stories');
      if (!fs.existsSync(storiesDir)) continue;
      for (const f of fs.readdirSync(storiesDir)) {
        if (!f.endsWith('.md')) continue;
        yield path.join(storiesDir, f);
      }
    }
  }

  private loadEpicsFromDisk(filter?: EpicFilter): Epic[] {
    const out: Epic[] = [];
    for (const p of this.eachEpicFilePath()) {
      const e = readEpic(p);
      if (!filter?.status || e.status === filter.status) out.push(e);
    }
    return out;
  }

  private nextExecutionOrder(): number {
    const epics = this.loadEpicsFromDisk();
    if (epics.length === 0) return 1;
    return Math.max(...epics.map(e => e.executionOrder)) + 1;
  }

  private nextStoryId(): string {
    const prefix = this.config.idPrefix.story;
    const pattern = new RegExp(`^${prefix}-(\\d+)$`, 'i');
    let max = 0;
    for (const p of this.eachStoryFilePath()) {
      const story = readStory(p);
      const m = story.id.match(pattern);
      if (m) max = Math.max(max, parseInt(m[1], 10));
    }
    return `${prefix}-${String(max + 1).padStart(3, '0')}`;
  }

  private findStoryPathById(storyId: string): string | null {
    for (const p of this.eachStoryFilePath()) {
      const s = readStory(p);
      if (s.id === storyId) return p;
    }
    return null;
  }

  /** Absolute path to the story markdown file (for editors and tooling). */
  getStoryFilePath(storyId: string): string {
    const p = this.findStoryPathById(storyId);
    if (!p) throw new EntityNotFoundError('Story', storyId);
    return p;
  }

  private mutateStory(storyId: string, fn: (story: Story) => Story): Story {
    const p = this.findStoryPathById(storyId);
    if (!p) throw new EntityNotFoundError('Story', storyId);
    const updated = fn(readStory(p));
    writeStory(p, updated);
    return updated;
  }

  // ── Epic CRUD ──

  createEpic(opts: { id: string; title: string; description?: string }): Epic {
    const id = opts.id;
    if (this.loadEpicsFromDisk().some(e => e.id === id)) {
      throw new DuplicateEntityError('Epic', id);
    }
    const slug = allocateUniqueSlug(opts.title || opts.id, s => fs.existsSync(this.epicFolder(s)));
    const epic: Epic = {
      id,
      slug,
      title: opts.title,
      status: 'draft',
      executionOrder: this.nextExecutionOrder(),
      description: opts.description ?? '',
      createdAt: now(),
      updatedAt: now(),
    };
    fs.mkdirSync(this.epicFolder(slug), { recursive: true });
    writeEpic(this.epicFilePath(slug), epic);
    return epic;
  }

  getEpic(id: string): Epic {
    for (const e of this.loadEpicsFromDisk()) {
      if (e.id === id) return e;
    }
    throw new EntityNotFoundError('Epic', id);
  }

  listEpics(filter?: EpicFilter): Epic[] {
    const epics = this.loadEpicsFromDisk(filter);
    return [...epics].sort(compareEpicsByExecutionOrder);
  }

  /** Portfolio pointer: which epic the team is focusing on (optional). */
  getActiveEpicId(): string | null {
    return readWorkspaceState(this.workspaceStateFile()).activeEpicId;
  }

  setActiveEpic(epicId: string | null): void {
    if (epicId !== null) {
      this.getEpic(epicId);
    }
    writeWorkspaceState(this.workspaceStateFile(), { activeEpicId: epicId });
  }

  setEpicExecutionOrder(id: string, executionOrder: number): Epic {
    if (!Number.isFinite(executionOrder)) {
      throw new TypeError('executionOrder must be a finite number');
    }
    const epic = this.getEpic(id);
    const updated = { ...epic, executionOrder, updatedAt: now() };
    writeEpic(this.epicFilePath(epic.slug), updated);
    return updated;
  }

  updateEpic(id: string, changes: Partial<Pick<Epic, 'title' | 'description'>>): Epic {
    const epic = this.getEpic(id);
    const updated = { ...epic, ...changes, updatedAt: now() };
    writeEpic(this.epicFilePath(epic.slug), updated);
    return updated;
  }

  updateEpicBody(id: string, newBody: string): Epic {
    const epic = this.getEpic(id);
    const p = this.epicFilePath(epic.slug);
    fsUpdateEpicBody(p, newBody);
    return this.getEpic(id);
  }

  transitionEpic(id: string, to: EpicStatus): Epic {
    const epic = this.getEpic(id);
    if (!validateEpicTransition(epic.status, to)) {
      throw new InvalidTransitionError(id, epic.status, to, getValidEpicTransitions(epic.status));
    }
    const updated = { ...epic, status: to, updatedAt: now() };
    writeEpic(this.epicFilePath(epic.slug), updated);
    return updated;
  }

  /**
   * Permanently removes the epic directory and all nested stories/tasks.
   */
  deleteEpic(epicId: string): { deletedStoryIds: string[] } {
    const epic = this.getEpic(epicId);
    const deletedStoryIds = this.listStories({ epicId }).map(s => s.id);
    const folder = this.epicFolder(epic.slug);
    if (fs.existsSync(folder)) {
      fs.rmSync(folder, { recursive: true, force: true });
    }
    if (this.getActiveEpicId() === epicId) {
      this.setActiveEpic(null);
    }
    return { deletedStoryIds };
  }

  // ── Story CRUD ──

  createStory(epicId: string, opts: { title: string; assignee?: string }): Story {
    const epic = this.getEpic(epicId);
    const id = this.nextStoryId();
    const storySlug = allocateUniqueSlug(
      opts.title,
      s => fs.existsSync(this.storyFilePath(epic.slug, s)),
    );

    const slug = slugifyPlanSegment(opts.title);
    const branch = this.config.branchPattern
      .replace('{epicId}', epicId.toLowerCase())
      .replace('{storyId}', id.toLowerCase())
      .replace('{slug}', slug);

    const story: Story = {
      id,
      epicId,
      slug: storySlug,
      title: opts.title,
      status: 'draft',
      branch,
      assignee: opts.assignee,
      createdAt: now(),
      updatedAt: now(),
      body: `# ${opts.title}\n\n## Design\n\n_Describe the design here._\n`,
      tasks: [],
    };

    const filePath = this.storyFilePath(epic.slug, storySlug);
    fs.mkdirSync(path.dirname(filePath), { recursive: true });
    writeStory(filePath, story);
    return story;
  }

  getStory(id: string): Story {
    const p = this.findStoryPathById(id);
    if (!p) throw new EntityNotFoundError('Story', id);
    return readStory(p);
  }

  listStories(filter?: StoryFilter): Story[] {
    const out: Story[] = [];
    for (const p of this.eachStoryFilePath()) {
      const s = readStory(p);
      if (filter?.epicId && s.epicId !== filter.epicId) continue;
      if (filter?.status && s.status !== filter.status) continue;
      if (filter?.assignee && s.assignee !== filter.assignee) continue;
      out.push(s);
    }
    return out;
  }

  updateStory(id: string, changes: Partial<Pick<Story, 'title' | 'body' | 'assignee'>>): Story {
    return this.mutateStory(id, story => ({ ...story, ...changes, updatedAt: now() }));
  }

  updateStoryBody(id: string, newBody: string): Story {
    const p = this.findStoryPathById(id);
    if (!p) throw new EntityNotFoundError('Story', id);
    fsUpdateStoryBody(p, newBody);
    return readStory(p);
  }

  transitionStory(id: string, to: StoryStatus): Story {
    return this.mutateStory(id, story => {
      if (!validateStoryTransition(story.status, to)) {
        throw new InvalidTransitionError(id, story.status, to, getValidStoryTransitions(story.status));
      }
      return { ...story, status: to, updatedAt: now() };
    });
  }

  // ── Task CRUD (embedded in story files) ──

  addTask(storyId: string, opts: { title: string; steps?: string[] }): Task {
    let created!: Task;
    this.mutateStory(storyId, story => {
      const id = nextTaskIdFromTasks(story.tasks, this.config.idPrefix.task);
      const order = story.tasks.length + 1;
      created = {
        id,
        storyId,
        title: opts.title,
        status: 'pending',
        order,
        steps: (opts.steps ?? []).map(text => ({ text, done: false })),
        notes: '',
        createdAt: now(),
        updatedAt: now(),
      };
      return {
        ...story,
        tasks: [...story.tasks, created],
        updatedAt: now(),
      };
    });
    return created;
  }

  getTask(storyId: string, taskId: string): Task {
    const story = this.getStory(storyId);
    const task = story.tasks.find(t => t.id === taskId);
    if (!task) throw new EntityNotFoundError('Task', `${storyId}/${taskId}`);
    return task;
  }

  listTasks(filter?: TaskFilter): Task[] {
    const collectFromStory = (s: Story): Task[] =>
      s.tasks
        .filter(t => !filter?.status || t.status === filter.status)
        .sort((a, b) => a.order - b.order);

    if (filter?.storyId) {
      return collectFromStory(this.getStory(filter.storyId));
    }
    const all: Task[] = [];
    for (const p of this.eachStoryFilePath()) {
      all.push(...collectFromStory(readStory(p)));
    }
    return all.sort((a, b) => a.storyId.localeCompare(b.storyId) || a.order - b.order);
  }

  updateTask(storyId: string, taskId: string, changes: Partial<Pick<Task, 'title' | 'notes' | 'steps'>>): Task {
    let updated!: Task;
    this.mutateStory(storyId, story => {
      const idx = story.tasks.findIndex(t => t.id === taskId);
      if (idx === -1) throw new EntityNotFoundError('Task', `${storyId}/${taskId}`);
      updated = { ...story.tasks[idx], ...changes, updatedAt: now() };
      const tasks = [...story.tasks];
      tasks[idx] = updated;
      return { ...story, tasks, updatedAt: now() };
    });
    return updated;
  }

  updateTaskBody(storyId: string, taskId: string, newBody: string): Task {
    const { steps, notes } = parseSteps(newBody);
    return this.updateTask(storyId, taskId, { steps, notes });
  }

  transitionTask(storyId: string, taskId: string, to: TaskStatus): Task {
    let updated!: Task;
    this.mutateStory(storyId, story => {
      const task = story.tasks.find(t => t.id === taskId);
      if (!task) throw new EntityNotFoundError('Task', `${storyId}/${taskId}`);
      if (!validateTaskTransition(task.status, to)) {
        throw new InvalidTransitionError(
          `${storyId}/${taskId}`,
          task.status,
          to,
          getValidTaskTransitions(task.status),
        );
      }
      let next: Task = { ...task, status: to, updatedAt: now() };
      if (to === 'done') {
        next = { ...next, steps: next.steps.map(s => ({ ...s, done: true })) };
      }
      updated = next;
      const tasks = story.tasks.map(t => (t.id === taskId ? next : t));
      return { ...story, tasks, updatedAt: now() };
    });
    return updated;
  }

  /** Convenience: mark task as done */
  completeTask(storyId: string, taskId: string): Task {
    return this.transitionTask(storyId, taskId, 'done');
  }

  // ── Progress ──

  getStoryProgress(storyId: string): Progress {
    const tasks = this.listTasks({ storyId });
    return {
      totalTasks: tasks.length,
      doneTasks: tasks.filter(t => t.status === 'done').length,
      totalSteps: tasks.reduce((sum, t) => sum + t.steps.length, 0),
      doneSteps: tasks.reduce((sum, t) => sum + t.steps.filter(s => s.done).length, 0),
    };
  }

  getEpicProgress(epicId: string): Progress {
    const stories = this.listStories({ epicId });
    const all = stories.map(s => this.getStoryProgress(s.id));
    return {
      totalTasks: all.reduce((s, p) => s + p.totalTasks, 0),
      doneTasks: all.reduce((s, p) => s + p.doneTasks, 0),
      totalSteps: all.reduce((s, p) => s + p.totalSteps, 0),
      doneSteps: all.reduce((s, p) => s + p.doneSteps, 0),
    };
  }
}
