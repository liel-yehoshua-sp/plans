import chalk from 'chalk';
import type { PlanWorkspace } from '@plan/store';

const RULE_MAX_WIDTH = 72;

const ruleWidth = (): number => Math.min(RULE_MAX_WIDTH, process.stdout.columns || RULE_MAX_WIDTH);

function dimRule(char: string = '─'): string {
  return chalk.dim(char.repeat(ruleWidth()));
}

/**
 * Full epic dump. Default: terminal-friendly (colors, no markdown punctuation).
 * Use `{ markdown: true }` for pipe-to-file Markdown.
 */
export function renderEpicDump(ws: PlanWorkspace, epicId: string, opts?: { markdown?: boolean }): string {
  return opts?.markdown ? renderEpicDumpMarkdown(ws, epicId) : renderEpicDumpTerminal(ws, epicId);
}

// ── Markdown (legacy / piping) ─────────────────────────────────────────────

function renderEpicDumpMarkdown(ws: PlanWorkspace, epicId: string): string {
  const epic = ws.getEpic(epicId);
  const lines: string[] = [];

  lines.push(`# Epic: ${epic.id} — ${epic.title}`);
  lines.push('');
  lines.push(`- **Status:** ${epic.status}`);
  lines.push(`- **Execution order:** ${epic.executionOrder}`);
  const activeId = ws.getActiveEpicId();
  lines.push(`- **Active focus:** ${activeId === epic.id ? 'yes' : 'no'}`);
  lines.push(`- **Updated:** ${epic.updatedAt}`);
  lines.push('');
  lines.push('---');
  lines.push('');
  lines.push(epic.description.trim() || '_No epic body._');
  lines.push('');

  const stories = ws
    .listStories({ epicId })
    .sort((a, b) => a.id.localeCompare(b.id, undefined, { numeric: true }));

  for (const story of stories) {
    lines.push('---');
    lines.push('');
    lines.push(`## Story: ${story.id} — ${story.title}`);
    lines.push('');
    lines.push(`- **Status:** ${story.status}`);
    if (story.branch) lines.push(`- **Branch:** ${story.branch}`);
    if (story.assignee) lines.push(`- **Assignee:** ${story.assignee}`);
    lines.push(`- **Updated:** ${story.updatedAt}`);
    lines.push('');
    lines.push('---');
    lines.push('');
    lines.push(story.body.trim() || '_No story spec body._');
    lines.push('');

    const tasks = ws.listTasks({ storyId: story.id });
    lines.push('### Tasks');
    lines.push('');
    if (tasks.length === 0) {
      lines.push('_No tasks._');
      lines.push('');
      continue;
    }
    for (const task of tasks) {
      lines.push(`#### ${task.id}: ${task.title}`);
      lines.push('');
      lines.push(`- **Status:** ${task.status}`);
      lines.push('');
      if (task.steps.length > 0) {
        lines.push('##### Steps');
        lines.push('');
        for (const step of task.steps) {
          lines.push(`- [${step.done ? 'x' : ' '}] ${step.text}`);
        }
        lines.push('');
      }
      if (task.notes.trim()) {
        lines.push('##### Notes');
        lines.push('');
        lines.push(task.notes.trim());
        lines.push('');
      }
    }
  }

  return `${lines.join('\n').trimEnd()}\n`;
}

// ── Terminal ─────────────────────────────────────────────────────────────────

function formatInlineMarkdown(line: string): string {
  let s = line;
  // Inline code (non-greedy, no newlines)
  s = s.replace(/`([^`]+)`/g, (_, code: string) => chalk.gray(code));
  // Bold **text**
  s = s.replace(/\*\*([^*]+)\*\*/g, (_, t: string) => chalk.bold(t));
  // Links [label](url) → label
  s = s.replace(/\[([^\]]+)\]\([^)]+\)/g, (_, label: string) => label);
  // Italic *word* (not list bullets — those are line-prefixed)
  s = s.replace(/(?<![*])\*([^*]+)\*(?!\*)/g, (_, t: string) => chalk.italic(t));
  return s;
}

function formatMarkdownBodyForTerminal(text: string): string {
  const lines = text.split('\n');
  const out: string[] = [];

  for (const raw of lines) {
    const line = raw.trimEnd();
    if (line.trim() === '') {
      out.push('');
      continue;
    }

    const t = line.trim();

    if (/^---+\s*$/.test(t)) {
      out.push(dimRule());
      continue;
    }

    const heading = t.match(/^(#{1,6})\s+(.*)$/);
    if (heading) {
      const level = heading[1].length;
      const content = formatInlineMarkdown(heading[2]);
      if (level <= 1) {
        out.push('');
        out.push(chalk.bold.underline(content));
      } else if (level === 2) {
        out.push('');
        out.push(chalk.bold(content));
      } else {
        out.push(chalk.bold.dim(content));
      }
      continue;
    }

    if (/^>\s?/.test(t)) {
      out.push(chalk.dim('  ') + formatInlineMarkdown(t.replace(/^>\s?/, '')));
      continue;
    }

    if (/^[-*]\s+/.test(t)) {
      const item = t.replace(/^[-*]\s+/, '');
      out.push(chalk.dim('  • ') + formatInlineMarkdown(item));
      continue;
    }

    if (/^\d+\.\s+/.test(t)) {
      out.push(chalk.dim('  ') + formatInlineMarkdown(t));
      continue;
    }

    out.push(formatInlineMarkdown(line));
  }

  return out.join('\n');
}

function kv(label: string, value: string): string {
  return `  ${chalk.dim(label.padEnd(10))} ${value}`;
}

function renderEpicDumpTerminal(ws: PlanWorkspace, epicId: string): string {
  const epic = ws.getEpic(epicId);
  const blocks: string[] = [];

  blocks.push(dimRule('═'));
  blocks.push('');
  blocks.push(chalk.bold.cyan(`${epic.id}`) + chalk.dim(' — ') + chalk.bold.white(epic.title));
  blocks.push('');
  blocks.push(kv('Status', epic.status));
  blocks.push(kv('Order', String(epic.executionOrder)));
  const activeId = ws.getActiveEpicId();
  blocks.push(kv('Active', activeId === epic.id ? 'yes' : 'no'));
  blocks.push(kv('Updated', epic.updatedAt));
  blocks.push('');
  blocks.push(dimRule());
  blocks.push('');

  const desc = epic.description.trim();
  blocks.push(desc ? formatMarkdownBodyForTerminal(desc) : chalk.dim('  (No epic body.)'));
  blocks.push('');

  const stories = ws
    .listStories({ epicId })
    .sort((a, b) => a.id.localeCompare(b.id, undefined, { numeric: true }));

  for (const story of stories) {
    blocks.push(dimRule('═'));
    blocks.push('');
    blocks.push(chalk.bold.yellow(story.id) + chalk.dim(' — ') + chalk.bold.white(story.title));
    blocks.push('');
    blocks.push(kv('Status', story.status));
    if (story.branch) blocks.push(kv('Branch', story.branch));
    if (story.assignee) blocks.push(kv('Assignee', story.assignee));
    blocks.push(kv('Updated', story.updatedAt));
    blocks.push('');
    blocks.push(dimRule());
    blocks.push('');

    const body = story.body.trim();
    blocks.push(body ? formatMarkdownBodyForTerminal(body) : chalk.dim('  (No story spec body.)'));
    blocks.push('');

    blocks.push(chalk.bold('Tasks'));
    blocks.push('');

    const tasks = ws.listTasks({ storyId: story.id });
    if (tasks.length === 0) {
      blocks.push(chalk.dim('  (No tasks.)'));
      blocks.push('');
      continue;
    }

    for (const task of tasks) {
      blocks.push(`  ${chalk.bold.magenta(task.id)}${chalk.dim(':')} ${task.title}`);
      blocks.push(kv('Status', task.status));
      blocks.push('');

      if (task.steps.length > 0) {
        blocks.push(chalk.bold.dim('    Steps'));
        for (const step of task.steps) {
          const icon = step.done ? chalk.green('\u2713') : chalk.gray('\u00B7');
          blocks.push(`      ${icon}  ${formatInlineMarkdown(step.text)}`);
        }
        blocks.push('');
      }

      if (task.notes.trim()) {
        blocks.push(chalk.bold.dim('    Notes'));
        for (const noteLine of task.notes.trim().split('\n')) {
          blocks.push(`      ${formatInlineMarkdown(noteLine)}`);
        }
        blocks.push('');
      }
    }
  }

  return `${blocks.join('\n').trimEnd()}\n`;
}
