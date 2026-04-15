import chalk from 'chalk';
import type { Epic, Story, Task, Progress } from '@plan/store';

const PROGRESS_BAR_WIDTH = 20;

// ── Status badges ──

const EPIC_STATUS_COLORS: Record<string, (s: string) => string> = {
  draft: chalk.gray,
  active: chalk.green,
  completed: chalk.blue,
  archived: chalk.dim,
};

const STORY_STATUS_COLORS: Record<string, (s: string) => string> = {
  draft: chalk.gray,
  ready: chalk.yellow,
  'in-progress': chalk.green,
  review: chalk.magenta,
  done: chalk.blue,
  archived: chalk.dim,
};

const TASK_STATUS_COLORS: Record<string, (s: string) => string> = {
  pending: chalk.gray,
  active: chalk.green,
  done: chalk.blue,
  skipped: chalk.dim,
};

const TASK_STATUS_ICONS: Record<string, string> = {
  pending: '·',
  active: '►',
  done: '✓',
  skipped: '○',
};

function badge(status: string, colorMap: Record<string, (s: string) => string>): string {
  const colorFn = colorMap[status] ?? chalk.white;
  return colorFn(`[${status}]`);
}

// ── Entity formatters ──

export function formatEpic(epic: Epic, ctx?: { activeEpicId?: string | null }): string {
  const orderTag = chalk.dim(`#${epic.executionOrder}`);
  const active =
    ctx?.activeEpicId != null && ctx.activeEpicId !== '' && epic.id === ctx.activeEpicId
      ? chalk.yellow(' [active]')
      : '';
  return `${orderTag} ${chalk.bold(epic.id)}: ${epic.title} ${badge(epic.status, EPIC_STATUS_COLORS)}${active}`;
}

export function formatStory(story: Story, progress?: Progress): string {
  let line = `${chalk.bold(story.id)}: ${story.title} ${badge(story.status, STORY_STATUS_COLORS)}`;
  if (story.assignee) line += chalk.dim(` @${story.assignee}`);
  if (story.branch) line += chalk.dim(`  ⎇ ${story.branch}`);
  if (progress && progress.totalTasks > 0) {
    line += chalk.dim(`  ${progress.doneTasks}/${progress.totalTasks} tasks`);
    if (progress.totalSteps > 0) {
      line += chalk.dim(`, ${progress.doneSteps}/${progress.totalSteps} steps`);
    }
  }
  return line;
}

export function formatTask(task: Task): string {
  const icon = TASK_STATUS_ICONS[task.status] ?? '?';
  const colorFn = TASK_STATUS_COLORS[task.status] ?? chalk.white;
  let line = `  ${colorFn(icon)} ${chalk.bold(task.id)}: ${task.title} ${badge(task.status, TASK_STATUS_COLORS)}`;
  if (task.steps.length > 0) {
    const done = task.steps.filter(s => s.done).length;
    line += chalk.dim(`  ${done}/${task.steps.length} steps`);
  }
  return line;
}

export function formatTaskDetail(task: Task): string {
  const lines = [formatTask(task)];
  if (task.steps.length > 0) {
    for (const step of task.steps) {
      const check = step.done ? chalk.green('✓') : chalk.gray('·');
      lines.push(`    ${check} ${step.text}`);
    }
  }
  if (task.notes) {
    lines.push('');
    lines.push(chalk.dim('  Notes:'));
    lines.push(`  ${task.notes}`);
  }
  return lines.join('\n');
}

export function formatProgress(label: string, progress: Progress): string {
  const pct = progress.totalTasks > 0
    ? Math.round((progress.doneTasks / progress.totalTasks) * 100)
    : 0;
  const bar = progressBar(pct);
  let line = `${label}: ${bar} ${pct}%  (${progress.doneTasks}/${progress.totalTasks} tasks`;
  if (progress.totalSteps > 0) {
    line += `, ${progress.doneSteps}/${progress.totalSteps} steps`;
  }
  line += ')';
  return line;
}

function progressBar(pct: number, width = PROGRESS_BAR_WIDTH): string {
  const filled = Math.round((pct / 100) * width);
  const empty = width - filled;
  return chalk.green('█'.repeat(filled)) + chalk.gray('░'.repeat(empty));
}

// ── Messages ──

export function success(msg: string): void {
  console.log(chalk.green('✓') + ' ' + msg);
}

export function error(msg: string): void {
  console.error(chalk.red('✗') + ' ' + msg);
}

export function info(msg: string): void {
  console.log(chalk.blue('ℹ') + ' ' + msg);
}
