import type { Epic, Progress, Story, Task } from '@plans/store';

export function makeEpic(overrides: Partial<Epic> = {}): Epic {
  return {
    id: 'EPIC-1',
    slug: 'epic-title',
    title: 'Epic title',
    status: 'draft',
    executionOrder: 1,
    description: 'Epic body',
    createdAt: '2020-01-01T00:00:00Z',
    updatedAt: '2020-01-02T00:00:00Z',
    ...overrides,
  };
}

export function makeStory(overrides: Partial<Story> = {}): Story {
  return {
    id: 'STORY-1',
    epicId: 'EPIC-1',
    slug: 'story-title',
    title: 'Story title',
    status: 'draft',
    branch: 'main',
    createdAt: '2020-01-01T00:00:00Z',
    updatedAt: '2020-01-02T00:00:00Z',
    body: 'Spec body',
    tasks: [],
    ...overrides,
  };
}

export function makeTask(overrides: Partial<Task> = {}): Task {
  return {
    id: 'TASK-1',
    storyId: 'STORY-1',
    title: 'Task title',
    status: 'pending',
    order: 0,
    steps: [],
    notes: '',
    createdAt: '2020-01-01T00:00:00Z',
    updatedAt: '2020-01-02T00:00:00Z',
    ...overrides,
  };
}

export function makeProgress(overrides: Partial<Progress> = {}): Progress {
  return {
    totalTasks: 2,
    doneTasks: 1,
    totalSteps: 4,
    doneSteps: 2,
    ...overrides,
  };
}
