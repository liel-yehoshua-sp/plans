import { describe, expect, it, beforeEach, afterEach } from 'vitest';
import * as fs from 'node:fs';
import * as path from 'node:path';
import { tmpdir } from 'node:os';
import { PlanWorkspace } from '../../workspace.js';

describe('PlanWorkspace: body operations', () => {
  let tmpDir: string;
  let workspace: PlanWorkspace;

  beforeEach(() => {
    tmpDir = fs.mkdtempSync(path.join(tmpdir(), 'plan-store-test-'));
    workspace = PlanWorkspace.init(tmpDir);
  });

  afterEach(() => {
    fs.rmSync(tmpDir, { recursive: true, force: true });
  });

  it('updates epic body without modifying frontmatter', () => {
    const epic = workspace.createEpic({ id: 'epic-body-1', title: 'Test Epic', description: 'Old body' });

    workspace.updateEpicBody(epic.id, 'New body block\nWith multiple lines');

    const rawContent = fs.readFileSync(
      path.join(tmpDir, '.plan/epics/test-epic/EPIC.md'),
      'utf-8',
    );
    expect(rawContent).toMatch(/^---\n/);
    expect(rawContent).toContain('id: epic-body-1');
    expect(rawContent).toContain('title: Test Epic');
    expect(rawContent).toContain('New body block\nWith multiple lines');
    expect(rawContent).not.toContain('Old body');

    const updatedEpic = workspace.getEpic(epic.id);
    expect(updatedEpic.description).toBe('New body block\nWith multiple lines');
  });

  it('updates story body without modifying frontmatter', () => {
    const epic = workspace.createEpic({ id: 'epic-body-2', title: 'Epic 2' });
    const story = workspace.createStory(epic.id, { title: 'Test Story' });

    workspace.updateStoryBody(story.id, 'New story spec body');

    const rawContent = fs.readFileSync(
      path.join(tmpDir, '.plan/epics/epic-2/stories/test-story.md'),
      'utf-8',
    );
    expect(rawContent).toMatch(/^---\n/);
    expect(rawContent).toContain(`id: ${story.id}`);
    expect(rawContent).toContain('New story spec body');

    const updatedStory = workspace.getStory(story.id);
    expect(updatedStory.body).toBe('New story spec body');
  });

  it('updates task body without modifying story-level frontmatter fields', () => {
    const epic = workspace.createEpic({ id: 'epic-body-3', title: 'Epic 3' });
    const story = workspace.createStory(epic.id, { title: 'Story 3' });
    const task = workspace.addTask(story.id, { title: 'Task 1', steps: ['Step 1'] });

    workspace.updateTaskBody(story.id, task.id, '## Steps\n- [ ] New Step\n\n## Notes\nNew Notes');

    const rawContent = fs.readFileSync(
      path.join(tmpDir, '.plan/epics/epic-3/stories/story-3.md'),
      'utf-8',
    );
    expect(rawContent).toMatch(/^---\n/);
    expect(rawContent).toContain(`id: ${story.id}`);
    expect(rawContent).toContain(`id: ${task.id}`);
    expect(rawContent).toContain('New Notes');

    const updatedTask = workspace.getTask(story.id, task.id);
    expect(updatedTask.notes).toBe('New Notes');
    expect(updatedTask.steps).toEqual([{ text: 'New Step', done: false }]);
  });
});
