import * as fs from 'node:fs';
import * as path from 'node:path';
import YAML from 'yaml';
import { DEFAULT_CONFIG, type PlanConfig } from '../models/types.js';

const RC_FILENAME = '.planrc.yaml';
const INNER_CONFIG = 'config.yaml';

export function loadConfig(cwd: string): PlanConfig {
  const config: PlanConfig = { ...DEFAULT_CONFIG, idPrefix: { ...DEFAULT_CONFIG.idPrefix } };

  // Layer 1: .planrc.yaml in project root
  const rcPath = path.join(cwd, RC_FILENAME);
  if (fs.existsSync(rcPath)) {
    const raw = YAML.parse(fs.readFileSync(rcPath, 'utf-8')) ?? {};
    mergeConfig(config, raw);
  }

  // Layer 2: .plan/config.yaml (using resolved directory name)
  const innerPath = path.join(cwd, config.directory, INNER_CONFIG);
  if (fs.existsSync(innerPath)) {
    const raw = YAML.parse(fs.readFileSync(innerPath, 'utf-8')) ?? {};
    mergeConfig(config, raw);
  }

  return config;
}

function mergeConfig(target: PlanConfig, source: Record<string, unknown>): void {
  if (typeof source.directory === 'string') target.directory = source.directory;
  if (typeof source.branchPattern === 'string') target.branchPattern = source.branchPattern;
  if (source.idPrefix && typeof source.idPrefix === 'object') {
    const p = source.idPrefix as Record<string, unknown>;
    if (typeof p.epic === 'string') target.idPrefix.epic = p.epic;
    if (typeof p.story === 'string') target.idPrefix.story = p.story;
    if (typeof p.task === 'string') target.idPrefix.task = p.task;
  }
}

export function writeConfig(dirPath: string, config: Partial<PlanConfig>): void {
  const configPath = path.join(dirPath, INNER_CONFIG);
  fs.writeFileSync(configPath, YAML.stringify(config), 'utf-8');
}
