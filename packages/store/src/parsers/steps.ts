import type { Step } from '../models/types.js';

const STEP_RE = /^- \[([ xX])\] (.+)$/;

export function parseSteps(markdown: string): { steps: Step[]; notes: string } {
  const lines = markdown.split('\n');
  const steps: Step[] = [];
  const noteLines: string[] = [];
  let inSteps = false;
  let passedSteps = false;

  for (const line of lines) {
    if (passedSteps) {
      noteLines.push(line);
      continue;
    }

    const trimmed = line.trim();

    // Detect steps section header
    if (/^##\s+Steps/i.test(trimmed)) {
      inSteps = true;
      continue;
    }

    // Detect notes section header — end of steps
    if (inSteps && /^##\s+/i.test(trimmed)) {
      passedSteps = true;
      noteLines.push(line);
      continue;
    }

    if (inSteps) {
      const match = trimmed.match(STEP_RE);
      if (match) {
        steps.push({ done: match[1] !== ' ', text: match[2] });
      }
      // skip blank lines within steps section
      continue;
    }

    // Before steps section — skip (frontmatter body preamble, shouldn't exist but be safe)
    noteLines.push(line);
  }

  const notes = noteLines
    .join('\n')
    .replace(/^##\s+Notes\s*/i, '')
    .trim();

  return { steps, notes };
}

export function serializeSteps(steps: Step[], notes: string): string {
  const parts: string[] = [];

  if (steps.length > 0) {
    parts.push('## Steps');
    for (const step of steps) {
      parts.push(`- [${step.done ? 'x' : ' '}] ${step.text}`);
    }
    parts.push('');
  }

  if (notes) {
    parts.push('## Notes');
    parts.push(notes);
    parts.push('');
  }

  return parts.join('\n');
}
