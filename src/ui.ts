import chalk from 'chalk';

const INNER = 57;

function padLine(s: string): string {
  const t = s.length > INNER ? `${s.slice(0, INNER - 1)}…` : s;
  return `║ ${t.padEnd(INNER)} ║`;
}

/** 顶部大标题（对齐 coding-helper 的 box） */
export function printWizardBanner(title: string, subtitle?: string): void {
  const top = `╔${'═'.repeat(INNER + 2)}╗`;
  const bot = `╚${'═'.repeat(INNER + 2)}╝`;
  console.log(chalk.cyan(top));
  console.log(chalk.cyan.bold(padLine(` ${title.trim()} `)));
  if (subtitle) console.log(chalk.cyan(padLine(subtitle)));
  console.log(chalk.cyan(bot));
}

/** 开场说明：先讲清「能做什么 / 不能做什么」，降低心智负担 */
export function printWizardIntro(): void {
  console.log(chalk.bold('\n本向导会帮你'));
  console.log('  · 把 API Key 存在本机（~/.llm-providers/config.yaml）');
  console.log('  · 可选：把当前默认厂家**同步进** Claude Code（~/.claude/settings.json）');
  console.log(chalk.bold('\n和官方「一键安装助手」的区别'));
  console.log(
    '  · 官方 ' +
      chalk.cyan('npx @z_ai/coding-helper') +
      '：装 CLI、多工具（OpenCode / Crush…）、MCP、插件市场等',
  );
  console.log('  · 本工具：只做 **Key + 检查 + 同步 Claude Code**，更轻、步骤更少');
}

export interface WizardStatusSummary {
  activeId: string | null;
  activeLabel: string | null;
  keyMasked: string;
}

/** 主菜单前展示「当前配置」，与 coding-helper 的 Configuration 区块同理 */
export function printWizardStatus(s: WizardStatusSummary): void {
  console.log(chalk.bold('\n当前配置'));
  if (s.activeId && s.activeLabel) {
    console.log(`  默认供应商：${s.activeLabel}（${chalk.cyan(s.activeId)}）`);
  } else {
    console.log(`  默认供应商：${chalk.yellow('尚未选择')}（建议先执行「配置 API Key」）`);
  }
  console.log(`  API Key：${s.keyMasked}`);
  console.log(chalk.dim('  └ 未执行「同步」时，Claude Code 可能仍用旧 settings 或环境变量'));
}

export function printSection(title: string): void {
  console.log(chalk.bold(`\n── ${title} ──`));
}

/** 统一操作说明，避免每屏重复多段提示 */
export function printOperationHint(): void {
  console.log(chalk.dim('\n操作：↑↓ 移动高亮  ·  Enter 确认\n'));
}

export function printClaudeGlobalWarning(): void {
  console.log(
    chalk.yellow(
      '⚠️  注意：即将修改 Claude Code 的**用户级**配置（~/.claude/settings.json），**所有文件夹**里的 Claude 都会受影响。',
    ),
  );
  console.log(chalk.dim('   已有文件会先自动备份为 settings.json.bak.<时间戳>\n'));
}

export function printConfigSyncSummary(params: {
  providerLabel: string;
  providerId: string;
  keyMasked: string;
  claudeBase: string;
}): void {
  const { providerLabel, providerId, keyMasked, claudeBase } = params;
  console.log(chalk.bold('\n┌ Claude Helper（本地已保存）'));
  console.log(`│  厂家：${providerLabel}（${providerId}）`);
  console.log(`│  Key： ${keyMasked}`);
  console.log(chalk.bold('└ Claude Code（下次「同步」时将写入）'));
  console.log(`   Anthropic 根：${claudeBase}`);
  console.log(
    chalk.green(
      '\n✅ 已写入本地。若要让终端里的 claude 用上这家，请在下一步选「同步到 Claude Code」。',
    ),
  );
}

export function printClaudeDoneHint(): void {
  console.log(
    chalk.cyan.bold('\n接下来在终端里'),
    chalk.dim('（建议在项目根目录新开一个终端）\n'),
  );
  console.log(`  ${chalk.bold('claude')}`, chalk.dim('  ← 启动 Claude Code'));
  console.log(chalk.dim('  若提示未安装：npm install -g @anthropic-ai/claude-code\n'));
}
