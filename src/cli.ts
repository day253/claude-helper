#!/usr/bin/env node
import { Command } from 'commander';
import inquirer from 'inquirer';
import chalk from 'chalk';
import { PROVIDERS, PROVIDER_IDS, isProviderId, type ProviderId } from './providers.js';
import {
  buildClaudeEnv,
  claudeEnvKeysToRemove,
  claudeSettingsPath,
  effectiveClaudeBase,
  effectiveOpenAIBase,
  mergeClaudeSettings,
} from './claude.js';
import { validateAfterSave } from './validate.js';
import {
  configPath,
  loadConfig,
  maskKey,
  saveConfig,
  type ConfigFile,
  type ProviderEntry,
} from './store.js';

const PROVIDER_ARG = `glm | openrouter`;

function resolveProvider(p: string | undefined, cfg: ConfigFile): ProviderId | undefined {
  if (p && isProviderId(p)) return p;
  if (cfg.active_provider) return cfg.active_provider;
  return undefined;
}

function printMissingClaudeBase(id: ProviderId): void {
  const meta = PROVIDERS[id];
  console.error(
    chalk.red(
      `${meta.label}（${id}）当前无法解析 Claude Code 用的 Anthropic Base（配置异常或需覆盖）。\n` +
        `可尝试：claude-helper set ${id} --anthropic-base <正确的 Anthropic 兼容根 URL>`,
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

async function promptSet(id: ProviderId, cfg: ConfigFile): Promise<ConfigFile> {
  const meta = PROVIDERS[id];
  const cur = cfg.providers[id] ?? {};
  console.log(chalk.cyan.bold(`\n${meta.label}`));
  console.log(chalk.cyan(meta.keyHelp));
  if (meta.docs) console.log(chalk.cyan(`文档: ${meta.docs}`));
  const answers = await inquirer.prompt([
    {
      type: 'password',
      name: 'api_key',
      message: 'API Key（回车保留原值）',
      mask: '*',
      default: cur.api_key ?? '',
    },
  ]);
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

async function cmdCheck(): Promise<void> {
  await validateAfterSave(loadConfig());
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
  if (!effectiveClaudeBase(id, e)) {
    printMissingClaudeBase(id);
    process.exit(1);
  }
  let env: Record<string, string>;
  try {
    env = buildClaudeEnv(id, e);
  } catch (err) {
    if (err instanceof Error && err.message === 'MISSING_ANTHROPIC_BASE') {
      printMissingClaudeBase(id);
      process.exit(1);
    }
    throw err;
  }
  for (const [k, v] of Object.entries(env)) {
    console.log(`export ${k}=${shellQuote(v)}`);
  }
  console.log(
    chalk.dim(
      '\n# 也可写入 Claude Code：claude-helper claude apply' +
        (id ? ` -p ${id}` : '') +
        '\n# 配置文件：' +
        claudeSettingsPath(),
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
  if (!effectiveClaudeBase(id, e)) {
    printMissingClaudeBase(id);
    process.exit(1);
  }
  let env: Record<string, string>;
  try {
    env = buildClaudeEnv(id, e);
  } catch (err) {
    if (err instanceof Error && err.message === 'MISSING_ANTHROPIC_BASE') {
      printMissingClaudeBase(id);
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
  console.log(chalk.green(`已合并 env 到 ${claudeSettingsPath()}（已备份原文件）`));
}

function shellQuote(s: string): string {
  return `'${s.replace(/'/g, `'\\''`)}'`;
}

/** 无参 / init 时列表默认选中的供应商（回车即可） */
const INIT_DEFAULT_PROVIDER: ProviderId = 'glm';

async function cmdInit(): Promise<void> {
  console.log(chalk.dim(`配置将写入: ${configPath()}\n`));
  console.log(
    chalk.cyan('两步走：① 选一家供应商 ② 按说明填写该家的 API Key（将自动设为默认供应商）。\n') +
      chalk.dim('补配其它家可再运行本命令，或用：claude-helper set <id>\n'),
  );

  const { provider } = await inquirer.prompt([
    {
      type: 'list',
      name: 'provider',
      message: '第一步：选择要配置的供应商（回车 = 默认第一项）',
      default: INIT_DEFAULT_PROVIDER,
      choices: PROVIDER_IDS.map((id) => ({
        name: `${PROVIDERS[id].label}（${id}）`,
        value: id,
      })),
    },
  ]);

  const id = provider as ProviderId;
  let cfg = loadConfig();
  cfg = await promptSet(id, cfg);
  cfg = { ...cfg, active_provider: id };
  saveConfig(cfg);
  console.log(chalk.green(`\n已设为默认供应商：${PROVIDERS[id].label}。查看：claude-helper list`));
  await validateAfterSave(loadConfig());
}

const program = new Command();
program
  .name('claude-helper')
  .description('Claude Helper：多供应商 API Key、网络检查与 Claude Code 配置')
  .version('0.4.0');

program
  .command('check')
  .description('检查已保存的 Key / 默认供应商，并探测端点网络；提示如何启动 Claude Code')
  .action(() => cmdCheck().catch(fatal));

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
  .description('向导：先选一家供应商，再配置其 API Key（与直接运行 claude-helper 无参相同）')
  .action(() => cmdInit().catch(fatal));

function fatal(e: unknown): void {
  console.error(e instanceof Error ? e.message : e);
  process.exit(1);
}

const argvRest = process.argv.slice(2);
const topLevelCommands = new Set([
  'check',
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
  cmdInit().catch(fatal);
} else {
  program.parse(process.argv);
}
