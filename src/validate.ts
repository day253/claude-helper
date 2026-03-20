import chalk from 'chalk';
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
const UA = 'claude-helper/check';

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

function resolveCheckLang(cfg: ConfigFile, override?: WizardLang): WizardLang {
  return override ?? cfg.wizard_lang ?? 'zh';
}

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
};

type Gathered = {
  withKey: ProviderId[];
  active: ProviderId | null;
  entry: ProviderEntry | undefined;
  claudeBase: string | undefined;
  probeResult: { ok: boolean; detail: string } | null;
  probeUrlUsed: string | null;
  canBuildClaude: boolean;
  sync: ClaudeSettingsEnvCompare;
};

async function gatherCheckDiagnostics(cfg: ConfigFile, lang: WizardLang): Promise<Gathered> {
  const withKey = PROVIDER_IDS.filter((id) => cfg.providers[id]?.api_key?.trim());
  const active = cfg.active_provider ?? null;
  const entry = active ? cfg.providers[active] : undefined;
  const claudeBase = active ? effectiveClaudeBase(active, entry) : undefined;
  let probeResult: { ok: boolean; detail: string } | null = null;
  let probeUrlUsed: string | null = null;
  if (claudeBase) {
    probeUrlUsed = claudeBase;
    probeResult = await probeUrl(claudeBase, lang);
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
  };
}

function toJsonReport(d: Gathered): CheckReportJson {
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

/**
 * 保存配置后自动调用：结构检查 + 默认供应商端点探测 + settings 对齐 + 启动 Claude 提示
 */
export async function validateAfterSave(
  cfg: ConfigFile,
  langOverride?: WizardLang,
  options?: { json?: boolean },
): Promise<void> {
  const lang = resolveCheckLang(cfg, langOverride);
  const c = wizardCopy(lang).check;
  const d = await gatherCheckDiagnostics(cfg, lang);

  if (options?.json) {
    console.log(JSON.stringify(toJsonReport(d), null, 2));
    return;
  }

  console.log(chalk.bold(c.title));

  if (d.withKey.length === 0) {
    console.log(chalk.yellow(c.noKeys));
    printClaudeHelp(cfg, false, false, lang);
    return;
  }

  console.log(chalk.green(`${c.savedWithKey}${d.withKey.join(lang === 'zh' ? '、' : ', ')}`));

  if (!d.active) {
    console.log(chalk.yellow(c.noActive));
    printClaudeHelp(cfg, false, false, lang);
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
    printClaudeHelp(cfg, false, false, lang);
    return;
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
