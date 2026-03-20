/** 交互向导语言（写入 ~/.llm-providers/config.yaml 的 wizard_lang） */
export type WizardLang = 'zh' | 'en';

export function parseWizardLang(v: unknown): WizardLang | undefined {
  if (v === 'zh' || v === 'en') return v;
  return undefined;
}

export function inferWizardLangDefault(): WizardLang {
  const lc = (process.env.LC_ALL ?? process.env.LANG ?? '').toLowerCase();
  if (lc.startsWith('zh')) return 'zh';
  if (lc.startsWith('en')) return 'en';
  return 'zh';
}

export function maskKeyWizard(key: string | undefined, lang: WizardLang): string {
  if (!key) return lang === 'zh' ? '(未设置)' : '(not set)';
  if (key.length <= 8) return '****';
  return `${key.slice(0, 4)}…${key.slice(-4)}`;
}

export type CheckCopy = {
  title: string;
  noKeys: string;
  savedWithKey: string;
  noActive: string;
  activeNoKeyTpl: string;
  probeClaudeTitle: string;
  noAnthropicBaseTpl: string;
  proxyHint: string;
  canBuildEnv: string;
  cannotBuildEnv: string;
  startTitle: string;
  startNeedKey: string;
  startDoc: string;
  startCheck: string;
  startApply1: string;
  startApply2: string;
  startApplyNote: string;
  startFixTpl: string;
  startReadme: string;
};

export type WizardCopy = {
  langPickTitle: string;
  langZh: string;
  langEn: string;
  bannerTitle: string;
  bannerSubtitle: string;
  introTitle: string;
  introLine1: string;
  introLine2: string;
  introVs: string;
  introOfficial: string;
  introThisTool: string;
  statusTitle: string;
  statusDefault: string;
  statusNotChosen: string;
  statusSuggest: string;
  statusApiKey: string;
  statusFootnote: string;
  opHint: string;
  warnClaudeGlobal1: string;
  warnClaudeGlobal2: string;
  syncLocalHeader: string;
  syncVendor: string;
  syncKey: string;
  syncClaudeHeader: string;
  syncAnthropicRoot: string;
  syncDone: string;
  doneTitle: string;
  doneOpenTerminal: string;
  doneRun: string;
  doneInstall: string;
  docsLabel: string;
  menuPrompt: string;
  menuConfigure: string;
  menuApply: string;
  menuCheck: string;
  menuLanguage: string;
  menuExit: string;
  goodbyeLong: string;
  goodbye: string;
  sectionChecking: string;
  afterCheckPrompt: string;
  backMenu: string;
  exitWizard: string;
  applyBlocked: string;
  confirmWrite: string;
  confirmWriteShort: string;
  /** 写入 settings 前 list 选项（勿用 y/n，↑↓ + Enter） */
  writeConfirmYes: string;
  writeConfirmNo: string;
  cancelled: string;
  applyOk: string;
  afterApplyPrompt: string;
  sectionConfigure: string;
  savePathPrefix: string;
  step1Provider: string;
  backToMenu: string;
  step2Key: string;
  pwdWizard: string;
  pwdPlain: string;
  sectionNext: string;
  choosePrompt: string;
  nextSync: string;
  nextHint: string;
  nextBackMenu: string;
  applyOkLong: string;
  errorMissingBase: string;
  errorMissingBaseHint: string;
  promptChangeLang: string;
  /** $PATH */
  claudeApplyMergedTpl: string;
  /** $EXTRA = optional ` -p id`, $PATH = settings path */
  claudeExportAlsoTpl: string;
  check: CheckCopy;
};

const zh: WizardCopy = {
  langPickTitle: '选择引导语言 / Choose guide language',
  langZh: '简体中文',
  langEn: 'English',
  bannerTitle: 'Claude Helper',
  bannerSubtitle: '配置向导',
  introTitle: '本向导会帮你',
  introLine1: '  · 把 API Key 存在本机（~/.llm-providers/config.yaml）',
  introLine2: '  · 可选：把当前默认厂家**同步进** Claude Code（~/.claude/settings.json）',
  introVs: '和官方「一键安装助手」的区别',
  introOfficial:
    '  · 官方 npx @z_ai/coding-helper：装 CLI、多工具（OpenCode / Crush…）、MCP、插件市场等',
  introThisTool: '  · 本工具：只做 **Key + 检查 + 同步 Claude Code**，更轻、步骤更少',
  statusTitle: '当前配置',
  statusDefault: '默认供应商：',
  statusNotChosen: '尚未选择',
  statusSuggest: '（建议先执行「① 配置 API Key」）',
  statusApiKey: 'API Key：',
  statusFootnote: '  └ 未执行「同步」时，Claude Code 可能仍用旧 settings 或环境变量',
  opHint: '\n操作：↑↓ 移动高亮  ·  Enter 确认\n',
  warnClaudeGlobal1:
    '⚠️  注意：即将修改 Claude Code 的**用户级**配置（~/.claude/settings.json），**所有文件夹**里的 Claude 都会受影响。',
  warnClaudeGlobal2: '   已有文件会先自动备份为 settings.json.bak.<时间戳>\n',
  syncLocalHeader: '┌ Claude Helper（本地已保存）',
  syncVendor: '│  厂家：',
  syncKey: '│  Key： ',
  syncClaudeHeader: '└ Claude Code（下次「同步」时将写入）',
  syncAnthropicRoot: '   Anthropic 根：',
  syncDone:
    '\n✅ 已写入本地。若要让终端里的 claude 用上这家，请在下一步选「同步到 Claude Code」。',
  doneTitle: '\n接下来在终端里',
  doneOpenTerminal: '（建议在项目根目录新开一个终端）\n',
  doneRun: '  ← 启动 Claude Code',
  doneInstall: '  若提示未安装：npm install -g @anthropic-ai/claude-code\n',
  docsLabel: '文档:',
  menuPrompt: '你要做哪一步？',
  menuConfigure: '>  ① 配置 API Key — 选厂家、填密钥，并设为默认',
  menuApply: '>  ② 同步到 Claude Code — 写入全局 settings.json',
  menuCheck: '>  ③ 运行检查 — 网络与配置是否就绪',
  menuLanguage: '>  语言 / Language — 切换中英文引导',
  menuExit: 'x  退出',
  goodbyeLong: '\n再见。需要时可随时再运行：claude-helper 或 claude-helper init\n',
  goodbye: '\n再见。\n',
  sectionChecking: '正在检查',
  afterCheckPrompt: '检查结束，接下来？',
  backMenu: '>  返回主菜单',
  exitWizard: 'x  退出向导',
  applyBlocked: '\n还不能同步：还没有「默认供应商」或没填 API Key。\n请先选上面的 ① 完成配置。\n',
  confirmWrite: '确认写入？（会合并 env，并备份原 settings.json）',
  confirmWriteShort: '确认写入？（合并 env，备份原 settings.json）',
  writeConfirmYes: '>  确认写入',
  writeConfirmNo: '<  取消',
  cancelled: '已取消。',
  applyOk: '\n✅ 已与 Claude Code 对齐。',
  afterApplyPrompt: '还需要别的操作吗？',
  sectionConfigure: '配置 API Key · 共 2 步',
  savePathPrefix: '保存位置：',
  step1Provider: '步骤 1/2：选择厂家（将自动设为「默认供应商」）',
  backToMenu: '<  返回主菜单',
  step2Key: '步骤 2/2：填写 API Key',
  pwdWizard: '请粘贴 API Key（内容会被隐藏；留空并回车 = 保留原密钥）',
  pwdPlain: 'API Key（回车保留原值）',
  sectionNext: '这段做完了，接下来？',
  choosePrompt: '请选择',
  nextSync: '>  同步到 Claude Code — 写入 ~/.claude/settings.json（推荐）',
  nextHint: '>  查看如何在终端里启动 claude',
  nextBackMenu: '<  返回主菜单',
  applyOkLong: '\n✅ 已与 Claude Code 对齐，终端里执行 claude 即可使用当前厂家。',
  errorMissingBase: '）当前无法解析 Claude Code 用的 Anthropic Base（配置异常或需覆盖）。',
  errorMissingBaseHint: '可尝试：claude-helper set ',
  promptChangeLang: '选择引导语言 / Choose guide language',
  claudeApplyMergedTpl: '已合并 env 到 $PATH（已备份原文件）',
  claudeExportAlsoTpl: '\n# 也可写入 Claude Code：claude-helper claude apply$EXTRA\n# 配置文件：$PATH',
  check: {
    title: '\n── 自动检查 ──',
    noKeys: '还没有任何供应商填写 API Key；补全后再运行：claude-helper check',
    savedWithKey: '已保存 Key 的供应商：',
    noActive: '未设置默认供应商。执行：claude-helper active <id>',
    activeNoKeyTpl:
      '默认供应商是「$LABEL」，但未配置 Key；请改 active 或执行：claude-helper set $ID',
    probeClaudeTitle: ' Claude Code（Anthropic 兼容）地址',
    noAnthropicBaseTpl:
      '○ 未能解析 Anthropic Base（配置异常）；可尝试：claude-helper set $ID --anthropic-base <URL>',
    proxyHint:
      '    若需代理，可设置 HTTPS_PROXY（参见 https://docs.z.ai/devpack/extension/coding-tool-helper 排障）',
    canBuildEnv: '✓ 可生成 Claude Code 所需环境变量（网络与 Key 格式层面未再校验厂商鉴权）',
    cannotBuildEnv: '✗ 无法组合出 Claude 环境变量',
    startTitle: '\n── 启动 Claude Code ──',
    startNeedKey:
      '1) 先保存 API Key，并设置默认：claude-helper active <id>（见 claude-helper --help 中的 provider 列表）',
    startDoc: '   说明：https://docs.anthropic.com/en/docs/claude-code/overview',
    startCheck: '   随时复查：claude-helper check\n',
    startApply1: '1) 把环境变量写入本机 Claude 配置（会自动备份已有 ',
    startApply2: '）：\n   ',
    startApplyNote:
      '   官方文档：https://docs.anthropic.com/en/docs/claude-code/overview\n   若只想临时生效当前终端：claude-helper claude export 后 eval 打印的内容\n',
    startFixTpl:
      '无法组合 Claude 环境变量。请检查 Key 与 Base，或尝试：\n   claude-helper set $ID --anthropic-base <Anthropic base URL>\n   claude-helper claude apply\n',
    startReadme: '   详见 README 与 doc/technical-guide-zh.md\n',
  },
};

const en: WizardCopy = {
  langPickTitle: 'Choose guide language / 选择引导语言',
  langZh: '简体中文 (Chinese)',
  langEn: 'English',
  bannerTitle: 'Claude Helper',
  bannerSubtitle: 'Setup wizard',
  introTitle: 'This wizard helps you',
  introLine1: '  · Save API keys locally (~/.llm-providers/config.yaml)',
  introLine2: '  · Optionally sync the default provider into Claude Code (~/.claude/settings.json)',
  introVs: 'Compared to the official Coding Tool Helper',
  introOfficial:
    '  · Official npx @z_ai/coding-helper: installs CLI, OpenCode/Crush/…, MCP, plugin marketplace, etc.',
  introThisTool: '  · This tool: **keys + health check + Claude Code sync only** — fewer steps',
  statusTitle: 'Current configuration',
  statusDefault: 'Default provider: ',
  statusNotChosen: 'Not set',
  statusSuggest: '(complete step ① first)',
  statusApiKey: 'API Key: ',
  statusFootnote: '  └ Until you sync, Claude Code may still use old settings or env vars',
  opHint: '\nTip: ↑↓ to move  ·  Enter to confirm\n',
  warnClaudeGlobal1:
    '⚠️  You are about to change **user-level** Claude Code config (~/.claude/settings.json). All workspaces are affected.',
  warnClaudeGlobal2: '   An existing file will be backed up as settings.json.bak.<timestamp>\n',
  syncLocalHeader: '┌ Claude Helper (saved locally)',
  syncVendor: '│  Provider: ',
  syncKey: '│  Key: ',
  syncClaudeHeader: '└ Claude Code (on next sync)',
  syncAnthropicRoot: '   Anthropic base: ',
  syncDone:
    '\n✅ Saved locally. To use this provider in the terminal, choose “Sync to Claude Code” next.',
  doneTitle: '\nIn your terminal',
  doneOpenTerminal: '(open a new terminal in your project root if possible)\n',
  doneRun: '  ← start Claude Code',
  doneInstall: '  Not installed? npm install -g @anthropic-ai/claude-code\n',
  docsLabel: 'Docs:',
  menuPrompt: 'What would you like to do?',
  menuConfigure: '>  ① Configure API Key — pick provider, enter key, set as default',
  menuApply: '>  ② Sync to Claude Code — write global settings.json',
  menuCheck: '>  ③ Run checks — network & config readiness',
  menuLanguage: '>  Language — switch Chinese / English UI',
  menuExit: 'x  Exit',
  goodbyeLong: '\nBye. Run claude-helper or claude-helper init anytime.\n',
  goodbye: '\nBye.\n',
  sectionChecking: 'Running checks',
  afterCheckPrompt: 'Checks done. What next?',
  backMenu: '>  Back to main menu',
  exitWizard: 'x  Exit wizard',
  applyBlocked:
    '\nCannot sync yet: no default provider or missing API Key.\nComplete step ① first.\n',
  confirmWrite: 'Write merged env to Claude Code config? (backs up existing settings.json)',
  confirmWriteShort: 'Confirm write? (merge env, backup settings.json)',
  writeConfirmYes: '>  Confirm write',
  writeConfirmNo: '<  Cancel',
  cancelled: 'Cancelled.',
  applyOk: '\n✅ Claude Code config updated.',
  afterApplyPrompt: 'Anything else?',
  sectionConfigure: 'Configure API Key · 2 steps',
  savePathPrefix: 'Saved to: ',
  step1Provider: 'Step 1/2: Choose provider (becomes default)',
  backToMenu: '<  Back to main menu',
  step2Key: 'Step 2/2: API Key',
  pwdWizard: 'Paste API Key (hidden; leave empty + Enter to keep current)',
  pwdPlain: 'API Key (Enter to keep)',
  sectionNext: 'Done with this part. Next?',
  choosePrompt: 'Choose',
  nextSync: '>  Sync to Claude Code — write ~/.claude/settings.json (recommended)',
  nextHint: '>  How to start claude in the terminal',
  nextBackMenu: '<  Back to main menu',
  applyOkLong: '\n✅ Synced. Run claude in the terminal to use this provider.',
  errorMissingBase: ') cannot resolve Anthropic base for Claude Code. Fix config or override.',
  errorMissingBaseHint: 'Try: claude-helper set ',
  promptChangeLang: 'Choose guide language / 选择引导语言',
  claudeApplyMergedTpl: 'Merged env into $PATH (previous file backed up)',
  claudeExportAlsoTpl: '\n# Sync to Claude Code: claude-helper claude apply$EXTRA\n# Config file: $PATH',
  check: {
    title: '\n── Health check ──',
    noKeys: 'No API keys saved yet. Add keys, then run: claude-helper check',
    savedWithKey: 'Providers with keys: ',
    noActive: 'No default provider. Run: claude-helper active <id>',
    activeNoKeyTpl:
      'Default provider is “$LABEL” but API Key is missing. Run: claude-helper active <id> or: claude-helper set $ID',
    probeClaudeTitle: ' Claude Code (Anthropic-compatible) URL',
    noAnthropicBaseTpl:
      '○ Could not resolve Anthropic base. Try: claude-helper set $ID --anthropic-base <URL>',
    proxyHint: '    For proxy, set HTTPS_PROXY (see Z.AI / Coding Tool Helper troubleshooting)',
    canBuildEnv: '✓ Can build Claude Code env (vendor auth not verified)',
    cannotBuildEnv: '✗ Cannot build Claude Code env',
    startTitle: '\n── Start Claude Code ──',
    startNeedKey:
      '1) Save API Key and default provider: claude-helper active <id> (see claude-helper --help)',
    startDoc: '   Docs: https://docs.anthropic.com/en/docs/claude-code/overview',
    startCheck: '   Re-check: claude-helper check\n',
    startApply1: '1) Merge env into Claude config (backs up existing ',
    startApply2: '):\n   ',
    startApplyNote:
      '   Docs: https://docs.anthropic.com/en/docs/claude-code/overview\n   Shell only: claude-helper claude export then eval\n',
    startFixTpl:
      'Cannot build Claude env. Check key/base or try:\n   claude-helper set $ID --anthropic-base <URL>\n   claude-helper claude apply\n',
    startReadme: '   See README and doc/technical-guide-zh.md\n',
  },
};

export const WIZARD_LOCALE: Record<WizardLang, WizardCopy> = { zh, en };

export function wizardCopy(lang: WizardLang): WizardCopy {
  return WIZARD_LOCALE[lang];
}

export function tpl(s: string, vars: Record<string, string>): string {
  let o = s;
  for (const [k, v] of Object.entries(vars)) {
    o = o.split(`$${k}`).join(v);
  }
  return o;
}
