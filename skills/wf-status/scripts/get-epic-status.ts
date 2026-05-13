import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import {
  summarizePlanMarkdownForStatus,
  plansRelativePathFromAbsolute,
} from '../../../../../packages/epics/src/plan-markdown.ts';

const files = process.argv.slice(2);

if (files.length === 0) {
  console.error('Please provide at least one epic.md path (or legacy plan path) as an argument.');
  process.exit(1);
}

for (const file of files) {
  try {
    const absolutePath = resolve(file);
    const content = readFileSync(absolutePath, 'utf8');
    const rel = plansRelativePathFromAbsolute(absolutePath);
    const summary = summarizePlanMarkdownForStatus(content, {
      absolutePath,
      epicRelativePath: rel,
    });
    console.log(`--- ${file} ---`);
    console.log(JSON.stringify(summary, null, 2));
  } catch (err: any) {
    console.error(`Error processing ${file}: ${err.message}`);
  }
}
