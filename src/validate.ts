import chalk from 'chalk';
import { PROVIDERS, PROVIDER_IDS, type ProviderId } from './providers.js';
import { buildClaudeEnv, claudeSettingsPath, effectiveClaudeBase } from './claude.js';
import type { ConfigFile } from './store.js';
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

/**
 * 保存配置后自动调用：结构检查 + 默认供应商端点探测 + 启动 Claude 提示
 */
export async function validateAfterSave(cfg: ConfigFile, langOverride?: WizardLang): Promise<void> {
  const lang = resolveCheckLang(cfg, langOverride);
  const c = wizardCopy(lang).check;

  console.log(chalk.bold(c.title));

  const withKey = PROVIDER_IDS.filter((id) => cfg.providers[id]?.api_key?.trim());
  if (withKey.length === 0) {
    console.log(chalk.yellow(c.noKeys));
    printClaudeHelp(cfg, false, false, lang);
    return;
  }

  console.log(chalk.green(`${c.savedWithKey}${withKey.join(lang === 'zh' ? '、' : ', ')}`));

  const active = cfg.active_provider;
  if (!active) {
    console.log(chalk.yellow(c.noActive));
    printClaudeHelp(cfg, false, false, lang);
    return;
  }

  const entry = cfg.providers[active];
  if (!entry?.api_key?.trim()) {
    console.log(
      chalk.yellow(
        tpl(c.activeNoKeyTpl, {
          LABEL: PROVIDERS[active].label,
          ID: active,
        }),
      ),
    );
    printClaudeHelp(cfg, false, false, lang);
    return;
  }

  const claudeBase = effectiveClaudeBase(active, entry);

  let anyNetFail = false;
  const probes: Promise<void>[] = [];

  if (claudeBase) {
    probes.push(
      probeUrl(claudeBase, lang).then((r) => {
        if (!r.ok) anyNetFail = true;
        const mark = r.ok ? chalk.green('✓') : chalk.red('✗');
        console.log(`${mark}${c.probeClaudeTitle}\n    ${claudeBase}\n    ${r.detail}`);
      }),
    );
  } else {
    console.log(
      chalk.yellow(
        tpl(c.noAnthropicBaseTpl, {
          ID: active,
        }),
      ),
    );
  }

  await Promise.all(probes);
  if (anyNetFail) {
    console.log(chalk.dim(c.proxyHint));
  }

  let canBuildClaude = false;
  if (claudeBase) {
    try {
      buildClaudeEnv(active, entry);
      canBuildClaude = true;
      console.log(chalk.green(c.canBuildEnv));
    } catch {
      console.log(chalk.red(c.cannotBuildEnv));
    }
  }

  printClaudeHelp(cfg, true, canBuildClaude, lang);
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
