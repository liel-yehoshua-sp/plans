import matter from 'gray-matter';
import YAML from 'yaml';

export interface ParsedFile<T = Record<string, unknown>> {
  data: T;
  body: string;
}

export function parse<T = Record<string, unknown>>(content: string): ParsedFile<T> {
  const result = matter(content);
  return { data: result.data as T, body: result.content };
}

export function serialize(data: Record<string, unknown>, body: string): string {
  // Strip undefined values — YAML serializers reject them
  const clean = Object.fromEntries(
    Object.entries(data).filter(([, v]) => v !== undefined)
  );
  // Use `yaml` (not gray-matter's js-yaml dump): js-yaml breaks nested arrays/maps
  // (e.g. story `tasks[].steps[]`), producing invalid YAML and duplicate keys on read.
  const yaml = YAML.stringify(clean, { indent: 2, lineWidth: 0 }).replace(/^\n+/, '');
  const yamlBlock = yaml.endsWith('\n') ? yaml : `${yaml}\n`;
  return `---\n${yamlBlock}---${body}`;
}

export function replaceBody(content: string, newBody: string): string {
  const match = content.match(/^(---[\s\S]*?\n---\n)/);
  if (!match) {
    throw new Error('Invalid file format: missing frontmatter');
  }
  const frontmatterRaw = match[1];
  // Ensure newBody does not start with extra newlines, then append
  return `${frontmatterRaw}${newBody.trim()}\n`;
}
