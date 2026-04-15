import type { EpicStatus, StoryStatus, TaskStatus } from '../models/types.js';

const EPIC_TRANSITIONS: Record<EpicStatus, EpicStatus[]> = {
  draft: ['active', 'archived'],
  active: ['completed', 'archived'],
  completed: ['archived'],
  archived: [],
};

const STORY_TRANSITIONS: Record<StoryStatus, StoryStatus[]> = {
  draft: ['ready', 'archived'],
  ready: ['in-progress', 'archived'],
  'in-progress': ['review', 'ready', 'archived'],
  review: ['done', 'in-progress'],
  done: ['archived'],
  archived: [],
};

const TASK_TRANSITIONS: Record<TaskStatus, TaskStatus[]> = {
  pending: ['active', 'skipped'],
  active: ['done', 'pending', 'skipped'],
  done: ['pending'],
  skipped: ['pending'],
};

export function validateEpicTransition(from: EpicStatus, to: EpicStatus): boolean {
  return EPIC_TRANSITIONS[from].includes(to);
}

export function validateStoryTransition(from: StoryStatus, to: StoryStatus): boolean {
  return STORY_TRANSITIONS[from].includes(to);
}

export function validateTaskTransition(from: TaskStatus, to: TaskStatus): boolean {
  return TASK_TRANSITIONS[from].includes(to);
}

export function getValidEpicTransitions(from: EpicStatus): EpicStatus[] {
  return EPIC_TRANSITIONS[from];
}

export function getValidStoryTransitions(from: StoryStatus): StoryStatus[] {
  return STORY_TRANSITIONS[from];
}

export function getValidTaskTransitions(from: TaskStatus): TaskStatus[] {
  return TASK_TRANSITIONS[from];
}
