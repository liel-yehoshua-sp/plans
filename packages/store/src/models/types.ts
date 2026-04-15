// ── Status enums ──

export type EpicStatus = 'draft' | 'active' | 'completed' | 'archived';
export type StoryStatus = 'draft' | 'ready' | 'in-progress' | 'review' | 'done' | 'archived';
export type TaskStatus = 'pending' | 'active' | 'done' | 'skipped';

// ── Entity interfaces ──

export interface Epic {
  id: string;
  /** Directory name under `.plan/epics/<slug>/`. */
  slug: string;
  title: string;
  status: EpicStatus;
  /** Lower values appear first in portfolio views (`plan status`, `epic list`). */
  executionOrder: number;
  description: string;
  createdAt: string;
  updatedAt: string;
}

export interface Story {
  id: string;
  epicId: string;
  /** Filename stem under the epic's `stories/` folder (`<slug>.md`). */
  slug: string;
  title: string;
  status: StoryStatus;
  branch: string;
  assignee?: string;
  createdAt: string;
  updatedAt: string;
  /** The design/spec body (markdown) */
  body: string;
  /** Tasks persisted in the story file frontmatter. */
  tasks: Task[];
}

export interface Step {
  text: string;
  done: boolean;
}

export interface Task {
  id: string;
  storyId: string;
  title: string;
  status: TaskStatus;
  order: number;
  steps: Step[];
  notes: string;
  createdAt: string;
  updatedAt: string;
}

// ── Config ──

export interface PlanConfig {
  directory: string;
  idPrefix: {
    epic: string;
    story: string;
    task: string;
  };
  branchPattern: string;
}

export const DEFAULT_CONFIG: PlanConfig = {
  directory: '.plan',
  idPrefix: { epic: 'EPIC', story: 'STORY', task: 'TASK' },
  branchPattern: '{epicId}/{storyId}-{slug}',
};

// ── Query filters ──

export interface EpicFilter {
  status?: EpicStatus;
}

export interface StoryFilter {
  epicId?: string;
  status?: StoryStatus;
  assignee?: string;
}

export interface TaskFilter {
  storyId?: string;
  status?: TaskStatus;
}

// ── Progress ──

export interface Progress {
  totalTasks: number;
  doneTasks: number;
  totalSteps: number;
  doneSteps: number;
}
