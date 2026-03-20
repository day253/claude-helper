import { existsSync, mkdirSync, readFileSync, writeFileSync } from 'node:fs';
import { homedir } from 'node:os';
import { join } from 'node:path';
import yaml from 'js-yaml';
import type { ProviderId } from './providers.js';

export interface ProviderEntry {
  api_key?: string;
  /** 覆盖默认 base URL */
  base_url?: string;
  /** 默认模型 ID（可选） */
  default_model?: string;
  /** 任意备注 */
  note?: string;
}

export interface ConfigFile {
  /** 用于 `export` 未指定供应商时的默认项 */
  active_provider?: ProviderId;
  providers: Partial<Record<ProviderId, ProviderEntry>>;
}

const CONFIG_DIR = join(homedir(), '.llm-providers');
const CONFIG_PATH = join(CONFIG_DIR, 'config.yaml');

function defaultConfig(): ConfigFile {
  return { providers: {} };
}

export function configPath(): string {
  return CONFIG_PATH;
}

export function loadConfig(): ConfigFile {
  try {
    if (!existsSync(CONFIG_PATH)) return defaultConfig();
    const raw = readFileSync(CONFIG_PATH, 'utf-8');
    const parsed = yaml.load(raw) as Partial<ConfigFile> | undefined;
    if (!parsed || typeof parsed !== 'object') return defaultConfig();
    return {
      active_provider: parsed.active_provider,
      providers: parsed.providers ?? {},
    };
  } catch {
    return defaultConfig();
  }
}

export function saveConfig(cfg: ConfigFile): void {
  if (!existsSync(CONFIG_DIR)) mkdirSync(CONFIG_DIR, { recursive: true });
  writeFileSync(CONFIG_PATH, yaml.dump(cfg, { lineWidth: 120 }), 'utf-8');
}

export function maskKey(key: string | undefined): string {
  if (!key) return '(未设置)';
  if (key.length <= 8) return '****';
  return `${key.slice(0, 4)}…${key.slice(-4)}`;
}
