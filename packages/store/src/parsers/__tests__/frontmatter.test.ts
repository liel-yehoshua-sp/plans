import { describe, expect, it } from 'vitest';
import matter from 'gray-matter';
import { replaceBody, serialize } from '../frontmatter.js';

describe('frontmatter parser: replaceBody', () => {
  it('replaces the body of a markdown file with standard YAML frontmatter', () => {
    const input = `---\ntitle: Hello\n---\nOld body\n\nMore text.`;
    const newBody = `New body\nwith multiple lines`;
    const expected = `---\ntitle: Hello\n---\nNew body\nwith multiple lines\n`;
    expect(replaceBody(input, newBody)).toBe(expected);
  });

  it('preserves formatting inside the frontmatter, including comments', () => {
    const input = `---\n# some comment\ntitle: "Quoted title"\nstatus: draft\n---\nOld`;
    const newBody = `New`;
    const expected = `---\n# some comment\ntitle: "Quoted title"\nstatus: draft\n---\nNew\n`;
    expect(replaceBody(input, newBody)).toBe(expected);
  });

  it('handles empty bodies', () => {
    const input = `---\nstatus: open\n---\n`;
    const newBody = `Added body`;
    const expected = `---\nstatus: open\n---\nAdded body\n`;
    expect(replaceBody(input, newBody)).toBe(expected);
  });

  it('handles files with extra newlines before the body', () => {
    const input = `---\nstatus: open\n---\n\n\nOld body`;
    const newBody = `New body`;
    const expected = `---\nstatus: open\n---\nNew body\n`;
    expect(replaceBody(input, newBody)).toBe(expected);
  });

  it('throws an error if no frontmatter is found', () => {
    const input = `# Title\nNo frontmatter`;
    expect(() => replaceBody(input, 'New body')).toThrow('Invalid file format: missing frontmatter');
  });

  it('throws an error if frontmatter is malformed (missing closing dashes)', () => {
    const input = `---\ntitle: Missing dashes\nOld body`;
    expect(() => replaceBody(input, 'New body')).toThrow('Invalid file format: missing frontmatter');
  });

  it('handles horizontal rules in the body without confusing them with frontmatter', () => {
    const input = `---\ntitle: HR\n---\nOld body\n\n---\n\nAnother part`;
    const newBody = `New body\n\n---\n\nNew part`;
    const expected = `---\ntitle: HR\n---\nNew body\n\n---\n\nNew part\n`;
    expect(replaceBody(input, newBody)).toBe(expected);
  });
});

describe('frontmatter serialize', () => {
  it('emits valid nested YAML for story tasks and steps (gray-matter round-trip)', () => {
    const data = {
      id: 'STORY-001',
      epicId: 'e',
      slug: 's',
      title: 'Story',
      status: 'draft',
      branch: 'b',
      createdAt: '2026-01-01T00:00:00.000Z',
      updatedAt: '2026-01-01T00:00:00.000Z',
      tasks: [
        {
          id: 'TASK-001',
          storyId: 'STORY-001',
          title: 'Task',
          status: 'pending',
          order: 1,
          steps: [
            { done: false, text: 'One' },
            { done: true, text: 'Two' },
          ],
          notes: '',
          createdAt: '2026-01-01T00:00:00.000Z',
          updatedAt: '2026-01-01T00:00:00.000Z',
        },
      ],
    };
    const md = serialize(data as Record<string, unknown>, '\n# Body\n');
    const round = matter(md);
    expect(round.data).toMatchObject({
      id: 'STORY-001',
      tasks: [
        {
          id: 'TASK-001',
          steps: [
            { done: false, text: 'One' },
            { done: true, text: 'Two' },
          ],
        },
      ],
    });
    expect(round.content.trim()).toBe('# Body');
  });
});
