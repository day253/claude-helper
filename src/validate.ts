import chalk from 'chalk';
import ora from 'ora';
import {
  buildClaudeEnv,
  claudeSettingsPath,
  compareClaudeSettingsEnvWithConfig,
  effectiveClaudeBase,
  type ClaudeSettingsEnvCompare,
} from './claude.js';
import { PROVIDERS, PROVIDER_IDS, type ProviderId } from './providers.js';
import type { ConfigFile, ProviderEntry } from './store.js';
import { tpl, type WizardLang, wizardCopy } from './wizard-locale.js';

const PROBE_TIMEOUT_MS = 8000;
/** 单模型 POST /v1/messages 探测超时（可能含首 token 延迟） */
const MODEL_PROBE_TIMEOUT_MS = 25000;
const UA = 'claude-helper/check';

const CHECK_COMPACT_GAP_MS = 100;

function sleep(ms: number): Promise<void> {
  return new Promise((r) => setTimeout(r, ms));
}

export async function probeUrl(
  url: string,
  lang: WizardLang = 'zh',
): Promise<{ ok: boolean; detail: string }> {
  try {
    const res = await fetch(url, {
      method: 'GET',
      redirect: 'follow',
      signal: AbortSignal.timeout(PROBE_TIMEOUT_MS),
      headers: { 'User-Agent': UA },
    });
    const st = res.status;
    if (st >= 500) {
      return {
        ok: false,
        detail: lang === 'zh' ? `HTTP ${st}（服务端报错）` : `HTTP ${st} (server error)`,
      };
    }
    return { ok: true, detail: `HTTP ${st}` };
  } catch (e) {
    const msg = e instanceof Error ? e.message : String(e);
    return { ok: false, detail: msg };
  }
}

async function anthropicProbeErrorDetail(res: Response): Promise<string> {
  const st = res.status;
  const t = await res.text();
  let extra = '';
  try {
    const j = JSON.parse(t) as { error?: { message?: string }; message?: string };
    extra = (j.error?.message ?? j.message ?? '').trim();
  } catch {
    extra = t.trim().slice(0, 160);
  }
  return extra ? `HTTP ${st} · ${extra.slice(0, 220)}` : `HTTP ${st}`;
}

/**
 * 对当前供应商 Anthropic 根发起最小 `POST .../v1/messages`（max_tokens=1），用于批量试模型 ID（如 glm-4.7 / glm-5）。
 * 鉴权：`claudeUseAuthToken !== false` 时先试 Bearer，401 再试 `x-api-key`。
 */
export async function probeAnthropicModelId(
  id: ProviderId,
  entry: ProviderEntry,
  modelId: string,
  lang: WizardLang,
): Promise<{ ok: boolean; detail: string }> {
  const base = effectiveClaudeBase(id, entry);
  if (!base) {
    return { ok: false, detail: lang === 'zh' ? '无 Anthropic Base' : 'No Anthropic base' };
  }
  const key = entry.api_key?.trim();
  if (!key) {
    return { ok: false, detail: lang === 'zh' ? '无 API Key' : 'No API key' };
  }
  const meta = PROVIDERS[id];
  const url = `${base.replace(/\/$/, '')}/v1/messages`;
  const body = JSON.stringify({
    model: modelId.trim(),
    max_tokens: 1,
    messages: [{ role: 'user', content: 'ping' }],
  });
  const baseHeaders: Record<string, string> = {
    'content-type': 'application/json',
    'anthropic-version': '2023-06-01',
    'User-Agent': UA,
  };
  const useBearer = meta.claudeUseAuthToken !== false;
  const headersBearer: Record<string, string> = {
    ...baseHeaders,
    authorization: `Bearer ${key}`,
  };
  const headersApiKey: Record<string, string> = {
    ...baseHeaders,
    'x-api-key': key,
  };
  const initialHeaders = useBearer ? headersBearer : headersApiKey;

  try {
    let res = await fetch(url, {
      method: 'POST',
      headers: initialHeaders,
      body,
      signal: AbortSignal.timeout(MODEL_PROBE_TIMEOUT_MS),
    });
    if (res.status === 401 && useBearer) {
      res = await fetch(url, {
        method: 'POST',
        headers: headersApiKey,
        body,
        signal: AbortSignal.timeout(MODEL_PROBE_TIMEOUT_MS),
      });
    }
    if (res.ok) {
      return { ok: true, detail: `HTTP ${res.status}` };
    }
    return { ok: false, detail: await anthropicProbeErrorDetail(res) };
  } catch (e) {
    const msg = e instanceof Error ? e.message : String(e);
    return { ok: false, detail: msg };
  }
}

/** 使用当前默认供应商对多个 `model` 依次探测（不写回配置）。 */
export async function runModelProbesForActiveProvider(
  cfg: ConfigFile,
  modelIds: string[],
  lang: WizardLang,
): Promise<ModelProbeRow[]> {
  const active = cfg.active_provider;
  const entry = active ? cfg.providers[active] : undefined;
  const baseOk = Boolean(active && entry?.api_key?.trim() && effectiveClaudeBase(active, entry));
  const skip = wizardCopy(lang).check.tryModelsNoActive;
  if (!baseOk) {
    return modelIds.map((model) => ({ model, ok: false, detail: skip }));
  }
  const out: ModelProbeRow[] = [];
  for (const model of modelIds) {
    const r = await probeAnthropicModelId(active!, entry!, model, lang);
    out.push({ model, ...r });
  }
  return out;
}

function resolveCheckLang(cfg: ConfigFile, override?: WizardLang): WizardLang {
  return override ?? cfg.wizard_lang ?? 'zh';
}

export type ModelProbeRow = { model: string; ok: boolean; detail: string };

export type CheckReportJson = {
  providers_with_keys: ProviderId[];
  active_provider: ProviderId | null;
  active_has_key: boolean;
  claude_base: string | null;
  probe: { url: string; ok: boolean; detail: string } | null;
  can_build_claude_env: boolean;
  settings_sync: ClaudeSettingsEnvCompare['kind'];
  drift_keys?: string[];
  settings_path: string;
  /** 使用 --try-models 时附带 */
  model_probes?: ModelProbeRow[];
};

/** 单次健康检查的诊断结果（供向导等根据结果分支） */
export type CheckGathered = {
  withKey: ProviderId[];
  active: ProviderId | null;
  entry: ProviderEntry | undefined;
  claudeBase: string | undefined;
  probeResult: { ok: boolean; detail: string } | null;
  probeUrlUsed: string | null;
  canBuildClaude: boolean;
  sync: ClaudeSettingsEnvCompare;
  /** 已由 ora 展示探测过程，精简输出中避免重复长 detail */
  probeShownBySpinner: boolean;
};

export async function gatherCheckDiagnostics(
  cfg: ConfigFile,
  lang: WizardLang,
  opts?: { probeSpinner?: boolean },
): Promise<CheckGathered> {
  const c = wizardCopy(lang).check;
  const withKey = PROVIDER_IDS.filter((id) => cfg.providers[id]?.api_key?.trim());
  const active = cfg.active_provider ?? null;
  const entry = active ? cfg.providers[active] : undefined;
  const claudeBase = active ? effectiveClaudeBase(active, entry) : undefined;
  let probeResult: { ok: boolean; detail: string } | null = null;
  let probeUrlUsed: string | null = null;
  let probeShownBySpinner = false;
  if (claudeBase) {
    probeUrlUsed = claudeBase;
    if (opts?.probeSpinner) {
      probeShownBySpinner = true;
      const spinner = ora({ text: c.probeSpinner, spinner: 'dots' }).start();
      probeResult = await probeUrl(claudeBase, lang);
      if (probeResult.ok) {
        spinner.succeed(probeResult.detail);
      } else {
        spinner.fail(probeResult.detail);
      }
    } else {
      probeResult = await probeUrl(claudeBase, lang);
    }
  }
  let canBuildClaude = false;
  if (claudeBase && active && entry?.api_key?.trim()) {
    try {
      buildClaudeEnv(active, entry);
      canBuildClaude = true;
    } catch {
      /* keep false */
    }
  }
  const sync = compareClaudeSettingsEnvWithConfig(cfg);
  return {
    withKey,
    active,
    entry,
    claudeBase,
    probeResult,
    probeUrlUsed,
    canBuildClaude,
    sync,
    probeShownBySpinner,
  };
}

export function toJsonReport(d: CheckGathered): CheckReportJson {
  return {
    providers_with_keys: d.withKey,
    active_provider: d.active,
    active_has_key: Boolean(d.active && d.entry?.api_key?.trim()),
    claude_base: d.claudeBase ?? null,
    probe:
      d.probeUrlUsed && d.probeResult
        ? { url: d.probeUrlUsed, ok: d.probeResult.ok, detail: d.probeResult.detail }
        : null,
    can_build_claude_env: d.canBuildClaude,
    settings_sync: d.sync.kind,
    drift_keys: d.sync.kind === 'drift' ? d.sync.keys : undefined,
    settings_path: claudeSettingsPath(),
  };
}

function printSettingsSyncBlock(lang: WizardLang, sync: ClaudeSettingsEnvCompare): void {
  const c = wizardCopy(lang).check;
  console.log(chalk.bold(c.settingsSyncTitle));
  switch (sync.kind) {
    case 'aligned':
      console.log(chalk.green(c.settingsSyncAligned));
      console.log(chalk.dim(c.settingsSyncFootnote));
      break;
    case 'drift':
      console.log(
        chalk.yellow(
          tpl(c.settingsSyncDriftTpl, {
            KEYS: sync.keys.join(lang === 'zh' ? '、' : ', '),
          }),
        ),
      );
      console.log(chalk.dim(c.settingsSyncFootnote));
      break;
    case 'no_file':
      console.log(chalk.yellow(c.settingsSyncNoFile));
      break;
    case 'unreadable':
      console.log(chalk.red(c.settingsSyncUnreadable));
      break;
    case 'skipped':
      console.log(chalk.dim(c.settingsSyncSkipped));
      break;
    default:
      break;
  }
}

export function formatSettingsSyncSummary(
  lang: WizardLang,
  sync: ClaudeSettingsEnvCompare,
): { text: string; variant: 'green' | 'yellow' | 'red' | 'dim' } | undefined {
  const c = wizardCopy(lang).check;
  switch (sync.kind) {
    case 'aligned':
      return { text: c.settingsSyncAligned.replace(/^✓\s*/, '').trim(), variant: 'green' };
    case 'drift':
      return {
        text: tpl(c.settingsSyncDriftTpl, { KEYS: sync.keys.join(lang === 'zh' ? '、' : ', ') }),
        variant: 'yellow',
      };
    case 'no_file':
      return { text: c.settingsSyncNoFile.replace(/^○\s*/, '').trim(), variant: 'yellow' };
    case 'unreadable':
      return { text: c.settingsSyncUnreadable.replace(/^✗\s*/, '').trim(), variant: 'red' };
    case 'skipped':
      return { text: c.settingsSyncSkipped.replace(/^○\s*/, '').trim(), variant: 'dim' };
    default:
      return undefined;
  }
}

function formatCompactSyncPart(lang: WizardLang, sync: ClaudeSettingsEnvCompare): string {
  const c = wizardCopy(lang).check;
  switch (sync.kind) {
    case 'aligned':
      return chalk.green(c.settingsSyncAlignedCompact);
    case 'drift':
      return chalk.yellow(
        tpl(c.settingsSyncDriftCompactTpl, {
          KEYS: sync.keys.join(lang === 'zh' ? '、' : ', '),
        }),
      );
    case 'no_file':
      return chalk.yellow(c.settingsSyncNoFileCompact);
    case 'unreadable':
      return chalk.red(c.settingsSyncUnreadableCompact);
    case 'skipped':
      return chalk.dim(c.settingsSyncSkippedCompact);
    default:
      return '';
  }
}

function printClaudeHelp(
  cfg: ConfigFile,
  hasActiveKey: boolean,
  canApply: boolean,
  lang: WizardLang,
): void {
  const c = wizardCopy(lang).check;
  console.log(chalk.bold(c.startTitle));
  const active = cfg.active_provider;
  const entry = active ? cfg.providers[active] : undefined;

  if (!hasActiveKey || !active || !entry?.api_key?.trim()) {
    console.log(chalk.cyan(c.startNeedKey));
    console.log(chalk.dim(c.startDoc));
    console.log(chalk.dim(c.startCheck));
    return;
  }

  if (canApply) {
    console.log(
      chalk.cyan(`${c.startApply1}${claudeSettingsPath()}${c.startApply2}${chalk.bold('claude-helper claude apply')}`),
    );
    console.log(
      chalk.cyan(
        `2) ${lang === 'zh' ? '在终端启动 Claude Code（若已安装 CLI）：' : 'Start Claude Code in terminal (if CLI installed):'}\n   ${chalk.bold('claude')}`,
      ),
    );
    console.log(chalk.dim(c.startApplyNote));
    return;
  }

  console.log(
    chalk.yellow(
      tpl(c.startFixTpl, {
        ID: active,
      }),
    ),
  );
  console.log(chalk.dim(c.startReadme));
}

function printClaudeHelpCompact(
  cfg: ConfigFile,
  hasActiveKey: boolean,
  canApply: boolean,
  lang: WizardLang,
): void {
  const c = wizardCopy(lang).check;
  const active = cfg.active_provider;
  const entry = active ? cfg.providers[active] : undefined;

  if (!hasActiveKey || !active || !entry?.api_key?.trim()) {
    console.log(chalk.cyan(c.compactHelpNeedKey));
    return;
  }

  if (canApply) {
    console.log(chalk.cyan(c.compactHelpApply));
    return;
  }

  console.log(chalk.yellow(tpl(c.compactHelpFix, { ID: String(active) })));
}

async function validatePrintCompact(cfg: ConfigFile, lang: WizardLang, d: CheckGathered): Promise<void> {
  const c = wizardCopy(lang).check;
  const gap = async () => sleep(CHECK_COMPACT_GAP_MS);

  console.log(chalk.bold(c.titleCompact));
  await gap();

  if (d.withKey.length === 0) {
    console.log(chalk.yellow(c.noKeys));
    printClaudeHelpCompact(cfg, false, false, lang);
    return;
  }

  console.log(chalk.green(`${c.savedWithKey}${d.withKey.join(lang === 'zh' ? '、' : ', ')}`));
  await gap();

  if (!d.active) {
    console.log(chalk.yellow(c.noActive));
    printClaudeHelpCompact(cfg, false, false, lang);
    return;
  }

  if (!d.entry?.api_key?.trim()) {
    console.log(
      chalk.yellow(
        tpl(c.activeNoKeyTpl, {
          LABEL: PROVIDERS[d.active].label,
          ID: d.active,
        }),
      ),
    );
    printClaudeHelpCompact(cfg, false, false, lang);
    return;
  }

  const activePart = `${PROVIDERS[d.active].label} (${d.active})`;

  let probePart: string;
  if (d.claudeBase && d.probeResult) {
    if (d.probeShownBySpinner) {
      probePart = d.probeResult.ok
        ? chalk.green(lang === 'zh' ? '端点 OK' : 'Endpoint OK')
        : chalk.red(lang === 'zh' ? '端点失败' : 'Endpoint failed');
    } else {
      const mark = d.probeResult.ok ? chalk.green('✓') : chalk.red('✗');
      probePart = `${mark} ${d.probeResult.detail}`;
    }
  } else {
    probePart = chalk.yellow(tpl(c.noAnthropicBaseTpl, { ID: d.active }));
  }

  let envPart = '';
  if (d.claudeBase) {
    envPart = d.canBuildClaude
      ? chalk.green(lang === 'zh' ? 'env OK' : 'env OK')
      : chalk.red(lang === 'zh' ? 'env 失败' : 'env fail');
  }

  const syncPart = formatCompactSyncPart(lang, d.sync);

  console.log(
    chalk.dim('  ') +
      chalk.cyan(activePart) +
      chalk.dim(' · ') +
      probePart +
      (envPart ? chalk.dim(' · ') + envPart : '') +
      (syncPart ? chalk.dim(' · ') + syncPart : ''),
  );

  if (d.claudeBase && d.probeResult && !d.probeResult.ok) {
    console.log(chalk.dim(c.proxyHint));
  }

  await gap();
  printClaudeHelpCompact(cfg, true, d.canBuildClaude, lang);
}

export type ValidateAfterSaveOptions = {
  json?: boolean;
  ui?: 'default' | 'check';
  verbose?: boolean;
};

/**
 * 保存配置后自动调用：结构检查 + 默认供应商端点探测 + settings 对齐 + 启动 Claude 提示。
 * `--json` 时返回 `undefined`；否则返回本次诊断 `CheckGathered`（供向导根据结果给出下一步）。
 */
export async function validateAfterSave(
  cfg: ConfigFile,
  langOverride?: WizardLang,
  options?: ValidateAfterSaveOptions,
): Promise<CheckGathered | undefined> {
  const lang = resolveCheckLang(cfg, langOverride);
  const c = wizardCopy(lang).check;
  const probeSpinner = options?.ui === 'check' && !options?.json;
  const d = await gatherCheckDiagnostics(cfg, lang, { probeSpinner });

  if (options?.json) {
    console.log(JSON.stringify(toJsonReport(d), null, 2));
    return undefined;
  }

  const compact = options?.ui === 'check' && !options?.verbose;
  if (compact) {
    await validatePrintCompact(cfg, lang, d);
    return d;
  }

  console.log(chalk.bold(c.title));

  if (d.withKey.length === 0) {
    console.log(chalk.yellow(c.noKeys));
    printClaudeHelp(cfg, false, false, lang);
    return d;
  }

  console.log(chalk.green(`${c.savedWithKey}${d.withKey.join(lang === 'zh' ? '、' : ', ')}`));

  if (!d.active) {
    console.log(chalk.yellow(c.noActive));
    printClaudeHelp(cfg, false, false, lang);
    return d;
  }

  if (!d.entry?.api_key?.trim()) {
    console.log(
      chalk.yellow(
        tpl(c.activeNoKeyTpl, {
          LABEL: PROVIDERS[d.active].label,
          ID: d.active,
        }),
      ),
    );
    printClaudeHelp(cfg, false, false, lang);
    return d;
  }

  if (d.claudeBase && d.probeResult) {
    const mark = d.probeResult.ok ? chalk.green('✓') : chalk.red('✗');
    console.log(`${mark}${c.probeClaudeTitle}\n    ${d.claudeBase}\n    ${d.probeResult.detail}`);
    if (!d.probeResult.ok) {
      console.log(chalk.dim(c.proxyHint));
    }
  } else {
    console.log(
      chalk.yellow(
        tpl(c.noAnthropicBaseTpl, {
          ID: d.active,
        }),
      ),
    );
  }

  if (d.claudeBase) {
    if (d.canBuildClaude) {
      console.log(chalk.green(c.canBuildEnv));
    } else {
      console.log(chalk.red(c.cannotBuildEnv));
    }
  }

  printSettingsSyncBlock(lang, d.sync);
  printClaudeHelp(cfg, true, d.canBuildClaude, lang);
  return d;
}
