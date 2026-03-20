import { existsSync, mkdirSync, readFileSync, writeFileSync, copyFileSync } from 'node:fs';
import { homedir } from 'node:os';
import { join } from 'node:path';
import { PROVIDERS, type ProviderId } from './providers.js';
import type { ProviderEntry } from './store.js';

const SETTINGS_SCHEMA = 'https://json.schemastore.org/claude-code-settings.json';

export function claudeSettingsPath(): string {
  return join(homedir(), '.claude', 'settings.json');
}

/** Claude Code 使用的 Anthropic 兼容根 URL */
export function effectiveClaudeBase(id: ProviderId, e: ProviderEntry | undefined): string | undefined {
  const override = e?.anthropic_base_url?.trim();
  if (override) return override;
  return PROVIDERS[id].claudeAnthropicBaseUrl;
}

export function buildClaudeEnv(id: ProviderId, e: ProviderEntry): Record<string, string> {
  const meta = PROVIDERS[id];
  const base = effectiveClaudeBase(id, e);
  if (!base) {
    const err = new Error('MISSING_ANTHROPIC_BASE');
    throw err;
  }
  if (!e.api_key?.trim()) {
    const err = new Error('MISSING_API_KEY');
    throw err;
  }
  const key = e.api_key.trim();
  const out: Record<string, string> = {
    ANTHROPIC_BASE_URL: base,
  };
  if (meta.claudeUseAuthToken) {
    out.ANTHROPIC_AUTH_TOKEN = key;
    out.ANTHROPIC_API_KEY = '';
  } else {
    out.ANTHROPIC_API_KEY = key;
  }
  const model = e.default_model?.trim();
  if (model) out.ANTHROPIC_MODEL = model;
  return out;
}

/** 写入 settings.json 时需删除的 env 键（避免与上一供应商冲突） */
export function claudeEnvKeysToRemove(id: ProviderId, e: ProviderEntry): string[] {
  const meta = PROVIDERS[id];
  const remove: string[] = [];
  if (!meta.claudeUseAuthToken) remove.push('ANTHROPIC_AUTH_TOKEN');
  if (!e.default_model?.trim()) remove.push('ANTHROPIC_MODEL');
  return remove;
}

export function mergeClaudeSettings(envPatch: Record<string, string>, removeKeys: string[]): void {
  const dir = join(homedir(), '.claude');
  const path = join(dir, 'settings.json');
  if (!existsSync(dir)) mkdirSync(dir, { recursive: true });

  let root: Record<string, unknown> = {};
  if (existsSync(path)) {
    const raw = readFileSync(path, 'utf-8');
    try {
      root = JSON.parse(raw) as Record<string, unknown>;
    } catch {
      throw new Error('~/.claude/settings.json 不是合法 JSON，请手动修复后再试');
    }
    const bak = join(dir, `settings.json.bak.${Date.now()}`);
    copyFileSync(path, bak);
  } else {
    root = { $schema: SETTINGS_SCHEMA };
  }

  const prevEnv =
    typeof root.env === 'object' && root.env !== null && !Array.isArray(root.env)
      ? (root.env as Record<string, string>)
      : {};
  const env = { ...prevEnv };
  for (const k of removeKeys) {
    delete env[k];
  }
  Object.assign(env, envPatch);
  root.env = env;

  writeFileSync(path, `${JSON.stringify(root, null, 2)}\n`, 'utf-8');
}
