#!/usr/bin/env node
import { Command } from 'commander';
import inquirer from 'inquirer';
import chalk from 'chalk';
import {
  PROVIDERS,
  PROVIDER_IDS,
  PROVIDER_IDS_WIZARD,
  isProviderId,
  type ProviderId,
} from './providers.js';
import {
  buildClaudeEnv,
  claudeEnvKeysToRemove,
  claudeSettingsPath,
  compareClaudeSettingsEnvWithConfig,
  effectiveClaudeBase,
  effectiveOpenAIBase,
  mergeClaudeSettings,
} from './claude.js';
import terminalLink from 'terminal-link';
import { formatSettingsSyncSummary, validateAfterSave } from './validate.js';
import {
  configPath,
  loadConfig,
  maskKey,
  saveConfig,
  type ConfigFile,
  type ProviderEntry,
} from './store.js';
import {
  printClaudeDoneHint,
  printClaudeGlobalWarning,
  printConfigSyncSummary,
  printOperationHint,
  printSection,
  printWizardBanner,
  printWizardHints,
  printWizardIntro,
  printWizardStatus,
  type WizardStatusSummary,
} from './ui.js';
import { PKG_VERSION } from './version.js';
import {
  inferWizardLangDefault,
  maskKeyWizard,
  tpl,
  type WizardCopy,
  type WizardLang,
  wizardCopy,
} from './wizard-locale.js';
const PROVIDER_ARG = PROVIDER_IDS.join(' | ');

/** 列表 prompt 前展示 💡 操作提示（对齐 coding-helper） */
async function promptWithHints<T>(s: WizardCopy, questions: Parameters<typeof inquirer.prompt>[0]): Promise<T> {
  printWizardHints(s);
  return inquirer.prompt(questions) as Promise<T>;
}

function langChoiceLabel(code: WizardLang, marked: WizardLang, s: WizardCopy): string {
  const label = code === 'zh' ? wizardCopy('zh').langZh : wizardCopy('en').langEn;
  if (code === marked) return `${label}${chalk.green(` ✓ (${s.currentActiveParen})`)}`;
  return label;
}

/** 无任何已保存 Key 且未设默认供应商时视为首次向导（短路径直进配置） */
function isFirstRunWizard(cfg: ConfigFile): boolean {
  const hasAnyKey = PROVIDER_IDS.some((id) => cfg.providers[id]?.api_key?.trim());
  if (hasAnyKey) return false;
  return cfg.active_provider == null;
}

function wizardLangFromCfg(cfg: ConfigFile): WizardLang {
  return cfg.wizard_lang ?? 'zh';
}

/** 首次或未设置 wizard_lang 时选择并写入配置 */
async function promptWizardLangAndSave(cfg: ConfigFile): Promise<ConfigFile> {
  const suggested = inferWizardLangDefault();
  const hint = wizardCopy(suggested);
  const { lang } = await promptWithHints<{ lang: WizardLang }>(hint, [
    {
      type: 'list',
      name: 'lang',
      message: hint.langPickTitle,
      default: suggested,
      choices: [
        { name: langChoiceLabel('zh', suggested, hint), value: 'zh' as const },
        { name: langChoiceLabel('en', suggested, hint), value: 'en' as const },
      ],
    },
  ]);
  const next = { ...cfg, wizard_lang: lang };
  saveConfig(next);
  return next;
}

function resolveProvider(p: string | undefined, cfg: ConfigFile): ProviderId | undefined {
  if (p && isProviderId(p)) return p;
  if (cfg.active_provider) return cfg.active_provider;
  return undefined;
}

function printMissingClaudeBase(id: ProviderId, lang: WizardLang = 'zh'): void {
  const meta = PROVIDERS[id];
  const s = wizardCopy(lang);
  console.error(
    chalk.red(
      `${meta.label}（${id}${s.errorMissingBase}\n${s.errorMissingBaseHint}${id} --anthropic-base <URL>`,
    ),
  );
}

async function cmdList(): Promise<void> {
  const cfg = loadConfig();
  console.log(chalk.dim(`配置文件: ${configPath()}\n`));
  for (const id of PROVIDER_IDS) {
    const meta = PROVIDERS[id];
    const e = cfg.providers[id];
    const active = cfg.active_provider === id ? chalk.green(' [active]') : '';
    const claudeBase = effectiveClaudeBase(id, e) ?? '(未设置，见 claude apply 说明)';
    console.log(
      `${chalk.bold(meta.label)} (${id})${active}\n` +
        `  openai base:    ${effectiveOpenAIBase(id, e)}\n` +
        `  claude base:    ${claudeBase}\n` +
        `  key:            ${maskKey(e?.api_key)}\n` +
        `  model:          ${e?.default_model ?? '(未设置)'}\n`,
    );
  }
}

async function cmdShow(id: ProviderId): Promise<void> {
  const cfg = loadConfig();
  const e = cfg.providers[id];
  const meta = PROVIDERS[id];
  console.log(chalk.bold(meta.label));
  console.log(`  base_url:            ${effectiveOpenAIBase(id, e)}`);
  console.log(`  anthropic_base_url:  ${e?.anthropic_base_url ?? '(未设置)'}`);
  console.log(`  api_key:             ${maskKey(e?.api_key)}`);
  console.log(`  default_model:       ${e?.default_model ?? ''}`);
  console.log(`  note:                ${e?.note ?? ''}`);
}

/** 写入 Claude settings 前：用列表选择，↑↓ + Enter，避免输入 y/n */
async function promptWriteSettingsConfirm(message: string, s: WizardCopy): Promise<boolean> {
  const { ok } = await promptWithHints<{ ok: boolean }>(s, [
    {
      type: 'list',
      name: 'ok',
      message,
      default: true,
      choices: [
        { name: s.writeConfirmYes, value: true },
        { name: s.writeConfirmNo, value: false },
      ],
    },
  ]);
  return ok;
}

async function promptSet(
  id: ProviderId,
  cfg: ConfigFile,
  options?: { sectionTitle?: string; s?: WizardCopy },
): Promise<ConfigFile> {
  const s = options?.s ?? wizardCopy(cfg.wizard_lang ?? 'zh');
  const meta = PROVIDERS[id];
  const cur = cfg.providers[id] ?? {};
  if (options?.sectionTitle) printSection(options.sectionTitle);
  console.log(chalk.cyan.bold(meta.label));
  console.log(chalk.cyan(meta.keyHelp));
  if (meta.docs) {
    const url = meta.docs;
    const link = terminalLink(url, url, { fallback: (t: string) => t });
    console.log(chalk.cyan(`${s.docsLabel} ${link}`));
  }
  const answers = await (options?.sectionTitle
    ? promptWithHints(s, [
        {
          type: 'password',
          name: 'api_key',
          message: s.pwdWizard,
          mask: '*',
          default: cur.api_key ?? '',
        },
      ])
    : inquirer.prompt([
        {
          type: 'password',
          name: 'api_key',
          message: s.pwdPlain,
          mask: '*',
          default: cur.api_key ?? '',
        },
      ]));
  const next: ProviderEntry = {
    ...cur,
    api_key: answers.api_key?.trim() ? answers.api_key.trim() : cur.api_key,
  };
  const providers = { ...cfg.providers, [id]: next };
  return { ...cfg, providers };
}

async function cmdSet(
  id: ProviderId,
  opts: {
    key?: string;
    base?: string;
    model?: string;
    note?: string;
    anthropicBase?: string;
    interactive?: boolean;
  },
): Promise<void> {
  let cfg = loadConfig();
  const cur = cfg.providers[id] ?? {};

  const hasCliField =
    opts.key !== undefined ||
    opts.base !== undefined ||
    opts.model !== undefined ||
    opts.note !== undefined ||
    opts.anthropicBase !== undefined;

  if (opts.interactive || !hasCliField) {
    cfg = await promptSet(id, cfg);
  } else {
    const next: ProviderEntry = {
      ...cur,
      api_key: opts.key !== undefined ? opts.key.trim() || undefined : cur.api_key,
      base_url: opts.base !== undefined ? opts.base.trim() || undefined : cur.base_url,
      anthropic_base_url:
        opts.anthropicBase !== undefined ? opts.anthropicBase.trim() || undefined : cur.anthropic_base_url,
      default_model: opts.model !== undefined ? opts.model.trim() || undefined : cur.default_model,
      note: opts.note !== undefined ? opts.note.trim() || undefined : cur.note,
    };
    cfg = { ...cfg, providers: { ...cfg.providers, [id]: next } };
  }

  saveConfig(cfg);
  console.log(chalk.green(`已保存 ${PROVIDERS[id].label} 配置`));
  await validateAfterSave(loadConfig());
}

async function cmdUnset(id: ProviderId, field?: string): Promise<void> {
  const cfg = loadConfig();
  const cur = cfg.providers[id];
  if (!cur) {
    console.log(chalk.yellow('该供应商尚无配置'));
    return;
  }
  if (!field) {
    const { [id]: _, ...restProviders } = cfg.providers;
    const next: ConfigFile = { ...cfg, providers: restProviders };
    if (next.active_provider === id) delete next.active_provider;
    saveConfig(next);
    console.log(chalk.green(`已删除 ${id} 全部字段`));
    return;
  }
  const next = { ...cur };
  if (field === 'api_key') delete next.api_key;
  else if (field === 'base_url') delete next.base_url;
  else if (field === 'anthropic_base_url') delete next.anthropic_base_url;
  else if (field === 'default_model') delete next.default_model;
  else if (field === 'note') delete next.note;
  else {
    console.error(
      chalk.red('field 必须是 api_key | base_url | anthropic_base_url | default_model | note'),
    );
    process.exit(1);
  }
  saveConfig({ ...cfg, providers: { ...cfg.providers, [id]: next } });
  console.log(chalk.green(`已清除 ${id}.${field}`));
}

async function cmdActive(id: ProviderId | undefined): Promise<void> {
  const cfg = loadConfig();
  if (!id) {
    console.log(cfg.active_provider ?? '(未设置默认供应商)');
    return;
  }
  saveConfig({ ...cfg, active_provider: id });
  console.log(chalk.green(`默认供应商已设为 ${PROVIDERS[id].label}`));
  await validateAfterSave(loadConfig());
}

async function cmdCheck(opts?: { json?: boolean }): Promise<void> {
  await validateAfterSave(loadConfig(), undefined, { json: opts?.json });
}

function cmdExport(provider: ProviderId | undefined, format: 'shell' | 'json'): void {
  const cfg = loadConfig();
  const id = resolveProvider(provider, cfg);
  if (!id) {
    console.error(chalk.red('请指定供应商，或先执行: claude-helper active <provider>'));
    process.exit(1);
  }
  const e = cfg.providers[id];
  if (!e?.api_key) {
    console.error(chalk.red(`${id} 未配置 api_key`));
    process.exit(1);
  }
  const base = effectiveOpenAIBase(id, e);
  const model = e.default_model ?? '';

  if (format === 'json') {
    console.log(
      JSON.stringify(
        {
          provider: id,
          OPENAI_API_KEY: e.api_key,
          OPENAI_BASE_URL: base,
          OPENAI_MODEL: model || undefined,
        },
        null,
        2,
      ),
    );
    return;
  }

  console.log(`export OPENAI_API_KEY=${shellQuote(e.api_key)}`);
  console.log(`export OPENAI_BASE_URL=${shellQuote(base)}`);
  if (model) console.log(`export OPENAI_MODEL=${shellQuote(model)}`);
  console.log(chalk.dim('\n# 当前 shell 中执行: eval "$(claude-helper export -p ' + id + ')"'));
}

function cmdClaudeExport(provider: ProviderId | undefined): void {
  const cfg = loadConfig();
  const id = resolveProvider(provider, cfg);
  if (!id) {
    console.error(chalk.red('请指定供应商，或先执行: claude-helper active <provider>'));
    process.exit(1);
  }
  const e = cfg.providers[id];
  if (!e?.api_key) {
    console.error(chalk.red(`${id} 未配置 api_key`));
    process.exit(1);
  }
  const wlang = wizardLangFromCfg(cfg);
  if (!effectiveClaudeBase(id, e)) {
    printMissingClaudeBase(id, wlang);
    process.exit(1);
  }
  let env: Record<string, string>;
  try {
    env = buildClaudeEnv(id, e);
  } catch (err) {
    if (err instanceof Error && err.message === 'MISSING_ANTHROPIC_BASE') {
      printMissingClaudeBase(id, wlang);
      process.exit(1);
    }
    throw err;
  }
  for (const [k, v] of Object.entries(env)) {
    console.log(`export ${k}=${shellQuote(v)}`);
  }
  const ws = wizardCopy(wlang);
  console.log(
    chalk.dim(
      tpl(ws.claudeExportAlsoTpl, {
        EXTRA: id ? ` -p ${id}` : '',
        PATH: claudeSettingsPath(),
      }),
    ),
  );
}

function cmdClaudeApply(provider: ProviderId | undefined): void {
  const cfg = loadConfig();
  const id = resolveProvider(provider, cfg);
  if (!id) {
    console.error(chalk.red('请指定供应商，或先执行: claude-helper active <provider>'));
    process.exit(1);
  }
  const e = cfg.providers[id];
  if (!e?.api_key) {
    console.error(chalk.red(`${id} 未配置 api_key`));
    process.exit(1);
  }
  const wlang = wizardLangFromCfg(cfg);
  if (!effectiveClaudeBase(id, e)) {
    printMissingClaudeBase(id, wlang);
    process.exit(1);
  }
  let env: Record<string, string>;
  try {
    env = buildClaudeEnv(id, e);
  } catch (err) {
    if (err instanceof Error && err.message === 'MISSING_ANTHROPIC_BASE') {
      printMissingClaudeBase(id, wlang);
      process.exit(1);
    }
    throw err;
  }
  const removeKeys = claudeEnvKeysToRemove(id, e);
  try {
    mergeClaudeSettings(env, removeKeys);
  } catch (err) {
    console.error(chalk.red(err instanceof Error ? err.message : String(err)));
    process.exit(1);
  }
  const ws = wizardCopy(wlang);
  console.log(chalk.green(tpl(ws.claudeApplyMergedTpl, { PATH: claudeSettingsPath() })));
}

function shellQuote(s: string): string {
  return `'${s.replace(/'/g, `'\\''`)}'`;
}

/** 无参 / init 时列表默认选中的供应商（回车即可） */
const INIT_DEFAULT_PROVIDER: ProviderId = 'glm';

function wizardStatusFromCfg(cfg: ConfigFile, lang: WizardLang): WizardStatusSummary {
  const id = cfg.active_provider ?? null;
  const entry = id ? cfg.providers[id] : undefined;
  const syncCmp = compareClaudeSettingsEnvWithConfig(cfg);
  const settingsSync = formatSettingsSyncSummary(lang, syncCmp);
  return {
    activeId: id,
    activeLabel: id ? PROVIDERS[id].label : null,
    keyMasked: maskKeyWizard(entry?.api_key, lang),
    settingsSync,
  };
}

async function wizardConfigureFlow(): Promise<void> {
  const lang = wizardLangFromCfg(loadConfig());
  const s = wizardCopy(lang);

  printSection(s.sectionConfigure);
  console.log(chalk.dim(`${s.savePathPrefix}${configPath()}`));

  const { provider } = await promptWithHints<{ provider: ProviderId | '__back' }>(s, [
    {
      type: 'list',
      name: 'provider',
      message: s.step1Provider,
      default: INIT_DEFAULT_PROVIDER,
      pageSize: 18,
      choices: [
        ...PROVIDER_IDS_WIZARD.map((id) => ({
          name: `>  ${PROVIDERS[id].label}（${id}）`,
          value: id,
        })),
        new inquirer.Separator(' ────────────── '),
        { name: s.backToMenu, value: '__back' as const },
      ],
    },
  ]);

  if (provider === '__back') return;

  const id = provider as ProviderId;
  let cfg = loadConfig();
  cfg = await promptSet(id, cfg, { sectionTitle: s.step2Key, s });
  cfg = { ...cfg, active_provider: id };
  saveConfig(cfg);

  const entry = cfg.providers[id]!;
  const claudeBase =
    effectiveClaudeBase(id, entry) ?? (lang === 'zh' ? '(未解析)' : '(unresolved)');
  printConfigSyncSummary(s, {
    providerLabel: PROVIDERS[id].label,
    providerId: id,
    keyMasked: maskKeyWizard(entry.api_key, lang),
    claudeBase,
  });

  await validateAfterSave(loadConfig());

  for (;;) {
    printSection(s.sectionNext);
    const { step } = await promptWithHints<{ step: 'apply' | 'hint' | 'menu' }>(s, [
      {
        type: 'list',
        name: 'step',
        message: s.choosePrompt,
        choices: [
          {
            name: s.nextSync,
            value: 'apply',
          },
          { name: s.nextHint, value: 'hint' },
          new inquirer.Separator(' ────────────── '),
          { name: s.nextBackMenu, value: 'menu' },
        ],
      },
    ]);

    if (step === 'menu') break;
    if (step === 'hint') {
      printClaudeDoneHint(s);
      continue;
    }
    if (step === 'apply') {
      if (!effectiveClaudeBase(id, entry)) {
        printMissingClaudeBase(id, lang);
        continue;
      }
      printClaudeGlobalWarning(s);
      const ok = await promptWriteSettingsConfirm(s.confirmWrite, s);
      if (!ok) {
        console.log(chalk.dim(s.cancelled));
        continue;
      }
      cmdClaudeApply(id);
      console.log(chalk.green(s.applyOkLong));
      printClaudeDoneHint(s);
      break;
    }
  }
}

/** 无参 / init：交互主菜单（引导结构参考 @z_ai/coding-helper：先说明、再状态、再选项） */
async function runSetupWizard(): Promise<void> {
  for (;;) {
    let cfg = loadConfig();
    if (!cfg.wizard_lang) {
      cfg = await promptWizardLangAndSave(cfg);
    }
    const lang = wizardLangFromCfg(cfg);
    const s = wizardCopy(lang);

    if (isFirstRunWizard(cfg)) {
      printSection(s.firstRunTitle);
      console.log(chalk.dim(s.firstRunBody));
      await wizardConfigureFlow();
      continue;
    }

    console.log();
    printWizardBanner(s);
    printWizardIntro(s);
    printWizardStatus(s, wizardStatusFromCfg(cfg, lang));
    printOperationHint(s);

    const { action } = await promptWithHints<{
      action: 'configure' | 'apply' | 'check' | 'language' | 'exit';
    }>(s, [
      {
        type: 'list',
        name: 'action',
        message: s.menuPrompt,
        pageSize: 14,
        choices: [
          { name: s.menuConfigure, value: 'configure' },
          { name: s.menuApply, value: 'apply' },
          { name: s.menuCheck, value: 'check' },
          { name: s.menuLanguage, value: 'language' },
          new inquirer.Separator(' ────────────── '),
          { name: s.menuExit, value: 'exit' },
        ],
      },
    ]);

    if (action === 'exit') {
      console.log(chalk.dim(s.goodbyeLong));
      return;
    }

    if (action === 'language') {
      const { lang: next } = await promptWithHints<{ lang: WizardLang }>(s, [
        {
          type: 'list',
          name: 'lang',
          message: s.promptChangeLang,
          default: lang,
          choices: [
            { name: langChoiceLabel('zh', lang, s), value: 'zh' as const },
            { name: langChoiceLabel('en', lang, s), value: 'en' as const },
          ],
        },
      ]);
      saveConfig({ ...loadConfig(), wizard_lang: next });
      continue;
    }

    if (action === 'check') {
      printSection(s.sectionChecking);
      await validateAfterSave(loadConfig());
      printOperationHint(s);
      const { afterCheck } = await promptWithHints<{ afterCheck: 'menu' | 'exit' }>(s, [
        {
          type: 'list',
          name: 'afterCheck',
          message: s.afterCheckPrompt,
          choices: [
            { name: s.backMenu, value: 'menu' },
            { name: s.exitWizard, value: 'exit' },
          ],
        },
      ]);
      if (afterCheck === 'exit') {
        console.log(chalk.dim(s.goodbye));
        return;
      }
      continue;
    }

    if (action === 'apply') {
      cfg = loadConfig();
      const id = cfg.active_provider;
      if (!id || !cfg.providers[id]?.api_key?.trim()) {
        console.log(chalk.yellow(s.applyBlocked));
        continue;
      }
      const applyLang = wizardLangFromCfg(cfg);
      const sApply = wizardCopy(applyLang);
      printClaudeGlobalWarning(sApply);
      const ok = await promptWriteSettingsConfirm(sApply.confirmWriteShort, sApply);
      if (!ok) {
        console.log(chalk.dim(`${sApply.cancelled}\n`));
        continue;
      }
      cmdClaudeApply(undefined);
      console.log(chalk.green(sApply.applyOk));
      printClaudeDoneHint(sApply);
      printOperationHint(sApply);
      const { afterApply } = await promptWithHints<{ afterApply: 'menu' | 'exit' }>(sApply, [
        {
          type: 'list',
          name: 'afterApply',
          message: sApply.afterApplyPrompt,
          choices: [
            { name: sApply.backMenu, value: 'menu' },
            { name: sApply.exitWizard, value: 'exit' },
          ],
        },
      ]);
      if (afterApply === 'exit') {
        console.log(chalk.dim(sApply.goodbye));
        return;
      }
      continue;
    }

    await wizardConfigureFlow();
  }
}

async function cmdInit(): Promise<void> {
  await runSetupWizard();
}

const program = new Command();
program
  .name('claude-helper')
  .description('Claude Helper：多供应商 API Key、网络检查与 Claude Code 配置')
  .version(PKG_VERSION);

program
  .command('check')
  .description('检查已保存的 Key / 默认供应商，并探测端点网络；提示如何启动 Claude Code')
  .option('--json', '以 JSON 输出结果（便于脚本）', false)
  .action((opts: { json: boolean }) => cmdCheck({ json: opts.json }).catch(fatal));

program
  .command('doctor')
  .description('同 check：健康检查（兼容 chelper doctor 习惯）')
  .option('--json', '以 JSON 输出结果（便于脚本）', false)
  .action((opts: { json: boolean }) => cmdCheck({ json: opts.json }).catch(fatal));

program
  .command('list')
  .description('列出所有供应商配置（密钥脱敏）')
  .action(() => cmdList().catch(fatal));

program
  .command('show')
  .argument('<provider>', PROVIDER_ARG)
  .description('查看单个供应商')
  .action((p: string) => {
    if (!isProviderId(p)) {
      console.error(chalk.red('未知供应商'));
      process.exit(1);
    }
    cmdShow(p).catch(fatal);
  });

program
  .command('set')
  .argument('<provider>', PROVIDER_ARG)
  .option('-i, --interactive', '强制进入交互（仅填写 API Key）', false)
  .option('--key <key>', 'API Key')
  .option('--base <url>', 'OpenAI 兼容 Base URL')
  .option('--anthropic-base <url>', 'Claude Code 用 Anthropic 兼容网关根 URL（如 LiteLLM）')
  .option('--model <id>', '默认模型')
  .option('--note <text>', '备注')
  .description('写入/更新供应商配置（无 flag 时交互只问 API Key）')
  .action((p: string, opts) => {
    if (!isProviderId(p)) {
      console.error(chalk.red('未知供应商'));
      process.exit(1);
    }
    cmdSet(p, {
      interactive: opts.interactive,
      key: opts.key,
      base: opts.base,
      anthropicBase: opts.anthropicBase,
      model: opts.model,
      note: opts.note,
    }).catch(fatal);
  });

program
  .command('unset')
  .argument('<provider>', '供应商 id')
  .argument(
    '[field]',
    'api_key | base_url | anthropic_base_url | default_model | note；省略则删除该供应商全部配置',
  )
  .description('清除配置项')
  .action((p: string, field?: string) => {
    if (!isProviderId(p)) {
      console.error(chalk.red('未知供应商'));
      process.exit(1);
    }
    cmdUnset(p, field).catch(fatal);
  });

program
  .command('active')
  .argument('[provider]', `${PROVIDER_ARG}；省略则打印当前默认`)
  .description('设置或查看默认供应商')
  .action((p?: string) => {
    if (p === undefined) {
      cmdActive(undefined).catch(fatal);
      return;
    }
    if (!isProviderId(p)) {
      console.error(chalk.red('未知供应商'));
      process.exit(1);
    }
    cmdActive(p).catch(fatal);
  });

program
  .command('export')
  .option('-p, --provider <id>', '供应商（省略则用 active）')
  .option('-f, --format <shell|json>', '输出格式', 'shell')
  .description('导出 OPENAI_* 环境变量（LiteLLM / OpenAI SDK 等）')
  .action((opts: { provider?: string; format: string }) => {
    const fmt = opts.format === 'json' ? 'json' : 'shell';
    const pid = opts.provider;
    if (pid && !isProviderId(pid)) {
      console.error(chalk.red('未知供应商'));
      process.exit(1);
    }
    cmdExport(pid as ProviderId | undefined, fmt);
  });

const claudeCmd = program.command('claude').description('Claude Code：ANTHROPIC_* 导出或写入 settings.json');

claudeCmd
  .command('export')
  .option('-p, --provider <id>', '供应商（省略则用 active）')
  .description('打印可 eval 的 export ANTHROPIC_* 语句')
  .action((opts: { provider?: string }) => {
    const pid = opts.provider;
    if (pid && !isProviderId(pid)) {
      console.error(chalk.red('未知供应商'));
      process.exit(1);
    }
    cmdClaudeExport(pid as ProviderId | undefined);
  });

claudeCmd
  .command('apply')
  .option('-p, --provider <id>', '供应商（省略则用 active）')
  .description('合并 env 到 ~/.claude/settings.json（写入前备份）')
  .action((opts: { provider?: string }) => {
    const pid = opts.provider;
    if (pid && !isProviderId(pid)) {
      console.error(chalk.red('未知供应商'));
      process.exit(1);
    }
    cmdClaudeApply(pid as ProviderId | undefined);
  });

program
  .command('init')
  .description('交互主菜单：配置 Key / 写入 Claude Code / 检查（与无参运行 claude-helper 相同）')
  .action(() => cmdInit().catch(fatal));

function fatal(e: unknown): void {
  console.error(e instanceof Error ? e.message : e);
  process.exit(1);
}

const argvRest = process.argv.slice(2);
const topLevelCommands = new Set([
  'check',
  'doctor',
  'list',
  'show',
  'set',
  'unset',
  'active',
  'export',
  'init',
  'claude',
  'help',
]);
/** 无子命令：直接 `claude-helper`；开发时 `tsx src/cli.ts` 仅多一个脚本路径 */
function shouldRunDefaultInit(): boolean {
  if (argvRest.length === 0) return true;
  if (argvRest.length === 1) {
    const x = argvRest[0];
    if (x.startsWith('-')) return false;
    if (topLevelCommands.has(x)) return false;
    return true;
  }
  return false;
}

if (shouldRunDefaultInit()) {
  runSetupWizard().catch(fatal);
} else {
  program.parse(process.argv);
}
