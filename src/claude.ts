import { existsSync, mkdirSync, readFileSync, writeFileSync, copyFileSync } from 'node:fs';
import { homedir } from 'node:os';
import { join } from 'node:path';
import { PROVIDERS, PROVIDER_IDS, type ProviderId } from './providers.js';
import type { ConfigFile, ProviderEntry } from './store.js';

const SETTINGS_SCHEMA = 'https://json.schemastore.org/claude-code-settings.json';

export function claudeSettingsPath(): string {
  return join(homedir(), '.claude', 'settings.json');
}

/** OpenAI 兼容 API 根 URL（export 用） */
export function effectiveOpenAIBase(id: ProviderId, e: ProviderEntry | undefined): string {
  return e?.base_url?.trim() || PROVIDERS[id].defaultBaseUrl;
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
  if (meta.claudeExtraEnv) {
    Object.assign(out, meta.claudeExtraEnv);
  }
  const model = e.default_model?.trim();
  if (model) {
    out.ANTHROPIC_MODEL = model;
    out.ANTHROPIC_SMALL_FAST_MODEL = model;
    out.ANTHROPIC_DEFAULT_SONNET_MODEL = model;
    out.ANTHROPIC_DEFAULT_OPUS_MODEL = model;
    out.ANTHROPIC_DEFAULT_HAIKU_MODEL = model;
    if (meta.claudeExtraEnv?.CLAUDE_CODE_SUBAGENT_MODEL !== undefined) {
      out.CLAUDE_CODE_SUBAGENT_MODEL = model;
    }
  }
  return out;
}

function collectClaudeExtraEnvKeysAcrossProviders(): string[] {
  const keys = new Set<string>();
  for (const id of PROVIDER_IDS) {
    const ex = PROVIDERS[id].claudeExtraEnv;
    if (ex) for (const k of Object.keys(ex)) keys.add(k);
  }
  return [...keys];
}

/** 写入 settings.json 时需删除的 env 键（避免与上一供应商冲突） */
export function claudeEnvKeysToRemove(id: ProviderId, e: ProviderEntry): string[] {
  const meta = PROVIDERS[id];
  const remove = new Set<string>(collectClaudeExtraEnvKeysAcrossProviders());
  if (!meta.claudeUseAuthToken) remove.add('ANTHROPIC_AUTH_TOKEN');
  const willSetAnthropicModel =
    Boolean(e.default_model?.trim()) || Boolean(meta.claudeExtraEnv?.ANTHROPIC_MODEL);
  if (!willSetAnthropicModel) remove.add('ANTHROPIC_MODEL');
  return [...remove];
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

export type ClaudeSettingsReadResult =
  | { ok: true; env: Record<string, string> }
  | { ok: false; reason: 'missing' | 'parse' };

/** 只读 ~/.claude/settings.json 的 env（键值一律转为 string，便于与 buildClaudeEnv 对比） */
export function readClaudeSettingsEnv(): ClaudeSettingsReadResult {
  const path = claudeSettingsPath();
  if (!existsSync(path)) return { ok: false, reason: 'missing' };
  try {
    const raw = readFileSync(path, 'utf-8');
    const root = JSON.parse(raw) as Record<string, unknown>;
    const envRaw =
      typeof root.env === 'object' && root.env !== null && !Array.isArray(root.env)
        ? (root.env as Record<string, unknown>)
        : {};
    const env: Record<string, string> = {};
    for (const [k, v] of Object.entries(envRaw)) {
      env[k] = v == null ? '' : String(v);
    }
    return { ok: true, env };
  } catch {
    return { ok: false, reason: 'parse' };
  }
}

export type ClaudeSettingsEnvCompare =
  | { kind: 'skipped' }
  | { kind: 'no_file' }
  | { kind: 'unreadable' }
  | { kind: 'aligned' }
  | { kind: 'drift'; keys: string[] };

/**
 * 将当前默认供应商应写入的 ANTHROPIC_* 与 settings.json env 对比（仅比较 buildClaudeEnv 产出的键）。
 */
export function compareClaudeSettingsEnvWithConfig(cfg: ConfigFile): ClaudeSettingsEnvCompare {
  const active = cfg.active_provider;
  const entry = active ? cfg.providers[active] : undefined;
  if (!active || !entry?.api_key?.trim()) return { kind: 'skipped' };
  if (!effectiveClaudeBase(active, entry)) return { kind: 'skipped' };
  let expected: Record<string, string>;
  try {
    expected = buildClaudeEnv(active, entry);
  } catch {
    return { kind: 'skipped' };
  }
  const read = readClaudeSettingsEnv();
  if (!read.ok) return read.reason === 'missing' ? { kind: 'no_file' } : { kind: 'unreadable' };
  const drift: string[] = [];
  for (const [k, want] of Object.entries(expected)) {
    if ((read.env[k] ?? '') !== want) drift.push(k);
  }
  if (drift.length > 0) return { kind: 'drift', keys: drift };
  return { kind: 'aligned' };
}
